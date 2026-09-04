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

**Au téléphone, l'écran se partage en deux** : les consignes en bas, la figure
au-dessus — et la feuille est vraiment raccourcie, pas seulement recouverte. Une
fenêtre flottante de 340 px sur un écran de 390, c'était écrire une consigne
sans voir ce qu'elle construit. Sur grand écran, elle flotte comme avant.

Le texte libre de l'énoncé — gras, italique, listes — est toujours là, replié
sous la liste. Et **« Tout effacer » efface aussi l'énoncé** : des consignes
cochées « faites » devant une feuille vide, ce serait un compte-rendu faux.

Chaque consigne comprise devient la **consigne de l'étape**. Un programme de
construction tapé ici donne d'un coup la figure, le rejeu narré avec vos mots,
et la fiche — dont la disposition « texte seul » est ce programme même.

Ce qu'il comprend, avec la notation française (`[AB]`, `[AB)`, `(AB)`, `A'`) :

| | |
|---|---|
| **Placer** | `Place 3 points A, B, C non alignés` · `Trace 3 points A, B, C` · `alignés` · `Place le milieu I de [AB]` · `Soit I…` |
| **Traits** | `Trace [AB]` · `[AB)` · `(AB)` · `le segment [AB] de 5 cm` · `un segment vertical [OQ] de 6 cm` · `horizontal` · `[AB], [BC] et [CA]` · `une droite` · `Relie A à B` |
| **Cercles** | `de centre A passant par B` · `de rayon 3 cm` · `de rayon [AC]` · `de diamètre [AB]` · `circonscrit au triangle ABC` |
| **Figures** | `carré ABCD de 3 cm de côté` · `rectangle de 5 cm sur 3 cm` · `losange` · `parallélogramme` · `pentagone` · `hexagone` · `octogone` · `polygone régulier à 7 côtés` · `polygone ABCDE` · `les diagonales de ABCD` |
| **Triangles** | `tel que AB = 5 cm, AC = 4 cm et BC = 3 cm` (trois longueurs) · `AB = 5 cm, AC = 4 cm et l'angle BAC = 60°` (deux longueurs et l'angle entre elles) · `AB = 6 cm, l'angle BAC = 40° et l'angle ABC = 60°` (une longueur et deux angles) · l'angle s'écrit aussi sans le mot : `ABC = 40°` · `équilatéral` · `isocèle en A` · `rectangle en A` · `rectangle isocèle en B` dans les deux ordres |
| **Droites remarquables** | `médiatrice de [AB]` · `perpendiculaire à (AB) passant par C` · `parallèle à…` · `bissectrice de l'angle ABC` |
| **Dans un triangle** | `les médiatrices du triangle ABC` · `les bissectrices` · `les hauteurs` · `les médianes` — les trois d'un coup, ou `la hauteur issue de A` · `les milieux des côtés` |
| **Deux d'un coup** | `Trace un triangle ABC et ses médiatrices` · `et ses diagonales` · `et son cercle circonscrit` |
| **Points remarquables** | `le centre de gravité G` · `l'orthocentre H` · `le centre du cercle circonscrit O` · `le cercle inscrit` · `le point I intersection de (AB) et (CD)` · `un point M sur [AB]` (ou sur une droite, ou sur un cercle) |
| **Symétries** | `A', B', C' symétriques de A, B, C par rapport à O` · `par rapport à (EF)` · `l'image de A par la symétrie de centre O` |
| **Mesures** | `AB = 5 cm` · `Marque l'angle ABC` · `L'angle ABC mesure 60°` · `Affiche la longueur de [AB]` · `Code les longueurs égales` |
| **Croisements nommés** | `Appelle O le point d'intersection des médiatrices` · `des hauteurs` (l'orthocentre) · `des médianes` · `des bissectrices` |
| **Couleur et style** | `Trace [AB] en bleu` · `en rouge et en pointillés` · `en gras` · `épaisseur 4` — pour cette ligne seulement |
| **Objets nommés** | `Trace le cercle C1 de centre O et de rayon 6 cm` · puis `le cercle C1` · `ce segment` · `il`, `elle` |
| **Croisements** | `il coupe le cercle C1 en deux points A et B` · `en deux points dont un est appelé C` · `elle coupe le cercle C3 en E` · `en S tel que S n'appartienne pas à [OQ]` |
| **Sur un objet** | `place le point G sur ce segment tel que GQ = 5 cm` · `un point M sur [AB]` |
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

**Le codage du milieu et celui du segment sont deux choses**, et rien n'oblige à
choisir : sur `[AB]` muni de son milieu `I`, le premier dit *AI = IB*, le second
dit *`[AB]` est égal à tel autre trait*. Sélectionnez le milieu, la rangée de
marques s'ouvre pour lui comme elle s'ouvre pour un segment — elle ne s'ouvrait
jusqu'ici que pour les segments, et la marque d'un milieu restait celle que le
logiciel avait posée seul. Quand les deux coexistent, la marque du segment
s'écarte du centre : elle s'y posait exactement sous le point milieu, où on ne la
voyait pas. La position d'une marque le long d'un trait ne dit rien ; seul son
symbole parle.

Et le codage automatique qui suit une consigne **ne regarde que ce que cette
consigne vient de construire** : appliqué à toute la feuille, « même longueur ⇒
même marque » affirmait l'égalité de deux traits sans aucun rapport. Le bouton
**Codage auto**, lui, garde toute la feuille pour champ — là, c'est vous qui le
demandez.

Une case décide de ce que « Trace un carré » veut dire : **la figure seule**, ou
la **construction à la règle et au compas** — arcs, instruments, étapes — bâtie
d'un coup et rejouable ensuite avec ▶.

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
alors elle **se déplace** pour prolonger le trait de l'autre côté de l'axe.

Au tableau, on avance **à la main** : *Page suivante* / *Page précédente* — les
touches qu'envoie une **télécommande de présentation** — plus Espace et les
flèches. On passe à l'étape suivante quand on a fini d'expliquer, pas quand le
minuteur le décide. Une figure sans consignes se dévoile alors objet par objet.

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
un collègue.

Elle n'est pas vide au premier lancement : neuf **constructions d'exemple** y
attendent — médiatrice, bissectrice, triangle équilatéral, carré, losange,
hexagone, symétrique d'un point, cercle circonscrit, et une séance de quatre
pages. Chacune est la sortie exacte du bâtisseur du logiciel, instruments et
consignes comprises : on l'ouvre, on appuie sur ▶ ou sur *Page suivante*, et la
construction se refait sous les yeux de la classe.

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

### Importer, exporter

Import d'une image ou d'un **PDF** en fond, page par page, recadrable. Export en
**PDF vectoriel** (police embarquée, texte au même endroit qu'à l'écran), en
**SVG** (police embarquée en option) et en image.

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

---

## Sur tablette et téléphone

Pensé pour le doigt autant que pour la souris : cibles dimensionnées, loupe de
précision au toucher, gestes à deux doigts, panneaux qui se replient. Le nom
d'une icône se lit au survol ; écrit sous chacune d'elles, il faisait du menu
fichier un panneau plus haut que large. Ce menu tient aujourd'hui en
**162 × 310 pixels**, quelle que soit la largeur de l'écran, avec quinze cibles
de 48 × 40.

---

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

`tests/` contient 67 sondes qui **ouvrent GéoMaster dans un vrai navigateur** et
se comportent comme un utilisateur : elles dessinent, cliquent, exportent, puis
vérifient le résultat. Elles tournent à chaque poussée sur `main`
(`.github/workflows/tests.yml`), en deux minutes.

```bash
npm install --no-save playwright && npx playwright install chromium
node tests/lancer.js
```

Voir [`tests/README.md`](tests/README.md).

---

## Technique

HTML5 Canvas, JavaScript ES6 sans cadriciel, CSS3. Aucune dépendance à charger :
tout est dans le fichier.

## Licence

Creative Commons **BY-NC-SA 4.0** — voir [`LICENSE`](LICENSE). Utilisation
pédagogique libre, y compris modifiée, à condition de citer la source, de ne pas
en faire commerce et de partager aux mêmes conditions.
