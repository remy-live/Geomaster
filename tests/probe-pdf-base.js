// Le texte du PDF tombe-t-il là où le canevas le met ?
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

  console.log('\n=== l\'encre du SVG tombe sur l\'encre du canevas ===');
  const r = await page.evaluate(async () => {
    const a = window.app; a.clearCanvas();
    const p1 = new Point(200, 300, 'P'); a.addEntity(p1);
    const p2 = new Point(600, 300, 'Q'); a.addEntity(p2);
    const seg = new Segment(p1, p2); seg.showLength = true; a.addEntity(seg);
    const t = new TextLabel(250, 380, 'Hxg'); t.fontSize = 30; a.addEntity(t);
    a.render();

    const svg = a.generateSVGString(false, 'text');
    const vb = (svg.match(/viewBox="([^"]*)"/)[1]).split(/\s+/).map(Number);
    const W = parseFloat(svg.match(/width="(\d+)"/)[1]), H = parseFloat(svg.match(/height="(\d+)"/)[1]);

    // on rend le SVG dans un canevas hors écran, à l'échelle 1
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
    const x2 = c2.getContext('2d');
    x2.fillStyle = '#fff'; x2.fillRect(0, 0, W, H);
    x2.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);

    // la boîte d'encre d'une bande verticale donnée, dans chaque rendu
    const boite = (ctx, x0, y0, w, h, seuil) => {
      const d = ctx.getImageData(x0, y0, w, h).data;
      let t0 = Infinity, t1 = -Infinity;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const k = (j * w + i) * 4;
        const sombre = (d[k] + d[k+1] + d[k+2]) / 3 < seuil && d[k+3] > 100;
        if (sombre) { t0 = Math.min(t0, j); t1 = Math.max(t1, j); }
      }
      return (t0 === Infinity) ? null : { haut: t0 + y0, bas: t1 + y0 };
    };
    // bande du texte libre : x 250..340 en repère scène
    const zoneS = { x: 250, y: 370, w: 90, h: 60 };
    const cvBox = boite(a.ctx, Math.round(zoneS.x * a.view.zoom + a.view.x),
                        Math.round(zoneS.y * a.view.zoom + a.view.y),
                        zoneS.w, zoneS.h, 120);
    const svgBox = boite(x2, Math.round(zoneS.x - vb[0]), Math.round(zoneS.y - vb[1]), zoneS.w, zoneS.h, 120);
    // remis en repère scène
    const enScene = (bo, dx, dy) => bo ? { haut: bo.haut - dy, bas: bo.bas - dy } : null;
    const cvS = enScene(cvBox, 0, a.view.y);
    const svgS = enScene(svgBox, 0, -vb[1]);

    // bande du nom de point « P » : autour de (200, 300)
    const zoneP = { x: 180, y: 265, w: 44, h: 34 };
    const cvP = boite(a.ctx, Math.round(zoneP.x * a.view.zoom + a.view.x),
                      Math.round(zoneP.y * a.view.zoom + a.view.y), zoneP.w, zoneP.h, 120);
    const svgP = boite(x2, Math.round(zoneP.x - vb[0]), Math.round(zoneP.y - vb[1]), zoneP.w, zoneP.h, 120);
    return {
      texte: { canevas: enScene(cvP && cvS, 0, a.view.y) && cvS, svg: svgS },
      nom: { canevas: cvP && { haut: cvP.haut - a.view.y, bas: cvP.bas - a.view.y },
             svg: svgP && { haut: svgP.haut + vb[1], bas: svgP.bas + vb[1] } },
      decalageHaut: GmBase.decalage(`30px ${t.fontFamily}`, 'top'),
      decalageMilieu: GmBase.decalage(`bold 14px ${window.GM_POLICE_PILE || "Arial"}`, 'middle'),
    };
  });
  console.log('  texte libre : canevas ' + JSON.stringify(r.texte.canevas) + '  svg ' + JSON.stringify(r.texte.svg));
  console.log('  nom de point : canevas ' + JSON.stringify(r.nom.canevas) + '  svg ' + JSON.stringify(r.nom.svg));
  console.log('  décalages mesurés : haut ' + r.decalageHaut.toFixed(2) + '  milieu ' + r.decalageMilieu.toFixed(2));
  ck('le texte libre est à la même hauteur', r.texte.canevas && r.texte.svg
     && Math.abs(r.texte.canevas.haut - r.texte.svg.haut) <= 1,
     `${r.texte.canevas && r.texte.canevas.haut} vs ${r.texte.svg && r.texte.svg.haut}`);
  ck('le nom de point aussi', r.nom.canevas && r.nom.svg
     && Math.abs(r.nom.canevas.haut - r.nom.svg.haut) <= 1,
     `${r.nom.canevas && r.nom.canevas.haut} vs ${r.nom.svg && r.nom.svg.haut}`);

  console.log('\n=== et dans le PDF lui-même ===');
  const pdf = await page.evaluate(async () => {
    const a = window.app;
    window.gmEnsurePdfLibs();
    const svgContent = a.generateSVGString(false, 'text');
    const el = new DOMParser().parseFromString(svgContent, "image/svg+xml").documentElement;
    const w = parseFloat(el.getAttribute('width')), h = parseFloat(el.getAttribute('height'));
    const vb = el.getAttribute('viewBox').split(/\s+/).map(Number);
    const doc = new jspdf.jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "pt", format: [w, h] });
    if (window.gmEnregistrerPolice) window.gmEnregistrerPolice(doc);
    await doc.svg(el, { x: 0, y: 0, width: w, height: h });
    const buf = new Uint8Array(doc.output('arraybuffer'));
    let s = ''; for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return { flux: s, vb };
  });
  const tms = [...pdf.flux.matchAll(/1\. 0\. 0\. -1\. ([\d.]+) ([\d.]+) Tm/g)].map(m => ({ x: +m[1], y: +m[2] }));
  console.log('  lignes de base dans le PDF : ' + JSON.stringify(tms.slice(0, 6)));
  // le texte de 30px est posé à y=380 (haut) : sa base doit être à 380 + décalage
  const baseAttendue = 380 + r.decalageHaut - pdf.vb[1];
  const trouve = tms.find(t => Math.abs(t.y - baseAttendue) < 1);
  ck('la ligne de base du texte est celle du canevas', !!trouve,
     `attendu ${baseAttendue.toFixed(1)}, trouvé ${JSON.stringify(tms.map(t => t.y))}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
