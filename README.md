# GéoMaster

Un logiciel de géométrie pour la classe, dans un seul fichier HTML.

Pas d'installation, pas de compte, pas de serveur : on ouvre la page, on
construit avec de vrais instruments, et on partage la figure par un lien.

**→ [remy-live.github.io/Geomaster](https://remy-live.github.io/Geomaster/)**

---

## Ce qu'il fait

### Des instruments qu'on manipule

Règle, équerre, compas et rapporteur se prennent en main comme sur le tableau :
on écarte le compas, on le plante, on le fait tourner ; l'équerre se colle à la
règle quand on l'en approche en tournant, et glisse le long d'une droite déjà
tracée. Pointe posée sur le zéro de la règle, le compas **reste le long des
graduations** pendant qu'on l'écarte, et son ouverture se cale sur la longueur
d'un segment déjà tracé — c'est le report de longueur. Le rapporteur centré sur
un sommet pose son zéro sur un côté de l'angle. L'aimantation trouve toute seule
les points, les intersections et les **milieux** — et se coupe d'un bouton quand
elle gêne.

**Et toute la figure tourne.** Un énoncé ne dit jamais dans quel sens la poser :
on la construit comme elle vient, et l'on s'aperçoit après coup qu'elle serait
plus lisible d'un quart de tour. Un **bouton** le fait d'un clic — quatre clics
ramènent la figure d'où elle vient — et pour un angle libre, **appui long sur la
main**, puis on tourne :
l'angle s'affiche pendant le geste et se colle aux angles ronds à 3° près, Échap
annule, et une rotation ne compte que pour une annulation. Partir tout de suite
déplace la feuille comme avant : c'est l'immobilité qui demande la rotation.

Ce sont les **objets** qui tournent, pas la vue : les instruments, l'export, le
lien élève et le rejeu continuent de parler de la même figure — et les longueurs
sont conservées au millième près, sans quoi ce ne serait pas une rotation.
L'**image de fond** suit : une photo de manuel calée sous la figure resterait
sinon droite pendant que la figure pivote, et se décollerait de ce qu'elle sert
à caler.

**Et tout se vise au doigt.** Sur un écran sans souris, chaque commande dispose
d'au moins 34 px : une croix de 23 px se rate, on tape à côté, et l'on croit que
le logiciel n'a pas réagi. Seule la zone touchable grandit — le dessin reste le
même, et sur un ordinateur rien ne gonfle.

### On écrit la consigne, le logiciel la fait

Le **panneau des consignes** (`Ctrl+E`) est une **liste de lignes numérotées**.
Une ligne, une consigne : on écrit la phrase comme dans un manuel — *« Trace le
cercle de centre A passant par B »* — et **Entrée**. La réponse s'affiche **sous
cette ligne-là** : trois consignes écrites, trois réponses lisibles en même
temps.

**Le panneau EST l'énoncé, pas un formulaire.** Une pastille, une bordure, un
fond et un cadre de saisie par consigne : on lisait des cases, plus un texte.
Ne restent que les phrases, et un **filet de couleur au bord gauche** qui dit
l'état d'un coup d'œil — vert : faite, rouge : incomprise, rien : à faire. Le
numéro et la roue n'apparaissent que sur la ligne où l'on est. Quatorze
consignes tiennent dans 312 px au lieu de 900. **Une erreur reste visible** sans
rien faire : c'est la seule chose qu'on doit voir tout de suite.

La roue d'une ligne porte ses options — *avec les instruments*, refaire,
retirer ; la **roue du titre** porte les réglages de tout le panneau, dont
**« dessiner à chaque retour à la ligne »** : décochée, Entrée ne fait que
descendre, et l'on écrit tout l'énoncé avant de le lancer.

**COLLEZ UN ÉNONCÉ ENTIER** — chaque ligne du texte devient une consigne, les
intertitres « Étape 2 » compris. Les phrases n'ont pas besoin d'être sur des
lignes séparées : *« … de 6 cm de longueur. Place le milieu P … »* fait deux
consignes, et « 6,5 cm » n'est pas coupé pour autant. Ensuite, **▶ Tout faire**
les exécute dans l'ordre, ou **Entrée** les fait une par une.

**Faite, une ligne porte un ✓ à la place de son numéro** et ne repart pas une
seconde fois : deux fois la même ligne, ce seraient deux fois les mêmes objets.
La modifier la remet en jeu.

Sous la ligne qu'on écrit, un **bandeau montre la phrase modèle** : *« Trace un
carré de 3 cm »* ne dit pas quels sommets, et le logiciel en inventait en
silence — il montre maintenant `Trace un carré ABCD de 3 cm de côté`, qu'un clic
recopie. Le **?** du titre déplie la liste complète de ce qui est compris.

**Le panneau s'agrandit** : une poignée au coin bas-droit, et la taille choisie
est retenue d'une séance à l'autre. 340 px, c'était deux lignes de retour à la
ligne pour une consigne de triangle — on écrivait un énoncé sans le voir entier.

**Au téléphone, l'écran se partage en deux** : les consignes en bas, la figure
au-dessus — et la feuille est vraiment raccourcie, pas seulement recouverte. Une
fenêtre flottante de 340 px sur un écran de 390, c'était écrire une consigne
sans voir ce qu'elle construit. Sur grand écran, elle flotte comme avant.

Le texte libre de l'énoncé — gras, italique, listes — est toujours là, replié
sous la liste. Et **« Tout effacer » efface aussi l'énoncé** : des consignes
cochées « faites » devant une feuille vide, ce serait un compte-rendu faux.

**L'énoncé voyage avec la figure.** Il était enregistré dans le fichier `.json`
mais pas dans le code compact — celui du lien élève, de la bibliothèque et des
pages : une séance rangée le lundi rouvrait le mardi avec sa figure et sans son
énoncé. Il suit maintenant les quatre chemins, avec l'état de chaque ligne.

Chaque consigne comprise devient la **consigne de l'étape**. Un programme de
construction tapé ici donne d'un coup la figure, le rejeu narré avec vos mots,
et la fiche — dont la disposition « texte seul » est ce programme même.

Ce qu'il comprend, avec la notation française (`[AB]`, `[AB)`, `(AB)`, `A'`) :

| | |
|---|---|
| **Placer** | `Place 3 points A, B, C non alignés` · `Trace 3 points A, B, C` · `alignés` (l'écart reste inégal : l'alignement ne dit pas l'égalité) · `équidistants` · `à la même distance` · `équidistants de O` (sur un cercle) · `Place le milieu I de [AB]` · `les milieux I de [AB] et J de [AC]` · `Soit I…` |
| **Traits** | `Trace [AB]` · `[AB)` · `(AB)` · `le segment [AB] de 5 cm` · `un segment vertical [OQ] de 6 cm` · `horizontal` · `[AB], [BC] et [CA]` · `les droites (AB) et (BC)` · `Relie A à B` |
| **Droites nommées** | `Trace une droite d` · `(d)` · `Trace deux droites d et d'` — le nom est celui de l'énoncé, et il sert ensuite : `la perpendiculaire à d passant par A` · `un point M sur d` |
| **Cercles** | `de centre A passant par B` · `de rayon 3 cm` · `de 3 cm de rayon` · `de rayon [AC]` · `de diamètre [AB]` · `de 6 cm de diamètre` · `circonscrit au triangle ABC` (ou `le cercle circonscrit` tout court) · `le cercle passant par A, B et C` |
| **Dans un cercle** | `un rayon` · `un diamètre` · `une corde` · `la tangente au cercle en A` — ce sont des traits, et non des cercles |
| **Figures** | `carré ABCD de 3 cm de côté` · `rectangle de 5 cm sur 3 cm` · `losange` · `losange de côté 4 cm et de diagonale AC = 6 cm` · `parallélogramme` · `trapèze` · `trapèze rectangle` · `trapèze isocèle` · `pentagone` · `hexagone` · `octogone` · `polygone régulier à 7 côtés` · `polygone ABCDE` · `les diagonales de ABCD` |
| **Triangles** | `tel que AB = 5 cm, AC = 4 cm et BC = 3 cm` (trois longueurs) · `AB = 5 cm, AC = 4 cm et l'angle BAC = 60°` (deux longueurs et l'angle entre elles) · `AB = 6 cm, l'angle BAC = 40° et l'angle ABC = 60°` (une longueur et deux angles) · `EF = 5 cm, GF = 8 cm et l'angle FEG = 60°` (deux longueurs et l'angle qui fait face à l'une d'elles — loi des sinus ; si deux triangles répondent, il le dit) · l'angle s'écrit aussi sans le mot : `ABC = 40°`, et **par son seul sommet** : `A = 30°`, `Â = 30°`, `A° = 30°` · `équilatéral` · `isocèle en A` · `rectangle en A` · `rectangle isocèle en B` dans les deux ordres |
| **Droites remarquables** | `médiatrice de [AB]` · `les médiatrices de [AB] et [AC]` (celles-là, pas les trois du triangle) · `perpendiculaire à (AB) passant par C` · `qui passe par C` · `parallèle à…` · `bissectrice de l'angle ABC` |
| **Dans un triangle** | `les médiatrices du triangle ABC` · `les bissectrices` · `les hauteurs` · `les médianes` — les trois d'un coup, ou `la hauteur issue de A`, `issue du sommet A`, `relative à [BC]`, ou `les hauteurs issues de A et de B` · `les milieux des côtés`. Le triangle n'a pas à être redit d'une ligne à l'autre. |
| **Deux d'un coup** | `Trace un triangle ABC et ses médiatrices` · `et ses diagonales` · `et son cercle circonscrit` |
| **Points remarquables** | `le centre de gravité G` · `l'orthocentre H` · `le centre du cercle circonscrit O` · `le cercle inscrit` · `le point I intersection de (AB) et (CD)` · `un point M sur [AB]` (ou sur une droite, ou sur un cercle) |
| **Symétries** | `A', B', C' symétriques de A, B, C par rapport à O` · `par rapport à (EF)` · **`par rapport à (d)`** — l'axe peut être une droite nommée · `l'image de A par la symétrie de centre O` |
| **Translations** | `Construis A'B'C' image de ABC par la translation de vecteur DE` · `par la translation qui transforme D en E` — c'est le même vecteur, dit deux fois, et la seconde écriture est ramenée à la première |
| **Rotations** | `par la rotation de centre O, de sens direct et d'angle 30°` · `dans le sens des aiguilles d'une montre` · `de sens horaire` · `dans le sens inverse des aiguilles d'une montre` — un sens qui n'est pas dit est **signalé**, pas deviné en silence |
| **Homothéties** | `par l'homothétie de centre O et de rapport 2` · `de rapport −1,5` · `de rapport 1/2` — un rapport de −1, c'est la symétrie de centre O, et c'est dit ; un rapport nul est refusé |
| **Mesures** | `AB = 5 cm` · `Marque l'angle ABC` · `L'angle ABC mesure 60°` · `Trace un angle ABC de 40°` (les points naissent avec lui) · `Trace un angle de 60° de sommet A` · `Code l'angle droit en A` · `Marque les angles du triangle ABC` · `Marque les angles droits` · `Affiche la longueur de [AB]` · `Code les longueurs égales` |
| **Croisements nommés** | `Appelle O le point d'intersection des médiatrices` · `des hauteurs` (l'orthocentre) · `des médianes` · `des bissectrices` |
| **Couleur et style** | `Trace [AB] en bleu` · `en rouge et en pointillés` · `en gras` · `épaisseur 4` — pour cette ligne seulement |
| **Objets nommés** | `Trace le cercle C1 de centre O et de rayon 6 cm` · puis `le cercle C1` · `ce segment` · `il`, `elle` |
| **Croisements** | `il coupe le cercle C1 en deux points A et B` · `en deux points dont un est appelé C` · `elle coupe le cercle C3 en E` · `en S tel que S n'appartienne pas à [OQ]` |
| **Sur un objet** | `place le point G sur ce segment tel que GQ = 5 cm` · `un point M sur [AB]` · `deux points A et B sur ce cercle` · `un point C sur cette droite` (une médiatrice en est une) |
| **Possessifs** | `Trace un segment [AB] de 6 cm, place son milieu I` · `trace ses diagonales et appelle O leur point d'intersection` — la reformulation est dite à côté |
| **Autres verbes d'énoncé** | `Colorie le triangle ABC` · `Hachure…` · `Prolonge [AB]` · `Partage [AB] en trois parts égales` (les parts sont codées) |
| **Ce qui ne se trace pas** | `Étape 2` · `Elle passe par O` · `Que remarques-tu ?` · `Justifie ta réponse` — un énoncé de manuel ne contient pas que des constructions, et ces lignes-là ne sont pas des fautes. Ce qui n'est pas su faire est **dit** : un effacement, un triangle impossible. |
| **Arcs** | `Trace l'arc de cercle de centre O et de rayon 3 cm de A à B` |

Le verbe n'est jamais un obstacle, mais le mot juste est rappelé : `Dessine
[AB]` est exécuté, et la réponse ajoute qu'en géométrie on écrit plutôt
« Trace… » — comme pour les crochets oubliés.

**Le codage dit ce que la construction affirme, et rien de plus.** Un milieu
porte ses deux traits — un sur chaque moitié, qu'il vienne d'une phrase ou de
l'**outil milieu**, le codage n'appartenant pas au chemin qu'on a pris pour le
demander — et le segment n'est pas coupé en
deux pour autant : au tableau, on trace `[AB]` une fois et l'on pose une marque
sur chaque moitié. Une médiatrice ajoute l'angle droit : sans lui et sans les
marques, la figure ne montrait qu'une droite qui passe par là. Trois médiatrices
donnent trois marques différentes, une par côté — les coder du même trait
affirmerait que les six moitiés sont égales entre elles.

Un milieu est un **porteur de codage comme un autre** : si la moitié d'un
segment coupé en son milieu mesure autant qu'un autre segment de la figure, les
deux reçoivent la même marque — c'est la même longueur, et une figure ne le dit
pas de deux façons. Et **la marque se choisit dans toute la figure**, jamais
dans le vide : un carré de 3,8 cm posé sur un segment dont le milieu portait
déjà le trait simple recevait le même trait pour ses côtés, et la figure
affirmait que 1,9 cm valait 3,8 cm.

**Un trait ne porte qu'un codage.** Quand le milieu de `[AB]` est codé, ce sont
ses deux moitiés qui parlent : le trait est déjà marqué, et lui poser en plus une
marque de longueur ferait dire deux choses au même dessin — la seconde tombant
d'ailleurs pile sous la croix du milieu, où on ne la verrait pas. Poser un milieu
rend donc sa marque au trait, et la rangée de marques du segment s'éteint, **sauf
le Ø** : c'est par là qu'on sort. Mettez le codage du milieu à Ø, et la longueur
redevient codable. Sélectionnez le milieu, enfin, et la rangée s'ouvre pour lui —
elle ne s'ouvrait jusqu'ici que pour les segments, et la marque d'un milieu
restait celle que le logiciel avait posée seul.

Et le codage automatique qui suit une consigne **ne regarde que ce que cette
consigne vient de construire** : appliqué à toute la feuille, « même longueur ⇒
même marque » affirmait l'égalité de deux traits sans aucun rapport. Le bouton
**Codage auto**, lui, garde toute la feuille pour champ — là, c'est vous qui le
demandez.

**L'INSTRUMENT SUIT L'ÉNONCÉ.** Toute construction commence par le même geste :
on place le **premier point**, on pose la **règle** dessus, et c'est la mesure qui
donne le second — les deux extrémités n'apparaissent plus toutes faites avant que
les instruments ne sortent. Ensuite, trois longueurs se construisent au
**compas** : un arc depuis A, un autre depuis B, et le sommet est leur
croisement. Une longueur et deux angles se construisent au **rapporteur** :
on le pose en A, on **marque la graduation d'un petit trait au crayon** — à
cheval sur le bord de l'instrument, dans le prolongement du centre — et l'on
tire le trait jusque-là ; on recommence en B ; le sommet est là où les deux
traits se coupent. La mesure lue ne laissait aucune trace : un point invisible
au bord du rapporteur, et la demi-droite semblait sortir de nulle part. Le même
trait se pose **à la main** : rapporteur bloqué sur le sommet, on appuie contre
le bord à la mesure voulue. Deux longueurs et l'angle entre
elles : **rapporteur puis report de longueur au compas**. Et deux longueurs
avec l'angle qui fait face à l'une d'elles : on trace `[EF]`, on ouvre l'angle en
E, on plante le compas **sur F** avec la longueur donnée, et G est là où l'arc
coupe le trait — le compas se plante sur le sommet dont l'énoncé donne la
distance, pas sur celui qui porte l'angle.

Le logiciel ramenait *tout* à trois longueurs pour tout tracer au compas — la
figure était juste, la leçon fausse : un élève à qui l'on donne deux angles n'a
aucune longueur à reporter.

Une case décide de ce que « Trace un carré » veut dire : **la figure seule**, ou
la **construction à la règle et au compas** — arcs, instruments, étapes — bâtie
d'un coup et rejouable ensuite avec ▶. Aux constructions magiques, la même
décision s'appelle **Avec les outils** : décochée, elle donne la figure et rien
d'autre. Ces constructions-là comptent maintenant **cinq
transformations** dans leur propre bande — symétrie axiale, symétrie centrale,
translation, rotation, homothétie — au lieu des deux symétries perdues au bout
de la rangée des médiatrices.

Et les cinq se font **du même geste, en deux temps** : on sélectionne ce qu'on
transforme — autant de points qu'on veut, ou une figure entière d'un seul clic
dessus, un point repris étant retiré — on **valide**, puis on désigne l'axe, le
centre ou le vecteur. Une barre le dit et compte ce qui est pris. Chacune avait
sa propre grammaire de clics, et aucune ne la disait : rien ne pouvait signaler
la fin de la sélection, donc on ne pouvait transformer qu'**un** point. La
rotation et l'homothétie demandent leur nombre — angle et sens, ou rapport —
avant de toucher à la feuille. Elle ne retirait jusqu'ici que les instruments, et laissait les arcs de
compas et les traits de construction — un rectangle entouré de la construction
qu'on venait justement de ne pas vouloir, qui n'était ni la construction ni la
figure.

**L'écartement du compas se lit pendant le rejeu.** Il ne s'affichait qu'en
tirant la pastille à la main : la construction jouée devant la classe montrait
le compas s'ouvrir *sans dire de combien*, alors que c'est justement la mesure
qu'on est en train de prendre. La même étiquette — « 4 cm », le rayon en
pointillés — apparaît maintenant pendant l'animation et à chaque étape d'un
rejeu ; elle disparaît dès qu'on revient au travail libre, et ne part pas à
l'export.

**Aux instruments, un centre ne se calcule pas non plus : il se trouve.** Le
centre de gravité naît du croisement des trois médianes, l'orthocentre de celui
des hauteurs, le centre du cercle circonscrit des médiatrices, celui du cercle
inscrit des bissectrices. C'est la construction du manuel — et c'est elle qui
montre POURQUOI les trois se coupent au même endroit, ce qu'un point posé tout
fait n'apprend à personne. Vérifié : le point tombe à zéro pixel de sa position
théorique.

**Aux instruments, le troisième sommet ne se pose pas : il se trouve.** On trace
`[AB]` à la règle, un arc de compas depuis A, un autre depuis B — et C est leur
croisement. Il était posé d'avance, puis reposé par la construction : le même
point figurait deux fois dans la figure, son nom était écrit deux fois, et le
supprimer n'en retirait qu'un.

**Aux instruments, une image ne se pose pas non plus : elle se construit.** La
symétrie descend du point à l'axe à l'équerre et reporte la longueur au compas ;
la translation trace la parallèle au vecteur à la règle et y reporte sa longueur
au compas ; la rotation lit l'angle au **rapporteur** depuis `[OP]`, puis reporte
`OP` au compas sur la demi-droite lue ; l'homothétie trace la droite `(OP)` à la
règle et y porte au compas `|k| × OP` depuis le centre — du côté de `P` si le
rapport est positif, de l'autre s'il est négatif. Dans les quatre cas **le point
image n'entre qu'à la fin** : avant le report, rien sur la feuille ne dit encore où il
tombe, et le poser d'abord pour « justifier » ensuite, c'est montrer la réponse
avant la construction. Les trois images une fois construites, elles se relient
comme leurs sources l'étaient — une figure image est une figure, pas trois points
en l'air.

**Ce qui se dit mal mais se comprend est fait, puis expliqué dans une bulle.**
« A'B'C' symétrique de ABC par la translation de vecteur DE » n'est pas du
français mathématique — un symétrique est l'image par une symétrie — mais la
phrase se comprend : elle est exécutée, et une bulle arrondie, sous la ligne
qu'elle montre, donne la formulation juste. Il en va de même pour « la
translation qui transforme D en E » (c'est le vecteur `DE`) et pour une rotation
dont le sens n'est pas dit : le sens direct est pris, et **c'est écrit**.

Et **tout y passe**, quelle que soit la façon dont l'énoncé donne le triangle :
les cinq cas se ramènent aux trois longueurs, et trois longueurs se construisent
aux instruments — [AB] à la règle, un arc de compas depuis chaque extrémité,
leur croisement est le sommet. Même « une longueur et deux angles », qui ne
donne pourtant aucune des deux autres longueurs, sort en 22 objets dont 12
déplacements d'instruments et 2 arcs.

**Un énoncé de devoir se colle tel quel.** Celui-ci — vingt-deux lignes,
quatorze points, quatorze cercles — sort en entier, sans qu'une ligne soit
retouchée :

> *Trace un segment [OQ] de 6 cm de longueur, place le milieu P du segment [OQ]
> et le milieu R du segment [OP]. Trace le cercle C1 de centre O et de rayon
> 6 cm. Trace le cercle C2 de centre R et de rayon 7 cm, il coupe le cercle C1
> en deux points A et B. […] La droite (OQ) coupe le cercle C3 en S tel que S
> n'appartienne pas à [OQ].*

Trois choses le rendent possible. Le logiciel **retient ses objets** — « le
cercle C1 », « ce segment », « il » — sans quoi chaque phrase repartirait de
zéro. Il sait **croiser** un cercle et un cercle, un trait et un cercle, et
choisir entre deux croisements quand l'énoncé le dit. Et **la notation fait
foi** : *« la droite (OQ) »* n'est pas le segment [OQ] même si c'est lui qui est
tracé — une droite va plus loin, et c'est justement le croisement d'au-delà que
l'énoncé vise.

**On écrit vite, et en minuscules.** *« trace un triangle abc puis la médiatrice
de [ab] »* est compris : les points sont remis en majuscules **là où la phrase
désigne un point** — après « triangle », dans les crochets, dans une énumération
— et nulle part ailleurs, sans quoi « et » deviendrait un nom. La correction est
faite, puis dite : c'est une notation de cours. **« puis »** lie deux consignes
aussi bien que **« et »**.

**Et il comprend les phrases composées.** *« Trace un triangle ABC et ses
médiatrices »* fait les deux — puis explique comment l'écrire sans ambiguïté :
« ses médiatrices » est compris comme « les médiatrices des côtés du triangle
ABC ». En revanche *« … AB = 5 cm et AC = 4 cm »* décrit **une** figure et n'est
pas coupé en deux.

**Et il enseigne la notation.** Oublier les crochets n'est pas une faute de
frappe, c'est le point qu'on travaille en classe. *« Trace la médiatrice de
AB »* est donc **exécuté** — on ne bloque personne — et la notation juste
s'affiche à côté : « il manque les crochets — [AB] ». De même pour *« la
médiatrice de (AB) »* (« (AB) est la droite ; ici on attend [AB] »), *« la
perpendiculaire à [AB] »*, *« le segment (BC) »*.

Ce sont des règles, pas un modèle de langue : un fichier HTML sans réseau ne
peut pas faire autrement. Il comprend donc les phrases d'un manuel, plusieurs
formulations par consigne, et **dit quand il ne comprend pas** au lieu de
deviner — la phrase reste alors dans le champ, pour être corrigée.

**« Efface tout puis trace… »** repart d'une feuille propre sans lâcher le
clavier. Elle ne demande pas confirmation — on vient de l'écrire, c'est déjà la
réponse — et reste annulable par `Ctrl+Z`. Effacer **un** objet, en revanche,
renvoie à la gomme : une consigne construit.

**« … et ses diagonales », « les médiatrices de ce triangle »** : le possessif
et le démonstratif renvoient à la figure qu'on vient de tracer, avec ou sans les
instruments. Le logiciel dit alors comment il a compris la phrase.

### L'instrument suit l'énoncé

Ce que la phrase donne décide de l'outil qui sort — c'est toute la leçon, et la
figure seule ne la contient pas :

| ce que l'énoncé donne | l'instrument |
|---|---|
| trois longueurs | règle et **compas** (report de longueur) |
| une longueur et deux angles | règle et **rapporteur** |
| deux longueurs et un angle | rapporteur **puis** report au compas |
| **un angle droit** | **équerre**, puis le compas donne le sommet |

L'angle droit ne se mesure pas au rapporteur. *« Trace un triangle ABC rectangle
en A tel que AB = 5 cm et BC = 6 cm »* trace donc [AB] à la règle, élève la
perpendiculaire **à l'équerre** en A, et plante le **compas en B** ouvert à
6 cm : l'arc coupe la perpendiculaire, et c'est là qu'est C. Le compas se plante
au sommet dont la longueur est **donnée**, jamais ailleurs — reporter une
longueur que l'énoncé ne donne pas serait tricher.

Quand l'angle droit est en C, [AB] est l'hypoténuse : l'équerre n'a pas de bout
de segment où se poser, et la construction reste celle d'avant. La limite est
assumée, pas cachée.

**Et quand la figure n'existe pas, on dit pourquoi.** *« rectangle en A, AB =
5 cm et BC = 4 cm »* n'est pas une figure : l'angle droit étant en A, [BC] est
l'hypoténuse, et l'hypoténuse est toujours le plus long côté. C'est ce que
répond le logiciel, avec les deux longueurs sous les yeux — pas « ce triangle
n'existe pas ».

### Les solides, en perspective cavalière

*« Trace un cube »*, *« un pavé droit de 6 cm sur 4 cm sur 3 cm »*, *« un
parallélépipède rectangle »*, *« une pyramide de hauteur 5 cm »*, *« un
tétraèdre »*.

Ce ne sont **pas** des figures en trois dimensions : c'est la représentation
conventionnelle qu'on trace au cahier, et le logiciel en suit les trois règles —

- la **face avant en vraie grandeur** (4 cm sur 4 cm pour un cube d'arête 4) ;
- les **fuyantes à 45°, réduites de moitié** (2 cm) ;
- les **arêtes cachées en pointillés** — c'est la règle qu'on oublie, et c'est
  elle qui fait qu'un dessin de cube ressemble à un cube.

Un cube donne huit sommets, douze arêtes dont trois cachées ; une pyramide à
base carrée cinq sommets et huit arêtes ; un tétraèdre quatre et six. La
convention est rappelée à chaque fois, sous la consigne.

*« Parallélépipède rectangle »* contient le mot « rectangle » : sans garde-fou,
il traçait silencieusement un simple rectangle plat.

### Les patrons

*« Dessine le patron d'un cube de 3 cm »*, *« … d'un pavé droit de 5 cm sur 3 cm
sur 2 cm »*, *« … d'une pyramide à base carrée de côté 4 cm et de hauteur 6 cm »*,
*« … d'un cylindre de rayon 2 cm et de hauteur 5 cm »*, *« … d'un cône de rayon
3 cm et de hauteur 5 cm »*, *« … d'un prisme droit »*, *« … d'un tétraèdre »*.
*« Développement »* se dit aussi.

Un patron n'est pas une perspective, et c'est pourtant ce qu'on obtenait : le mot
« patron » était purement ignoré. Il gagne maintenant sur le nom du solide — *le
patron d'un cube* n'est pas un cube.

**Deux sortes de traits, et c'est tout ce qu'un patron a à dire.** Le contour se
découpe, trait plein ; les arêtes intérieures se plient, en pointillés. On ne les
choisit pas à la main : une arête partagée par deux faces est un pli, une arête
vue une seule fois est une découpe. La règle est écrite une fois et vaut pour
tous les patrons — six faces posées à plat tiennent toujours par **cinq** plis.

**Les mesures sont vraies.** Rien n'est remis à l'échelle pour tenir dans
l'écran : le patron d'un cube de 3 cm mesure 9 cm sur 12 cm, celui d'un cube de
5 cm déborde. On imprime, on découpe, on mesure — remettre à l'échelle serait
mentir sur la seule chose qui compte. L'encombrement est annoncé sous la
consigne.

Et les mathématiques sont dites, parce que c'est là qu'est l'exercice :

- le **cylindre** : la longueur du rectangle est le **périmètre du disque**,
  2 × π × 2 = 12,57 cm — c'est ce qui fait qu'il s'enroule exactement ;
- le **cône** : la génératrice √(r² + h²) = 5,83 cm est le rayon du secteur, et
  son angle vaut 360° × r ÷ g = **185,2°**, sans quoi le cône ne se referme pas ;
- la **pyramide** : les triangles ont pour hauteur l'**apothème** √(h² + (c/2)²)
  = 6,32 cm, à ne pas confondre avec l'arête latérale, 6,63 cm. C'est *la* faute
  du patron de pyramide, et un patron bâti sur la seconde ne se referme pas.

**La sphère est refusée**, et pour la bonne raison : elle n'a pas de patron, sa
surface est courbe dans toutes les directions. C'est pour cela qu'une carte du
monde déforme toujours quelque chose.

### Les configurations d'angles

*« Trace des angles correspondants »*, *« … alternes-internes »*,
*« … alternes-externes »*, *« deux angles opposés par le sommet »*,
*« … supplémentaires »*, *« … complémentaires »*, *« … adjacents »*, et la
configuration nue : *« deux droites parallèles coupées par une sécante »*.

C'est le cœur du programme de 5e, et une figure ne sert à rien si l'on ne voit
pas **de quels deux angles** on parle : ils sont donc peints en plein.

La couleur dit la propriété. Deux angles **égaux** — correspondants,
alternes-internes, alternes-externes, opposés par le sommet — reçoivent la
**même** couleur et le **même codage**. Deux angles dont la **somme** est
remarquable — supplémentaires, complémentaires, adjacents — en reçoivent deux
**différentes**, et la réponse écrit la somme : *« 114° + 66° = 180° »*.

**Ces figures sont construites, pas dessinées.** Elles ne l'étaient pas : chaque
point était *libre*, à des coordonnées calculées pour que ça ait l'air juste.
*« Le point apparaît sur l'objet sans être géométriquement correct »* — c'était
exact, et il suffisait de déplacer une poignée de 37 px pour le voir :

| | avant | maintenant |
|---|---|---|
| supplémentaires | 111,87° + 79,85° = **191,7°** | 112,17° + 67,83° = **180,00°** |
| complémentaires | 42,15° + 62,61° = **104,8°** | 42,15° + 47,85° = **90,00°** |
| opposés par le sommet | 86,47° et 60,24° — **plus égaux** | 70,25° et 70,25° |
| correspondants | 60,71° et 55,85° — **plus égaux** | 53,67° et 53,67° |

Chaque figure suit maintenant la construction qu'on dicterait au tableau :

- **Supplémentaires** — une droite (AB) ; un point C **qui appartient à** (AB) ;
  une demi-droite [CD). A, C, B sont alignés *parce que C est sur (AB)*.
- **Complémentaires** — [OA), puis B **sur la perpendiculaire à [OA) en O**. Le
  petit carré n'est plus un dessin : l'angle droit est construit. La
  perpendiculaire reste dans la figure, cachée, et se montre avec les objets
  cachés.
- **Opposés par le sommet** — deux droites (AA') et (BB'), et le sommet **est**
  leur point d'intersection.
- **Correspondants, alternes-internes et -externes** — la droite **(AB)**, la
  droite **(CD)** *vraiment parallèle* à elle, la sécante **(EF)**, et **G** et
  **H** les points d'intersection. Les six points qui définissaient cette figure
  étaient **cachés** : on ne voyait que les deux intersections, qui justement ne
  se déplacent pas — la figure du programme de 5e était un dessin qu'on ne
  pouvait pas bouger d'un millimètre. A, B, C, E et F se tirent maintenant
  librement, D glisse le long de (CD), et la propriété tient : tiré de 90 px, A
  laisse (CD) parallèle à **0°** près et les deux angles égaux.

Les côtés d'un angle sont des **demi-droites**, comme le dit la définition, et
non des segments.

### Montre-moi la méthode

*« Montre-moi comment on trace deux droites parallèles »*, *« Explique comment on
trace la médiatrice de [AB] »*, *« Montre-moi la méthode pour tracer un carré »*,
*« Comment construit-on un hexagone régulier ? »*, *« Comment reporter une
longueur au compas ? »*

Cette phrase-là ne demande pas une figure : elle demande la **méthode**. Elle
force donc les instruments, même si la case est décochée — c'est exactement ce
qu'on vient de réclamer.

Avant, *« montre-moi comment on trace deux droites parallèles »* rendait deux
droites parallèles et rien d'autre : mesuré, **zéro animation d'instrument**. Et
*« explique comment on trace la médiatrice »* était avalée par la règle des
phrases de remarque — elle ne traçait rien en répondant que tout allait bien.

**La frontière est le mot qui suit.** *Comment* demande à voir faire ; *pourquoi*
demande une justification, et cela reste une remarque. *« Explique pourquoi ABC
est isocèle »* ne trace toujours rien.

**Une méthode se montre sur un exemple.** *« Comment place-t-on le milieu d'un
segment ? »* ne nomme aucun segment, et la réponse était « De quoi ? Écrivez
Place le milieu I de [AB] » — une leçon de rédaction à qui demande une leçon de
géométrie. Le logiciel pose maintenant l'exemple lui-même, et le dit.

### La parallèle et la perpendiculaire se tracent au geste

La parallèle n'était pas construite du tout : elle apparaissait. Elle se trace
maintenant **à la règle et à l'équerre**, et le geste est tout l'enseignement —
l'équerre se pose le long de la droite, la règle sert de rail perpendiculaire,
l'équerre **glisse** le long du rail sans tourner (c'est ce glissement qui garde
l'écart constant), et l'on trace au bord de l'équerre arrivée.

On n'a pas pris la construction « deux perpendiculaires successives » : elle est
juste, mais ce n'est pas le geste qu'on montre en classe.

Le **milieu**, lui, se posait au calcul, pile au milieu, sans un geste. Aux
instruments il s'obtient au compas : les deux arcs donnent la médiatrice, qui
coupe le segment en son milieu.

Et *« Reporte la longueur AB à partir de C »* — le premier geste du compas, celui
qu'on apprend avant tout le reste — ne traçait rien et répondait « Je n'ai pas
compris ». Le compas prend l'écartement, se plante en C, trace son arc ; les deux
traits portent la même marque.

### Ce qui répondait « oui » en faisant autre chose

Une phrase qui répond « oui » en traçant autre chose est **pire qu'une phrase
refusée** : rien à l'écran ne prévient. Trente-cinq phrases de collège ont été
passées au banc, et neuf faisaient exactement cela. Cinq sont réparées :

- *« Trace un triangle et sa droite d'Euler »* traçait le triangle **et une
  droite quelconque**. Elle passe maintenant par les trois centres — déterminant
  mesuré nul, et OH ÷ OG = 3. Sur un triangle équilatéral elle est **refusée** :
  les trois centres sont confondus, c'est le seul cas où cela arrive.
- *« Trace deux cercles sécants »* traçait **un** cercle. Il y en a deux, et
  leurs deux points d'intersection sont posés — vérifiés à 0 pixel des deux
  cercles. *« Tangents »* donne le point de contact.
- *« Partage l'angle ABC en quatre angles égaux »* répondait « Angle ABC
  marqué ». Quatre angles de 28,5°, mesurés égaux. Et **en trois, c'est
  refusé** : la trisection à la règle et au compas est impossible, et le refus le
  dit — c'est un théorème (Wantzel, 1837), pas une limite du logiciel.
- *« Trace un agrandissement du triangle ABC de rapport 2 »* retraçait le même
  triangle par-dessus. AB = 4 cm devient A′B′ = 8 cm.
- *« Trace un demi-cercle de diamètre [AB] »* traçait le cercle **entier**.

Puis un second passage, sur un corpus de **214 phrases** écrites par des lecteurs
indépendants du code — dix de plus :

- *« Trace un hexagone régulier inscrit dans un cercle de rayon 3 cm »* répondait
  **« De quel triangle ? »** puis traçait un cercle inscrit. « Le **cercle**
  inscrit dans le triangle » et « un **hexagone** inscrit dans un cercle »
  emploient le même mot pour deux figures opposées. Et le rayon donné était pris
  pour un côté — juste par accident pour l'hexagone, faux pour tous les autres.
  Le côté vaut maintenant 2 R sin(180°/n), vérifié : 3 cm, 2,3 cm, 4,24 cm et
  5,2 cm pour l'hexagone, l'octogone, le carré et le triangle équilatéral.
- *« Trace un cylindre de rayon 2 cm et de hauteur 5 cm »* répondait **« Écrivez
  *Trace la hauteur issue de A dans le triangle ABC* »**. Le cylindre, le cône et
  la sphère sont maintenant **refusés en disant pourquoi** — il y faudrait des
  ellipses — et le refus indique ce qu'on sait faire : leur patron.
- Le **prisme droit**, lui, ne demande pas d'ellipse : il se dessine, à base
  triangulaire, carrée, pentagonale ou hexagonale. Les arêtes cachées sont
  décidées au produit scalaire contre la fuyante, pas à l'estime.
- *« Explique pourquoi les médiatrices d'un triangle sont concourantes »*
  **construisait** le centre du cercle circonscrit : la règle du croisement
  voyait « médiatrices » et « concourantes », pas « Explique pourquoi ». Une
  phrase de raisonnement ne construit rien, quel que soit son sujet.
- *« Colorie le disque de centre A en rouge »* fabriquait un **second cercle** et
  réclamait un rayon : le verbe de remplissage passait après le bâtisseur de
  cercles. Un disque se colorie maintenant — c'est la figure des diagrammes
  circulaires et des fractions.

Le reste est listé dans [`IDEES.md`](IDEES.md), en tête, parce que c'est le plus
urgent.

### Le programme de construction, à l'envers

Le logiciel sait exécuter une suite de consignes. Il sait maintenant faire le
**chemin inverse** : relire la figure et écrire le programme qui la construit.
C'est l'exercice « rédige un programme de construction » de tous les manuels —
celui qu'on corrige à la main, un cahier après l'autre.

**Quatre onglets en tête du panneau des consignes**, parce que ce sont quatre
textes différents : **Consignes** (ce qu'on écrit ligne par ligne, et qui se
trace), **Mon énoncé** (le texte libre du professeur, auquel rien ne touche),
**La figure**, **Aux instruments**.

Ils étaient à *deux* niveaux de profondeur : il fallait deviner un petit bouton
« Énoncé libre ▾ » au coin bas-droit de la liste, puis trouver les onglets
dessous. Personne ne les trouvait — « il faut pouvoir trouver l'énoncé ». Ils
sont maintenant la navigation du panneau : nommés à l'écran dès l'ouverture, sur
une seule ligne (le panneau est passé de 340 à 396 px pour cela), et **un point
bleu** paraît sur « La figure » et « Aux instruments » dès que la feuille porte
quelque chose — on n'ouvre pas un onglet qu'on croit vide.

Les deux derniers sont **relus sur la figure** et se refont à chaque changement :
on trace, et l'énoncé se rédige à côté. Un bouton les recopie dans « Mon
énoncé » quand on veut les retoucher — ils ne s'y ajoutent plus tout seuls, ce
qui, au bout de trois essais, empilait le texte sans qu'on distingue plus ce
qu'on avait écrit de ce que la machine avait relu.

**La figure** — ce qu'il faut obtenir, sans dire comment.

> Trace un triangle ABC tel que AB = 5 cm, BC = 3 cm et CA = 4 cm.

**📐 Aux instruments** — la marche à suivre, geste par geste.

> 1. À la règle, trace un segment [AB] de 5 cm.
> 2. Avec le compas, prends un écartement de 3 cm et mets la pointe sur B. Trace un arc de cercle.
> 3. Avec le compas, prends un écartement de 4 cm et mets la pointe sur A. Trace un arc de cercle.
> 4. Le point d'intersection des deux arcs est le point C.
> 5. À la règle, trace [BC] et [CA].

Quatre choses font la différence entre un texte plausible et un texte juste :

- **On ne dit la nature d'une figure que si elle apprend quelque chose.** La
  première version écrivait *« Trace un triangle **rectangle** ABC tel que
  AB = 5 cm, BC = 3 cm et CA = 4 cm »*. C'était faux : le triangle 5-3-4 est bien
  rectangle, mais **en C** — mesuré, 36,9° en A, 53,1° en B, 90° en C —, et
  « triangle rectangle ABC » se lit « rectangle en A ». Trois côtés déterminent
  déjà le triangle : ajouter la nature n'apprend rien et, en prime, donnerait la
  réponse de l'exercice. Un triangle **isocèle**, lui, nomme son sommet —
  *« isocèle en C tel que CA = CB = 4 cm et AB = 6 cm »* — parce que là, le nom
  raccourcit vraiment les données.
- **Quatre longueurs n'enferment pas un quadrilatère.** On peut l'articuler comme
  un pantographe sans en changer un seul côté : l'énoncé promettait une figure et
  en autorisait une infinité. Il donne maintenant les **diagonales issues d'un
  sommet**, qui le triangulent — c'est d'ailleurs exactement ce que fait la
  construction au compas. Le mot *diagonale*, lui, n'est pas écrit : la phrase
  portait « (ce sont les diagonales issues de A) », et ce mot-là renvoyait la
  phrase relue vers la règle des diagonales, qui répondait « De quelle figure ? ».
  Un énoncé qui ne se relit pas n'est pas un énoncé.
- **Pas n'importe quel sommet : un sommet qui voit toute la figure.** Sur un
  pentagone **concave**, l'éventail depuis A sort de la figure au sommet
  rentrant — produits vectoriels +362 900, +236 375, **−121 375** : le signe
  change. Les triangles se retournent, et l'énoncé rejoué **dépliait** la figure
  (BE passait de 11,1 à 20,3 cm, mesuré). Le programme cherche donc un sommet
  dont l'éventail garde le même sens, et fait tourner la liste pour partir de
  là. Si aucun ne convient, il ne fait pas semblant : il écrit la figure point
  par point et le dit.
- **Un objet a un nom : on le dit.** Le texte écrivait *« Place un point H sur le
  trait précédent »* — celui qui lit doit remonter la liste, et si deux traits
  ont été faits entre-temps, il se trompe. C'est maintenant *« sur le cercle de
  centre F »*, *« sur le segment [AB] »*, *« intersection **du** segment [AB] et
  **du** segment [CD] »* — avec l'article contracté, parce qu'on écrit du
  français et pas un gabarit.
- **Chaque ligne doit tenir la suivante.** Sur une rosace, le programme écrivait
  *« 1. Place les points A et B. »*, puis, deux lignes plus loin, *« Place le
  point C, intersection des deux cercles »*. A et B pouvaient être à un
  centimètre l'un de l'autre : les cercles ne se coupaient plus, et le point C de
  la ligne 4 n'existait pas — **la ligne 1 rendait les suivantes fausses**. Chaque
  point est maintenant **accroché** à ce qui est déjà posé : une longueur le met
  sur un cercle, deux le fixent, une troisième choisit le côté. *« Place les
  points A et B tels que AB = 2,7 cm »*, *« Place un point D sur le cercle de
  centre C tel que AD = 1,4 cm et BD = 1,4 cm »*. Le tout premier point, lui,
  n'a rien avant lui, et c'est juste : une figure se pose où l'on veut sur la
  feuille. Vérifié en rejouant la rosace entière : sept lignes, aucune refusée,
  écart maximal 0,002 cm.
- **Le point du bord d'un cercle n'est pas une étape.** Un cercle se retient par
  deux points — son centre et un point du bord, qui règle le rayon — mais
  l'énoncé dit déjà *« de rayon 3 cm »*. Annoncer « Place les points F et G »
  puis ne plus jamais parler de G, c'est faire lire une ligne pour rien. Il n'est
  effacé que s'il ne sert à rien d'autre : dès qu'un rayon [FG] est tracé, il
  revient.

- **Le carré et le rectangle se font à l'équerre.** La méthode générale au compas
  est juste, mais elle passe par la *diagonale* — « écartement de 4,2 cm » pour un
  carré de 3 cm. Aucun manuel ne dit cela, et l'élève ne comprendrait pas d'où
  sort ce nombre.
- **L'hexagone régulier se fait au compas seul**, et le programme dit *pourquoi* :
  le sixième report retombe sur le premier point, donc le côté vaut le rayon.
  C'est la seule construction du collège où l'on ne mesure rien.
- **On n'invente rien.** Un point symétrique n'est déclaré nulle part dans la
  figure : on le *reconnaît* à la géométrie, et on ne l'affirme qu'après avoir
  vérifié au demi-pixel que le centre est bien le milieu exact. Trois points
  quelconques ne deviennent pas une symétrie parce que deux distances se
  ressemblent. Ce qui n'est pas reconnu est nommé pour ce qu'il est.

La sonde ne vérifie pas que le texte est joli : elle le **rejoue**. L'énoncé
écrit est réexécuté sur une feuille vide, et **toutes les distances** entre points
nommés sont comparées à celles de départ — pas seulement les côtés, justement
parce que les côtés seuls ne fixent pas un quadrilatère.

### Nommer une droite, et poser son nom où l'on veut

Une droite se nommait par la consigne — *« Trace une droite d »* — et nulle part
ailleurs : une droite tracée à la main restait anonyme pour toujours. Un
**double-clic** sur le trait ouvre maintenant de quoi l'appeler, comme on
renomme un point. La minuscule du cours est proposée (*d*, *d'*, *Δ*), sans être
imposée, et un nom déjà pris est refusé — sans quoi *« la perpendiculaire à d »*
ne désignerait plus rien.

Le nom était **cloué au second point** de la droite : sur une figure chargée il
tombait sur un autre trait, et rien ne permettait de l'écarter. On l'**attrape et
on le déplace comme la lettre d'un point** — le long du trait *et* de part et
d'autre, avec n'importe quel outil en main. La place choisie suit la figure :
fichier, lien de partage, bibliothèque. Il s'écrit en italique, comme au cours,
et **pas en gras** : le nom d'une droite n'est pas plus important que la droite.

Une parallèle ou une perpendiculaire nommée n'écrivait pas son nom du tout : la
méthode qui le dessine vit sur `LinearObject`, dont elles ne descendent pas.
Elles en héritent maintenant, et *(d')* porte son nom comme *(d)*.

### La rosace

`Trace une rosace`, `Trace une rosace de 4 cm`, `Trace une rosace à 8 pétales`,
`Trace une graine de vie`.

La figure **existait déjà** — au bout d'un outil pris dans une grille — mais
aucune phrase ne la déclenchait : « trace une rosace » répondait *« Je n'ai pas
compris »*. Elle est maintenant une consigne comme les autres, et **aux
instruments** le compas fait le tour : on ouvre l'écartement une fois, on trace
le cercle, puis on reporte ce même écartement de proche en proche. C'est la
seule construction du collège où l'on ne mesure rien, et la bulle dit pourquoi :
le sixième report retombe exactement sur le premier point.

Les six centres de pétales sont de **vrais points du cercle** — ils en
dépendent —, et les pétales de vrais arcs : sans quoi le programme de
construction relu sur la figure aurait déclaré la feuille vide. Et il la relit
**comme une rosace** : *« Trace une rosace à 6 pétales, de centre A et de rayon
4 cm »*, une phrase au lieu de sept *« Trace un arc de cercle de centre ? »* —
qui, elles, n'auraient jamais permis de la refaire. Vérifié en la rejouant :
même centre, même rayon, mêmes six pétales.

Un autre nombre de pétales se dessine, et l'on prévient que les reports ne
retombent alors plus sur le premier point.

**Le compas dessine vraiment.** Aux instruments, il tournait à vide : le tracé
progressif n'était affiché que devant un *CompassArc* — une trace de
construction — alors que la rosace est faite d'un vrai cercle et de vrais arcs,
justement pour que le programme de construction sache la relire. Et le cercle
était posé **avant** son animation, quand le rejeu regarde l'objet qui la
**suit**. Mesuré sur les deux versions, même rejeu : **0** image où le compas
dessinait, amplitude 239° ; maintenant 95 images sur 116 et 475° — un tour
complet, puis les six pétales.

### Les dessins au compas

`Trace un chat`, `Trace un panda`, `Trace un tigre de 5 cm`…

Neuf dessins qui ne demandent **que le compas et la règle** : chat, panda,
souris, chouette, ourson, coccinelle, poisson, escargot, cœur. L'intérêt n'est pas décoratif — l'élève reporte des écartements
pendant une heure sans s'apercevoir qu'il travaille.

Le répertoire vient des fiches *Dessins géométriques* et du livre **« Dessiner
avec un compas » de Laurent Stéfano**.

**Une seule longueur se mesure : le rayon de base.** La première version posait
chaque cercle à des coordonnées décimales choisies à l'œil — `['c', -0.62,
-0.78, 0.45]`. Ce n'était pas une construction, c'était une liste de points : au
compas, ces nombres-là ne se reportent pas, il faudrait les mesurer un par un à
la règle. Une figure au compas n'a qu'**un** écartement donné, et tout le reste
s'en déduit.

Chaque pièce se lit donc `['c', [direction, distance], rayon]`, où la
**direction** est un multiple de 30° ou de 45° — les 60° sont les six points
qu'on obtient en reportant le rayon sur le cercle de base, les 30° leurs
bissectrices, les 90° la perpendiculaire, les 45° sa bissectrice — et où la
**distance** et le **rayon** ne valent que *R*, ¾*R*, ½*R*, ¼*R* (plus √2⁄2 *R*,
la moitié de la diagonale du carré, pour le cœur). La moitié et le quart se
construisent à la médiatrice ; le reste se reporte. Un point peut aussi être la
**somme de deux reports** — ce qu'un compas fait quand on pointe puis qu'on
repointe. La sonde relit la table pièce par pièce : rien d'autre ne passe.

Aux instruments, le dessin commence par le cercle de base **et par les six coups
de compas qui le partagent** — au compas on ne place pas les points, on les
reporte, et cela se voit. Ajouter un animal, c'est ajouter une ligne de table.

Le **lapin** est parti au passage : ses oreilles en amande demandaient des
longueurs qui ne se reportent pas. Mieux vaut neuf dessins justes que dix dont un
triche.

**Chaque cercle a un centre visible, nommé, qu'on peut prendre.** Ils étaient
cachés : le dessin était un décor qu'on ne pouvait pas toucher, et un cercle sans
centre n'est pas une figure de géométrie. Seul le point qui règle le rayon reste
caché, comme pour n'importe quel cercle du logiciel.

Ce sont de **vraies figures** — des `Circle` et des `Arc`, pas des traces de
compas — pour que la feuille sache les relire, les enregistrer, les exporter et
les rejouer. Et l'énoncé relu ne les énumère pas : décrit pièce par pièce, un
chat donnait huit fois *« Trace le cercle de centre ? et de rayon 4 cm »*, des
phrases que personne ne pourrait suivre puisqu'elles ne disent pas où poser les
cercles les uns par rapport aux autres. Il se relit **comme un chat** :
*« Trace un chat de 4 cm »* — et cette phrase-là se rejoue.

### Les fiches « Dessins géométriques »

`Trace une étoile à 5 branches`, `à 6 branches`, `à 8 branches de 2 en 2`,
`le contour d'une étoile à 5 branches`, `Trace une spirale du carré`,
`Trace un papier polaire`, `Trace une cible à 16 rayons et 4 cercles`.

**L'étoile à N branches** : un cercle, N points reportés dessus — de vrais points
*du* cercle, qui en dépendent —, et l'on relie de *k* en *k*. Le pas décide de
tout, et la bulle le dit : à six branches de deux en deux, six et deux ont deux en
commun, le chemin se referme après trois sommets et il faut **deux tracés** — ce
sont les deux triangles de l'étoile de David. À huit branches, de trois en trois
se trace d'un seul trait ; de deux en deux donne deux carrés croisés. Le
**contour** se demande aussi : ses creux sont les croisements des cordes,
calculés et non devinés.

**La spirale du carré** : « il faut piquer avec ton compas sur les sommets du
carré en tournant ». Chaque quart de tour est pris sur le sommet suivant et le
rayon grandit du côté — *c*, 2*c*, 3*c*… Rien ne se mesure : chaque arc part
exactement où le précédent s'arrête, et la sonde le vérifie au centième de pixel.

**Le papier polaire** : la cible sur laquelle les fiches font poser un pavage.
Ce n'est pas un fond d'écran mais une figure — on la trace, on l'imprime, on
colorie dessus.

Ces figures sont **décoratives** : elles ne portent aucun codage d'égalité. Coder
les douze cordes égales d'une étoile posait cent quarante marques — le codage dit
ce qu'un énoncé impose, pas ce qu'un joli tracé produit.

### L'audit des constructions

Plutôt que de relire les constructions une par une, **`tests/audit-constructions.js`
applique le même principe à toutes** : il exécute les 174 phrases de
`CONSIGNES.md` — la liste est elle-même engendrée, donc elle ne peut pas mentir —
et vérifie trois choses.

**1. Un point posé sur un objet en dépend.** Un point qui tombe exactement sur un
trait, un cercle ou un arc sans en être l'enfant est un point posé *« là où ça
tombe juste »* : la figure devient fausse dès qu'on touche à l'objet. Ce qui
distingue le défaut de la coïncidence, c'est **l'ordre** — un point créé *après*
l'objet y a été posé et doit en dépendre ; créé *avant*, c'est lui qui a servi à
le construire (le centre d'une rosace tombe sur ses pétales, et c'est la figure
qui le veut).

L'audit a trouvé **21 constructions fautives**. Les sommets d'un polygone
« inscrit dans un cercle » étaient libres : en déplaçant le cercle ils restaient
sur place, et le polygone n'était plus inscrit du tout. Les points d'intersection
de deux cercles sécants, et le point de contact de deux cercles tangents, ne
dépendaient d'aucun des deux. Et les centres des dessins au compas — l'oreille du
chat est un point *reporté sur le cercle de la tête* — s'en détachaient au premier
geste. Tous accrochés : une oreille tourne maintenant autour de la tête et ne s'en
décolle plus.

**2. Aux instruments, l'outil ne trace pas dans le vide.** Le rejeu dessine le
trait en cours en regardant l'objet qui **suit** l'animation ; un point de
construction glissé entre les deux et l'outil tourne sur une feuille blanche.
Treize cas, tous du même genre — dont `cslPremierCote`, le tout premier geste de
presque toutes les constructions du logiciel : la règle se couchait, le second
point naissait, puis le segment paraissait d'un coup. Le point est maintenant posé
**avant** le geste.

**3. La figure se prend à la main.** Une construction dont aucun point n'est libre
est un dessin, pas une figure.

L'audit est vert sur les 174 phrases, et il tourne avec les autres sondes.

### Les figures magiques tiennent quand on tire dessus

L'audit des consignes ne voyait pas les figures de la grille — carré, hexagone,
rosace, yin-yang, symétries, rotation… : elles ne passent par aucune phrase, on
les prend dans un tiroir et l'on clique. **`tests/audit-magiques.js`** leur
applique les mêmes trois règles, plus une quatrième qui ne vaut que pour elles :
la figure doit se relire en un énoncé.

Puis on a mesuré ce qui compte vraiment : la figure survit-elle au premier geste
de l'élève ? Avant, après avoir tiré le sommet A de 60 px à gauche et 40 px en
haut :

| figure | à la construction | après avoir tiré A |
|---|---|---|
| triangle équilatéral | 240 / 240 / 240 | **303 / 246 / 240** |
| carré | 240 / 240 / 240 / 240 | **303 / 240 / 240 / 209** |
| symétrie centrale | OA = OA′ = 437 | **OA = 487, OA′ = 437** |
| translation | AA′ = DO = 488 | **AA′ = 519, DO = 488** |
| cercle circonscrit | 163 / 163 / 163 | **193 / 163 / 163** |

Les bâtisseurs calculaient une position, puis l'oubliaient. La figure était juste
une fois — à l'instant du clic — et fausse au geste suivant, ce qui est
exactement le contraire de ce qu'un logiciel de géométrie doit apprendre.

Le point sait désormais dire d'où il vient. Trois relations de plus, et ce sont
les trois transformations du programme : **tourner** autour d'un centre,
**glisser** d'un vecteur, **agrandir** depuis un centre. C n'est plus « un point
à 240 px de A » mais *« B tourné de 60° autour de A »* ; le quatrième sommet du
carré est *« D glissé de A vers B »* ; le centre du cercle circonscrit est
*« le croisement des deux médiatrices »* — un vrai croisement, pas la formule du
circoncentre. Les arcs de construction suivent : leur écartement se lit sur un
point de la figure, leur visée sur le point qu'ils fabriquent.

`tests/probe-magiques-tiennent.js` vérifie la **propriété**, pas les longueurs :
la figure a le droit de changer de taille, pas de cesser d'être un carré. Treize
figures, treize propriétés qui résistent.

Au passage, deux choses qui disparaissaient en silence. Arrêter le rejeu d'une
figure magique **relit la feuille depuis l'historique** : tout ce qui n'était pas
enregistré s'évaporait alors sans que rien ne bouge à l'écran. Les marques « ceci
est un trait de construction » et le nom d'une droite voyagent maintenant avec la
figure.

### L'énoncé d'une figure magique

Une figure qui ne sait pas se raconter est une figure que le logiciel ne comprend
pas. Relues, la moitié des constructions de la grille ne donnaient rien :

| figure | avant | après |
|---|---|---|
| hexagone | *Place les points A et B. Trace le segment [AB].* | *…Trace un hexagone régulier BCDEFG de 4,8 cm de côté.* |
| pentagone | *…Place le milieu B de [BA]. Place le milieu E de [BM].* | *…Trace un pentagone régulier ABCDE de 5,6 cm de côté.* |
| rosace | *Place les points A et B.* | *…Trace une rosace à six pétales de 4,8 cm de rayon.* |
| escargot de Pythagore | *L'angle AB? est droit.* × 12 | *…Trace l'escargot de Pythagore de 4,8 cm de côté.* |
| cercle circonscrit | *…intersection de la droite précédente et de la droite précédente.* | *…intersection de la médiatrice de [AB] et de la médiatrice de [BC].* |
| carré | *…L'angle BAD est droit.* × 4 | *Trace un carré ABCD de 4,8 cm de côté.* |

Cinq causes, toutes de la même famille : **la figure ne disait pas ce qu'elle
était**. Les sommets d'un hexagone n'avaient pas de nom — sans nom, rien à lire.
La détection de polygone marquait comme « vus » les sommets d'un cycle qu'elle
n'avait pas réussi à fermer, et le repêchage par le contour ne les retrouvait
plus. Un angle marqué sur des points anonymes s'écrivait `AB?`. Le carré redisait
quatre fois ce que sa définition contient déjà. Et les motifs décoratifs — rosace,
graine de vie, yin-yang, octogramme, hexagramme, escargot — n'étaient qu'un tas
d'arcs ; le bâtisseur les signe maintenant, et l'énoncé les rend d'une phrase.

Le pentagone méritait un mot de plus : sa construction du nombre d'or piochait
les lettres B, M et E avant que les sommets n'aient les leurs, et le pentagone se
relisait « ACDFG ». Les noms des sommets sont donc **réservés d'abord** ; les
points d'appui prennent ce qui reste, et l'énoncé ne les décrit pas — ils
appartiennent à la construction, qui se voit à l'écran, pas à la figure.

### Une aide qui se montre au lieu de se lire

*« Dans l'aide on pourrait avoir un mode démo où ça balaye les fonctions avec
une démo. »* Puis la visite vue tourner, trois fois, et redressée trois fois :

> *« Il faut montrer où on appuie sur l'icône, ce qui apparaît […] il faut faire
> rêver. »*
> *« Quand tu dessines un segment, il faut que tu gardes le curseur virtuel
> enfoncé et que tu ailles un peu moins vite. »*
> *« Pour les instruments, il faut montrer leur manipulation un par un. Il faut
> qu'ils soient la star. L'idée est vraiment de montrer LES OUTILS de Géomaster,
> pas de réaliser des figures. »*

Cette dernière phrase a défait la moitié du programme. Cinq étapes montraient de
belles figures — l'hexagone au compas, l'étoile à cinq branches, la rosace, le
chat — et **aucune ne montrait un outil** : on regardait le logiciel faire, sans
jamais voir avec quoi. Elles sont parties. Les quatre onglets de l'aide
**décrivent** le logiciel ; le cinquième ne montre plus que des **outils**.

Douze étapes, un peu plus de trois minutes :

| | |
|---|---|
| **Les outils de tracé** | point, segment [AB] puis [BC], cercle, angle |
| **La palette de style** | on choisit la couleur, le trait, l'épaisseur — puis on trace |
| **Une phrase suffit** | la barre éclair, écrite lettre à lettre |
| **Et le geste, si on le demande** | la même phrase aux instruments |
| **La règle** | posée, déplacée, tournée, allongée |
| **L'équerre** | posée, déplacée, tournée |
| **Le rapporteur** | posé sur le sommet, tourné, **bloqué** |
| **Le compas** | déplacé, ouvert, et il **trace** |
| **Le crayon magique** | un carré tremblé devient un vrai carré |
| **Les constructions magiques** | le tiroir de la baguette, et la médiatrice |
| **Ouvrir, enregistrer, exporter** | le menu Fichier, et la vraie boîte d'exportation |
| **L'énoncé se rédige tout seul** | le panneau de droite |

Deux principes, et tout le reste en découle.

**Rien n'est simulé.** Aucune capture, aucun film, aucun faux bouton : une main —
le halo jaune des démonstrations enregistrées — va jusqu'à la vraie icône,
l'allume, appuie ; la phrase s'écrit dans la vraie barre ; le carré tremblé est
tracé point par point sur la vraie feuille, et c'est le vrai reconnaisseur qui le
redresse. Les instruments, eux, sont pris **par leurs vraies poignées** — et la
visite ne les recopie pas : elle demande au logiciel lui-même où elles sont
(`getHitZone`), de sorte qu'une poignée déplacée un jour ne rendra pas la visite
menteuse, elle la suivra. La boîte d'exportation est ouverte par le vrai
`requestExport`, avec la règle sortie exprès pour que sa question — « des
instruments sont présents, on les emporte ? » — soit vraie.

**On voit où on appuie.** Dire « on prend le compas » ne montre rien. La main va
jusqu'à l'icône du compas, cette icône s'allume, la main appuie — et le compas
paraît. Un geste, un endroit, un résultat. Et un segment se **tire** : la main
reste enfoncée d'une extrémité à l'autre (mesuré : 1710 ms sur 381 px), là où
elle faisait deux appuis séparés en traversant la feuille au repos, ce qui n'est
le geste de personne.

Et parce qu'une visite guidée n'est pas un bac à sable, **la souris ne touche
plus rien pendant qu'elle se déroule** : un simple survol suffisait à faire
glisser un instrument sous la main de la visite, ou à changer l'outil qu'elle
était en train de montrer. Un voile transparent avale les gestes, le clavier ne
garde que les commandes du lecteur (← → espace échap), et seuls la barre et son
curseur répondent. Les gestes de la visite, eux, naissent derrière le voile : ils
ne le traversent pas.

Le **curseur** de la barre compte en centièmes d'étape et porte un petit trait à
chaque frontière : on glisse sans à-coups, on voit où l'on va, et la pastille
avance dans la largeur de son étape pendant qu'elle se joue. Les durées qui la
font avancer sont **mesurées**, étape par étape — un relevé, pas une promesse :
la pastille n'atteint jamais la fin de son étape toute seule, c'est l'étape qui
l'y pousse.

Ce que la mesure a corrigé, à chaque tour :

- **la médiatrice sortait du cadre** — 1298 px de large pour 1292 px visibles.
  Chaque étape cadre maintenant sur sa figure ;
- **une construction magique laisse le rejeu en boucle**, et c'est voulu ; mais la
  boucle débordait sur l'étape suivante, et la visite passait de trois minutes à
  treize ;
- **le trait à main levée n'est pas un objet, c'est de l'encre** : quitter l'étape
  du crayon magique en plein tracé le laissait en travers de la figure suivante ;
- **la palette de style ne changeait rien de visible.** L'étape tapait sur les
  pastilles au-dessus d'un triangle déjà tracé : les pastilles changeaient, le
  triangle non. Elles règlent le style de *ce qu'on va tracer* — l'étape choisit
  donc d'abord, et trace ensuite ; le second trait sort bleu, en pointillés et
  deux fois plus épais que le premier ;
- **la pause faisait tout démarrer.** Elle coupait les minuteurs de l'étape, et
  reprendre la rejouait depuis le début. Chaque attente décompte maintenant le
  temps *réel* et ne décompte rien en pause : on repart au milieu du geste. Au
  passage, reprendre appelait `resumeAnimation()` dans tous les cas — sur une
  étape sans rejeu, cela en démarrait un, qui remontait la figure au début : deux
  points posés, pause, reprise, et il n'en restait qu'un ;
- **douze étapes, c'est trop pour avancer une par une** quand on cherche celle du
  compas : la barre a un curseur ;
- **la barre changeait de taille sans arrêt.** Une étape qui montre quatre gestes
  a quatre choses à dire : la barre montait et descendait sous le texte, et l'œil
  suivait la barre au lieu de la figure. Deux lignes, toujours — 95 px, mesuré
  d'un bout à l'autre de la visite ;
- **la vue sautait au milieu des étapes.** Chacune recadrait à la fin, juste
  après qu'on avait regardé la figure se faire. Les figures sont maintenant
  posées d'emblée au milieu de ce qu'on voit, et il reste au plus **un** cadrage
  par étape — celui qui accompagne l'apparition de la figure ;
- **on ne visait pas tout à fait la pastille.** Le point d'une zone le plus proche
  du curseur est par construction sur sa lisière : on prend maintenant le
  barycentre, et l'on écarte les bords en sondant autour — le barycentre de la
  zone « déplacer » du rapporteur tombait pile dans la colonne de ses trois
  verrous, et le tirer ne le déplaçait pas ;
- **la règle ne s'allongeait pas** : mesuré, elle passe de 400 à 506 px, et les
  graduations suivent ;
- **le disque de la main sautait à l'appui.** Il était centré par des marges
  négatives valant la moitié de sa taille — mais la marge ne s'anime pas : à
  l'instant de l'appui elle basculait d'un coup pendant que la taille se
  réduisait doucement. Mesuré image par image : **11,3 px** d'écart. Centré par
  `transform`, il ne bouge plus d'un pixel, quelle que soit sa taille ;
- **on ne voyait pas l'énoncé relu à la fin.** Le panneau ne s'ouvrait qu'une
  fois la figure finie, et la visite se terminait deux secondes plus tard en
  rendant la feuille. Il s'ouvre maintenant **avant** : on le regarde se remplir
  pendant que le carré se construit, puis la visite montre le même énoncé « aux
  instruments » — cinq lignes, la marche à suivre geste par geste.

Et un défaut trouvé au passage, qui ne concerne pas que la visite : un arc de
compas dont le centre avait disparu — ce que laisse un rejeu arrêté en pleine
construction — **cassait `serialize()`**, donc `saveState()`, donc la sauvegarde
automatique, silencieusement, au moment précis où l'on en aurait eu besoin.

### Les usages, comptés sur place

*« Le site est sur GitHub, puis-je faire des stats de l'utilisation, de qui se
sert de quoi ? — Clairement GéoMaster est un outil de prof, c'est pour moi, pour
voir les usages. »*

GitHub Pages n'en donne aucune : c'est de l'hébergement statique, sans journal
d'accès. Et le logiciel promet quelque chose de plus fort qu'une statistique —
une sonde coupe **toute** requête réseau et vérifie que la chaîne entière marche
quand même, parce que le vrai cas d'usage est un fichier ouvert d'un double-clic
depuis une clé USB, dans une salle sans internet.

On compte donc **sur place**, dans le navigateur, et rien ne part. Ce qui est
compté répond à une seule question — qu'est-ce qui sert ?

| | |
|---|---|
| **Outils** | chaque outil pris, une fois par prise |
| **Constructions magiques** | comptées à part des outils de tracé |
| **Instruments** | les **sorties** de règle, équerre, rapporteur, compas — pas les rangements |
| **Consignes** | faites / refusées |
| **Phrases non comprises** | **avec leur texte** — la liste de ce qu'il reste à apprendre, écrite par ceux qui s'en servent |
| **Exports** | par format |
| **Visite guidée** | combien de fois lancée |
| **Écrans** | téléphone / tablette / ordinateur, par ouverture |

Le relevé se lit derrière la porte dérobée qui existait déjà — le code Konami, ou
sept clics sur le numéro de version : **rien de plus dans l'interface**, et
personne ne tombe dessus par hasard. Un lien le copie, un autre remet tout à zéro.

Deux garde-fous. La liste des phrases refusées est **bornée à cent** : un compteur
qui garde tout n'est plus un compteur, c'est une archive. Et l'**interface élève
ne compte rien** — ce n'est pas d'elle qu'on parle, et l'élève n'a rien demandé.

Aucune figure, aucune date plus fine que le jour. Mesuré : une séance complète —
outils, instruments, consignes, constructions magiques — sans qu'une seule
requête quitte la machine.

### Et comment on récupère l'information

*« Comment je récupère l'info ? Pour savoir le nombre d'utilisateurs, j'aimerais
avoir des stats, les outils, tout tout tout. »*

Les compteurs locaux ne disent rien tant que rien ne remonte, et GitHub Pages ne
remontera jamais rien. Il faut donc **un point de chute à soi** — un serveur qui
tient en une page, se déploie gratuitement, et dont le code est dans le dépôt :
[`serveur/`](serveur/). Il est posé depuis le 9 septembre 2026, et son adresse
tient sur une ligne d'`index.html` :

```js
window.GM_USAGES_URL = 'https://withered-waterfall-04f1.devoddere-remy.workers.dev';
```

Videz cette chaîne et **il ne se passe plus rien du tout** : les compteurs
continuent de vivre sur place, et rien ne sort. C'est l'interrupteur, et il n'y
en a qu'un.

**Cette adresse est publique, et ce n'est pas un défaut** : le logiciel doit
l'appeler depuis le navigateur de chacun, donc elle est lisible par tous — et
elle ne sait qu'**écrire**. La **clé de lecture**, elle, ne se trouve nulle part
dans le dépôt : elle vit dans les secrets du serveur, parce qu'un fichier publié
n'est pas un coffre. C'est la seule fuite qu'aurait ce montage, et elle tiendrait
à une étourderie de copier-coller ; la sonde relit donc la ligne livrée et refuse
qu'elle porte le moindre `?k=`.

Le relevé part alors une fois par jour au plus, avec un **identifiant
d'installation tiré au hasard** : c'est lui, et lui seul, qui permet de compter
des *utilisateurs* et pas seulement des visites. Et la lecture donne, en clair :

```
37 utilisateur(s), dont 21 actif(s) ces 30 derniers jours
1 284 ouverture(s)
consignes : 903 faites, 217 refusées
…
PHRASES NON COMPRISES
  14× Trace la bissectrice extérieure
  9× Trace un patron de tronc de cône
```

Trois règles ne se négocient pas, et la sonde les tient toutes les trois :

1. **Rien ne part depuis un fichier local.** C'est le cas d'usage qui a fait ce
   logiciel, et la sonde hors-connexion continue de tout couper.
2. **Rien ne part de l'interface élève**, ni d'un aperçu dans un cadre.
3. **Rien de la figure ni du document** — jamais.

Le serveur, lui, n'accumule pas : les compteurs étant cumulatifs, le dernier
relevé d'une installation *est* toute son histoire. Une clé par installation,
écrasée à chaque envoi — la base grossit avec le nombre d'utilisateurs, jamais
avec le temps, et **le nombre de clés est le nombre d'utilisateurs**.

### Une statistique qui n'arrive pas ressemble à une absence d'utilisateurs

Le point de chute posé, le relevé est resté **à zéro** — et le logiciel
répondait pourtant `déjà`, c'est-à-dire *« j'ai envoyé aujourd'hui »*. Deux
défauts se cachaient derrière ce désaccord, et le second rendait le premier
définitif.

**Le jour se marquait avant l'arrivée.** `sendBeacon` rend *vrai* dès que la
requête est **mise en file**, pas quand elle arrive. Le verrou « une fois par
jour » se posait donc sur un envoi non confirmé : perdu en route, il n'était
retenté que le lendemain — et indéfiniment jamais, si la cause durait. Le jour
ne se marque désormais que sur **accusé de réception** ; un refus ou un silence
laisse la journée intacte, et la prochaine ouverture réessaie.

**Et l'envoi partait en `application/json`.** Une requête inter-origines qui
annonce ce type n'est pas « simple » : le navigateur exige d'abord un **vol de
reconnaissance** (`OPTIONS`), et s'il échoue — extension, pare-feu
d'établissement, proxy scolaire, tous fréquents là où ce logiciel sert — la
requête est abandonnée **sans un mot**. En `text/plain`, il n'y a plus de vol du
tout : le paquet part droit. Le serveur lit le corps en JSON quoi qu'annonce
l'en-tête.

La sonde ne voyait rien de tout cela, car elle montait **un seul** serveur et
postait sur lui-même : même origine, aucune règle inter-origines exercée. Or le
vrai montage l'est par nature — la page vient de `github.io`, le point de chute
est un `workers.dev`. Elle monte maintenant **deux** serveurs sur deux origines,
vérifie qu'**aucun** `OPTIONS` n'est reçu, et joue la panne du point de chute
pour tenir que la journée n'est pas brûlée.

Enfin le relevé porte une ligne `remontée :` qui dit l'état du dernier envoi —
`envoyé`, `refusé 503`, `injoignable`, `pas encore tentée`. Sans elle, un tuyau
bouché est indiscernable d'un logiciel que personne n'utilise, et l'on tire la
mauvaise conclusion en toute confiance.

### Le crayon ne quitte jamais la règle

*« Parfois quand tu traces une droite, la règle est trop courte, le crayon est
dans le vide. »*

Mesuré : la règle fait 400 px, soit **8 cm**. Un côté de carré de 12 cm en fait
600 — le crayon sortait de 200 px. Et la parallèle courait sur **1 400 px** le
long d'une équerre de 400, trois fois et demie trop loin. Celle-là, c'est la
correction précédente qui l'avait introduite : en faisant enfin *tracer* la
parallèle, on avait étendu le trait de ±700 px pour qu'il naisse d'un bout et
coure jusqu'à l'autre. Un geste absent réparé par un geste impossible.

Deux règles, tirées de ce qu'on fait vraiment sur une feuille.

**Une droite ne se trace jamais en entier.** On fait un trait de la longueur de
la règle, on la lève, et la convention fait le reste. Le crayon parcourt donc la
portée de l'instrument, pas plus — et la droite paraît entière ensuite. C'est le
cas où l'on ne glisse pas, et c'est ce qui évite que l'animation s'éternise.

**Un segment trop long se trace en plusieurs fois.** On trace ce que la règle
couvre, on la fait glisser, on continue. Et **pas à fleur** : elle se repose en
chevauchant ce qu'on vient de tracer — trois centimètres, un quart de sa
longueur. La raison est géométrique avant d'être esthétique : à fleur, rien ne
garantit que la suite du trait soit dans le prolongement.

Combien de fois ? Avec 8 cm de règle et 3 cm de chevauchement, chaque nouvelle
pose avance de 5 cm :

| Longueur du trait | Glissements |
|---|---|
| jusqu'à 8 cm | aucun |
| 12 cm | un |
| 18 cm | deux |

Une feuille A4 fait 21 cm de large : l'immense majorité des traits n'en demande
aucun. Et la dernière pose se **cale sur la fin du trait**, pour que la règle ne
dépasse pas dans le vide au dernier coup — ce qui, au passage, ne peut
qu'augmenter le chevauchement.

**Ce qu'il fallait mesurer n'est pas le nombre de glissements.** C'est que le
crayon reste sur l'instrument. La sonde parcourt donc l'animation image par
image et calcule, à chacune, l'abscisse du crayon *depuis l'origine de la règle
telle qu'elle est posée à cet instant*. C'est ce relevé — et lui seul — qui a
démasqué le défaut suivant : la perpendiculaire pose sa règle en C **tournée de
180°**, et le plan, qui prenait l'axe de l'objet et non celui de l'instrument,
envoyait le crayon à −400 px de l'origine. Derrière la règle, donc dans le vide
de l'autre côté. Le compte des passes était juste, la pose était fausse.

### Un carré qui n'en est pas un, annoncé « ✓ Carré »

*« Regarde ce qu'il a fait. D'ailleurs si ce n'est pas possible, il faut
expliquer pourquoi (avec une modale). »*

Sur une feuille portant déjà un carré ABCD et un cercle de centre E,
`trace un carré BCDE` répondait **✓ Carré BCDE** et reliait les quatre points
tels qu'ils étaient :

| | côtés | angles |
| --- | --- | --- |
| ce qui était tracé | 8 · 8 · 12,6 · 20,4 cm | 11° · 90° · 72° · 30° |
| ce qu'un carré exige | quatre fois la même | quatre fois 90° |

C'est la faute la plus grave que ce logiciel puisse commettre — dire qu'il a
fait ce qu'il n'a pas fait —, et elle avait ici sa propre porte d'entrée, que
`probe-dit-vrai` ne pouvait pas voir : cette sonde-là vérifie qu'un carré
**existe**, pas qu'il est carré.

La cause tenait en deux lignes. La forme idéale était calculée, puis **jetée
pour tout sommet déjà nommé** :

```js
const deja = this.cslPointNomme(noms[i]);
if (deja) return deja;              // le nom, et rien de la forme
```

Ce n'était donc pas l'affaire d'une phrase bizarre : **toute** figure nommant un
point déjà posé sortait fausse. « Trace un carré ABCD » avec A et B sur la
feuille rendait 8, 6,9, 3 et 6,5 cm ; le pentagone ABCDE, 8, 7,2, 3, 3 et 8 cm.
Le seul cas juste était le cas sans aucun point.

**Deux points ne contredisent jamais un carré** : ils en fixent le côté, et la
figure se construit dessus — c'est le cas courant, « je pose A et B, trace le
carré ABCD », qui rendait lui aussi n'importe quoi. À partir du troisième la
figure est surdéterminée : ou bien les points s'y prêtent, ou bien aucun carré
n'a ces sommets-là. La forme idéale est donc posée sur les sommets déjà là **par
similitude** — translation, rotation, et l'échelle que donne leur écart —, dans
les deux retournements ; on garde le meilleur et l'on compare ce qui reste. À un
pixel près : accepter « presque un carré » serait recommencer la même faute en
plus discret.

### Alors on refuse, et l'on dit pourquoi

Une version intermédiaire traçait la figure à côté, sous des lettres libres,
plutôt que de refuser. Elle ne bloquait jamais rien — et répondait à une question
que personne n'avait posée : on demande « un carré BCDE », on reçoit un carré
GHIJ. Entre une figure juste qui répond à côté et un refus qui explique, c'est le
refus qui apprend quelque chose. **Rien n'est tracé, rien n'est effacé, rien
n'est déplacé.**

Le bandeau de la consigne tient une ligne — assez pour « Quels sommets ? », pas
pour dire qu'un carré est géométriquement impossible sur *cette* feuille. Un
refus qui n'enseigne rien ne vaut guère mieux qu'un mensonge, alors la modale
nomme le sommet en cause, donne les deux distances — celle qu'il a, celle qu'il
devrait avoir — et dit trois façons d'avancer :

> **Carré BCDE : impossible sur cette feuille.**
>
> B et C sont déjà posés, à 8 cm l'un de l'autre. Un carré BCDE est entièrement
> déterminé par ces deux sommets-là : il exige tous les autres à des endroits
> précis.
>
> - **E** est à 20,4 cm de B ; le carré le demande à 8 cm — il est à 20,4 cm de
>   la place qui lui revient.
>
> **Rien n'a été tracé**, et aucun de vos points n'a bougé.
>
> Trois façons d'avancer : effacer ou déplacer E, puis relancer la consigne ;
> écrire « Trace un carré » sans nommer les sommets ; ou relier vos points tels
> qu'ils sont avec « Trace le polygone BCDE », qui ne promet rien sur leur forme.

C'est la réponse qui transporte l'explication et l'interface qui l'affiche : le
catalogue rejoue ses 218 phrases sans qu'une seule fenêtre s'ouvre.

**Le prix est réel**, et il est payé plutôt que caché : « Trace un carré ABCD de
3 cm de côté » ne marche plus sur une feuille où A, B et C sont déjà pris par
autre chose. Six entrées du catalogue ont reçu la feuille vide qu'elles
supposaient — elles ne demandaient aucun point préalable —, et `probe-patrons`
vérifie maintenant les deux faces : la phrase sur feuille libre, le refus sur la
feuille encombrée.

### Deux autres mensonges, trouvés en mesurant

Sur feuille vide, aux instruments — donc sans rapport avec le signalement, et
invisibles jusque-là :

| aux instruments | côtés | angles |
| --- | --- | --- |
| losange ABCD | 3 · 3 · 3 · **5,2** | 30 · 60 · 60 · 30 |
| pentagone ABCDE | 3 · **3,5 · 3,5 · 3,5** · 3 | 144 · 54 · 108 · 108 · 54 |
| hexagone ABCDEF | 3 · 3 · 3 · 3 · 3 · 3 | 120 · **60** · 120 · 120 · 120 · **60** |

Le losange : `cslBatir` distribue les lettres dans l'ordre où les points
naissent, et la construction au compas fabrique D avant C — le contour lu
A-B-C-D se croisait. Les lettres se donnent maintenant **par la place occupée**,
non par l'ordre de fabrication.

Le pentagone et l'hexagone : leurs bâtisseurs partent du **cercle circonscrit**,
le segment qu'on leur donne va du centre à un sommet, et on leur donnait [AB],
deux sommets voisins — **A devenait le centre**. L'hexagone cachait la faute
mieux que tous, son côté valant son rayon : six longueurs égales, et seuls les
angles disaient que le contour se croisait.

### Le stylo magique n'écrivait rien — sur une feuille blanche

*« Le stylo magique n'écrit rien mais donne la figure finale. »*

Et ce n'était pas le stylo magique. L'aperçu du geste — le trait bleu qui se
forme sous le doigt pendant qu'on dessine — était tracé tout en haut du rendu,
**avant `drawGrid()`**. Sur un quadrillage, la grille ne fait que poser des
lignes, et le trait survivait entre elles. Sur fond blanc, `drawGrid()` ne pose
rien : il **repeint la feuille entière**. L'aperçu passait dessous.

Mesuré pendant le geste, pixels d'encre sur une bande de 360 × 40 que le trait
traverse :

| outil | quadrillage | points | isométrique | blanc |
| --- | --- | --- | --- | --- |
| stylo magique | 1903 | 1296 | 2813 | **0** |
| croquis | 1903 | 1296 | 2813 | **0** |
| stylo | 1341 | 722 | 2212 | **0** |

Trois outils, un seul fond. Ce n'était donc pas une panne du stylo magique,
c'était une panne de la feuille blanche — et c'est aussi, dix jours plus tard,
la réponse à *« le tracé libre ne s'affiche pas en temps réel »*, signalé
alors et jamais reproduit faute d'avoir essayé sur la bonne feuille.

Le bloc est passé en dernier, juste avant la sélection : un geste en cours
passe au-dessus de tout, comme la main au-dessus de la feuille.

### Les lettres d'un croquis se rangent dehors

*« Quand tu places les lettres (sur un rectangle par exemple), utilise le
placement magique qui fait que la lettre est bien placée. »*

Tous les chemins de création rangent leurs lettres — le segment tracé à la
main, le polygone, l'angle, la parallèle. `finirCroquis` était le seul à ne
pas le faire : les quatre sommets d'un rectangle esquissé gardaient l'angle par
défaut, **droit au-dessus du point**. A et B tombaient juste par accident,
étant en haut ; C et D se posaient **dans** la figure, sur leurs propres
marques d'angle droit.

Le rangement branché, la moitié du défaut restait — parce que le rangement
lui-même ne savait pas répondre. `computeBestLabelAngle` ne connaissait que
deux cas : le sommet d'un `Polygon`, où il suit la bissectrice vers le dehors
(la bonne réponse), et **tout le reste**, où il ne regardait qu'**un seul
trait** et posait la lettre perpendiculairement, sans rien savoir du côté où
est le dedans.

Or un croquis ne fabrique pas de `Polygon` : il pose quatre points, quatre
segments et quatre angles droits. Le trou valait donc pour toute figure faite
trait par trait — au stylo magique comme à la règle. Deux traits qui se
rejoignent suffisent pourtant à désigner le dehors : c'est ce que fait
maintenant la règle générale, et les quatre lettres sortent chacune par son
coin — −135, −45, 45, 135.

**On ne range que ce qu'on vient de poser.** Ranger toute la feuille
déplacerait les lettres qu'on a écartées à la main sur une figure d'à côté, et
celles-là, personne ne les a mises là par hasard. Le rangement se fait avant
l'enregistrement de l'état, pour que l'annulation les retrouve à leur place.

### Le logiciel dit lui-même ce qu'il sait faire

*« J'ai toujours besoin du fichier en md, rien n'est totalement dit dans
GéoMaster ou si ? »*

Non — et c'était pire qu'incomplet. Mesuré : l'application montrait **89 phrases
d'exemple sur les 218** qu'elle comprend, soit 40 %. Et ces 89 étaient **écrites
à la main** dans le HTML. Elles pouvaient donc dériver exactement comme
`IDEES.md`, qui annonçait « à faire » une fonctionnalité déjà faite, et comme
`tests/README.md`, à qui il manquait 46 sondes sur 122. Trois listes tenues à la
main, trois qui périment : la même faute, la troisième fois.

`tests/catalogue.js` écrit désormais **du même passage** `CONSIGNES.md` — pour
qui lit le dépôt — et `window.GM_CATALOGUE` **dans `index.html`** — pour le
logiciel. Une mesure, deux copies, aucune liste à tenir d'accord.

Le coût, puisque c'est la question qu'on pose toujours d'un fichier unique :
**24,3 ko dans un fichier de 4,6 Mo, soit 0,51 %** — et 4,5 ko une fois gzippé.
Le fichier embarque déjà pdf.js et une police, qui pèsent chacun cinquante fois
plus.

**Mais un tableau engendré n'est honnête que s'il est réengendré.** Écrit une
fois et oublié, il devient exactement ce qu'on voulait fuir : une quatrième liste
à la main, et la pire, puisqu'elle a l'air d'être vraie. `probe-catalogue.js` ne
compare donc pas deux fichiers — elle **rejoue les 218 phrases** dans un
navigateur et confronte chaque réponse à ce que le tableau annonce. Vérifié en
falsifiant une ligne : elle nomme la phrase fautive et renvoie à
`node tests/catalogue.js`. Deux secondes et demie pour les 218.

Le tableau n'est encore lu par personne dans l'interface : l'aide et la recherche
viendront s'y brancher quand les tests et les retours seront réglés. Il est tenu
à jour dès maintenant — une vérité qu'on laisse pourrir en attendant de s'en
servir n'est plus une vérité le jour où l'on s'en sert.

### Le repère — et où l'on met une fonctionnalité sans alourdir

C'est la figure de la 5e, et celle de tous les chapitres de fonctions ensuite.
Elle n'existait pas : `Trace un repère` répondait « Je n'ai pas compris », et
`Place le point A(3;2)` posait un point **au hasard** — les coordonnées étaient
lues, puis jetées, et la réponse ne disait rien.

**Il n'a pas de bouton, et c'est la moitié de la décision.** Mesuré : la barre
d'outils compte 23 icônes, dont **15 hors écran sur un téléphone** ; l'en-tête en
ajoute 21. Un repère se pose une fois par exercice — c'est une phrase, pas un
geste. Le flocon de Koch, la spirale de Théodore, le patron du cube et la droite
d'Euler vivent déjà ainsi, sans une icône. La phrase est la seule surface qui ne
coûte aucun pixel, et la sonde vérifie qu'aucun bouton n'a été ajouté.

**Son origine est un vrai point de la figure**, nommé O. Ce n'est pas un détail
d'enregistrement : c'est ce qui permet de *tirer* le repère pour le déplacer,
comme n'importe quoi d'autre, et de l'enregistrer sans inventer un second
mécanisme. Tout le reste — axes, graduations, nombres — se déduit de lui et de
l'unité.

**Et l'axe des ordonnées monte.** Le canevas compte ses y vers le bas ; un repère
les compte vers le haut. Les deux conversions vivent au même endroit, parce que
c'est le genre de signe qu'on inverse une fois sur deux quand il traîne dans
quatre fonctions. La sonde ne se contente donc pas de relire (3;2) — elle
vérifierait juste avec le signe faux, puisque le calcul et le dessin partagent
l'erreur — : elle demande qu'une ordonnée positive soit **plus haut à l'écran**,
en pixels.

La phrase règle ce qui doit l'être : `Trace un repère d'unité 2 cm`,
`Trace un repère de -10 à 10`. Un second repère est refusé. Sans repère, les
coordonnées se refusent aussi — pas d'origine, pas d'unité, la phrase ne veut
rien dire — et un point qui existe déjà n'est **pas déplacé en silence** : il est
peut-être le sommet d'une figure entière.

Trois allers-retours vérifiés : fichier JSON, lien compact (373 caractères pour
un repère et un triangle), et **export SVG**. Le dernier est le plus sournois :
la chaîne d'export est une suite de « sinon si » par classe, et une classe
qu'elle ne connaît pas y tombe sans rien dire. La figure serait sortie sans ses
axes, et rien ne l'aurait signalé — exactement la faute que la section précédente
vient d'outiller.

### Aligné sur le quadrillage, et réglable à la phrase

*« On pourrait rajouter des options dans le texte pour les repères et droites
(genre de quelle à quelle graduation, le pas, etc.) et même mettre des couleurs
différentes. Par contre essaye de bien aligner le repère avec les graduations
existantes. »*

**L'alignement d'abord, parce qu'il était faux.** Le quadrillage du fond est tracé
aux multiples de `UNIT`, en coordonnées de feuille ; la place libre, elle, ne
connaît que le vide. Mesuré : l'origine tombait à **46 px et 49,5 px** des nœuds,
et les graduations passaient *entre* les carreaux. Sur une feuille quadrillée,
c'est tout ce qu'on voit. L'origine s'arrondit donc au nœud le plus proche —
vingt-cinq pixels de déplacement au pire — et la sonde exige zéro écart, sur les
quatre variantes.

**Ce que la phrase règle**, et tout est facultatif :

| Ce qu'on écrit | Ce qu'on obtient |
|---|---|
| `Trace un repère de -10 à 10` | les mêmes bornes sur les deux axes |
| `Trace un repère avec x de -3 à 8 et y de 0 à 5` | une étendue par axe |
| `… de 2 en 2`, `… tous les 5`, `… avec un pas de 0,5` | le pas des nombres |
| `Trace un repère d'unité 2 cm` | l'unité, en centimètres |
| `… en bleu`, `… en rouge` | la couleur |

Trois façons de dire le pas, parce qu'un professeur emploie les trois.

**Et la droite graduée est le même objet sans son axe vertical.** Une seule
classe, deux figures : l'enregistrement, le lien et l'export marchent pour les
deux sans une ligne de plus. `Trace une droite graduée de 0 à 20 de 2 en 2` donne
la droite de 6e — une flèche au lieu de deux, pas de nom d'axe à citer, et le
**zéro écrit** : dans le plan, le point O le dit déjà et l'écrire une seconde fois
ferait doublon ; sur une droite, l'origine n'a pas de nom et une graduation muette
à 0 rend la droite illisible.

Cette dernière phrase était l'une des six qui mentaient. Elle a **changé de camp
toute seule** : `probe-dit-vrai.js` ne vérifie plus son refus mais sa figure,
comme annoncé — il a seulement fallu lui apprendre qu'un repère porte des
graduations sans avoir de propriété qui le dise.

### Ne pas dire qu'on a fait ce qu'on n'a pas fait

C'est la faute la plus grave que ce logiciel puisse commettre, et la seule que
l'élève ne voit pas : répondre « oui » et dessiner autre chose. `IDEES.md` la
mettait en tête de liste depuis le début — et elle y est restée, parce
qu'**aucune sonde ne la tenait**. Tout ce qui a été corrigé ces jours-ci l'a été
parce qu'une sonde le mesurait ; cette classe-là n'avait pas de garde-fou, et
c'est exactement pour cela qu'elle a survécu.

Mesuré, sur un triangle ABC déjà tracé :

| Ce qu'on écrit | Ce qui se passait |
|---|---|
| `Trace deux triangles semblables` | « Triangle DEF » — **un seul** |
| `Trace un angle égal à l'angle ABC` | « Angle ABC marqué » — rien de neuf |
| `Trace les carrés de Pythagore…` | « Carré ABCD » — **un** carré, au hasard |
| `Trace un losange à partir de deux cercles` | « Losange DEFG » — **zéro cercle** |
| `Trace la symétrie axiale d'un carré` | « Carré DEFG » — ni axe ni image |
| `Trace une droite graduée` | « Droite (d) » — sans une graduation |

La règle que tient désormais `probe-dit-vrai.js` : **quand le logiciel répond
oui, ce que la consigne promet littéralement doit être sur la feuille.** Un
nombre écrit — « deux cercles » — se compte ; un genre nommé se cherche ; on ne
juge rien d'autre, ni le beau ni le juste, seulement le promis.

Et **le refus est une réponse acceptable** : une phrase refusée ne ment pas, à
condition de dire ce qu'on peut écrire à la place. Les six refusent maintenant,
et chacune propose la tournure qui marche. Le jour où l'une de ces constructions
existe, la ligne change de camp toute seule — la sonde vérifie alors la figure au
lieu du refus. La liste ne peut plus vieillir en silence.

La même règle passe sur les **205 phrases du catalogue**. C'est ce balayage qui a
trouvé, sur feuille vide, `Place le centre du cercle circonscrit O au triangle
ABC` répondre « C — centre du cercle circonscrit de **OAB** » : les noms sont
relevés dans l'ordre d'apparition, O venait en tête, le triangle inventé devenait
OAB et la lettre qui restait allait au centre. La figure était juste, les noms
tous faux, et la réponse l'affirmait tranquillement.

### Le nom du logiciel, et la porte qu'il y a derrière

*« J'aimerais entre le Géomaster en haut à gauche et l'input du fichier un écart
un peu plus grand, et quand on passe la souris sur Géomaster, un dégradé animé du
nom ; et 7 clics dessus met en mode développeur. »*

L'écart passe de **4 à 18 px** — la largeur d'une lettre. De loin, « GÉOMASTER »
et « Sans titre » se lisaient comme une seule ligne, et l'on ne voyait pas où
finissait la marque et où commençait le nom du document.

Le dégradé du nom existait, mais fixe. Au survol il devient un ruban de trois
longueurs qui défile derrière les lettres — la première et la dernière couleur
sont la même, sans quoi la boucle sauterait à chaque tour. Une animation sans fin
n'est pas pour tout le monde : sous `prefers-reduced-motion`, le dégradé reste et
cesse seulement de défiler.

**La porte existait déjà** : sept clics sur la date de version, en petit dans
l'aide, ouvrent le cabinet de curiosités — d'où l'on atteint le relevé des usages
et le banc d'essai des phrases. Ce qui est nouveau, c'est une **seconde serrure
sur la même pièce**, et là où l'on peut l'atteindre : le nom est en haut à gauche
de la première seconde à la dernière, la date n'existe que si l'on a pensé à
ouvrir l'aide. La mécanique est commune — deux implémentations auraient divergé
au premier réglage.

Les règles de la maison tiennent toujours, et c'est ce que la sonde mesure plutôt
que le compte de sept : **un secret ne touche pas à la figure** (on dessine, on
ouvre, on referme, la figure est au même objet près) ; **une série lente n'ouvre
rien**, car sans la fenêtre de 2,5 s sept clics étalés sur une minute finiraient
par ouvrir la porte et l'on n'y comprendrait rien ; et le curseur **ne promet pas
de lien** — c'est le dégradé qui invite, et lui seul.

### Le relevé technique

*« Dans la backdoor, donne aussi le numéro de version et des infos de debug au
besoin. »*

« Ça ne marche pas chez moi » ne dit ni la version, ni le navigateur, ni ce qu'il
y avait à l'écran. Le cabinet annonce donc la version dès l'entrée, et mène à un
relevé : adresse, navigateur, langue, écran et densité, tactile ou non, nombre
d'objets, outil courant, zoom, taille du canevas, contenu de la mémoire locale,
ouvertures, consignes comprises ou refusées — et **les erreurs JavaScript
attrapées depuis l'ouverture**. Sans ces dernières, le relevé dirait que tout va
bien sur une page à moitié morte, et la console d'un navigateur ne s'ouvre pas
sur un ordinateur de salle de classe.

Un bouton le copie ; rien n'en part tout seul. Et il ne contient **ni le titre du
projet, ni le nom des points** : ce sont les seules choses qui pourraient
identifier une classe, et elles n'aident à rien pour déboguer. On compte les
objets, on ne les nomme pas.

### Le texte tombe sur le curseur, pas en dessous

*« L'endroit où on écrit le texte est décalé par rapport au curseur. Il faut que
cela tombe précisément. »*

La correction précédente avait aligné la saisie et le texte validé **l'un sur
l'autre**, au pixel, sans se demander si les deux tombaient au bon endroit. Ils
n'y tombaient pas. Mesuré, l'encre par rapport au point cliqué :

| taille | haut | bas | centre |
|---|---|---|---|
| 16 px | +4 | +17 | +10,5 |
| 64 px | +15 | +59 | +37 |

Entièrement **sous** le clic, et d'autant plus bas que la police est grosse. On
posait le coin haut-gauche de la ligne sur le point cliqué ; or le I du curseur
de frappe a son point chaud **en son milieu**, comme tout curseur de saisie.
C'est la ligne d'écriture qui doit l'enjamber, exactement comme le trait
clignotant d'un champ de texte.

Le champ remonte donc d'une **demi-ligne**, mesurée sur lui-même une fois la
police appliquée plutôt que calculée : une police au dessin différent donnerait
une autre hauteur de ligne pour la même taille.

**Ce qu'on mesure ensuite n'est pas « le centre de l'encre vaut zéro ».** Ce
serait faux, et pour une bonne raison : « ppp » n'a que des jambages et pèse vers
le bas, « ABC » n'a que des capitales et pèse vers le haut — +3,5 et −1,5 à la
même taille. Ce qui doit être vrai de toute chaîne, c'est que l'encre **enjambe**
le clic et que son centre n'en soit jamais loin.

### Un curseur qui survit au premier mouvement de souris

*« Pour le texte, quand on va sur le canvas, on a toujours le pointeur de la
souris. »*

Le I avait bien été posé — mais au mauvais endroit. Le curseur se **recalcule à
chaque mouvement** de souris, dans le gestionnaire de survol, et celui-ci
repartait d'un `default` écrit en dur. Tout ce qui ne figurait pas dans sa courte
liste d'outils de tracé perdait le sien dès le premier pixel parcouru.

Ils étaient **onze** dans ce cas, mesuré après un déplacement réel : le texte, le
stylo, le croquis, la gomme et tous les outils magiques. La croix annoncée au
clic sur le bouton s'effaçait avant qu'on ait le temps de la voir.

**Et la sonde disait vert.** Elle lisait le curseur juste après le choix de
l'outil, où il est toujours juste. Mesurer le bon fait au mauvais instant est la
façon la plus sûre de passer à côté ; elle mesure maintenant après un vrai
déplacement, pour les quatorze outils, et refuse qu'aucun retombe sur la flèche
par oubli.

Plutôt qu'allonger la liste — et en oublier un le mois prochain —, le survol
**repart du curseur que l'outil a demandé**. Un outil ajouté demain gardera le
sien sans qu'on ait à l'inscrire nulle part. Les priorités connues sont intactes :
le corps d'un instrument l'emporte toujours, et sur un texte déjà posé c'est la
main qui s'affiche — car le clic ne l'écrit pas, il le prend pour le déplacer.

### L'icône du texte appartient enfin à sa famille

*« Je trouve que l'icône du texte n'est pas très parlante, fais-m'en une
cohérente. »*

Toute la barre d'outils est dessinée **au trait** : `stroke="currentColor"`,
épaisseur 2, `fill="none"`. L'icône du texte était la seule faite d'une **lettre
composée** — un `<text>` rempli — et, avec la flèche du pointeur, l'une des deux
seules sans trait. Une lettre composée ne suit pas l'épaisseur de ses voisines,
ne se règle pas, et dépend d'une police présente ; agrandie, le A tombait en
masse pleine au milieu d'un alphabet de traits fins. S'y ajoutaient un petit
carré flottant en haut à droite et un point que la jambe du A avalait : deux
détails qui ne disaient rien et se lisaient comme des poussières à 24 px.

**Ce qui ne clochait pas, et qu'il fallait mesurer avant de l'écrire.** À l'œil,
l'ancienne icône paraissait « plus lourde ». La part d'encre dit le contraire :
4,9 % de la vignette contre 5,6 % pour le T, dans une famille qui va de 5,6 à
9,6 %. Ce n'était donc pas une question de quantité d'encre mais de
**répartition** — une masse pleine contre des traits.

Le **T à empattements** est le signe universel de l'écriture. Ses deux crochets
du haut comptent : sans eux, un T nu se confondrait avec le ⊥ de la
perpendiculaire, deux boutons plus haut dans la même colonne et fait des deux
mêmes traits, une barre et un fût. Mesuré : 69 % des pixels encrés diffèrent
entre les deux vignettes.

Et l'aide en ligne montre le même dessin. Elle sert à retrouver un bouton du
doigt ; elle ne peut pas en montrer un autre.

### Le texte se pose où on l'a vu

*« Pour le texte, j'aimerais avoir le curseur de tape plutôt qu'une croix pour
voir où le texte ira, et quand on le valide il est légèrement décalé. »*

**Le curseur, d'abord.** Une croix *vise* un point. L'outil texte n'en vise pas
un : il ouvre une ligne d'écriture, et le I du curseur de frappe la montre,
debout, à l'endroit exact où la première lettre se posera. Tous les autres outils
gardent leur croix.

**Le décalage ne se voit pas dans les nombres.** Le champ de saisie et le texte
validé tombent sur les mêmes coordonnées — écart de boîte nul, mesuré à quatre
zooms. C'est pourquoi toutes les vérifications de coordonnées passaient depuis
toujours. Il fallait regarder l'**image** : deux captures, l'une pendant la
frappe, l'autre après validation, redonnées à la page qui sait les décoder, et
comparées pixel à pixel. Même largeur, même hauteur, même nombre de pixels
encrés — et le texte validé **remontait de 2 px à 16, de 6 px à 40**.

**Et c'est pourquoi on ne corrige pas d'une constante.** Deux pixels à 16 et six
à 40, cela ressemble à « 0,15 fois la taille » — et cette règle serait fausse à
la première police au dessin différent. On **aligne les deux lignes de base**,
chacune mesurée là où elle est : côté champ par une boîte de hauteur nulle
alignée sur la ligne de base, côté feuille par la différence des deux ascendantes
d'encre. Rien à refaire le jour où la police change.

Un piège, rattrapé par la mesure et pas par le raisonnement : le témoin posé à la
**fin** du champ mesure la **dernière** ligne. Sur un texte de deux lignes, la
correction faisait descendre le tout de 67 px. C'est la première ligne qui
s'ancre au clic, et c'est elle qu'il faut mesurer.

### Une droite qui a deux points n'a pas besoin de (d)

*« Une droite qui a deux points G et H par exemple n'a pas besoin de s'appeler
(d). »*

C'est la notation du cours : cette droite-là s'appelle (GH), et lui coller (d) à
côté de G et de H donne **deux noms au même objet sur la même feuille**. Le nom
(d) reste indispensable à la droite *sans* points — celle de l'outil « droite
sans points », ou celle dont les extrémités sont des croisements anonymes : sans
lui, l'énoncé dirait « Trace une droite » et rien ne pourrait s'y rapporter.

En le corrigeant, une autre ligne est apparue — et elle venait de la correction
précédente. Depuis que le point d'arrivée se range *après* le trait qui le
révèle, l'énoncé le lisait dans cet ordre :

```
1. Place le point A.
2. Trace la droite (AB).
3. Place le point B tel que AB = 8,4 cm.
```

Une figure doit être **constructible** : on ne trace pas (AB) avant d'avoir B. Le
dessin garde l'ordre de la main ; la lecture remet chaque extrémité devant l'objet
qui la nomme. C'est le seul endroit où les deux ordres diffèrent, et c'est normal
— l'un montre un geste, l'autre le fait refaire.

### À la main aussi, le point d'arrivée se trouve au bout du trait

*« Quand je dessine un segment avec la règle (outil segment), je dessine un point
A puis je trace le trait et j'obtiens le point B. Normalement à l'outil, j'ai le
point A, je trace et je fais glisser la règle jusqu'au bout du segment puis je
place le point, ce n'est pas le cas. »*

Les consignes écrites venaient d'être corrigées sur ce point ; l'outil à la main,
non. Mesuré — règle sortie, un trait tiré le long de son bord :

```
0 Point A · 1 Point B · 2 ToolAnimation[ruler] · 3 Segment
```

B était rangé **avant même que la règle se couche**. Au rejeu, les deux points
étaient donc là dès la première image et le trait venait les relier : le geste
montré n'était celui de personne.

**La règle, elle, glissait déjà.** C'est la moitié de la phrase, et il fallait la
vérifier avant de corriger quoi que ce soit : le trait mesuré fait 690 px pour
une règle de 400, et le plan de tracé compte bien **trois poses**. Ce n'était donc
pas le glissement qui manquait — c'était le point posé d'avance, qui donnait la
réponse avant la construction et rendait le glissement inutile à regarder.

Le point va donc après l'objet tracé, et jamais entre l'animation et lui : le
rejeu dessine le trait en cours en regardant l'entité qui suit immédiatement
l'animation, et s'il y trouve un point, le crayon court à vide.

Deux pièges que le comptage ne montre pas. **Un point accroché n'est pas un point
neuf** : quand le trait arrive sur un point déjà posé, rien n'est créé, et le
déplacer le sortirait de l'ordre où l'élève l'a mis. Et **le doigt est un autre
chemin de code** — la branche tactile sort par un `return` avant la branche
souris, c'est déjà elle qui avait autrefois privé la tablette du crayon au rejeu.
Une correction faite d'un seul côté passerait toutes les vérifications à la
souris ; la sonde ouvre donc un second navigateur, tactile, et refait le même
trait au doigt.

Reste une chose, mesurée et laissée telle quelle : pendant le tracé **vivant**,
le crayon peut sortir de la règle — 690 px le long d'un instrument de 400 — parce
que c'est le doigt de l'élève qui mène, et que faire glisser l'instrument sous sa
main serait une autre décision. C'est au rejeu que le geste se remet d'aplomb.

### Une médiatrice se construit au compas

*« J'ai mis : Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm et
ses médiatrices. J'ai eu cela, ce qui clairement n'est pas ce qu'il fait aux
instruments : "Pose l'équerre : son bord contre la droite (AB), son angle droit
sur ?. Trace le long de l'autre bord." »*

Deux mensonges dans la même ligne, et le second est le pire.

**Le point d'interrogation**, d'abord : c'est le milieu de [AB], calculé,
invisible, sans lettre. Le programme allait chercher la tournure générale de la
perpendiculaire — « passant par … » — et n'avait rien à mettre dans le trou. Un
énoncé qui demande de poser l'équerre sur un point qu'il ne sait pas nommer ne se
refait pas.

**Et surtout, ce geste n'avait pas lieu.** Mesuré sur la phrase, instruments
sortis : les trois médiatrices tenaient en trois objets — trois
`PerpendicularLine`, zéro animation, zéro arc. Rien ne bougeait à l'écran, les
droites paraissaient d'un coup, pendant que le texte décrivait une équerre posée
et une règle couchée. Le logiciel annonçait un geste qu'il ne faisait pas — et il
savait pourtant le faire, puisque « Trace la médiatrice de [AB] » sort le compas
depuis toujours.

La correction est de n'en avoir qu'une. Le triangle passe maintenant par la même
`cslPoserMediatrice` que la phrase seule : quatre arcs — deux depuis chaque
extrémité, du même écartement —, les deux croisements, et la règle qui joint.
Mesuré après : **douze arcs de plus que le triangle seul**, quatre par
médiatrice, et trois coups de règle pour joindre les croisements. Le programme,
lui, n'a plus besoin de décrire l'équerre : il reconnaît la figure et écrit
« Trace la médiatrice de [AB] », ce qui est à la fois plus court et plus vrai.

Le « ? » disparaît aussi **sans** les instruments, où la médiatrice reste une
perpendiculaire posée au milieu : il n'y a pas de geste à décrire, mais il y a
toujours un milieu sans nom, et le mot « médiatrice » le dit sans avoir à le
nommer.

**Le garde-fou.** Reconnue trop largement, la règle se retourne : « Trace la
perpendiculaire à (AB) passant par C » devenait « Trace la médiatrice de [AB] »
dès que C tombait au milieu de [AB]. Vrai, et pourtant faux comme énoncé — C
disparaissait de la consigne qui le nomme. La reconnaissance ne vaut donc que
pour un point **sans lettre** : quand la lettre existe, c'est elle qu'il faut
écrire.

### Le point d'arrivée se trouve, il ne se pose pas

*« Quand on trace un long segment avec la règle qui s'allonge, il faut dessiner
le point final qu'à la fin du tracé ; là tu mets les deux points et tu traces. »*

Sur une feuille, on pose A, on couche la règle, on trace — et B est ce qu'on
**trouve** à la graduation, au bout du geste. Le poser d'avance, c'est donner la
réponse avant la construction : le rejeu montrait deux points déjà là et un trait
qui venait les relier, ce qui n'est le geste de personne. Le troisième sommet
d'un triangle suivait déjà cette règle — il naît du croisement de deux arcs de
compas — ; le second, non. Et le rectangle et le parallélogramme posaient leurs
**trois** premiers sommets d'un coup avant de sortir le moindre instrument.

**Tout le piège est dans l'ordre.** Le rejeu dessine le trait en cours en
regardant l'objet qui *suit* immédiatement l'animation. Glisser le point
d'arrivée **entre** l'animation et son segment, et c'est lui que le rejeu
trouve : la règle se couche sur une feuille blanche, le crayon court pour rien,
et le segment paraît d'un coup à la fin. C'est très exactement ce qui avait fait
poser le point *avant* le geste — une correction qui en défait une autre sans
rien casser au comptage. Le point va donc **après** le segment : l'animation
garde son trait juste derrière elle, et le point vient en dernier.

Le même bâtisseur sert au doigt : quand l'élève a cliqué trois points, ils
existent pour de bon avant qu'on trace, et les ranger une seconde fois les
dédoublerait. Seul l'appel venu d'une phrase dit au bâtisseur quels sommets
restent à trouver ; les constructions magiques ne changent pas.

La sonde tient les trois choses sur neuf figures : un seul point visible quand
l'instrument sort, aucune animation de tracé suivie d'un point, et — gelée image
par image — le point d'arrivée absent à mi-course comme à 98 %, présent une fois
le trait fini. Les deux premières peuvent être vertes et la troisième fausse :
c'est la troisième qu'on voit à l'écran.

### Une droite se note (d), pas d

*« Pour le nom des droites sur le canvas, tu oublies les parenthèses autour. »*

Les parenthèses ne sont pas une décoration : elles **disent** qu'on parle d'une
droite. A est un point, (d) est une droite, [AB] un segment — c'est le premier
accord de notation qu'on demande à un élève, et le logiciel ne le tenait qu'à
moitié. Sur la feuille il n'y avait que la lettre ; l'énoncé rédigé trois
centimètres plus bas, lui, écrivait bien « la parallèle à (d) ». Deux notations
pour le même objet, sur le même écran.

Deux niveaux, et tout tient à ne pas les confondre. Le nom **rangé** reste
« d » : c'est ce qu'on tape pour renommer, ce que les phrases citent, ce que les
fichiers portent. Ce qui s'**écrit** est « (d) ». Les ajouter au nom stocké
aurait donné « ((d)) » au premier aller-retour, et « la parallèle à (d) » ne
trouverait plus rien.

Trois conséquences, dont aucune n'allait de soi :

- **La zone de préhension suit le texte.** Le nom se prend au doigt pour le faire
  glisser le long de la droite, et la zone était un disque de 16 px. Avec les
  parenthèses le texte fait 20 px de large : les deux tiers seraient restés hors
  de prise.
- **La méthode devait être recopiée sur la parallèle et la perpendiculaire.**
  Elles ne descendent pas de `LinearObject` : leurs méthodes de nom leur sont
  recopiées une à une. En oublier une ne se voit pas — elle lève au rendu, et
  comme les bâtisseurs dessinent en construisant, « Trace deux droites
  parallèles » répondait *« Je n'ai pas su faire ça »*. Un défaut d'affichage se
  déguisait en défaut de langue, et c'est la suite de sondes qui l'a démasqué.
- **Le SVG n'emportait pas le nom du tout.** Mesuré : un SVG exporté d'une figure
  portant (d) et A ne contenait qu'un seul texte, « A ». La droite arrivait
  anonyme dans le document où l'on colle la figure à côté de l'énoncé qui la
  nomme. Ce n'était pas une régression — il n'y avait jamais été.

Et une politesse : on voit « (d) » sur la feuille, donc on le retape avec ses
parenthèses. Le champ de renommage les retire.

### Une phrase qui nomme une droite peut l'inventer

*« Quand on dit : trace une parallèle à (d) passant par A — et que les objets
n'existent pas, tu les crées. »*

Deux phrases qui demandent la même chose, deux réponses opposées. Sur une feuille
vide, « Trace la parallèle à **(AB)** passant par C » posait A, B, C *et* la
droite (AB), et le disait. « Trace la parallèle à **(d)** passant par A »
répondait *« À quelle droite ? »*.

Or c'est la seconde qu'on écrit en préparant un exercice : une droite qu'on nomme
(d) n'a précisément pas à passer par des points qu'on nommerait. Et le refus
n'apprenait rien — il conseillait « … à (AB) passant par C », c'est-à-dire de
renoncer à la notation qu'on venait de choisir.

**La cause était dans le lecteur de phrases, et elle était invisible.** Les noms
de droite sont filtrés par une liste de mots courts — « de », « du », « et »,
« la »… — pour que « la droite du milieu » ne donne pas une droite nommée « du ».
La lettre **d** figure dans cette liste, à cause du « d' » élidé. Le filtre
s'appliquait *partout*, y compris entre parenthèses : « (d) » ne produisait donc
aucun nom, et il n'y avait rien à chercher ni à créer. Entre parenthèses il n'y a
pourtant aucune ambiguïté — on n'écrit pas « (de) ».

La droite se pose maintenant là où l'on regarde, et **c'est dit** :

```
La droite (d) n'existait pas : elle a été tracée.
Le point A n'existait pas : il a été placé.
```

Poser sans le dire serait pire que refuser : on croirait avoir tracé la parallèle
à une droite qu'on avait en tête, alors qu'elle vient d'être inventée. Et quand
tout existait déjà, on ne dit rien — une remarque qui paraît à tort est une
remarque qu'on cesse de lire.

Le point A tombe à 104 px de (d), jamais dessus : une parallèle à (d) passant par
un point de (d) serait (d) elle-même. La parallèle est **accrochée** à la droite
qu'on vient de créer, pas à une copie de ses coordonnées. Et l'énoncé rédigé
ensuite redonne la figure en trois lignes qui se suffisent.

La modification du lecteur est prouvée **étroite** : comparée à la version d'avant
sur cinq phrases, la seule réponse qui change est celle de « (d) ».

### Une parallèle doit savoir à quoi elle est parallèle — et s'en souvenir

*« Cannot read properties of null (reading 'x') — en traçant la parallèle puis
après en voulant une construction magique. »*

Le fichier de secours envoyé avec le message portait la réponse, à une ligne
près :

```json
{"type":"ParallelLine","id":"33vhtb38p","color":"#000000","p1Id":"r516ybkx6"}
```

**Pas de `refLineId`.** La parallèle savait par où elle passe ; elle ne savait
plus à *quoi* elle est parallèle.

On lui passait `{p1: a, p2: b}` — un objet fabriqué pour l'occasion, qui
n'appartient pas à la figure et n'a donc pas d'identité. Or un enregistrement ne
sait écrire que des **renvois** : « ma référence est l'objet n° 7 ». Il n'avait
rien à écrire, le champ valait `undefined`, et il disparaissait du fichier.

Trois conséquences, de la plus discrète à la plus brutale :

- la parallèle **copiait** deux points au lieu de s'accrocher à la droite ;
- rouverte, elle n'avait plus de référence du tout — mesuré : une parallèle
  avant l'enregistrement, **zéro** après ;
- et l'enregistrement **suivant** plantait. Sur le fichier envoyé, la version
  d'avant lève `Cannot read properties of undefined (reading 'id')` dès qu'on
  redemande le code compact — c'est-à-dire **à la sauvegarde automatique**, donc
  sans rien faire de particulier. C'est très probablement ce qui s'est passé.

La référence est maintenant une **vraie entité** dès qu'il en existe une : la
droite (d) nommée, ou la droite (AB) si elle est tracée. Quand il n'y en a pas —
« la parallèle à (AB) » ne demande pas de tracer (AB) — les deux formats
d'enregistrement écrivent à défaut les **deux points** de la référence, qui ont
une identité, eux. Ceinture et bretelles : les constructions d'aujourd'hui
donnent une vraie droite, mais les fichiers d'hier n'en ont pas, et un fichier
ne se relit qu'une fois — mal.

Une précision qui a coûté un aller-retour : on ne prend que la **droite**, pas le
segment qui joindrait les deux mêmes points. La phrase a écrit « (AB) », donc la
droite, et l'énoncé rédigé ensuite doit redire ce qu'on a demandé —
« perpendiculaire à la droite (AB) », pas « au segment [AB] ». La sonde des
énoncés l'a signalé aussitôt.

Enfin, un trait orphelin ne doit plus emporter la figure : une référence perdue
rend deux points nuls au lieu de lever, l'appelant sait déjà les reconnaître, et
le reste vit. Le fichier de secours se relit, et tout ce qu'on peut lui demander
ensuite marche.

La sonde qui garde tout cela **échoue douze fois** sur la version d'avant.

### L'équerre n'était pas trop opaque : elle était peinte trois fois

*« Rends l'équerre de manière globale un peu moins opaque. »*

On cherchait un réglage de couleur ; c'était une **addition**. Mesuré : la
méthode `draw()` de chaque instrument était appelée **trois fois par image** —
deux passes anciennes, plus la passe ordonnée par z-index, celle qui décide
lequel est au-dessus et qui sert aussi à l'export.

Or trois couches translucides ne font pas une couche translucide : à 0,5 chacune
il reste **0,88** d'opacité. Baisser le réglage n'y pouvait rien — trois fois
moins opaque restait presque opaque. Le thème demandait 0,85, le pixel valait
0,88, et personne ne pouvait comprendre pourquoi en lisant la table des thèmes.

Chaque instrument ne se peint plus qu'une fois, et un plafond commun à tous les
thèmes — y compris ceux qui n'existent pas encore — tient l'équerre à 0,5.
Ce n'est pas un goût de décorateur : **l'équerre est l'instrument qu'on regarde
à travers**. La règle se pose à côté du trait ; l'équerre se pose dessus, elle
couvre l'angle qu'on vérifie et le point qu'on vise. Un gabarit doit se regarder
à travers. Mesuré sur un trait noir vu au travers : **8 % du contraste avant,
45 % après**. Et trois fois moins de travail à chaque image.

### La parallèle n'était pas tracée : elle paraissait

*« Pour la parallèle, tu oublies de tracer la parallèle… »*

Le crayon court le long de la règle pour un segment ou une droite — jamais pour
une parallèle ni une perpendiculaire. Le test qui déclenche le tracé progressif
exigeait un `LinearObject`, un `Segment`, une `Line` ou une `Ray`, et une
`ParallelLine` n'est **aucun des quatre** : elle descend de `GeometryObject`,
parce qu'elle n'a pas deux extrémités mais un point et une direction.

Et c'est précisément ce qui la faisait rater deux fois : même admise dans la
liste, son `p2` est nul, et le crayon n'avait nulle part où aller. Il fallait
lui demander son second point, puis étendre de part et d'autre — une droite est
infinie, le trait doit naître d'un bout et courir jusqu'à l'autre.

L'équerre glissait donc jusqu'à C, puis le trait apparaissait d'un coup. Tout le
geste était montré **sauf celui qui fait la figure**. Mesuré maintenant : 700 px
à mi-course, 1 400 px à la fin, pour la parallèle comme pour la perpendiculaire.

La sonde **fige l'état** au lieu de courir après l'animation — on pose l'index de
rejeu, le drapeau d'animation et l'avancement à la main, on demande un rendu, et
l'on regarde les traits réellement dessinés. Guetter une image au vol pendant un
rejeu donne des mesures qui dépendent de la vitesse de la machine : on l'a payé
en cherchant ce défaut-ci, et deux mesures successives ont conclu l'inverse l'une
de l'autre avant qu'on s'en aperçoive.

### Le banc d'essai des phrases

*« Tu peux me faire un bouton caché de debug pour que je puisse tester des
phrases ? »*

Une phrase à la fois, c'est une phrase par minute : on ouvre la barre, on écrit,
on regarde, on efface la figure, on recommence. Vingt formulations d'une même
consigne prennent la demi-heure — et l'on ne compare rien, puisqu'on ne les voit
jamais ensemble. Or c'est exactement la question qu'on se pose en préparant un
énoncé : **laquelle** de ces tournures passe ?

On y écrit autant de phrases qu'on veut, une par ligne, et l'on voit d'un seul
coup d'œil lesquelles sont comprises, ce qu'elles ont construit, et combien de
gestes d'instrument elles ont produits. Chaque phrase est **réellement
exécutée** — pas analysée, pas devinée : c'est la réponse du logiciel qui
s'affiche, refus et explication compris. Un banc qui prédirait au lieu
d'exécuter mentirait précisément le jour où l'on en aurait besoin.

Trois façons d'y entrer : sept clics sur la date de version (la porte dérobée
qui existait déjà), l'adresse **`#phrases`** — qui se met en favori, et qui est
la seule praticable sur un téléphone, où l'on n'a pas de console —, ou
`app.bancPhrases()`. Jamais dans l'interface élève.

**La figure ouverte n'est pas touchée**, et c'est la condition pour qu'on s'en
serve : on tombe sur ce panneau en pleine préparation de cours, et un outil de
mise au point qui abîme le travail en cours ne sera plus jamais ouvert. Chaque
essai se joue sur une feuille de côté — la vraie est mise de côté puis remise,
sans sérialisation : ce sont les mêmes objets qui reviennent, pas des copies.
Vérifié au caractère près, code compact **et** énoncé, plus l'historique qui ne
bouge pas : rien à annuler après coup.

Et **une lettre ne le ferme pas.** Les autres secrets cèdent à n'importe quelle
touche et n'importe quel clic : ils ne contiennent que du texte à lire. Celui-ci
contient des phrases qu'on tape — la première lettre l'aurait refermé, et le
premier clic dans la zone de saisie aussi. Même règle que pour la barre de
l'énoncé, pour la même raison. Le texte et la case sont retenus d'une ouverture
à l'autre, et un lien recopie le relevé.

### Ce qui devient faux quand la droite porte un nom

*« J'ai mis "trace une droite (d)" et "un point A qui n'est pas sur (d)" et
"trace la parallèle à (d) passant par A". J'ai l'impression que ça ne
fonctionnait plus avec les outils. »*

Trois défauts se cachaient dans ces trois phrases, et chacun aurait suffi à
gâcher la figure.

**Un chemin de code qui ignorait le réglage.** « La parallèle à (AB) » sortait
l'équerre et la règle ; « la parallèle à (d) » ne sortait rien. Mesuré : six
animations d'un côté, **zéro** de l'autre, la case « avec les instruments »
cochée dans les deux cas. Ce n'était pas un réglage qui ne prenait pas, c'était
la branche « la droite de référence porte un nom » qui posait le trait
directement, sans jamais regarder le réglage — et la perpendiculaire avait le
même trou.

**Une négation lue à l'envers.** « Place un point A qui n'est pas sur (d) »
répondait *« A sur (d) »* et posait le point **dessus**, à 0,0 px de la droite.
Le mot « sur » suffisait à décider ; la négation qui le précède n'était jamais
regardée. Rien n'est plus grave dans un logiciel qui exécute des phrases : faire
l'inverse de ce qui est écrit, en annonçant qu'on l'a fait. Et la conséquence
était en cascade — A sur (d), la parallèle à (d) passant par A *est* (d).

**Et un point libre qui tombait sur le trait.** Celui-là n'avait été signalé par
personne, et c'est le plus sournois. « Trace une droite (d) » passe par le
centre de la vue, et le placement libre posait le point suivant exactement là :
« Place un point A » le déposait à 0,0 px de (d). Le point avait l'air contraint
sans l'être, et la figure mentait sans qu'une seule phrase soit fausse. Un point
libre n'est tenu par rien : il ne doit avoir l'air de rien. Il évite désormais
les droites comme les segments, à 42 px près.

### La ligne d'accueil propose les instruments, et s'efface quand on dessine

*« Dans l'énoncé qui apparaît au démarrage, on a ou pas la possibilité de mettre
les outils pour voir l'animation ? Il faudrait que si on clique ailleurs sur le
canvas, la ligne qui s'ouvre au début disparaisse. »*

On ne l'avait pas — la case n'existait que dans la barre éclair. C'est pourtant
là qu'on écrit sa toute première phrase, donc là qu'on découvre le logiciel ; et
ce qu'il a de particulier n'est pas de tracer un triangle, c'est de le tracer
**à la règle et au compas, en montrant le geste**. Ne pas proposer la case au
premier écran, c'était réserver l'essentiel à ceux qui fouillent. Elle est là,
32 px de cible au doigt, et partage la mémoire de la barre éclair : cochée une
fois, cochée partout.

Quant à l'invitation, elle ne prenait déjà pas les clics — ils la traversaient —
mais elle **restait**, posée au milieu du dessin qu'on commençait dessous. Elle
ne disparaissait qu'une fois un objet créé ou un outil pris. Elle s'efface
maintenant au premier contact avec la feuille, et « tout effacer » la redonne :
feuille neuve, invitation neuve.

Ce n'est pas contradictoire avec la barre de l'énoncé, qui elle ne se ferme plus
d'un clic à côté. Celle-là contient du texte qu'on a **écrit** ; celle-ci est une
proposition. On écarte une proposition d'un geste ; on ne jette pas un travail
d'un geste.

### La parallèle : l'équerre ne doit pas viser le point

*« L'équerre écrase la règle, en gros les outils se superposent. Quand on trace
la parallèle à (AB) passant par C, on n'est pas obligé qu'un côté de l'angle
droit passe par C quand on place l'équerre le long de (AB) ; il faudra juste que
quand on glisse l'équerre, ça touche le point C. »*

Deux défauts, et le même point les causait tous les deux : les deux instruments
étaient posés en **F**, le pied de la perpendiculaire menée de C.

**L'équerre était donc déjà alignée sur C avant de glisser** — et c'est un
contresens complet. Poser son angle droit exactement au pied de la
perpendiculaire suppose qu'on sache déjà tracer cette perpendiculaire, donc
qu'on sache faire ce que la leçon cherche à apprendre. En classe on pose
l'équerre **n'importe où** le long de la droite ; c'est le glissement qui amène
le bord sur C, et c'est tout l'enseignement du geste. Elle part maintenant
130 px en arrière du pied : elle ne vise rien, et le bord arrive sur C parce
qu'il ne peut pas faire autrement. Mesuré dans cinq configurations : 130 px du
pied au départ, **0,000 px** du bord à l'arrivée.

**Et la règle était sous l'équerre.** L'orientation de celle-ci n'était pas
choisie : son grand côté partait dans le sens de A vers B, quel qu'il soit, donc
son corps tombait tantôt du côté de C, tantôt de l'autre. Le sens est maintenant
déterminé par C — le second côté de l'angle droit pointe vers lui, puisque c'est
de ce côté qu'il faut glisser — et la règle se pose contre ce côté, son corps de
l'autre côté du rail. La sonde calcule le recouvrement réel des deux corps (un
triangle rectangle de 400 × 250, un rectangle de 400 × 60, aux poses exactes) et
exige **zéro**, C au-dessus comme en dessous, A et B échangés, droite oblique.
Elles se touchent le long d'une arête, comme sur une vraie table.

La perpendiculaire, elle, n'avait pas le défaut : elle **range l'équerre avant**
de sortir la règle, les deux ne sont jamais dehors ensemble. C'est vérifié
aussi, pour que personne ne répare un jour ce qui n'est pas cassé.

### Une droite a un nom, et son nom va au bord

*« Donne un nom aux droites — écris le nom le plus proche possible d'un bord,
soit droite, soit gauche, au plus logique. Comme cela dans l'énoncé, on peut
avoir "trace une droite (d)". »*

Le nom se posait au second point. Sur un segment c'est son extrémité, donc sa
place ; sur une **droite**, le second point n'est qu'un point de passage
arbitraire — le plus souvent au milieu de la figure, là où il y a le plus de
monde. Au tableau, on écrit (d) au bout du trait, contre le bord de l'ardoise,
parce que c'est le seul endroit sûrement vide.

C'est donc là qu'il va : le logiciel cherche par où la droite **sort du cadre**
et pose son nom juste avant la sortie. Laquelle des deux ? La droite — on lit de
gauche à droite et le nom se trouve au bout du regard. Sauf quand la droite est
plutôt verticale : « à droite » n'y veut plus rien dire, et c'est en haut qu'on
l'écrit. Mesuré : le nom sort à 1 253 px d'un cadre de 1 292, et à 34 px du haut
pour une droite presque verticale. Ce n'est que le défaut — dès qu'on a fait
glisser le nom soi-même, la place choisie l'emporte, et elle voyage avec la
figure.

Le cadre se déduit du **contexte de dessin**, pas de la vue courante : c'est ce
qui le rend juste à l'export aussi, où l'image a son propre cadrage et ignore
tout du zoom de l'écran. Avec un piège mesuré au passage : à l'écran, le canevas
fait 3 000 × 2 000 et déborde volontairement — c'est le conteneur qui le rogne.
S'y fier aurait posé le nom mille pixels hors de l'écran.

**Et le nom ne remplace pas les deux points.** C'est le piège de cette
demande-là : écrire « Trace la droite (d) » après avoir placé A et B rend
l'énoncé **inconstructible** — rien ne dit plus par où passe (d), et l'élève
trace la première droite venue. L'énoncé dit donc les deux :

```
Place les points A et B tels que AB = 6,5 cm.
Trace la droite (AB), que l'on note (d).
```

Quand l'outil « droite sans points » a effacé les extrémités, il n'y a rien à
citer — et « Trace une droite (d). » est alors exactement juste : n'importe
laquelle convient, c'est ce que l'énoncé doit dire.

### Trois médiatrices, pas deux

*« Pour la médiatrice dans la bibliothèque ou la construction magique, trace les
3, pas deux seulement. »*

Le cercle circonscrit n'en traçait que deux, et pour une raison qui se défend :
dès qu'elles se coupent, le centre est trouvé. Mais ce n'est pas le compte qu'on
enseigne ici. Le théorème dit que les trois médiatrices d'un triangle sont
**concourantes**, et la troisième est la seule à le montrer — tracée, elle passe
par le point déjà obtenu et l'élève la voit arriver ; absente, il n'y a rien à
démontrer, seulement deux traits qui se croisent comme deux traits quelconques.

Elle ne sert pas à placer O : ce sont toujours les deux premières qui le
définissent. Vérifié qu'il reste juste — OA = OB = OC à 218 px, et encore
191/191/191 après avoir tiré A de 80 px. L'exemple de la bibliothèque a été
**régénéré par le bâtisseur corrigé**, en repartant des positions exactes des
trois sommets de l'ancien : ces figures-là ne s'écrivent pas à la main, elles
sont la sortie de leur constructeur.

### La barre de l'énoncé ne se sabote plus elle-même

*« Si on clique hors de la zone de "écris l'énoncé", la barre disparaît. »*

Elle se refermait comme toutes les fenêtres du logiciel — sauf que les autres ne
contiennent rien qu'on ait **écrit**. On tape une phrase de quinze mots, la main
glisse, le clic tombe à deux centimètres de la boîte, et tout disparaît. Une
fenêtre qui ne demande qu'un choix peut se fermer d'un clic à côté : on n'y perd
rien. Une fenêtre qui porte du travail en cours ne le peut pas.

Il reste deux sorties, toutes deux délibérées : la croix et Échap. Avec une
seconde porte qu'il a fallu rouvrir : tant qu'un clic à côté refermait la barre,
le foyer ne pouvait pas quitter le champ sans qu'elle disparaisse, et un Échap
branché sur le seul champ suffisait. Maintenant qu'elle reste, le foyer peut
être ailleurs — Échap écoute donc depuis la page. En fermant une porte, on en
avait condamné une deuxième.

### Le bouton du rangement auto disait le contraire de la vérité

*« Active le rangement auto on/off en on. »*

Il l'était déjà : c'est lui qui écarte le nom d'un point du trait qui passe
dessous, et il naissait actif. Mais **son bouton naissait éteint** — le logiciel
affichait l'inverse de ce qu'il faisait, et le premier appui, qu'on croyait
allumer, éteignait. L'état ne s'écrit plus qu'à un seul endroit, appelé au
démarrage comme à chaque bascule. Au passage, prendre un nom à la main éteint
désormais le mode **pour de bon**, et pas seulement en apparence.

### Un milieu déjà là ne se double pas

*« J'ai tracé une médiatrice, j'ai donc obtenu le milieu du segment, le point
s'est appelé O. Lorsque j'ai cliqué sur l'icône milieu puis sur O, le logiciel a
créé un point D puis a codé. Je ne veux pas de création de point si un point est
déjà le milieu, par contre je veux bien le codage. »*

C'est exactement ce qui se passait : **deux points superposés** au même endroit,
deux fois le même codage, et une figure qui dit deux fois la même chose. Le clic
tombait d'ailleurs sur le *segment* — O est dessus —, si bien qu'on ne pouvait
même pas s'en sortir en visant mieux.

L'outil Milieu regarde maintenant si quelqu'un occupe déjà la place, de deux
façons : **par construction**, quand le point a déjà les deux extrémités pour
parents, ou **par position**, quand il tombe au milieu à la distance d'accrochage
près. Dans les deux cas il garde ce point-là et se contente de poser le codage
qu'on venait chercher. Trois conséquences :

- le milieu **nommé** (le vôtre) reste, et reçoit sa marque ;
- le milieu **caché** — une médiatrice laisse le sien en point de construction —
  se **montre** et prend un nom, au lieu de disparaître sous un second point ;
- un point simplement **posé là** devient un vrai milieu : il dépend désormais du
  segment et le suit quand on tire sur une extrémité.

### Et le menu contextuel le propose

*« Quand on a un point et que celui-ci est le milieu d'un segment, on pourrait
proposer le codage du milieu dans le menu contextuel. »* Il ne le proposait qu'aux
points **construits** comme milieux. Un point posé à la main au milieu d'un trait
n'avait rien : on voyait bien que c'était le milieu, on ne pouvait pas le dire.

Il l'a. Et le coder fait de lui un vrai milieu — c'est nécessaire autant que
juste : le codage se dessine à partir des deux parents, sans eux il ne
s'afficherait pas du tout, et un point posé là par hasard ne resterait pas au
milieu dès qu'on tire sur une extrémité. Un point qui dit « je suis le milieu »
doit l'être.

### « Tout effacer » efface vraiment, et n'emporte rien avec soi

*« Quand on met tout effacer, si l'animation est en route, ça bloque la prochaine
session. De plus quand on met tout effacer les outils se rangent. »*

Deux choses, et la première est un **gel**. « Tout effacer » vidait la feuille
sans prévenir le rejeu qui tournait dessus. Mesuré, juste après l'effacement :
`isPlaying` et `isLocked` restaient **vrais sur une feuille vide**, le curseur
affichait « interdit », et l'interface était gelée le temps que le moteur
s'aperçoive qu'il n'a plus rien à jouer. Ctrl+Z, lui, appelle depuis longtemps la
fonction qui arrête proprement le rejeu **avant** de toucher à l'historique ;
« tout effacer » ne l'appelait pas — c'est pourtant le même besoin. Il l'appelle
maintenant : aussitôt après l'effacement, plus rien ne joue, plus rien n'est
verrouillé, et la construction suivante se rejoue jusqu'au bout.

Et la table est nette : les quatre instruments **se rangent** avec la figure. Une
feuille vide sur laquelle traînent la règle, l'équerre, le rapporteur et le
compas n'est pas une feuille vide.

### La flèche et la main, au clavier

*« Y a-t-il des raccourcis pour la souris ou la main ? Si oui mets en tooltip
aussi, si non fais-en. »* Il n'y en avait pas — pour les deux outils sur lesquels
on revient après **chaque** tracé, et qu'il fallait chaque fois retraverser
l'écran pour reprendre.

- **S** comme **S**électionner : la flèche.
- **M** comme **M**ain : faire glisser la feuille.

Les initiales, en français, pour n'avoir rien à retenir — et écrites dans
l'infobulle des deux boutons, car un raccourci que personne ne découvre n'existe
pas. Pas d'espace pour la main, quoi qu'en dise l'habitude des logiciels de
dessin : ici la barre d'espace avance la construction d'une étape, c'est ce que
renvoie une télécommande de présentation et cela sert au tableau. Et comme toute
touche d'une seule lettre, elles ne font rien tant qu'un champ a le foyer — taper
« ms » dans une consigne écrit « ms ».

### Un seul outil allumé à la fois

*« L'icône segment reste toujours allumée. »* Elle l'était. La ligne qui éteint
l'outil précédent épargnait tous les boutons dont l'identifiant commence par
`btn-`, pour ne pas éteindre les quatre instruments quand on change d'outil de
tracé. Mais les instruments ne portent pas cette classe-là — ils ont la leur,
que rien ici ne touche. **L'exception ne protégeait donc personne**, et elle
attrapait le seul outil de tracé qui ait un identifiant : le segment. Passé du
segment au cercle, on voyait deux icônes allumées, et celle du segment ne
s'éteignait plus jamais — ni en changeant d'outil, ni en cliquant ailleurs.

### La visite tient dans un téléphone

*« La présentation de l'aide et la démo aide est vraiment pas adapté au
téléphone. »* Trois défauts, dont un grave.

**La visite se jouait hors de l'écran.** Elle est composée pour une feuille de
1292 px de large, et ses gestes visent des points écrits en clair — le B de la
première étape est à x = 890. Un téléphone en montre 390 : la moitié de la visite
tombait donc hors champ, et l'on regardait une feuille vide pendant que la main
travaillait à côté. La vue est maintenant posée **une fois, au début de chaque
étape**, de façon que la scène — mesurée sur les douze étapes, la plus large étant
la médiatrice et ses arcs — tienne tout entière dans ce qui reste visible, barre
de la visite déduite. Sur un écran d'ordinateur le zoom vaut 1 et rien ne change ;
sur un téléphone la même visite se joue à 0,40, mais elle se joue **en entier**.

**La barre cachait ce qu'elle désignait.** Sur téléphone les outils de tracé sont
dans une bande *en bas* de l'écran — exactement là où elle se pose. On montrait
donc des icônes invisibles, et le principe « on voit où on appuie » tombait. Elle
passe en haut quand ce qu'on désigne est en bas. Elle prend aussi toute la largeur
et **garde sa phrase** : elle était rangée sur une ligne comme sur un ordinateur,
et le commentaire avait été purement supprimé — une visite guidée sans commentaire
n'est plus qu'un film muet.

**Les cinq onglets débordaient** : 413 px demandés pour 354 disponibles, et
« Démonstration » — l'onglet de la visite, justement — était coupé au bord, sans
rien pour dire qu'il fallait faire glisser. Ils passent à la ligne, trois puis
deux. Le bouton « ▶ Lancer la démonstration » est remonté **avant** le sommaire :
il était sous douze lignes, donc invisible sans faire défiler, alors que c'est
précisément ce qu'on vient chercher. Et l'aide des instruments, dont le dessin de
240 px et le texte côte à côte débordaient de 22 px, empile les deux.

### La trousse se lit d'un tenant

*« Pour l'aide sur les instruments, il faut mettre les 4 instruments les uns à la
suite des autres : l'équerre est toute seule en bas. »* Elle l'était : on lisait
le compas, le rapporteur, la règle — puis le stylo, le croquis et le document de
fond — et l'équerre enfin, après trois blocs qui n'ont rien à voir avec la
trousse. Les quatre se suivent maintenant, chacun avec son dessin.

### Un quart de tour se dit « perpendiculaire »

> *« Place l'image D de B par la rotation de centre A et d'angle 90° dans le sens
> inverse des aiguilles d'une montre. »*
> *« Parler de rotation de 90°, c'est compliqué : parle plutôt de
> perpendiculaire. »*

La phrase était exacte, illisible, et surtout elle ne disait pas **comment
faire**. Un quart de tour autour de A, c'est la perpendiculaire à (AB) en A et la
même longueur reportée dessus — deux gestes que l'élève connaît :

> Trace la perpendiculaire à (AB) passant par A, puis place D sur cette
> perpendiculaire tel que AD = AB *(un quart de tour dans le sens inverse des
> aiguilles d'une montre)*.

Le sens reste dit, entre parenthèses, parce qu'il y a bien deux points sur cette
perpendiculaire et qu'il faut choisir. Et — *« en fait tu as tracé d'abord [AB],
puis la perpendiculaire à (AB) passant par A »* — **on ne nomme (AB) que si (AB)
existe** : la phrase regarde la figure, et commence par *« Trace [AB], puis… »*
tant que le trait n'y est pas. Deux points posés ne font pas une droite ; c'est
l'ordre qu'observe déjà l'énoncé du carré. Un demi-tour, lui, **est** une symétrie
centrale : autant l'appeler par son nom — *« Place le symétrique D de B par
rapport au point A. »* Un angle quelconque reste une rotation, il n'y a rien de
plus simple à en dire.

Le sommaire affiché dans l'aide est écrit **à partir** des étapes : une ligne
ajoutée au programme s'ajoute toute seule à l'aide. La figure en cours est mise de
côté au départ — on prévient — et **remise en place à l'objet près** à la sortie,
avec le cadrage, la vitesse de rejeu, le style du crayon et les réglages du tiroir
magique.

### Une droite se déplace, et elle garde sa pente

*« Pourrait-on bouger une droite (on garde sa pente) ? »* On ne le pouvait pas :
on ne prenait que ses extrémités — ce qui la fait **pivoter**, pas glisser — et
pour la translater il fallait déplacer A puis B du même vecteur, à la main, sans
se tromper. Mesuré : tirée par son milieu, la droite ne bougeait pas d'un pixel.

On la prend maintenant par son **trait**, et ses deux points partent ensemble :
la pente est conservée *par construction*, puisque le vecteur est le même pour
les deux. Deux garde-fous : seuls les traits dont les deux extrémités sont
**libres** se prennent ainsi — une droite bâtie sur un milieu ou sur un
croisement appartient à ce qui la porte — et le cadre de sélection survit, il
naît toujours d'un appui dans le vide.

Au passage, une zone morte disparaît : **au milieu exact d'un segment**, l'aimant
du milieu offrait un point que le curseur ne sait pas déplacer, et le clic ne
faisait donc rien du tout. C'est justement là que la main va chercher le trait.

### Les icônes des transformations parlent la même langue

Les cinq pictogrammes ne partageaient aucune grammaire : les uns en aplats pâles
à 30 % d'opacité, les autres au trait ; certains montraient la figure et son
image, d'autres seulement l'appareil de la transformation. Et à 20 px, des
pointillés « 2 2 » deviennent de la bouillie — la symétrie centrale n'était plus
qu'une tache.

Une règle pour les cinq : **la figure au trait plein, son image en pointillés**, et
l'appareil de la transformation — un axe, un centre, une flèche, un arc, un
rayon.

La rotation fait exception, et c'est mesuré : un triangle en pointillés traversé
par l'arc devient un gribouillis à la taille réelle. **Trois marques tiennent
dans 20 px, pas quatre** — elle montre donc la figure, le centre et l'arc, qui dit
déjà le mouvement. L'homothétie a perdu l'un de ses deux rayons pour la même
raison.

### L'angle droit n'est pas un objet de plus

*« J'ai deux angles droits !!!! »* — deux petits carrés superposés au même
croisement, décalés de quelques pixels. Puis le diagnostic, qui valait mieux que
le mien : *« C'est quand tu traces une perpendiculaire d'un schéma et que l'on
met un angle. Il ne faut pas qu'il y ait les deux : l'angle droit est un dessin
particulier de l'angle. »*

Exactement cela. La perpendiculaire code déjà son coin ; on repose un angle au
même endroit ; et comme il vaut 90°, il se dessine lui aussi en petit carré. Deux
objets pour une seule chose à dire.

Une première garde comparait les sommets au **demi-pixel** — seul un recouvrement
exact était vu. Or personne ne clique au pixel près : mesuré, **un pixel** d'écart
suffisait à faire réapparaître les deux carrés. La garde prend maintenant la
distance d'accrochage de l'application, celle à laquelle un point s'attrape à la
souris : ce qui est « le même point » pour la main est le même point pour la
figure. Les côtés doivent s'accorder à 6° près — ce qu'un sommet posé à la main
décale déjà, et très loin des 90° qui séparent les quatre angles d'un croisement.

Et le geste n'est pas perdu pour autant : ce que le nouvel angle dit de **plus** —
sa couleur, sa valeur affichée, son remplissage — passe sur celui qui est déjà
là. Un seul angle, mais c'est bien le sien.

`tests/probe-angle-unique.js` tient les deux bouts : un coin déjà codé n'accepte
pas de second angle jusqu'à 10 px d'écart, tandis que les angles complémentaires,
adjacents, supplémentaires, opposés par le sommet — et les quatre angles d'un
croisement — vivent tous, parce que leurs côtés sont différents.

### L'arc s'affiche là où le compas l'a tracé

*« Pour le dessin du triangle et ses médiatrices, l'endroit où le compas trace
les arcs de cercle et les arcs de cercle ne sont pas au même endroit. »* Vrai, et
c'était une régression du jour même : en portant l'écartement de la médiatrice de
0,7 × AB à AB, j'avais laissé à **0,7** le rapport qui recalcule l'arc quand la
figure bouge. Le compas tournait à un rayon, le trait s'affichait à un autre.

Le geste et la trace sont deux objets distincts, et rien n'oblige le second à
suivre le premier — sauf une règle, désormais dans l'audit : **toute animation de
tracé au compas doit être suivie d'un arc de même centre et de même rayon**, au
pixel près. Sept figures vérifiées à chaque exécution.

### Un bouton allumé doit se voir allumé

*« Le crayon est on mais il n'est pas montré actif, comme s'il était off. »* Le
bouton naissait bleu et disait « Crayon (ON) » — les deux écrits en dur dans le
HTML — mais la classe `active`, celle qui dessine le fond du bouton enfoncé,
n'était posée que par le dock élève, qui ne s'exécute pas sur la page du
professeur. Trois façons de dire « allumé », dont deux seulement au rendez-vous ;
il fallait éteindre puis rallumer pour qu'il ait l'air de ce qu'il était depuis
le début.

L'apparence se déduit maintenant de l'état, en un seul endroit, appelé à
l'ouverture comme au clic. `tests/probe-crayon-actif.js` vérifie les trois
marques **ensemble** — classe, couleur, infobulle : une apparence à moitié juste
est un mensonge à moitié.

### Le numéro de l'épaisseur ne déborde plus de sa case

Il portait `width: 14px`, mais c'est un élément flex : le curseur voisin le
comprimait et sa case tombait à **8 px**. Le chiffre, qui en fait quatorze,
débordait par la droite et venait se coller au bord du panneau — mesuré à **1 px**
du bord, quand toutes les autres rangées s'arrêtent 15 à 34 px avant. `flex: 0 0
auto` lui rend sa case entière, et le curseur cède les quelques pixels qu'il
prenait en trop.

### On ne reporte que ce qu'on a d'abord pris

*« Pour la translation, il manque à un moment le fait que le compas prend
l'écartement entre l'origine du vecteur et le point dont on veut faire
l'image. »* C'est le geste fondateur du compas, et il est en deux temps : on
**pose** la pointe sur un point et la mine sur un autre — voilà l'écartement, et
il vaut une longueur qui existe sur la figure — puis on **porte** ce même
écartement ailleurs. Le second geste ne se justifie que par le premier. Un compas
qui s'ouvre tout seul au centre de l'arc qu'il va tracer fait apparaître une
longueur venue de nulle part.

D'où une règle, et un audit qui l'applique à tout — `tests/audit-ecartement.js` :

> Chaque fois que l'écartement du compas **change**, il doit changer à un endroit
> où la longueur existe : la pointe sur un point de la figure, la mine sur un
> autre, à la bonne distance et dans la bonne direction.

Garder l'écartement pour reporter dix fois est légitime — c'est même tout
l'intérêt. Ce qui ne l'est pas, c'est de l'obtenir sans le prendre. **26 cas** sur
les vingt et une constructions magiques et dix-huit consignes au compas :

- **la translation** ouvrait le compas au centre de l'arc, de 10 px au rayon
  voulu. Elle prend maintenant DE sur le vecteur, puis DP entre l'origine et le
  point — les deux longueurs que la propriété du parallélogramme met en jeu ;
- **la médiatrice** ouvrait « aux sept dixièmes de AB » — une longueur que rien
  ne porte et qu'aucun élève ne saurait régler. Elle prend AB : la longueur du
  segment lui-même, qui dépasse toujours la moitié, et dont les deux arcs se
  croisent aux sommets des triangles équilatéraux de [AB]. Même correction pour
  les deux médiatrices du cercle circonscrit et celles du yin-yang ;
- **la bissectrice** ouvrait à `60` — soixante pixels. Elle prend le plus court
  des deux côtés de l'angle, puis la distance entre les deux intersections ;
- **le pentagone** passait de l'écartement du nombre d'or (268 px) à celui du
  côté (282 px) en se déplaçant, sans montrer où la nouvelle longueur avait été
  prise ;
- **la spirale du carré** faisait grandir son rayon de côté en côté, mais le bout
  de la spirale n'était qu'une paire de coordonnées : l'écartement se prenait
  entre le sommet et *rien*. Le bout est maintenant un point de la figure ;
- **les étoiles et les polygones inscrits** ne montraient pas la prise du rayon
  sur `[O, bord]` avant le premier report.

**Deux gestes légitimes, pas un.** On peut aussi *ouvrir le compas à une mesure*
que l'énoncé donne en centimètres, réglée sur la règle graduée : c'est le geste
du triangle 5-3-4. Il introduit une longueur venue du dehors et doit donc se
**déclarer** — l'audit l'accepte et le compte à part. Un triangle *équilatéral*,
lui, reporte le côté qu'il vient de tracer : il le prend sur [AB].

Restent deux écartements **déclarés faute de mieux**, et c'est plus honnête que
de les taire : le sixième du rayon des deux points du yin-yang, qui est une
proportion du dessin et non une longueur de la figure ; et les parts du rayon de
base des dessins au compas, dont le programme écrit dit déjà comment on les
obtient — *« construis le milieu d'un rayon à la médiatrice »* — mais dont
l'animation saute encore le partage.

### Les sommets d'une étoile se construisent, ils ne se placent pas

*« Pour les étoiles, les points sont placés sur le cercle mais arbitrairement,
pas en utilisant le compas et les arcs de cercle. »* C'était exactement cela. Les
sommets dépendaient bien du cercle — ils y glissaient — mais leur position venait
d'une seule ligne :

```js
const ang = -Math.PI / 2 + k * 2 * Math.PI / n;
```

Une division de 2π. Rien sur la feuille ne disait d'où ils sortaient, et l'on ne
pouvait pas refaire le geste : c'est un dessin qui a l'air juste, pas une
construction.

**Deux gestes suffisent à presque tout**, et ce sont ceux qu'on fait à la main.
*Reporter* l'écartement de proche en proche — le rayon se reporte six fois
exactement sur le cercle, c'est le fait élémentaire dont sortent l'hexagone, le
triangle et la rosace. Et *couper un arc en deux* par la médiatrice de sa corde,
qui passe par le centre : de six on passe à douze, de quatre à huit, de cinq à
dix. Le côté du pentagone, lui, se construit au **nombre d'or** — le milieu du
rayon perpendiculaire, un arc jusqu'au premier sommet — puis il se reporte.

Chaque sommet est désormais le **croisement** de son arc et du cercle. Seul le
tout premier point du tour est posé : il faut bien commencer quelque part.

| branches | sommets construits | au tracé | agrandi | déplacé |
|---|---|---|---|---|
| 5 | 4 / 5 | 72° | 72° | 72° |
| 6 | 5 / 6 | 60° | 60° | 60° |
| 8 | 7 / 8 | 45° | 45° | 45° |
| 10 | 9 / 10 | 36° | 36° | 36° |
| 12 | 11 / 12 | 30° | 30° | 30° |

**Ce qui ne se construit pas ainsi ne se construit pas du tout.** Sept, neuf et
onze parts sont impossibles à la règle et au compas — c'est le théorème de
Gauss-Wantzel, pas une limite de l'outil. Le logiciel le dit et sort le
rapporteur : *« Attention : partager un cercle en 7 ne se fait PAS à la règle et
au compas […]. Les 7 sommets sont donc placés au RAPPORTEUR, de 51,4° en 51,4°. »*
Se taire laisserait croire que tout se construit.

**Un arc dessiné court reste un cercle entier pour le croisement.** Quand on
reporte un écartement on n'encre qu'un bout d'arc, mais le point cherché est le
croisement de deux *cercles*. En bornant le croisement au trait visible, un
déplacement un peu vif faisait sortir le point de sa fenêtre : mesuré, une étoile
à douze branches déplacée de 70 px perdait trois sommets et ses écarts passaient
de 30° à 15°–60°.

**Sans les instruments, la figure et rien d'autre.** La construction existe
toujours — c'est elle qui tient les sommets — mais elle ne se montre qu'à qui a
demandé les instruments.

Les **polygones inscrits** avaient le même défaut, et sont passés par le même
chemin : l'hexagone, le carré et le triangle équilatéral inscrits gardent
maintenant 60°, 90° et 120° après qu'on a agrandi puis déplacé leur cercle.

Reste la **rosace**, dont les six centres de pétale sont encore posés à l'angle.
Là, ce sont les pétales eux-mêmes qui font le report — l'arc d'un pétale va d'un
voisin à l'autre — et les prendre pour croisements suppose de traiter leurs
extrémités, où le calcul est fragile. Le geste est juste, son écriture ne l'est
pas encore.

### Le lien porte la figure, pas sa relecture

L'énoncé engendré est un **texte relu** sur la figure — le panneau le dit
lui-même, *« relu sur la figure, se met à jour tout seul »*. J'avais commencé à
épingler cette relecture dans le code de partage, et à moitié : sur les trois
marques ajoutées le même jour, **une seule voyageait**. Le lien rendait donc un
énoncé qui n'était ni celui de l'auteur ni une relecture honnête. Mesuré à
l'ouverture d'un lien :

| figure | par lien |
|---|---|
| hexagone | identique |
| pentagone | *régulier de 5,6 cm de côté* → *tel que BC = 5,7 cm, CD = 5,6 cm, DE = 5,7 cm…* |
| rosace | la ligne « rosace à six pétales » disparaît |
| cercle circonscrit | *la médiatrice de [AB]* → *la droite précédente* |

La bonne réponse n'est pas d'emporter l'étiquette, c'est de rendre la figure
**lisible** — pour que celui qui ouvre le lien retrouve l'énoncé par le même
chemin que celui qui l'a tracée. Trois corrections, et le lien contient
maintenant *moins* qu'avant :

**Le pentagone perdait son « régulier » parce que la figure n'arrivait pas
entière.** Deux décimales suffisent à une position, pas à un angle : le cinquième
de tour, 1,25664 rad, était transmis 1,26 — 0,19° d'écart, répété quatre fois.
Ce n'est pas une question d'énoncé, c'est la géométrie qui était tronquée. Un
angle et un rapport voyagent désormais à six décimales.

**Les points d'appui du nombre d'or portent le gris des traits de
construction.** `estTraceDeConstruction` reconnaît déjà un trait à son gris et à
ses pointillés ; il reconnaît maintenant aussi un point. La couleur, elle, voyage
depuis toujours : celui qui ouvre le lien voit exactement ce que l'auteur voyait,
et **pour la même raison**.

**La médiatrice se reconnaît au lieu de porter une étiquette** — perpendiculaire
à [AB], passant à moins d'un demi-pixel de son milieu. Au passage, la médiatrice
magique ne se relit plus *« Trace la droite (??) »* mais *« Trace la médiatrice
de [AB] »*.

Et la queue d'un point se rogne jusqu'au bout : trois champs qui valent zéro pour
l'immense majorité des points traînaient dans chaque lien. Le code de partage du
cercle circonscrit est passé de **1 503 à 1 460 octets** — plus court qu'avant,
avec un meilleur énoncé.

Reste la signature d'un motif décoratif — rosace, yin-yang, octogramme, escargot.
Elle **ne voyage pas** : rouverte par lien, la rosace redevient ce qu'elle est
vraiment, un cercle et six arcs. C'est moins joli, et ce n'est pas faux — c'est
déjà la position tenue pour les dessins au compas. La reconnaître par la
géométrie confondrait l'hexagone avec elle : ses six arcs de construction, de
même rayon et centrés sur le cercle, sont exactement le motif d'une rosace.

`tests/probe-lien-enonce.js` vérifie les deux moitiés : sept figures dont l'énoncé
est **identique** après un aller-retour par le lien, et le code de partage lui-même
relu pour s'assurer qu'il ne contient **aucun mot d'énoncé**.

### Un carré et ses diagonales reste un carré

La détection de polygone demandait des sommets de degré 2. Les diagonales les
portent à 3 : la figure la plus banale du collège était décrite trait par trait,
et sa construction aux instruments devenait *« les arcs se croisent en D »* avec
un écartement de **4,2 cm** — la diagonale, ce nombre qu'aucun manuel n'écrit et
dont l'élève ne comprend pas d'où il sort.

On cherche donc aussi le **contour** : l'enveloppe convexe des points restants,
quand tous ses côtés sont tracés. Le carré redevient un carré, ses diagonales
sont dites pour ce qu'elles sont, et l'équerre reprend sa place.

Même correction pour trois points libres : **quand l'angle est droit, on le dit
à l'équerre** au lieu de croiser deux arcs dont l'un mesure la diagonale. Un
triangle quelconque, lui, garde ses deux arcs.

### Un cercle de 3 cm reste un cercle de 3 cm

Un cercle se retient par son centre et un point du bord qui règle le rayon. Ce
second point est libre et caché : en tirant le **centre**, il restait sur place
et le rayon changeait. Mesuré : *« le cercle de centre A et de rayon 3 cm »*
passait à **4,7 cm** après 80 px de déplacement. Ce n'est pas un déplacement,
c'est une déformation. La poignée de rayon suit maintenant le centre — sauf si
elle porte un nom ou sert ailleurs sur la figure, auquel cas elle appartient à la
figure et pas au cercle.

### Le « ? » qui n'existait pas

Quand la barre éclair ne comprenait pas une phrase, elle répondait *« Le « ? »
de la barre donne la liste de ce que je sais faire »* — et il n'y avait **aucun
« ? » dans cette barre**. La réponse envoyait chercher un bouton absent. Il y en
a un, à côté de « Tracer » : il ouvre le panneau des consignes sur la liste des
exemples, tous cliquables.

### Le cadre de sélection

Avec l'outil **curseur**, un glissé depuis le vide trace un **cadre** ; tout ce
qui s'y trouve entier est pris. Un glissé **dans** la sélection la déplace en
bloc. **Maj** ajoute un second cadre au premier ; **Échap**, un clic dans le
vide ou un changement d'outil relâchent.

Avant, ce glissé ne faisait rien du tout : on ne pouvait déplacer qu'un point à
la fois, et bouger une figure entière demandait de tirer chaque sommet en
espérant le même écart.

Deux règles, et elles ne sont pas des détails :

- **Un objet n'entre dans le cadre que s'il y est entier.** Un segment dont une
  seule extrémité serait prise se déplacerait en se déformant : on croirait
  bouger la figure, on la casserait.
- **On ne déplace que les points libres.** Un milieu, un symétrique, un point
  d'intersection sont *calculés* — les tirer n'aurait pas de sens. Ils suivent
  d'eux-mêmes parce que leurs parents ont bougé. Vérifié : après un déplacement,
  chaque milieu est encore **exactement** au milieu de son côté, à 0 pixel près,
  et le carré déplacé a toujours quatre côtés de 3 cm.

Le geste marche aussi **au doigt**, et le zoom ne le fausse pas.

**La figure tremblait en la déplaçant.** Le déplacement suivait la position
**aimantée** du curseur : dès qu'on passait à moins de 12 px d'un point de la
feuille, le curseur sautait dessus — et la figure entière avec lui. Mesuré, en
tirant une sélection le long d'une rangée de points : au lieu de 3 px par image,
**+14 px puis +13 px**, trois fois de suite. L'aimant est fait pour *poser* un
point sur un autre ; ici le curseur n'est qu'une poignée, et ce qu'il faut suivre
c'est la main, pas ce qu'elle frôle. Le déplacement lit maintenant la position
brute : 80 images, 32 passées à portée d'aimant, **3 px à chaque fois**.

### Où sur la feuille, et de quelle couleur

*« Trace un carré en haut à gauche, puis un rectangle en haut à droite, puis un
triangle en bas à gauche, puis un triangle en bas à droite »* : les quatre
figures se posaient **au même endroit**, les unes par-dessus les autres — quatre
centres à moins de treize pixels. Elles vont maintenant chacune dans son coin
(396 px entre les deux plus proches).

*« À droite »* demande de la prudence — en géométrie, une droite est un objet :
seules les tournures de **place** comptent, et *« à droite de A »*, qui situe par
rapport à un objet, n'en est pas une.

**Et la phrase se coupe là où il faut.** *« Trace un carré rouge en haut à
gauche, un rectangle bleu en haut à droite, un cercle en bas à gauche et un
triangle isocèle en bas à droite marron »* — un seul verbe, des virgules — ne se
coupait que devant un **verbe** : les trois premières figures restaient dans un
seul morceau, dont une seule était tracée. **Le rectangle et le cercle
disparaissaient sans un mot**, et les trois places s'annulaient, si bien que le
carré tombait au centre. La virgule sépare maintenant aussi devant un article
suivi d'une figure — mais toujours pas dans « 6,5 cm » ni dans « A, B, C », qui
n'en ont pas.

**La couleur en adjectif** — *« un carré rouge »*, *« un triangle marron »* — est
la façon la plus naturelle de le dire, et c'était la seule qui n'était pas
comprise : il fallait écrire *« en rouge »*.

**Et remplir, c'est remplir.** *« Trace un carré ABCD rempli en vert »* traçait un
carré au **trait** vert en laissant le fond au bleu pâle par défaut : la réponse
disait « en vert », la figure disait autre chose. Le fond est maintenant vert et
**le trait reste noir** — la phrase nomme le fond, pas le contour. *« Hachuré en
rouge »* hachure ; sans mot de remplissage, *« en rouge »* reste la couleur du
trait, comme avant.

**Et la couleur vaut aussi quand on montre la construction.** *« Dessine-moi un
carré rouge à droite et un rectangle bleu en pointillé à gauche »* : le carré
sortait rouge, le rectangle **noir et plein**, pendant que la réponse annonçait
« en bleu, en pointillés ». Chaque bâtisseur peignait ses côtés à sa façon — le
carré reprenait la couleur demandée, le rectangle et le parallélogramme non, et
aucun ne reprenait les pointillés. Plutôt que de reprendre onze bâtisseurs un
par un, le style demandé est **repassé une fois, au même endroit**, sur ce que le
bâtisseur vient de tracer ; les traces de construction, elles, gardent leur gris
et les arcs de compas leur orange. Un pointillé **demandé** appartient d'ailleurs
à la figure : le logiciel ne le confond plus avec un trait de construction.

**Un côté n'existe qu'une fois.** En le mesurant, on a trouvé mieux : aux
instruments, le rectangle sortait avec **huit** côtés, l'hexagone avec **douze**.
Les bâtisseurs traçaient les côtés à la règle, puis reposaient par-dessus une
copie portant le codage — exactement superposée, donc invisible, mais on en
effaçait un et le trait restait. Le carré avait été corrigé il y a longtemps ; le
rectangle, le losange, le parallélogramme, le pentagone et l'hexagone posent
maintenant eux aussi leur codage **sur le côté déjà tracé**.

### Ce qui se dicte, et ce qui s'écrit

Dictée au micro, une consigne ne ressemble pas à une consigne tapée :

> *« Trace un triangle APC tel que P égal 5 cm assez égal 6 cm et PC égal
> 7 cm. Trace aussi les médiatrices. »*

Le logiciel la recevait comme une phrase écrite : il n'y lisait **aucune**
mesure et traçait un triangle quelconque **en répondant « Triangle APC »**, comme
si tout allait bien — 3 / 3,6 / 4,2 cm au lieu de 5 / 6 / 7. Une figure fausse
qu'on croit juste coûte plus cher qu'un refus.

Trois traductions, et rien de plus — on transcrit ce que la dictée écrit toujours
de la même façon, on ne devine pas :

- **« égal », « vaut », « fait »** devant un nombre, c'est le signe `=`. Le
  nombre est le garde-fou : *« des côtés égaux »* et *« il vaut mieux »* ne
  bougent pas.
- **« assez » devant une mesure, c'est `AC`** — deux lettres dictées d'affilée se
  recollent en un mot français. *« un segment assez grand »* n'est pas touché.
- **`A C = 6 cm`** vaut `AC = 6 cm` : deux lettres séparées, devant une mesure
  seulement.

Et **« P égal 5 cm »** : à l'oral, la première lettre du côté se perd dans la
liaison. Un côté a deux extrémités, et si les deux autres sont connus il n'en
reste qu'un — il est déduit, et **dit** : *« « P = 5 cm » a été compris comme
« AP » »*.

**Enfin, il ne dit plus oui à tort.** Une phrase qui donne des mesures dont
aucune n'est lisible est désormais **refusée**, en rappelant comment se nomment
un côté et un angle.

### Ce qu'il comprend en plus

- **La phrase nomme ses points, il les pose.** *« Trace la parallèle à (AB)
  passant par C »* sur une feuille vide répondait *« Je ne connais pas A »* —
  alors qu'il créait déjà C sans rien dire. Il place ce qui manque, **trace aussi
  la droite (AB)** (une parallèle à rien ne veut rien dire) et l'annonce.
- **`Trace deux droites parallèles / perpendiculaires / sécantes`.** La deuxième
  était refusée ; la première traçait deux droites de pentes **différentes**.
  Mesuré : 0° et 90°, avec l'angle droit codé.
- **`Trace un triangle dont les angles mesurent 40°, 60° et 80°`.** Trois angles
  fixent la forme, pas la taille : il en choisit une et applique la loi des
  sinus. Une somme qui ne fait pas 180° est refusée, avec le total.
- **`Trace un losange dont les diagonales mesurent 6 cm et 4 cm`** — le côté se
  déduit, c'est Pythagore et c'est l'exercice.
- **`Trace un cercle de circonférence 12 cm`** — le rayon vaut C ÷ 2π, et le
  calcul est montré.
- **Le papier se choisit à la phrase** : *« efface le quadrillage »*, *« mets le
  papier à points / triangulé / de cahier / à carreaux »*. Le quadrillage n'est
  pas un objet de la figure, c'est le papier — il tombait sur la gomme.

### Donner la mesure, pas seulement la tracer

Un énoncé dit « ABC tel que AB = 5 cm et  = 60° ». On **double-clique sur le
nombre affiché** — la longueur d'un segment, la valeur d'un angle — on tape la
valeur, et le point glisse ou tourne jusqu'à elle ; le reste de la figure suit.
Le champ parle l'unité de la mesure : 40 tapé sous « mm » fait 40 mm. Un point
défini par d'autres (un milieu, une intersection) ne bouge pas — c'est l'autre
extrémité qui obéit, ou rien, et le logiciel le dit. Rien de neuf à l'écran :
on modifie la mesure là où on la lit.

### La construction se rejoue

Chaque figure garde la trace de sa construction. On la rejoue **pas à pas**, les
instruments se déplaçant tout seuls, avec une consigne attachée à chaque étape.
C'est le geste du tableau, qu'un élève peut revoir chez lui autant de fois qu'il
veut — jusqu'au détail : aucune équerre ne couvre une perpendiculaire entière,
alors on la trace jusqu'à l'axe **à l'équerre**, puis on couche la **règle sur le
trait déjà fait** pour le prolonger. Faire basculer l'équerre autour du pied,
comme avant, est un geste qu'on ne peut pas faire juste : rien ne garantit
qu'elle retombe sur la même droite. Le trait déjà tracé, lui, est un guide sûr —
c'est la même raison qui interdit de tracer une parallèle à la règle seule.

Au tableau, on avance **à la main** : *Page suivante* / *Page précédente* — les
touches qu'envoie une **télécommande de présentation** — plus Espace et les
flèches. On passe à l'étape suivante quand on a fini d'expliquer, pas quand le
minuteur le décide. Une figure sans consignes se dévoile alors objet par objet.

Un **curseur orange** dit où en est le rejeu. Les deux poignées de la barre
disent d'**où** à **où** la construction se rejoue ; aucune ne disait où elle
**en est** — on regardait une barre bleue immobile pendant que la figure se
construisait. Il glisse aussi *pendant* les animations d'outil : un trait à la
règle dure cinq fois le pas ordinaire, et compter les étapes entières le figeait
une seconde et demie au moment précis où il se passe quelque chose.

### La figure ouverte se met sous les yeux

Une figure rangée garde les coordonnées du jour où elle a été faite, sur l'écran
de ce jour-là. Mesuré avant correction : sur un téléphone de 390 px, **les seize**
constructions de la bibliothèque tombaient hors de l'écran — on ouvrait un
exemple et l'on voyait une feuille blanche. Elles sont maintenant cadrées et
centrées à l'ouverture, avec le zoom qu'il faut : **0/16 débordent**, sur
téléphone comme sur ordinateur.

### Une séance, pas une figure

Un document tient **plusieurs pages** : on les feuillette, elles sortent en un
**seul PDF** — une feuille par page, chacune au format de sa figure — et elles
voyagent dans **un seul lien**. La pagination ne s'affiche qu'à partir de deux
pages ; cliquer sur son numéro ouvre les **vignettes**, où l'on range les pages
en les tirant. La barre des pages vit en bas à gauche, contre la barre d'outils :
le haut de l'écran est déjà chargé, et c'est en bas qu'on regarde en travaillant.
Chaque vignette est découpée sur la **zone utile** de sa page, pas sur la feuille
entière.

Et l'on peut en **fusionner** plusieurs. Un parallélogramme, un rectangle, un
losange et un carré construits chacun sur sa page se retrouvent sur une
**nouvelle** page, rangés en grille — les pages d'origine restent, la croix les
retire si l'on n'en veut plus — et comme ils s'appelaient tous *ABCD*, les points qui
portaient déjà leur lettre sont **renommés** : ABCD, EFGH, IJKL… Les consignes
des quatre constructions suivent, décalées : la feuille se rejoue en entier.

Ou pas : une case **« Figures seules »** retire ce qui a servi *à faire* la
figure — instruments, arcs de compas, objets masqués — et pose **une étape par
figure**. La page passe de 136 objets à 54, et *Page suivante* découvre les
quatre figures une par une devant la classe. Un cercle entier tracé au compas
est un résultat, pas une trace : le cercle circonscrit reste.

Le « + » crée une page vide ; **« Dupliquer »** en fait une copie, posée juste
après son original — le même triangle de base, trois questions différentes,
sans le retracer trois fois.

Les séances se rangent dans une **bibliothèque** locale, avec vignette, et la
collection entière s'exporte en un fichier pour changer de poste ou la donner à
un collègue. Elle se présente de **trois façons**, au choix, retenu d'une fois
sur l'autre : la **galerie** montre la figure en grand — c'est ainsi qu'on
cherche « celle avec le cercle » plutôt qu'un nom ; les **vignettes** en font
tenir douze à l'écran ; la **liste** en aligne trente, nom entier et nombre de
pages, quand la collection a grossi.

Et les aperçus sont **sur fond blanc**. Ils recopiaient la feuille telle quelle,
quadrillage compris : douze cartes de carreaux gris où il fallait chercher la
figure. Le papier est un réglage de travail — il aide à construire, il
n'appartient pas au dessin ; on le met en blanc le temps de la prise de vue, et
on le remet.

Elle n'est pas vide au premier lancement : seize **constructions d'exemple** y
attendent — médiatrice, bissectrice, triangle équilatéral, carré, losange,
hexagone, cercle circonscrit ; le triangle au rapporteur et celui à deux côtés
et l'angle entre eux ; les quatre transformations, symétrie centrale, symétrie
axiale, translation, rotation et homothétie ; et deux séances de quatre pages. Chacune est la sortie exacte du bâtisseur du logiciel, instruments et
consignes comprises : on l'ouvre, on appuie sur ▶ ou sur *Page suivante*, et la
construction se refait sous les yeux de la classe.

**Les treize fenêtres suivent un même patron.** Le voile, la boîte et la rangée
de boutons étaient déjà communs ; la largeur, la couleur du titre et le
paragraphe d'attaque, non — chacune les choisissait dans son propre attribut
`style=`, soit **cent vingt attributs, neuf par fenêtre**. Deux plafonds
cohabitaient ainsi, 95 % et 96 %, sans qu'aucune raison ne les distingue :
mesuré, ce plafond ne bride jamais la boîte — la fenêtre la borne avant — les
deux écritures disaient donc exactement la même chose.

Ces décisions sont maintenant au même endroit, où une exception se voit au lieu
de se répéter. Vérifié : les treize fenêtres sont **identiques au pixel** avant
et après, largeur par largeur, et aucune ne déborde jusqu'à 320 px de large.

**Une seule consigne, sans ouvrir le panneau.** Le panneau des consignes prend
**46 % d'un écran de téléphone** : c'est la bonne place pour composer un énoncé
de vingt lignes, et beaucoup trop pour en écrire une. Un crayon dans la barre du
haut — à côté de la loupe, donc visible sur un téléphone sans rien déplier —
ouvre **une simple ligne** : la phrase, la case *avec les instruments de
géométrie*, et la réponse affichée dessous. **13 % de l'écran** au lieu de 46,
sur les trois appareils, à la même place. `Ctrl+E`.

La phrase part **quand même** se ranger dans la liste des consignes : elle voyage
donc avec la figure, se relit et se rejoue exactement comme si on l'avait écrite
dans le panneau. Seule la place qu'elle prend à l'écran change. Réussie, la ligne
se vide et reste ouverte — on enchaîne ; ratée, le texte reste, on le corrige là
où on l'a écrit.

**Ce n'est pas la loupe, et le logiciel le dit.** La loupe cherche une *commande*
du logiciel, le crayon écrit une *phrase* de géométrie. Qui tape « trace un
triangle ABC » dans la loupe ne trouve évidemment rien — il lit alors « ça
ressemble à une consigne, pas à une commande », et **Entrée l'emmène au crayon,
son texte déjà dedans**. Un vrai nom de commande, lui, reste à la loupe.

**La première minute.** Le logiciel s'ouvrait sur son tableau de bord et non sur
ce qu'il sait faire : une feuille vide, vingt-deux icônes muettes, et — le plus
intimidant — une télécommande de rejeu, ▶ ◀ ■ ↻ ✂ *vitesse* *attente*, sur une
feuille où il n'y avait rien à rejouer. Le seul texte à l'écran était « ZONE DE
BOUCLE · Début : 0 · Fin : MAX ». Écrire une phrase et voir la figure se
construire aux instruments — ce que ce logiciel fait de mieux — se cachait
derrière une icône sans étiquette.

Les deux ont changé de place. Une feuille vide porte maintenant **la phrase, en
clair et modifiable** : on tape par-dessus, on valide, la figure naît — et la
phrase **part se ranger dans le panneau des consignes, qui s'ouvre**. On a fait
le geste *et* appris où le refaire ; sans cela on aurait vu un tour de magie, pas
une commande. Elle s'efface au premier objet posé, et dès qu'on prend un outil :
elle ne coûte rien à qui sait déjà, et ne mange pas le premier clic de qui veut
tracer à la main. La télécommande, elle, attend qu'il y ait une construction —
la règle déjà appliquée à la barre des pages.

Et le vocabulaire est celui d'un professeur : *De l'étape 0 à la fin*, *rejouer
en boucle*, *attente*. Pas *zone de boucle*, *MAX* et *pause*, qui sont la langue
d'un banc de montage vidéo.

**Sur un téléphone, rien n'est plus derrière un balayage invisible.** Mesuré sur
un écran de 390 px : la barre porte **1220 px d'outils pour 390 visibles**, et
l'en-tête **1028 px de commandes**. Seize outils sur vingt-deux étaient donc hors
de l'écran — segment, droite, cercle, compas, règle, rapporteur compris — et
seize commandes avec eux, dont les consignes. Le tout derrière un défilement
horizontal que **rien** ne signalait : ni dégradé, ni flèche, ni icône coupée. On
ne pouvait pas tracer un segment sans découvrir seul que la barre glissait.

Deux choses le règlent. Les **six places visibles servent maintenant à dessiner**
— le groupe des transformations est passé après celui des lignes, et *Segment* et
*Droite* sont entrés dans les premiers. Et un bouton **collé au bord**, que la
bande ne peut pas emporter, ouvre **la grille complète, chaque outil nommé** : un
appui pour atteindre n'importe lequel, au lieu de trois balayages à l'aveugle. La
grille ne duplique rien — elle se remplit depuis la barre elle-même, à
l'ouverture.

Ce bouton n'apparaît pas à une taille d'écran donnée mais **là où la bande cache
réellement quelque chose**, mesuré au chargement et à chaque rotation. Un palier
aurait deviné : l'en-tête déborde encore de 198 px sur un téléphone couché et de
110 px sur une **tablette** — où la barre d'outils, elle, tient tout entière.

### La fiche qu'on colle dans le cahier

Une figure qui porte des consignes d'étape sort en **fiche de construction** :
une feuille A4 avec la figure terminée en haut — on sait où l'on va — puis les
étapes numérotées, chacune avec son texte et **l'image de la figure à cette
étape-là**, instruments compris. La feuille se tourne toute seule quand il y a
beaucoup d'étapes.

Elle se compose. À gauche, les étapes : on **décoche** celles dont on ne veut
pas, on **tire une ligne** pour en changer l'ordre *sur la feuille* — jamais
dans la construction, qui se casserait — et l'on **réécrit la consigne**, qui
est celle de l'étape : ce qu'on améliore ici, la classe l'entendra au rejeu.
Quatre dispositions — liste, tableau en 1 à 3 colonnes, figures seules, ou
**texte seul** (le programme de construction sans dessin, pour faire chercher)
— avec numéros, figure terminée, instruments, quadrillage et paysage en
options.

À droite, l'aperçu. Ce n'est pas une imitation de la feuille : c'est **le PDF
lui-même**, fabriqué puis relu par le lecteur de PDF déjà embarqué dans le
fichier. Il ne peut donc pas mentir sur ce qui sortira.

### La palette se replie

Sur ses 23 commandes, **trois servent à chaque trait** : la couleur, le trait,
l'épaisseur. Elles occupaient un panneau de 212 px ouvert en permanence sur le
bord de la feuille. Repliée — et elle l'est au départ — la palette n'en montre
plus que **50** : ces trois-là, le **mode peinture**, et le chevron qui rouvre
tout.

On ne vise pas, on tape : un clic sur la couleur passe à la suivante, un clic
sur le trait fait plein ↔ pointillés, un clic sur l'épaisseur parcourt 1, 2, 3,
4, 6, 8. Un **appui maintenu** sur la couleur ouvre la rangée complète à côté,
pour choisir plutôt que faire défiler — et le cycle est lu dans la palette, donc
une couleur ajoutée à la rangée y entre d'elle-même.

Dépliée, c'est **exactement la palette d'avant** : rien n'en a été retiré. Le
choix se retient d'une fois sur l'autre.

Repliée, elle garde sa **poignée** — pour l'écarter de la figure — mais pas sa
croix : à 50 px de large, les deux se superposaient. La refermer reste à un
doigt, par le bouton palette de la barre du haut.

### Vu du fond de la salle

Le **mode projection** épaissit traits et lettres d'un clic. Uniquement à
l'affichage : ni les objets, ni le lien, ni le PDF n'en gardent trace.

### Le partage tient dans un lien

La figure entière est encodée dans l'URL — une construction de 300 objets pèse
2,4 Ko. On envoie le lien, on affiche le QR code, et c'est tout : rien n'est
stocké nulle part, rien n'expire, aucun compte n'est demandé. Sans connexion,
c'est le **code** de la figure qu'on envoie — la même chose, sans l'adresse du
programme (voir *Hors connexion*).

`?mode=lecture` ouvre le **lien élève** : la figure et son rejeu, sans les outils
de modification.

Avant de l'envoyer, on le regarde. L'aperçu montre **la vraie page** — pas une
imitation — dans un cadre aux **dimensions réelles de l'appareil** : téléphone
390 × 844, tablette 820 × 1180, ordinateur 1280 × 800, et le bouton *Pivoter*.
Le document du cadre mesure vraiment 390 px de large : les règles d'affichage du
logiciel s'y appliquent exactement comme sur l'appareil, et ce qu'on voit est ce
que l'élève verra. Il est réduit pour tenir dans la fenêtre — la réduction ne
change pas cette largeur — et le rapport est écrit à côté : « 820 × 1180 px ·
affiché à 63 % ». Le lien est affiché en toutes lettres.

Le cadrage envoyé est celui de votre écran, et sur un téléphone la figure arrive
souvent minuscule — c'est précisément ce que l'aperçu sert à voir. **⤢ Cadrer**
en propose alors un qui la fait tenir en grand sur l'appareil choisi : mesuré,
une figure de 88 px de large sur les 390 d'un téléphone passe à 290, centrée.

Mais **le professeur a le dernier mot** : ce cadrage n'est qu'une proposition.
Il ne part dans le lien que si l'on appuie sur *Définir vue* — et l'on peut
encore le déplacer à la main avant de trancher. La machine ajuste, l'humain
décide.

### Dessiner à main levée, obtenir une vraie figure

On trace un carré du doigt : le logiciel le reconnaît et construit un vrai carré,
avec ses points nommés et ses codages — ou, si on le demande, la **construction
détaillée à la règle et au compas**, rejouable. Sont reconnus : cercle (avec son
centre), segment, demi-droite, droite, triangle, triangle équilatéral, triangle
rectangle, carré, rectangle, losange, parallélogramme, pentagone et hexagone
réguliers.

### Écrire et annoter

Textes enrichis (gras, italique, souligné **par passage**, encadrés) avec un
compositeur de **formules** — fractions, puissances, racines, vecteurs, angles.
Et un stylo d'annotation dont l'encre **s'accroche à la figure** : une marque
posée sur un angle le suit quand on le déplace ou qu'on le tourne.

### Le vecteur

Le segment porte une **option** : *appui long* sur son bouton (clic droit à la
souris) et la case **Vecteur** ajoute une pointe au bout du trait. Un vecteur
n'est pas un outil de plus — c'est un segment qui pointe —, et l'appui long sur
un bouton d'outil veut déjà dire « options de cet outil » pour le croquis et le
stylo : lui faire dire « un autre outil » aurait donné deux sens au même geste.

Le mode **se voit** : une pointe bleue marque le bouton, l'infobulle change, et
la loupe (`Ctrl+K`) trouve « Vecteur » — un réglage retenu d'une séance à l'autre
sans marque visible, c'est tracer des flèches sans l'avoir voulu.

### Importer, exporter

Import d'une image ou d'un **PDF** en fond, page par page, recadrable. Export en
**PDF vectoriel** (police embarquée, texte au même endroit qu'à l'écran), en
**SVG** (police embarquée en option) et en image.

**Et en TikZ**, pour un document LaTeX. Une image insérée dans un `.tex` reste
une image : on ne peut plus ni la mettre à l'échelle du texte, ni corriger un nom
de point. Le fichier produit est du vrai dessin TikZ, et il est écrit pour être
**relu et modifié** :

- les points deviennent des `\coordinate` **nommées** — on lit `\draw (A) -- (B)`,
  pas une paire de nombres, et déplacer A corrige toute la figure d'un seul
  endroit ;
- l'unité est le **centimètre réel** et l'origine le coin de la figure : les
  nombres sont petits, positifs, et disent la vraie longueur — `AB = 5 cm` dans
  l'énoncé fait 5 dans le fichier ;
- l'angle droit sort en **carré** (la convention du cahier, que TikZ ne connaît
  pas seul), les angles mesurés portent leur valeur, un vecteur devient `->` ;
- rien qu'un `\usepackage{tikz}` : aucune coordonnée n'est écrite dans une
  syntaxe qui exigerait une bibliothèque de plus.

Les instruments ne sortent pas — ce sont des objets d'écran — et ce qui n'est pas
rendu est écrit en commentaire dans le fichier plutôt que passé sous silence.

### Trouver une commande

248 commandes, dont trois sur quatre rangées dans un panneau qu'il faut d'abord
ouvrir. Le menu *fichier* écrit désormais le nom de chacune sous son icône, et
les range sous trois intitulés — **le document**, **sortir un fichier**,
**transmettre** : deux `</>` identiques y désignaient deux commandes
différentes, et il n'y avait qu'à deviner. La **loupe** de la barre du haut — ou `Ctrl+K` — ouvre une recherche :
on tape ce qu'on veut faire (« médiatrice », « exporter pdf », « compas »), on
choisit, c'est lancé. Chaque résultat dit **où** la commande se trouve, pour
qu'on finisse par le savoir.

L'index n'est écrit nulle part : il est récolté dans la page à chaque ouverture.
Une commande ajoutée à l'interface est donc trouvable le jour même, et une
commande retirée disparaît d'elle-même.

### Et aussi

Cinq quadrillages, symétries axiale et centrale, médiatrices, bissectrices,
cercles circonscrits, constructions remarquables (rosace, étoile à six branches,
graine de vie, yin-yang, Pythagoras), codage automatique des longueurs égales et
des angles droits, mesures affichées, mode enregistrement d'écran.

### Soutenir le projet

Le cœur de la barre du haut ouvre la fenêtre de don, à tout moment. Elle se
propose aussi d'elle-même, mais avec trois garde-fous mesurés par
`tests/probe-don.js` :

- **jamais avant dix ouvertures** — le logiciel demande après avoir servi, pas
  avant ;
- **jamais au démarrage** : seulement à un *moment de valeur*, quand un geste
  vient d'aboutir — un export parti, un lien d'élève copié, une séance rangée
  dans la bibliothèque ;
- **jamais deux fois dans la même séance**, ni par-dessus une autre fenêtre ;
- **jamais devant une classe** : en mode projection ou en plein écran, la
  question ne se pose pas — la séance est comptée, mais on ne demande rien.

**Le chiffre est vrai, et c'est le sien.** Une somme suggérée serait un choix
d'auteur, une jauge de collecte serait invérifiable. La fenêtre affiche donc le
seul chiffre honnête dont le logiciel dispose : *« Sur cette machine, vous avez
ouvert GéoMaster 48 fois et il vous garde 3 séances. »* Vérifiable sur place,
rien n'en sort — et sous cinq ouvertures il se tait, parce qu'il ne dirait rien.

« Plus tard » repousse la question de vingt ouvertures ; dit deux fois, c'est un
non, et on ne redemande plus jamais.

**Deux boutons, pas trois.** Il y avait un « J'ai déjà donné » : il a été retiré,
trois boutons pour une demande, c'était un de trop. « Plus tard » suffit à
sortir. Partir vers PayPal, en revanche, ferme la demande **pour de bon** : on ne
redemande pas à quelqu'un qu'on vient d'envoyer payer, et le logiciel n'a de
toute façon aucun moyen de savoir s'il l'a fait — pas de serveur, pas de compte,
et PayPal ne lui dit rien. Croire sur parole est la seule réponse honnête
possible.

Pour qui ne peut pas donner, la fenêtre propose l'autre don : **en parler à un
collègue**, avec un bouton qui copie l'adresse.

Trois nombres dans le navigateur, et rien qui sorte de la machine :
`gm_ouvertures`, `gm_don_etat` (`''`, `fait` ou `refuse`), `gm_don_prochain`.
L'interface élève, elle, ne compte rien et ne demande rien.

> **À remplir.** Le paragraphe `#donAuteur` de la fenêtre est un texte
> d'attente : un professeur ne donne pas à un projet, il donne à quelqu'un. Une
> phrase à la première personne — qui vous êtes, pourquoi vous l'avez écrit —
> vaut plus que toute la mise en page, et elle doit être vraie. Un **montant
> suggéré** (« le prix d'un café », trois boutons 3 / 5 / 10 €) fait donner
> davantage, mais c'est votre prix : il est laissé en commentaire dans le
> fichier, à décider.

---

## Sur tablette et téléphone

Pensé pour le doigt autant que pour la souris : cibles dimensionnées, loupe de
précision au toucher, gestes à deux doigts, panneaux qui se replient. Le nom
d'une icône se lit au survol ; écrit sous chacune d'elles, il faisait du menu
fichier un panneau plus haut que large. Ce menu tient aujourd'hui en
**162 × 310 pixels**, quelle que soit la largeur de l'écran, avec quinze cibles
de 48 × 40.

---

### Le document sous la figure

Une photo de manuel ou un PDF se cale sous la figure, et une barre s'ouvre sous
lui : **Cadre** (déplacer, tourner), **Page** (faire coulisser et zoomer le
document dans son cadre), **Rogner**, l'opacité, la grille, le cadenas.

**Rogner est un MODE**, comme dans tout logiciel d'image : le bouton l'allume,
les coins deviennent des **équerres oranges** et les bords des poignées de
volet — tirez, ça coupe. Éteint, seuls les quatre coins se montrent, et ils
redimensionnent. Les bords rognaient et les coins redimensionnaient sans que
rien ne le dise, deux carrés pour deux gestes : on croyait le rognage disparu.

### Les choses cachées

<details>
<summary><i>Ne dépliez ceci que si vous préférez ne pas les trouver vous-même.</i></summary>

Deux règles les gouvernent, et la première n'est pas négociable : **un secret ne
touche pas à la figure.** On tombe dessus par accident, souvent en pleine
préparation de cours — il n'a le droit ni d'ajouter un objet, ni d'effacer, ni de
rien changer qu'on aurait à défaire. Et il se referme d'un clic ou d'une touche.

- **Le code Konami** — ↑ ↑ ↓ ↓ ← → ← → B A, au clavier, n'importe où.
- **Sept clics sur la date de version**, en petit dans l'aide : le *cabinet de
  curiosités*, qui donne le nom des deux figures ne figurant dans aucun menu —
  le **flocon de Koch** (`d'ordre 1` à `4`) et la **spirale de Théodore**
  (`avec 20 triangles`), dont les rayons valent 1, √2, √3, √4…

C'est là, et nulle part ailleurs dans le logiciel, qu'on apprend leur nom.

</details>

### Quelle version ai-je sous les yeux ?

L'aide (`?`) porte la **date de la version** en petit à côté de son titre, et
`window.GM_VERSION` la donne à la console. GéoMaster étant un seul fichier HTML,
les navigateurs le gardent longtemps en cache et la page publiée met un moment à
se reconstruire : sans ce repère, on ne peut pas dire si l'on regarde la
correction ou l'ancienne version. `Ctrl+Maj+R` force le rechargement.

## Un seul fichier

Tout est dans `index.html` : le code, les styles, l'aide, la police et les
bibliothèques. **3,6 Mo, soit 907 Ko une fois compressé** — ce que télécharge
réellement le navigateur.

Plus de la moitié de ce poids (1,8 Mo) est en `type="text/plain"` : présent dans
le fichier mais **jamais analysé au démarrage**. Ces morceaux ne sont injectés
qu'au premier export PDF ou au premier import de PDF. Le navigateur n'analyse
donc que 1,5 Mo à l'ouverture.

Conséquence pratique : le fichier fonctionne **hors connexion**, se copie sur une
clé USB, s'héberge n'importe où, et ne peut pas cesser de marcher parce qu'un
service tiers a fermé.

### Hors connexion

**[`index_offline.html`](index_offline.html)** est le fichier à emporter : la
copie exacte d'`index.html`, sous un nom qui dit à quoi elle sert. On l'enregistre
sur une clé, on double-clique, et tout marche — dessin, reconnaissance, import
de PDF, exports PDF et SVG, QR code. Rien n'est demandé au réseau : une sonde
coupe *toute* requête sortante et refait la chaîne complète à chaque poussée.

Reste le partage. Ouvert depuis un fichier, le lien vaut `file:///…` : il désigne
un emplacement de **cet ordinateur**, et ne dit rien à personne d'autre — le
logiciel le signale plutôt que de laisser croire à un partage. D'où le **code de
la figure** : le même contenu, sans l'adresse du programme. On le copie, on
l'envoie par n'importe quel canal, et le destinataire le colle dans **son**
GéoMaster — le site, sa copie sur clé, celle de la salle. Personne n'a besoin
d'être en ligne, ni des deux côtés ni d'un seul. La boîte « Coller un code »
accepte aussi un lien entier : elle n'y prend que la figure.

### Ce qui est embarqué

Rien n'est téléchargé à l'exécution, mais ces bibliothèques sont bien dans le
fichier, sous licence MIT, avec leurs notices d'origine :

| | Rôle | Poids |
|---|---|---|
| [pdf.js](https://mozilla.github.io/pdf.js/) 3.11 (+ son *worker*) | lire un PDF importé | 1,4 Mo |
| [jsPDF](https://github.com/parallax/jsPDF) | écrire le PDF exporté | 356 Ko |
| [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) | convertir la figure en PDF vectoriel | 85 Ko |
| [lz-string](https://github.com/pieroxy/lz-string) | comprimer la figure dans l'URL | 6 Ko |
| bibliothèque QR | afficher le lien en QR code | 55 Ko |
| police GeoSans (2 graisses) | même rendu à l'écran et dans le PDF | 181 Ko |

La police est sous licence SIL Open Font.

---

## Les tests

`tests/` contient 125 sondes qui **ouvrent GéoMaster dans un vrai navigateur** et
se comportent comme un utilisateur : elles dessinent, cliquent, exportent, puis
vérifient le résultat. Elles tournent à chaque poussée sur `main`
(`.github/workflows/tests.yml`), en cinq minutes.

```bash
npm install --no-save playwright && npx playwright install chromium
node tests/lancer.js
```

Voir [`tests/README.md`](tests/README.md).

## Ce que le logiciel comprend

[`CONSIGNES.md`](CONSIGNES.md) liste **218 phrases** avec, en face de chacune, la
réponse du logiciel. Le fichier n'est pas écrit à la main : `node
tests/catalogue.js` exécute réellement chaque phrase dans un navigateur et
recopie ce qui sort. Une liste tenue à la main ment au bout de trois semaines ;
celle-là ne peut pas promettre ce qui ne marche pas.

[`IDEES.md`](IDEES.md) est l'autre moitié : ce qui manque encore, établi en
essayant d'abord trente-cinq phrases de collège, puis un corpus de 214. Il commence par les phrases qui
répondent « oui » en traçant autre chose — les plus urgentes, parce que rien à
l'écran ne prévient.

---

## Technique

HTML5 Canvas, JavaScript ES6 sans cadriciel, CSS3. Aucune dépendance à charger :
tout est dans le fichier.

## Licence

Creative Commons **BY-NC-SA 4.0** — voir [`LICENSE`](LICENSE). Utilisation
pédagogique libre, y compris modifiée, à condition de citer la source, de ne pas
en faire commerce et de partager aux mêmes conditions.
