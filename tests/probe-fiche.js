// La fiche de construction : les étapes numérotées, chacune avec sa consigne et
// l'image de la figure à cette étape-là, sur une feuille A4 qu'on imprime.
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
  await page.goto(PAGE); await page.waitForTimeout(1400);

  // une médiatrice construite par le logiciel : elle pose ses propres consignes
  const poser = (consignesEnPlus) => page.evaluate(async (consignesEnPlus) => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    app.setTool('segment');
    ev('pointerdown', { x: 300, y: 400 }, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', { x: 300 + 300 * i / 6, y: 400 }, 1);
    ev('pointerup', { x: 600, y: 400 }, 0);
    app.setTool('select');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    app.buildMediatrice(seg, 450, 500, seg.p1, seg.p2);
    await new Promise(r => setTimeout(r, 400));
    app.isPlaying = false; app.isToolAnimating = false; app.isLooping = false;
    const n = app.entities.length;
    for (let k = 0; k < consignesEnPlus; k++)
      app.stepInstructions[Math.round(n * (k + 1) / (consignesEnPlus + 2))] =
        'On reporte la longueur au compas, puis on trace à la règle en passant par les deux points obtenus.';
    app.replayIndex = n;
    app.projectTitle = 'Médiatrice';
    return { etapes: Object.keys(app.stepInstructions).length, objets: n };
  }, consignesEnPlus);

  const sortir = () => page.evaluate(async () => {
    const app = window.app;
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.ficheConstruction();
    URL.createObjectURL = vrai;
    if (!blob) return { err: 'pas de fichier' };
    const buf = new Uint8Array(await blob.arrayBuffer());
    let f = ''; for (let i = 0; i < buf.length; i++) f += String.fromCharCode(buf[i]);
    return { octets: buf.length,
             pages: (f.match(/\/Type\s*\/Page[^s]/g) || []).length,
             format: ((f.match(/\/MediaBox\s*\[([^\]]+)\]/) || [])[1] || '').trim(),
             images: (f.match(/\/Subtype\s*\/Image/g) || []).length,
             // l'état du travail après coup : exporter ne doit rien déplacer
             idx: app.replayIndex, objets: app.entities.length, grille: app.gridMode };
  });

  console.log('\n=== une médiatrice, deux étapes ===');
  const a = await poser(0);
  ck('la construction a posé ses consignes', a.etapes === 2, String(a.etapes));
  const f1 = await sortir();
  console.log('  ' + JSON.stringify(f1));
  ck('une feuille sort', !f1.err && f1.pages === 1, String(f1.pages));
  ck('au format A4 portrait', /595/.test(f1.format) && /841/.test(f1.format), f1.format);
  /* Une image par étape, plus la figure terminée en haut : on sait où l'on va
     avant de partir. */
  ck('deux étapes et la figure terminée : trois images', f1.images === 3, String(f1.images));
  ck('exporter ne déplace pas le travail',
     f1.idx === a.objets && f1.objets === a.objets, `${f1.idx} / ${f1.objets}`);
  ck('le quadrillage est revenu comme il était', f1.grille === 0, String(f1.grille));

  console.log('\n=== neuf étapes : la feuille se tourne ===');
  const c = await poser(7);
  ck('assez de consignes pour déborder', c.etapes >= 8, String(c.etapes));
  const f2 = await sortir();
  console.log('  ' + JSON.stringify(f2));
  ck('plusieurs feuilles', f2.pages >= 2, String(f2.pages));
  ck('une image par étape, plus la figure terminée',
     f2.images === c.etapes + 1, `${f2.images} images pour ${c.etapes} étapes`);

  console.log('\n=== sans consignes, elle le dit ===');
  /* Une fiche sans étapes n'a rien à montrer : autant dire où on les pose
     plutôt que sortir une feuille vide. */
  const vide = await page.evaluate(async () => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    let blob = null; const vrai = URL.createObjectURL;
    URL.createObjectURL = function (x) { if (x instanceof Blob) blob = x; return vrai.call(URL, x); };
    await app.ficheConstruction();
    URL.createObjectURL = vrai;
    const t = document.getElementById('toast-notification');
    return { fichier: !!blob, message: t ? (t.innerText || '').trim() : '' };
  });
  console.log('  ' + JSON.stringify(vide));
  ck('aucun fichier n\'est produit', vide.fichier === false);
  ck('le message dit où poser une consigne', /Étape|consigne/i.test(vide.message), vide.message);

  console.log('\n=== le bouton vit dans la grille des exports ===');
  const bouton = await page.evaluate(() => {
    const el = document.querySelector('[onclick="app.ficheConstruction()"]');
    if (!el) return { la: false };
    const voisins = el.parentElement.querySelectorAll('.icon-btn').length;
    return { la: true, classe: el.className,
             avecPDF: !!el.parentElement.querySelector('[onclick="app.requestExport(\'pdf\')"]'), voisins };
  });
  console.log('  ' + JSON.stringify(bouton));
  ck('il est là, dans la même grille que PDF et SVG', bouton.la && bouton.avecPDF, JSON.stringify(bouton));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
