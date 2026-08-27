// Le clavier mathématique se referme avec la saisie, par tous les chemins.
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
  const vu = () => page.evaluate(() => {
    const vk = document.getElementById('virtualKeyboard');
    const b = vk.getBoundingClientRect();
    return { visible: vk.classList.contains('visible'), h: Math.round(b.height),
             champ: document.getElementById('ghostTextInput').style.display };
  });
  const ouvrirSaisie = async (x, y) => {
    await page.evaluate(() => window.app.setTool('text'));
    await page.mouse.click(box.x + x, box.y + y); await page.waitForTimeout(250);
    await page.click('#ghostTextInput');
    await page.keyboard.type('Essai');
    await page.click('#textFormatToolbar button[onclick*="toggleVirtualKeyboard"]');
    await page.waitForTimeout(350);
  };

  console.log('\n=== fermeture par le bouton de validation ===');
  await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; });
  await ouvrirSaisie(200, 200);
  const a1 = await vu(); console.log('  ' + JSON.stringify(a1));
  ck('le clavier est bien ouvert', a1.visible === true && a1.h > 60, JSON.stringify(a1));
  await page.click('#btnValiderTexte'); await page.waitForTimeout(350);
  const a2 = await vu(); console.log('  ' + JSON.stringify(a2));
  ck('la saisie est close', a2.champ === 'none');
  ck('le clavier s\'est refermé', a2.visible === false, JSON.stringify(a2));

  console.log('\n=== fermeture par un appui à côté ===');
  await ouvrirSaisie(300, 300);
  ck('le clavier est ouvert', (await vu()).visible === true);
  await page.mouse.click(box.x + 800, box.y + 600); await page.waitForTimeout(350);
  const b2 = await vu(); console.log('  ' + JSON.stringify(b2));
  ck('la saisie est close', b2.champ === 'none');
  ck('le clavier aussi', b2.visible === false, JSON.stringify(b2));

  console.log('\n=== fermeture par Échap ===');
  await ouvrirSaisie(400, 400);
  ck('le clavier est ouvert', (await vu()).visible === true);
  await page.click('#ghostTextInput');
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  const c2 = await vu(); console.log('  ' + JSON.stringify(c2));
  ck('la saisie est close', c2.champ === 'none');
  ck('le clavier aussi', c2.visible === false, JSON.stringify(c2));

  console.log('\n=== déplacé puis rouvert : il revient à sa place ===');
  await ouvrirSaisie(500, 250);
  await page.evaluate(() => { const vk = document.getElementById('virtualKeyboard');
    vk.style.left = '30px'; vk.style.top = '40px'; vk.style.transform = 'none'; });
  await page.click('#btnValiderTexte'); await page.waitForTimeout(300);
  await ouvrirSaisie(900, 700);   // loin du texte précédent : sinon on le saisit
  const d2 = await page.evaluate(() => {
    const vk = document.getElementById('virtualKeyboard'); const r = vk.getBoundingClientRect();
    return { x: Math.round(r.left), largeurFenetre: window.innerWidth, centre: Math.round(r.left + r.width / 2) };
  });
  console.log('  ' + JSON.stringify(d2));
  ck('il se recentre au lieu de rester où on l\'avait laissé',
     Math.abs(d2.centre - d2.largeurFenetre / 2) < 40, JSON.stringify(d2));
  await page.click('#btnValiderTexte');
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
