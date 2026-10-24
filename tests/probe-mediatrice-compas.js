// Le geste de 6e, à la souris et rien qu'à la souris : planter le compas sur A,
// l'écarter, le faire pivoter, tracer ; recommencer depuis B. Les deux arcs
// doivent se couper — c'est la construction de la médiatrice.
//
// Les sondes existantes posent le compas en écrivant w.x, w.y, w.angle et
// w.radius. Celle-ci n'écrit rien : elle tire sur les quatre zones de prise
// comme le ferait une main, et vérifie ensuite que les arcs enregistrés se
// coupent VRAIMENT — intersection de deux cercles, puis appartenance du point
// aux deux arcs réellement tracés. Un arc tracé du mauvais côté passerait
// toutes les autres vérifications et raterait celle-ci.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

const A = { x: 300, y: 300 }, B = { x: 720, y: 300 }, R = 280;
// Les croisements sont à ±41,4° de chaque pointe : on balaie 130° de part et
// d'autre, donc les deux points d'intersection tombent sur les deux arcs.
const DEG = Math.PI / 180, DEPART_A = -65 * DEG, DEPART_B = 115 * DEG, BALAYAGE = 130 * DEG;

// Les quatre prises du compas, lues dans le widget lui-même : si une zone
// change de place, c'est ici que la sonde s'en aperçoit.
const PRISES = () => {
  const w = window.app.compassWidget;
  const leg = Math.max(w.legLength || 320, (w.radius / 2) + 20);
  const h = Math.sqrt(leg ** 2 - (w.radius / 2) ** 2);
  const po = w.constructor.pastilleOuverture(w.radius);
  const prise = (lx, ly) => { const g = w.toGlobal(lx, ly); return { p: g, zone: w.getHitZone(g.x, g.y) }; };
  return {
    centre: { x: w.x, y: w.y }, r: w.radius, angle: w.angle, h,
    branche: prise(w.radius / 4, -h / 2), pastille: prise(po.x, po.y),
    crayon: prise(w.radius, -20), pivot: prise(w.radius / 2, -h - 25),
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);
  await page.evaluate(() => { const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    const d = document.getElementById('gmDecor'); if (d) d.style.display = 'none'; });

  const cadre = await page.evaluate(() => { const r = window.app.canvas.getBoundingClientRect(), v = window.app.view;
    return { l: r.left, t: r.top, z: v.zoom, vx: v.x, vy: v.y }; });
  const vers = (p) => ({ x: cadre.l + cadre.vx + p.x * cadre.z, y: cadre.t + cadre.vy + p.y * cadre.z });
  // Un geste dans le vide ne prouve rien : on exige que le point de saisie
  // tombe sur la toile avant de tirer dessus.
  const surToile = async (pt, quoi) => {
    const sous = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y);
      return e ? (e.id || e.tagName) : 'rien'; }, pt);
    ck(`${quoi} tombe sur la toile`, /canvas/i.test(sous), `(${Math.round(pt.x)},${Math.round(pt.y)}) → ${sous}`);
  };
  const glisser = async (de, a, n = 20) => {
    await page.mouse.move(de.x, de.y); await page.mouse.down();
    for (let k = 1; k <= n; k++) { await page.mouse.move(de.x + (a.x - de.x) * k / n, de.y + (a.y - de.y) * k / n); await page.waitForTimeout(8); }
    await page.mouse.up(); await page.waitForTimeout(140);
  };

  // Un segment [AB] posé à l'horizontale : le reste se fait à la souris.
  await page.evaluate(({ a, bb }) => {
    window.app.executerConsigneAvec('Trace un segment [AB] de longueur 6 cm', false);
    const pts = window.app.entities.filter(e => e.constructor.name === 'Point');
    const pa = pts.find(p => p.label === 'A'), pb = pts.find(p => p.label === 'B');
    if (pa) { pa.x = a.x; pa.y = a.y; } if (pb) { pb.x = bb.x; pb.y = bb.y; }
    window.app.entities.forEach(e => e.update && e.update());
    window.app.updateDependents && window.app.updateDependents(); window.app.render();
  }, { a: A, bb: B });
  await page.locator('#btn-compass').click();
  await page.waitForTimeout(300);
  ck('le bouton allume le compas', await page.evaluate(() => !!window.app.activeWidgets.compass && !!window.app.compassWidget));

  // 1. planter la pointe sur A
  let pr = await page.evaluate(PRISES);
  ck('la branche répond « déplacer »', pr.branche.zone === 'move', 'zone=' + pr.branche.zone);
  let de = vers(pr.branche.p);
  await surToile(de, 'la branche');
  await glisser(de, { x: de.x + (A.x - pr.centre.x) * cadre.z, y: de.y + (A.y - pr.centre.y) * cadre.z });
  pr = await page.evaluate(PRISES);
  ck('la pointe se plante sur A', Math.hypot(pr.centre.x - A.x, pr.centre.y - A.y) < 3,
     `(${Math.round(pr.centre.x)},${Math.round(pr.centre.y)}) visé (${A.x},${A.y})`);

  // 2. écarter à R
  ck('la pastille répond « ouvrir »', pr.pastille.zone === 'resize', 'zone=' + pr.pastille.zone);
  de = vers(pr.pastille.p);
  await surToile(de, "la pastille d'ouverture");
  await glisser(de, { x: de.x + (R - pr.r) * cadre.z, y: de.y });
  pr = await page.evaluate(PRISES);
  ck("l'écartement obéit au geste", Math.abs(pr.r - R) < 8, `${Math.round(pr.r)} px visé ${R}`);

  // 3. pivoter, sans déplanter la pointe
  const pivoter = async (vise) => {
    const q = await page.evaluate(PRISES);
    ck('le bouton du haut répond « pivoter »', q.pivot.zone === 'rotate', 'zone=' + q.pivot.zone);
    const d = Math.hypot(q.r / 2, q.h + 25), biais = Math.atan2(-(q.h + 25), q.r / 2);
    const dep = vers(q.pivot.p);
    await surToile(dep, 'le bouton de rotation');
    await glisser(dep, vers({ x: q.centre.x + d * Math.cos(vise + biais), y: q.centre.y + d * Math.sin(vise + biais) }), 24);
  };
  const deg = (x) => ((x * 180 / Math.PI) % 360 + 540) % 360 - 180;
  await pivoter(DEPART_A);
  pr = await page.evaluate(PRISES);
  ck("l'angle atteint la cible", Math.abs(deg(pr.angle - DEPART_A)) < 12,
     `${Math.round(deg(pr.angle))}° visé ${Math.round(deg(DEPART_A))}°`);
  ck('la pointe est restée plantée pendant la rotation',
     Math.hypot(pr.centre.x - A.x, pr.centre.y - A.y) < 6,
     `(${Math.round(pr.centre.x)},${Math.round(pr.centre.y)})`);

  // 4. tracer
  const tracer = async (balayage) => {
    const q = await page.evaluate(PRISES);
    ck('le crayon répond « tracer »', q.crayon.zone === 'trace', 'zone=' + q.crayon.zone);
    const dep = vers(q.crayon.p);
    await surToile(dep, 'le crayon');
    await page.mouse.move(dep.x, dep.y); await page.mouse.down();
    for (let k = 0; k <= 36; k++) {
      const a = q.angle + (k / 36) * balayage;
      const p = vers({ x: q.centre.x + q.r * Math.cos(a), y: q.centre.y + q.r * Math.sin(a) });
      await page.mouse.move(p.x, p.y); await page.waitForTimeout(8);
    }
    await page.mouse.up(); await page.waitForTimeout(200);
  };
  await tracer(BALAYAGE);
  ck('le premier arc est né', await page.evaluate(() => window.app.entities.filter(e => /Arc/.test(e.constructor.name)).length) === 1);

  // 5. recommencer depuis B
  pr = await page.evaluate(PRISES);
  de = vers(pr.branche.p);
  await surToile(de, 'la branche (second geste)');
  await glisser(de, { x: de.x + (B.x - pr.centre.x) * cadre.z, y: de.y + (B.y - pr.centre.y) * cadre.z });
  pr = await page.evaluate(PRISES);
  ck('la pointe se plante sur B', Math.hypot(pr.centre.x - B.x, pr.centre.y - B.y) < 3,
     `(${Math.round(pr.centre.x)},${Math.round(pr.centre.y)})`);
  ck("l'écartement n'a pas bougé en chemin", Math.abs(pr.r - R) < 8, Math.round(pr.r) + ' px');
  await pivoter(DEPART_B);
  await tracer(BALAYAGE);

  // 6. le théorème : les deux arcs se coupent, et aux bons endroits
  const arcs = await page.evaluate(() => window.app.entities.filter(e => /Arc/.test(e.constructor.name))
    .map(a => ({ x: a.center ? a.center.x : a.x, y: a.center ? a.center.y : a.y, r: a.radius,
      s: a.startAngle * 180 / Math.PI, e: a.endAngle * 180 / Math.PI })));
  ck('deux arcs, et deux seulement', arcs.length === 2, arcs.length + ' arc(s)');
  if (arcs.length === 2) {
    const [p, q] = arcs;
    ck('chaque arc est centré sur sa pointe',
       Math.hypot(p.x - A.x, p.y - A.y) < 4 && Math.hypot(q.x - B.x, q.y - B.y) < 4,
       `(${Math.round(p.x)},${Math.round(p.y)}) et (${Math.round(q.x)},${Math.round(q.y)})`);
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    const possible = d < p.r + q.r && d > Math.abs(p.r - q.r);
    ck('les deux cercles se coupent', possible, `d=${Math.round(d)} r=${Math.round(p.r)} et ${Math.round(q.r)}`);
    if (possible) {
      const a0 = (d * d + p.r * p.r - q.r * q.r) / (2 * d);
      const hh = Math.sqrt(Math.max(0, p.r * p.r - a0 * a0));
      const mx = p.x + a0 * (q.x - p.x) / d, my = p.y + a0 * (q.y - p.y) / d;
      const I = [{ x: mx + hh * (q.y - p.y) / d, y: my - hh * (q.x - p.x) / d },
                 { x: mx - hh * (q.y - p.y) / d, y: my + hh * (q.x - p.x) / d }];
      const norm = (v) => ((v % 360) + 360) % 360;
      const dedans = (arc, pt) => { const v = norm(Math.atan2(pt.y - arc.y, pt.x - arc.x) * 180 / Math.PI);
        const s = norm(arc.s), e = norm(arc.e);
        return s <= e ? (v >= s - 3 && v <= e + 3) : (v >= s - 3 || v <= e + 3); };
      const vus = I.filter(pt => dedans(p, pt) && dedans(q, pt));
      ck('les deux croisements tombent sur les arcs TRACÉS', vus.length === 2,
         I.map(pt => `(${Math.round(pt.x)},${Math.round(pt.y)})`).join(' ') + ` → ${vus.length} sur 2`);
      ck('ils encadrent [AB], un de chaque côté',
         vus.length === 2 && (vus[0].y - A.y) * (vus[1].y - A.y) < 0,
         vus.map(pt => Math.round(pt.y)).join(' et ') + ` pour y(A)=${A.y}`);
      // vus.every() sur un tableau vide répond « vrai » : sans le compte, cette
      // ligne passerait au vert en ne mesurant rien du tout.
      ck('ils sont sur la perpendiculaire au milieu',
         vus.length === 2 && vus.every(pt => Math.abs(pt.x - (A.x + B.x) / 2) < 2),
         'x = ' + vus.map(pt => Math.round(pt.x)).join(', ') + `, milieu ${(A.x + B.x) / 2}`);
    }
  }

  // 7. ranger le compas ne doit pas emporter le tracé
  await page.locator('#btn-compass').click();
  await page.waitForTimeout(250);
  ck('un second clic range le compas', await page.evaluate(() => !window.app.activeWidgets.compass));
  ck('les arcs restent après le rangement',
     await page.evaluate(() => window.app.entities.filter(e => /Arc/.test(e.constructor.name)).length) === 2);

  ck('aucune erreur JS', errs.length === 0, errs[0] || '');
  await b.close();
  console.log(fail ? `  ${fail} échec(s)` : '  tout vert');
  process.exit(fail ? 1 : 0);
})();
