const fs = require('fs');

const files = [
  'scratch/legazpi-city-tourist-attractions.html',
  'scratch/food-2.html',
  'scratch/activities-2.html',
  'scratch/accomodation-2.html',
  'scratch/travel-2.html',
  'scratch/experience-2.html'
];

files.forEach(file => {
  const html = fs.readFileSync(file, 'utf-8');
  console.log('\n====================================');
  console.log('FILE:', file);

  // Check tables
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  console.log('Tables count:', tables.length);
  tables.forEach((t, i) => {
    console.log(`--- Table ${i + 1} ---`);
    // Print first 5 rows
    const rows = t.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    console.log(`Rows: ${rows.length}`);
    rows.slice(0, 10).forEach(r => {
      const cells = (r.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map(c => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      console.log('  Row:', cells.join(' | '));
    });
  });

  // Check iframes / pdfs / embedpress
  const iframes = html.match(/<iframe[\s\S]*?>/gi) || [];
  console.log('Iframes:', iframes);

  const embedpress = html.match(/<div class="[^"]*embedpress[^"]*"[\s\S]*?<\/div>/gi) || [];
  console.log('Embedpress blocks:', embedpress.length);
  embedpress.forEach(e => console.log('  Embed:', e.substring(0, 300)));

  // Check all links
  const hrefs = (html.match(/href="([^"]+)"/gi) || []).map(h => h.replace(/href="|"$/gi, ''));
  const customLinks = hrefs.filter(h => !h.includes('/wp-content/') && !h.includes('/wp-includes/') && !h.includes('/feed/') && !h.includes('gmpg.org'));
  console.log('Custom links count:', customLinks.length);
  if (customLinks.length <= 10) console.log('Links:', customLinks);
});
