# Ce qui manque encore — et ce qui ment

Liste établie en **essayant** trente-cinq phrases de collège dans le logiciel, pas
en réfléchissant devant le code. Chaque ligne porte ce qui s'est réellement passé.

Elle est rangée par gravité, pas par difficulté : **une phrase qui répond « oui »
en traçant autre chose est pire qu'une phrase refusée.** L'élève ne voit pas la
différence entre les deux ; le professeur, si, mais trois minutes trop tard.

---

## 1. Les phrases qui répondent « oui » et font autre chose

Ce sont les plus urgentes. Le logiciel affirme avoir fait quelque chose qu'il n'a
pas fait, et rien sur l'écran ne prévient.

| Ce qu'on écrit | Ce que ça donne aujourd'hui | Ce que ça devrait donner |
|---|---|---|
| `Trace deux triangles semblables` | **un seul** triangle, « Triangle FGH » | deux triangles de mêmes angles, rapport affiché |
| `Trace un angle égal à l'angle ABC` | « Angle ABC marqué » — rien de neuf | le report d'angle au compas, le geste du cours |
| `Trace les carrés de Pythagore sur le triangle ABC` | « Carré ABCF » — un carré, au hasard | trois carrés sur les trois côtés, et leurs aires |
| `Trace un losange à partir de deux cercles` | un losange, **sans les cercles** | la construction au compas, deux cercles de même rayon |
| `Trace la symétrie axiale d'un carré` | un carré, **sans symétrie** | le carré, l'axe, et l'image |

Le point commun : un mot de la phrase (« triangles », « cercles », « carré »,
« losange ») suffit à l'envoyer vers un bâtisseur qui ne lit pas le reste. La
parade est la même partout, et elle a déjà servi trois fois cette semaine — faire
passer le mot le PLUS PRÉCIS devant, et refuser clairement quand il n'y a pas de
bâtisseur derrière.

**Ce qui a été réparé, exactement pour cette raison :**

- `Trace un agrandissement du triangle ABC de rapport 2` répondait « Triangle ABC »
  et retraçait le même triangle par-dessus. Il fait maintenant une vraie
  homothétie — mesuré, AB = 4 cm devient A′B′ = 8 cm.
- `Trace un demi-cercle de diamètre [AB]` traçait le cercle **entier**.
- `Trace un triangle et sa droite d'Euler` traçait le triangle **et une droite
  quelconque**. Elle passe maintenant par les trois centres, et le déterminant
  mesuré vaut 0 : ils sont alignés, avec OH ÷ OG = 3. Sur un triangle
  équilatéral, elle est **refusée** — les trois centres sont confondus, c'est le
  seul cas.
- `Trace deux cercles sécants` traçait **un** cercle. Il y en a deux, et leurs
  deux points d'intersection sont posés — vérifié : ils sont à 0 pixel des deux
  cercles. `tangents` donne le point de contact.
- `Partage l'angle ABC en quatre angles égaux` répondait « Angle ABC marqué ».
  Quatre angles de 28,5°, mesurés égaux. Et **en trois, c'est refusé** : la
  trisection à la règle et au compas est impossible, et le refus le dit — c'est
  un théorème (Wantzel, 1837), pas une limite du logiciel.
- `Trace la droite des milieux du triangle ABC` répondait « De quoi ? ».
- `Comment s'appelle ce point ?` **plaçait un point**.

---

## 2. Ce qui manque et qui servirait toutes les semaines

Classé par ce que ça coûte à écrire.

### Court

- **`Trace un disque`** et **`Colorie le disque`** — faits. Reste `Colorie un
  secteur de 90° du cercle`, qui est la figure des pourcentages.
- **`Trace un repère`, `Place le point A(3;2)`.** Le repère est refusé, et
  `A(3;2)` place un point *au hasard* si A existe déjà. C'est la 5e, c'est tous
  les chapitres de fonctions ensuite, et c'est une trentaine de lignes.
- **`Trace une droite graduée`** répond « Droite (d) » : une droite, sans
  graduations. La droite graduée de 6e porte des repères et des nombres.
- **Le pied d'une hauteur.** `Trace la hauteur issue de A et son pied` échoue sur
  « son pied ». Le mot est dans tous les énoncés.
- **`Trace un cerf-volant`** — le quadrilatère à deux paires de côtés consécutifs
  égaux. Il est au programme et il n'existe pas.

### Moyen

- **Reporter un angle au compas.** Le report de *longueur* vient d'être ajouté ;
  le report d'*angle* est le geste jumeau, et c'est celui qui sert à construire
  un triangle quand on ne peut pas mesurer.
- **Les polygones inscrits sont faits** — reste à les construire **au compas**
  plutôt qu'au calcul : pour l'hexagone, reporter six fois le rayon, ce qui est
  la seule construction de collège où l'on ne mesure rien.
- **La configuration de Thalès** — les deux triangles emboîtés et le « papillon ».
  C'est la figure de la 4e, et elle se dessine en dix lignes une fois qu'on a les
  parallèles (qu'on a).
- **Angle inscrit et angle au centre** (3e) : deux angles à peindre en plein, et
  le rapport du simple au double. La machinerie des angles pleins existe
  maintenant — c'est elle qui a servi aux angles correspondants.
- **Le losange que donnent deux cercles sécants.** Les deux cercles sont faits ;
  reste à relier les quatre points, ce qui fait comprendre d'un coup la
  médiatrice et le triangle équilatéral.

### Long, mais c'est ce qui ferait la différence

- **Frises, rosaces, pavages.** Aucun des trois n'existe. Une frise, c'est un
  motif et une translation répétée ; une rosace, un motif et des rotations
  successives ; un pavage, deux translations. Les trois se ramènent à *répéter
  une transformation n fois* — une seule mécanique pour trois chapitres, du CM2
  à la 5e, et de très belles figures.
- **Le programme de construction à l'envers.** Le logiciel sait exécuter une
  suite de consignes ; il pourrait **relire une figure et écrire les consignes**.
  C'est l'exercice « rédige un programme de construction » de tous les manuels, et
  c'est le seul de la liste qu'aucun autre logiciel ne fait.
- **La sphère, le cylindre et le cône en perspective.** Il faudrait des ellipses
  — une classe de plus, avec son enregistrement et sa sélection. En attendant,
  les trois sont **refusés en disant pourquoi**, et le refus renvoie au patron,
  qui lui est fait. Le **prisme droit**, qui ne demandait pas d'ellipse, est
  dessiné (base triangulaire, carrée, pentagonale ou hexagonale).
- **Les aires et les volumes.** `Trace un carré d'aire 16 cm²` marche déjà.
  Manquent `Quelle est l'aire de ABCD ?` et le volume d'un solide tracé — le
  logiciel connaît toutes les dimensions, il ne lui manque que de le dire.

---

## 3. Deux idées qui ne sont pas des constructions

- **Le patron se plie.** Le patron est tracé à plat ; une animation qui le
  REPLIE, même sommaire, montrerait ce qu'aucun dessin ne montre — quelle face
  vient sur quelle face. C'est la question que les élèves posent vraiment.
- **Les onze autres patrons du cube.** Il y en a douze en tout ; le logiciel en
  trace un. « Montre-moi un autre patron du cube » serait un exercice à lui seul :
  on en tire un au hasard, l'élève dit s'il se replie ou non.

---

## 4. Ce que je changerais dans ce qui existe

- **Les zones de saisie des instruments ne suivent pas le zoom.** Mesuré : 7 px
  de large à un zoom de 0,2, là où la règle du projet est 32 px au doigt. On
  attrape l'équerre à la souris, pas au doigt, dès qu'on dézoome.
- **Cinq phrases refusées** relevées plus tôt et toujours refusées :
  `Écris « figure 1 »`, `appelle O son intersection avec (AC)`,
  `Nomme O le centre du cercle`. (Les deux autres — le report de longueur et
  `Que dire de ABC ?` — sont réglées : la première est faite, la seconde est une
  question et répond maintenant « rien à tracer ».)
- **`Trace la médiane issue de A`** sans nommer le triangle échoue, alors que
  `Trace la hauteur issue de A` s'en tire en reprenant le triangle courant. Deux
  phrases jumelles, deux comportements : c'est le genre d'écart qui use la
  confiance.
