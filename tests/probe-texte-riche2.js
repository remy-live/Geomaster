// Une formule en gras, et la barre sur un téléphone.
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
  const errs = [];

  console.log('\n=== une formule composée, en gras et encadrée ===');
  const p1 = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p1.on('pageerror', e => errs.push(e.message));
  await p1.goto(PAGE); await p1.waitForTimeout(1500);
  const f = await p1.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const t = new TextLabel(200, 200, 'Aire = \\frac{b \\times h}{2}');
    t.fontSize = 24; a.addEntity(t);
    const em0 = t.emprise(a.ctx);
    const compter = () => { a.render();
      const d = a.ctx.getImageData(150, 150, 400, 200).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return n; };
    const nu = compter();
    t.gras = true;
    const em1 = t.emprise(a.ctx);
    const gras = compter();
    t.cadre = true; t.fond = '#e3f2fd';
    const svg = a.generateSVGString(false, 'text');
    return { nu, gras, larg0: Math.round(em0.largeur), larg1: Math.round(em1.largeur),
             haut: Math.round(em0.hauteur),
             svgGras: /font-weight="bold"/.test(svg), svgCadre: /fill="#e3f2fd"/.test(svg),
             nTextes: (svg.match(/<text/g) || []).length };
  });
  console.log('  ' + JSON.stringify(f));
  ck('la fraction est bien composée (plus haute que large ligne)', f.haut > 24 * 1.5, f.haut + 'px');
  ck('le gras épaissit la formule', f.gras > f.nu + 50, `${f.nu} → ${f.gras}`);
  ck('et l\'élargit un peu', f.larg1 > f.larg0, `${f.larg0} → ${f.larg1}`);
  ck('l\'export porte le gras sur chaque morceau', f.svgGras && f.nTextes >= 3, f.nTextes + ' fragments');
  ck('et l\'encadré', f.svgCadre === true);

  console.log('\n=== la barre de texte sur un téléphone de 390 px ===');
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(PAGE); await p2.waitForTimeout(1800);
  const box = await p2.evaluate(() => { const r = window.app.canvas.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await p2.evaluate(() => window.app.setTool('text'));
  await p2.touchscreen.tap(box.x + 120, box.y + 200); await p2.waitForTimeout(400);
  const bar = await p2.evaluate(() => {
    const t = document.getElementById('textFormatToolbar'); const r = t.getBoundingClientRect();
    const bts = ['btnTexteGras','btnTexteItal','btnTexteSoul','btnTexteCadre'].map(i => {
      const e = document.getElementById(i); const b = e.getBoundingClientRect();
      return { id: i, w: Math.round(b.width), h: Math.round(b.height),
               dessus: document.elementFromPoint(b.left + b.width/2, b.top + b.height/2) === e };
    });
    return { l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height), bts };
  });
  console.log('  ' + JSON.stringify(bar));
  ck('la barre reste dans l\'écran', bar.l >= 0 && bar.r <= 390, `${bar.l}..${bar.r}`);
  ck('elle passe à la ligne au lieu de déborder', bar.h > 40, bar.h + 'px de haut');
  ck('les quatre boutons sont cliquables au doigt',
     bar.bts.every(x => x.w >= 28 && x.h >= 28 && x.dessus), JSON.stringify(bar.bts.map(x => `${x.w}x${x.h}${x.dessus?'':'!'}`)));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0,3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
