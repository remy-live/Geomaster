// Le reconnaisseur voit-il juste, et refuse-t-il quand il faut ?
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

  // générateurs de tracés à main levée : bruit gaussien + départ arbitraire
  const HARNESS = `
  window.__c = {
    alea: (s) => { let x = s; return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; },
    bruit(pts, amp, s) { const r = this.alea(s); return pts.map(p => ({
      x: p.x + (r() - 0.5) * amp, y: p.y + (r() - 0.5) * amp })); },
    cercle(cx, cy, r, n, depart) { const o = []; for (let i = 0; i <= n; i++) {
      const a = (depart || 0) + i / n * Math.PI * 2; o.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }); } return o; },
    polygone(sommets, parCote, decalage) {
      const o = []; const n = sommets.length;
      for (let k = 0; k < n; k++) { const A = sommets[k], B = sommets[(k + 1) % n];
        for (let i = 0; i < parCote; i++) { const t = i / parCote; o.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t }); } }
      o.push({ x: sommets[0].x, y: sommets[0].y });
      if (decalage) return o.slice(decalage).concat(o.slice(0, decalage));
      return o; },
    ligne(a, bb, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n;
      o.push({ x: a.x + (bb.x - a.x) * t, y: a.y + (bb.y - a.y) * t }); } return o; },
    tourne(pts, th, cx, cy) { return pts.map(p => ({
      x: cx + (p.x - cx) * Math.cos(th) - (p.y - cy) * Math.sin(th),
      y: cy + (p.x - cx) * Math.sin(th) + (p.y - cy) * Math.cos(th) })); },
  };`;
  await page.evaluate(HARNESS);

  const essai = (nom, code, attendu, tol) => page.evaluate(({ code, attendu }) => {
    const t = window.__c;
    const pts = eval(code);
    const r = GmCroquis.reconnaitre(pts);
    return { forme: r ? r.forme : null, r };
  }, { code, attendu }).then(res => {
    ck(`${nom} → ${attendu}`, res.forme === attendu, `obtenu ${res.forme}`);
    return res.r;
  });

  console.log('\n=== formes franches, main tremblante (bruit 4px) ===');
  await essai('cercle r=120', "t.bruit(t.cercle(400,400,120,90),4,7)", 'cercle');
  await essai('cercle r=40', "t.bruit(t.cercle(400,400,40,60),3,11)", 'cercle');
  await essai('carré 200', "t.bruit(t.polygone([{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}],14),4,3)", 'carre');
  await essai('carré incliné 25°', "t.bruit(t.tourne(t.polygone([{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}],14),0.44,400,400),4,5)", 'carre');
  await essai('rectangle 260x140', "t.bruit(t.polygone([{x:300,y:300},{x:560,y:300},{x:560,y:440},{x:300,y:440}],14),4,9)", 'rectangle');
  await essai('triangle équilatéral', "t.bruit(t.polygone([{x:300,y:460},{x:500,y:460},{x:400,y:287}],16),4,13)", 'triangle_equilateral');
  await essai('triangle quelconque', "t.bruit(t.polygone([{x:300,y:460},{x:560,y:430},{x:380,y:280}],16),4,17)", 'triangle');
  await essai('segment', "t.bruit(t.ligne({x:300,y:300},{x:600,y:420},40),3,19)", 'segment');

  console.log('\n=== départ au milieu d\'un côté (faux coin) ===');
  await essai('carré démarré au milieu', "t.bruit(t.polygone([{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}],14,7),4,23)", 'carre');
  await essai('triangle démarré au milieu', "t.bruit(t.polygone([{x:300,y:460},{x:500,y:460},{x:400,y:287}],16,8),4,29)", 'triangle_equilateral');

  console.log('\n=== main plus tremblante (bruit 9px) ===');
  await essai('cercle', "t.bruit(t.cercle(400,400,140,90),9,31)", 'cercle');
  await essai('carré', "t.bruit(t.polygone([{x:280,y:280},{x:520,y:280},{x:520,y:520},{x:280,y:520}],16),9,37)", 'carre');

  console.log('\n=== ce qu\'il doit REFUSER plutôt que deviner ===');
  await essai('gribouillis', "t.bruit(t.cercle(400,400,120,90),70,41)", null);
  await essai('figure minuscule', "t.bruit(t.polygone([{x:400,y:400},{x:415,y:400},{x:415,y:415},{x:400,y:415}],6),1,43)", null);
  // vrai losange : côtés égaux, angles NON droits (diagonales inégales)
  await essai('losange', "t.bruit(t.polygone([{x:400,y:300},{x:520,y:400},{x:400,y:500},{x:280,y:400}],14),3,47)", 'losange');
  // le « losange » à diagonales égales EST un carré tourné : on doit le voir
  await essai('carré tourné de 45°', "t.bruit(t.polygone([{x:400,y:280},{x:520,y:400},{x:400,y:520},{x:280,y:400}],14),3,47)", 'carre');
  await essai('courbe ouverte quelconque', "t.bruit(t.cercle(400,400,120,40).slice(0,22),4,53)", null);

  console.log('\n=== précision de ce qui est mesuré ===');
  const c = await essai('cercle mesuré', "t.bruit(t.cercle(500,350,133,90),4,59)", 'cercle') || {cx:0,cy:0,r:0};
  console.log(`  centre (${c.cx.toFixed(1)}, ${c.cy.toFixed(1)}) rayon ${c.r.toFixed(1)}`);
  ck('centre à moins de 3px', Math.hypot(c.cx - 500, c.cy - 350) < 3);
  ck('rayon à moins de 3px', Math.abs(c.r - 133) < 3);
  const q = await essai('carré mesuré', "t.bruit(t.tourne(t.polygone([{x:300,y:300},{x:520,y:300},{x:520,y:520},{x:300,y:520}],16),0.3,410,410),4,61)", 'carre') || {centre:{x:0,y:0},cote:0,theta:0};
  console.log(`  centre (${q.centre.x.toFixed(1)}, ${q.centre.y.toFixed(1)}) côté ${q.cote.toFixed(1)} θ ${(q.theta*180/Math.PI).toFixed(1)}°`);
  ck('centre du carré à moins de 4px', Math.hypot(q.centre.x - 410, q.centre.y - 410) < 4);
  ck('côté à moins de 6px de 220', Math.abs(q.cote - 220) < 6, q.cote.toFixed(1));
  const th = ((q.theta * 180 / Math.PI) % 90 + 90) % 90;
  ck('orientation à moins de 2° de 17.2°', Math.abs(th - 17.19) < 2, th.toFixed(2));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
