#!/usr/bin/env node

/**
 * Cross-platform version bump script for BetterLegazpi.
 *
 * Usage:
 *   node scripts/bump-version.js patch   (default)
 *   node scripts/bump-version.js minor
 *   node scripts/bump-version.js major
 *   node scripts/bump-version.js          (shows current version)
 */

const fs = require('fs');
const path = require('path');

// this script lives at scripts/build/, so the repo root is two levels up
const REPO_ROOT = path.join(__dirname, '..', '..');

const VERSION_FILE = path.join(REPO_ROOT, 'version.json');
const PACKAGE_FILE = path.join(REPO_ROOT, 'package.json');

// Read current version
let versionData;
try {
  versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
} catch (e) {
  console.error('Error: version.json not found or invalid');
  process.exit(1);
}

const bumpType = process.argv[2] || '';

if (!bumpType) {
  console.log('Current version: ' + versionData.version);
  console.log('Usage: node scripts/build/bump-version.js [major|minor|patch]');
  process.exit(0);
}

let major = versionData.major;
let minor = versionData.minor;
let patch = versionData.patch;
const oldVersion = versionData.version;

switch (bumpType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'patch':
    patch++;
    break;
  default:
    console.error('Invalid bump type: ' + bumpType);
    console.error('Use: major, minor, or patch');
    process.exit(1);
}

const newVersion = major + '.' + minor + '.' + patch;
const today = new Date().toISOString().split('T')[0];

console.log('Bumping: ' + oldVersion + ' -> ' + newVersion);

// Update version.json
versionData.version = newVersion;
versionData.major = major;
versionData.minor = minor;
versionData.patch = patch;
versionData.lastUpdated = today;
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');

// Update package.json
try {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
  pkg.version = newVersion;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
} catch (e) {
  console.warn('Warning: Could not update package.json:', e.message);
}

// Update all HTML files — replace the footer "Ver. X.X.X" string.
//
// This used to be a hardcoded directory list that had silently fallen behind
// the site: about/, travel/, and history/ were never in it (their footers
// were never bumped), transparency/ was listed twice, and matching only the
// exact previous version meant a page that had already drifted (e.g. from an
// interrupted build) stayed stuck forever. A recursive walk plus a
// version-shaped pattern (any "Ver. X.Y.Z", not just oldVersion) fixes both:
// every HTML file is covered, and running this once repairs prior drift too.
const HTML_EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'scratch',
  'test-results',
  '.git',
  '.github',
  'admin',
  'react-app',
]);

function collectHtmlFiles(dir, out) {
  out = out || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    if (entry.isDirectory()) {
      if (HTML_EXCLUDED_DIRS.has(entry.name) || entry.name.indexOf('.') === 0) return;
      collectHtmlFiles(path.join(dir, entry.name), out);
      return;
    }
    if (entry.name.endsWith('.html')) out.push(path.join(dir, entry.name));
  });
  return out;
}

let filesUpdated = 0;
const versionPattern = /Ver\. \d+\.\d+\.\d+/g;

collectHtmlFiles(REPO_ROOT).forEach(function (filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content.replace(versionPattern, 'Ver. ' + newVersion);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    filesUpdated++;
  }
});

console.log('Updated ' + filesUpdated + ' HTML file(s)');

// Sync version.json to react-app/public/ (consumed by React Footer at runtime)
var reactPublicVersion = path.join(REPO_ROOT, 'react-app', 'public', 'version.json');
if (fs.existsSync(path.dirname(reactPublicVersion))) {
  fs.copyFileSync(VERSION_FILE, reactPublicVersion);
  console.log('Synced version.json → react-app/public/version.json');
}

// Sync version field in react-app/package.json
var reactPkgFile = path.join(REPO_ROOT, 'react-app', 'package.json');
try {
  if (fs.existsSync(reactPkgFile)) {
    var reactPkg = JSON.parse(fs.readFileSync(reactPkgFile, 'utf8'));
    reactPkg.version = newVersion;
    fs.writeFileSync(reactPkgFile, JSON.stringify(reactPkg, null, 2) + '\n');
    console.log('Synced version → react-app/package.json');
  }
} catch (e) {
  console.warn('Warning: Could not update react-app/package.json:', e.message);
}

// Update the shields.io version badge in README.md. It was hand-maintained and
// drifted (README said 1.1.19 while version.json said 1.1.21); syncing it here
// keeps version.json the single source of truth it claims to be.
try {
  const readmeFile = path.join(REPO_ROOT, 'README.md');
  const readme = fs.readFileSync(readmeFile, 'utf8');
  const updated = readme.replace(
    /(!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-)[0-9]+\.[0-9]+\.[0-9]+(-)/,
    '$1' + newVersion + '$2'
  );
  if (updated !== readme) {
    fs.writeFileSync(readmeFile, updated);
    console.log('Synced version badge → README.md');
  }
} catch (e) {
  console.warn('Warning: Could not update README.md badge:', e.message);
}

console.log('Done! Version is now ' + newVersion);
