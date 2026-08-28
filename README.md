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
règle quand on l'en approche en tournant. L'aimantation trouve toute seule les
points et les intersections.

### La construction se rejoue

Chaque figure garde la trace de sa construction. On la rejoue **pas à pas**, les
instruments se déplaçant tout seuls, avec une consigne attachée à chaque étape.
C'est le geste du tableau, qu'un élève peut revoir chez lui autant de fois qu'il
veut.

### Le partage tient dans un lien

La figure entière est encodée dans l'URL — une construction de 300 objets pèse
2,4 Ko. On envoie le lien, on affiche le QR code, et c'est tout : rien n'est
stocké nulle part, rien n'expire, aucun compte n'est demandé.

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
bibliothèques. **3,3 Mo, soit 864 Ko une fois compressé** — ce que télécharge
réellement le navigateur.

Plus de la moitié de ce poids (1,8 Mo) est en `type="text/plain"` : présent dans
le fichier mais **jamais analysé au démarrage**. Ces morceaux ne sont injectés
qu'au premier export PDF ou au premier import de PDF. Le navigateur n'analyse
donc que 1,5 Mo à l'ouverture.

Conséquence pratique : le fichier fonctionne **hors connexion**, se copie sur une
clé USB, s'héberge n'importe où, et ne peut pas cesser de marcher parce qu'un
service tiers a fermé.

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

`tests/` contient 50 sondes qui **ouvrent GéoMaster dans un vrai navigateur** et
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
