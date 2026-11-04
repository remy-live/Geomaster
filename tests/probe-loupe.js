// La loupe : apparition, suivi du doigt, contenu, disparition.
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1600);

  const geste = (dx, dy, attente) => page.evaluate(async ({ dx, dy, attente }) => {
    const app = window.app, cv = app.canvas;
    const r = cv.getBoundingClientRect();
    const bulle = document.getElementById('zoomBubble');
    const ev = (t, x, y, bt) => {
      const o = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
                  clientX: x, clientY: y, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o));
    };
    const x0 = r.left + 100, y0 = r.top + 300;
    app.setTool('segment');
    ev('pointerdown', x0, y0, 1);
    if (attente) await new Promise(r2 => setTimeout(r2, 300));
    for (let i = 1; i <= 12; i++) ev('pointermove', x0 + dx * i / 12, y0 + dy * i / 12, 1);
    await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
    const cs = getComputedStyle(bulle);
    const bb = bulle.getBoundingClientRect();
    const fx = x0 + dx, fy = y0 + dy;
    // encre non blanche dans la loupe = elle montre quelque chose
    const z = document.getElementById('zoomCanvas');
    const d = z.getContext('2d').getImageData(0, 0, z.width, z.height).data;
    let encre = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) encre++;
    const res = { disp: cs.display, transform: cs.transform !== 'none',
                  boite: [Math.round(bb.left), Math.round(bb.top), Math.round(bb.width), Math.round(bb.height)],
                  doigt: [Math.round(fx), Math.round(fy)],
                  auDessus: bb.bottom <= fy + 1, centree: Math.abs((bb.left + bb.right) / 2 - fx) < 30,
                  dansEcran: bb.left >= 0 && bb.right <= innerWidth && bb.top >= 0 && bb.bottom <= innerHeight,
                  encre: encre };
    ev('pointerup', fx, fy, 0);
    res.dispApres = getComputedStyle(bulle).display;
    res.transformApres = getComputedStyle(bulle).transform;
    return res;
  }, { dx, dy, attente });

  console.log('\n=== glissement franc : la loupe sort et suit ===');
  const g = await geste(120, -60, false);
  console.log('  ' + JSON.stringify(g));
  ck('la loupe est visible', g.disp === 'block');
  ck('elle est placée par transform', g.transform === true);
  ck('au-dessus du doigt', g.auDessus === true);
  ck('centrée sur le doigt', g.centree === true);
  ck('entièrement dans l\'écran', g.dansEcran === true);
  ck('elle montre bien quelque chose', g.encre > 50, `${g.encre} pixels d'encre`);
  ck('elle disparaît au relâchement', g.dispApres === 'none');
  ck('et rend son ancrage d\'origine', g.transformApres === 'none' || g.transformApres === '');

  console.log('\n=== maintien sans glisser : elle sort après le délai ===');
  const m = await geste(4, 3, true);
  ck('visible après maintien', m.disp === 'block');
  ck('dans l\'écran', m.dansEcran === true);

  console.log('\n=== près du haut de l\'écran : elle se décale sur le côté ===');
  const h = await page.evaluate(async () => {
    const app = window.app, cv = app.canvas, bulle = document.getElementById('zoomBubble');
    const r = cv.getBoundingClientRect();
    const ev = (t, x, y, bt) => { const o = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0,
      buttons: bt, clientX: x, clientY: y, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o)); };
    const x0 = r.left + 80, y0 = Math.max(r.top + 6, 60);
    app.setTool('segment');
    ev('pointerdown', x0, y0, 1);
    for (let i = 1; i <= 12; i++) ev('pointermove', x0 + i * 3, y0 + i, 1);
    await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
    const bb = bulle.getBoundingClientRect();
    const res = { dansEcran: bb.left >= 0 && bb.right <= innerWidth && bb.top >= 0 && bb.bottom <= innerHeight,
                  boite: [Math.round(bb.left), Math.round(bb.top)] };
    ev('pointerup', x0 + 36, y0 + 12, 0);
    return res;
  });
  console.log('  ' + JSON.stringify(h));
  ck('toujours entièrement dans l\'écran', h.dansEcran === true);
  /* ---- ALLUMÉE AU BOUTON, PUIS LE DOIGT ARRIVE ----
     montrer() demandait « suis-je visible ? » pour décider « faut-il
     m'ancrer ? ». Si le professeur avait allumé la loupe lui-même, elle était
     visible mais GARÉE en bas à droite : l'ancrage était sauté et le
     translate3d du suivi s'ajoutait à la position garée. Mesuré avant : doigt
     en (407 ; 291), bulle en (1174 ; 693) sur un écran de 1024 × 768 — hors
     de l'écran, donc invisible exactement quand on venait de la demander. */
  console.log('\n=== allumée au bouton, elle rejoint quand même le doigt ===');
  const gBouton = await page.evaluate(async () => {
    const app = window.app, cv = app.canvas, r = cv.getBoundingClientRect();
    const bulle = document.getElementById('zoomBubble');
    const btn = document.getElementById('zoomToggleBtn');
    /* Le bouton fait le tour de trois états : on clique jusqu'à « reste en
       bas », qui est l'état où la bulle est VISIBLE et GARÉE — celui où
       l'ancrage était sauté. « Éteindre puis rallumer » ne revient plus au
       même point depuis que le bouton a trois états. */
    for (let k = 0; k < 4 && window.app.zoomMode !== 2; k++) {
        btn.click(); await new Promise(r2 => setTimeout(r2, 60));
    }
    await new Promise(k => setTimeout(k, 120));
    const garee = bulle.getBoundingClientRect();
    const ev = (t, x, y, bt) => (t === 'pointerup' ? window : cv).dispatchEvent(
      new PointerEvent(t, { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0,
        buttons: bt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    app.setTool('segment');
    const dx = r.left + 120, dy = Math.max(r.top + 300, 320);
    ev('pointerdown', dx, dy, 1);
    await new Promise(k => setTimeout(k, 330));
    ev('pointermove', dx, dy, 1);
    await new Promise(k => setTimeout(k, 160));
    const q = bulle.getBoundingClientRect();
    ev('pointerup', dx, dy, 0);
    return { garee: [Math.round(garee.left), Math.round(garee.top)],
             doigt: [Math.round(dx), Math.round(dy)],
             suivie: [Math.round(q.left), Math.round(q.top)],
             dansEcran: q.left >= 0 && q.top >= 0 && q.right <= innerWidth && q.bottom <= innerHeight,
             pres: Math.round(Math.hypot(q.left + q.width / 2 - dx, q.top + q.height / 2 - dy)) };
  });
  console.log('  ' + JSON.stringify(gBouton));
  ck('elle quitte sa place garée', gBouton.suivie[0] !== gBouton.garee[0] || gBouton.suivie[1] !== gBouton.garee[1],
     `garée ${JSON.stringify(gBouton.garee)} → ${JSON.stringify(gBouton.suivie)}`);
  ck("elle reste dans l'écran", gBouton.dansEcran === true, JSON.stringify(gBouton.suivie));
  ck('et elle est près du doigt, pas à l\'autre bout', gBouton.pres < 260, gBouton.pres + ' px du doigt');

  /* ---- LE CADRE DE LA LOUPE N'AVALE PLUS LA FEUILLE ----
     Loupe allumée, un disque de 158 × 158 px en bas à droite ne répondait plus :
     elementFromPoint y rendait « zoomWidget ». La loupe ne pouvait donc pas
     montrer ce qu'elle cachait, et un clic dans ce coin n'arrivait nulle part.
     Cela se mesure sur un ÉCRAN D'ORDINATEUR, là où la bulle reste garée en bas
     à droite : au téléphone elle suit le doigt, et se trouve ailleurs. */
  console.log('\n=== et son cadre laisse passer la feuille (écran d\'ordinateur) ===');
  const bureau = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const pageB = await bureau.newPage();
  await pageB.goto(PAGE); await pageB.waitForFunction(() => window.app);
  await pageB.waitForTimeout(700);
  await pageB.evaluate(() => { const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    window.app.checkAutoSave = () => {}; });
  await pageB.locator('#zoomToggleBtn').click();
  await pageB.waitForTimeout(250);
  const sous = await pageB.evaluate(() => {
    const b2 = document.getElementById('zoomBubble').getBoundingClientRect();
    const lire = (x, y) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.tagName) : 'rien'; };
    const btn = document.getElementById('zoomToggleBtn').getBoundingClientRect();
    return { visible: getComputedStyle(document.getElementById('zoomBubble')).display,
             centre: lire(b2.left + b2.width / 2, b2.top + b2.height / 2),
             coin: lire(b2.left + 8, b2.top + 8),
             /* elementFromPoint rend le <line> du dessin, pas le bouton :
                c'est l'ancêtre qu'il faut regarder. */
             bouton: (() => { const e = document.elementFromPoint(btn.left + btn.width / 2, btn.top + btn.height / 2);
                 return e && e.closest && e.closest('#zoomToggleBtn') ? 'zoomToggleBtn' : (e ? (e.id || e.tagName) : 'rien'); })() };
  });
  ck('la feuille répond sous la bulle', /canvas/i.test(sous.centre) && /canvas/i.test(sous.coin),
     JSON.stringify(sous));
  ck('mais le bouton garde sa prise', /zoomToggleBtn/.test(sous.bouton), sous.bouton);

  /* ---- ELLE SUIT LE CURSEUR, PAR LE HAUT OU PAR LE BAS ----
     « Je n'ai toujours pas la loupe qui peut suivre le curseur par le haut ou
     bas. » La loupe ne savait qu'être éteinte ou allumée-et-garée en bas à
     droite : il fallait faire l'aller-retour de l'œil entre le point visé et
     le coin — jusqu'à 1075 px, mesuré en 1366 × 768. Elle se pose maintenant
     AU-DESSUS du curseur, et PASSE DESSOUS quand le haut manque : jamais sur
     le point qu'on regarde. « Mais qui peut aussi rester en bas » : le bouton
     fait le tour des trois états, sans commande nouvelle. */
  console.log('\n=== elle suit le curseur, par le haut ou par le bas ===');
  const etat = () => pageB.evaluate(() => {
    const r = document.getElementById('zoomBubble').getBoundingClientRect();
    const btn = document.getElementById('zoomToggleBtn');
    return { mode: window.app.zoomMode, actif: !!window.app.isZoomActive,
             garee: btn.classList.contains('loupe-garee'),
             info: btn.dataset.tooltip,
             vue: getComputedStyle(document.getElementById('zoomBubble')).display,
             x: Math.round(r.left), y: Math.round(r.top),
             w: Math.round(r.width), h: Math.round(r.height) };
  });
  /* On est déjà au 1er clic (mode 1) : la loupe suit. */
  const m1 = await etat();
  ck('le premier clic met la loupe en mode « suit le curseur »',
     m1.mode === 1 && m1.actif === true && m1.garee === false, JSON.stringify(m1));
  const suivis = [];
  for (const [x, y] of [[600, 500], [400, 120], [900, 650]]) {
    await pageB.mouse.move(x, y);
    await pageB.waitForTimeout(170);
    const e = await etat();
    suivis.push({ x, y, bulle: [e.x, e.y],
                  dessus: e.y + e.h < y, dessous: e.y > y,
                  pres: Math.round(Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y)),
                  dansEcran: e.x >= 0 && e.y >= 0 && e.x + e.w <= 1366 && e.y + e.h <= 768 });
  }
  console.log('  ' + JSON.stringify(suivis));
  ck('elle suit vraiment le curseur', new Set(suivis.map(s => s.bulle.join(','))).size === 3,
     suivis.map(s => s.bulle.join(',')).join(' | '));
  ck('elle se pose au-dessus quand il y a la place',
     suivis[0].dessus === true && suivis[2].dessus === true,
     JSON.stringify(suivis.map(s => s.dessus)));
  ck('et PASSE DESSOUS près du haut de l\'écran', suivis[1].dessous === true,
     `curseur en y=120, bulle en y=${suivis[1].bulle[1]}`);
  ck('elle reste toujours entière dans l\'écran', suivis.every(s => s.dansEcran),
     JSON.stringify(suivis.map(s => s.dansEcran)));
  ck('et jamais loin du point visé', suivis.every(s => s.pres < 200),
     suivis.map(s => s.pres + ' px').join(', '));

  /* ---- MAIS ELLE PEUT AUSSI RESTER EN BAS ---- */
  console.log('\n=== mais elle peut aussi rester en bas ===');
  await pageB.locator('#zoomToggleBtn').click();
  await pageB.waitForTimeout(180);
  const m2 = await etat();
  ck('le deuxième clic la laisse en bas', m2.mode === 2 && m2.actif === true && m2.garee === true,
     JSON.stringify(m2));
  await pageB.mouse.move(500, 400);
  await pageB.waitForTimeout(180);
  const m2b = await etat();
  ck('et elle ne bouge plus quand le curseur bouge',
     m2b.x === m2.x && m2b.y === m2.y, `${m2.x},${m2.y} → ${m2b.x},${m2b.y}`);
  await pageB.locator('#zoomToggleBtn').click();
  await pageB.waitForTimeout(180);
  const m0 = await etat();
  ck('le troisième clic éteint', m0.mode === 0 && m0.actif === false && m0.vue === 'none',
     JSON.stringify(m0));
  ck("et l'infobulle annonce à chaque fois le clic suivant",
     new Set([m1.info, m2.info, m0.info]).size === 3,
     JSON.stringify([m1.info, m2.info, m0.info]));

  /* ================================================================
     LE BOUTON NE DOIT JAMAIS BOUGER.
     « Quand la loupe est en route et au-dessus, je ne peux plus l'enlever ou
       la décrocher. »
     Tout ce qui précède était vert, et pourtant le bouton était hors d'atteinte
     à la main. La raison tient au GESTE DE LA SONDE : locator.click() remesure
     la boîte de l'élément juste avant de frapper, donc il le suit où qu'il
     aille. Une main, elle, vise d'abord, puis avance. Ici on vise d'abord.
     Mesuré avant correction : bulle rangée dans le coin, elle occupait la boîte
     et poussait le bouton à (1242, 525) ; bulle partie suivre le curseur, elle
     quittait le flux et le bouton retombait à (1296, 698). Or elle part dès
     qu'on bouge sur la feuille et revient dès qu'on en sort — à l'instant
     précis où l'on tend la main vers le bouton. Il sautait de 173 px sous le
     curseur qui arrivait, le clic tombait sur la feuille, et la loupe ne
     s'éteignait plus.
     ================================================================ */
  console.log('\n=== le bouton reste où on l\'a vu ===');
  const boite = () => pageB.evaluate(() => {
    const r = document.getElementById('zoomToggleBtn').getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top),
             cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
  });
  /* ON COMPARE LES CENTRES, PAS LES COINS : le bouton grossit de 10 % au
     survol (c'est voulu), ce qui déplace son coin de 2,5 px sans que le bouton
     ait bougé d'un pouce. Le centre, lui, ne bouge pas sous une homothétie —
     au pixel d'arrondi près. */
  const memePlace = (a, b) => Math.abs(a.cx - b.cx) <= 1 && Math.abs(a.cy - b.cy) <= 1;
  const eteinte = await boite();
  await pageB.mouse.move(eteinte.cx, eteinte.cy, { steps: 8 });
  await pageB.mouse.down(); await pageB.mouse.up();      /* à la main, pas au locator */
  await pageB.waitForTimeout(200);
  const allumee = await boite();
  ck('allumer la loupe ne déplace pas son bouton',
     memePlace(allumee, eteinte),
     `${eteinte.cx},${eteinte.cy} → ${allumee.cx},${allumee.cy}`);
  ck('  et le clic à la main l\'a bien allumée',
     (await pageB.evaluate(() => window.app.zoomMode)) === 1);

  /* On promet la souris sur la feuille, comme en classe : la bulle part suivre
     le curseur, et c'est là que le bouton sautait. */
  const vus = [];
  for (const [x, y] of [[600, 400], [900, 250], [1100, 600], [1250, 700]]) {
    await pageB.mouse.move(x, y, { steps: 5 });
    await pageB.waitForTimeout(90);
    vus.push(await boite());
  }
  ck('la bulle a beau suivre le curseur, le bouton ne bouge pas',
     vus.length === 4 && vus.every(v => memePlace(v, allumee)),
     JSON.stringify(vus.map(v => v.cx + ',' + v.cy)) + ' contre ' + allumee.cx + ',' + allumee.cy);

  /* ET MAINTENANT ON LE REPREND, EN VISANT CE QU'ON VOYAIT. */
  const vise = vus[vus.length - 1];
  await pageB.mouse.move(vise.cx, vise.cy, { steps: 12 });
  await pageB.waitForTimeout(220);
  const enApprochant = await boite();
  ck("il ne fuit pas non plus quand la main arrive",
     memePlace(enApprochant, vise),
     `visé ${vise.cx},${vise.cy} — trouvé ${enApprochant.cx},${enApprochant.cy}`);
  const dessous = await pageB.evaluate((p) => {
    const e = document.elementFromPoint(p.cx, p.cy);
    const b = document.getElementById('zoomToggleBtn');
    return e === b || b.contains(e) ? 'le bouton' : (e ? (e.id || e.tagName) : 'rien');
  }, vise);
  ck("c'est bien le bouton qui est sous le curseur", dessous === 'le bouton', dessous);
  await pageB.mouse.down(); await pageB.mouse.up();
  await pageB.waitForTimeout(220);
  const apres1 = await pageB.evaluate(() => window.app.zoomMode);
  ck('un clic à la main la décroche (elle reste en bas)', apres1 === 2, 'mode ' + apres1);
  await pageB.mouse.down(); await pageB.mouse.up();
  await pageB.waitForTimeout(220);
  const apres2 = await pageB.evaluate(() => window.app.zoomMode);
  ck('un second clic l\'éteint', apres2 === 0, 'mode ' + apres2);

  await bureau.close();

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
