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
3. **Rien du tout tant que `window.GM_USAGES_URL` est vide** — l'état par défaut
   du dépôt.

## Poser le point de chute

Le serveur tient en une page et se déploie gratuitement chez **Cloudflare**
— `dash.cloudflare.com`. Le compte gratuit ne demande **pas de carte
bancaire**, et il n'y a ni domaine à acheter, ni machine à surveiller : l'offre
gratuite couvre 100 000 requêtes par jour et 1 000 écritures, soit jusqu'à mille
utilisateurs actifs quotidiens, puisque chacun n'écrit qu'une fois par jour.

Deux voies. Prenez la première si vous ne voulez rien installer.

### A. Tout dans le navigateur

Les noms exacts des menus bougent d'une refonte à l'autre chez Cloudflare ; ce
qui compte, ce sont les quatre objets à créer, et ils ne changent pas : un
**Worker**, un **espace KV**, une **liaison** nommée `USAGES`, un **secret**
nommé `CLE_LECTURE`.

1. **Créer le compte** sur `dash.cloudflare.com` (gratuit, sans carte).
2. Menu de gauche → **Workers & Pages** → **Create** → **Create Worker**.
   Nommez-le `geomaster-usages`, puis **Deploy** — il se déploie avec un code
   d'exemple, c'est normal.
3. **Edit code** : effacez tout, collez le contenu de `usages-worker.js`,
   **Deploy**.
4. **Créer l'espace de rangement** : menu de gauche → **Storage & Databases**
   → **KV** → **Create a namespace**, nommé `USAGES`.
5. **Le relier au Worker** : revenez au Worker → **Settings** → **Bindings**
   (ou *Variables*) → ajoutez une liaison **KV namespace**, avec pour nom de
   variable `USAGES`, pointant sur l'espace créé à l'étape 4. Le nom de la
   variable doit être exactement `USAGES` : c'est celui que le code appelle.
6. **Poser la clé de lecture** : même écran → ajoutez une variable
   `CLE_LECTURE`, de type **Secret**, avec le mot de passe de votre choix.
   C'est lui qui protège la lecture des statistiques.
7. Votre adresse est affichée en haut du Worker :
   `https://geomaster-usages.VOTRE-SOUS-DOMAINE.workers.dev`

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
window.GM_USAGES_URL = 'https://geomaster-usages.VOTRE-COMPTE.workers.dev';
```

## Lire

```
https://geomaster-usages.VOTRE-COMPTE.workers.dev/?k=VOTRE_CLE
```

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
