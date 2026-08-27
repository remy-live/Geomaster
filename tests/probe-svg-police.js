// L'option « embarquer la police » : proposée, mesurée, et efficace.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  console.log('\n=== la question est posée, même sans instruments ===');
  const modale = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    a.addEntity(new TextLabel(100, 100, 'Bonjour'));   // aucun gras : une seule graisse
    a.activeWidgets = { ruler: false, compass: false, protractor: false, setsquare: false };
    a.requestExport('svg');
    const m = document.getElementById('exportModal');
    const r = { ouverte: m.style.display,
                instruments: document.getElementById('expToolsBlock').style.display,
                police: document.getElementById('expFontBlock').style.display,
                coche: document.getElementById('expPolice').checked,
                taille: document.getElementById('expPoliceTaille').textContent,
                intro: document.getElementById('expIntro').textContent };
    m.style.display = 'none';
    return r;
  });
  console.log('  ' + JSON.stringify(modale));
  ck('la modale s\'ouvre pour un SVG sans instruments', modale.ouverte === 'flex');
  ck('la section instruments est masquée', modale.instruments === 'none');
  ck('la section police est visible et cochée', modale.police !== 'none' && modale.coche === true);
  ck('le poids annoncé est chiffré', /\d+ Ko/.test(modale.taille), modale.taille);
  // sans un seul gras, la moitié suffit : le nombre affiché doit le refléter
  ck('et il correspond à ce que pèse vraiment le fichier',
     parseInt(modale.taille.match(/(\d+) Ko/)[1], 10) < 120, modale.taille);

  console.log('\n=== une figure avec des noms de points : les deux graisses ===');
  const modale2 = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    a.addEntity(new Point(100, 100, 'A'));      // un nom de point est en gras
    a.requestExport('svg');
    const m = document.getElementById('exportModal');
    const r = document.getElementById('expPoliceTaille').textContent;
    m.style.display = 'none';
    return r;
  });
  console.log('  ' + modale2);
  ck('le poids annoncé double', parseInt(modale2.match(/(\d+) Ko/)[1], 10) > 150, modale2);

  console.log('\n=== le fichier produit ===');
  const r = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const p1 = new Point(200, 200, 'A'); a.addEntity(p1);   // les noms sont en gras
    const t = new TextLabel(100, 300, 'Bonjour'); a.addEntity(t);
    const nu = a.generateSVGString(false, 'text');
    const avec = a.embarquerPoliceSVG(nu);
    // sans un seul gras : la moitié du poids doit suffire
    p1.showLabel = false;
    const nuSansGras = a.generateSVGString(false, 'text');
    const avecSansGras = a.embarquerPoliceSVG(nuSansGras);
    return { nu: nu.length, avec: avec.length,
             nuSansGras: nuSansGras.length, avecSansGras: avecSansGras.length,
             deuxFaces: (avec.match(/@font-face/g) || []).length,
             uneFace: (avecSansGras.match(/@font-face/g) || []).length,
             cdata: /<style type="text\/css"><!\[CDATA\[@font-face/.test(avec),
             placeApres: avec.indexOf('<style') < avec.indexOf('<rect') || avec.indexOf('<rect') === -1,
             valide: (() => { try { const d = new DOMParser().parseFromString(avec, 'image/svg+xml');
               return !d.querySelector('parsererror'); } catch (e) { return false; } })() };
  });
  console.log('  ' + JSON.stringify({ ...r, nu: r.nu, avec: r.avec }));
  console.log(`  ${Math.round(r.nu/1024)} Ko → ${Math.round(r.avec/1024)} Ko avec les deux graisses`);
  console.log(`  ${Math.round(r.nuSansGras/1024)} Ko → ${Math.round(r.avecSansGras/1024)} Ko sans le gras`);
  ck('le SVG reste un document XML valide', r.valide === true);
  ck('la règle est en CDATA, juste après la balise racine', r.cdata === true && r.placeApres === true);
  ck('deux graisses quand il y a du gras', r.deuxFaces === 2, r.deuxFaces + '');
  ck('une seule quand il n\'y en a pas', r.uneFace === 1, r.uneFace + '');
  ck('sans gras, le fichier est bien plus léger', r.avecSansGras < r.avec * 0.62,
     `${Math.round(r.avecSansGras/1024)} vs ${Math.round(r.avec/1024)} Ko`);

  console.log('\n=== le SVG embarqué s\'affiche bien dans la bonne police ===');
  const rendu = await page.evaluate(async () => {
    const a = window.app; a.clearCanvas();
    const t = new TextLabel(100, 100, 'Hxg'); t.fontSize = 40; a.addEntity(t);
    const svg = a.generateSVGString(false, 'text');
    const avec = a.embarquerPoliceSVG(svg);
    const racine = svg.match(/^<svg[^>]*>/)[0];
    // entiers : une largeur fractionnaire décalerait la lecture des octets
    const W = Math.ceil(parseFloat(racine.match(/width="([\d.]+)"/)[1]));
    const H = Math.ceil(parseFloat(racine.match(/height="([\d.]+)"/)[1]));
    const mesurer = async (texte) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([texte], { type: 'image/svg+xml' }));
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      const d = x.getImageData(0, 0, W, H).data;
      let g = Infinity, dr = -Infinity;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4;
        if ((d[k]+d[k+1]+d[k+2])/3 < 120 && d[k+3] > 100) { g = Math.min(g, i); dr = Math.max(dr, i); } }
      return (g === Infinity) ? null : Math.round(dr - g);
    };
    /* La boîte d'ENCRE, pas la chasse : le raster mesure du premier au dernier
       pixel noir, alors que measureText().width donne l'avance, approches
       comprises. Comparer les deux ferait croire à un écart qui n'existe pas. */
    a.ctx.save(); a.ctx.font = t.policeMorceau(t.lignesRiches()[0][0]);
    const m = a.ctx.measureText('Hxg');
    const attendu = Math.round(m.actualBoundingBoxRight + m.actualBoundingBoxLeft);
    a.ctx.restore();
    return { sans: await mesurer(svg), avec: await mesurer(avec), canevas: attendu };
  });
  console.log('  largeur d\'encre : sans police ' + rendu.sans + ', avec ' + rendu.avec + ', canevas ' + rendu.canevas);
  ck('sans la police, le rendu diffère du canevas', Math.abs(rendu.sans - rendu.canevas) > 2,
     `${rendu.sans} vs ${rendu.canevas}`);
  ck('avec, il colle au canevas', Math.abs(rendu.avec - rendu.canevas) <= 2,
     `${rendu.avec} vs ${rendu.canevas}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
