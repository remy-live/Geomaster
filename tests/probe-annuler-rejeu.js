// Annuler pendant qu'une construction magique se rejoue : la lecture s'arrête,
// la figure revient en arrière, et l'on peut retravailler tout de suite.
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

  /* Le défaut : la boucle de lecture comptait jusqu'à loopEndIndex — la fin de
     la construction — sur un tableau d'objets que l'annulation venait de
     raccourcir. replayIndex montait dans le vide, la lecture ne s'arrêtait
     jamais, et le ▶ ne revenait pas. */
  const poser = (nom) => page.evaluate((nom) => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    app.setTool('segment');
    ev('pointerdown', { x: 640, y: 180 }, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', { x: 640, y: 180 + 520 * i / 6 }, 1);
    ev('pointerup', { x: 640, y: 700 }, 0);
    app.setTool('select');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    const avant = app.entities.length;
    if (nom === 'sym') { const M = app.createPointAt(400, 320); M.label = 'M'; app.buildSymAxiale([M], seg); }
    else app.buildMediatrice(seg, 640, 440, seg.p1, seg.p2);
    return { avant };
  }, nom);

  for (const nom of ['sym', 'mediatrice']) {
    console.log(`\n=== ${nom} : Ctrl+Z pendant le rejeu ===`);
    const { avant } = await poser(nom);
    await page.waitForTimeout(700);
    const pendant = await page.evaluate(() => ({ joue: app.isPlaying, n: app.entities.length }));
    ck('le rejeu est bien lancé', pendant.joue === true && pendant.n > avant, JSON.stringify(pendant));

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1200);
    const apres = await page.evaluate(() => ({
      joue: app.isPlaying, anime: app.isToolAnimating, boucle: app.isLooping,
      n: app.entities.length, ri: app.replayIndex, verrou: app.isLocked,
      bouton: (document.getElementById('btnPlay') || {}).innerHTML }));
    console.log('  ' + JSON.stringify(apres));
    ck('la lecture s\'est arrêtée', apres.joue === false && apres.anime === false && apres.boucle === false);
    ck('la figure est revenue avant la construction', apres.n === avant, `${apres.n} objets, ${avant} attendus`);
    /* Le symptôme même du blocage : replayIndex plus grand que le nombre
       d'objets, la boucle lisant au-delà de la fin. */
    ck('la lecture ne pointe pas au-delà de la figure', apres.ri === apres.n, `${apres.ri} / ${apres.n}`);
    ck('l\'interface est rendue', apres.verrou !== true, String(apres.verrou));
    ck('le bouton propose de relire', apres.bouton === '▶', apres.bouton);

    // et l'on peut retravailler tout de suite
    const suite = await page.evaluate(() => {
      const app = window.app, rc = app.canvas.getBoundingClientRect();
      const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
        pointerId: 4, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
        clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
      const n = app.entities.length;
      app.setTool('segment');
      ev('pointerdown', { x: 200, y: 800 }, 1);
      for (let i = 1; i <= 6; i++) ev('pointermove', { x: 200 + 300 * i / 6, y: 800 }, 1);
      ev('pointerup', { x: 500, y: 800 }, 0);
      app.setTool('select');
      return { neufs: app.entities.slice(n).map(e => e.constructor.name),
               instruments: Object.entries(app.activeWidgets).filter(([, v]) => v).map(([k]) => k) };
    });
    console.log('  ' + JSON.stringify(suite));
    /* Les instruments sortis par le rejeu restaient posés sur la feuille : le
       geste suivant les attrapait, et l'on obtenait un déplacement d'outil au
       lieu d'un trait. */
    ck('les instruments du rejeu sont rangés', suite.instruments.length === 0, suite.instruments.join(','));
    ck('on retrace un vrai segment, pas un outil qu\'on déplace',
       suite.neufs.includes('Segment'), suite.neufs.join(','));
  }

  console.log('\n=== refaire ramène la construction ===');
  const { avant } = await poser('sym');
  await page.waitForTimeout(700);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(600);
  const apresUndo = await page.evaluate(() => app.entities.length);
  await page.keyboard.press('Control+y');
  await page.waitForTimeout(600);
  const apresRedo = await page.evaluate(() => ({ n: app.entities.length, joue: app.isPlaying }));
  console.log(`  ${avant} → ${apresUndo} → ${apresRedo.n}`);
  ck('la construction est de retour', apresRedo.n > apresUndo, `${apresRedo.n} objets`);
  ck('et elle ne se relance pas toute seule', apresRedo.joue === false);

  console.log('\n=== une annulation ordinaire ne range pas les instruments ===');
  /* Le rangement ne vaut QUE pour un rejeu interrompu : une règle sortie à la
     main doit rester sortie quand on annule un trait. */
  const ordinaire = await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 5, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.historyFuture = []; app.saveState();
    if (!app.activeWidgets.ruler) app.toggleWidget('ruler');
    app.setTool('segment');
    ev('pointerdown', { x: 200, y: 850 }, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', { x: 200 + 300 * i / 6, y: 850 }, 1);
    ev('pointerup', { x: 500, y: 850 }, 0);
    app.setTool('select');
    const avant = app.entities.length;
    app.undo();
    return { avant, apres: app.entities.length, regle: app.activeWidgets.ruler };
  });
  console.log('  ' + JSON.stringify(ordinaire));
  ck('la règle sortie à la main reste sortie', ordinaire.regle === true, String(ordinaire.regle));
  ck('et le trait a bien été annulé', ordinaire.apres < ordinaire.avant,
     `${ordinaire.avant} → ${ordinaire.apres}`);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
