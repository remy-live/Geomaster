// Coller un énoncé de construction entier — celui d'un vrai devoir — et
// obtenir la figure, sans retoucher une ligne.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

/* L'énoncé est recopié tel quel, ponctuation et intertitres compris : c'est
   exactement ce qu'un professeur colle depuis son traitement de texte. */
const ENONCE = `Trace un segment [OQ] de 6 cm de longueur, place le milieu P du segment [OQ] et le milieu R du segment [OP].
Trace le cercle C1 de centre O et de rayon 6 cm.
Trace le cercle C2 de centre R et de rayon 7 cm, il coupe le cercle C1 en deux points A et B.
Trace le cercle C3 de centre Q et de rayon 4 cm.

Étape 2
Trace le cercle de centre A et de rayon 3 cm, il coupe le cercle C2 en deux points dont un est appelé C.
Trace le cercle de centre B et de rayon 3 cm, il coupe le cercle C2 en deux points dont un est appelé D.
Trace la demi-droite [QC), elle coupe le cercle C3 en E.
Trace le cercle de centre E et de rayon 2 cm.
Trace la demi-droite [QD), elle coupe le cercle C3 en F.
Trace le cercle de centre F et de rayon 2 cm.

Étape 3
Trace le segment [AQ], place le point G sur ce segment tel que GQ=5 cm.
Trace le segment [BQ], place le point H sur ce segment tel que HQ=5 cm.
Trace le cercle de centre G et de rayon 1 cm et le cercle de centre G et de rayon 6 mm.
Trace le cercle de centre H et de rayon 1 cm et le cercle de centre H et de rayon 6 mm.
La droite (OQ) coupe le cercle C3 en S tel que S n'appartienne pas à [OQ].

Étape 4
Trace le cercle de centre G et de rayon 6,5 cm,
il coupe [QS] en T.
Trace le cercle de centre H et de rayon 6,5 cm.
Trace le cercle de centre T et de rayon 3,2 cm.`;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  console.log('\n=== on colle l\'énoncé dans le panneau ===');
  await page.evaluate((txt) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.view = { x: 0, y: 0, zoom: 1 }; app.saveState();
    const boite = document.getElementById('instructionBox');
    if (boite.style.display === 'none' || !boite.style.display) app.toggleInstructions();
    app._consignes = []; app.majConsignes();
    app.collerEnonce(0, txt);
  }, ENONCE);
  await page.waitForTimeout(300);
  const lignes = await page.evaluate(() => document.querySelectorAll('.csl-ligne').length);
  console.log('  ' + lignes + ' lignes');
  /* Un énoncé collé se répartit en lignes : sans cela il arrive tout entier
     dans une seule case, où il ne veut plus rien dire. */
  ck('chaque ligne de l\'énoncé devient une consigne', lignes === 22, String(lignes));

  console.log('\n=== « ▶ Tout faire » : et la figure est là ===');
  const fait = await page.evaluate(() => {
    window.app.executerToutesConsignes();
    return {
      refusees: window.app.consignesListe()
        .filter(c => (c.texte || '').trim() && c.etat === 'rate')
        .map(c => c.texte + ' → ' + c.message),
      faites: window.app.consignesListe().filter(c => c.faite).length,
    };
  });
  fait.refusees.forEach(r => console.log('  ✗ ' + r));
  ck('aucune ligne n\'est refusée', fait.refusees.length === 0,
     String(fait.refusees.length) + ' refus');

  console.log('\n=== la figure est-elle JUSTE ? ===');
  /* Une figure qui « sort » ne prouve rien : ce sont les longueurs de l'énoncé
     qu'il faut retrouver sur la feuille, au dixième de millimètre près. */
  const g = await page.evaluate(() => {
    const app = window.app;
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const cm = (x, y) => { const a = pt(x), c = pt(y); return a && c ? +(Math.hypot(a.x - c.x, a.y - c.y) / 50).toFixed(3) : null; };
    const cercles = app.entities.filter(e => e.constructor.name === 'Circle');
    const rayon = (c) => +(Math.hypot(c.p1.x - c.p2.x, c.p1.y - c.p2.y) / 50).toFixed(3);
    const O = pt('O'), Q = pt('Q'), S = pt('S');
    // S est-il hors du segment [OQ] ? (le paramètre le long de (OQ) doit dépasser 1)
    const k = O && Q && S ? ((S.x - O.x) * (Q.x - O.x) + (S.y - O.y) * (Q.y - O.y))
        / ((Q.x - O.x) ** 2 + (Q.y - O.y) ** 2) : null;
    return {
      noms: app.entities.filter(e => e.constructor.name === 'Point' && e.label).map(e => e.label).join(''),
      cercles: cercles.length,
      rayons: cercles.map(rayon),
      OQ: cm('O', 'Q'), OP: cm('O', 'P'), PQ: cm('P', 'Q'), OR: cm('O', 'R'), RP: cm('R', 'P'),
      OA: cm('O', 'A'), OB: cm('O', 'B'), RA: cm('R', 'A'), RB: cm('R', 'B'),
      AC: cm('A', 'C'), RC: cm('R', 'C'), BD: cm('B', 'D'),
      QE: cm('Q', 'E'), QF: cm('Q', 'F'), QS: cm('Q', 'S'),
      GQ: cm('G', 'Q'), HQ: cm('H', 'Q'), GT: cm('G', 'T'),
      kS: k === null ? null : +k.toFixed(3),
    };
  });
  console.log('  ' + JSON.stringify(g));
  const pres = (a, b) => a !== null && Math.abs(a - b) < 0.01;
  ck('les quatorze points sont posés', g.noms === 'OQPRABCDEFGHST', g.noms);
  ck('quatorze cercles tracés', g.cercles === 14, String(g.cercles));
  ck('[OQ] mesure 6 cm', pres(g.OQ, 6), String(g.OQ));
  /* P est le milieu de [OQ], R celui de [OP] : deux milieux enchaînés, le
     second sur un segment qui n'est pas tracé. */
  ck('P est bien le milieu de [OQ]', pres(g.OP, 3) && pres(g.PQ, 3), `${g.OP} / ${g.PQ}`);
  ck('R est bien le milieu de [OP]', pres(g.OR, 1.5) && pres(g.RP, 1.5), `${g.OR} / ${g.RP}`);
  /* A et B sont sur C1 (6 cm de O) ET sur C2 (7 cm de R) : c'est la définition
     même d'un croisement de deux cercles. */
  ck('A et B sont sur C1', pres(g.OA, 6) && pres(g.OB, 6), `${g.OA} / ${g.OB}`);
  ck('A et B sont sur C2', pres(g.RA, 7) && pres(g.RB, 7), `${g.RA} / ${g.RB}`);
  ck('C est à 3 cm de A et sur C2', pres(g.AC, 3) && pres(g.RC, 7), `${g.AC} / ${g.RC}`);
  ck('D est à 3 cm de B', pres(g.BD, 3), String(g.BD));
  ck('E et F sont sur C3', pres(g.QE, 4) && pres(g.QF, 4), `${g.QE} / ${g.QF}`);
  /* « tel que GQ = 5 cm » : un point posé sur un segment à une distance donnée
     de l'une de ses extrémités. */
  ck('G et H sont à 5 cm de Q', pres(g.GQ, 5) && pres(g.HQ, 5), `${g.GQ} / ${g.HQ}`);
  ck('S est sur C3', pres(g.QS, 4), String(g.QS));
  /* « tel que S n'appartienne pas à [OQ] » : la droite (OQ) coupe C3 en DEUX
     points, et l'énoncé dit lequel prendre. Le paramètre de S le long de (OQ)
     doit donc dépasser 1 — au-delà de Q. */
  ck('et hors de [OQ], comme l\'énoncé le demande', g.kS !== null && g.kS > 1,
     `paramètre ${g.kS}`);
  ck('T est à 6,5 cm de G', pres(g.GT, 6.5), String(g.GT));

  console.log('\n=== la notation fait foi ===');
  /* « La droite (OQ) » n'est pas le segment [OQ], même si c'est lui qui est
     tracé : une droite va plus loin, et c'est justement le croisement d'au-delà
     que l'énoncé vise. Chercher « un trait entre O et Q » posait S du mauvais
     côté, à l'intérieur du segment. */
  const notation = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.saveState();
    app.executerConsigne('Place les points O, Q');
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const O = pt('O'), Q = pt('Q'); O.x = 300; O.y = 400; Q.x = 600; Q.y = 400;
    app.executerConsigne('Trace [OQ]');
    app.executerConsigne('Trace le cercle C3 de centre Q et de rayon 4 cm');
    const seg = app.executerConsigne('Le segment [OQ] coupe le cercle C3 en U');
    const dro = app.executerConsigne("La droite (OQ) coupe le cercle C3 en V tel que V n'appartienne pas à [OQ]");
    const x = (n) => { const p = pt(n); return p ? Math.round(p.x) : null; };
    return { seg: seg.message, dro: dro.message, U: x('U'), V: x('V'), O: x('O'), Q: x('Q') };
  });
  console.log('  ' + JSON.stringify(notation));
  /* Le segment ne rencontre le cercle qu'entre O et Q ; la droite le rencontre
     aussi au-delà de Q. */
  ck('le segment donne le croisement intérieur',
     notation.U !== null && notation.U > notation.O && notation.U < notation.Q,
     `U en ${notation.U}, entre ${notation.O} et ${notation.Q}`);
  ck('la droite, celui d\'au-delà', notation.V !== null && notation.V > notation.Q,
     `V en ${notation.V}, au-delà de ${notation.Q}`);

  console.log('\n=== l\'arc de cercle ===');
  const arc = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.saveState();
    app.executerConsigne('Place 3 points O, A, B');
    const r = app.executerConsigne("Trace l'arc de cercle de centre O et de rayon 3 cm de A à B");
    const a = app.entities.find(e => e.constructor.name === 'Arc');
    return { ok: r.ok, m: r.message, rayon: a ? +(a.radius / 50).toFixed(2) : null };
  });
  console.log('  ' + JSON.stringify(arc));
  ck('un arc de cercle se trace', arc.ok && arc.rayon === 3, JSON.stringify(arc));

  console.log('\n=== « le plus éloigné de » départage deux croisements ===');
  /* « Celui du haut » dépendrait de l'orientation de la feuille ; une DISTANCE
     ne dépend de rien. C'est ce qui rend l'énoncé du panda sans ambiguïté : les
     deux taches des yeux se placent d'un côté ou de l'autre selon le croisement
     retenu, et une seule des deux lectures donne un panda. */
  const depart = await page.evaluate(() => {
    const app = window.app;
    const faire = (cond) => {
      app.entities = []; app.historyPast = []; app.stepInstructions = {};
      if (app.cslOublier) app.cslOublier();
      app.saveState();
      app.executerConsigne('Place les points O, Q');
      const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
      const O = pt('O'), Q = pt('Q'); O.x = 500; O.y = 300; Q.x = 500; Q.y = 600;
      app.executerConsigne('Trace [OQ]');
      app.executerConsigne('Trace le cercle C1 de centre O et de rayon 4 cm');
      app.executerConsigne('Trace le cercle C2 de centre Q et de rayon 4 cm');
      app.executerConsigne('Le cercle C1 coupe le cercle C2 en X tel que X soit ' + cond);
      const X = pt('X');
      return X ? Math.round(X.x - 500) : null;   // écart signé à la droite (OQ)
    };
    return { loin: faire('le plus éloigné de la droite (OQ)'),
             pres: faire('le plus proche de la droite (OQ)'),
             deO: faire('le plus proche de O') };
  });
  console.log('  ' + JSON.stringify(depart));
  /* Les deux croisements sont symétriques par rapport à (OQ) : « le plus
     éloigné » et « le plus proche » de cette droite sont donc à égale distance,
     et le logiciel doit au moins en choisir un sans se tromper de règle. */
  ck('« le plus éloigné de la droite » choisit un croisement',
     depart.loin !== null && Math.abs(depart.loin) > 50, String(depart.loin));
  ck('« le plus proche de O » en choisit un aussi', depart.deO !== null, String(depart.deO));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
