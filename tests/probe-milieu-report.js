// Trois aimants ajoutés ensemble : le milieu d'un segment, le report d'une
// longueur au compas, et le zéro du rapporteur sur un côté de l'angle.
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
    window.__t = {
      init() { const app = window.app;
        for (const w of ['protractor','ruler','compass','setsquare']) if (!app.activeWidgets[w]) app.toggleWidget(w);
        this.ra = app.protractorWidget; this.ru = app.rulerWidget;
        this.co = app.compassWidget; this.sq = app.setSquareWidget; },
      neuf() { const app = window.app; app.entities = []; app.historyPast = []; app.saveState();
        app.setTool('select'); app.isObjectMagnetActive = true;
        for (const w of [this.ra, this.ru, this.co, this.sq]) { w.x = -4000; w.y = -4000; } },
      ev(t, s, bt) { const app = window.app, rc = app.canvas.getBoundingClientRect();
        const X = s.x*app.view.zoom+app.view.x+rc.left, Y = s.y*app.view.zoom+app.view.y+rc.top;
        (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3,
          pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:X, clientY:Y,
          bubbles:true, cancelable:true })); },
      glisser(de, vers, n) { n = n || 12; this.ev('pointerdown', de, 1);
        for (let i=1;i<=n;i++) this.ev('pointermove', {x: de.x+(vers.x-de.x)*i/n, y: de.y+(vers.y-de.y)*i/n}, 1);
        this.ev('pointerup', vers, 0); },
      segment(a, c) { const app = window.app; app.setTool('segment'); this.glisser(a, c); app.setTool('select'); },
      dernierPoint() { const p = window.app.entities.filter(e => e.constructor.name === 'Point'); return p[p.length-1]; },
      /* On ouvre le compas en visant LA MINE : la pastille de saisie est décalée
         du crayon d'un écart constant dans le repère de l'instrument, qu'il
         faut donc ajouter à l'endroit où l'on veut amener la mine. */
      ouvrir(vise) {
        const app = window.app, co = this.co;
        co.x = 700; co.y = 600; co.radius = 50; co.angle = 0;
        const po = co.constructor.pastilleOuverture(co.radius);
        const gp = co.toGlobal(po.x, po.y);
        this.ev('pointerdown', gp, 1);
        const off = app.compassResizeOffset;
        const cible = { x: co.x + vise + off.dx, y: co.y + off.dy };
        for (let i=1;i<=12;i++) this.ev('pointermove', { x: gp.x+(cible.x-gp.x)*i/12, y: gp.y+(cible.y-gp.y)*i/12 }, 1);
        this.ev('pointerup', cible, 0);
        return +co.radius.toFixed(2);
      },
      tourner(depart) {
        const ra = this.ra; ra.x = 500; ra.y = 500; ra.angle = depart;
        const g = ra.toGlobal(ra.radius + 20, 0);
        const g2 = { x: ra.x + (ra.radius+20)*Math.cos(depart+0.005), y: ra.y + (ra.radius+20)*Math.sin(depart+0.005) };
        this.glisser(g, g2, 4);
        return +(ra.angle*180/Math.PI).toFixed(2);
      },
    }; window.__t.init();`);

  const ess = (code) => page.evaluate((c) => { const t = window.__t; t.neuf(); return eval(c); }, code);

  console.log('\n=== le milieu d\'un segment s\'aimante ===');
  const m1 = await ess(`
    t.segment({x:200,y:300},{x:600,y:300});
    window.app.setTool('point'); t.glisser({x:407,y:295},{x:407,y:295},1);
    const p = t.dernierPoint();
    const seg = window.app.entities.find(e => e.constructor.name === 'Segment');
    const pose = { x:+p.x.toFixed(2), y:+p.y.toFixed(2), parents: p.parents.length };
    seg.p2.x = 800; window.app.updateDependents();
    ({ pose, apres: { x:+p.x.toFixed(2), y:+p.y.toFixed(2) } })`);
  console.log('  ' + JSON.stringify(m1));
  ck('cliqué à 9 px du milieu, le point se pose dessus', m1.pose.x === 400 && m1.pose.y === 300, JSON.stringify(m1.pose));
  ck('et c\'est un VRAI milieu : il a les deux extrémités pour parents', m1.pose.parents === 2);
  ck('le segment allongé, il reste au milieu', m1.apres.x === 500 && m1.apres.y === 300, JSON.stringify(m1.apres));

  const m2 = await ess(`
    t.segment({x:200,y:300},{x:600,y:300});
    window.app.setTool('point'); t.glisser({x:420,y:300},{x:420,y:300},1);
    +t.dernierPoint().x.toFixed(1)`);
  ck('à 20 px, il n\'est pas happé', m2 === 420, String(m2));

  const m3 = await ess(`
    window.app.isObjectMagnetActive = false;
    t.segment({x:200,y:300},{x:600,y:300});
    window.app.setTool('point'); t.glisser({x:407,y:295},{x:407,y:295},1);
    const p = t.dernierPoint(); window.app.isObjectMagnetActive = true;
    // posé sur un segment, le point garde ce segment pour parent : ce qui compte
    // ici est qu'il ne soit PAS le milieu de ses deux extrémités
    ({ x:+p.x.toFixed(1), milieu: p.parents.length === 2
        && p.parents.every(q => q.constructor.name === 'Point') })`);
  ck('aimantation coupée : plus de milieu', m3.x === 407 && !m3.milieu, JSON.stringify(m3));

  console.log('\n=== le compas reporte la longueur d\'un segment ===');
  const r1 = await ess("t.segment({x:200,y:200},{x:437,y:200}); t.ouvrir(234)");
  const r2 = await ess("t.segment({x:200,y:200},{x:437,y:200}); t.ouvrir(210)");
  const r3 = await ess("t.segment({x:200,y:200},{x:437,y:200}); window.app.isObjectMagnetActive = false;"
    + " const v = t.ouvrir(234); window.app.isObjectMagnetActive = true; v");
  console.log(`  segment de 237 px — visé 234 : ${r1} | visé 210 : ${r2} | aimant coupé : ${r3}`);
  ck('à 3 px de la longueur, l\'écartement s\'y cale exactement', Math.abs(r1 - 237) < 0.01, String(r1));
  ck('à 27 px, le compas s\'ouvre librement', Math.abs(r2 - 210) < 1, String(r2));
  ck('aimantation coupée : aucun report', Math.abs(r3 - 234) < 1, String(r3));

  // un segment trop court ne doit pas piéger les petites ouvertures
  const r4 = await ess("t.segment({x:200,y:200},{x:206,y:200}); t.ouvrir(9)");
  ck('un segment de 6 px n\'est pas une longueur à reporter', Math.abs(r4 - 9) < 1, String(r4));

  console.log('\n=== le zéro du rapporteur se cale sur un côté de l\'angle ===');
  const a = await ess(`
    t.segment({x:500,y:500},{x:800,y:500});
    t.segment({x:500,y:500},{x:500+Math.cos(-1.05)*300, y:500+Math.sin(-1.05)*300});
    ({ pres: t.tourner(0.06), loin: t.tourner(0.30), autre: t.tourner(-1.10) })`);
  console.log('  ' + JSON.stringify(a));
  ck('à 3,4° du côté horizontal : zéro posé dessus', Math.abs(a.pres) < 0.05, `${a.pres}°`);
  ck('à 17° : rien ne colle', Math.abs(a.loin - 17.19) < 1, `${a.loin}°`);
  ck('à 3° du second côté (−60,2°) : zéro posé dessus', Math.abs(a.autre + 60.16) < 0.05, `${a.autre}°`);

  // le côté doit PASSER PAR LE CENTRE : un segment parallèle ailleurs n'accroche pas
  const c = await ess(`
    t.segment({x:100,y:100},{x:400,y:100});
    ({ ailleurs: t.tourner(0.06) })`);
  ck('un segment parallèle mais éloigné n\'accroche pas', Math.abs(c.ailleurs - 3.44) < 0.6, `${c.ailleurs}°`);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
