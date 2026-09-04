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
| `probe-equerre-repere.js` | le repère rouge de l'équerre tombe juste, et le rejeu la pose |
| `probe-annuler-rejeu.js` | annuler pendant une construction magique l'arrête au lieu de tout bloquer |
| `probe-mesure-clavier.js` | une longueur et un angle se donnent au clavier, dans l'unité affichée |
| `probe-palette-repliee.js` | repliée, la palette tient dans 50 px et le crayon se règle d'un clic |
| `probe-apercu-eleve.js` | l'aperçu du lien élève a les vraies dimensions de chaque appareil |
| `probe-consigne.js` | la phrase du manuel est comprise et faite ; la notation oubliée est expliquée |
| `probe-cibles-doigt.js` | au doigt, aucune commande ne descend sous 32 px — et rien ne gonfle à la souris |
| `probe-rotation.js` | l'appui long sur la main tourne la figure sans la déformer ; partir tout de suite déplace |
| `probe-enonce.js` | un énoncé de devoir entier, collé tel quel, donne la figure — et elle est juste |
| `probe-codage-milieu.js` | un milieu porte ses deux traits ; le codage n'affirme que ce que la construction dit |
| `probe-consigne-tel.js` | au téléphone, les consignes prennent la moitié basse de l'écran et la feuille l'autre |
| `probe-fiche.js` | la fiche se compose — étapes choisies, rangées, réécrites — et l'aperçu est le vrai PDF |
| `probe-commandes.js` | les 246 commandes de l'interface s'exécutent sans rien casser |

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
