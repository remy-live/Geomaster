// Cliquer à côté d'un texte le referme sans en ouvrir un autre ;
// les deux outils de croquis restent armés d'une figure à l'autre.
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
  const box = await page.evaluate(() => { const r = window.app.canvas.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  const etat = () => page.evaluate(() => ({
    champ: document.getElementById('ghostTextInput').style.display,
    barre: document.getElementById('textFormatToolbar').style.display,
    outil: window.app.currentTool,
    n: window.app.entities.filter(e => e.constructor.name === 'TextLabel').length,
  }));

  console.log('\n=== texte : un appui à côté referme, sans rouvrir ===');
  await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; window.app.setTool('text'); });
  await page.mouse.click(box.x + 200, box.y + 200); await page.waitForTimeout(250);
  await page.click('#ghostTextInput');
  await page.keyboard.type('Premier');
  const pendant = await etat();
  await page.mouse.click(box.x + 600, box.y + 500); await page.waitForTimeout(300);
  const apres = await etat();
  console.log('  pendant ' + JSON.stringify(pendant) + '\n  après   ' + JSON.stringify(apres));
  ck('la saisie était ouverte', pendant.champ === 'block');
  ck('elle est refermée', apres.champ === 'none' && apres.barre === 'none', JSON.stringify(apres));
  ck('le texte a bien été gardé', apres.n === 1, apres.n + ' texte(s)');
  ck('l\'outil texte reste armé', apres.outil === 'text', apres.outil);

  console.log('\n=== un second appui écrit bien le texte suivant ===');
  await page.mouse.click(box.x + 600, box.y + 500); await page.waitForTimeout(300);
  const deuxieme = await etat();
  await page.click('#ghostTextInput');
  await page.keyboard.type('Second');
  await page.evaluate(() => window.app.validerTexteFantome()); await page.waitForTimeout(200);
  const fin = await etat();
  ck('un nouvel appui rouvre une saisie', deuxieme.champ === 'block', JSON.stringify(deuxieme));
  ck('et l\'on obtient deux textes', fin.n === 2, fin.n + '');

  console.log('\n=== croquis de la barre de gauche : il reste armé ===');
  const carre = (cx, cy, c) => {
    const p = []; const co = [[-c/2,-c/2],[c/2,-c/2],[c/2,c/2],[-c/2,c/2],[-c/2,-c/2]];
    for (let i = 0; i < 4; i++) { const [ax,ay] = co[i], [bx,by] = co[i+1];
      for (let k = 0; k <= 12; k++) p.push({ x: cx+ax+(bx-ax)*k/12, y: cy+ay+(by-ay)*k/12 }); }
    return p;
  };
  const tracer = (pts) => page.evaluate((pts) => {
    const a = window.app, cv = a.canvas, r = cv.getBoundingClientRect();
    const ev = (t, q, bt) => { const o = { pointerId: 21, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: q.x*a.view.zoom+a.view.x+r.left, clientY: q.y*a.view.zoom+a.view.y+r.top, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o)); };
    ev('pointerdown', pts[0], 1);
    for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i], 1);
    ev('pointerup', pts[pts.length-1], 0);
  }, pts);

  await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; window.app.setTool('croquis'); });
  await tracer(carre(300, 300, 200)); await page.waitForTimeout(400);
  const c1 = await page.evaluate(() => ({ outil: window.app.currentTool,
    pts: window.app.entities.filter(e => e.constructor.name === 'Point').length }));
  await tracer(carre(750, 550, 200)); await page.waitForTimeout(400);
  const c2 = await page.evaluate(() => ({ outil: window.app.currentTool,
    pts: window.app.entities.filter(e => e.constructor.name === 'Point').length }));
  console.log('  ' + JSON.stringify(c1) + ' puis ' + JSON.stringify(c2));
  ck('la première figure est construite', c1.pts >= 4, c1.pts + ' points');
  ck('l\'outil est toujours le croquis', c1.outil === 'croquis', c1.outil);
  ck('la seconde figure se trace sans reprendre l\'outil', c2.pts >= 8, c2.pts + ' points');

  console.log('\n=== croquis magique : armé lui aussi, modale comprise ===');
  await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; window.app.setTool('magic_croquis'); });
  await tracer(carre(300, 300, 200)); await page.waitForTimeout(400);
  const m1 = await page.evaluate(() => ({ modale: document.getElementById('croquisModal').style.display,
    outil: window.app.currentTool }));
  await page.evaluate(() => window.app.repondreChoixCroquis(false)); await page.waitForTimeout(400);
  const m2 = await page.evaluate(() => ({ outil: window.app.currentTool,
    pts: window.app.entities.filter(e => e.constructor.name === 'Point').length }));
  await tracer(carre(750, 550, 200)); await page.waitForTimeout(400);
  const m3 = await page.evaluate(() => ({ modale: document.getElementById('croquisModal').style.display,
    outil: window.app.currentTool }));
  await page.evaluate(() => window.app.repondreChoixCroquis(null)); await page.waitForTimeout(300);
  const m4 = await page.evaluate(() => ({ outil: window.app.currentTool,
    modale: document.getElementById('croquisModal').style.display }));
  console.log('  ' + JSON.stringify([m1, m2, m3, m4]));
  ck('la modale s\'ouvre', m1.modale === 'flex', m1.modale);
  ck('« figure seule » construit et garde l\'outil', m2.outil === 'magic_croquis' && m2.pts >= 4,
     JSON.stringify(m2));
  ck('un second tracé rouvre la modale', m3.modale === 'flex' && m3.outil === 'magic_croquis',
     JSON.stringify(m3));
  ck('annuler ne désarme pas non plus', m4.outil === 'magic_croquis' && m4.modale === 'none',
     JSON.stringify(m4));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
