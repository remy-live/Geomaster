/* LE PROGRAMME DE CONSTRUCTION, À L'ENVERS.
 *
 * Le logiciel sait exécuter une suite de consignes. Il sait maintenant faire le
 * chemin inverse : relire une figure et écrire le programme qui la construit —
 * l'exercice « rédige un programme de construction » de tous les manuels.
 *
 * Deux registres, deux exercices : l'énoncé (ce qu'il faut obtenir) et la marche
 * à suivre (comment, geste par geste).
 *
 * CE QUE CETTE SONDE VÉRIFIE VRAIMENT : que le programme écrit REDONNE la
 * figure. Pas qu'il soit joli — qu'il soit juste. Les mesures qu'il annonce sont
 * relues sur la figure, et pour l'énoncé sans outils on le REJOUE dans le
 * logiciel pour comparer la figure obtenue à celle de départ.
 */
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

  const lire = (phrases, prealables) => page.evaluate(([xs, av]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    (av || []).forEach(p => app.addEntity(new Point(p[0], p[1], p[2])));
    xs.forEach(x => app.executerConsigneAvec(x, false));
    return { sans: app.programmeDeConstruction(false) || [],
             avec: app.programmeDeConstruction(true) || [] };
  }, [phrases, prealables]);

  console.log('\n=== l\'énoncé d\'un triangle donné par ses trois côtés ===');
  const tri = await lire(['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm']);
  console.log('  SANS : ' + tri.sans.join(' '));
  tri.avec.forEach((l, i) => console.log('  AVEC ' + (i + 1) + '. ' + l));
  ck('une seule phrase suffit à l\'énoncé', tri.sans.length === 1, tri.sans.length + ' phrases');
  ck('  elle donne les trois longueurs',
     /5 cm/.test(tri.sans[0]) && /4 cm/.test(tri.sans[0]) && /3 cm/.test(tri.sans[0]), tri.sans[0]);
  /* 3-4-5 : le triangle EST rectangle, et le dire est juste, pas décoratif. */
  ck('  et elle reconnaît qu\'il est rectangle (3, 4, 5)',
     /rectangle/.test(tri.sans[0]), tri.sans[0]);
  ck('la marche à suivre commence par la règle', /^À la règle/.test(tri.avec[0]), tri.avec[0]);
  ck('  puis deux arcs de compas, aux bons écartements',
     tri.avec.filter(l => /compas/.test(l)).length === 2
     && tri.avec.some(l => /écartement de 3 cm/.test(l))
     && tri.avec.some(l => /écartement de 4 cm/.test(l)),
     tri.avec.filter(l => /compas/.test(l)).join(' | '));
  ck('  le croisement des arcs donne le troisième sommet',
     tri.avec.some(l => /intersection des deux arcs est le point C/.test(l)),
     tri.avec.find(l => /intersection/.test(l)) || '(rien)');
  ck('  et l\'on ferme à la règle', /^À la règle/.test(tri.avec[tri.avec.length - 1]),
     tri.avec[tri.avec.length - 1]);

  console.log('\n=== l\'énoncé écrit REDONNE la figure ===');
  /* Le vrai test : on efface tout, on rejoue l'énoncé, et l'on compare les
     longueurs. Un programme qui ne redonne pas la figure ne vaut rien. */
  const boucle = await page.evaluate(() => {
    const app = window.app;
    const mesurer = () => app.entities.filter(e => e.constructor.name === 'Segment')
      .map(s => Math.round(Math.hypot(s.p2.x - s.p1.x, s.p2.y - s.p1.y) / 50 * 10) / 10)
      .sort((a, b) => a - b);
    const essai = (depart) => {
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      app.executerConsigneAvec(depart, false);
      const avant = mesurer();
      const prog = app.programmeDeConstruction(false) || [];
      app.entities = []; app.historyPast = []; app._cslSujet = null;
      if (app.cslOublier) app.cslOublier();
      prog.forEach(l => app.executerConsigneAvec(l, false));
      return { depart, prog, avant, apres: mesurer() };
    };
    return [
      essai('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm'),
      essai('Trace un carré ABCD de 3 cm de côté'),
      essai('Trace un rectangle ABCD de 5 cm sur 3 cm'),
      essai('Trace un hexagone ABCDEF de 3 cm de côté'),
    ];
  });
  boucle.forEach((r) => {
    console.log('  « ' + r.prog.join(' ') + ' »');
    ck(`rejoué, « ${r.depart.slice(0, 42)}… » redonne les mêmes longueurs`,
       JSON.stringify(r.avant) === JSON.stringify(r.apres),
       JSON.stringify(r.avant) + ' → ' + JSON.stringify(r.apres));
  });

  console.log('\n=== le carré et le rectangle se font à l\'ÉQUERRE ===');
  /* La méthode générale au compas est juste, mais elle passe par la DIAGONALE :
     « écartement de 4,2 cm » pour un carré de 3 cm. Aucun manuel ne dit cela, et
     l'élève ne comprendrait pas d'où sort ce nombre. */
  const car = await lire(['Trace un carré ABCD de 3 cm de côté']);
  car.avec.forEach((l, i) => console.log('  ' + (i + 1) + '. ' + l));
  ck('l\'équerre est de la partie', car.avec.some(l => /équerre/.test(l)),
     car.avec.join(' | ').slice(0, 90));
  ck('  et la DIAGONALE n\'apparaît jamais dans les écartements',
     !car.avec.some(l => /4,2 cm/.test(l)), car.avec.find(l => /4,2/.test(l)) || 'aucune');
  ck('  l\'énoncé, lui, tient en une phrase',
     car.sans.length === 1 && /carré ABCD de 3 cm de côté/.test(car.sans[0]), car.sans[0]);

  console.log('\n=== l\'hexagone régulier, au compas seul ===');
  const hex = await lire(['Trace un hexagone ABCDEF de 3 cm de côté']);
  console.log('  SANS : ' + hex.sans.join(' '));
  hex.avec.forEach((l, i) => console.log('  ' + (i + 1) + '. ' + l));
  ck('l\'énoncé dit « régulier » et une seule mesure',
     /r[ée]gulier/.test(hex.sans[0]) && (hex.sans[0].match(/3 cm/g) || []).length === 1,
     hex.sans[0]);
  ck('  la construction reporte le rayon, sans rien mesurer',
     hex.avec.some(l => /sans changer l'écartement/i.test(l))
     && hex.avec.length <= 5, hex.avec.length + ' étapes');
  ck('  et elle dit POURQUOI le côté vaut le rayon',
     hex.avec.some(l => /c[ôo]t[ée] de l'hexagone vaut le rayon/.test(l)),
     hex.avec.find(l => /rayon/.test(l)) || '(rien)');

  console.log('\n=== le milieu, la perpendiculaire, le cercle ===');
  const mil = await lire(['Trace [AB]', 'Place le milieu I de [AB]'],
                         [[300, 500, 'A'], [700, 500, 'B']]);
  ck('le milieu se lit dans l\'énoncé',
     mil.sans.some(l => /milieu I de \[AB\]/.test(l)), mil.sans.join(' | '));
  ck('  et sa construction au compas est complète : deux arcs, puis la règle',
     mil.avec.some(l => /un peu plus grand que la moitié/.test(l))
     && mil.avec.some(l => /joins les deux croisements/.test(l)),
     mil.avec.slice(-2).join(' | ').slice(0, 100));
  const perp = await lire(['Trace [AB]', 'Trace la perpendiculaire à (AB) passant par C'],
                          [[300, 500, 'A'], [700, 500, 'B'], [450, 300, 'C']]);
  ck('la perpendiculaire dit l\'équerre PUIS la règle qui prolonge',
     perp.avec.some(l => /équerre/.test(l)) && perp.avec.some(l => /prolonge/.test(l)),
     perp.avec.slice(-2).join(' | ').slice(0, 100));
  const cer = await lire(['Trace le cercle de centre A et de rayon 3 cm'], [[500, 450, 'A']]);
  ck('le cercle donne son centre et son rayon',
     cer.sans.some(l => /cercle de centre A et de rayon 3 cm/.test(l)), cer.sans.join(' | '));
  ck('  et l\'écartement du compas vaut le rayon',
     cer.avec.some(l => /écartement de 3 cm/.test(l)), cer.avec.join(' | '));

  console.log('\n=== le symétrique se RECONNAÎT, et ne s\'invente pas ===');
  /* La figure ne dit nulle part qu'un point est le symétrique d'un autre : la
     consigne pose un point libre. On le reconnaît donc à la géométrie — et l'on
     ne l'affirme qu'après vérification au demi-pixel. */
  const sym = await lire(['Trace [AB]', 'Trace le symétrique de A par rapport à O'],
                         [[300, 500, 'A'], [700, 500, 'B'], [500, 700, 'O']]);
  console.log('  SANS : ' + sym.sans.join(' | '));
  ck('le symétrique est reconnu et nommé',
     sym.sans.some(l => /symétrique A' de A par rapport au point O/.test(l)),
     sym.sans.join(' | '));
  ck('  et sa construction passe par la demi-droite et le report au compas',
     sym.avec.some(l => /demi-droite \[AO\)/.test(l))
     && sym.avec.some(l => /reporte AO de l'autre côté/.test(l)),
     sym.avec.slice(-2).join(' | ').slice(0, 110));
  /* Le contre-exemple : trois points quelconques ne doivent PAS devenir une
     symétrie parce que deux distances se ressemblent. */
  const faux = await lire(['Place les points A, B et C'],
                          [[300, 500, 'A'], [700, 500, 'B'], [521, 613, 'C']]);
  ck('trois points quelconques ne deviennent pas une symétrie',
     !faux.sans.some(l => /symétrique/.test(l)), faux.sans.join(' | '));

  console.log('\n=== une feuille vide n\'a pas de programme ===');
  const vide = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    return app.programmeDeConstruction(false);
  });
  ck('rien à écrire, et on le dit au lieu d\'écrire du vide',
     vide === null, JSON.stringify(vide));

  console.log('\n=== le programme s\'écrit dans l\'énoncé ===');
  const ecrit = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    app.executerConsigneAvec('Trace un carré ABCD de 3 cm de côté', false);
    const champ = document.getElementById('instrContent');
    champ.innerHTML = '<p>Exercice 4 — à rendre lundi.</p>';
    app.ecrireProgramme(true);
    const z = document.getElementById('enonceLibre');
    return { ouvert: z.style.display, html: champ.innerHTML };
  });
  ck('le panneau de l\'énoncé s\'ouvre tout seul', ecrit.ouvert === 'block', ecrit.ouvert);
  ck('  le programme est une liste numérotée',
     /<ol>/.test(ecrit.html) && (ecrit.html.match(/<li>/g) || []).length >= 4,
     (ecrit.html.match(/<li>/g) || []).length + ' étapes');
  ck('  et ce qui était écrit AVANT n\'est pas effacé',
     /Exercice 4 — à rendre lundi/.test(ecrit.html), ecrit.html.slice(0, 60));
  const boutons = await page.evaluate(() => {
    const t = [...document.querySelectorAll('#enonceLibre .instr-toolbar button')]
      .map(x => (x.textContent || '').trim());
    return t;
  });
  ck('les deux boutons sont dans la barre de l\'énoncé',
     boutons.some(x => /Énoncé/.test(x)) && boutons.some(x => /instruments/i.test(x)),
     JSON.stringify(boutons));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
