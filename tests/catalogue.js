/* CONSIGNES.md est ÉCRIT PAR CE PROGRAMME, pas à la main.
 *
 * Une liste de ce qu'un logiciel sait faire, tenue à la main, ment au bout de
 * trois semaines : on ajoute une phrase et l'on oublie la liste, ou l'on écrit
 * une phrase que le logiciel ne comprend plus. Ici, chaque ligne du catalogue
 * est RÉELLEMENT exécutée dans un navigateur, et c'est la réponse du logiciel
 * qui est recopiée. Une phrase qui échoue apparaît en clair, marquée.
 *
 *   node tests/catalogue.js          écrit CONSIGNES.md
 *   node tests/catalogue.js --check  vérifie sans écrire (code de sortie 1 si
 *                                    une phrase du catalogue ne passe plus)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SORTIE = path.resolve(__dirname, '..', 'CONSIGNES.md');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

/* Les points qu'on pose avant d'essayer une phrase, quand elle en suppose.
   Une entrée peut demander autre chose : `prep` est une liste de consignes
   exécutées d'abord — la préparation s'écrit dans la même langue que le reste,
   ce qui la rend lisible et la vérifie au passage. `genre` dit ce qu'on attend :
   « trace » (des objets naissent), « agit » (un réglage change, rien ne naît),
   « refuse » (le refus EST la bonne réponse) ou « rien » (une remarque). */
const FEUILLE = [[300, 520, 'A'], [640, 520, 'B'], [470, 260, 'C'], [830, 320, 'D'],
                 [520, 700, 'O']];
const VIDE = [];

const GROUPES = [
  ['Placer des points', [
    ['Place un point A', { pts: VIDE }],
    ['Place 3 points A, B, C non alignés', { pts: VIDE }],
    ['Place les points A, B, C alignés', { pts: VIDE }],
    ['Place les points A et B tels que AB = 4 cm', { pts: VIDE }],
    ['Place les points A, B et C tels que AB = 5 cm, AC = 4 cm et BC = 3 cm', { pts: VIDE }],
    'Place un point M sur [AB]',
    'Place un point M sur [AB] tel que AM = 2 cm',
    ['Place un point M sur le cercle', { prep: ['Trace le cercle de centre A et de rayon 3 cm'] }],
    ['Place un point M sur le cercle de centre A tel que BM = 4 cm',
      { prep: ['Trace le cercle de centre A et de rayon 3 cm'] }],
    ['Place le point C, intersection du cercle de centre A et du cercle de centre B',
      { pts: VIDE, prep: ['Place les points A et B tels que AB = 3 cm',
        'Trace le cercle de centre A et de rayon 2,5 cm',
        'Trace le cercle de centre B et de rayon 2,5 cm'] }],
    'Place le milieu I de [AB]',
    'Place les milieux I de [AB] et J de [AC]',
    'Place le point I intersection de (AB) et (CD)',
    'Place le point D tel que ABCD soit un parallélogramme',
  ]],
  ['Traits', [
    'Trace [AB]',
    'Trace (AB)',
    'Trace [AB)',
    'Trace le segment [AB] de 5 cm',
    'Trace [AB], [BC] et [CA]',
    'Trace une droite',
    'Trace deux droites d et d\'',
    'Trace la droite (d) passant par A et B',
    'Relie A à B',
    'Prolonge [AB]',
    'Partage le segment [AB] en trois parts égales',
    'Reporte la longueur AB à partir de C',
  ]],
  ['Cercles', [
    'Trace le cercle de centre A passant par B',
    'Trace le cercle de centre A et de rayon 3 cm',
    'Trace le cercle de centre A de rayon [AC]',
    'Trace le cercle de diamètre [AB]',
    'Trace un cercle de circonférence 12 cm',
    'Trace le cercle circonscrit au triangle ABC',
    ['Trace une rosace', { pts: VIDE }],
    ['Trace une rosace de 4 cm', { pts: VIDE }],
    ['Trace une rosace à 8 pétales', { pts: VIDE }],
    ['Trace une graine de vie', { pts: VIDE }],
    'Trace le cercle inscrit dans le triangle ABC',
    ['Trace un rayon du cercle', { prep: ['Trace le cercle de centre A et de rayon 3 cm'] }],
    ['Trace une corde du cercle', { prep: ['Trace le cercle de centre A et de rayon 3 cm'] }],
    ['Trace la tangente au cercle en A', { prep: ['Trace le cercle de centre O passant par A'] }],
    'Trace un arc de cercle de centre A de rayon 3 cm',
    'Trace un demi-cercle de diamètre [AB]',
    'Trace un disque de rayon 3 cm',
    ['Trace deux cercles', { pts: VIDE }],
    ['Trace deux cercles sécants', { pts: VIDE }],
    ['Trace deux cercles tangents', { pts: VIDE }],
    ['Colorie le disque de centre A en rouge', { prep: ['Trace le cercle de centre A et de rayon 3 cm'], genre: 'agit' }],
  ]],
  ['Triangles', [
    'Trace un triangle ABC',
    'Soit ABC un triangle quelconque',
    'On considère un triangle ABC tel que AB = 5 cm',
    'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm',
    'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et l\'angle BAC = 60°',
    'Trace un triangle ABC tel que AB = 6 cm, l\'angle BAC = 40° et l\'angle ABC = 60°',
    'Trace un triangle dont les angles mesurent 40°, 60° et 80°',
    'Trace un triangle équilatéral ABC de 4 cm de côté',
    'Trace un triangle ABC isocèle en A de côté 5 cm et de base 3 cm',
    'Trace un triangle ABC rectangle en A tel que AB = 3 cm et AC = 4 cm',
    'Trace un triangle ABC isocèle rectangle en A de côté 4 cm',
  ]],
  ['Quadrilatères et polygones', [
    'Trace un carré ABCD de 3 cm de côté',
    'Trace un carré d\'aire 16 cm²',
    'Trace un rectangle ABCD de 5 cm sur 3 cm',
    'Trace un rectangle de périmètre 20 cm et de longueur 6 cm',
    'Trace un losange ABCD de 4 cm de côté',
    'Trace un losange dont les diagonales mesurent 6 cm et 4 cm',
    'Trace un parallélogramme ABCD',
    'Trace un trapèze ABCD',
    'Trace un trapèze rectangle',
    'Trace un pentagone ABCDE de 3 cm de côté',
    'Trace un hexagone ABCDEF de 3 cm de côté',
    'Trace un polygone régulier à 7 côtés',
    'Trace un hexagone régulier inscrit dans un cercle de rayon 3 cm',
    'Trace un carré inscrit dans un cercle de rayon 3 cm',
    'Trace un triangle équilatéral inscrit dans un cercle de rayon 3 cm',
    'Trace le polygone ABCDE',
    'Trace un carré ABCD et ses diagonales',
  ]],
  ['Droites remarquables', [
    'Trace la médiatrice de [AB]',
    'Trace la perpendiculaire à (AB) passant par C',
    'Trace la parallèle à (AB) passant par C',
    'Trace la bissectrice de l\'angle ABC',
    'Trace la hauteur issue de A dans le triangle ABC',
    'Trace la médiane issue de A dans le triangle ABC',
    'Trace les médiatrices du triangle ABC',
    'Trace les bissectrices du triangle ABC',
    'Trace les hauteurs du triangle ABC',
    'Trace deux droites parallèles',
    'Trace deux droites perpendiculaires',
    'Trace deux droites sécantes',
  ]],
  ['Points remarquables du triangle', [
    'Place le centre de gravité G du triangle ABC',
    'Place l\'orthocentre H du triangle ABC',
    'Place le centre du cercle circonscrit O au triangle ABC',
    'Place les milieux des côtés du triangle ABC',
    'Trace un triangle ABC et ses médiatrices',
    ['Trace la droite des milieux du triangle ABC', { prep: ['Trace un triangle ABC'] }],
    ["Trace la droite d'Euler du triangle ABC", { prep: ['Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm'] }],
  ]],
  ['Angles', [
    'Trace un angle de 60°',
    'Trace un angle AOB de 130°',
    'Marque l\'angle ABC',
    'L\'angle ABC mesure 60°',
    'Marque les angles du triangle ABC',
    ["Partage l'angle ABC en deux angles égaux", { prep: ['Trace un triangle ABC'] }],
    ["Partage l'angle ABC en quatre angles égaux", { prep: ['Trace un triangle ABC'] }],
    ["Partage l'angle ABC en trois angles égaux", { prep: ['Trace un triangle ABC'], genre: 'refuse' }],
    ['Marque l\'angle droit en A', { prep: ['Trace un triangle ABC rectangle en A tel que AB = 3 cm et AC = 4 cm'] }],
  ]],
  ['Configurations d\'angles', [
    'Trace deux droites parallèles coupées par une sécante',
    'Trace des angles correspondants',
    'Trace des angles alternes-internes',
    'Trace des angles alternes-externes',
    'Trace deux angles opposés par le sommet',
    'Trace deux angles supplémentaires',
    'Trace deux angles complémentaires',
    'Trace deux angles adjacents',
  ]],
  ['Transformations', [
    'Trace le symétrique de A par rapport à O',
    'Trace le symétrique de A par rapport à (EF)',
    'Trace A\', B\', C\' symétriques de A, B, C par rapport à O',
    ['Construis A\'B\'C\' symétrique de ABC par rapport à (d)', { prep: ['Trace un triangle ABC', 'Trace une droite d'] }],
    ['Construis A\'B\'C\' image de ABC par la translation de vecteur DE', { prep: ['Trace un triangle ABC', 'Place les points D et E'] }],
    'Construis A\'B\'C\' image de ABC par la rotation de centre O, de sens direct et d\'angle 30°',
    ['Construis l\'image de ABC par l\'homothétie de centre O et de rapport 2', { prep: ['Trace un triangle ABC'] }],
    ['Trace un agrandissement du triangle ABC de rapport 2', { prep: ['Trace un triangle ABC'] }],
    ['Trace une réduction du triangle ABC de rapport 1/2', { prep: ['Trace un triangle ABC'] }],
  ]],
  ['Solides en perspective cavalière', [
    'Trace un cube de 4 cm',
    'Trace un cube d\'arête 4 cm',
    'Trace un pavé droit de 6 cm sur 3 cm sur 2 cm',
    'Trace un parallélépipède rectangle de 6 cm, 4 cm et 3 cm',
    'Trace une pyramide à base carrée de côté 3 cm et de hauteur 5 cm',
    'Trace un tétraèdre',
    'Trace une pyramide à base triangulaire',
    'Trace un prisme droit à base triangulaire de 3 cm de côté et de 5 cm de hauteur',
    'Trace un prisme droit à base hexagonale de 2 cm de côté et de 5 cm de hauteur',
    ['Trace un cylindre de rayon 2 cm et de hauteur 5 cm', { genre: 'refuse' }],
    ['Trace une sphère de rayon 3 cm', { genre: 'refuse' }],
  ]],
  ['Patrons', [
    'Trace le patron d\'un cube de 3 cm',
    'Trace le patron d\'un cube d\'arête 4 cm',
    'Trace le développement d\'un cube de 3 cm',
    'Trace le patron d\'un pavé droit de 5 cm sur 3 cm sur 2 cm',
    'Trace le patron d\'un pavé droit de dimensions 6 cm, 4 cm et 3 cm',
    'Trace le patron d\'un pavé droit de longueur 5 cm, de largeur 3 cm et de hauteur 2 cm',
    'Trace le patron d\'un parallélépipède rectangle de 5 cm, 3 cm et 2 cm',
    'Trace le patron d\'une pyramide à base carrée de côté 4 cm et de hauteur 6 cm',
    'Trace le patron d\'un cylindre de rayon 2 cm et de hauteur 5 cm',
    'Trace le patron d\'un cylindre de diamètre 4 cm et de hauteur 5 cm',
    'Trace le patron d\'un cône de rayon 3 cm et de hauteur 5 cm',
    'Trace le patron d\'un cône de rayon 3 cm et de génératrice 5 cm',
    'Trace le patron d\'un prisme droit à base triangulaire de 3 cm de côté et de 5 cm de hauteur',
    'Trace le patron d\'un tétraèdre régulier de 4 cm d\'arête',
    'Trace le patron d\'une pyramide à base triangulaire de 4 cm',
    'Trace le patron d\'une pyramide à base triangulaire de côté 4 cm et de hauteur 7 cm',
    ['Trace le patron d\'une sphère de rayon 3 cm', { genre: 'refuse' }],
  ]],
  ['Montrer la méthode', [
    'Montre-moi comment on trace deux droites parallèles',
    'Montre-moi la méthode pour tracer un carré',
    'Explique comment on trace la médiatrice de [AB]',
    'Comment construit-on un hexagone régulier ?',
    'Comment faire pour tracer un triangle équilatéral ?',
    'Comment place-t-on le milieu d\'un segment ?',
    'Comment reporter une longueur au compas ?',
    'Rappelle-moi comment tracer la bissectrice',
    'Je voudrais voir comment on trace un losange',
    'Peux-tu me montrer comment on trace deux droites perpendiculaires ?',
    ['Explique-moi la construction de la médiatrice de [AB]', { prep: ['Trace [AB]'] }],
    ['Quelles sont les étapes de la construction du milieu de [AB] ?', { prep: ['Trace [AB]'] }],
    "C'est quoi la méthode pour tracer une bissectrice",
    "Tu peux m'expliquer comment on reporte une longueur au compas",
  ]],
  ['Mesures, codages, couleurs', [
    ['AB = 5 cm', { prep: ['Trace [AB]'], genre: 'agit' }],
    ['Affiche la longueur de [AB]', { prep: ['Trace [AB]'], genre: 'agit' }],
    ['Code les longueurs égales', { prep: ['Trace un carré ABCD de 3 cm de côté'], genre: 'agit' }],
    'Trace [AB] en bleu',
    'Trace un carré rouge',
    'Trace un rectangle bleu en pointillé',
    'Trace un carré ABCD rempli en vert',
    'Trace un carré hachuré en rouge',
    'Trace un carré en haut à gauche',
    'Trace un carré en haut à gauche et un cercle en bas à droite',
  ]],
  ['Le papier, la feuille', [
    ['Mets le papier quadrillé', { genre: 'agit' }],
    ['Mets le papier à petits carreaux', { genre: 'agit' }],
    ['Enlève le quadrillage', { genre: 'agit' }],
    ['Efface tout', { genre: 'agit' }],
    'Efface tout puis trace un triangle ABC',
  ]],
  ['Phrases d\'énoncé qui ne tracent rien', [
    'Étape 1',
    'Que remarques-tu ?',
    'Justifie ta réponse',
    'Explique pourquoi ABC est isocèle',
    'Quelle est la nature du quadrilatère ABCD ?',
    'Elle passe par O',
    "Qu'en déduis-tu ?",
    "Explique pourquoi les médiatrices d'un triangle sont concourantes",
  ]],
];

(async () => {
  const verifie = process.argv.includes('--check');
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  const page = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE);
  await page.waitForTimeout(1500);
  await page.evaluate((f) => { window.__FEUILLE = f; }, FEUILLE);

  let rates = 0, total = 0;
  const lignes = [];
  for (const [titre, phrases] of GROUPES) {
    lignes.push('', '## ' + titre, '',
                '| Ce qu\'on écrit | Ce que le logiciel répond |', '|---|---|');
    for (const entree of phrases) {
      total++;
      const ph = Array.isArray(entree) ? entree[0] : entree;
      const opt = (Array.isArray(entree) ? entree[1] : null) || {};
      const genre = opt.genre || (titre.indexOf('ne tracent rien') >= 0 ? 'rien' : 'trace');
      const r = await page.evaluate(([x, pts, prep]) => {
        const app = window.app;
        app.entities = []; app.historyPast = []; app._consignes = []; app._cslSujet = null;
        if (app.cslOublier) app.cslOublier();
        (pts || window.__FEUILLE).forEach(p => app.addEntity(new Point(p[0], p[1], p[2])));
        for (const q of (prep || [])) {
          try { app.executerConsigneAvec(q, false); } catch (e) { /* la prépa n'est pas le sujet */ }
        }
        const n0 = app.entities.length;
        let res;
        try { res = app.executerConsigneAvec(x, false); }
        catch (e) { return { ok: false, message: 'EXCEPTION — ' + e.message, cree: 0 }; }
        return { ok: res.ok, message: res.message, cree: app.entities.length - n0 };
      }, [ph, opt.pts, opt.prep]);
      const bon = genre === 'refuse' ? !r.ok
                : genre === 'trace' ? (r.ok && r.cree > 0)
                : r.ok;
      if (!bon) { rates++; console.log('  ✗ ' + ph + ' → ' + r.message); }
      const echappe = (s) => String(s).replace(/\|/g, '\\|');
      const marque = genre === 'refuse' ? '↯ ' : '';
      lignes.push(`| ${echappe(ph)} | ${bon ? marque : '**⚠ '}${echappe(r.message)}${bon ? '' : '**'} |`);
    }
  }

  const entete = [
    '# Ce que GéoMaster comprend',
    '',
    'Chaque phrase de ce fichier a été **réellement exécutée** dans un navigateur,',
    'et la colonne de droite est la réponse du logiciel, recopiée telle quelle.',
    'Le fichier est écrit par `node tests/catalogue.js` : il ne peut donc pas',
    'promettre ce qui ne marche pas.',
    '',
    `**${total} phrases**, dont ${total - rates} passent.`,
    '',
    'Quelques principes qui valent partout :',
    '',
    '- **Les points qui manquent sont posés.** Une phrase qui parle de A, B, C sur',
    '  une feuille vide ne se refuse pas : les points naissent, et le logiciel le dit.',
    '- **La notation oubliée est rappelée, pas sanctionnée.** `AB`, `[AB]` et `(AB)`',
    '  passent tous les trois ; la bulle explique lequel était attendu.',
    '- **Deux consignes dans une phrase.** « … et ses médiatrices », « … puis trace … »,',
    '  « efface tout puis … » : la phrase se découpe toute seule.',
    '- **La case « avec les instruments »** décide si l\'on voit la figure seule ou la',
    '  construction complète — règle, équerre, compas, étape par étape. Une phrase qui',
    '  demande la méthode (« montre-moi comment… ») force les instruments.',
    '- **Le style tient dans la phrase** : « en bleu », « en pointillés », « rouge »,',
    '  « rempli en vert », « hachuré », « en haut à gauche ». Il ne vaut que pour cette',
    '  ligne-là et ne touche pas la palette.',
    '- **Les mesures sont vraies.** Rien n\'est mis à l\'échelle pour tenir dans l\'écran :',
    '  un patron de cube de 5 cm mesure 15 cm sur 20 cm, et déborde. C\'est voulu — on',
    '  imprime, on découpe, on mesure.',
  ];
  const texte = entete.concat(lignes).join('\n') + '\n';

  await b.close();
  if (errs.length) { console.log('ERREURS JS : ' + errs.slice(0, 3).join(' | ')); rates++; }
  if (verifie) {
    const ancien = fs.existsSync(SORTIE) ? fs.readFileSync(SORTIE, 'utf8') : '';
    if (ancien !== texte) { console.log('CONSIGNES.md n\'est plus à jour : relancez node tests/catalogue.js'); rates++; }
  } else {
    fs.writeFileSync(SORTIE, texte);
    console.log('CONSIGNES.md écrit — ' + total + ' phrases, ' + rates + ' en échec');
  }
  console.log(`\n${rates ? `=== ${rates} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(rates ? 1 : 0);
})();
