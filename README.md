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

Les séances se rangent dans une **bibliothèque** locale, avec vignette, et la
collection entière s'exporte en un fichier pour changer de poste ou la donner à
un collègue.

Elle n'est pas vide au premier lancement : neuf **constructions d'exemple** y
attendent — médiatrice, bissectrice, triangle équilatéral, carré, losange,
hexagone, symétrique d'un point, cercle circonscrit, et une séance de quatre
pages. Chacune est la sortie exacte du bâtisseur du logiciel, instruments et
consignes comprises : on l'ouvre, on appuie sur ▶ ou sur *Page suivante*, et la
construction se refait sous les yeux de la classe.

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
ouvrir. La **loupe** de la barre du haut — ou `Ctrl+K` — ouvre une recherche :
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
précision au toucher, gestes à deux doigts, panneaux qui se replient. Les
libellés restent affichés là où l'infobulle n'existe pas — c'est-à-dire au doigt.

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

`tests/` contient 62 sondes qui **ouvrent GéoMaster dans un vrai navigateur** et
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
