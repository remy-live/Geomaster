# Savoir ce qui sert

GitHub Pages ne peut rien vous dire de son propre trafic : c'est de
l'hébergement statique, sans journal d'accès. Et GéoMaster promet plus fort
qu'une statistique — une sonde coupe **toute** requête réseau et vérifie que la
chaîne entière marche quand même, parce que le vrai cas d'usage est un fichier
ouvert d'un double-clic depuis une clé USB, dans une salle sans internet.

D'où ce montage en deux temps : **on compte sur place**, et **le relevé remonte
une fois par jour**, seulement depuis le site publié.

## Ce qui remonte

Un objet JSON, une fois par jour au plus, par installation :

| | |
|---|---|
| `installation` | un identifiant tiré au hasard, gardé dans le navigateur. C'est lui, et lui seul, qui permet de compter des **utilisateurs** et pas seulement des visites. Il ne dit rien de personne ; deux navigateurs sur le même poste en ont deux différents |
| `version`, `langue` | la version du logiciel, la langue du navigateur |
| `ouvertures`, `depuis`, `dernier` | combien de fois il a servi, et entre quelles dates (au jour près) |
| `ecrans` | téléphone / tablette / ordinateur |
| `outils`, `magies`, `instruments`, `exports` | ce qui a été pris, et combien de fois |
| `consignes` | faites / refusées |
| `incomprises` | **les phrases que le logiciel n'a pas comprises, en clair** — la liste de ce qu'il lui reste à apprendre, écrite par ceux qui s'en servent |
| `visite` | combien de fois la visite guidée a été lancée |

Jamais de figure, jamais de nom de document, jamais d'adresse IP conservée,
jamais de date plus fine que le jour.

## Ce qui ne remonte jamais

1. **Rien depuis un fichier local** (`file://`). C'est le cas d'usage qui a fait
   ce logiciel. La sonde hors-connexion continue de tout couper et de vérifier
   que la chaîne entière marche.
2. **Rien de l'interface élève**, ni d'un aperçu affiché dans un cadre. Ce n'est
   pas d'eux qu'on parle, et ils n'ont rien demandé.
3. **Rien du tout si `window.GM_USAGES_URL` est vide.** La ligne est remplie
   depuis le 9 septembre 2026 ; la vider éteint la remontée sans rien changer
   d'autre, et les compteurs continuent de vivre sur chaque machine.

## Poser le point de chute

Le serveur tient en une page et se déploie gratuitement chez **Cloudflare**
— `dash.cloudflare.com`. Le compte gratuit ne demande **pas de carte
bancaire**, et il n'y a ni domaine à acheter, ni machine à surveiller : l'offre
gratuite couvre 100 000 requêtes par jour et 1 000 écritures, soit jusqu'à mille
utilisateurs actifs quotidiens, puisque chacun n'écrit qu'une fois par jour.

Deux voies. Prenez la première si vous ne voulez rien installer.

### A. Tout dans le navigateur

Les noms exacts des menus bougent d'une refonte à l'autre chez Cloudflare ; ce
qui compte, ce sont les **trois pièces** à poser, et elles ne changent pas :

| # | La pièce | À quoi elle sert |
|---|---|---|
| 1 | un **Worker** | reçoit les relevés, et vous récite l'agrégat |
| 2 | un **espace KV**, relié sous le nom `USAGES` | le Worker n'a aucune mémoire à lui ; le KV garde les relevés |
| 3 | un **secret** nommé `CLE_LECTURE` | sans lui, n'importe qui lirait le relevé |

1. **Créer le compte** sur `dash.cloudflare.com` (gratuit, sans carte).
2. Menu de gauche → **Workers & Pages** → **Create** → **Create Worker**.
   Acceptez le nom tiré au hasard qu'il propose, puis **Deploy** — il se déploie
   avec un code d'exemple qui répond « Hello World! », c'est normal.
3. **Edit code** : effacez tout, collez le contenu de `usages-worker.js`,
   **Deploy**. L'aperçu doit alors répondre **`non`** : c'est la bonne réponse,
   et c'est même la preuve que le code est en ligne — la route de lecture refuse
   de parler à qui ne présente pas de clé.
4. **Créer et relier le rangement** : sur la page du Worker, onglet **Bindings**
   → **Add binding** → **KV namespace** → **Add Binding**. Deux champs :
   *Variable name* = `USAGES` — **exactement ceci**, c'est le mot que le code
   prononce (`env.USAGES`) —, et *KV namespace* : la liste est vide au premier
   passage, un lien **Create** y crée l'espace.
5. **Poser la clé de lecture** : onglet **Settings** → section **Variables and
   Secrets** → **Add** → type **Secret** (pas *Text*, qui s'afficherait en
   clair), nom `CLE_LECTURE`, valeur au choix. Notez-la : Cloudflare ne la
   remontrera jamais.
6. Votre adresse est sur l'onglet **Overview**, ou derrière le bouton **Visit** :
   `https://NOM-DU-WORKER.VOTRE-SOUS-DOMAINE.workers.dev`

**Trois pièges, tous rencontrés pour de vrai :**

- Le bouton **Edit code** ouvre un éditeur qui a sa **propre** fenêtre
  *Settings* — celle de l'éditeur de texte, qui règle les couleurs et les
  raccourcis clavier. Chercher `bindings` dedans ne trouve que des
  *keybindings*. Le bon *Settings* est dans la rangée d'onglets du Worker.
- La liste des bindings propose **Secrets Store**. Ce n'est pas ça : c'est un
  coffre séparé, à créer et gérer à part. Le secret simple est sous *Settings →
  Variables and Secrets*.
- Le chemin **« créer une application depuis un dépôt GitHub »** échoue :
  il lance `npx wrangler deploy` à la racine du dépôt, où il n'y a pas de
  `wrangler.toml` — *« Required Worker name missing »* — et même en corrigeant le
  dossier il buterait sur l'`id` du KV, qui n'existe qu'une fois l'espace créé.
  Ce chemin ne sert à rien ici.

### B. En ligne de commande

```bash
npm install -g wrangler          # une fois
cd serveur

wrangler kv namespace create USAGES
#   → recopier l'identifiant renvoyé dans wrangler.toml

wrangler secret put CLE_LECTURE
#   → choisir un mot de passe : c'est lui qui protège la lecture

wrangler deploy
```

Puis, dans `index.html`, une seule ligne à remplir :

```js
window.GM_USAGES_URL = 'https://withered-waterfall-04f1.devoddere-remy.workers.dev';
```

Cette adresse est **publique par nature** — le logiciel l'appelle depuis le
navigateur de chacun — et elle ne sait qu'écrire. La clé de lecture, elle, n'est
**jamais** dans le dépôt : elle vit dans les secrets du Worker. La sonde
`probe-usages.js` relit la ligne livrée et refuse qu'elle porte le moindre `?k=`.

## Lire

```
https://VOTRE-WORKER.workers.dev/?k=VOTRE_CLE
```

La première fois, le relevé est **à zéro** — et ce zéro est la réussite : il dit
que la clé est bonne, que le rangement est branché, et qu'il est encore vide.

| Ce que vous lisez | Ce que ça veut dire |
|---|---|
| le relevé, même à zéro | tout est en place |
| `non` | la clé ne correspond pas, ou la variable ne s'appelle pas exactement `CLE_LECTURE` |
| une erreur `1101` | le rangement n'est pas branché : la variable ne s'appelle pas exactement `USAGES` |
| `Hello World!` | le code n'a pas été redéployé |

Un texte, en clair :

```
GÉOMASTER — usages

37 utilisateur(s), dont 21 actif(s) ces 30 derniers jours
1 284 ouverture(s)
consignes : 903 faites, 217 refusées
visite guidée : 44 fois

OUTILS
  512× segment
  388× point
  …

PHRASES NON COMPRISES
  14× Trace la bissectrice extérieure
  9× Trace un patron de tronc de cône
  …
```

Ajoutez `&format=json` pour l'obtenir en JSON.

## Pourquoi le serveur n'accumule rien

Les compteurs du logiciel sont **cumulatifs** : le dernier relevé d'une
installation contient toute son histoire. Le serveur écrase donc simplement
l'entrée précédente — une clé par installation. Rien à dédupliquer, rien à
purger, et la base ne grossit qu'avec le nombre d'utilisateurs, jamais avec le
temps. Le **nombre de clés est le nombre d'utilisateurs**.

## Sans serveur du tout

Si vous ne voulez rien déployer : laissez `GM_USAGES_URL` vide. Chaque
utilisateur garde ses compteurs, et le relevé se lit sur sa machine derrière la
porte dérobée — le code Konami, ou sept clics sur le numéro de version. Un lien
le copie ; il ne reste qu'à vous l'envoyer.
