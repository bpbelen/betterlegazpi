#!/usr/bin/env node
/**
 * Gate for data/offices/*.json — see ADR 0002.
 *
 * Errors block a production build. Warnings are things a person still has to look at
 * but which do not make the rendered page wrong.
 *
 * ERRORS
 *   - a service that is not `verified: true`            (unless --allow-unverified)
 *   - duplicate or missing service ids
 *   - a step with neither a client action nor an agency action
 *   - a step naming a real person in `personResponsible`
 *   - categories that orphan a service or list one twice
 *   - an entryPoint pointing at a service id that does not exist
 *
 * WARNINGS
 *   - a derived total that disagrees with the charter's own TOTAL row
 *   - a processing time the duration parser could not read
 *   - a service still carrying verifyNotes
 *
 * USAGE
 *   node scripts/validate/validate-office-hubs.js                  # strict (build gate)
 *   node scripts/validate/validate-office-hubs.js --allow-unverified   # dev preview
 *   node scripts/validate/validate-office-hubs.js hrmo cto         # named offices only
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const OFFICES_DIR = path.join(REPO_ROOT, 'data/offices');
const { sumSteps, compareToStated } = require(
  path.join(REPO_ROOT, 'scripts/build/charter-duration.js')
);

function validateOffice(office, { allowUnverified }) {
  const errors = [];
  const warnings = [];
  const at = (svc, msg) => `${office.slug}/${svc?.id ?? '(office)'}: ${msg}`;

  const services = office.charter?.services ?? [];
  if (!services.length) errors.push(at(null, 'no services'));

  // The process table stays generic: it names positions and units, never people.
  // Where a charter does name staff, those names belong in the Office Personnel
  // section only — a citizen following a process should not be sent to an individual
  // who may have moved desks, and a name in a step goes stale the moment they do.
  const staffNames = (office.charter?.personnel ?? []).map((p) => p.name).filter(Boolean);

  const seen = new Set();
  for (const svc of services) {
    if (!svc.id) {
      errors.push(at(svc, 'missing id'));
    } else if (seen.has(svc.id)) {
      errors.push(at(svc, 'duplicate id'));
    } else {
      seen.add(svc.id);
    }

    if (!svc.verified && !allowUnverified) {
      errors.push(at(svc, 'not verified against the source charter'));
    }

    for (const [i, step] of (svc.steps ?? []).entries()) {
      if (!step.client && !step.agency) {
        errors.push(at(svc, `step ${i + 1} has neither a client nor an agency action`));
      }
      const leaked = staffNames.filter((n) => (step.personResponsible ?? '').includes(n));
      if (leaked.length) {
        errors.push(
          at(
            svc,
            `step ${i + 1} names ${leaked.join(', ')} in personResponsible — the process table stays generic; put people in charter.personnel`
          )
        );
      }
    }

    const derived = sumSteps(svc.steps ?? []);
    if (derived.unrecognized.length) {
      warnings.push(
        at(
          svc,
          `unreadable processing time(s): ${derived.unrecognized.map((u) => JSON.stringify(u)).join(', ')}`
        )
      );
    }

    const stated = svc.statedTotals?.processingTime ?? null;
    if (stated) {
      const cmp = compareToStated(derived, stated);
      if (!cmp.agrees) {
        warnings.push(
          at(
            svc,
            `derived total ${cmp.derived} vs charter's ${cmp.stated} (off by ${cmp.deltaText})`
          )
        );
      }
    }

    if (svc.verifyNotes?.length) {
      warnings.push(at(svc, `${svc.verifyNotes.length} open verify note(s)`));
    }
  }

  // Categories must partition the services exactly — no orphans, no duplicates.
  const categories = office.local?.categories ?? [];
  if (categories.length) {
    const listed = [];
    const walk = (nodes, depth) => {
      for (const node of nodes) {
        if (depth > 2)
          errors.push(at(null, `category "${node.title}" nests deeper than two levels`));
        for (const id of node.services ?? []) listed.push(id);
        if (node.subCategories) walk(node.subCategories, depth + 1);
      }
    };
    walk(categories, 1);

    const counts = new Map();
    for (const id of listed) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [id, n] of counts) {
      if (n > 1) errors.push(at(null, `service "${id}" appears in ${n} categories`));
      if (!seen.has(id)) errors.push(at(null, `category references unknown service "${id}"`));
    }
    for (const id of seen) {
      if (!counts.has(id)) errors.push(at(null, `service "${id}" is not in any category`));
    }
  }

  for (const ep of office.local?.entryPoints ?? []) {
    for (const id of ep.services ?? []) {
      if (!seen.has(id)) {
        errors.push(at(null, `entry point "${ep.title}" references unknown service "${id}"`));
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const allowUnverified = args.includes('--allow-unverified');
  const wanted = args.filter((a) => !a.startsWith('--'));

  if (!fs.existsSync(OFFICES_DIR)) {
    console.error(`No such directory: ${path.relative(REPO_ROOT, OFFICES_DIR)}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(OFFICES_DIR)
    .filter((f) => f.endsWith('.json'))
    .filter((f) => !wanted.length || wanted.includes(path.basename(f, '.json')));

  if (!files.length) {
    console.error(
      wanted.length ? `No offices matched: ${wanted.join(', ')}` : 'No office data found.'
    );
    process.exit(1);
  }

  let errors = 0;
  let warnings = 0;

  for (const file of files) {
    const office = JSON.parse(fs.readFileSync(path.join(OFFICES_DIR, file), 'utf8'));
    const result = validateOffice(office, { allowUnverified });
    errors += result.errors.length;
    warnings += result.warnings.length;

    for (const w of result.warnings) console.log(`  warn   ${w}`);
    for (const e of result.errors) console.log(`  ERROR  ${e}`);
  }

  const scope = `${files.length} office${files.length === 1 ? '' : 's'}`;
  console.log(`\n${scope}: ${errors} error(s), ${warnings} warning(s)`);

  if (errors) {
    if (!allowUnverified) {
      console.log('\nAn office does not ship until every one of its services is verified');
      console.log('against the source PDF. Preview unverified work with --allow-unverified.');
    }
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { validateOffice };
