// Fenêtre + document : les deux transformations sont-elles bien séparées ?
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

  // un document factice : damier 800x600, pour voir ce qui est cadré
  const poser = async () => page.evaluate(() => new Promise(res => {
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600;
    const c = cv.getContext('2d');
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      c.fillStyle = ((i + j) % 2) ? '#ffffff' : '#3355aa'; c.fillRect(i * 100, j * 100, 100, 100);
    }
    const im = new Image();
    im.onload = () => { window.app.addBackgroundImage(im); res(true); };
    im.src = cv.toDataURL();
  }));
  await poser(); await page.waitForTimeout(200);

  const et = () => page.evaluate(() => {
    const g = window.app.bgImage;
    return { x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.width), h: Math.round(g.height),
             L: +g.cropL.toFixed(4), R: +g.cropR.toFixed(4), T: +g.cropT.toFixed(4), B: +g.cropB.toFixed(4),
             ech: +g.echelle().toFixed(4), mode: g.docMode, verrou: g.isLocked };
  });
  const brut = () => page.evaluate(() => { const g = window.app.bgImage; return { w: g.width, h: g.height }; });
  const b0 = await brut();
  const e0 = await et();
  console.log('  départ ' + JSON.stringify(e0));
  ck('le document occupe toute sa page au départ', e0.L === 0 && e0.R === 1 && e0.T === 0 && e0.B === 1);
  ck('mode Cadre par défaut', e0.mode === 'cadre');

  console.log('\n=== mode Page : le cadre ne bouge pas ===');
  const p1 = await page.evaluate(() => {
    const app = window.app, g = app.bgImage;
    app.choisirModeDocument('page');
    g.zoomContenu(2, 0, 0);            // zoom x2 au centre
    const apresZoom = { w: g.width, h: g.height, L: g.cropL, R: g.cropR, ech: g.echelle() };
    g.glisserContenu(-40, -25);        // on pousse la page
    return { apresZoom, apres: { w: g.width, h: g.height, L: g.cropL, R: g.cropR, T: g.cropT } };
  });
  console.log(`  zoom: cadre ${Math.round(p1.apresZoom.w)}x${Math.round(p1.apresZoom.h)} source ${p1.apresZoom.L.toFixed(3)}..${p1.apresZoom.R.toFixed(3)}`);
  ck('le cadre garde sa taille au zoom', Math.abs(p1.apresZoom.w - b0.w) < 1e-9 && Math.abs(p1.apresZoom.h - b0.h) < 1e-9);
  ck('on voit deux fois moins de page', Math.abs((p1.apresZoom.R - p1.apresZoom.L) - 0.5) < 0.001);
  ck('le zoom reste centré', Math.abs(p1.apresZoom.L - 0.25) < 0.001);
  ck('l\'échelle a doublé', Math.abs(p1.apresZoom.ech / e0.ech - 2) < 0.01);
  ck('glisser ne change pas la taille du cadre', Math.abs(p1.apres.w - b0.w) < 1e-9);
  ck('glisser décale bien la fenêtre sur la page', p1.apres.L > 0.25 && Math.abs((p1.apres.R - p1.apres.L) - 0.5) < 0.001);

  console.log('\n=== butées : on ne sort pas de la page ===');
  const bt = await page.evaluate(() => {
    const g = window.app.bgImage;
    g.glisserContenu(-99999, -99999);
    const coin = { R: g.cropR, B: g.cropB, w: g.cropR - g.cropL };
    g.zoomContenu(0.001, 0, 0);      // dézoom démesuré
    const plein = { L: g.cropL, R: g.cropR, T: g.cropT, B: g.cropB };
    return { coin, plein };
  });
  console.log('  ' + JSON.stringify(bt));
  ck('le glissement s\'arrête au bord de la page', Math.abs(bt.coin.R - 1) < 1e-6 && Math.abs(bt.coin.B - 1) < 1e-6);
  ck('la largeur vue est préservée par la butée', Math.abs(bt.coin.w - 0.5) < 1e-6);
  ck('on ne dézoome pas au-delà de la page entière', bt.plein.L === 0 && bt.plein.R === 1);

  console.log('\n=== volet : ouvrir un bord découvre de la page ===');
  const vo = await page.evaluate(() => {
    const app = window.app, g = app.bgImage;
    g.cropL = 0.2; g.cropR = 0.6; g.cropT = 0.2; g.cropB = 0.5;
    g.width = 400; g.height = 300;    // échelle cohérente : 400/(0.4*800)=1.25 ; 300/(0.3*600)=1.666
    g.width = 0.4 * 800 * 1.25; g.height = 0.3 * 600 * 1.25;
    const e = g.echelle();
    const d = g.ouvrirVolet('e', 50);
    return { e, d, w: g.width, R: g.cropR, ech: g.echelle() };
  });
  console.log('  ' + JSON.stringify(vo));
  ck('le cadre s\'élargit de ce qu\'on tire', Math.abs(vo.d - 50) < 0.01);
  ck('et découvre exactement autant de page', Math.abs(vo.R - (0.6 + 50 / (1.25 * 800))) < 1e-6);
  ck('l\'échelle du document ne bouge pas (rien n\'est étiré)', Math.abs(vo.ech - vo.e) < 1e-6);

  console.log('\n=== barre du document ===');
  const ba = await page.evaluate(() => {
    const app = window.app;
    app.choisirModeDocument('cadre');
    const barre = document.getElementById('barreDocument');
    const r = barre.getBoundingClientRect();
    const g = app.bgImage;
    const z = app.view.zoom;
    let maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    const w2 = g.width / 2, h2 = g.height / 2;
    [[-w2, -h2], [w2, -h2], [w2, h2], [-w2, h2]].forEach(([lx, ly]) => {
      const p = g.toGlobal(lx, ly); const sx = p.x * z + app.view.x, sy = p.y * z + app.view.y;
      maxY = Math.max(maxY, sy); minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
    });
    const rc = app.canvas.parentElement.getBoundingClientRect();
    const cadreBas = rc.top + maxY - app.canvas.parentElement.scrollTop;
    const cadreCx = rc.left + (minX + maxX) / 2 - app.canvas.parentElement.scrollLeft;
    const av = { cadre: document.getElementById('docModeCadre').classList.contains('actif'),
                 page: document.getElementById('docModePage').classList.contains('actif') };
    app.basculerVerrouDocument();
    const verrouille = { aff: getComputedStyle(document.getElementById('docModeCadre')).display,
                         verrou: getComputedStyle(document.getElementById('docVerrou')).display,
                         zone: g.getHitZone(g.x, g.y) };
    app.basculerVerrouDocument();
    return { visible: getComputedStyle(barre).display, boite: [Math.round(r.left), Math.round(r.top), Math.round(r.width)],
             cadreBas: Math.round(cadreBas), cadreCx: Math.round(cadreCx), av, verrouille,
             sousLeCadre: r.top >= cadreBas - 2, centree: Math.abs(r.left + r.width / 2 - cadreCx) < 3 };
  });
  console.log('  ' + JSON.stringify(ba));
  ck('la barre est visible', ba.visible === 'flex');
  ck('elle est sous le cadre', ba.sousLeCadre === true);
  ck('et centrée dessus', ba.centree === true);
  ck('le mode actif est signalé', ba.av.cadre === true && ba.av.page === false);
  ck('verrouillé : la barre se réduit au cadenas', ba.verrouille.aff === 'none' && ba.verrouille.verrou !== 'none');
  ck('verrouillé : le document ne répond plus aux gestes', ba.verrouille.zone === null);
  /* LE ROGNAGE EST UN MODE, comme dans tous les logiciels d'image. Les bords
     rognaient et les coins redimensionnaient, sans que rien ne le dise : deux
     gestes différents sur des poignées qui se ressemblaient, et l'on croyait
     le rognage disparu. Un bouton l'allume ; les poignées changent alors
     d'aspect ET de rôle. */
  console.log('\n=== le rognage est un mode ===');
  await poser(); await page.waitForTimeout(200);
  const eteint = await page.evaluate(() => {
    const app = window.app, g = app.bgImage;
    g.docMode = 'cadre'; g.rognage = false; app.selectedObject = g;
    app.majBarreDocument(); app.render();
    const btn = document.getElementById('docRogner');
    return { rognage: !!g.rognage,
             coin: g.getHitZone(g.x + g.width / 2, g.y + g.height / 2),
             bord: g.getHitZone(g.x + g.width / 2, g.y),
             bouton: !!btn, actif: btn ? btn.classList.contains('actif') : null };
  });
  console.log('  éteint : ' + JSON.stringify(eteint));
  ck('un bouton « Rogner » existe dans la barre', eteint.bouton === true);
  ck('éteint : le coin redimensionne', eteint.coin === 'coin-se', String(eteint.coin));
  ck('éteint : le bord ne rogne pas', eteint.bord === 'move', String(eteint.bord));

  const allume = await page.evaluate(() => {
    const app = window.app;
    app.basculerRognage();
    const g = app.bgImage;
    return { rognage: !!g.rognage,
             coin: g.getHitZone(g.x + g.width / 2, g.y + g.height / 2),
             bord: g.getHitZone(g.x + g.width / 2, g.y),
             actif: document.getElementById('docRogner').classList.contains('actif') };
  });
  console.log('  allumé : ' + JSON.stringify(allume));
  ck('allumé : le bouton le montre', allume.actif === true);
  ck('allumé : le bord rogne', allume.bord === 'volet-e', String(allume.bord));
  ck('allumé : le coin rogne aussi', allume.coin === 'volet-se', String(allume.coin));

  /* Le geste, à la souris : on tire le bord droit vers l'intérieur. La fenêtre
     rétrécit et la SOURCE ne bouge pas — c'est ce qui distingue un rognage
     d'une mise à l'échelle. */
  const pos = await page.evaluate(() => {
    const app = window.app, g = app.bgImage;
    const c = app.canvas.getBoundingClientRect(), z = app.view.zoom || 1;
    const k = c.width / app.canvas.width;
    return { x: c.left + ((g.x + g.width / 2) * z + app.view.x) * k,
             y: c.top + (g.y * z + app.view.y) * k };
  });
  const avantG = await page.evaluate(() => {
    const g = window.app.bgImage;
    return { w: Math.round(g.width), sw: Math.round(g.srcW), cropR: +g.cropR.toFixed(3) };
  });
  await page.mouse.move(pos.x, pos.y);
  await page.mouse.down();
  await page.mouse.move(pos.x - 120, pos.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const apresG = await page.evaluate(() => {
    const g = window.app.bgImage;
    return { w: Math.round(g.width), sw: Math.round(g.srcW), cropR: +g.cropR.toFixed(3) };
  });
  console.log('  ' + JSON.stringify(avantG) + ' → ' + JSON.stringify(apresG));
  ck('tirer le bord rétrécit la fenêtre', apresG.w < avantG.w - 50, `${avantG.w} → ${apresG.w}`);
  ck('et coupe l\'image au lieu de l\'étirer',
     apresG.cropR < avantG.cropR - 0.05 && Math.abs(apresG.sw - avantG.sw) < 2,
     `cropR ${avantG.cropR} → ${apresG.cropR}, source ${avantG.sw} → ${apresG.sw}`);

  /* Un coin, en rognage, coupe DEUX bords à la fois. */
  const coin2 = await page.evaluate(() => {
    const app = window.app, g = app.bgImage;
    const av = { cropR: +g.cropR.toFixed(3), cropB: +g.cropB.toFixed(3) };
    const l = g.toLocal(g.x + g.width / 2 - 50, g.y + g.height / 2 - 40);
    const ec = (b2, q) => b2 === 'e' ? q.x - g.width / 2 : b2 === 's' ? q.y - g.height / 2 : 0;
    g.ouvrirVolet('e', ec('e', l));
    g.ouvrirVolet('s', ec('s', g.toLocal(g.x + g.width / 2 - 50, g.y + g.height / 2 - 40)));
    app.render();
    return { av, ap: { cropR: +g.cropR.toFixed(3), cropB: +g.cropB.toFixed(3) } };
  });
  console.log('  coin : ' + JSON.stringify(coin2));
  ck('le coin coupe les deux bords',
     coin2.ap.cropR < coin2.av.cropR && coin2.ap.cropB < coin2.av.cropB, JSON.stringify(coin2));

  /* Le bouton « Recadrer » du menu contextuel allume le mode : il renvoyait à
     la barre du document, où il n'y avait alors aucune commande de rognage. */
  const dit = await page.evaluate(() => {
    const app = window.app;
    app.bgImage.rognage = false;
    app.selectedObject = app.bgImage;
    let message = '';
    const vrai = app.showToast;
    app.showToast = (m) => { message = m; };
    app.styleObject('image-crop');
    app.showToast = vrai;
    return { message, rognage: !!app.bgImage.rognage, mode: app.bgImage.docMode };
  });
  console.log('  ' + JSON.stringify(dit));
  ck('« Recadrer » allume le rognage', dit.rognage === true && dit.mode === 'cadre');
  ck('et dit le geste', /bord|coin/i.test(dit.message), dit.message);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
