# De quoi parler de GéoMaster

Tout ce qui suit est à recopier tel quel. L'adresse est toujours la même :
**https://remy-live.github.io/Geomaster/**

---

## En une phrase

> GéoMaster est un logiciel de géométrie pour le collège : on écrit la consigne
> en français, la figure se construit à la règle et au compas. Un seul fichier
> HTML, sans installation, sans compte, qui marche hors connexion.

## En trois cents caractères (pour un référencement, Édubase par exemple)

> Logiciel de géométrie pour le collège, en un seul fichier HTML. On écrit
> l'énoncé en français — « Trace un triangle ABC tel que AB = 5 cm » — et la
> figure se construit aux instruments, étape par étape. Règle, équerre, compas
> et rapporteur manipulables. Partage par lien. Sans installation ni compte,
> fonctionne hors connexion. Gratuit.

## Les faits, pour une fiche

| | |
|---|---|
| **Niveau** | 6e à 3e |
| **Notions** | constructions à la règle et au compas, médiatrice, bissectrice, symétries, transformations, solides et patrons, configurations d'angles, repère |
| **Technique** | un fichier HTML, aucune dépendance à charger, fonctionne hors connexion |
| **Vie privée** | aucun compte, aucune donnée personnelle, rien n'est envoyé |
| **Prix** | gratuit |
| **Licence** | Creative Commons BY-NC-SA 4.0 — usage pédagogique libre, y compris modifié |
| **Code source** | https://github.com/remy-live/Geomaster |

---

## Courriel à l'interlocuteur académique au numérique (IAN) de maths

> **Objet : GéoMaster — un logiciel de géométrie en un fichier, pour le collège**
>
> Bonjour,
>
> Je suis professeur de mathématiques et j'ai développé **GéoMaster**, un
> logiciel de géométrie pour le collège que j'utilise dans mes classes.
>
> Sa particularité : **on écrit la consigne en français et la figure se
> construit**. Taper « Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et
> BC = 3 cm » suffit ; le logiciel la trace, et peut la rejouer **aux
> instruments**, étape par étape, comme on le ferait au tableau. La règle,
> l'équerre, le compas et le rapporteur se manipulent vraiment.
>
> Côté pratique, il tient dans **un seul fichier HTML** : aucune installation,
> aucun compte, aucune donnée collectée, et il fonctionne **hors connexion** —
> ce qui règle beaucoup de problèmes sur les machines d'établissement. Le
> partage d'une figure se fait par un simple lien.
>
> Il est gratuit et sous licence Creative Commons BY-NC-SA.
>
> **À essayer directement : https://remy-live.github.io/Geomaster/**
>
> Si cela vous paraît utile aux collègues de l'académie, je serais heureux d'en
> parler, de le présenter, ou d'en animer une formation.
>
> Bien cordialement,
> Rémy Devoddere

---

## Message court (groupe de collègues, réseaux)

> J'ai fait un logiciel de géométrie pour le collège : on écrit l'énoncé en
> français, il trace la figure — et il peut la refaire **aux instruments**,
> étape par étape, comme au tableau. Un seul fichier, pas d'installation, pas
> de compte, ça marche hors connexion.
>
> https://remy-live.github.io/Geomaster/

## Encore plus court

> On tape « Trace un triangle ABC tel que AB = 5 cm », il le trace — au compas,
> étape par étape. Sans installation ni compte, hors connexion.
> https://remy-live.github.io/Geomaster/

---

## Des clips tout faits

Trois vidéos, une par pilier, dans `vitrine/`. Elles sont filmées **sur le
logiciel lui-même** : rien n'est reconstitué, pas un plan n'est monté. La
pastille bleue marque le pointeur : elle est là pour qu'on voie où la main
agit.

| Clip | Durée | Ce qu'on y voit |
|---|---|---|
| `consigne.mp4` | 12 s | On tape *« Trace un triangle ABC tel que AB = 7 cm, AC = 6 cm et BC = 5 cm »*, puis deux consignes de plus : les médiatrices, le cercle circonscrit. |
| `instruments.mp4` | 17 s | Le compas arrive, se plante sur A, s'écarte, pivote, trace ; se replante sur B, retrace. Les deux arcs se coupent : la médiatrice. |
| `animation.mp4` | 21 s | La figure finie se rembobine et se refait toute seule, à la règle et au compas, jusqu'au cercle circonscrit. |

Chacune existe en **16/9** (1280 × 720, pour une page ou une chaîne) et en
**carré** (1080 × 1080, suffixe `-carre`, pour un fil). `compas.gif` est les dix
secondes du compas, en boucle, pour un message où la vidéo ne passe pas.

**Pour les refaire** quand l'interface aura changé — sans quoi ces clips
vieilliraient en silence — `vitrine/film.js` les retourne :

```
GM_FFMPEG=/chemin/vers/ffmpeg node vitrine/film.js instruments
```

Il pilote la vraie page, rejoue les mêmes gestes, et **refuse de filmer un geste
dans le vide** : avant chaque prise il vérifie que le point visé tombe bien sur
la toile, et s'arrête en le disant si ce n'est pas le cas. Il lui faut un vrai
`ffmpeg` : celui qu'embarque Playwright ne sait faire que du WebM.

**Pour accompagner un clip**, la légende la plus courte est la meilleure :

> Le compas se plante, s'écarte, pivote et trace. Pas une animation : l'outil.
> https://remy-live.github.io/Geomaster/

> On écrit l'énoncé en français. La figure se construit.
> https://remy-live.github.io/Geomaster/

> Appuyez sur ▶ : la figure se refait toute seule, étape par étape, aux
> instruments. https://remy-live.github.io/Geomaster/

---

## Ce qu'il faut montrer en premier

Dans l'ordre, ce sont les trois choses qui font comprendre le logiciel en vingt
secondes :

1. **Écrire une phrase et voir la figure se faire.** C'est l'argument qui n'a
   pas d'équivalent ailleurs.
2. **Cocher « avec les instruments »** et regarder le compas s'écarter, se
   planter et tracer. C'est ce qui distingue GéoMaster d'un logiciel de
   géométrie dynamique : il montre le geste.
3. **Partager la figure par un lien** — l'élève l'ouvre sans rien installer.

La visite guidée du logiciel (bouton `?`, onglet « Démonstration ») fait
exactement cette démonstration, en douze étapes et trois minutes, sur une vraie
feuille.

---

## À ne pas oublier

- Les images **et les vidéos** de `vitrine/` sont libres de reprise pour en
  parler.
- `vitrine/partage.png` est l'image d'aperçu du lien ; c'est aussi la bonne
  image à déposer en **aperçu social** du dépôt GitHub
  (Settings → General → Social preview).
