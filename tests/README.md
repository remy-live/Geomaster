# Les sondes

Chaque fichier `probe-*.js` ou `audit-*.js` est un petit programme autonome qui
**ouvre GéoMaster dans un vrai navigateur, se comporte comme un utilisateur**,
puis vérifie le résultat. Par exemple :

| Sonde | Ce qu'elle vérifie |
|---|---|
| `probe-croquis.js` | un carré tracé à main levée devient un vrai carré, avec ses points |
| `probe-persistance.js` | un appui à côté d'un texte le ferme sans en rouvrir un autre |
| `probe-pdf-textes.js` | le texte du PDF tombe au même endroit que sur la feuille |
| `probe-reprise.js` | après fermeture du navigateur, la figure revient à l'identique |
| `probe-url-encre.js` | l'encre du stylo survit au lien de partage, au pixel près |
| `probe-rect-tri.js` | le rectangle se construit à partir de deux points, comme le carré |
| `probe-milieu-report.js` | le milieu d'un segment s'aimante, et le compas reporte une longueur |
| `probe-survol-liste.js` | survoler une ligne du tiroir allume l'objet sur la feuille |
| `probe-hors-connexion.js` | tout marche réseau coupé, et `index_offline.html` est à jour |
| `probe-code-figure.js` | le code d'une figure s'ouvre partout, même venu d'une autre machine |
| `probe-tableau.js` | la construction s'avance à la télécommande, et le trait s'épaissit pour la salle |
| `probe-seance.js` | plusieurs pages dans un document, un seul PDF, une bibliothèque de séances |
| `probe-consigne-fermer.js` | la croix de la fenêtre des consignes la ferme vraiment |
| `probe-equerre-repere.js` | le repère rouge de l'équerre tombe juste, le rejeu la pose — et pour prolonger une perpendiculaire, c'est la **règle posée sur le trait déjà fait**, l'équerre rangée avant |
| `probe-annuler-rejeu.js` | annuler pendant une construction magique l'arrête au lieu de tout bloquer |
| `probe-mesure-clavier.js` | une longueur et un angle se donnent au clavier, dans l'unité affichée |
| `probe-palette-repliee.js` | repliée, la palette tient dans 50 px et le crayon se règle d'un clic |
| `probe-apercu-eleve.js` | l'aperçu du lien élève a les vraies dimensions de chaque appareil |
| `probe-consigne.js` | la phrase du manuel est comprise et faite ; la notation oubliée est expliquée |
| `probe-cibles-doigt.js` | au doigt, aucune commande ne descend sous 32 px — et rien ne gonfle à la souris |
| `probe-rotation.js` | l'appui long sur la main tourne la figure sans la déformer ; partir tout de suite déplace |
| `probe-enonce.js` | un énoncé de devoir entier, collé tel quel, donne la figure — et elle est juste |
| `probe-voyage.js` | la figure voyage ENTIÈRE par les quatre chemins — fichier .json, code compact, lien élève, bibliothèque : nom des droites, codage des milieux, remplissages, ET l'énoncé |
| `probe-enonce-long.js` | le vocabulaire d'un énoncé de manuel : droites nommées, pluriels qui ne débordent pas, possessifs, trapèzes, angles, phrases qui ne tracent rien — chaque figure **mesurée** |
| `probe-codage-milieu.js` | un milieu porte ses deux traits ; le codage n'affirme que ce que la construction dit ; un trait ne porte QU'UN codage |
| `probe-consigne-tel.js` | au téléphone, les consignes prennent la moitié basse de l'écran et la feuille l'autre |
| `probe-fiche.js` | la fiche se compose — étapes choisies, rangées, réécrites — et l'aperçu est le vrai PDF |
| `probe-commandes.js` | les 246 commandes de l'interface s'exécutent sans rien casser |
| `probe-transformations.js` | symétrie, translation, rotation, homothétie : la figure obtenue est **mesurée** (longueurs conservées ou multipliées par *k*, images au pixel près, sens de rotation) ; aux instruments l'image n'entre qu'à la fin ; la bulle explique la formulation ; « sans les outils » ne laisse que la figure |
| `probe-consigne-eclair.js` | une phrase se trace sans ouvrir le panneau (13 % de l'écran au lieu de 46), sur les trois appareils ; elle se range quand même avec la figure ; la case des instruments décide et s'en souvient ; la loupe et le crayon ne font pas doublon |
| `probe-premiere-minute.js` | une feuille vide invite (la phrase, en clair) au lieu de commander (la télécommande de rejeu) ; la phrase trace ET se range dans les consignes ; elle ne mange pas le premier clic ; le vocabulaire est celui d'un professeur ; et pendant le rejeu **on voit où on en est** — le curseur paraît, avance, et glisse pendant les animations d'outil |
| `probe-telephone.js` | au téléphone, tout outil et toute commande sont à **un appui** : la grille les porte tous, nommés et tapables, et le bouton qui l'ouvre ne paraît que là où une bande cache vraiment quelque chose |
| `probe-modales.js` | les treize fenêtres suivent le même patron — aucune ne fixe sa largeur ni la couleur de son titre dans un style en ligne, chacune garde la largeur qu'elle avait, et aucune ne déborde jusqu'à 320 px |
| `probe-vocabulaire.js` | **les solides en perspective cavalière** (face avant en vraie grandeur, fuyantes à 45° réduites de moitié, arêtes cachées en pointillés — tout mesuré) ; **où sur la feuille** (quatre figures aux quatre coins au lieu du même point) ; **remplir remplit** au lieu de colorier le contour ; **les choses cachées** — et surtout ce qu'elles n'ont PAS le droit de faire : après le code Konami, pas un objet, pas un réglage, pas une annulation de changés ; **la dictée vocale** — « égal / vaut / fait » valent `=`, « assez » vaut `AC`, la lettre perdue d'un côté se déduit et se dit ; une phrase dont aucune mesure n'est lisible est REFUSÉE au lieu de tracer un triangle quelconque en disant oui ; onze phrases de manuel gagnées, chacune **mesurée** : la parallèle et la perpendiculaire posent leurs points ET la droite de référence ; deux droites parallèles font 0° et perpendiculaires 90°, angle droit codé ; un triangle décrit par ses trois angles les respecte (et une somme ≠ 180° est refusée avec le total) ; un losange par ses deux diagonales a quatre côtés égaux ; un cercle par sa circonférence a le rayon C ÷ 2π ; le papier se choisit à la phrase — et **deux figures cachées** dont on vérifie les vraies propriétés (Koch : 3 × 4ⁿ côtés tous égaux ; Théodore : rayons en 1, √2, √3…) ; **la couleur et les pointillés valent AUSSI aux instruments** — les sept figures peintes, les pointillés posés, les traces de construction restées grises et les arcs orange ; et **chaque côté n'existe qu'une fois** (le rectangle en comptait huit, l'hexagone douze) |
| `probe-tikz.js` | l'export LaTeX : les coordonnées du `.tex` **mesurent** ce que l'énoncé demande (AB = 5 cm dans le fichier), les y sont retournés, l'angle droit sort en carré, le vecteur en `->`, aucune syntaxe qui exigerait une bibliothèque non déclarée — et **pdflatex compile** quatre figures quand il est installé |
| `probe-vecteur.js` | l'appui long sur le segment ouvre ses **options** (le sens que ce geste a déjà ailleurs), le mode se **voit** sur le bouton et survit au rechargement, la pointe est peinte et survit aux quatre chemins d'enregistrement, et la loupe trouve « Vecteur » |
| `audit-constructions.js` | **l'audit** : il exécute les 174 phrases de `CONSIGNES.md` et applique à toutes le même principe — un point posé sur un objet doit en **dépendre** (ce qui distingue le défaut de la coïncidence, c'est l'ordre : un point créé après l'objet y a été posé, créé avant c'est lui qui l'a construit) ; aux instruments, chaque animation de tracé doit être suivie de **la figure qu'elle trace**, sinon l'outil tourne à vide ; et il doit rester des points libres à prendre. Il a trouvé 21 constructions fautives — sommets d'un polygone « inscrit » qui ne l'étaient pas, intersections de deux cercles qui n'en dépendaient pas, centres des dessins au compas qui s'en détachaient — et 13 outils qui traçaient dans le vide, dont le tout premier geste du logiciel |
| `probe-fiches.js` | **les figures des fiches** : l'**étoile à N branches** — sommets sur le cercle et régulièrement répartis, cordes de même longueur, six branches de deux en deux donnant SIX cordes en deux triangles, huit de trois en trois d'un seul trait, le **contour** à dix côtés, trois branches refusées, et **aucun codage** sur une figure décorative ; la **spirale du carré** — chaque arc part exactement où le précédent s'arrête (mesuré au centième de pixel) et le rayon grandit du côté ; le **papier polaire** — cercles régulièrement espacés, rayons partant du centre, angle des secteurs en français |
| `probe-dessins.js` | **les dessins au compas** — chat, panda, souris, chouette, ourson, coccinelle, poisson, escargot, cœur : les neuf se tracent, chacune a ses pièces et tient dans un cadre raisonnable, ce sont de **vraies figures** (aucune trace de compas, aucune animation quand on n'a pas demandé les instruments), la taille se donne (« un chat de 5 cm » fait 5 cm de rayon), le compas **dessine** au rejeu — c'est elle qui a attrapé les huit tracés suivis d'un point et zéro image dessinée —, et l'énoncé relu dit « un chat » au lieu de huit « cercle de centre ? », phrase qui se rejoue ; **chaque cercle a un centre visible et nommé**, et on le prend à la souris sans que le cercle change de rayon ; et surtout **une seule longueur se mesure** — la sonde relit la table pièce par pièce et refuse toute direction qui ne soit pas un multiple de 30° ou 45°, toute distance et tout rayon hors de la liste des longueurs qui se reportent, puis vérifie que le cercle de base et ses SIX reports sont bien tracés aux instruments |
| `probe-rosace.js` | **la rosace, et le « ? » qui n'existait pas** : « trace une rosace » répondait « Je n'ai pas compris » alors que la figure existait déjà au bout d'un outil — la sonde vérifie le cercle et ses six pétales, que les centres des pétales sont **sur** le cercle et en **dépendent**, que le rayon et le nombre de pétales se donnent, que le compas fait le tour aux instruments et rien sans eux ; que l'énoncé relu dit « rosace » en UNE phrase au lieu de sept « arc de centre ? », et qu'il se **rejoue** à l'identique ; qu'au rejeu **le compas tourne et dessine** — 95 images sur 116 et 475° d'amplitude, contre **0 image** et 239° avant, chaque animation de tracé étant bien suivie de la figure qu'elle trace ; et que la barre éclair a bien le « ? » que son refus promettait — 34 px, il ouvre la liste, la rosace y figure |
| `probe-nom-droite.js` | **le nom d'une droite, et le tremblement de la sélection** : un double-clic sur un trait l'appelle par une minuscule (un nom déjà pris est refusé), le nom se déplace **comme la lettre d'un point** — le long du trait, de part et d'autre, et avec n'importe quel outil en main —, il n'est **pas en gras**, et sa place voyage par le lien de partage ; et surtout, la sonde tire une sélection le long d'une rangée de points fixes — 80 images, 32 passées à portée d'aimant — et vérifie que la figure avance de **3 px à chaque image**, alors qu'elle bondissait de 14 px puis 13 px dès que le curseur s'aimantait |
| `probe-angles-config.js` | **les configurations d'angles sont-elles CONSTRUITES, ou dessinées ?** Chaque point y était libre, à des coordonnées calculées pour que ça ait l'air juste. La sonde ne regarde pas le dessin : elle vérifie les **dépendances** (C a (AB) pour parent, O est un vrai point d'intersection, (d') est une `ParallelLine`, B est sur la perpendiculaire), puis elle **déplace une poignée de 37 px** et redemande les angles — une propriété qui ne survit pas au déplacement n'était pas une propriété. Mesuré avant : 191,7° au lieu de 180°, 104,8° au lieu de 90°, et des angles « égaux » qui ne l'étaient plus. Elle vérifie aussi que la figure des parallèles est **manipulable** — cinq points libres A, B, C, E, F, D qui glisse le long de (CD), G et H aux intersections, plus une seule poignée cachée — et qu'après avoir tiré A de 90 px, (CD) reste parallèle à 0° près et G reste sur ses deux droites ; et qu'une parallèle nommée **écrit son nom** sur la figure |
| `probe-angle-droit.js` | l'angle droit se pose à l'**équerre**, pas au rapporteur, et le compas donne le sommet — figures **mesurées** (90°, longueurs données, Pythagore) ; le triangle impossible dit *pourquoi* ; « efface tout puis … » s'exécute et reste annulable ; « … et ses diagonales » marche aussi aux instruments |
| `probe-don.js` | on ne demande qu'après avoir servi (dix ouvertures) et qu'à un moment de valeur, jamais deux fois dans la même séance ni par-dessus une autre fenêtre ; « plus tard » recule de vingt ouvertures puis vaut non ; **la fenêtre n'a que deux boutons** — « J'ai déjà donné » a été retiré, et la petite ligne ne promet plus un bouton absent ; l'élève ne compte rien ; jamais devant une classe (projection, plein écran) ; le chiffre affiché est **le sien**, vrai et vérifiable |
| `probe-programme.js` | **le programme de construction à l'envers** : le logiciel relit la figure et écrit son énoncé, ou la marche à suivre geste par geste. La sonde ne juge pas le style — elle **rejoue** l'énoncé sur une feuille vide et compare les longueurs ([3, 4, 5] redonne [3, 4, 5]) ; le carré passe par l'équerre et jamais par la diagonale ; l'hexagone se fait au compas seul et dit pourquoi ; un symétrique n'est affirmé qu'après vérification au demi-pixel, et trois points quelconques n'en deviennent pas un ; une feuille vide n'a pas de programme, et on le dit ; **la nature n'est dite que si elle apprend quelque chose** — le triangle 5-3-4 n'est plus annoncé « rectangle ABC » alors que l'angle droit est en C, l'isocèle nomme son sommet, et un quadrilatère donne sa diagonale parce que quatre côtés n'en fixent aucun ; **quatre onglets EN TÊTE du panneau**, sur une seule ligne, avec un point sur celui qui a de quoi lire — on trace, l'énoncé se rédige tout seul à côté, et « Mon énoncé » n'est jamais touché ; **chaque ligne doit tenir la suivante** — « Place les points A et B » donne AB, un point sur un cercle dit où sur ce cercle, et la rosace entière se rejoue sans une ligne refusée (écart 0,002 cm) ; un pentagone **concave** ne se déplie plus au rejeu (l'éventail part d'un sommet qui voit toute la figure) ; **on nomme le support** au lieu d'écrire « sur le trait précédent » ; le point du bord d'un cercle n'est annoncé que s'il sert ; et le bloc recopié dans « Mon énoncé » est **visible** au lieu de tomber sous le pli |
| `probe-cadre-selection.js` | le **cadre de sélection** à la souris ET au doigt : un glissé depuis le vide encadre, un glissé dedans déplace **en bloc** — tous les points du même écart, au pixel près, et le carré reste un carré ; les points calculés suivent sans être tirés et restent **exactement** au milieu de leur côté ; Maj ajoute, Échap et le changement d'outil relâchent ; le zoom ne fausse rien ; et les autres outils tracent toujours, sans cadre |
| `probe-patrons.js` | **les patrons** — le mot ne donne plus une perspective ; six faces tiennent par cinq plis, et le pli en pointillés reste la figure ; les mesures sont **vraies** (cube 3 cm → 9 sur 12 cm, 19 arêtes toutes à 3 cm) ; le cylindre a 2πr = 12,57 cm, le cône un secteur de 185,2° et une génératrice de 5,83 cm, la pyramide son apothème 6,32 cm distingué de l'arête 6,63 cm ; la sphère est refusée **pour la bonne raison** ; **les configurations d'angles** — correspondants, alternes, opposés par le sommet sont ÉGAUX et de même couleur, supplémentaires et complémentaires font 180° et 90° en deux couleurs ; **« montre-moi comment »** force les instruments alors que la case est décochée, « explique pourquoi » ne trace toujours rien, et une méthode sans données pose son propre exemple ; la parallèle sort la règle ET l'équerre, et la figure obtenue est **mesurée** à 0° et 90° ; et **ce qui répondait « oui » en faisant autre chose** — la droite d'Euler (trois centres alignés, déterminant nul, OH ÷ OG = 3, refusée sur un équilatéral), deux cercles sécants (deux cercles, deux points d'intersection à 0 pixel des deux), un angle partagé en quatre (quatre angles égaux) et en trois (refusé : Wantzel) ; **qui est inscrit dans qui** — le côté d'un polygone inscrit vaut 2 R sin(180°/n), mesuré sur quatre figures, sans casser le cercle inscrit ni le circonscrit ; le **prisme droit** en perspective, arêtes cachées décidées au produit scalaire ; le cylindre et la sphère **refusés en disant pourquoi** au lieu de renvoyer vers « la hauteur issue de A » ; une phrase de raisonnement qui ne construit rien même quand elle parle de médiatrices ; et « Colorie le disque » qui ne fabrique plus un second cercle |
| `probe-biblio-menus.js` | la bibliothèque se présente de trois façons, s'en souvient et compte seize constructions ; l'aperçu est sur fond blanc, quadrillage remis après ; le menu Fichier range ses icônes en quatre bandes sans un mot ni un pixel de plus par icône ; **les quatre transformations rangées sont RELUES** — axe, centre et vecteur hors de la figure, translation au compas seul, longueurs conservées ou multipliées par le rapport ; la barre des transformations sélectionne, compte, valide et désigne ; le petit trait de la graduation enjambe le bord du rapporteur |

Elles ne prouvent pas que le logiciel est bon : elles ne vérifient que ce à quoi
quelqu'un a pensé. Elles protègent **ce qui a déjà été vérifié une fois**, pour
que ça ne reparte pas en arrière.

## Les lancer

```bash
npm install --no-save playwright
npx playwright install chromium
node tests/lancer.js                 # toutes, par paquets — environ 2 minutes
node tests/lancer.js probe-stylo.js  # une seule
```

`GM_CHROME=/chemin/vers/chrome` impose un navigateur précis ; sans cette
variable, celui que Playwright a installé est utilisé.

## Automatiquement

`.github/workflows/tests.yml` les lance à **chaque poussée** sur le dépôt. Une
coche verte ou une croix rouge apparaît alors à côté de la version sur GitHub,
et un courriel part si c'est rouge. Rien à installer ni à lancer soi-même.

## En ajouter une

Copier la plus proche, garder la même fin :

```js
console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
process.exit(fail ? 1 : 0);
```

C'est le code de sortie — 0 ou non — que le lanceur regarde.

Les fichiers dont une sonde a besoin (comme le PDF de trois pages) sont dans
`fixtures/`.

## Le catalogue

`catalogue.js` n'est pas une sonde : c'est lui qui **écrit** `CONSIGNES.md`, à la
racine. Il exécute réellement 205 phrases dans un navigateur et recopie la
réponse du logiciel en face de chacune.

```bash
node tests/catalogue.js          # réécrit CONSIGNES.md
node tests/catalogue.js --check  # vérifie sans écrire
```

Une liste de ce qu'un logiciel sait faire, tenue à la main, ment au bout de trois
semaines : on ajoute une phrase et l'on oublie la liste, ou l'on écrit dans la
liste une phrase que le logiciel ne comprend plus. Après avoir touché au lecteur
de consignes, relancer `node tests/catalogue.js` et regarder le diff : c'est le
résumé le plus court de ce qui a changé pour l'utilisateur.
