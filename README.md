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

**Trois onglets** dans la fenêtre de l'énoncé, parce que ce sont trois textes
différents : **Mon énoncé** (celui qu'on écrit, auquel rien ne touche),
**La figure**, **Aux instruments**.

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

**« J'ai déjà donné » est cru sur parole.** Le logiciel ne *peut pas* savoir qui
a donné : pas de serveur, pas de compte, et PayPal ne lui dit rien. Demander une
preuve serait mentir sur ce qu'il sait faire. Le bouton ferme donc la fenêtre
pour de bon, sans rien vérifier — et la fenêtre le dit en toutes lettres. Partir
vers PayPal vaut la même chose : on ne redemande pas à quelqu'un qu'on vient
d'envoyer payer.

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

`tests/` contient 88 sondes qui **ouvrent GéoMaster dans un vrai navigateur** et
se comportent comme un utilisateur : elles dessinent, cliquent, exportent, puis
vérifient le résultat. Elles tournent à chaque poussée sur `main`
(`.github/workflows/tests.yml`), en cinq minutes.

```bash
npm install --no-save playwright && npx playwright install chromium
node tests/lancer.js
```

Voir [`tests/README.md`](tests/README.md).

## Ce que le logiciel comprend

[`CONSIGNES.md`](CONSIGNES.md) liste **181 phrases** avec, en face de chacune, la
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
