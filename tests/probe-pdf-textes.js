// Tous les textes de l'export tombent-ils sur ceux du canevas ?
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
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  const r = await page.evaluate(async () => {
    const a = window.app; a.clearCanvas();
    const A = new Point(200, 500, 'A'); const B = new Point(600, 500, 'B'); const C = new Point(450, 250, 'C');
    [A, B, C].forEach(p => a.addEntity(p));
    const s1 = new Segment(A, B); s1.showLength = true; a.addEntity(s1);
    a.addEntity(new Segment(B, C)); a.addEntity(new Segment(C, A));
    const ang = new Angle(A, B, C); ang.showValue = true; a.addEntity(ang);
    const t = new TextLabel(230, 620, 'Remarque'); t.fontSize = 22; a.addEntity(t);
    a.render();

    const svg = a.generateSVGString(false, 'text');
    // la balise racine, pas le premier attribut venu : la hauteur d'un motif de
    // hachures se serait glissée à la place de celle de l'image
    const racine = svg.match(/^<svg[^>]*>/)[0];
    const vb = racine.match(/viewBox="([^"]*)"/)[1].split(/\s+/).map(Number);
    const W = parseFloat(racine.match(/width="([\d.]+)"/)[1]);
    const H = parseFloat(racine.match(/height="([\d.]+)"/)[1]);
    // Un SVG chargé en image est un document ISOLÉ : il n'hérite pas de la
    // @font-face de la page et retomberait sur une autre police, ce qui
    // fausserait la comparaison de 2px. On lui donne la même règle.
    const css = Array.from(document.head.querySelectorAll('style'))
      .map(e => e.textContent).find(t => t.indexOf("@font-face") !== -1 && t.indexOf('GeoSans') !== -1) || '';
    const svgPolice = svg.replace('>', '><style>' + css.replace(/&/g, '&amp;') + '</style>');
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgPolice], { type: 'image/svg+xml' }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
    const x2 = c2.getContext('2d'); x2.fillStyle = '#fff'; x2.fillRect(0,0,W,H); x2.drawImage(img,0,0,W,H);
    URL.revokeObjectURL(url);

    const boite = (ctx, x0, y0, w, h) => { const d = ctx.getImageData(x0,y0,w,h).data;
      let t0=Infinity,t1=-Infinity;
      for (let j=0;j<h;j++) for (let i=0;i<w;i++) { const k=(j*w+i)*4;
        if ((d[k]+d[k+1]+d[k+2])/3 < 120 && d[k+3] > 100) { t0=Math.min(t0,j); t1=Math.max(t1,j); } }
      return t0===Infinity?null:{haut:t0+y0,bas:t1+y0}; };
    // une fenêtre en coordonnées SCÈNE, lue dans les deux rendus
    const comparer = (zx, zy, zw, zh) => {
      const cv = boite(a.ctx, Math.round(zx*a.view.zoom+a.view.x), Math.round(zy*a.view.zoom+a.view.y), zw, zh);
      const sv = boite(x2, Math.round(zx-vb[0]), Math.round(zy-vb[1]), zw, zh);
      return { cv: cv && { haut: cv.haut - a.view.y, bas: cv.bas - a.view.y },
               sv: sv && { haut: sv.haut + vb[1], bas: sv.bas + vb[1] } };
    };
    return {
      _info: { vb, W, H, dessine: (() => { const d = x2.getImageData(0,0,W,H).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) if ((d[i]+d[i+1]+d[i+2])/3 < 200) n++; return n; })() },
      nomA: comparer(190, 470, 30, 26),        // « A », au-dessus du point
      longueur: comparer(360, 470, 90, 26),    // la longueur de [AB], sur le segment
      angle: comparer(540, 455, 60, 34),       // la valeur de l'angle en B
      texte: comparer(230, 615, 130, 34),      // le texte libre
    };
  });

  console.log('');
  console.log('  info ' + JSON.stringify(r._info)); delete r._info;
  Object.keys(r).forEach((k) => {
    const z = r[k];
    console.log(`  ${k.padEnd(9)} canevas ${JSON.stringify(z.cv)}  svg ${JSON.stringify(z.sv)}`);
    ck(`${k} : même hauteur d'encre`, z.cv && z.sv && Math.abs(z.cv.haut - z.sv.haut) <= 1,
       z.cv && z.sv ? `écart ${z.cv.haut - z.sv.haut}px` : 'rien trouvé');
  });
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
