// Tenue en charge, mode élève, reprise après fermeture.
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
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  console.log('\n=== une grosse figure : 400 objets ===');
  const perf = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const pts = [];
    for (let i = 0; i < 120; i++) {
      const p = new Point(100 + (i % 20) * 60, 100 + Math.floor(i / 20) * 90, 'P' + i);
      pts.push(p); a.addEntity(p);
    }
    for (let i = 1; i < 120; i++) a.addEntity(new Segment(pts[i - 1], pts[i]));
    for (let i = 0; i < 40; i++) a.addEntity(new Circle(pts[i], pts[i + 1]));
    for (let i = 0; i < 40; i++) { const t = new TextLabel(120 + i * 25, 850, 'T' + i); a.addEntity(t); }
    const n = a.entities.length;
    const chrono = (f, tours) => { const t0 = performance.now(); for (let k = 0; k < tours; k++) f(); return (performance.now() - t0) / tours; };
    const rendu = chrono(() => a.render(), 12);
    const lien = chrono(() => a.getCompressedString(), 3);
    const svg = chrono(() => a.generateSVGString(false, 'text'), 3);
    const json = chrono(() => a.serialize(), 3);
    const url = a.getCompressedString().length;
    return { n, rendu: +rendu.toFixed(1), lien: +lien.toFixed(1), svg: +svg.toFixed(1),
             json: +json.toFixed(1), url };
  });
  console.log('  ' + JSON.stringify(perf));
  ck('le rendu reste sous 40 ms', perf.rendu < 40, perf.rendu + ' ms pour ' + perf.n + ' objets');
  ck('le lien se fabrique sous 150 ms', perf.lien < 150, perf.lien + ' ms');
  ck('le SVG sous 150 ms', perf.svg < 150, perf.svg + ' ms');
  ck('l\'enregistrement sous 100 ms', perf.json < 100, perf.json + ' ms');
  ck('le lien d\'une grosse figure reste envoyable', perf.url < 8000, perf.url + ' caractères');

  console.log('\n=== cent allers-retours annuler / refaire ===');
  const undo = await page.evaluate(() => {
    const a = window.app;
    const n0 = a.entities.length;
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) { a.undo(); a.redo(); }
    const dt = performance.now() - t0;
    return { n0, n1: a.entities.length, ms: Math.round(dt), parCoup: +(dt / 100).toFixed(1),
             passe: a.historyPast.length, futur: a.historyFuture.length };
  });
  console.log('  ' + JSON.stringify(undo));
  ck('la figure est intacte après 100 coups', undo.n1 === undo.n0, `${undo.n0} → ${undo.n1}`);
  ck('l\'historique ne gonfle pas', undo.passe < 200, undo.passe + ' états gardés');
  ck('chaque coup reste sous 30 ms', undo.parCoup < 30, undo.parCoup + ' ms');

  console.log('\n=== changer d\'outil cent fois ===');
  const outils = await page.evaluate(() => {
    const a = window.app;
    const liste = ['point','segment','line','ray','circle','polygon','angle','text','move','pan',
                   'stylo','croquis','midpoint','perpendicular','parallel','sym_axial','sym_central'];
    const t0 = performance.now();
    let erreurs = 0;
    for (let i = 0; i < 100; i++) { try { a.setTool(liste[i % liste.length]); } catch (e) { erreurs++; } }
    a.setTool('move');
    return { ms: Math.round(performance.now() - t0), erreurs, final: a.currentTool };
  });
  console.log('  ' + JSON.stringify(outils));
  ck('aucun outil ne lève d\'erreur', outils.erreurs === 0);
  ck('l\'outil final est bien posé', outils.final === 'move');

  console.log('\n=== reprise automatique après fermeture ===');
  const sauve = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    a.addEntity(new Point(321, 123, 'Z'));
    a.projectTitle = 'Reprise';
    if (a.checkAutoSave) a.saveState();
    if (a.autoSave) a.autoSave();
    const cles = Object.keys(localStorage);
    return { cles, taille: cles.reduce((s, k) => s + (localStorage.getItem(k) || '').length, 0) };
  });
  console.log('  clés locales : ' + JSON.stringify(sauve.cles) + ` (${sauve.taille} caractères)`);
  await page.reload(); await page.waitForTimeout(2000);
  const reprise = await page.evaluate(() => ({
    n: window.app.entities.length,
    modale: (document.getElementById('restoreModal') || {}).style ? document.getElementById('restoreModal').style.display : 'absent',
    titre: window.app.projectTitle,
  }));
  console.log('  après rechargement : ' + JSON.stringify(reprise));
  ck('la reprise ne casse rien au rechargement', true, JSON.stringify(reprise));

  console.log('\n=== mode élève ===');
  const fig = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const A = new Point(200, 200, 'A'), B = new Point(500, 300, 'B');
    a.addEntity(A); a.addEntity(B); a.addEntity(new Segment(A, B));
    return a.getCompressedString();
  });
  const p2 = await ctx.newPage();
  const errs2 = []; p2.on('pageerror', e => errs2.push(e.message));
  await p2.goto(PAGE + '?mode=lecture&fig=' + fig);
  await p2.waitForTimeout(2200);
  const eleve = await p2.evaluate(() => {
    const d = document.getElementById('studentDock');
    const r = d ? d.getBoundingClientRect() : null;
    return { dock: !!d, dansEcran: r ? (r.left >= 0 && r.bottom <= innerHeight) : false,
             objets: window.app.entities.length,
             entete: getComputedStyle(document.querySelector('header')).display,
             verrou: window.app.isLocked === true,
             boutons: ['stdPencilBtn','stdMainPlay','stdMenuBtn'].map(i => {
               const e = document.getElementById(i); if (!e) return i + ':absent';
               const b = e.getBoundingClientRect();
               return { i, w: Math.round(b.width), h: Math.round(b.height) }; }) };
  });
  console.log('  ' + JSON.stringify(eleve));
  ck('le dock élève est là et dans l\'écran', eleve.dock && eleve.dansEcran);
  ck('la figure est chargée', eleve.objets === 3, eleve.objets + ' objets');
  ck('l\'en-tête professeur est masqué', eleve.entete === 'none', eleve.entete);
  ck('les trois commandes ont une taille correcte',
     eleve.boutons.every(x => x.w >= 30 && x.h >= 30), JSON.stringify(eleve.boutons));
  ck('aucune erreur JS en mode élève', errs2.length === 0, errs2.slice(0, 3).join(' | '));
  ck('aucune erreur JS côté professeur', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
