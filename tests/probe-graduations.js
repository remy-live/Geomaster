// Pointe du compas posée sur le zéro d'un instrument : la mine doit rester le
// long des graduations pendant qu'on écarte, sans s'y coller de trop loin.
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

  await page.evaluate(`
    window.__g = {
      init() {
        const app = window.app;
        for (const w of ['setsquare','ruler','compass']) if (!app.activeWidgets[w]) app.toggleWidget(w);
        this.sq = app.setSquareWidget; this.ru = app.rulerWidget; this.co = app.compassWidget;
      },
      neuf() { const app = window.app; app.entities = []; app.historyPast = []; app.saveState();
        app.setTool('select'); app.isObjectMagnetActive = true;
        for (const w of [this.sq, this.ru, this.co]) { w.x = -4000; w.y = -4000; } },
      ev(t, s, bt) { const app = window.app, rc = app.canvas.getBoundingClientRect();
        const X = s.x*app.view.zoom+app.view.x+rc.left, Y = s.y*app.view.zoom+app.view.y+rc.top;
        (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3,
          pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:X, clientY:Y,
          bubbles:true, cancelable:true })); },
      glisser(de, vers, n) { n = n || 12; this.ev('pointerdown', de, 1);
        for (let i=1;i<=n;i++) this.ev('pointermove', {x: de.x+(vers.x-de.x)*i/n, y: de.y+(vers.y-de.y)*i/n}, 1);
        this.ev('pointerup', vers, 0); },
      /* On ouvre le compas en visant LA MINE, pas la souris : la pastille de
         saisie est décalée du crayon d'un écart constant (dx, dy) dans le
         repère de l'instrument. Pour amener la mine à un endroit voulu, le
         curseur doit donc aller à cet endroit PLUS l'écart, tourné de l'angle
         du compas. Viser la souris reviendrait à mesurer le décalage de la
         pastille, pas l'aimantation. */
      ouvrir(org, aBord, longueur, derive) {
        const app = window.app, co = this.co;
        co.x = org.x; co.y = org.y; co.radius = 50; co.angle = aBord;
        const po = co.constructor.pastilleOuverture(co.radius);
        const gp = co.toGlobal(po.x, po.y);
        this.ev('pointerdown', gp, 1);
        const off = app.compassResizeOffset;
        const ux = Math.cos(aBord), uy = Math.sin(aBord);
        const mine = { x: org.x + longueur*ux - derive*uy, y: org.y + longueur*uy + derive*ux };
        const r = Math.hypot(mine.x-co.x, mine.y-co.y), a = Math.atan2(mine.y-co.y, mine.x-co.x);
        const cible = { x: co.x + (r+off.dx)*Math.cos(a) - off.dy*Math.sin(a),
                        y: co.y + (r+off.dx)*Math.sin(a) + off.dy*Math.cos(a) };
        for (let i=1;i<=12;i++) this.ev('pointermove', { x: gp.x+(cible.x-gp.x)*i/12, y: gp.y+(cible.y-gp.y)*i/12 }, 1);
        this.ev('pointerup', cible, 0);
        const tip = { x: co.x + co.radius*Math.cos(co.angle), y: co.y + co.radius*Math.sin(co.angle) };
        return { ecart: +Math.abs((tip.x-org.x)*uy - (tip.y-org.y)*ux).toFixed(2), rayon: +co.radius.toFixed(1) };
      },
    }; window.__g.init();`);

  const essai = (code) => page.evaluate((c) => { const g = window.__g; g.neuf(); return eval(c); }, code);

  console.log('\n=== la mine suit les graduations de la règle ===');
  const r1 = await essai("g.ru.x=300; g.ru.y=700; g.ru.angle=0; g.ouvrir(g.ru.toGlobal(0,0), 0, 250, -7)");
  console.log('  dérive de 7 px : ' + JSON.stringify(r1));
  ck('la mine revient sur le bord gradué', r1.ecart < 0.5, String(r1.ecart));
  ck('l\'écartement lu est celui visé (250)', Math.abs(r1.rayon - 250) < 0.5, String(r1.rayon));

  const r2 = await essai("g.ru.x=300; g.ru.y=650; g.ru.angle=0.6; g.ouvrir(g.ru.toGlobal(0,0), 0.6, 250, -7)");
  console.log('  règle inclinée de 34° : ' + JSON.stringify(r2));
  ck('inclinée, la mine suit aussi', r2.ecart < 0.5 && Math.abs(r2.rayon - 250) < 0.5, JSON.stringify(r2));

  console.log('\n=== mais l\'aimant ne va pas la chercher de loin ===');
  const r3 = await essai("g.ru.x=300; g.ru.y=700; g.ru.angle=0; g.ouvrir(g.ru.toGlobal(0,0), 0, 250, -40)");
  console.log('  dérive de 40 px : ' + JSON.stringify(r3));
  ck('à 40 px du bord, le compas s\'ouvre librement', r3.ecart > 30, String(r3.ecart));

  const r4 = await essai("g.ru.x=300; g.ru.y=700; g.ru.angle=0; g.co.y = g.ru.toGlobal(0,0).y - 30;"
    + " g.ouvrir({x: g.ru.toGlobal(0,0).x, y: g.ru.toGlobal(0,0).y - 30}, 0, 250, -7)");
  console.log('  pointe posée à 30 px du bord : ' + JSON.stringify(r4));
  ck('pointe hors du bord : aucune aimantation', r4.ecart > 5, String(r4.ecart));

  console.log('\n=== l\'équerre est graduée sur ses deux bords ===');
  const r5 = await essai("g.sq.x=400; g.sq.y=400; g.sq.angle=0.3; g.ouvrir(g.sq.toGlobal(0,0), 0.3, 180, 6)");
  const r6 = await essai("g.sq.x=400; g.sq.y=400; g.sq.angle=0.3;"
    + " g.ouvrir(g.sq.toGlobal(0,0), 0.3+Math.PI/2, 150, -6)");
  console.log('  bord de la base : ' + JSON.stringify(r5) + ' | bord de la hauteur : ' + JSON.stringify(r6));
  ck('la mine suit la base de l\'équerre', r5.ecart < 0.5 && Math.abs(r5.rayon - 180) < 0.5, JSON.stringify(r5));
  ck('et sa hauteur', r6.ecart < 0.5 && Math.abs(r6.rayon - 150) < 0.5, JSON.stringify(r6));

  console.log('\n=== la pointe se pose sur le zéro de l\'équerre ===');
  const r7 = await page.evaluate(() => {
    const g = window.__g; g.neuf();
    g.sq.x = 400; g.sq.y = 400; g.sq.angle = 0.3;
    const s0 = g.sq.toGlobal(0, 0);
    g.co.x = 700; g.co.y = 700; g.co.radius = 80; g.co.angle = 0;
    g.glisser({ x: 700, y: 700 }, { x: s0.x + 10, y: s0.y + 9 });
    const proche = +Math.hypot(g.co.x - s0.x, g.co.y - s0.y).toFixed(2);
    g.co.x = 700; g.co.y = 700;
    g.glisser({ x: 700, y: 700 }, { x: s0.x + 45, y: s0.y + 40 });
    return { proche, loin: +Math.hypot(g.co.x - s0.x, g.co.y - s0.y).toFixed(2) };
  });
  console.log('  ' + JSON.stringify(r7));
  ck('à 13 px de l\'angle droit : la pointe s\'y pose', r7.proche < 1.5, String(r7.proche));
  ck('à 60 px : elle reste où on la lâche', r7.loin > 20, String(r7.loin));

  console.log('\n=== l\'aimant coupé coupe tout ===');
  const r8 = await page.evaluate(() => {
    const g = window.__g; g.neuf();
    window.app.isObjectMagnetActive = false;
    g.ru.x = 300; g.ru.y = 700; g.ru.angle = 0;
    const r = g.ouvrir(g.ru.toGlobal(0, 0), 0, 250, -7);
    window.app.isObjectMagnetActive = true;
    return r;
  });
  console.log('  ' + JSON.stringify(r8));
  ck('aimantation aux objets coupée : la mine ne colle plus', Math.abs(r8.ecart - 7) < 1, String(r8.ecart));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
