// L'ANGLE DROIT A SON INSTRUMENT. Le logiciel ouvrait 90° au rapporteur comme
// n'importe quel angle : la figure était juste, le geste faux — et c'est le
// geste qu'un élève regarde. Cette sonde vérifie l'outil ET la figure : les
// longueurs sont mesurées en centimètres, les angles en degrés, sur les points
// réellement posés.
//
// Elle garde aussi trois phrases d'énoncé qui butaient sur rien :
// « efface tout puis … », « … et ses diagonales » aux instruments, et le
// message donné quand le triangle demandé n'existe pas.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  /* Une phrase, sur une feuille propre, aux instruments — et l'on relève ce que
     la construction a réellement produit : les outils sortis, et la figure. */
  const faire = (phrase, avecOutils = true) => page.evaluate(([ph, ou]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = [];
    app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    let res;
    try { res = app.executerConsigneAvec(ph, ou); }
    catch (e) { return { crash: e.message }; }
    const outils = {};
    app.entities.filter(e => e.constructor.name === 'ToolAnimation')
      .forEach(e => { const k = e.widgetType || e.type; outils[k] = (outils[k] || 0) + 1; });
    const pt = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) pt[e.label] = e; });
    const U = 50 / (app.cmScale || 1);
    const cm = (x, y) => (pt[x] && pt[y])
      ? +(Math.hypot(pt[x].x - pt[y].x, pt[x].y - pt[y].y) / U).toFixed(2) : null;
    const deg = (x, s, y) => {
      if (!pt[x] || !pt[s] || !pt[y]) return null;
      const a = Math.atan2(pt[x].y - pt[s].y, pt[x].x - pt[s].x)
              - Math.atan2(pt[y].y - pt[s].y, pt[y].x - pt[s].x);
      const v = Math.abs(a * 180 / Math.PI) % 360;
      return +(v > 180 ? 360 - v : v).toFixed(1);
    };
    return { ok: !!(res && res.ok), msg: (res && res.message) || '', astuce: (res && res.astuce) || '',
             outils, n: app.entities.length,
             AB: cm('A', 'B'), AC: cm('A', 'C'), BC: cm('B', 'C'),
             A: deg('B', 'A', 'C'), B: deg('A', 'B', 'C'), C: deg('A', 'C', 'B'),
             segments: app.entities.filter(e => e.constructor.name === 'Segment').length };
  }, [phrase, avecOutils]);

  console.log('\n=== l\'angle droit se pose à l\'équerre, pas au rapporteur ===');
  /* LE CAS DU CAHIER : une jambe et l'hypoténuse. On trace [AB] à la règle, on
     élève la perpendiculaire à l'ÉQUERRE en A, et le COMPAS ouvert à 6 cm depuis
     B vient couper cette perpendiculaire — c'est là qu'est C. */
  let r = await faire('trace un triangle ABC rectangle en A tel que AB = 5 cm et BC = 6 cm');
  console.log('  ' + JSON.stringify({ msg: r.msg, outils: r.outils, AB: r.AB, BC: r.BC, AC: r.AC, A: r.A }));
  ck('l\'équerre sort', r.outils.setsquare >= 1, JSON.stringify(r.outils));
  ck('le rapporteur, non', !r.outils.protractor, JSON.stringify(r.outils));
  ck('le compas sort aussi : il donne le sommet', r.outils.compass >= 1, JSON.stringify(r.outils));
  ck('la règle a tracé la base', r.outils.ruler >= 1, JSON.stringify(r.outils));
  /* La figure, mesurée : l'angle est droit, les deux longueurs données sont
     respectées, et la troisième est celle de Pythagore. */
  ck('l\'angle en A vaut 90°', r.A === 90, String(r.A));
  ck('AB = 5 cm et BC = 6 cm, comme demandé', r.AB === 5 && r.BC === 6, `AB=${r.AB} BC=${r.BC}`);
  ck('et AC vaut √(6²−5²) = 3,32 cm', Math.abs(r.AC - 3.32) < 0.02, String(r.AC));

  /* L'AUTRE CAS : les deux jambes. Le compas ne doit plus se planter en B — la
     longueur donnée part de A. Le geste change, la leçon aussi. */
  r = await faire('trace un triangle ABC rectangle en A tel que AB = 5 cm et AC = 3 cm');
  ck('deux jambes données : équerre et compas encore',
     r.outils.setsquare >= 1 && r.outils.compass >= 1 && !r.outils.protractor, JSON.stringify(r.outils));
  ck('  et l\'hypoténuse tombe à √34 = 5,83 cm',
     r.A === 90 && Math.abs(r.BC - 5.83) < 0.02, `A=${r.A} BC=${r.BC}`);

  /* SANS AUCUNE MESURE. « Trace un triangle ABC rectangle en A » se construisait
     au compas seul : trois longueurs inventées, et pas la moindre équerre pour
     l'unique chose que la phrase donnait vraiment. */
  r = await faire('trace un triangle ABC rectangle en A');
  ck('sans mesure, l\'équerre sort quand même', r.outils.setsquare >= 1, JSON.stringify(r.outils));
  ck('  et l\'angle est droit', r.A === 90, String(r.A));

  /* L'angle droit peut être au second sommet : l'équerre s'y pose. */
  r = await faire('trace un triangle ABC rectangle en B tel que AB = 5 cm et BC = 4 cm');
  ck('rectangle en B : l\'équerre s\'y pose aussi',
     r.outils.setsquare >= 1 && r.B === 90, JSON.stringify({ o: r.outils, B: r.B }));
  ck('  et l\'hypoténuse [AC] vaut √41 = 6,40 cm', Math.abs(r.AC - 6.4) < 0.02, String(r.AC));

  /* EN C, C'EST UNE AUTRE CONSTRUCTION. Le premier côté tracé est [AB], qui est
     alors l'HYPOTÉNUSE : l'équerre n'a pas de bout de segment où se poser. On
     retombe sur l'outil d'avant, et la figure reste juste — c'est la limite,
     elle est assumée, pas ignorée. */
  r = await faire('trace un triangle ABC rectangle en C tel que AC = 5 cm et BC = 4 cm');
  ck('rectangle en C : la figure est juste, par l\'ancien chemin',
     r.ok && r.C === 90 && !r.outils.setsquare, JSON.stringify({ C: r.C, o: r.outils }));

  /* Sans les instruments, on veut la figure seule — aucune animation d'outil. */
  r = await faire('trace un triangle ABC rectangle en A tel que AB = 5 cm et BC = 6 cm', false);
  ck('« sans les outils » ne laisse que la figure',
     r.ok && r.A === 90 && Object.keys(r.outils).length === 0, JSON.stringify(r.outils));

  console.log('\n=== quand le triangle n\'existe pas, on dit POURQUOI ===');
  /* AB = 5 et BC = 4 avec l'angle droit en A : [BC] est l'hypoténuse, elle ne
     peut pas être plus courte qu'une jambe. Le refus était exact — « le côté
     opposé est trop court pour rejoindre l'autre » — et ne s'adressait à
     personne. Le mot « hypoténuse » et les deux longueurs le rendent utile. */
  r = await faire('trace un triangle ABC rectangle en A tel que AB = 5 cm et BC = 4 cm');
  console.log('  ' + JSON.stringify(r.msg));
  ck('la phrase est refusée : ce triangle n\'existe pas', !r.ok);
  ck('  le mot « hypoténuse » est dit', /hypot[ée]nuse/.test(r.msg), r.msg);
  ck('  le côté concerné est nommé', /\[BC\]/.test(r.msg), r.msg);
  ck('  et les deux longueurs sont rappelées',
     /BC = 4 cm/.test(r.msg) && /AB = 5 cm/.test(r.msg), r.msg);
  ck('  rien n\'a été tracé', r.n === 0, String(r.n));

  console.log('\n=== « efface tout puis … » ===');
  /* Une consigne « construit et n'efface pas », disait le logiciel. Mais
     « efface tout puis trace… » est la phrase la plus utile de toutes : on
     repart d'une feuille propre sans lâcher le clavier. Elle butait sur
     « Je ne connais pas E. » — le découpage refusait de couper devant un verbe
     qu'il ne connaissait pas, et la phrase entière partait à l'analyseur. */
  const chaine = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = [];
    app._cslSujet = null; if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec('Trace un carré ABCD de 4 cm', true);
    const avant = app.entities.length;
    const r = app.executerConsigneAvec(
      'efface tout puis trace EFG un triangle quelconque et les médiatrices de ce triangle', true);
    const noms = {};
    app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) noms[e.label] = 1; });
    return { avant, ok: !!(r && r.ok), msg: (r && r.message) || '',
             apres: app.entities.length, noms: Object.keys(noms).sort().join(''),
             mediatrices: app.entities.filter(e => e.constructor.name === 'PerpendicularLine').length,
             carreParti: !Object.keys(noms).includes('A'),
             historique: app.historyPast.length };
  });
  console.log('  ' + JSON.stringify(chaine));
  ck('la phrase entière passe', chaine.ok, chaine.msg);
  ck('  le carré d\'avant a disparu', chaine.carreParti, chaine.noms);
  ck('  le triangle EFG est là', /E/.test(chaine.noms) && /F/.test(chaine.noms) && /G/.test(chaine.noms),
     chaine.noms);
  ck('  et ses TROIS médiatrices avec lui', chaine.mediatrices === 3, String(chaine.mediatrices));
  /* EFFACER SANS PRÉVENIR NE SE PARDONNE QUE SI L'ON PEUT REVENIR. La consigne
     ne demande pas confirmation — on vient de l'écrire, c'est déjà la réponse —
     donc l'annulation doit marcher, et le message ne doit pas promettre plus
     qu'elle ne tient : dans une phrase enchaînée, la reconstruction s'annule
     d'abord, l'effacement ensuite. Deux pressions, mesuré — d'où « annulable »
     et non « Ctrl+Z la ramène ». */
  ck('  la figure d\'avant est dans l\'historique', chaine.historique > 0, String(chaine.historique));
  ck('  le message ne promet pas une seule pression',
     /annulable/.test(chaine.msg) && !/Ctrl\+Z la ram/.test(chaine.msg), chaine.msg);
  const retour = await page.evaluate(() => {
    const noms = () => {
      const s = new Set();
      window.app.entities.forEach(e => { if (e.constructor.name === 'Point' && e.label) s.add(e.label); });
      return [...s].sort().join('');
    };
    const pas = [];
    for (let i = 0; i < 4 && !/A/.test(noms()); i++) { window.app.undo(); pas.push(noms() || '(vide)'); }
    return { fin: noms(), pas };
  });
  ck('  et le carré revient en annulant', /A/.test(retour.fin) && /D/.test(retour.fin),
     JSON.stringify(retour));
  /* Effacer UN objet reste hors sujet pour une consigne — mais on le dit
     autrement qu'en répondant « C existe déjà ». */
  const unSeul = await faire('efface le point C');
  ck('« efface le point C » renvoie vers la gomme, sans jargon',
     !unSeul.ok && /gomme|Ctrl\+Z/.test(unSeul.msg) && /efface tout/.test(unSeul.msg), unSeul.msg);

  console.log('\n=== « … et ses diagonales », aux instruments aussi ===');
  /* C'est l'exemple que le panneau propose lui-même. Il marchait sans les
     instruments et échouait avec : le bâtisseur détaillé du carré ne disait pas
     quelle figure il venait de tracer, et « ses » ne renvoyait à rien. */
  for (const outils of [true, false]) {
    const d = await faire('trace un carré et ses diagonales', outils);
    ck(`${outils ? 'avec' : 'sans'} les instruments : le carré ET ses deux diagonales`,
       d.ok && /2 diagonales/.test(d.msg), d.msg);
  }
  const nomme = await faire('trace un carré ABCD de 5 cm et ses diagonales');
  ck('nommé, c\'est pareil', nomme.ok && /diagonales de ABCD/.test(nomme.msg), nomme.msg);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
