// La fenêtre des consignes doit se fermer par sa croix — et continuer à se
// déplacer par la même poignée, qui contient cette croix.
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

  console.log('\n=== la croix est-elle seulement atteignable ? ===');
  /* Elle s'ouvrait à droite, exactement sous la palette de style — elle aussi
     ancrée à droite, et deux fois plus haute dans la pile. La croix des
     consignes était donc couverte par celle de la palette. */
  const pose = await page.evaluate(() => {
    window.app.toggleInstructions();
    const croix = document.querySelector('.instr-close');
    const r = croix.getBoundingClientRect();
    const dessus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const pal = document.getElementById('stylePalettePanel');
    return { palette: pal ? getComputedStyle(pal).display !== 'none' : false,
             atteignable: !!(dessus && croix.contains(dessus)),
             dessus: dessus ? (dessus.className || dessus.tagName) : 'rien' };
  });
  console.log('  ' + JSON.stringify(pose));
  ck('la palette de style est ouverte (c\'est le cas gênant)', pose.palette === true);
  ck('la croix des consignes n\'est couverte par rien', pose.atteignable === true, pose.dessus);

  console.log('\n=== elle ferme la fenêtre ===');
  /* La croix vit DANS la poignée de glissement. Celle-ci capturait l'appui —
     preventDefault + setPointerCapture — donc le navigateur ne fabriquait jamais
     de « click » sur la croix, et la fenêtre ne se fermait plus. */
  await page.click('.instr-close');
  await page.waitForTimeout(200);
  const ferme = await page.evaluate(() => getComputedStyle(document.getElementById('instructionBox')).display);
  ck('un clic sur la croix la ferme', ferme === 'none', ferme);

  await page.evaluate(() => window.app.toggleInstructions());
  await page.waitForTimeout(150);
  const rouvre = await page.evaluate(() => getComputedStyle(document.getElementById('instructionBox')).display);
  ck('et le bouton la rouvre', rouvre !== 'none', rouvre);

  console.log('\n=== et elle se déplace toujours ===');
  // vraie souris : la poignée capture le pointeur, un événement fabriqué à la
  // main n'aurait pas d'identifiant valide à capturer
  const dep = await page.evaluate(() => {
    const r = document.getElementById('instructionBox').getBoundingClientRect();
    return { x: Math.round(r.left) + 40, y: Math.round(r.top) + 12, left: r.left, top: r.top };
  });
  await page.mouse.move(dep.x, dep.y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(dep.x + 20 * i, dep.y + 15 * i);
  await page.mouse.up();
  await page.waitForTimeout(120);
  const bouge = await page.evaluate((dep) => {
    const r = document.getElementById('instructionBox').getBoundingClientRect();
    return { dx: Math.round(r.left - dep.left), dy: Math.round(r.top - dep.top) };
  }, dep);
  console.log('  ' + JSON.stringify(bouge));
  ck('la poignée déplace bien la fenêtre', bouge.dx > 80 && bouge.dy > 60, JSON.stringify(bouge));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
