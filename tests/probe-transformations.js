// Les transformations d'un énoncé : symétrie, translation, rotation. Ce qui est
// vérifié n'est pas que la phrase est ACCEPTÉE — c'est que la figure obtenue est
// la bonne : longueurs conservées, images au bon endroit au pixel près, et le
// point image construit EN DERNIER quand on demande les instruments.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  const AVANT = ['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm',
                 'Place les points D et E', 'Place un point O', 'Trace une droite d'];

  /* Une consigne de transformation, jouée sur la même figure de départ. On rend
     tout ce qui permet de VÉRIFIER : les points, la droite d, l'ordre dans
     lequel les entités sont entrées, et ce que la réponse a dit. */
  const essai = (phrase, instruments) => page.evaluate(([av, ph, ins]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app._cslSujet = null;
    app.view = { x: 0, y: 0, zoom: 1 };
    if (app.cslOublier) app.cslOublier();
    av.forEach(p => app.executerConsigneAvec(p, false));
    const avant = app.entities.length;
    let r;
    try { r = app.executerConsigneAvec(ph, !!ins); }
    catch (e) { r = { ok: false, message: 'EXCEPTION ' + e.message, astuce: '' }; }
    app.isPlaying = false; app.isLooping = false; app.isToolAnimating = false;
    const P = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) P[e.label] = { x: e.x, y: e.y }; });
    const dte = app.entities.find(e => e.nomDroite === 'd');
    const nom = (p) => (p && p.label) ? p.label : '·';
    return {
      ok: r.ok, message: r.message, astuce: r.astuce || '', P,
      droite: dte && dte.p1 && dte.p2 ? { a: { x: dte.p1.x, y: dte.p1.y }, b: { x: dte.p2.x, y: dte.p2.y } } : null,
      // le rang de chaque image dans la liste, et le rang de la dernière entité
      rang: Object.keys(P).filter(n => n.includes("'"))
        .map(n => [n, app.entities.findIndex(e => e.label === n)]),
      total: app.entities.length, pose: app.entities.length - avant,
      segs: [...new Set(app.entities.filter(e => e.constructor.name === 'Segment' && e.p1 && e.p2)
        .map(s => [nom(s.p1), nom(s.p2)].sort().join('')))],
      outils: app.entities.filter(e => e.constructor.name === 'ToolAnimation').length,
      arcs: app.entities.filter(e => e.constructor.name === 'CompassArc').length,
    };
  }, [AVANT, phrase, instruments]);

  const d = (P, u, v) => Math.hypot(P[u].x - P[v].x, P[u].y - P[v].y);
  const memesLongueurs = (P) => ['AB', 'AC', 'BC'].every(c =>
    Math.abs(d(P, c[0], c[1]) - d(P, c[0] + "'", c[1] + "'")) < 0.01);

  console.log('\n— La symétrie par rapport à une droite NOMMÉE');
  for (const ph of ["Construis A'B'C' symétrique de ABC par rapport à (d)",
                    "Construis A'B'C' symétrique de ABC par rapport à d"]) {
    const r = await essai(ph, false);
    ck(`« ${ph.slice(-24)} » est faite`, r.ok, r.message);
    if (!r.ok || !r.droite) continue;
    const { a, b: bb } = r.droite, dx = bb.x - a.x, dy = bb.y - a.y, l2 = dx * dx + dy * dy;
    const ecart = ['A', 'B', 'C'].map(n => {
      const p = r.P[n], k = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
      return Math.hypot(r.P[n + "'"].x - (2 * (a.x + k * dx) - p.x),
                        r.P[n + "'"].y - (2 * (a.y + k * dy) - p.y));
    });
    ck('  les trois images sont les symétriques par rapport à (d)',
       ecart.every(e => e < 0.01), ecart.map(e => e.toFixed(3)).join(' '));
  }

  console.log('\n— La translation, dite de deux façons');
  for (const ph of ["Construis A'B'C' image de ABC par la translation de vecteur DE",
                    "Construis A'B'C' image de ABC par la translation qui transforme D en E"]) {
    const r = await essai(ph, false);
    ck(`« ${ph.slice(31)} » est faite`, r.ok, r.message);
    if (!r.ok) continue;
    const vx = r.P.E.x - r.P.D.x, vy = r.P.E.y - r.P.D.y;
    const ecart = ['A', 'B', 'C'].map(n =>
      Math.hypot(r.P[n + "'"].x - (r.P[n].x + vx), r.P[n + "'"].y - (r.P[n].y + vy)));
    ck('  chaque image est à un vecteur DE de sa source',
       ecart.every(e => e < 0.01), ecart.map(e => e.toFixed(3)).join(' '));
    ck('  et le triangle image est un triangle',
       ["A'B'", "A'C'", "B'C'"].every(s => r.segs.includes(s)), r.segs.join(' '));
  }
  {
    const r = await essai("Construis A'B'C' image de ABC par la translation qui transforme D en E", false);
    ck('  « qui transforme D en E » est rendu à sa vraie écriture',
       /vecteur DE/.test(r.astuce), r.astuce);
  }

  console.log('\n— La rotation, et son sens');
  const tourne = (r, degAttendu) => ['A', 'B', 'C'].map(n => {
    const r0 = Math.hypot(r.P[n].x - r.P.O.x, r.P[n].y - r.P.O.y);
    const r1 = Math.hypot(r.P[n + "'"].x - r.P.O.x, r.P[n + "'"].y - r.P.O.y);
    let da = (Math.atan2(r.P[n + "'"].y - r.P.O.y, r.P[n + "'"].x - r.P.O.x)
            - Math.atan2(r.P[n].y - r.P.O.y, r.P[n].x - r.P.O.x)) * 180 / Math.PI;
    while (da <= -180) da += 360; while (da > 180) da -= 360;
    return Math.abs(r1 - r0) < 0.01 && Math.abs(da - degAttendu) < 0.01;
  }).every(Boolean);

  /* Sur l'écran les y descendent : le sens direct — celui des mathématiques —
     y est un angle NÉGATIF. Le sens des aiguilles d'une montre est positif. */
  for (const [ph, attendu] of [
    ["Construis A'B'C' image de ABC par la rotation de centre O, de sens direct et d'angle 30°", -30],
    ["Construis A'B'C' image de ABC par la rotation de centre O dans le sens des aiguilles d'une montre et d'angle 30°", 30],
    ["Construis A'B'C' image de ABC par la rotation de centre O, de sens horaire et d'angle 90°", 90],
    ["Construis A'B'C' image de ABC par la rotation de centre O, dans le sens inverse des aiguilles d'une montre et d'angle 90°", -90],
  ]) {
    const r = await essai(ph, false);
    ck(`« ${ph.slice(46, 100)} » est faite`, r.ok, r.message);
    if (!r.ok) continue;
    ck(`  les trois images ont tourné de ${attendu}° à l'écran, sans changer de distance à O`,
       tourne(r, attendu), JSON.stringify(r.P));
    ck('  et les longueurs sont conservées', memesLongueurs(r.P));
  }
  {
    const r = await essai("Construis A'B'C' image de ABC par la rotation de centre O et d'angle 30°", false);
    ck('  un sens non dit est signalé, pas deviné en silence',
       r.ok && /sens/.test(r.astuce), r.astuce);
  }

  console.log('\n— Ce que la phrase dit mal, et qu\'on explique');
  {
    const r = await essai("Construis A'B'C' symétrique de ABC par la translation de vecteur DE", false);
    ck('« symétrique par la translation » est fait quand même', r.ok, r.message);
    ck('  et la bonne formulation est donnée', /IMAGE/.test(r.astuce), r.astuce);
    const bulles = await page.evaluate((a) => {
      const app = window.app;
      const el = app.bulleConsigne(a);
      return { classe: el.className, lignes: el.querySelectorAll('p').length,
               gras: [...el.querySelectorAll('b')].map(x => x.textContent.trim()) };
    }, r.astuce);
    ck('  la bulle est une bulle, avec le mot en gras',
       bulles.classe === 'csl-bulle' && bulles.lignes >= 1 && /Formulation/.test(bulles.gras.join(' ')),
       JSON.stringify(bulles));
  }
  {
    const r = await essai("Construis l'image de ABC par l'homothétie de centre O et de rapport 2", false);
    ck("l'homothétie est refusée en disant que c'est elle qui manque",
       !r.ok && /homoth/i.test(r.message), r.message);
  }

  console.log('\n— Aux instruments : le point image n\'apparaît qu\'à la fin');
  for (const ph of ["Construis A'B'C' image de ABC par la translation de vecteur DE",
                    "Construis A'B'C' image de ABC par la rotation de centre O, de sens direct et d'angle 40°",
                    "Construis A'B'C' symétrique de ABC par rapport à (d)"]) {
    const r = await essai(ph, true);
    ck(`« ${ph.slice(24, 60)}… » se construit`, r.ok, r.message);
    if (!r.ok) continue;
    ck('  les instruments sont posés', r.outils >= 3 && r.arcs >= 3, `outils ${r.outils}, arcs ${r.arcs}`);
    ck('  et les longueurs sont justes', memesLongueurs(r.P), JSON.stringify(r.rang));
    /* Chaque image entre APRÈS le début de sa propre construction : elles sont
       dans le dernier tiers de la liste, jamais posées d'avance. */
    const rangs = r.rang.map(x => x[1]).sort((a, c) => a - c);
    ck('  aucune image n\'est posée avant sa construction',
       rangs[0] > r.total * 0.4, `rangs ${rangs.join(',')} sur ${r.total}`);
    ck('  et le triangle image est relié',
       ["A'B'", "A'C'", "B'C'"].every(s => r.segs.includes(s)), r.segs.join(' '));
  }

  console.log('\n— Le trait de construction reste un trait de construction');
  {
    /* Un trait léger écrit en rgba() ne passait pas le code compact : la
       palette n'en connaît pas l'équivalent, et il revenait NOIR PLEIN. La
       construction partagée par lien montrait alors, en plein trait, des
       droites qu'on efface au crayon. */
    const r = await page.evaluate(([av]) => {
      const app = window.app;
      app.entities = []; app.historyPast = []; app.stepInstructions = {};
      if (app.cslOublier) app.cslOublier();
      av.forEach(p => app.executerConsigneAvec(p, false));
      app.executerConsigneAvec("Construis A'B'C' image de ABC par la rotation de centre O, "
        + "de sens direct et d'angle 40°", true);
      const lire = () => app.entities.filter(e => e.constructor.name === 'Segment')
        .map(s => (s.color || '-') + '/' + (s.dash && s.dash.length ? 'pointillés' : 'plein'));
      const avant = lire();
      const code = app.getCompressedString();
      app.entities = []; app.loadFromCompressedString(code);
      return { avant, apres: lire() };
    }, [AVANT]);
    ck('les traits légers de la construction voyagent tels quels',
       r.avant.join(' ') === r.apres.join(' '), `${r.avant.join(' ')}\n      contre ${r.apres.join(' ')}`);
    ck('et aucun n\'est devenu un trait plein noir',
       !r.apres.some((s, i) => /^#000000\/plein$/.test(s) && !/^#000000\/plein$/.test(r.avant[i])),
       r.apres.join(' '));
  }

  console.log('\n— « Sans les outils » : la figure, et rien d\'autre');
  {
    const cv = await page.locator('#geoCanvas').boundingBox();
    const carre = async (nu) => {
      await page.evaluate((n) => {
        const app = window.app;
        app.entities = []; app.historyPast = []; app.stepInstructions = {};
        app.sansOutil = n; app.magicAnimate = false; app.setTool('magic_square');
      }, nu);
      await page.mouse.click(cv.x + 250, cv.y + 250); await page.waitForTimeout(150);
      await page.mouse.click(cv.x + 450, cv.y + 250); await page.waitForTimeout(500);
      return page.evaluate(() => {
        const app = window.app; const c = {};
        app.entities.forEach(e => { c[e.constructor.name] = (c[e.constructor.name] || 0) + 1; });
        return { c, n: app.entities.length,
                 traits: app.entities.filter(e => e.dash && e.dash.length).length };
      });
    };
    const avec = await carre(false), nu = await carre(true);
    ck('avec les outils, le carré porte sa construction',
       avec.c.ToolAnimation > 0 && avec.c.CompassArc > 0, JSON.stringify(avec.c));
    ck('sans les outils, il n\'en reste rien',
       !nu.c.ToolAnimation && !nu.c.CompassArc && !nu.traits, JSON.stringify(nu.c));
    ck('mais le carré, lui, est entier',
       nu.c.Point === avec.c.Point && nu.c.Segment === avec.c.Segment && nu.c.Angle === avec.c.Angle,
       `${JSON.stringify(nu.c)} contre ${JSON.stringify(avec.c)}`);
    // la case « avec les instruments » d'une ligne l'emporte sur le réglage général
    await page.evaluate(() => { window.app.sansOutil = true; });
    const r = await essai("Construis A'B'C' image de ABC par la translation de vecteur DE", true);
    ck('et la case « avec les instruments » d\'une consigne l\'emporte',
       r.outils > 0 && r.arcs > 0, `outils ${r.outils}, arcs ${r.arcs}`);
    await page.evaluate(() => { window.app.sansOutil = false; });
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
