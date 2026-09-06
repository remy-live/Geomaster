# Ce que GéoMaster comprend

Chaque phrase de ce fichier a été **réellement exécutée** dans un navigateur,
et la colonne de droite est la réponse du logiciel, recopiée telle quelle.
Le fichier est écrit par `node tests/catalogue.js` : il ne peut donc pas
promettre ce qui ne marche pas.

**181 phrases**, dont 181 passent.

Quelques principes qui valent partout :

- **Les points qui manquent sont posés.** Une phrase qui parle de A, B, C sur
  une feuille vide ne se refuse pas : les points naissent, et le logiciel le dit.
- **La notation oubliée est rappelée, pas sanctionnée.** `AB`, `[AB]` et `(AB)`
  passent tous les trois ; la bulle explique lequel était attendu.
- **Deux consignes dans une phrase.** « … et ses médiatrices », « … puis trace … »,
  « efface tout puis … » : la phrase se découpe toute seule.
- **La case « avec les instruments »** décide si l'on voit la figure seule ou la
  construction complète — règle, équerre, compas, étape par étape. Une phrase qui
  demande la méthode (« montre-moi comment… ») force les instruments.
- **Le style tient dans la phrase** : « en bleu », « en pointillés », « rouge »,
  « rempli en vert », « hachuré », « en haut à gauche ». Il ne vaut que pour cette
  ligne-là et ne touche pas la palette.
- **Les mesures sont vraies.** Rien n'est mis à l'échelle pour tenir dans l'écran :
  un patron de cube de 5 cm mesure 15 cm sur 20 cm, et déborde. C'est voulu — on
  imprime, on découpe, on mesure.

## Placer des points

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Place un point A | Point A placé |
| Place 3 points A, B, C non alignés | 3 points placés : A, B, C |
| Place les points A, B, C alignés | 3 points placés : A, B, C |
| Place les points A et B tels que AB = 4 cm | 2 points placés : A, B |
| Place les points A, B et C tels que AB = 5 cm, AC = 4 cm et BC = 3 cm | 3 points placés : A, B, C |
| Place un point M sur [AB] | M sur [AB] |
| Place un point M sur [AB] tel que AM = 2 cm | M sur [AB], à 2 cm de A |
| Place un point M sur le cercle | M sur le cercle de centre A |
| Place un point M sur le cercle de centre A tel que BM = 4 cm | M sur le cercle de centre A, à 4 cm de B |
| Place le point C, intersection du cercle de centre A et du cercle de centre B | C — intersection du cercle de centre A et du cercle de centre B |
| Place le milieu I de [AB] | I est le milieu de [AB] |
| Place les milieux I de [AB] et J de [AC] | Milieux : I, J |
| Place le point I intersection de (AB) et (CD) | I — intersection de (AB) et (CD) |
| Place le point D tel que ABCD soit un parallélogramme | Parallélogramme DABC |

## Traits

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace [AB] | Segment [AB] |
| Trace (AB) | Droite (AB) |
| Trace [AB) | Demi-droite [AB) |
| Trace le segment [AB] de 5 cm | Segment [AB] |
| Trace [AB], [BC] et [CA] | 3 tracés |
| Trace une droite | Droite (d) |
| Trace deux droites d et d' | 2 droites tracées : (d), (d') |
| Trace la droite (d) passant par A et B | Droite (AB) |
| Relie A à B | A–B reliés |
| Prolonge [AB] | [AB] prolongé en droite |
| Partage le segment [AB] en trois parts égales | [AB] partagé en 3 parts égales : E, F |
| Reporte la longueur AB à partir de C | AB reporté à partir de C : CE = 6,8 cm |

## Cercles

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace le cercle de centre A passant par B | Cercle de centre A passant par B |
| Trace le cercle de centre A et de rayon 3 cm | Cercle de centre A de rayon 3 cm |
| Trace le cercle de centre A de rayon [AC] | Cercle de centre A de rayon [AC] |
| Trace le cercle de diamètre [AB] | Cercle de diamètre [AB] |
| Trace un cercle de circonférence 12 cm | Cercle de centre E de circonférence 12 cm |
| Trace le cercle circonscrit au triangle ABC | Cercle circonscrit à ABC |
| Trace le cercle inscrit dans le triangle ABC | Cercle inscrit dans ABC |
| Trace un rayon du cercle | Rayon [AE] |
| Trace une corde du cercle | Corde [EF] |
| Trace la tangente au cercle en A | Tangente au cercle en A |
| Trace un arc de cercle de centre A de rayon 3 cm | Arc de cercle de centre A |
| Trace un demi-cercle de diamètre [AB] | Demi-cercle de diamètre [AB] |
| Trace un disque de rayon 3 cm | Disque de centre E de rayon 3 cm |
| Trace deux cercles | 2 cercles : (A), (B) |
| Trace deux cercles sécants | 2 cercles sécants : (A), (B) — ils se coupent en C et D |
| Trace deux cercles tangents | 2 cercles tangents : (A), (B) — ils se touchent en C |
| Colorie le disque de centre A en rouge | Remplissage sur le disque de centre A |

## Triangles

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace un triangle ABC | Triangle ABC |
| Soit ABC un triangle quelconque | Triangle ABC |
| On considère un triangle ABC tel que AB = 5 cm | Triangle ABC |
| Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm | Triangle ABC |
| Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et l'angle BAC = 60° | Triangle ABC |
| Trace un triangle ABC tel que AB = 6 cm, l'angle BAC = 40° et l'angle ABC = 60° | Triangle ABC |
| Trace un triangle dont les angles mesurent 40°, 60° et 80° | Triangle EFG |
| Trace un triangle équilatéral ABC de 4 cm de côté | Triangle ABC |
| Trace un triangle ABC isocèle en A de côté 5 cm et de base 3 cm | Triangle ABC |
| Trace un triangle ABC rectangle en A tel que AB = 3 cm et AC = 4 cm | Triangle ABC |
| Trace un triangle ABC isocèle rectangle en A de côté 4 cm | Triangle ABC |

## Quadrilatères et polygones

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace un carré ABCD de 3 cm de côté | Carré ABCD |
| Trace un carré d'aire 16 cm² | Carré EFGH |
| Trace un rectangle ABCD de 5 cm sur 3 cm | Rectangle ABCD |
| Trace un rectangle de périmètre 20 cm et de longueur 6 cm | Rectangle EFGH |
| Trace un losange ABCD de 4 cm de côté | Losange ABCD |
| Trace un losange dont les diagonales mesurent 6 cm et 4 cm | Losange EFGH |
| Trace un parallélogramme ABCD | Parallélogramme ABCD |
| Trace un trapèze ABCD | Trapèze ABCD |
| Trace un trapèze rectangle | Trapèze EFGH |
| Trace un pentagone ABCDE de 3 cm de côté | Pentagone ABCDE |
| Trace un hexagone ABCDEF de 3 cm de côté | Hexagone ABCDEF |
| Trace un polygone régulier à 7 côtés | Polygone régulier à 7 côtés EFGHIJK |
| Trace un hexagone régulier inscrit dans un cercle de rayon 3 cm | Hexagone EFGHIJ inscrit dans le cercle de centre K et de rayon 3 cm |
| Trace un carré inscrit dans un cercle de rayon 3 cm | Carré EFGH inscrit dans le cercle de centre I et de rayon 3 cm |
| Trace un triangle équilatéral inscrit dans un cercle de rayon 3 cm | Triangle EFG inscrit dans le cercle de centre H et de rayon 3 cm |
| Trace le polygone ABCDE | Polygone ABCD |
| Trace un carré ABCD et ses diagonales | Carré ABCD · 2 diagonales de ABCD |

## Droites remarquables

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace la médiatrice de [AB] | Médiatrice de [AB] |
| Trace la perpendiculaire à (AB) passant par C | Perpendiculaire à (AB) passant par C |
| Trace la parallèle à (AB) passant par C | Parallèle à (AB) passant par C |
| Trace la bissectrice de l'angle ABC | Bissectrice de l'angle ABC |
| Trace la hauteur issue de A dans le triangle ABC | Hauteur issue de A |
| Trace la médiane issue de A dans le triangle ABC | Médiane issue de A |
| Trace les médiatrices du triangle ABC | Les 3 médiatrices de ABC |
| Trace les bissectrices du triangle ABC | Les 3 bissectrices de ABC |
| Trace les hauteurs du triangle ABC | Les 3 hauteurs de ABC |
| Trace deux droites parallèles | Deux droites parallèles : (d), (d') |
| Trace deux droites perpendiculaires | Deux droites perpendiculaires : (d), (d') |
| Trace deux droites sécantes | Deux droites sécantes : (d), (d') |

## Points remarquables du triangle

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Place le centre de gravité G du triangle ABC | G — centre de gravité de ABC |
| Place l'orthocentre H du triangle ABC | H — orthocentre de ABC |
| Place le centre du cercle circonscrit O au triangle ABC | E — centre du cercle circonscrit de OAB |
| Place les milieux des côtés du triangle ABC | Milieux des côtés de ABC : E, F, G |
| Trace un triangle ABC et ses médiatrices | Triangle ABC · Les 3 médiatrices de ABC |
| Trace la droite des milieux du triangle ABC | Droite des milieux (EF) du triangle ABC — parallèle à (BC) |
| Trace la droite d'Euler du triangle ABC | Droite d'Euler de ABC — E, F, G alignés |

## Angles

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace un angle de 60° | Angle FEG = 60° |
| Trace un angle AOB de 130° | Angle AOB = 130° |
| Marque l'angle ABC | Angle ABC marqué |
| L'angle ABC mesure 60° | Angle ABC = 60° |
| Marque les angles du triangle ABC | 3 angles marqués : A, B, C |
| Partage l'angle ABC en deux angles égaux | Angle ABC partagé en 2 angles égaux de 28,4° |
| Partage l'angle ABC en quatre angles égaux | Angle ABC partagé en 4 angles égaux de 14,2° |
| Partage l'angle ABC en trois angles égaux | ↯ Partager un angle quelconque en 3 à la règle et au compas est IMPOSSIBLE — ce n'est pas une limite du logiciel, c'est un théorème (Wantzel, 1837) : c'est la fameuse trisection de l'angle. On sait le faire en 2, 4, 8, 16… : chaque partage est une bissectrice, et une bissectrice coupe en deux. |
| Marque l'angle droit en A | Angle droit codé en A |

## Configurations d'angles

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace deux droites parallèles coupées par une sécante | Deux parallèles (d) et (d') coupées par la sécante (Δ) |
| Trace des angles correspondants | Angles correspondants en I et en J — 56° et 56° |
| Trace des angles alternes-internes | Angles alternes-internes en I et en J — 56° et 56° |
| Trace des angles alternes-externes | Angles alternes-externes en I et en J — 56° et 56° |
| Trace deux angles opposés par le sommet | Angles AOB et A'OB' opposés par le sommet — 72° et 72° |
| Trace deux angles supplémentaires | Angles AOC et COB supplémentaires — 114° + 66° = 180° |
| Trace deux angles complémentaires | Angles AOC et COB complémentaires — 36° + 54° = 90° |
| Trace deux angles adjacents | Angles AOB et BOC adjacents, de côté commun [OB) — 49° et 60° |

## Transformations

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace le symétrique de A par rapport à O | A' — symétrique de A par rapport à O |
| Trace le symétrique de A par rapport à (EF) | A' — symétrique de A par rapport à (EF) |
| Trace A', B', C' symétriques de A, B, C par rapport à O | A', B', C' — symétriques de A, B, C par rapport à O |
| Construis A'B'C' symétrique de ABC par rapport à (d) | A', B', C' — symétriques de A, B, C par rapport à (d) |
| Construis A'B'C' image de ABC par la translation de vecteur DE | A', B', C' — images de A, B, C par la translation de vecteur DE |
| Construis A'B'C' image de ABC par la rotation de centre O, de sens direct et d'angle 30° | A', B', C' — images de A, B, C par la rotation de centre O, de sens direct et d'angle 30° |
| Construis l'image de ABC par l'homothétie de centre O et de rapport 2 | A', B', C' — images de A, B, C par l'homothétie de centre O et de rapport 2 |
| Trace un agrandissement du triangle ABC de rapport 2 | A', B', C' — images de A, B, C par l'homothétie de centre E et de rapport 2 |
| Trace une réduction du triangle ABC de rapport 1/2 | A', B', C' — images de A, B, C par l'homothétie de centre E et de rapport 0,5 |

## Solides en perspective cavalière

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace un cube de 4 cm | Cube EFGHIJKL — perspective cavalière |
| Trace un cube d'arête 4 cm | Cube EFGHIJKL — perspective cavalière |
| Trace un pavé droit de 6 cm sur 3 cm sur 2 cm | Pavé droit EFGHIJKL — perspective cavalière |
| Trace un parallélépipède rectangle de 6 cm, 4 cm et 3 cm | Pavé droit EFGHIJKL — perspective cavalière |
| Trace une pyramide à base carrée de côté 3 cm et de hauteur 5 cm | Pyramide EFGHI à base carrée — perspective cavalière |
| Trace un tétraèdre | Tétraèdre EFGH — perspective cavalière |
| Trace une pyramide à base triangulaire | Tétraèdre EFGH — perspective cavalière |
| Trace un prisme droit à base triangulaire de 3 cm de côté et de 5 cm de hauteur | Prisme droit à base triangulaire — 6 sommets, 9 arêtes — perspective cavalière |
| Trace un prisme droit à base hexagonale de 2 cm de côté et de 5 cm de hauteur | Prisme droit à base hexagonale — 12 sommets, 18 arêtes — perspective cavalière |
| Trace un cylindre de rayon 2 cm et de hauteur 5 cm | ↯ Je ne sais pas encore dessiner un cylindre en perspective : il y faudrait des ellipses, et je n'en ai pas. En revanche je sais tracer son PATRON — écrivez « Trace le patron d'un cylindre de rayon 2 cm et de hauteur 5 cm ». |
| Trace une sphère de rayon 3 cm | ↯ Je ne sais pas encore dessiner une sphère en perspective : il y faudrait des ellipses, et je n'en ai pas. Une sphère n'a d'ailleurs pas de patron non plus : sa surface est courbe dans toutes les directions. |

## Patrons

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Trace le patron d'un cube de 3 cm | Patron d'un cube de 3 cm d'arête — 6 faces, 5 plis |
| Trace le patron d'un cube d'arête 4 cm | Patron d'un cube de 4 cm d'arête — 6 faces, 5 plis |
| Trace le développement d'un cube de 3 cm | Patron d'un cube de 3 cm d'arête — 6 faces, 5 plis |
| Trace le patron d'un pavé droit de 5 cm sur 3 cm sur 2 cm | Patron d'un pavé droit 5 × 3 × 2 cm — 6 faces, 5 plis |
| Trace le patron d'un pavé droit de dimensions 6 cm, 4 cm et 3 cm | Patron d'un pavé droit 6 × 4 × 3 cm — 6 faces, 5 plis |
| Trace le patron d'un pavé droit de longueur 5 cm, de largeur 3 cm et de hauteur 2 cm | Patron d'un pavé droit 5 × 3 × 2 cm — 6 faces, 5 plis |
| Trace le patron d'un parallélépipède rectangle de 5 cm, 3 cm et 2 cm | Patron d'un pavé droit 5 × 3 × 2 cm — 6 faces, 5 plis |
| Trace le patron d'une pyramide à base carrée de côté 4 cm et de hauteur 6 cm | Patron d'une pyramide à base carrée de 4 cm de côté et 6 cm de hauteur — 5 faces, 4 plis |
| Trace le patron d'un cylindre de rayon 2 cm et de hauteur 5 cm | Patron d'un cylindre de rayon 2 cm et de hauteur 5 cm — un rectangle de 12,57 cm sur 5 cm et deux disques |
| Trace le patron d'un cylindre de diamètre 4 cm et de hauteur 5 cm | Patron d'un cylindre de rayon 2 cm et de hauteur 5 cm — un rectangle de 12,57 cm sur 5 cm et deux disques |
| Trace le patron d'un cône de rayon 3 cm et de hauteur 5 cm | Patron d'un cône de rayon 3 cm et de hauteur 5 cm — un disque et un secteur de 5,83 cm de rayon, d'angle 185,2° |
| Trace le patron d'un cône de rayon 3 cm et de génératrice 5 cm | Patron d'un cône de rayon 3 cm et de hauteur 4 cm — un disque et un secteur de 5 cm de rayon, d'angle 216° |
| Trace le patron d'un prisme droit à base triangulaire de 3 cm de côté et de 5 cm de hauteur | Patron d'un prisme droit à base triangulaire de 3 cm de côté et 5 cm de hauteur — 5 faces, 4 plis |
| Trace le patron d'un tétraèdre régulier de 4 cm d'arête | Patron d'un tétraèdre régulier de 4 cm d'arête — 4 faces, 3 plis |
| Trace le patron d'une pyramide à base triangulaire de 4 cm | Patron d'une pyramide à base triangulaire de 4 cm de côté et 3,27 cm de hauteur — 4 faces, 3 plis |
| Trace le patron d'une pyramide à base triangulaire de côté 4 cm et de hauteur 7 cm | Patron d'une pyramide à base triangulaire de 4 cm de côté et 7 cm de hauteur — 4 faces, 3 plis |
| Trace le patron d'une sphère de rayon 3 cm | ↯ Une sphère n'a pas de patron : sa surface est courbe dans toutes les directions, on ne peut pas l'aplatir sans la déchirer. C'est pour la même raison qu'une carte du monde déforme toujours quelque chose. |

## Montrer la méthode

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Montre-moi comment on trace deux droites parallèles | Deux droites parallèles : (d), (d') |
| Montre-moi la méthode pour tracer un carré | Carré EFGH — construction détaillée |
| Explique comment on trace la médiatrice de [AB] | Médiatrice de [AB] |
| Comment construit-on un hexagone régulier ? | Hexagone EFGHIJ — construction détaillée |
| Comment faire pour tracer un triangle équilatéral ? | Triangle EFG — construction au compas |
| Comment place-t-on le milieu d'un segment ? | G est le milieu de [EF] — construction au compas |
| Comment reporter une longueur au compas ? | EF reporté à partir de G : GH = 4,4 cm |
| Rappelle-moi comment tracer la bissectrice | Bissectrice de l'angle FEG |
| Je voudrais voir comment on trace un losange | Losange EFGH — construction détaillée |
| Peux-tu me montrer comment on trace deux droites perpendiculaires ? | Deux droites perpendiculaires : (d), (d') |
| Explique-moi la construction de la médiatrice de [AB] | Médiatrice de [AB] |
| Quelles sont les étapes de la construction du milieu de [AB] ? | E est le milieu de [AB] — construction au compas |
| C'est quoi la méthode pour tracer une bissectrice | Bissectrice de l'angle FEG |
| Tu peux m'expliquer comment on reporte une longueur au compas | EF reporté à partir de G : GH = 4,4 cm |

## Mesures, codages, couleurs

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| AB = 5 cm | [AB] mesure 5 cm |
| Affiche la longueur de [AB] | 1 longueur affichée |
| Code les longueurs égales | Codages posés |
| Trace [AB] en bleu | Segment [AB] — en bleu |
| Trace un carré rouge | Carré EFGH — en rouge |
| Trace un rectangle bleu en pointillé | Rectangle EFGH — en bleu, en pointillés |
| Trace un carré ABCD rempli en vert | Carré ABCD — en vert |
| Trace un carré hachuré en rouge | Carré EFGH — en rouge |
| Trace un carré en haut à gauche | Carré EFGH |
| Trace un carré en haut à gauche et un cercle en bas à droite | Carré EFGH · Cercle de centre I |

## Le papier, la feuille

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Mets le papier quadrillé | Papier : papier à carreaux |
| Mets le papier à petits carreaux | Papier : papier à carreaux |
| Enlève le quadrillage | Papier : papier blanc |
| Efface tout | Feuille effacée (5 objets) — annulable par Ctrl+Z |
| Efface tout puis trace un triangle ABC | Feuille effacée (5 objets) — annulable par Ctrl+Z · Triangle ABC |

## Phrases d'énoncé qui ne tracent rien

| Ce qu'on écrit | Ce que le logiciel répond |
|---|---|
| Étape 1 | Étape 1 |
| Que remarques-tu ? | Remarque — rien à tracer sur cette ligne |
| Justifie ta réponse | Remarque — rien à tracer sur cette ligne |
| Explique pourquoi ABC est isocèle | Remarque — rien à tracer sur cette ligne |
| Quelle est la nature du quadrilatère ABCD ? | Remarque — rien à tracer sur cette ligne |
| Elle passe par O | Remarque — rien à tracer sur cette ligne |
| Qu'en déduis-tu ? | Remarque — rien à tracer sur cette ligne |
| Explique pourquoi les médiatrices d'un triangle sont concourantes | Remarque — rien à tracer sur cette ligne |
