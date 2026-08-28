#!/usr/bin/env node
/**
 * Validate the service category data against the office charters.
 *
 * This exists because of a bug it would have caught: 56 of the 60 deep links on
 * the hand-written category pages pointed at anchors that do not exist in the
 * hubs, so every one silently dropped the reader at the top of the page. Now that
 * those links are generated from service ids, an id that does not exist is a
 * detectable error rather than an invisible one.
 *
 *   node scripts/validate/validate-service-data.js
 *
 * Exits non-zero on any error. Warnings do not fail the run.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

const errors = [];
const warnings = [];

const index = read('data/service-index.json');
const taxonomy = read('data/service-categories.json');
const journeyData = read('data/journeys.json');
const portals = read('data/online-portals.json');

const categoryIds = new Set(taxonomy.categories.map((c) => c.id));

/* Every office a category claims must exist, and its page must be on disk. */
for (const category of taxonomy.categories) {
  // `planned` marks a category whose page is agreed but not yet built (Housing);
  // `deferred` marks one held for a later phase (Health, Education, Utilities).
  // Both are expected to have no page yet, so neither is an error.
  const pageExpected = !category.deferred && !category.planned;
  if (pageExpected && !fs.existsSync(path.join(ROOT, category.route))) {
    errors.push(`category "${category.id}": route ${category.route} does not exist`);
  }
  if (category.planned && fs.existsSync(path.join(ROOT, category.route))) {
    warnings.push(`category "${category.id}": page now exists - drop the "planned" flag`);
  }

  const groupIds = new Set((category.groups || []).map((g) => g.id));
  for (const office of category.offices) {
    if (!index.offices[office.slug]) {
      errors.push(`category "${category.id}": unknown office "${office.slug}"`);
    }
    if (office.group && !groupIds.has(office.group)) {
      errors.push(
        `category "${category.id}": office "${office.slug}" is in group "${office.group}", which the category does not define`
      );
    }
    if (groupIds.size && !office.group) {
      warnings.push(
        `category "${category.id}": office "${office.slug}" has no group, but the category is grouped - it will not render`
      );
    }
    if (!office.description || office.description.length < 20) {
      warnings.push(`category "${category.id}": office "${office.slug}" has a thin description`);
    }
  }
}

/* Journey steps are the anchors. An unknown service id is the old bug returning. */
const seenJourneyIds = new Set();
for (const journey of journeyData.journeys) {
  if (seenJourneyIds.has(journey.id)) errors.push(`duplicate journey id "${journey.id}"`);
  seenJourneyIds.add(journey.id);

  if (!categoryIds.has(journey.category)) {
    errors.push(`journey "${journey.id}": unknown owning category "${journey.category}"`);
  }
  for (const related of journey.relatedCategories || []) {
    if (!categoryIds.has(related)) {
      errors.push(`journey "${journey.id}": unknown related category "${related}"`);
    }
    if (related === journey.category) {
      errors.push(`journey "${journey.id}": lists its own category as related`);
    }
  }

  if (!journey.steps || journey.steps.length < 2) {
    warnings.push(`journey "${journey.id}": fewer than 2 steps - is it a journey?`);
  }

  for (const step of journey.steps || []) {
    const service = index.services[step.service];
    if (!service) {
      errors.push(`journey "${journey.id}": unknown service id "${step.service}"`);
      continue;
    }
    // Crossing offices is the whole point of a journey, so a step outside the
    // owning category's own offices is expected. What matters is that the office
    // appears under *some* category, or the hub it links to is unreachable by
    // browsing and the reader has no way back to it.
    const reachable = taxonomy.categories.some((c) =>
      c.offices.some((o) => o.slug === service.office)
    );
    if (!reachable) {
      warnings.push(
        `journey "${journey.id}": step "${step.service}" belongs to ${service.office}, which no category lists - its hub is unreachable by browsing`
      );
    }
  }
}

/* Portal entries may name a service; if they do, it must be real. */
for (const [slug, entries] of Object.entries(portals.offices)) {
  if (!index.offices[slug]) errors.push(`online-portals: unknown office "${slug}"`);
  for (const entry of entries) {
    if (!portals.kinds[entry.kind]) {
      errors.push(`online-portals: "${entry.title}" has unknown kind "${entry.kind}"`);
    }
    if (entry.service && !index.services[entry.service]) {
      errors.push(`online-portals: "${entry.title}" names unknown service "${entry.service}"`);
    }
    if (entry.kind === 'guide' && !entry.caveat) {
      warnings.push(
        `online-portals: "${entry.title}" is a guide with no caveat - readers will expect a working portal`
      );
    }
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

console.log(
  `\n${taxonomy.categories.length} categories, ${journeyData.journeys.length} journeys, ` +
    `${index.serviceCount} indexed services - ${errors.length} errors, ${warnings.length} warnings`
);

process.exit(errors.length ? 1 : 0);
