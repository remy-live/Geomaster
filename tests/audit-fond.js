// Une figure qui contient de tout, passée par tous les tuyaux.
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
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
  await page.goto(PAGE); await page.waitForTimeout(1800);

  const construire = () => page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const A = new Point(200, 500, 'A'), B = new Point(600, 500, 'B'), C = new Point(400, 200, 'C');
    const O = new Point(800, 400, 'O'), P = new Point(900, 400, 'P');
    [A, B, C, O, P].forEach(p => a.addEntity(p));
    const s1 = new Segment(A, B); s1.showLength = true; s1.coding = 'mark-1'; a.addEntity(s1);
    a.addEntity(new Segment(B, C)); a.addEntity(new Segment(C, A));
    a.addEntity(new Ray(A, C)); a.addEntity(new Line(B, C));
    const ce = new Circle(O, P); ce.fillMode = 'hatch'; ce.opacity = 0.3; a.addEntity(ce);
    const ang = new Angle(A, B, C); ang.showValue = true; ang.arcCount = 2; a.addEntity(ang);
    a.addEntity(new Polygon([A, B, C]));
    a.addEntity(new Arc(O, 60, 0, Math.PI));
    a.addEntity(new CompassArc({ x: 300, y: 700 }, 80, 0, Math.PI / 2, false));
    const t = new TextLabel(150, 700, 'Remarque'); t.fontSize = 20; t.cadre = true;
    t.morceaux = [[{ t: 'Re', g: true, i: false, s: false }, { t: 'marque', g: false, i: true, s: true }]];
    t.text = 'Remarque'; a.addEntity(t);
    const enc = new Annotation(); enc.local = [{ u: 0.4, v: -0.1 }, { u: 0.5, v: -0.2 }, { u: 0.6, v: -0.1 }];
    enc.mode = 'deux'; enc.ancre = s1; a.addEntity(enc);
    a.activeWidgets = { ruler: true, compass: true, protractor: false, setsquare: false };
    a.stepInstructions = { 2: "Trace [AB]." };
    a.projectTitle = 'Audit';
    a.render();
    return a.entities.length;
  });

  const signature = () => page.evaluate(() => {
    const a = window.app;
    const n = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
    return a.entities.map(e => {
      const o = { t: e.constructor.name };
      if (e.x !== undefined) { o.x = n(e.x); o.y = n(e.y); }
      if (e.label) o.l = e.label;
      if (e.text) o.txt = e.text;
      if (e.radius !== undefined) o.r = n(e.radius);
      if (e.showLength) o.sl = 1;
      if (e.coding) o.c = e.coding;
      if (e.fillMode && e.fillMode !== 'none') o.f = e.fillMode;
      if (e.arcCount) o.ac = e.arcCount;
      if (e.cadre) o.cad = 1;
      if (e.morceaux) o.m = JSON.stringify(e.morceaux);
      if (e.local) o.loc = e.local.length;
      if (e.p1 && e.p1.label) o.p1 = e.p1.label;
      if (e.p2 && e.p2.label) o.p2 = e.p2.label;
      return JSON.stringify(o);
    }).join('|');
  });

  const n = await construire();
  const ref = await signature();
  console.log(`\n=== figure de référence : ${n} objets, signature de ${ref.length} caractères ===`);

  console.log('\n=== enregistrement puis relecture ===');
  const r1 = await page.evaluate(() => {
    const a = window.app;
    const json = a.serialize();
    a.entities = a.deserialize(json);
    a.render();
    return json.length;
  });
  ck('la figure survit à serialize/deserialize', (await signature()) === ref,
     `${r1} caractères de JSON`);

  console.log('\n=== lien de partage ===');
  await construire();
  const url = await page.evaluate(() => {
    const a = window.app; const u = a.getCompressedString();
    a.clearCanvas(); a.loadFromCompressedString(u); a.render();
    return u.length;
  });
  const sig2 = await signature();
  ck('la figure survit au lien', sig2 === ref, `${url} caractères`);
  if (sig2 !== ref) {
    const av = ref.split('|'), ap = sig2.split('|');
    for (let i = 0; i < Math.max(av.length, ap.length); i++)
      if (av[i] !== ap[i]) console.log(`      objet ${i} :\n        avant ${av[i]}\n        après ${ap[i]}`);
  }
  ck('les consignes d\'étape reviennent', await page.evaluate(() =>
     JSON.stringify(window.app.stepInstructions) === JSON.stringify({ 2: "Trace [AB]." })),
     await page.evaluate(() => JSON.stringify(window.app.stepInstructions)));
  ck('les instruments reviennent', await page.evaluate(() =>
     window.app.activeWidgets.ruler === true && window.app.activeWidgets.compass === true));

  console.log('\n=== annuler / refaire ===');
  await construire();
  const undo = await page.evaluate(() => {
    const a = window.app;
    a.saveState();
    const avant = a.entities.length;
    a.addEntity(new Point(50, 50, 'Z')); a.saveState();
    const ajoute = a.entities.length;
    a.undo();
    const apresUndo = a.entities.length;
    a.redo();
    const apresRedo = a.entities.length;
    a.undo();
    return { avant, ajoute, apresUndo, apresRedo, final: a.entities.length };
  });
  console.log('  ' + JSON.stringify(undo));
  ck('annuler retire bien l\'ajout', undo.apresUndo === undo.avant, `${undo.ajoute} → ${undo.apresUndo}`);
  ck('refaire le remet', undo.apresRedo === undo.ajoute);
  ck('la figure d\'origine est intacte après annulation', (await signature()) === ref);

  console.log('\n=== exports ===');
  await construire();
  const exp = await page.evaluate(async () => {
    const a = window.app;
    const svg = a.generateSVGString(true, 'text');
    let xmlOk = false;
    try { const d = new DOMParser().parseFromString(svg, 'image/svg+xml'); xmlOk = !d.querySelector('parsererror'); }
    catch (e) { xmlOk = false; }
    window.gmEnsurePdfLibs();
    const el = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    const w = parseFloat(el.getAttribute('width')), h = parseFloat(el.getAttribute('height'));
    const doc = new jspdf.jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'pt', format: [w, h] });
    if (window.gmEnregistrerPolice) window.gmEnregistrerPolice(doc);
    let pdfOk = false, pdfTaille = 0;
    try { await doc.svg(el, { x: 0, y: 0, width: w, height: h });
          const buf = doc.output('arraybuffer'); pdfTaille = buf.byteLength;
          const tete = String.fromCharCode(...new Uint8Array(buf.slice(0, 5)));
          pdfOk = tete === '%PDF-'; } catch (e) { pdfOk = 'erreur: ' + e.message; }
    const png = a.canvas.toDataURL('image/png');
    return { svgTaille: svg.length, xmlOk, pdfOk, pdfTaille, pngTaille: png.length,
             nTextes: (svg.match(/<text/g) || []).length, nChemins: (svg.match(/<path|<line|<circle|<polygon/g) || []).length };
  });
  console.log('  ' + JSON.stringify(exp));
  ck('le SVG est un XML valide', exp.xmlOk === true);
  ck('il contient la figure', exp.nChemins > 8 && exp.nTextes > 3, `${exp.nChemins} tracés, ${exp.nTextes} textes`);
  ck('le PDF est produit et bien formé', exp.pdfOk === true, String(exp.pdfOk));
  ck('le PDF n\'est pas vide', exp.pdfTaille > 20000, exp.pdfTaille + ' octets');
  ck('le PNG est produit', exp.pngTaille > 10000, exp.pngTaille + ' caractères');

  ck('aucune erreur JS de bout en bout', errs.length === 0, errs.slice(0, 4).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
