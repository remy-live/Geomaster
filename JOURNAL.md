# Le journal de bord

Quatre-vingts entrées, et presque autant de plaintes réelles. Chacune part
d'une phrase dite par quelqu'un qui se servait du logiciel — *« Il n'arrive pas
à faire de centre H »*, *« Quand on écrit plusieurs lignes, la barre cache les
lignes en dessous »* — puis suit la cause jusqu'au bout et dit ce qui a été
corrigé, avec les mesures.

**Ce n'est pas la documentation de GéoMaster** ; elle est dans le
[README](README.md). C'est le raisonnement derrière le code : pourquoi tel
refus est écrit comme il l'est, pourquoi telle commande n'existe pas, pourquoi
tel réglage a disparu. Un dépôt oublie vite les mauvaises idées qu'il a déjà
essayées ; celui-ci les garde.

Un fil traverse presque toutes ces pages, et c'est le défaut le plus coûteux
d'un logiciel de construction : **faire quelque chose de plausible sans dire
qu'on a ignoré la demande.** Le centre qu'on ne trace pas, la longueur qu'on
invente, les points qu'on renomme en silence, la statistique qui dit
« utilisateurs » en comptant des navigateurs — à chaque fois la réponse était
« ✓ », et à chaque fois elle était fausse.

Les défauts des **sondes** y figurent au même titre que ceux du logiciel. Ils
n'ont jamais atteint personne, mais ils portent la leçon centrale du projet :
une sonde qui ne peut pas échouer ne prouve rien. Plusieurs ont passé des
semaines à mesurer le vide en affichant un ✓.

---

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

### « 323 utilisateurs » n'était pas 323 personnes

*« 323 utilisateur(s), dont 284 actif(s) ces 30 derniers jours — ça veut dire que
des utilisateurs différents ? »*

Non. Et le relevé l'affirmait pourtant, en toutes lettres, exactement comme ce
fichier : **« le nombre de clés est le nombre d'utilisateurs »**. C'était faux
**dans les deux sens à la fois**.

| | |
| --- | --- |
| une personne, **plusieurs** clés | poste de classe + ordinateur de maison + téléphone = 3 ; Chrome et Firefox sur la même machine = 2 ; vider les données du site en fabrique une neuve ; le navigateur peut l'effacer tout seul |
| **plusieurs** personnes, une clé | un tableau de salle partagé par six professeurs = 1 ; un ordinateur de classe = 1 ; et quand le navigateur refuse le stockage, **toutes** les installations se rangent sous la même clé `anonyme` |

L'identité tient dans un `localStorage`, cloisonné par navigateur, par profil et
par adresse — et **rien ne recoupe deux clés**. C'est voulu : le relevé ne
transporte ni adresse IP, ni empreinte, ni compte. La discrétion est tenue ; la
précision du chiffre en est le prix, et c'est un échange qu'il faut dire.

**Mesuré plutôt que supposé**, dans un vrai navigateur :

| ce qu'on fait | ce que compte le relevé |
| --- | --- |
| deux onglets, deux fenêtres | **1** installation |
| deux profils de navigateur | **2** |
| vider les données du site | **+1**, la même personne compte deux fois |
| stockage refusé (navigation privée stricte) | identifiant `anonyme` — **toutes** fondues en une |
| le lien de partage, côté élève | **0** — ni installation, ni chargement, ni consigne |
| un fichier ouvert en local (clé USB) | **0** — l'identifiant n'est même pas créé |
| fermer avant **8 secondes** | **0** — le relevé part après ce délai |

**Et le total ne peut que monter** : aucune clé n'expire ni n'est supprimée. Les
323 sont un cumul depuis la mise en service — le 9 septembre 2026, soit 33 jours
—, pas une population. C'est aussi ce qui explique le ratio : **284 sur 323,
c'est 88 %**, et il ne mesure pas la fidélité. Presque toute l'histoire du
compteur tient dans la fenêtre de 30 jours ; pour en sortir, il aurait fallu
s'arrêter dans les trois premiers jours.

**« Ces 30 derniers jours » en comptait 31.** La borne est obtenue en retranchant
30 jours puis en tronquant au jour, et la comparaison est un `>=` : J-30 était
inclus, ce qui fait 31 dates distinctes. On retranche maintenant 29 — aujourd'hui
plus les 29 jours précédents —, et `probe-usages-serveur.js` pose un relevé par
jour de J-0 à J-31 puis exige d'en voir **exactement 30** tomber dans la fenêtre.

**Le relevé dit maintenant ce qu'il compte**, et ce qu'il ne compte pas :

```
323 installation(s) — un navigateur sur un appareil, pas une personne
dont 284 ayant servi ces 30 derniers jours
911 chargement(s) de page
…
CE QUE CES CHIFFRES NE COMPTENT PAS
  · l'usage hors connexion : clé USB, fichier local, salle sans réseau
  · les élèves qui ouvrent le lien de partage — zéro, par construction
  · le logiciel affiché dans un cadre (ENT, Moodle, aperçu)
  · une visite de moins de huit secondes
  · ce qu'une installation fait le jour où elle sert pour la dernière
    fois : le relevé part au début de la journée, pas à la fin
ET UNE INSTALLATION NE DISPARAÎT JAMAIS : le total ne peut que monter.
```

La note est écrite **dans le relevé** plutôt que dans un fichier d'à côté, parce
que c'est là qu'on le lit. Une mise en garde qu'il faut aller chercher ne sert à
rien.

**Et le serveur n'avait jamais été exécuté par personne.** `probe-usages.js`
tenait le côté logiciel — ce qui se compte sur la machine, et surtout ce qui n'en
part pas. Les quarante lignes du Worker, elles, n'étaient couvertes par aucune
sonde : la phrase que lit le professeur était la seule du projet que rien ne
vérifiait. `probe-usages-serveur.js` le charge maintenant pour de vrai, dans un
bac à sable, avec un faux espace clé-valeur, et exerce ses deux routes. Elle
**échoue 12 fois** sur la version d'avant.

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

### Le lien garde la vue dans laquelle on travaille

*« Quand on fait créer un lien partageable, il faudrait pouvoir garder la vue
dans laquelle on travaille. »*

Le cadrage était déjà dans le lien : le code de la figure porte un bloc
`¦VIEW:zoom;x;y;largeur;hauteur`, et la relecture le rangeait bien de côté. Mais
la fonction qui l'applique n'était appelée que dans la branche du **mode
lecture** — le cadrage faisait tout le voyage, écrit, compressé, transporté,
décompressé, relu, pour être **jeté à l'arrivée**.

Mesuré sur une vue de travail à zoom 2,3 centrée sur le point (516, 361) de la
feuille :

| lien | zoom | centre du monde | feuille visible |
| --- | --- | --- | --- |
| élève (`?mode=lecture&fig=`) | 2,49 | (516, 361) | 562 px |
| ordinaire (`?fig=`) | 1 | **(646, 450)** | **1292 px** |

**Ce qui est gardé, c'est la portion de feuille, pas le zoom.** Le zoom est remis
à l'échelle de la fenêtre qui ouvre : 2,3 devient 2,49 quand la barre d'outils
disparaît et que le canevas s'élargit, et 1,25 sur un écran deux fois plus
étroit. Le nombre change *pour que* le cadrage ne change pas — dans les trois
cas, 562 px de feuille et le même point au centre de l'écran.

Les liens déjà distribués qui ne portent pas de bloc `VIEW` s'ouvrent comme
avant, au cadrage par défaut.

### La consigne aussi trouve son point d'arrivée au bout du trait

*« Quand un segment est dessiné sans outils à partir de deux points, les deux
points apparaissent puis le segment. On a fait un comportement inverse en tracé,
je crois. »*

Exactement — et la moitié de la phrase importe autant que l'autre, car il y a
**deux situations et une seule était fausse**.

La règle avait été posée pour le geste à la main : on pose A, on couche la
règle, on trace, et B est ce qu'on **trouve** à la graduation. Le chemin des
consignes ne l'avait jamais suivie :

| | ordre des objets |
| --- | --- |
| outil segment, à la main | Point(A) · Segment · **Point(B)** |
| « Trace le segment [AB] » | Point(A) · **Point(B)** · Segment |

Pire : aux instruments, la même phrase ne sortait **aucune animation**. « Avec
les instruments de géométrie » était coché, et rien ne distinguait la
construction de celle sans outils — la règle ne se couchait même pas. Le segment,
la droite et la demi-droite donnent désormais :

`Point(A) · règle qui trace · le trait · Point(B) · règle rangée`

**L'autre bord est tenu aussi.** Deux points *déjà* posés qu'on relie restent
avant le trait : ils existaient vraiment avant, et les faire paraître après
serait le mensonge inverse.

### La barre de style cachait les lignes qu'on venait d'écrire

*« Quand on écrit plusieurs lignes et que la barre de style du texte va en bas —
car normalement elle va en haut, mais comme on est en haut du canevas elle va en
bas —, elle cache les lignes en dessous. »*

La barre se pose au-dessus de la ligne de saisie. Quand il n'y a pas la place —
une écriture près du **haut** du canevas —, elle passe dessous. Or elle n'était
placée **qu'à l'ouverture**, sur un champ d'**une seule ligne** : chaque ligne
tapée ensuite poussait le champ *sous* elle.

| lignes écrites | ce qui disparaissait |
| --- | --- |
| 2 | 0,6 ligne |
| 3 | 1,6 ligne |
| 5 | **2,6 lignes** |

On écrit sans voir ce qu'on écrit. La barre suit maintenant le champ, qui est
mesuré à chaque fois qu'il change de taille — zéro pixel caché, de une à six
lignes.

**Un `ResizeObserver` plutôt qu'un écouteur de frappe.** La hauteur du champ ne
change pas qu'en tapant : elle change aussi quand on **grossit la police**, qu'on
met en **gras**, qu'on change de police, ou qu'une ligne se replie toute seule.
Une seule prise les couvre toutes, là où il aurait fallu se brancher sur cinq
commandes — et en oublier une. Mesuré : passer de 14 à 60 px cachait **11 044 px²**
de texte, et aucun écouteur de clavier ne l'aurait vu.

**Et quand le texte est plus haut que l'écran**, la barre ne tient nulle part. Le
pincement final la ramenait alors tout en bas, c'est-à-dire **sur la dernière
ligne — là où est le curseur**. Elle se pose désormais en haut de la bande
visible : on écrit par le bas, c'est le haut qu'on peut couvrir.

`probe-barre.js` tenait déjà le **débord** — la barre reste dans l'écran, le
panneau d'aide ne la recouvre pas. Personne ne regardait si elle restait hors du
**champ**, et elle n'était éprouvée que sur des textes d'une ligne. Les quatre
nouvelles épreuves mesurent l'**aire commune** des deux rectangles, qui est
exactement ce que l'utilisateur ne voit plus. Elles échouent **3 fois sur 4** sur
la version d'avant.

**Une de mes épreuves mesurait le vide.** La dernière — « un texte plus haut que
l'écran renvoie la barre en haut » — passait aussi sur l'ancienne version, où la
barre tombait à **−1 204 px** : entièrement hors de la fenêtre. « Plus haut que »
était vrai, et ne voulait rien dire. Elle exige maintenant les deux : dans
l'écran, **et** dans son tiers supérieur.

### Un énoncé entier, et il doit donner Batman

*« Ça ne fonctionne pas. C'est pas terrible, c'est censé donner Batman. »*

Vingt-quatre lignes collées dans le panneau des consignes. Quinze passaient — et
les autres ne refusaient pas : **elles répondaient « ok » en faisant autre
chose.** C'est la seule façon dont un logiciel de construction peut vraiment
tromper : la figure est fausse, et rien ne le dit.

Quatre silences, mesurés un par un sur ce qui se posait *vraiment* sur la
feuille, jamais sur ce que la réponse annonçait.

**1. Une phrase coupée en trois, dont deux morceaux partaient ailleurs.**
« Elle coupe la droite (HX) en I, la droite (MY) en O et la droite (d) en G » ne
posait que **I**. Les deux autres morceaux ne tombaient pas dans le vide : le
découpeur de phrases les prenait pour des consignes neuves — « la droite » en
commence une, d'ordinaire — et ils repartaient vers le traceur de droites, qui
**traçait (MY) et (d) par-dessus elles-mêmes**. Réponse : « I — croisement ·
Droite (MY) · Droite (d) », `ok`.

Le pire vient après. O et G n'existaient pas ; les lignes suivantes les citaient,
et « la droite (OP) » les faisait alors **naître comme points libres posés
n'importe où**. Toute la figure se bâtissait sur des points inventés, sans un
seul refus. Le verbe « coupe » régit toute la phrase : elle ne se coupe plus, et
chaque « cible en NOM » est traitée.

Un garde-fou : **un seul verbe**. « La droite (EC) coupe (MY) en N **et** la
droite (FD) coupe (MX) en L » est bien faite de deux consignes, chacune avec son
objet coupant. Le nombre de « coupe » départage les deux phrases — et j'ai cassé
ce cas-là une première fois avant de le mesurer.

**2. Les lettres étaient lues dans l'ordre du texte.**
« Placer X et Y tels que **HXMY** soit un losange » rendait un losange **XYHM** :
les lettres se ramassaient au fil de la phrase — X, Y, H, M —, et H et M
sortaient **voisins** alors que l'énoncé les veut **opposés**. Un quadrilatère
s'écrit en juxtaposant ses sommets dans l'ordre du contour : ce groupe-là est la
figure, et il est le seul à dire quel sommet touche quel autre.

**3. Deux sommets opposés connus, c'est une autre construction.**
Le bâtisseur général pose la forme idéale sur les points existants **par
similitude** — ce qui suppose qu'ils sont voisins. Résultat mesuré : côtés de
8,67 et 5,01 cm, diagonale 5 au lieu de 11, annoncé « Losange XYHM », `ok`.

Les diagonales d'un losange se coupent **en leur milieu et à angle droit** : X et
Y sont donc sur la perpendiculaire à [HM] en son milieu, à la moitié de l'autre
diagonale. La seconde donnée s'écrit de trois façons, et les trois sont dans les
manuels — l'autre diagonale (`XY = 11 cm`), un côté (`HX = 7 cm`, d'où la
demi-diagonale par Pythagore), ou rien du tout si la figure est un **carré**, où
les deux diagonales sont égales. Hors de ces trois cas, la figure n'est pas
déterminée et c'est refusé. Il ne reste alors qu'une liberté — de quel côté tombe
le premier nommé —, et l'énoncé la donne : *« placer X du côté gauche »*.

**4. Deux figures et une ligne ouverte.**
« Trace les triangles GHI **et** JHK » n'en traçait qu'un : le découpage ne coupe
que devant ce qui commence une consigne, et « JHK » ne commence rien. Et « la
ligne polygonale EADOLMNPCBF » n'était pas comprise du tout — une ligne
polygonale n'est pas un polygone : **elle ne se referme pas**, onze sommets font
dix segments.

| | avant | après |
| --- | --- | --- |
| lignes de l'énoncé qui passent | 15 / 24 | **24 / 24** |
| points construits | 12 — dont 5 inventés | **24, tous calculés** |
| côtés du losange HXMY | 8,67 et 5,01 cm | **6,04 cm, les quatre** |
| sa diagonale XY | 5 cm | **11 cm** |

**Et c'est la symétrie qui juge.** `probe-batman.js` ne lit pas les messages : il
relève les vingt-quatre points, vérifie les mesures écrites dans l'énoncé, puis
exige que les **onze paires** de lettres se répondent de part et d'autre de la
verticale par H. Écart maximal mesuré : **0 px**. Une seule erreur en amont fait
basculer tout un côté, et un logo symétrique ne s'obtient pas par hasard sur
vingt-quatre points construits les uns sur les autres.

Les deux arcs sont le même juge, en plus sévère : l'arc de centre M par V et W
n'existe que si MV = MW. Avant, c'était **3,2 cm contre 38,22**.

**Puis le corrigé du professeur est arrivé.** Quinze pages, construites pas à
pas : le rectangle, la médiatrice de [HM], le losange, les droites, puis la tête
de Batman au feutre. La figure du logiciel lui correspond trait pour trait.

**Mais une figure peut « avoir l'air bien » et être fausse de deux millimètres**,
et une sonde qui se contente de regarder ne vaut pas mieux. Les vingt-quatre
points sont donc **recalculés à part, dans la sonde, sans le logiciel** :
A=(0,0), B=(8,0), C=(8,10), D=(0,10) en centimètres, l'énoncé suivi à la lettre,
et une seule fonction d'intersection de vingt lignes. Les deux listes doivent
coïncider.

C'est la différence entre « la sonde est d'accord avec le logiciel » — ce qui ne
prouve rien — et « le logiciel est d'accord avec la géométrie ».

| | |
| --- | --- |
| écart maximal sur les 24 points | **0,0009 cm** |
| le point le plus éloigné | T |

*Et une précision sur l'image que j'avais montrée la veille : elle paraissait
incomplète, les deux côtés de la tête manquant. Ce n'était pas la figure, c'était
ma façon de la photographier — je masquais tout ce qui précédait l'étape 11, donc
aussi [AD] et [BC], que la ligne polygonale REPREND au lieu d'en tracer de
nouveaux. Le défaut était dans le script de capture, pas dans le logiciel.*

**Un effet de bord assumé.** « Place le point D tel que ABCD soit un
parallélogramme » répondait « Parallélogramme **DABC** » — l'ordre du texte, là
encore. Il répond maintenant « Parallélogramme **ABCD** ». La figure était déjà
juste ; c'est son nom qui ne l'était pas, et `CONSIGNES.md` a été régénéré.

### « De centre H » : la lettre était lue, puis jetée

*« Tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm… »*
*« Il n'arrive pas à faire de centre H. » — « Et il se trompe sur les longueurs. »*

Deux défauts dans une seule phrase, et tous deux **silencieux** : la réponse
disait « Rectangle ABCD », `ok`, et rien d'autre.

**Le centre était ignoré.** Le « de centre H » ne traçait rien et ne refusait
rien. Écrit sur sa propre ligne, c'était pire :

| ce qu'on écrivait | ce qu'on obtenait |
| --- | --- |
| `Trace un rectangle ABCD de centre H` | « Rectangle ABCD » — **pas de H** |
| `Place le centre H du rectangle ABCD` | « **Rectangle HABC** » — un second rectangle |
| `Place H le centre de ABCD` | « Point H placé » — **à 28 px du centre** |

Le mot « rectangle » suffisait à envoyer la deuxième phrase au bâtisseur de
figures, qui prenait le H pour un cinquième sommet. Trois formulations, trois
façons de dire qu'on avait fait ce qu'on n'avait pas fait.

**Le centre d'un quadrilatère est le croisement de ses diagonales**, et celui
d'un polygone régulier le centre de son cercle circonscrit. Les trois
formulations le posent maintenant au pixel près, et « le point d'intersection
des diagonales de ABCD » — la formule du manuel — y mène aussi.

**Et un quadrilatère quelconque n'en a pas.** Ses diagonales se coupent, mais ce
point n'a aucune des propriétés qu'on attend d'un centre : la phrase est refusée,
avec la formule qui donne le croisement si c'est lui qu'on voulait. Quand
l'énoncé ne nomme pas la figure, elle est **mesurée** : quatre sommets dont les
diagonales ont le même milieu forment un parallélogramme — c'est le théorème, et
il suffit ici.

### La seconde longueur était inventée

`AB = 8 cm et BC = 10 cm` donnait 8 cm et **4,96**. En faisant varier les deux, la
cause saute aux yeux : **BC ne dépendait que de AB**. Elle valait 0,62 × AB — le
rapport du rectangle par défaut — quelle que soit la valeur écrite.

| | AB voulu | BC voulu | BC obtenu |
| --- | --- | --- | --- |
| | 8 | 10 | 4,96 |
| | 8 | 3 | 4,96 |
| | 4 | 2 | 2,48 |

Le lecteur de mesures nommées existait pourtant. Mais il exige la chaîne
**entière** — les quatre côtés et une diagonale. C'est juste pour un quadrilatère
quelconque, où rien d'autre ne fixe la forme, et **de trop pour un rectangle,
dont le nom donne déjà les angles** : deux côtés adjacents suffisent. Le
parallélogramme était dans le même cas (8 et 3 rendaient 8 et 5,56) ; son
inclinaison, elle, n'est pas donnée par la phrase et n'a pas bougé.

**Et les mots comptent plus que la place.** « de largeur 3 cm et de longueur
8 cm » rendait un rectangle de 3 sur 1,86 : la première valeur lue devenait la
longueur, et les deux mots n'étaient jamais regardés.

### Trois autres défauts, trouvés en suivant l'énoncé ligne à ligne

L'exercice entier a été joué, les vingt-quatre lignes, et relu sur ce qui se
posait vraiment sur la feuille — pas sur ce que la réponse annonçait.

- **« Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC] »**
  n'en posait **qu'un**, et répondait « E est le milieu de [AH] » sans un mot sur
  les deux autres. La règle du pluriel ne se déclenchait que sur le mot
  « milieux » ; cette phrase-là écrit « le milieu » trois fois. Le nom se cherche
  maintenant **devant le crochet** et non collé à lui — une seule règle lit les
  deux formulations.
- **« Tracer la droite (d) parallèle à (AB) passant par H »** perdait le `(d)` :
  la droite naissait anonyme. Deux lignes plus loin, « Elle coupe la droite (d)
  en G » ne trouvait plus aucune droite `d`, retombait sur la dernière tracée —
  elle-même — et refusait : « Un objet ne se coupe pas lui-même. » **Un refus
  juste sur une figure fausse**, ce qui est la pire espèce : rien n'indique où est
  l'erreur. La branche voisine, celle où la droite de référence porte un nom,
  savait déjà nommer sa fille ; celle-ci, non.
- **« l'arc de cercle de centre M d'extrémités E et F »** réclamait « … de rayon
  3 cm » — un rayon qui est écrit dans la phrase : c'est ME. La forme « de E à F »
  était lue, « d'extrémités E et F » non. Et « le **petit** arc » rendait parfois
  le grand : l'écart entre les deux angles sort d'`atan2` et pouvait dépasser un
  demi-tour. Si les deux extrémités ne sont pas à la même distance du centre,
  **aucun arc ne passe par les deux**, et les deux longueurs sont dites — mais
  seulement pour « d'extrémités X et Y », car c'est ce mot-là qui affirme que les
  deux points sont *sur* l'arc. « de A à B » dit autre chose : le rayon vient de A
  et B ne donne qu'une direction. J'avais mis la règle trop large, et c'est
  `probe-enonce.js` qui a refusé une phrase déjà en service.

Le compte, sur l'exercice complet : **22 lignes sur 24** se tracent, contre 15
avant. Les deux qui restent refusent, et elles refusent pour une vraie raison.

### Ce qui n'est pas fait, et qui est écrit dans la sonde

**« Placer X et Y tels que HXMY soit un losange, XY = 11 cm »** rend un losange
**XYHM** — H et M voisins au lieu d'opposés — et ignore `XY = 11 cm` : mesuré,
HX = 8,67 cm pour XM = 5,01, et la diagonale vaut 5 au lieu de 11. La réponse dit
« Losange XYHM », ce qui nomme l'ordre employé mais annonce une réussite.

C'est une construction qui n'existe pas : **deux sommets opposés connus et une
diagonale donnée**. Tant qu'elle n'existe pas, `probe-centre-et-longueurs.js` ne
fait pas échouer la suite dessus — elle **imprime la mesure** à chaque passage, et
dit ce qu'il faudrait pour que la section devienne une épreuve. Une sonde qui tait
ce qui ne marche pas ne sert à rien ; une sonde qui exige ce qui n'a jamais existé
non plus.

### Les dix autres refus réels, un par un

Le relevé donne les dix-sept phrases refusées avec leur nombre d'occurrences ;
en les additionnant on retombe exactement sur dix-sept. On les tient donc
**toutes** — pas un échantillon. Trois sont de vrais refus (« coucou »). Huit
tenaient à un mot mal tapé (section suivante). Voici les six autres.

**« Fais moi la symétrie centrale par rapport au point O de la figure ABCDEFGHI »
(×2).** Mesuré sur feuille vierge, la réponse était **« Point O placé »** : le
logiciel lisait « par rapport au point O » comme « place le point O », faisait
autre chose que ce qu'on demandait, et **ne refusait pas**. C'est le pire des
trois sorts. Deux causes :

- le mot **« symétrie »** n'était pas un déclencheur de transformation — seuls
  « symétrique », « image de », « translation » et « rotation » l'étaient ;
- l'objet était **du mauvais côté du séparateur** : la phrase dit le *centre*
  d'abord, la *figure* ensuite, et toute la lecture attendait l'inverse.

La phrase est donc remise dans l'ordre que le reste sait lire, et le logiciel le
dit. Deux gardes pour ne pas retourner une phrase déjà correcte : la tête ne doit
nommer **aucun** point, et ce qui suit le « de » final doit être un groupe d'au
moins **deux** majuscules — une figure s'écrit en juxtaposant ses sommets, un
centre est une lettre seule. Et le texte du centre est gardé **tel quel** : « par
rapport à (EF) de la figure ABC » est une symétrie *axiale*, et n'en garder que le
E en ferait une symétrie centrale. En mesurant, un second cas du même genre est
apparu : « Trace la symétrie axiale par rapport à (AB) de la figure ABC »
répondait **« Droite (AB) »** — il traçait une droite.

**« Trace la médiatrice de [ACB] » (×2).** Celle-ci **doit** rester refusée : un
segment a deux extrémités. Mais le refus rappelait comment on écrit une médiatrice
sans dire ce qui n'allait pas, devant une phrase qui a l'air juste. Il nomme
maintenant la faute :

> `[ACB]` porte 3 lettres : un segment n'en a que deux, ses deux extrémités.
> Vouliez-vous [AC], [AB], [CB] ?

**« … et l'angle de sommet D mesure 30° » (×1).** « en D » et « EDF » étaient lus,
« de sommet D » non — alors que la même tournure était déjà admise pour « isocèle
de sommet A ». La sonde mesure l'angle **sur la figure** : un triangle tracé avec
l'angle ignoré aurait la même réponse.

**« Tracer ABC tel que AB = 7cm ; BC = 8cm et AC = 6cm » (×1)**, sans le mot
« triangle ». Trois côtés déterminent un triangle et un seul. **À quatre lettres
on se taît** — « ABCD tel que AB = 5, BC = 3, CD = 5, DA = 3 » est un rectangle
comme un parallélogramme aplati, et choisir pour le professeur serait deviner.

**« trace une droite (d) et un point A qui n'est pas sur (d) et la parallèle à (d)
passant par A » (×1) marche aujourd'hui.** Ce refus vient d'une version
antérieure : les 51 ouvertures encore sur `2026-09-09 · 10h` rappellent que ces
dix-sept refus se sont accumulés sur dix-huit versions.

### Sept refus sur dix-sept tenaient à un mot mal tapé

Le relevé d'usage donne les phrases que le logiciel **n'a pas comprises**, et il
les donne toutes : sur 448 ouvertures, 104 consignes faites et 17 refusées. Sept
des dix-sept sont la même phrase, recopiée d'une feuille d'exercice :

> « Tracer le **traingle** ABC tel que : AB = 7 cm ; BC = 8 cm et AC = 6 cm »

On aurait pu accuser quatre choses à la fois. Mesuré en n'en changeant qu'**une**
à la fois — la seule façon de savoir laquelle casse la lecture :

| ce qu'on enlève | comprise ? |
| --- | --- |
| rien (la phrase réelle) | non |
| « traingle » → « triangle » | **oui** |
| l'infinitif → « Trace » | non |
| les deux-points après « tel que » | non |
| les points-virgules → virgules | non |
| tout sauf l'infinitif | **oui** |

L'infinitif, les deux-points, les points-virgules et le « 7cm » collé passaient
donc **déjà**. Le seul obstacle était le mot mal tapé. Avec « paralléle » (une
fois), **huit des dix-sept refus réels** tiennent à une faute de frappe.

**Une seconde lecture, et deux décisions qui se tiennent.**

1. **On ne corrige qu'après un refus.** La phrase est d'abord lue telle qu'elle
   est écrite ; ce n'est que si le logiciel n'a rien compris qu'il tente une
   seconde lecture. Une phrase qui marche ne peut donc pas être réécrite dans son
   dos — c'est la seule garantie qui vaille, et elle ne dépend d'aucune liste.
   Et si la phrase corrigée échoue à son tour, c'est le refus **d'origine** qui
   est rendu : aucun mot que personne n'a écrit n'apparaît à l'écran.
2. **Le vocabulaire est tiré du catalogue**, pas écrit à la main. Les 218 phrases
   de `window.GM_CATALOGUE` sont celles que le logiciel sait faire : leurs mots
   sont exactement les mots qu'il connaît — 157 mots de six lettres et plus. Une
   liste recopiée à côté se périmerait au premier ajout, et personne ne s'en
   apercevrait.

**Et il le dit** : « Orthographe : j'ai lu « traingle » → « triangle ». »
Corriger en silence serait lui faire dire qu'il a compris une phrase qu'il n'a
pas lue.

**La transposition compte pour une faute.** « traingle » → « triangle » échange
deux lettres voisines : au sens de Levenshtein c'est une distance **deux**, et une
correction qui ne compterait que les lettres changées, ajoutées ou retirées ne
l'attraperait pas — or c'est la faute de frappe la plus banale qui soit.

**L'accent, lui, n'était presque jamais un obstacle**, et il fallait le mesurer
avant de croire le contraire : *trapeze*, *regulier*, *equilateral*, *isocele*,
*parallelogramme*, *mediatrice*, *arete*, *tetraedre*, *carree* passaient déjà.
La seule phrase qui achoppait est « une paralléle à (d) ».

**Deux limites, mesurées et écrites plutôt que masquées.** Sur 68 mots courants
absents du catalogue, quatre sont réécrits, dont un à tort — « partie » →
« partir » ; la conséquence est bornée par la règle 1. Et une phrase qui réussit
n'est pas relue, même de travers : « Place le **mileu** I de [AB] » pose un
*point* I — et l'annonce ainsi, « Point I placé », sans mentir, mais sans faire
le milieu.

### Le crayon suivait l'autre bord de l'équerre

*« Je traçais une parallèle et le crayon monte toujours, il ne va pas sur le bon
côté de l'équerre. »* — *« En fait le crayon suit la direction de la droite
tracée (et là en l'occurrence c'est avec l'équerre). »*

Le geste est celui-ci : on couche la règle, on pose l'équerre contre elle, on la
fait **glisser** jusqu'au point, et l'on trace le long de l'autre bord de
l'équerre. Les deux instruments sont sortis en même temps et **ils se touchent** :
c'est là que tout se joue.

**La règle n'a qu'un bord gradué, et tout avait été écrit pour elle.**
`planRegle` — qui dit où le crayon en est le long de l'instrument — faisait
partir son axe de l'angle du widget, c'est-à-dire du **grand** côté de l'équerre.
Or la parallèle se trace le long du **petit**, celui qui reste libre une fois
l'équerre glissée contre la règle. Relevé au rejeu, équerre posée en (900, 500)
tournée d'un demi-tour, trait **vertical** en x = 900 :

| | avant | après |
| --- | --- | --- |
| crayon à t = 0,3 | (780, **500**) | (900, 425) |
| crayon à t = 0,6 | (660, **500**) | (900, 350) |
| crayon à t = 0,9 | (540, **500**) | (900, 275) |

Le trait montait, le crayon filait à l'horizontale, jusqu'à **360 px** du trait
qu'il était censé tracer — le long du bord posé sur la règle. Et chaque bord a sa
portée : le grand fait `width`, le petit `height` ; prendre `width` pour les deux
fait courir le crayon dans le vide.

**Et l'équerre n'était reconnue qu'à moitié.** `getNearbyWidget` cherchait son
petit côté en y **négatif** — hors du triangle — et bornait le grand à `height`
au lieu de `width`. Mesuré sur une équerre de 400 × 250 :

| point du bord | avant |
| --- | --- |
| grand côté, x = 200 | `setsquare` |
| grand côté, x = 300 | `null` *(le côté fait 400)* |
| petit côté, y = 120 | `null` *(jamais, nulle part)* |

Ne reconnaissant pas l'équerre, le logiciel se rabattait sur **la règle d'à côté**
et orientait le crayon par rapport au corps de la règle. La règle, elle, n'a pas
changé d'un pixel : son crayon court toujours le long de son unique bord gradué,
et la sonde tient ce bord-là aussi.

### Un geste, un Ctrl+Z

*« Les undo parfois embarquent 2 étapes. »*

**La pile contient les états d'APRÈS chaque action** : `undo()` dépile le dernier
et rend le précédent. Or la moitié des outils n'enregistraient que l'état
d'**avant**, celui pris à l'appui — et comme cet état est justement celui qu'a
laissé le geste précédent, `saveState` l'écartait comme doublon. Le geste
n'entrait alors **jamais** dans l'historique, et le Ctrl+Z suivant remontait d'un
cran de trop : il défaisait deux gestes.

Mesuré, gestes à la souris sur feuille vide :

| geste | objets | états poussés |
| --- | --- | --- |
| clic de point | 1 | **0** — jamais enregistré |
| glissé de segment | 3 | **2** — deux Ctrl+Z pour un geste |
| angle (3 clics) | 4 | 2 |
| polygone (5 clics) | 9 | 5 — jamais le dernier |

Deux symptômes opposés, une seule cause : **deux conventions mélangées dans la
même pile**. Un geste qui n'enregistrait que son départ ne poussait rien quand le
geste précédent avait fait son travail — et deux quand il ne l'avait pas fait.
D'où le « parfois ».

**Une ligne par outil aurait réparé les quatre connus et laissé le cinquième pour
plus tard.** La règle tient donc en un seul endroit : si des objets sont nés et
qu'aucun glissé n'est en cours — un glissé finit au relâchement, qui enregistre
déjà —, on enregistre l'arrivée. L'outil ajouté demain n'aura pas à y penser.

Les outils à plusieurs clics comptent **par clic** : un polygone de quatre sommets
se défait en quatre Ctrl+Z. C'est un choix, pas une conséquence, et la sonde le
vérifie explicitement.

### Le pot de peinture visait ce qui passait derrière

*« Le mode peinture ne fonctionne pas sur un point qui est au bout d'un segment
par exemple. »*

Et c'est bien « par exemple » : le défaut ne tenait pas à ce point-là mais à la
règle de désignation. La peinture prenait le **dernier objet de la liste** qui
touche le doigt — or un segment est créé *après* ses deux extrémités, et un
polygone après ses côtés. Mesuré, un clic pile sur A :

```
sous le doigt : Point(A), Segment      →      désigné : Segment
```

Le point n'arrivait jamais son tour, quels que soient le zoom et la précision du
clic. Un point **libre**, lui, se peignait parfaitement — c'est ce qui rendait le
défaut si déroutant à décrire.

Le reste du logiciel sait déjà désigner : `closestPoint`, le point visible le plus
proche dans la tolérance de clic, décide du déplacement et de la sélection. La
peinture s'en sert désormais comme eux. C'est aussi ce qu'on attend d'un pot de
peinture : on vise la petite chose, pas celle qui passe derrière.

### Le cadran de position revient, derrière le pli

*« Où est le cercle de positionnement ? » — « Oui, derrière le pli. »*

Il avait été supprimé avec le reste quand le menu du point pesait 437 px, au
motif que **le nom se déplace au doigt** : on l'attrape sur la feuille et on le
pose. L'argument tenait, mais il demandait de **viser une lettre de 14 px** — au
tableau blanc, ce n'est pas le même geste que viser un cadran de 60. Les deux
façons ne se valent pas, et le pli permet de garder la seconde sans la payer tous
les jours.

| | |
| --- | --- |
| menu replié | **232 px** — inchangé |
| menu déplié | 334 → **413 px** |

Le cadran revient **tel qu'il était**, commentaires compris : `touch-action: none`
et la sortie par `pointercancel` avaient été écrites après un défaut mesuré — au
doigt, le navigateur prenait le glissement pour un défilement, s'appropriait le
pointeur, et le cadran restait collé au doigt bien après le relâchement. Les
réécrire de mémoire, c'était refaire le défaut.

**La sonde ne regarde pas s'il paraît : elle le tire.** Elle piège `fillText` et
relève où la lettre tombe sur la feuille — (500, 383) avant, (517, 400) après
avoir amené le bouton à droite. Un cadran qui tourne sans que le nom bouge aurait
passé n'importe quelle vérification écrite sur `labelAngle`.

**Et il a révélé un menu ouvert sur un fantôme.** En vérifiant qu'un glissement
vaut bien **un** Ctrl+Z, la mesure a montré autre chose : après l'annulation,
`entities.includes(selectedObject)` rend **false**. `deserialize` ne modifie pas
les objets, il en fabrique de nouveaux — le menu restait ouvert sur l'objet
disparu, et le cadran affichait son angle pendant que le nom, à l'écran, était
revenu au sien. **Le logiciel montrait un état qui n'existait plus.** Le menu se
referme donc sur une annulation.

Ce défaut était vrai de **tout** le menu bien avant le cadran — l'œil, la
couleur, le nom décrivaient tous un objet mort. C'est le cadran qui l'a rendu
visible, parce qu'il est la seule commande qui **montre** un état au lieu de le
subir. Un bouton qui ne dit rien peut mentir longtemps.

### Le pli n'est plus une flèche, c'est une barre

*« Je trouve ça un peu moche, la petite flèche pour étendre le menu contextuel,
idem pour la flèche du menu de style. »*

Le reproche était esthétique, la mesure l'a rendu fonctionnel. Le chevron du menu
contextuel était un caractère `⌄` dans un bouton de **20 × 20 px**, posé dans le
coin haut-droit ; celui de la palette, le même, à cheval sur la poignée de
déplacement. **Au tableau blanc interactif, un doigt couvre bien davantage** — et
les deux boutons visaient précisément le coin où le geste est le moins sûr.

Quatre dispositions ont été dessinées avant de choisir. Celle retenue est une
**barre pleine largeur en bas du panneau**, fond gris doux, chevron centré :

| | avant | après |
| --- | --- | --- |
| cible dans le menu contextuel | 20 × 20 px | **168 × 30 px** |
| cible dans la palette dépliée | 20 × 20 px | **184 × 30 px** |
| cible dans la palette repliée | 20 × 20 px | **36 × 30 px** |

**Elle coûte 38 px de hauteur**, et c'est le prix assumé : le menu du point passe
de 194 à 232 px replié, de 296 à 334 déplié. Une cible qu'on rate ne vaut pas les
pixels qu'elle économise.

Trois choix accompagnent la forme :

- **la barre est en bas, pas en haut.** C'est un tiroir : on voit qu'il y a
  quelque chose *en dessous*, et le chevron dit dans quel sens on tire ;
- **le chevron est un tracé, plus un caractère.** `⌄` et `⌃` ne se ressemblent pas
  d'une police à l'autre, et aucun des deux ne grossit proprement ; un `<svg>`
  commun aux trois barres les rend identiques partout. La sonde vérifie ce point
  en comptant les `<svg>`, pas en lisant le texte ;
- **les trois barres sont la même.** Une seule règle CSS, `.barre-pliage`, et une
  seule méthode qui dessine le chevron dans le bon sens. La palette repliée en
  reçoit une aussi, large de 36 px seulement parce que la palette l'est — mais
  pleine largeur tout de même, et c'est ce que la sonde mesure.

**Et 30 px ne suffisaient pas au doigt.** `probe-cibles-doigt.js` tient 32 px
pour le minimum touchable, et a signalé la barre de la palette repliée dès le
premier passage : 36 × **30** px. Elle monte donc à **34 px sur pointeur
grossier** — téléphone comme tableau blanc interactif —, et reste à 30 à la
souris, où rien n'a jamais eu besoin de grossir.

**La sonde mesure chaque barre dans son propre état.** La première version les
relevait toutes les deux d'un coup : celle de la palette repliée vivait alors dans
un panneau en `display:none`, rendait 0 × 0 px — et **passait**. Une sonde qui
mesure du vide ne dit rien du logiciel.

### Et une petite flèche rend les options retirées

*« Rajoute aux menus contextuels juste une petite flèche comme le menu de style,
pour étendre le menu contextuel à toutes les options. »*

Le ménage de la section suivante avait fait tomber le menu du point de 352 à
194 px. Mais **« ça me sert très peu » n'est pas « jamais »** : la flèche rend ces
réglages sans les imposer.

| | |
| --- | --- |
| replié, à l'ouverture | **194 px** |
| déplié d'un appui | 296 px |

*La flèche a depuis été remplacée par une barre pleine largeur — voir la section
précédente ; le menu mesure aujourd'hui 232 px replié, 334 déplié.*

Trois décisions, et la troisième est celle qu'on oublie :

- **le menu naît replié** et retient le dernier choix d'une ouverture à l'autre —
  même mécanique que la palette, et pour la même raison : c'est une habitude de
  travail, pas un réglage à reprendre à chaque objet ;
- **ce qui se déplie fonctionne.** La sonde ne regarde pas si les rangées
  *paraissent* : elle **clique** dedans et vérifie que le point passe en disque et
  que son nom grandit. Un bouton sans action vaut moins que pas de bouton ;
- **la flèche ne paraît que s'il y a quelque chose à déplier.** Un segment n'a pas
  de rangée repliée ; un chevron qui n'ouvre rien serait pire que pas de chevron.

**Le cadran, lui, a fini par revenir** — derrière ce pli, et sur demande : voir
la section plus haut. Il n'y était pas au moment où cette flèche a été posée.

**Un piège de CSS, noté pour qui relira.** `.ctx-plus { display:none }` ne repliait
**rien** : `.menu-row { display:flex }` est déclarée plus bas dans la feuille, à
spécificité égale, et c'est la dernière qui gagne — le menu restait à 296 px au
lieu de 194. Le sélecteur porte donc `#contextMenu` devant, et ce n'est pas du
zèle.

### Le menu du point : 437 px pour trois réglages qu'on n'utilise pas

*« Je trouve le menu contextuel du point un peu lourd. »* — *« Ce qui me sert très
peu, c'est de changer croix, rond, pixel, la taille, et le rond du nom du
point. »*

Mesuré avant de proposer quoi que ce soit :

| | taille | contrôles |
| --- | --- | --- |
| point | 352 px | 21 |
| **milieu** | **437 px** | **29** |
| segment | 324 px | 28 |

Sept dispositions ont été montrées. Celle qui a été retenue n'est pas un
réarrangement : c'est un **retrait**, et chaque pièce est partie pour sa propre
raison.

**Le cadran de position du nom (62 px).** Mesuré avant de couper, et c'est la
mesure qui a décidé : le nom se déplace **déjà** en l'attrapant sur la feuille.

```
avant le glissé   labelAngle −1,571 · isManuallyPlaced false
après le glissé   labelAngle  2,356 · labelDistance 56,6 · true
                  et le POINT n'a pas bougé
```

Le cadran ne faisait donc rien que la manipulation directe ne fasse mieux : on
voit où l'on pose, au lieu de viser un disque de 60 px — et au tableau, viser
petit est précisément ce qu'on veut éviter. Soixante lignes de glissement, de
capture de pointeur et de rattrapage du `pointercancel` tactile sont parties avec
lui, ainsi que son CSS.

**Croix / disque / pixel (34 px) — mais la palette d'abord.** J'avais écrit que
ce réglage « existait déjà dans la palette » : c'était **faux à moitié**. La
palette ne l'appliquait qu'aux points **à venir**, et c'est précisément pourquoi
le menu portait sa propre rangée. Elle s'applique maintenant à l'objet
sélectionné, comme le trait plein/pointillé le fait depuis toujours — et c'est
seulement à cette condition que la rangée pouvait partir sans rien coûter.

**La taille du nom (34 px).** La seule perte assumée : la palette règle la taille
de *tous* les noms, le menu réglait *un* nom.

**L'œil du nom** n'est pas parti : il a rejoint la lettre, c'est le même sujet, et
cela supprime une rangée de plus.

| | avant | après |
| --- | --- | --- |
| point | 352 px · 21 contrôles | **194 · 16** |
| milieu | 437 px · 29 | **279 · 24** |

**Trois choses trouvées en chemin**, qu'on n'allait pas chercher :

- l'interrupteur « Points » de la palette gardait un **bleu pâle** là où celui du
  trait a une pastille blanche — `setGlobalPointStyle` peignait ses boutons en
  dur, ce qui écrasait le CSS du segment. Deux formes pour une même chose, à deux
  rangées d'écart ;
- la rangée des tailles s'affichait aussi pour un **texte**, où elle **ne faisait
  rien** : `textSize-inc/dec` ne touchaient qu'un *Point* ;
- `probe-cadran.js` gardait le cadran, et surtout son vieux défaut tactile. Elle
  n'a pas été effacée en silence : elle devient `probe-nom-au-doigt.js`, qui tient
  le geste de remplacement et vérifie que le cadran ne revient pas — ni son
  élément, ni son habillage.

### Choisir, ou agir : deux natures, deux formes

*« Rien ne me convainc. »*

Sept dispositions ont été montrées avant celle-ci, et **les six premières
partageaient la même hypothèse fausse** : garder six rangées de carrés identiques
et les ranger autrement. Aucune ne convainquait, et la raison était ailleurs que
dans les marges.

La barre **repliée** plaît parce qu'elle montre un **état** — la couleur en
cours, le trait en cours, le chiffre. Le panneau déplié, lui, alignait
**vingt-deux icônes muettes** où rien ne distinguait un choix d'une action.

Or tout n'est pas de même nature :

- « croix, disque, pixel » est un choix **exclusif** — un seul peut être vrai ;
- « rayons X », « codage auto », « objets cachés » sont des bascules
  **indépendantes**.

Les premiers deviennent un **interrupteur segmenté** — une piste grise, une
pastille blanche qui se déplace ; les secondes gardent des carrés séparés.
L'alignement devient alors une *conséquence* au lieu d'un effort.

**La forme s'est trouvée en deux corrections, et les deux comptent.**

1. **Les intitulés ont été essayés, puis retirés.** Chaque groupe a d'abord porté
   son nom — Couleur, Trait, Points, Noms, Affichage — et c'est sous cette forme
   que la disposition a été choisie. À l'usage ils ne gagnaient pas leur place :
   le panneau passait de 361 à **507 px** pour nommer des rangées qui se lisent
   seules, des ronds colorés et des traits. Sans eux il tient en **312 px**, soit
   *moins* que l'original.
2. **Trois cases bordées ne sont pas un interrupteur.** Côte à côte, elles se
   lisaient encore comme trois boutons, et l'on pouvait croire en enfoncer
   plusieurs. Une piste avec une pastille qui se déplace ne laisse aucun doute :
   il n'y a qu'une position à la fois. C'est la forme que tout le monde connaît,
   et elle dit la règle sans un mot.

**Trois choses sont tombées d'elles-mêmes.**

- **L'aperçu d'épaisseur.** C'était un *faux* bouton — `pointer-events:none` —
  posé au milieu de vrais, et il disait ce que le curseur et le chiffre disent
  déjà. Mesuré : il coûtait 42 px sur une rangée qui en a 184, et le curseur
  tombait à **16 px de large**, à peine plus que son propre bouton. En le
  retirant de la page j'ai d'abord laissé le code qui le cherchait, derrière un
  `if` qui empêchait tout plantage — donc invisible pour toujours ;
  `probe-commandes.js` l'a vu.
- **L'agrandissement de la pastille sélectionnée.** Le `scale(1.15)` la peignait
  *hors* de sa boîte : quand la couleur choisie était la première de la rangée,
  elle dépassait de 2 px à gauche — un défaut qui **se déplaçait avec la
  sélection**. L'anneau suffit à désigner, et il ne déborde pas.
- **La grille**, qui n'a jamais été un style de point, rejoint les réglages
  d'affichage.

Les pastilles passent de 22 à **27 px**. La barre **repliée est identique pixel
pour pixel** : elle n'a pas été touchée.

### La palette dépliée ne s'alignait sur rien

*« La toolbar de style, je la trouve très déséquilibrée (sauf quand elle est
réduite, je la trouve parfaite). »*

La remarque désigne exactement le contraste : repliée, une seule rangée ;
dépliée, six rangées. Mesuré, panneau de 212 px, distance du premier contrôle au
bord du contenu :

| rangée | avant | après |
| --- | --- | --- |
| couleurs | 28 px | 14 |
| épaisseur | 14 px *(et le nombre débordait de 8 px à droite)* | 14 |
| grille de 4 | 33 px | 14 |
| grille de 5 | 14 px | 14 |
| grille de 4 | 33 px | 14 |

Cinq marges différentes dans un panneau large comme la main. Chaque rangée était
**centrée** avec un écart fixe : sa largeur dépendait donc du nombre de boutons,
et rien ne tombait en face de rien. Les boutons gardent une **taille constante** —
les étirer donnerait 44 px sur une rangée et 32 sur la suivante, ce qui serait
pire — et la rangée s'écarte jusqu'aux deux bords.

### « Bug de longueur » : trois autres lecteurs divisaient encore par 50

Une capture, et un rapport de 1,25 qui saute aux yeux : le crayon est à la
graduation **4,1** de l'équerre, l'étiquette du trait annonce **5,1**. 5,1 / 4,1 =
1,25 = 1 / 0,8 — le facteur du carreau Seyes, déjà rencontré.

On avait corrigé **les instruments** (voir la section suivante). Mais la
conversion pixels → centimètres était **éparpillée**, et trois autres lecteurs
divisaient encore par 50 en douce. Le premier est celui qu'on a sous les yeux
*en traçant* :

| sur cahier, un trait de 4 cm | dit |
| --- | --- |
| pendant le geste | **5,0** |
| une fois posé | 4,0 |
| lu sur l'équerre | 4 |

Trois réponses pour un seul trait, et c'est la fausse qu'on regarde pendant qu'on
trace. Les deux autres :

- la **règle-fantôme** dessinée sous le trait gravait ses traits tous les 50 px et
  les numérotait `i/50` — le même nombre en dur que les quatre instruments
  portaient avant. Elle contredisait donc la vraie règle posée à côté d'elle ;
- la **calculatrice** : `AB` valait 5 pour un segment que la figure appelait
  4,0 cm, et `AB+BC` répondait **8,75** au lieu de 7.

**Ce que ce second tour a appris.** Ce n'était pas « un instrument à corriger »
mais une conversion dispersée dans le fichier. Elle tient maintenant dans une
seule fonction, `gmCm()`, et la sonde ne cherche plus les lecteurs un par un :
elle relève **tous les nombres écrits sur le canevas** dans une même situation sur
les deux papiers, et exige que la même figure — la même *en centimètres* — donne
les mêmes nombres. C'est ce relevé qui a trouvé les trois, et non une lecture du
code ; c'est ce filet qui attrapera le quatrième.

Les instruments restent **hors du filet**, et pour une raison : une règle de
600 px porte moins de centimètres sur du Seyes. C'est la conséquence assumée, et
elle est vérifiée à part — la règle-fantôme va jusqu'à 12 sur papier blanc et
jusqu'à 9 sur cahier.

### Le compas et l'équerre ne mesuraient pas la même chose

*« Bug découvert entre le compas et l'équerre, problème de longueur. De mémoire,
un carreau Seyes, c'est 0,8 cm. »*

La mémoire est bonne, et c'est elle qui rend le défaut visible. Sur fond
**cahier**, GéoMaster pose une échelle de 0,8 : le carreau Seyes vaut 8 mm, donc
un centimètre vaut **62,5 pixels** et non 50. La figure le savait, le compas le
savait. Les instruments gravaient leurs traits tous les 50 px en les appelant
« 1 », « 2 », « 3 » :

| une même longueur de 150 px | sur quadrillage | sur cahier |
| --- | --- | --- |
| le segment dit | 3 cm | 2,4 cm |
| le compas dit | 3 cm | 2,4 cm |
| la règle gravait | 3 cm | **3 cm** — 25 % de trop |

Un élève qui reporte une longueur au compas puis la relit à la règle trouvait
deux réponses. C'est la faute la plus coûteuse dans un cahier : elle ne se voit
qu'au moment où l'on compare, c'est-à-dire pendant l'exercice.

La cause tenait en une ligne, **répétée quatre fois** — règle et équerre, chacune
à l'écran et à l'export : `const mm = 5; const cm = 50;`. Un nombre en dur là où
il fallait une division. Les quatre comptent maintenant en **millimètres** et non
en pixels : avec 62,5 px par centimètre, aucun test de divisibilité sur les
pixels ne pouvait retomber juste.

Conséquence assumée : sur cahier, la règle de 400 px porte **6 graduations et non
7**. C'est le même objet sur une feuille dont l'échelle a changé — comme une
vraie règle posée sur du Seyes, où un centimètre couvre un carreau et quart.

### Le crayon traçait la parallèle du mauvais côté

*« Lorsque j'ai tracé une parallèle — une droite, un point, puis l'équerre qui
glisse le long de la règle —, lors du replay le crayon a dessiné du mauvais
côté. »*

Mesuré, et c'était pire que de travers : le trait ne touchait **pas du tout** le
côté où se trouve la figure. Compté dans deux fenêtres posées à 200 px de C,
pendant tout le tracé :

| avancement | côté de B | côté opposé |
| --- | --- | --- |
| 15 % | **0** | 125 |
| 99 % | **0** | 133 |

La parallèle se traçait entièrement dans le vide de la feuille, à l'opposé du
segment dont elle est parallèle — c'est-à-dire là où l'œil ne peut pas comparer
les deux droites, ce qui est pourtant tout l'objet de la figure.

**La cause tient à la main de l'équerre.** Son bord de tracé est son côté +x ; le
côté qui monte le rail est ce bord tourné d'un quart de tour, et c'est *lui* qui
doit pointer vers C, sans quoi l'instrument glisserait à travers la règle. Selon
le côté de la droite où tombe C, le bord de tracé vaut donc +AB ou −AB : **une
fois sur deux il part à l'envers**. C'est aussi pourquoi le défaut a survécu — la
moitié des figures était juste.

Deux choses qu'on ne pouvait pas changer : le crayon ne recule pas (il ne court
que dans le sens de l'instrument, sinon il tracerait derrière la règle, dans le
vide) et l'équerre ne se retourne pas (le modèle n'en a qu'une main, là où le
carton d'une trousse se retourne).

**Reste la pose.** Le recul de l'équerre décide de la portion de droite que le
trait couvre ; il était fixe, il est maintenant choisi pour que cette portion
tombe le long du segment de référence. Le geste ne change pas, la pose seule
change :

| portion couverte, en px depuis C, dans le sens A→B | avant | après |
| --- | --- | --- |
| C au-dessus de (AB) | −270 … +130 | −151 … **+249** |
| C en dessous | −130 … +270 | −60 … **+340** |

### Le symbole qu'on ne trouvait pas, et le clavier qui n'en avait aucun

*« Il n'y a pas le symbole n'appartient pas pour le texte. »*
*« Je trouve ça galère de taper pour avoir un symbole, on pourrait pas avoir
quelque chose de plus pratique ? »*

La seconde phrase est la vraie. Le composeur connaît ∉ depuis toujours —
`\notin` est dans sa table — mais il fallait le **savoir** : l'aide aux formules
offrait ∈ sans ∉ et ≤ sans ≥, et le bouton de la barre du texte qui s'appelle
« Ouvrir le Clavier Mathématique » ouvrait quarante-huit touches de lettres et de
chiffres, **sans un seul symbole mathématique**.

Le clavier a donc une **page de symboles**, atteinte par la touche à gauche de la
barre d'espace — là où les téléphones mettent « 123 ». Quarante symboles, un
appui, et **aucun bouton de plus à l'écran** : la touche vit à l'intérieur d'un
clavier qu'on ouvrait déjà.

| | |
| --- | --- |
| ∈ ∉ ⊂ ∪ ∩ ∅ ≤ ≥ ≠ ≈ | ∥ ⊥ ∠ ° ′ π ∞ ± × ÷ |
| → ← ⇒ ⇔ … · ∗ ≡ ∼ ∝ | α β γ δ θ λ µ σ ω Δ |

Ils s'insèrent **tels quels**, et non sous leur commande : écrire `\notin` ferait
basculer *toute* la ligne en composition mathématique, et « le point A
n'appartient pas à (d) » y perdrait son allure de phrase. La liste est tirée de
celle du composeur, si bien qu'elle ne peut pas diverger.

### Où sont les symboles ??

Bonne question, et elle est arrivée **après** la correction : les symboles
étaient là, derrière un bouton qui portait un **dessin de clavier** — un
rectangle, quatre points, une barre d'espace. À 16 px, dans une barre où tout le
reste est une lettre (B, I, S, ?), ce rectangle bleu ne dit rien du tout.

Un bouton qui ouvre des symboles montre un symbole. Il affiche maintenant
**∉ ≤**, se lit de loin, et ne peut pas être pris pour autre chose. Un appui, et
la page des symboles est ouverte — pas le clavier de lettres, qui n'est pas ce
qu'on vient y chercher : sur un ordinateur il y a un vrai clavier, et sur une
tablette celui du système s'ouvre tout seul dès qu'on touche le champ.

Trois états, un seul geste : fermé, il ouvre les symboles ; ouvert sur les
lettres, il y bascule ; ouvert sur les symboles, il referme. Sans le deuxième, le
bouton pressé pendant que le clavier montre l'alphabet refermerait tout — et l'on
se demanderait une seconde fois où sont les symboles.

### Suivre le symbole jusqu'au bout a révélé deux autres choses

**L'export TikZ détruisait toute formule.** Il protégeait chaque caractère
spécial par une barre oblique, d'un bloc — or `\\` ne protège pas la barre
oblique en LaTeX : c'est un **saut de ligne**. Compilé pour voir, plutôt que
raisonné :

| ce qu'on écrit | ce que le PDF montrait |
| --- | --- |
| `A \notin D` | Anotin D |
| `\frac{a}{b} \le 30\degree` | frac{a}{b}le 30degree |
| `(AB) \parallel (CD)` | (AB)parallel (CD) |

Une formule de GéoMaster **est** du LaTeX, à trois commandes près : `\degree` et
`\deg`, que LaTeX ne connaît pas sans paquet, et `\par` — qu'il connaît, et qui
est un changement de paragraphe. Elle part donc en mode mathématique telle
quelle. Les lettres accentuées, **interdites en mode mathématique**, sont mises à
l'abri par mot entier : `unit\mbox{é}s` compile, mais coupe le mot en trois
morceaux composés différemment.

**Le PDF, lui, ne portait aucun symbole** — c'était le dernier maillon
cassé. La police embarquée, Instrument Sans, a les lettres et les accents, pas
les mathématiques. À l'écran et dans le SVG cela ne se voyait pas : le navigateur
descend sa pile de polices **glyphe par glyphe** et remplace ce qui manque. jsPDF
choisit **une** police par passage de texte et écrit le glyphe « absent » pour
tout le reste — lequel ne dessine rien. « A ∉ D » sortait « A   D », et le texte
du PDF, celui qu'on cherche au Ctrl+F, ne portait que
`A   D  a   b  ( A B )   ( C D )`.

### La police porte maintenant les symboles

Les quarante symboles qui manquaient sont pris dans **DejaVu Sans**, réduits à
ces seuls glyphes, ramenés de 2048 à 1000 unités par cadratin — l'échelle de
l'hôte — et **fusionnés** dans la police embarquée. Les sept qu'Instrument Sans
possédait déjà (× ÷ · ° → ← …) gardent son dessin : c'est pourquoi le degré des
angles, lui, sortait bien depuis toujours.

Coût : **1 Ko sur 178**, parce qu'on n'embarque que quarante dessins.

Fusionner plutôt qu'ajouter une seconde police, c'est toute l'affaire : une pile
de familles dans le SVG ne servirait à rien, jsPDF ne sachant pas en descendre
les marches. Il aurait fallu découper chaque texte en passages — lettres ici,
symboles là — et recalculer leurs abscisses.

La police fusionnée s'appelle **GeoMaster Sans**, et ce nom est une condition :
l'OFL réserve « Instrument Sans » aux versions non modifiées, et la licence
Bitstream Vera de DejaVu n'autorise l'ajout de glyphes qu'à condition de
renommer sans « Bitstream » ni « Vera ». Les deux licences sont reproduites dans
le fichier, comme l'une et l'autre l'exigent, et une sonde les y tient.

Le garde-fou qui nommait les symboles perdus reste, et **se tait tout seul** : il
n'interroge pas une liste, il demande au document s'il sait écrire ce qu'on lui
donne. Il reparlera le jour où un caractère venu d'ailleurs traversera la
feuille.

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

### Le décor de saison, et ce qu'il y a derrière

*« Quand on s'approche d'une fête, on peut rajouter un élément de décor sur
l'accueil : une citrouille, une chauve-souris, une toile d'araignée. »*
Puis, aussitôt : *« Mais quand on clique dessus, il faut pouvoir avoir la
construction, on est d'accord. »* Et enfin : *« Il faut pouvoir aussi cacher ce
décor. »*

Trois phrases, et la deuxième change tout : ce n'est plus un ornement, c'est une
**porte d'entrée**. À l'approche d'une fête, trois petits dessins paraissent sur
la feuille vide ; un clic sur l'un d'eux écrit l'énoncé dans le panneau des
consignes et le trace.

**La rangée centrée était un piège, et ce sont les chiffres qui l'ont dit.**
Quatre traitements graphiques ont été dessinés, puis montrés à des lecteurs à
qui l'on n'avait rien dit, avec une seule question : *nommez ces trois dessins.*
Les quatre jeux ont été reconnus **3 sur 3** — citrouille et toile avec 10 de
sûreté sur 10, la chauve-souris avec 8, qui reste le motif fragile. Mais sur la
POSE, le verdict a été unanime et contraire : **quatre juges sur quatre** ont
condamné la rangée centrée au-dessus de l'invitation. L'un l'a chiffrée : le
décor pesait **35 431 pixels d'encre contre 2 831** pour « Écrivez ce que vous
voulez tracer » — douze fois et demie —, avec un contraste de **Δ54 à Δ62**
contre le fond, quand le quadrillage lui-même n'est qu'à **Δ10**. Une décoration
doit se tenir au niveau de la grille ; celle-là était six fois au-dessus, et
elle précédait l'invitation dans l'ordre de lecture.

Pire que le poids : la **forme**. Trois motifs de masse égale, régulièrement
espacés, centrés juste au-dessus d'un champ de saisie, c'est la géométrie exacte
d'une rangée de boutons de suggestion — et dans un logiciel dont toutes les
autres surfaces sont des grilles d'icônes, cela faisait un quatrième amas de
commandes. Au tableau numérique, un élève serait allé taper sur la citrouille.

Ils sont donc partis aux bords, à trois tailles franchement inégales et sans axe
commun : **la toile dans l'angle, coupée par le bord** — c'est là que vivent les
vraies toiles —, la chauve-souris petite et haute, la citrouille posée en bas.
Le milieu de l'écran appartient à la feuille et à la phrase. Et puisqu'on peut
cliquer dessus, la fausse affordance que craignaient les juges est devenue une
vraie : au survol, le motif reprend sa pleine encre, grandit d'un rien et
annonce ce qu'il fera.

**Le bloc ne prend pas les clics ; les motifs seuls en prennent.** C'est la même
règle que l'invitation, et pour la même raison : un décor posé sur une feuille
vide mangerait sinon le premier clic de qui veut dessiner à la main. La sonde ne
le croit pas sur parole, elle interroge le point le plus dangereux — le centre
du bloc — et exige que `elementFromPoint` y réponde `geoCanvas`.

**Un clic écrit avant de tracer.** Les douze lignes de la citrouille vont se
ranger **une par une** dans le panneau des consignes, qui s'ouvre, puis sont
exécutées : on voit le texte qui a produit la figure, on peut le modifier, le
rejouer aux instruments, le donner aux élèves. Rien n'est fait en douce. Et si
une ligne échoue, le logiciel le dit : *« 10 lignes sur 12 — voyez le panneau
des consignes »*. Une figure incomplète sans un mot, ce serait le logiciel
laissant croire qu'il a fait ce qu'on lui demandait.

**On peut l'éteindre, et ça tient.** Une croix paraît au survol, à côté du
motif ; elle éteint le décor pour de bon, et le réglage survit au rechargement.
Le chemin du retour est dit au moment même où l'on éteint : l'aide, onglet
Général, où une seule ligne a été ajoutée — il n'y a pas de panneau de réglages
dans GéoMaster, et ce n'était pas une raison pour en créer un.

Le décor suit la vie de l'invitation, exactement : feuille vide, pas de mode
lecture, pas d'outil en main, pas écarté d'un clic. Il y ajoute deux refus
propres : **jamais dans un cadre** — un GéoMaster encastré dans un cahier en
ligne n'a pas à fêter Halloween chez l'hôte — et jamais s'il a été éteint. Au
téléphone, où la zone utile tombe à **278 px de large**, il n'en reste qu'un :
et c'est l'emblème qu'on garde, pas le plus discret, puisque chaque motif est
une porte et qu'en fermer deux sur trois reviendrait à réserver les
constructions aux grands écrans.

**Les trois portes, au programme de 6e.** *« Les constructions sont au collège
et donnables à des 6e — tu t'embarrasses peut-être un peu niveau difficulté,
non ? Garde la toile, que l'on peut faire sans homothétie. »* C'était juste, et
net : la première toile employait des **rotations de 22,5°** et des
**homothéties de rapport 1,4**, qui sont des notions de **troisième**. Tout a
été refait avec les seules notions de sixième.

La citrouille était déjà au bon niveau — 12 lignes : trois cercles de même
rayon aux centres alignés, milieu d'un segment, intersection de deux cercles,
report d'une longueur, symétrie axiale, disque, demi-cercle.

La toile tient en **9 lignes et ne mesure rien** : un octogone régulier inscrit
dans un cercle, ses huit rayons, puis trois séries de **milieux** qui donnent
les trois anneaux intérieurs. Pas une seule longueur à la règle graduée — un
élève la refait au compas et à la règle non graduée.

La chauve-souris tient en **19 lignes** et c'est une leçon de symétrie axiale.
Un rectangle de 12 × 7 sert de **cadre** : tout s'y accroche. Deux milieux
donnent l'axe, des longueurs **rondes** (1 ; 1,5 ; 2,5 ; 3,5 ; 4,5 cm) placent
les points de l'aile, trois milieux affinent le bord, on trace **une
demi-chauve-souris**, et une seule ligne renvoie **les cinq symétriques d'un
coup**.

**Le déroulé est devenu un critère.** *« Je n'ai pas vu ta construction,
j'aimerais bien voir le déroulé avant de valider. »* Une planche d'une vignette
par ligne, à cadre constant, a donc été fabriquée — et elle a condamné la
première chauve-souris mieux qu'aucun raisonnement : **treize vignettes sur
quatorze ne montraient que des croix rouges éparpillées**. L'élève plaçait
douze points en recopiant des décimales (7,3 cm, 2,1 cm, 8,4 cm…) sans rien
voir apparaître, puis la figure entière surgissait d'un coup à la ligne 14.
C'est l'inverse d'un exercice de construction. Une construction dont onze
vignettes sur douze sont identiques est un mauvais exercice, et cela se voit
d'un coup d'œil quand on les pose côte à côte.

Un juge a aussi vu que les quatre demi-cercles censés festonner le bord des
ailes **pendaient hors de la silhouette** : le polygone s'arrêtait sur la
droite, et les arcs flottaient en dessous en trait seul, comme des boucles
décoratives. Ils ont été retirés ; le bord festonné passe par les points
eux-mêmes.

Elles ont été choisies par comparaison : trois tentatives indépendantes par
motif, exécutées pour de bon, puis départagées par un juge qui avait les images
sous les yeux — et qui a superposé les silhouettes au dessin de départ,
**95,3 % de recouvrement** pour la chauve-souris retenue contre 93,2 et 89,8
pour les deux autres. Les trois auteurs s'étaient notés 7,5 ou 8 sur 10 ; le
juge a jugé ces notes trop généreuses, pour les six.

**La figure est amenée sous les yeux.** Mesuré sur un portable de classe
(1366 × 768), sans recadrage : la chauve-souris ne tenait qu'à **76 %** dans
l'écran — on cliquait sur une chauve-souris, on recevait un bout d'aile. La vue
se cale donc sur la figure, mais seulement si la feuille était vide : on ne
déplace pas la vue de quelqu'un qui travaillait déjà.

**Noël, la deuxième fête.** Du 1er au 25 décembre : un **flocon** dans
l'angle, un **paquet cadeau** en haut, un **sapin** en bas — c'est lui
l'emblème, donc celui qui reste seul sur téléphone. Mêmes aplats sourds que la
citrouille, même traitement.

Les trois constructions sont au programme de 6e, comme celles d'Halloween. Le
**sapin** (10 lignes) est bâti sur un triangle isocèle construit au compas :
comme SA = SB et que I est le milieu de [AB], la droite (IS) est la médiatrice
de [AB] — donc l'axe de symétrie de toute la figure, obtenu sans équerre. Les
largeurs des étages se reportent sur les côtés, les hauteurs sur l'axe, et une
seule ligne de symétrie axiale donne les sommets de gauche. Le **cadeau**
(16 lignes) fait travailler les parallèles et le partage symétrique d'un
segment : les deux rubans sont des bandes posées de part et d'autre du milieu.
Le **flocon** (17 lignes) part de l'hexagone régulier au compas — où le côté
égale le rayon, qui est *le* fait à faire découvrir en 6e — et ses six branches
reçoivent leurs barbes par reports égaux.

Pour le flocon, une solution a été explicitement écartée : deux triangles
équilatéraux superposés donnent une **étoile de David**, qui n'a rien à faire
sur l'écran d'accueil d'un logiciel d'école publique. Ce sont de vraies
branches barbelées.

Et la sonde a validé Noël **sans qu'une seule ligne de contrôle soit écrite** :
elle parcourt la table, donc toute fête ajoutée est éprouvée le jour où elle
entre.

**Pâques, la troisième fête.** Quinze jours avant le dimanche de Pâques
jusqu'au lundi férié : un **lapin** dans l'angle, une **cloche** en haut — dans
la tradition française ce sont les cloches qui apportent les œufs, et c'est un
motif au moins aussi juste que le lapin — et un **œuf décoré** en bas, qui est
l'emblème et reste donc seul sur téléphone. Deux jeux ont été dessinés, tous
deux reconnus **3/3** par un lecteur à qui l'on n'avait rien dit ; le retenu est
le plus léger (1 173 octets contre 1 780, cinq tours de correction contre
douze) et son lapin est mieux nommé — du second, le juge dit que le bas du
corps « se lit tout aussi bien comme un bonnet à pompon ».

### La date de Pâques se calcule, elle ne s'écrit pas dans une table

Les autres fêtes tombent le même jour chaque année : deux bornes `MM-JJ`
suffisent. Pâques, non. C'est le dimanche qui suit la première pleine lune
après l'équinoxe de printemps, et d'une année à l'autre l'écart atteint cinq
semaines — le **28 mars en 2027**, le **16 avril en 2028**. Une table figée
ferait paraître le décor au mauvais moment une année sur deux, et personne ne
s'en apercevrait avant le jour même.

Le comput grégorien (Meeus / Jones / Butcher) est de l'arithmétique pure, sans
astronomie ni table. Une fête peut donc déclarer, au lieu de ses bornes, qu'elle
se compte **à partir de Pâques** : tant de jours avant, tant de jours après. Le
même mécanisme servira au Carnaval (47 jours avant), à l'Ascension (39 jours
après) et à la Pentecôte (49 après).

**La sonde ne compare pas le calcul à une liste de dates recopiées** — une
liste fausse et un code faux se valideraient l'un l'autre. Elle vérifie
d'abord **deux théorèmes**, qui ne dépendent d'aucune mémoire et valent pour
toute année : Pâques est **toujours un dimanche**, et tombe **toujours entre le
22 mars et le 25 avril**. Éprouvé sur **501 années**, de 1700 à 2200. Les seize
dimanches de Pâques connus ne viennent qu'ensuite, en confirmation — et ils
concordent.

Et la table, elle, a dû apprendre à compter : **les collisions de dates se
cherchent maintenant année par année, sur vingt ans**, avec des bornes
calculées. Une fenêtre mobile n'occupe pas les mêmes jours d'une année à
l'autre : deux fêtes qui ne se touchent pas en 2027 peuvent se chevaucher en
2030. Le contrôle précédent comparait des bornes **indéfinies** pour une fête
mobile — il ne trouvait donc jamais rien. Il mesurait le vide.

**Voir Noël en octobre.** *« Comment je fais pour tester de façon future ? »*
Sans réponse, il fallait changer l'horloge de la machine pour vérifier un décor
qui ne paraîtra que dans deux mois. Cela se dit maintenant dans l'adresse, là
où ce logiciel dit déjà le mode lecture et la figure partagée — et sans rien
ajouter à l'interface :

| | |
| --- | --- |
| `?decor=noel` | la fête nommée, quel que soit le jour |
| `?decor=12-10` | comme si l'on était le 10 décembre |
| `?decor=non` | aucun décor |

Un nom inconnu **ne se tait pas** : il répond la liste des fêtes connues. Celui
qui écrit `?decor=paque` au lieu de `?decor=paques` doit l'apprendre tout de
suite, pas croire le décor cassé. Et un décor demandé dans l'adresse passe
par-dessus la croix d'extinction : on ne force un décor que pour le regarder.

Les trois dessins pèsent **2,6 ko de SVG**, écrits dans la page, sans image ni
requête.

**Deux défauts ont été attrapés en chemin, et ils étaient tous deux dans l'outil
de mesure.** L'infobulle « Tracer une citrouille » s'ouvre par le haut et
recouvrait la croix, qui était posée au-dessus du motif : on proposait d'éteindre
le décor avec un bouton masqué au moment précis où l'on venait de le faire
paraître. Et au téléphone, une croix de 32 px se plantait dans une citrouille de
45. La sonde ne comparait le décor qu'aux **commandes du logiciel**, jamais à
lui-même ; deux éléments du décor qui se marchent dessus sont pourtant un défaut
comme un autre — et c'est celui qu'on voit en premier.

### Le nom demandé n'était pas le nom posé

Le quatrième anneau de la toile refusait de se tracer : *« Je ne connais pas
H' »*. Mesuré sur un cas minimal, la cause était ailleurs que là où l'erreur
s'affichait :

| ce qu'on écrit | ce que le logiciel pose |
| --- | --- |
| `Place le milieu M' de [AB]` | **M'** — le nom est tenu |
| `Place les milieux P' de [AB] et Q' de [AC]` | **P, Q** — les apostrophes ont disparu |

Et le message disait « Milieux : P, Q » : la vérité sur ce qu'il avait **fait**,
jamais qu'il avait **ignoré les noms demandés**. La ligne qui parlait de P'
échouait trois lignes plus bas, loin de la cause. Le singulier tenait son nom ;
seul le pluriel mentait.

La cause tient en une frontière de mot. La règle qui cherche le nom écrit
devant le crochet était `/\b[A-Z]'{0,2}\b/` : le `\b` **final** exige une
frontière après l'apostrophe, or ni `'` ni l'espace ne sont des caractères de
mot — il n'y en a donc jamais, et `A'` ne pouvait matcher que `A`. Les deux
`\b` sont remplacés par des gardes qui regardent les lettres : rien avant,
rien après, ce qui laisse passer l'apostrophe et refuse toujours de couper
`AB` en deux.

C'est le défaut type de ce logiciel, et le plus coûteux : **faire quelque chose
de plausible sans dire qu'on a ignoré la demande.**

Et un troisième défaut de sonde, plus instructif : **j'ai failli corriger un
défaut qui n'existait pas.** La sonde du cadrage prenait, pour chaque arc, la boîte du **cercle
entier** — alors qu'on n'en trace qu'un morceau. Elle annonçait « la toile ne
tient qu'à 57 % dans l'écran » pour une toile qui y tenait tout entière. Le
logiciel, lui, échantillonne chaque arc sur sa portion réelle depuis toujours
(`getSceneBounds`) ; c'est à lui qu'on demande désormais l'emprise. Le vrai
défaut était ailleurs, plus petit et bien réel : la chauve-souris à 76 %.
