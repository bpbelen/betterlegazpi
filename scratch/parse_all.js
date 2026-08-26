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
  console.log('\n' + '='.repeat(50));
  console.log('FILE:', file);
  console.log('='.repeat(50));

  const cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  const regex = /<div class="elementor-widget-container">([\s\S]*?)<\/div>/gi;
  let match;
  let count = 0;
  while ((match = regex.exec(cleanHtml)) !== null) {
    const raw = match[1];
    const txt = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const imgs = (raw.match(/src="([^"]+)"/g) || []).map(s => s.replace(/src="|"$/g, '').replace(/^src="/, ''));
    
    if (txt.length > 0 || imgs.length > 0) {
      if (!txt.includes('Republic of the Philippines') && 
          !txt.includes('About GOVPH') && 
          !txt.includes('Government Links') &&
          !txt.includes('Executive Order No.') &&
          !txt.includes('Privacy Policy') &&
          !txt.includes('Skip to content')) {
        console.log(`[Item ${++count}]`);
        if (txt) console.log('  Text:', txt);
        if (imgs.length) console.log('  Images:', imgs);
      }
    }
  }
});
