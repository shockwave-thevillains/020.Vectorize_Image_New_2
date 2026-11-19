// bench2.cjs <port> <variants.json> [gambar,...] — bandingkan beberapa varian pengaturan pada set gambar.
// variants.json: { "nama": { ...opsi worker... }, ... }. Tiap gambar memakai bgKey 'none' (tanpa penghapusan latar).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [port, vfile, imgs] = process.argv.slice(2);
  const variants = JSON.parse(fs.readFileSync(vfile, 'utf8'));
  const images = (imgs || 'cyber_art.png,cyber_small.jpg,hotpot.png').split(',');
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`http://localhost:${port}/tools/bench.html?${Date.now()}`);
  await p.waitForFunction(() => window.ready);
  const keep = process.env.SVGDIR;
  if (keep) fs.mkdirSync(keep, { recursive: true });
  console.log('varian'.padEnd(16), 'gambar'.padEnd(16), 'err  edge  bad%   warna bentuk  titik   KB   dtk');
  const sums = {};
  for (const [name, v] of Object.entries(variants)) {
    for (const img of images) {
      const r = await p.evaluate(([img, o]) => window.bench(img, o), [img, Object.assign({ bgKey: 'none' }, v)]);
      if (keep) fs.writeFileSync(`${keep}/${name}.${img.split('.')[0]}.svg`, r.svg);
      console.log(name.padEnd(16), img.padEnd(16), String(r.err).padEnd(5), String(r.edgeErr).padEnd(6), String(r.bad).padEnd(6), String(r.colors).padEnd(5), String(r.shapes).padEnd(6), String(r.nodes).padEnd(7), String(r.kb).padEnd(5), r.sec);
      (sums[name] ||= []).push(r.err);
    }
  }
  console.log('\nrata-rata err:', Object.entries(sums).map(([k, a]) => `${k}=${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)}`).join('  '));
  await b.close();
})();
