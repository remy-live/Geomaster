// Mode Cadre : huit poignées, chacune faisant ce qu'elle annonce.
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
  await page.evaluate(() => new Promise(res => {
    const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600;
    const c = cv.getContext('2d');
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { c.fillStyle = ((i + j) % 2) ? '#fff' : '#35a'; c.fillRect(i * 100, j * 100, 100, 100); }
    const im = new Image(); im.onload = () => { window.app.addBackgroundImage(im); res(1); }; im.src = cv.toDataURL();
  }));
  await page.waitForTimeout(200);

  /* LE ROGNAGE EST UN MODE : les bords ne répondent que lorsqu'il est allumé,
     et les coins changent alors de rôle. Éteint, seuls les quatre coins
     redimensionnent — ne montrer que le geste possible est la seule façon
     honnête de dire lequel c'est. */
  console.log('\n=== les huit poignées répondent, à plat et tourné ===');
  for (const ang of [0, 0.4]) {
    const z = await page.evaluate((ang) => {
      const g = window.app.bgImage;
      g.angle = ang; g.docMode = 'cadre'; g.isLocked = false; g.rognage = true;
      const w2 = g.width / 2, h2 = g.height / 2;
      const Z = (lx, ly) => { const p = g.toGlobal(lx, ly); return g.getHitZone(p.x, p.y); };
      return { nw: Z(-w2, -h2), ne: Z(w2, -h2), se: Z(w2, h2), sw: Z(-w2, h2),
               e: Z(w2, 0), o: Z(-w2, 0), s: Z(0, h2), n: Z(0, -h2),
               rot: Z(0, -h2 - 25), dedans: Z(0, 0) };
    }, ang);
    console.log(`  angle ${ang} : ${JSON.stringify(z)}`);
    ck(`coins, en rognage (angle ${ang})`,
       z.nw === 'volet-nw' && z.ne === 'volet-ne' && z.se === 'volet-se' && z.sw === 'volet-sw',
       JSON.stringify([z.nw, z.ne, z.se, z.sw]));
    ck(`bords (angle ${ang})`, z.e === 'volet-e' && z.o === 'volet-w' && z.s === 'volet-s' && z.n === 'volet-n');
    const hors = await page.evaluate((ang2) => {
      const g = window.app.bgImage;
      g.angle = ang2; g.rognage = false;
      const w2 = g.width / 2, h2 = g.height / 2;
      const Z = (lx, ly) => { const p = g.toGlobal(lx, ly); return g.getHitZone(p.x, p.y); };
      const r = { nw: Z(-w2, -h2), se: Z(w2, h2), e: Z(w2, 0), n: Z(0, -h2) };
      g.rognage = true;
      return r;
    }, ang);
    ck(`hors rognage, les coins redimensionnent (angle ${ang})`,
       hors.nw === 'coin-nw' && hors.se === 'coin-se', JSON.stringify(hors));
    ck(`hors rognage, les bords ne coupent pas (angle ${ang})`,
       hors.e === 'move' && hors.n === 'move', JSON.stringify(hors));
    ck(`rotation et intérieur (angle ${ang})`, z.rot === 'rotate' && z.dedans === 'move');
  }

  console.log('\n=== volets : chaque bord découvre de son côté ===');
  const vo = await page.evaluate(() => {
    const g = window.app.bgImage;
    const out = {};
    for (const bord of ['e', 'w', 's', 'n']) {
      g.angle = 0; g.width = 400; g.height = 300;
      g.cropL = 0.3; g.cropR = 0.7; g.cropT = 0.3; g.cropB = 0.7;
      // échelle cohérente : 400/(0.4*800) = 1.25 ; hauteur 0.4*600*1.25 = 300
      const e0 = g.echelle(); const x0 = g.x, y0 = g.y;
      const av = { L: g.cropL, R: g.cropR, T: g.cropT, B: g.cropB };
      const d = g.ouvrirVolet(bord, 50);
      out[bord] = { d: +d.toFixed(2), dL: +(g.cropL - av.L).toFixed(5), dR: +(g.cropR - av.R).toFixed(5),
                    dT: +(g.cropT - av.T).toFixed(5), dB: +(g.cropB - av.B).toFixed(5),
                    w: Math.round(g.width), h: Math.round(g.height),
                    dx: +(g.x - x0).toFixed(2), dy: +(g.y - y0).toFixed(2), ech: +(g.echelle() - e0).toFixed(6) };
    }
    return out;
  });
  Object.entries(vo).forEach(([k, v]) => console.log(`  ${k} : ${JSON.stringify(v)}`));
  ck('est : découvre à droite, le bord gauche ne bouge pas', vo.e.dR > 0 && vo.e.dL === 0 && vo.e.dx === 25);
  ck('ouest : découvre à gauche', vo.w.dL < 0 && vo.w.dR === 0 && vo.w.dx === -25);
  ck('sud : découvre en bas', vo.s.dB > 0 && vo.s.dT === 0 && vo.s.dy === 25);
  ck('nord : découvre en haut', vo.n.dT < 0 && vo.n.dB === 0 && vo.n.dy === -25);
  ck('aucun volet n\'étire le document', Object.values(vo).every(v => Math.abs(v.ech) < 1e-6));

  console.log('\n=== butée : un volet s\'arrête au bord de la page ===');
  const bu = await page.evaluate(() => {
    const g = window.app.bgImage;
    g.angle = 0; g.cropL = 0; g.cropR = 1; g.cropT = 0; g.cropB = 1;
    g.width = 800; g.height = 600;
    const d = g.ouvrirVolet('e', 200);
    return { d, R: g.cropR, w: g.width };
  });
  console.log('  ' + JSON.stringify(bu));
  ck('page déjà entière : le volet ne bouge plus', bu.d === 0 && bu.R === 1 && bu.w === 800);

  console.log('\n=== coins : le coin opposé reste planté ===');
  const co = await page.evaluate(() => {
    const g = window.app.bgImage;
    const out = {};
    for (const coin of ['se', 'nw', 'ne', 'sw']) {
      g.angle = 0.4; g.width = 400; g.height = 300; g.x = 500; g.y = 400;
      g.cropL = 0.2; g.cropR = 0.7; g.cropT = 0.2; g.cropB = 0.7;
      const sx = coin.includes('e') ? 1 : -1, sy = coin.includes('s') ? 1 : -1;
      const oppose = g.toGlobal(-sx * 200, -sy * 150);
      const src = { L: g.cropL, R: g.cropR };
      // le coin passe de 200 à 260 en demi-largeur : la fenêtre gagne 15 %
      const cible = g.toGlobal(sx * 260, sy * 195);
      const l = g.toLocal(cible.x, cible.y);
      g.tirerCoin(coin, l.x, l.y);
      const apres = g.toGlobal(-sx * g.width / 2, -sy * g.height / 2);
      out[coin] = { bouge: +Math.hypot(apres.x - oppose.x, apres.y - oppose.y).toFixed(3),
                    w: Math.round(g.width), h: Math.round(g.height),
                    srcIntact: g.cropL === src.L && g.cropR === src.R,
                    ratio: +(g.width / g.height).toFixed(4) };
    }
    return out;
  });
  Object.entries(co).forEach(([k, v]) => console.log(`  ${k} : ${JSON.stringify(v)}`));
  ck('le coin opposé ne bouge pas (4 coins)', Object.values(co).every(v => v.bouge < 0.01));
  ck('la fenêtre gagne 15 %', Object.values(co).every(v => v.w === 460 && v.h === 345));
  ck('les proportions sont gardées', Object.values(co).every(v => Math.abs(v.ratio - 400 / 300) < 1e-4));
  ck('le cadrage de la page est inchangé', Object.values(co).every(v => v.srcIntact));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
