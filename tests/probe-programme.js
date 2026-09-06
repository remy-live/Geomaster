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
  /* ET ELLE NE DIT PAS « RECTANGLE ». Le triangle 5-3-4 EST rectangle — mais en
     C, pas en A. Or « triangle rectangle ABC » se lit « rectangle en A » : la
     phrase était donc FAUSSE. Trois côtés déterminent déjà le triangle ; ajouter
     la nature n'apprend rien, et donnerait en prime la réponse de l'exercice. */
  ck('  et elle ne prétend PAS qu\'il est « rectangle ABC » — l\'angle droit est en C',
     !/rectangle/.test(tri.sans[0]), tri.sans[0]);
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
    /* TOUTES les distances entre points nommés, pas seulement les côtés :
       quatre longueurs de côtés ne déterminent PAS un quadrilatère — on peut
       l'articuler comme un pantographe sans en changer un seul. Comparer les
       côtés seuls laisserait passer un énoncé qui promet une figure et en
       autorise une infinité. */
    const mesurer = () => {
      const P = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) P[e.label] = e; });
      const N = Object.keys(P).sort(); const out = [];
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
        out.push(Math.hypot(P[N[i]].x - P[N[j]].x, P[N[i]].y - P[N[j]].y) / 50);
      }
      return out.sort((a, b) => a - b);
    };
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
      essai('Trace un parallélogramme ABCD'),
      essai('Trace un trapèze ABCD'),
      essai('Trace un triangle ABC tel que AB = 6 cm, AC = 4 cm et BC = 4 cm'),
    ];
  });
  boucle.forEach((r) => {
    console.log('  « ' + r.prog.join(' ') + ' »');
    /* On compare TOUTES les distances deux à deux — côtés ET diagonales : une
       comparaison des seuls côtés avait laissé passer « triangle rectangle ABC »
       dont l'angle droit était en C. La tolérance est celle de l'écriture : les
       mesures sont écrites au dixième de centimètre, donc deux figures qui se
       correspondent au dixième près sont la MÊME figure. Un dépliage, lui, se
       compte en centimètres — mesuré une fois : BE de 11,1 à 20,3 cm. */
    const ecart = r.avant.length === r.apres.length
      ? Math.max(0, ...r.avant.map((v, i) => Math.abs(v - r.apres[i])))
      : 99;
    ck(`rejoué, « ${r.depart.slice(0, 42)}… » redonne les mêmes longueurs`,
       ecart <= 0.11, 'écart max ' + Math.round(ecart * 1000) / 1000 + ' cm — '
       + JSON.stringify(r.avant.map(v => Math.round(v * 10) / 10))
       + ' → ' + JSON.stringify(r.apres.map(v => Math.round(v * 10) / 10)));
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

  console.log('\n=== la nature n\'est dite que si elle apprend quelque chose ===');
  const iso = await lire(['Trace un triangle ABC tel que AB = 6 cm, AC = 4 cm et BC = 4 cm']);
  console.log('  ' + iso.sans[0]);
  /* « Triangle isocèle ABC » se lit « isocèle en A ». Ici les côtés égaux sont
     CA et CB : le sommet est C, et il faut le dire. */
  ck('un triangle isocèle nomme SON sommet',
     /isocèle en C/.test(iso.sans[0]), iso.sans[0]);
  ck('  et les deux côtés égaux sont dits ensemble',
     /CA = CB = 4 cm/.test(iso.sans[0]), iso.sans[0]);
  const quad = await lire(['Trace un parallélogramme ABCD']);
  console.log('  ' + quad.sans[0]);
  /* Quatre longueurs de côtés n'enferment aucun quadrilatère : la diagonale, si.
     On la DONNE, mais on ne l'ANNONCE pas : la phrase portait « (ce sont les
     diagonales issues de A) », et ce mot-là renvoyait la phrase relue vers la
     règle des diagonales, qui répondait « De quelle figure ? ». Un énoncé qui
     ne se relit pas n'est pas un énoncé — le mot est parti, la mesure reste. */
  ck('un quadrilatère donne une DIAGONALE, sans quoi la figure n\'est pas fixée',
     /AC = /.test(quad.sans[0]), quad.sans[0]);
  ck('  et le mot « diagonale » n\'y est pas : il empêchait la phrase d\'être relue',
     !/diagonale/i.test(quad.sans[0]), quad.sans[0]);

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

  console.log('\n=== quatre onglets : ce que J\'écris, et ce que la figure dit ===');
  /* Le programme s'écrivait à la suite de l'énoncé du professeur : au bout de
     trois essais le texte devenait un empilement, et rien ne distinguait ce
     qu'on avait écrit de ce que la machine avait relu. */
  const onglets = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    document.getElementById('instrContent').innerHTML = '<p>Exercice 4 — à rendre lundi.</p>';
    app.ongletEnonce('figure');
    const vide = document.getElementById('enonceGenereTexte').textContent;
    app.executerConsigneAvec('Trace un carré ABCD de 3 cm de côté', false);
    const apres = document.getElementById('enonceGenereTexte').textContent;
    /* On ajoute un objet SANS retoucher à l'onglet : il doit suivre tout seul. */
    app.executerConsigneAvec('Place le milieu I de [AB]', false);
    const suivi = document.getElementById('enonceGenereTexte').textContent;
    const barre = document.querySelector('.enonce-onglets');
    const rangees = new Set([...barre.querySelectorAll('button')]
        .map(x => Math.round(x.getBoundingClientRect().top))).size;
    return {
      noms: [...document.querySelectorAll('.enonce-onglets button')].map(x => x.textContent.trim()),
      ouvert: document.getElementById('enonceLibre').style.display,
      volet: document.getElementById('voletConsignes').style.display,
      enTete: barre.parentElement.id, rangees,
      pastilles: [...document.querySelectorAll('.enonce-onglets button')]
        .map(x => x.dataset.onglet + ':' + (x.dataset.plein || '-')).join(' '),
      vide, apres, suivi,
      mienCache: document.getElementById('instrContent').style.display,
      monEnonce: document.getElementById('instrContent').textContent,
    };
  });
  /* « Il faut pouvoir trouver l'énoncé » : il était à DEUX niveaux de
     profondeur — un « Énoncé libre ▾ » au coin bas-droit de la liste, puis les
     onglets dessous. Ils sont maintenant la navigation du panneau. */
  ck('quatre onglets, EN TÊTE du panneau et sur une seule ligne',
     onglets.noms.length === 4 && onglets.enTete === 'instructionBox'
     && onglets.rangees === 1,
     JSON.stringify(onglets.noms) + ' — dans #' + onglets.enTete
     + ', ' + onglets.rangees + ' rangée(s)');
  ck('  « Consignes » en est un : la liste est un onglet comme les autres',
     onglets.noms[0] === 'Consignes' && onglets.volet === 'none', onglets.volet);
  /* Un onglet qu'on croit vide, on ne l'ouvre pas : il dit qu'il a de quoi lire. */
  ck('  un point signale que la figure a un énoncé à montrer',
     /figure:1/.test(onglets.pastilles) && /outils:1/.test(onglets.pastilles)
     && !/mien:1/.test(onglets.pastilles), onglets.pastilles);
  /* « flex » et non « block » : c'est ce qui laisse le champ de texte occuper
     toute la hauteur restante du panneau. */
  ck('  le panneau s\'ouvre tout seul', onglets.ouvert === 'flex', onglets.ouvert);
  ck('  feuille vide, il le dit au lieu d\'écrire du vide',
     /feuille est vide/.test(onglets.vide), onglets.vide.slice(0, 60));
  ck('ON TRACE, ET L\'ÉNONCÉ SE RÉDIGE TOUT SEUL',
     /carré ABCD de 3 cm/.test(onglets.apres), onglets.apres.slice(0, 70));
  ck('  et il SUIT la figure : un milieu ajouté paraît sans qu\'on y touche',
     /milieu I de \[AB\]/.test(onglets.suivi), onglets.suivi.slice(0, 90));
  ck('  « Mon énoncé » n\'est pas touché : c\'est un autre onglet',
     onglets.mienCache === 'none'
     && /Exercice 4 — à rendre lundi/.test(onglets.monEnonce), onglets.monEnonce.slice(0, 60));
  /* Et il reste REPRENABLE : un bouton le recopie dans « Mon énoncé », où il
     devient un texte comme un autre. */
  const copie = await page.evaluate(() => {
    const app = window.app;
    app.ongletEnonce('outils');
    app.copierProgrammeDansEnonce();
    return { html: document.getElementById('instrContent').innerHTML,
             actif: document.querySelector('.enonce-onglets button.actif').dataset.onglet };
  });
  ck('« Copier dans mon énoncé » recopie et revient sur mon texte',
     copie.actif === 'mien' && /<ol>/.test(copie.html), copie.actif);
  ck('  sans effacer ce que le professeur avait écrit',
     /Exercice 4 — à rendre lundi/.test(copie.html), copie.html.slice(0, 60));

  console.log('\n=== recopié en bas d\'un énoncé déjà long : ON LE VOIT ===');
  /* « c'est dans mon énoncé libre mais du coup on ne le voit pas ». Mesuré : le
     champ montrait 420 px sur 630, le défilement restait à 0, et le bloc neuf
     commençait 102 px sous le bord visible. */
  const pli = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    app.executerConsigneAvec('Trace un carré ABCD de 3 cm de côté', false);
    if (document.getElementById('instructionBox').style.display === 'none') {
        app.toggleInstructions();
    }
    const champ = document.getElementById('instrContent');
    champ.innerHTML = '<h3>Contrôle n°3</h3>'
      + Array.from({ length: 12 }, (_, i) => `<p>Exercice ${i + 1} : à compléter.</p>`).join('');
    app.ongletEnonce('figure');
    app.copierProgrammeDansEnonce();
    const neuf = champ.lastElementChild;
    const rc = champ.getBoundingClientRect(), rn = neuf.getBoundingClientRect();
    const box = document.getElementById('instructionBox').getBoundingClientRect();
    return { visible: rn.top < rc.bottom && rn.bottom > rc.top,
             debordeEcran: box.bottom > window.innerHeight + 1 || box.top < -1,
             police: parseFloat(getComputedStyle(champ).fontSize),
             hauteurChamp: champ.clientHeight };
  });
  ck('le bloc recopié est VISIBLE, pas sous le pli', pli.visible, JSON.stringify(pli));
  ck('  et le panneau ne sort pas de l\'écran pour autant', !pli.debordeEcran,
     JSON.stringify(pli));
  ck('  la police de l\'énoncé a été réduite (13 px)', pli.police <= 13, pli.police + ' px');
  ck('  le champ prend la hauteur du panneau, il ne s\'arrête plus à 400 px',
     pli.hauteurChamp > 420, pli.hauteurChamp + ' px');

  console.log('\n=== « sur le trait précédent » : on NOMME le support ===');
  /* Celui qui lit « sur le trait précédent » doit remonter la liste pour savoir
     de quoi on parle, et si deux traits ont été faits entre-temps il se trompe. */
  const supports = await page.evaluate(() => {
    const app = window.app; const out = {};
    const jeu = (nom, faire) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      faire();
      out[nom] = { sans: app.programmeDeConstruction(false),
                   avec: app.programmeDeConstruction(true) };
    };
    jeu('surSegment', () => {
      const A = new Point(300, 400, 'A'), B = new Point(700, 400, 'B');
      app.addEntity(A); app.addEntity(B);
      const s = new Segment(A, B, { color: '#000', width: 2 }); app.addEntity(s);
      app.addEntity(new Point(500, 400, 'M', [s]));
    });
    jeu('surCercle', () => {
      const O = new Point(400, 400, 'O'), R = new Point(550, 400);
      app.addEntity(O); app.addEntity(R);
      const c = new Circle(O, R); app.addEntity(c);
      app.addEntity(new Point(400, 250, 'H', [c]));
    });
    jeu('intersection', () => {
      const A = new Point(200, 200, 'A'), B = new Point(600, 600, 'B');
      const C = new Point(200, 600, 'C'), D = new Point(600, 200, 'D');
      [A, B, C, D].forEach(x => app.addEntity(x));
      const s1 = new Segment(A, B, { color: '#000', width: 2 });
      const s2 = new Segment(C, D, { color: '#000', width: 2 });
      app.addEntity(s1); app.addEntity(s2);
      app.addEntity(new Point(400, 400, 'I', [s1, s2]));
    });
    jeu('perpendiculaire', () => {
      app.executerConsigneAvec('Trace un segment [AB] de 6 cm', false);
      app.executerConsigneAvec('Trace la perpendiculaire à (AB) passant par A', false);
    });
    jeu('bordDeCercle', () => {
      const F = new Point(400, 400, 'F'), G = new Point(550, 400, 'G');
      app.addEntity(F); app.addEntity(G); app.addEntity(new Circle(F, G));
    });
    jeu('bordQuiSert', () => {
      const F = new Point(400, 400, 'F'), G = new Point(550, 400, 'G');
      app.addEntity(F); app.addEntity(G); app.addEntity(new Circle(F, G));
      app.addEntity(new Segment(F, G, { color: '#000', width: 2 }));
    });
    return out;
  });
  const tout = JSON.stringify(supports);
  ck('plus un seul « trait précédent » nulle part', !/trait précédent/.test(tout),
     (tout.match(/[^"]*trait précédent[^"]*/) || [''])[0]);
  ck('un point posé sur un segment dit LEQUEL',
     /sur le segment \[AB\]/.test(supports.surSegment.sans.join(' ')),
     supports.surSegment.sans.join(' | '));
  ck('  posé sur un cercle : « sur le cercle de centre O »',
     /sur le cercle de centre O/.test(supports.surCercle.sans.join(' ')),
     supports.surCercle.sans.join(' | '));
  ck('une intersection nomme les DEUX objets, et en français',
     /intersection du segment \[AB\] et du segment \[CD\]/
        .test(supports.intersection.sans.join(' ')),
     supports.intersection.sans.join(' | '));
  ck('  pas de « de le segment »', !/\bde le\b|\bà le\b/.test(tout),
     (tout.match(/[^"]*\bde le\b[^"]*/) || [''])[0]);
  ck('la perpendiculaire dit à QUOI elle est perpendiculaire',
     /perpendiculaire à la droite \(AB\)/.test(supports.perpendiculaire.sans.join(' ')),
     supports.perpendiculaire.sans.join(' | '));
  /* Un cercle se retient par deux points, mais l'énoncé donne déjà le rayon :
     annoncer le point du bord puis n'en plus jamais parler, c'est une ligne
     lue pour rien. */
  ck('le point du bord d\'un cercle ne se dit pas s\'il ne sert à rien',
     supports.bordDeCercle.sans.join(' ') === 'Place le point F. '
        + 'Trace le cercle de centre F et de rayon 3 cm.',
     supports.bordDeCercle.sans.join(' | '));
  ck('  mais il se dit dès qu\'il sert : le rayon [FG] est tracé',
     /Place les points F et G/.test(supports.bordQuiSert.sans.join(' ')),
     supports.bordQuiSert.sans.join(' | '));

  console.log('\n=== un pentagone CONCAVE se rejoue sans se déplier ===');
  /* L'éventail depuis A sort de la figure au sommet rentrant : les triangles
     changent de sens, et la reconstruction dépliait la figure. Mesuré avant
     correction : BE passait de 11,1 à 20,3 cm. */
  const concave = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const P = {};
    [['A', 570, 545], ['B', 1310, 275], ['C', 1270, 780], ['D', 845, 975], ['E', 945, 690]]
      .forEach(([n, x, y]) => { P[n] = new Point(x, y, n); app.addEntity(P[n]); });
    ['AB', 'BC', 'CD', 'DE', 'EA'].forEach(s =>
      app.addEntity(new Segment(P[s[0]], P[s[1]], { color: '#000', width: 2 })));
    app.addEntity(new Polygon([P.A, P.B, P.C, P.D, P.E]));
    const mesurer = () => {
      const Q = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) Q[e.label] = e; });
      const N = Object.keys(Q).sort(); const out = {};
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++)
        out[N[i] + N[j]] = Math.hypot(Q[N[i]].x - Q[N[j]].x, Q[N[i]].y - Q[N[j]].y) / 50;
      return out;
    };
    const avant = mesurer();
    const prog = app.programmeDeConstruction(false);
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    (prog || []).forEach(l => app.executerConsigneAvec(l, false));
    const apres = mesurer();
    let max = 0, pire = '';
    Object.keys(avant).forEach(k => {
      const d = (apres[k] === undefined) ? 99 : Math.abs(avant[k] - apres[k]);
      if (d > max) { max = d; pire = k; }
    });
    return { prog, max: Math.round(max * 1000) / 1000, pire, n: Object.keys(apres).length };
  });
  ck('l\'énoncé relu se REJOUE : les cinq sommets reviennent', concave.n === 10,
     concave.n + ' distances');
  /* 0,1 cm : c'est l'arrondi des mesures écrites dans l'énoncé, pas une erreur
     de géométrie. Mesuré : 0,081 cm au pire (CE). */
  ck('  et la figure ne se déplie pas : écart max sous l\'arrondi de 0,1 cm',
     concave.max <= 0.11, 'écart ' + concave.max + ' cm sur ' + concave.pire
     + ' — ' + (concave.prog || []).join(' | '));

  console.log('\n=== la ROSACE : chaque ligne doit tenir la suivante ===');
  /* Le programme écrivait « 1. Place les points A et B. » puis, deux lignes plus
     loin, « Place le point C, intersection des deux cercles ». A et B pouvaient
     être à un centimètre l'un de l'autre : les cercles ne se coupaient plus, et
     le point C de la ligne 4 n'existait pas. La ligne 1 rendait les suivantes
     fausses. */
  const rosace = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const R = 2.7 * 50;
    const A = new Point(500, 500, 'A'); app.addEntity(A);
    const B = new Point(500 + R, 500, 'B'); app.addEntity(B);
    app.addEntity(new Circle(A, B));
    const b2 = new Point(500 + 2 * R, 500); app.addEntity(b2);
    app.addEntity(new Circle(B, b2));
    const cx = 500 + R / 2, cy = 500 - Math.sqrt(R * R - R * R / 4);
    const cercles = app.entities.filter(e => e instanceof Circle);
    const C = new Point(cx, cy, 'C', [cercles[0], cercles[1]]); app.addEntity(C);
    const c3b = new Point(cx + R, cy); app.addEntity(c3b);
    const c3 = new Circle(C, c3b); app.addEntity(c3);
    app.addEntity(new Point(cx, cy + R, 'D', [c3]));
    const e2 = new Point(500 + R + 5.3 * 50, 500); app.addEntity(e2);
    app.addEntity(new Circle(B, e2));
    const mesurer = () => {
      const Q = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) Q[e.label] = e; });
      const N = Object.keys(Q).sort(); const out = {};
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++)
        out[N[i] + N[j]] = Math.hypot(Q[N[i]].x - Q[N[j]].x, Q[N[i]].y - Q[N[j]].y) / 50;
      return out;
    };
    const avant = mesurer();
    const prog = app.programmeDeConstruction(false) || [];
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    const refus = [];
    prog.forEach((l) => {
      const r = app.executerConsigneAvec(l, false);
      if (!r || !r.ok) refus.push(l + ' → ' + ((r && r.message) || 'rien'));
    });
    const apres = mesurer();
    let max = 0, pire = '';
    Object.keys(avant).forEach((k) => {
      const d = (apres[k] === undefined) ? 99 : Math.abs(avant[k] - apres[k]);
      if (d > max) { max = d; pire = k; }
    });
    return { prog, refus, max: Math.round(max * 1000) / 1000, pire };
  });
  rosace.prog.forEach((l, i) => console.log('  ' + (i + 1) + '. ' + l));
  ck('« Place les points A et B » dit AB : sans quoi la ligne 4 est un pari',
     /Place les points A et B tels que AB = /.test(rosace.prog[0] || ''), rosace.prog[0]);
  ck('  et un point posé sur un cercle dit OÙ sur ce cercle',
     /sur le cercle de centre C tel que /.test(rosace.prog.find(l => /point D/.test(l)) || ''),
     rosace.prog.find(l => /point D/.test(l)) || '(rien)');
  ck('TOUTES les lignes se rejouent, sans une seule refusée',
     rosace.refus.length === 0, rosace.refus.join(' | '));
  ck('  et la rosace revient à l\'identique', rosace.max <= 0.11,
     'écart max ' + rosace.max + ' cm sur ' + rosace.pire);

  console.log('\n=== le parseur LIT les longueurs qu\'on lui donne ===');
  /* « Place les points A, B et C tels que AB = 5 cm, AC = 4 cm et BC = 3 cm »
     répondait « 3 points placés » et les posait à 3,9 / 3,9 / 4,5. Les longueurs
     étaient lues par personne : la phrase répondait oui et faisait autre chose. */
  const lues = await page.evaluate(() => {
    const app = window.app;
    const essai = (ph) => {
      app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
      const r = app.executerConsigneAvec(ph, false);
      const P = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) P[e.label] = e; });
      const d = (a, b) => Math.round(Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y) / 50 * 10) / 10;
      return { ok: !!(r && r.ok), msg: (r && r.message) || '', P: Object.keys(P).sort().join(''), d };
    };
    const deux = essai('Place les points A et B tels que AB = 2,7 cm');
    const trois = essai('Place les points A, B et C tels que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    const faux = essai('Place les points A, B et C tels que AB = 1 cm, AC = 1 cm et BC = 8 cm');
    return {
      deux: { ok: deux.ok, AB: deux.d('A', 'B') },
      trois: { ok: trois.ok, AB: trois.d('A', 'B'), AC: trois.d('A', 'C'), BC: trois.d('B', 'C') },
      faux: { ok: faux.ok, msg: faux.msg },
    };
  });
  ck('deux points à la distance demandée', lues.deux.ok && lues.deux.AB === 2.7,
     JSON.stringify(lues.deux));
  ck('  trois points, et le triangle est celui qu\'on a écrit',
     lues.trois.AB === 5 && lues.trois.AC === 4 && lues.trois.BC === 3,
     JSON.stringify(lues.trois));
  /* Des longueurs impossibles se refusent : mieux vaut le refus que trois points
     posés n'importe où sous une réponse « oui ». */
  ck('  et des longueurs impossibles se REFUSENT au lieu de mentir',
     !lues.faux.ok && /ne peuvent pas aller ensemble/.test(lues.faux.msg), lues.faux.msg);

  console.log('\n=== deux cercles se coupent, et le parseur le sait ===');
  const croix = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    ['Place les points A et B tels que AB = 3 cm',
     'Trace le cercle de centre A et de rayon 2,5 cm',
     'Trace le cercle de centre B et de rayon 2,5 cm'].forEach(l => app.executerConsigneAvec(l, false));
    const r = app.executerConsigneAvec(
      'Place le point C, intersection du cercle de centre A et du cercle de centre B', false);
    const P = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) P[e.label] = e; });
    const d = (a, b) => Math.round(Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y) / 50 * 10) / 10;
    app.entities = []; app.historyPast = []; if (app.cslOublier) app.cslOublier();
    ['Place les points A et B tels que AB = 9 cm',
     'Trace le cercle de centre A et de rayon 1 cm',
     'Trace le cercle de centre B et de rayon 1 cm'].forEach(l => app.executerConsigneAvec(l, false));
    const loin = app.executerConsigneAvec(
      'Place le point C, intersection du cercle de centre A et du cercle de centre B', false);
    return { ok: !!(r && r.ok), AC: P.C ? d('A', 'C') : null, BC: P.C ? d('B', 'C') : null,
             loin: { ok: !!(loin && loin.ok), msg: (loin && loin.message) || '' } };
  });
  ck('l\'intersection de deux cercles est comprise et JUSTE',
     croix.ok && croix.AC === 2.5 && croix.BC === 2.5, JSON.stringify(croix));
  ck('  et deux cercles trop éloignés : on le dit, on n\'invente pas de point',
     !croix.loin.ok && /ne se coupent pas/.test(croix.loin.msg), croix.loin.msg);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
