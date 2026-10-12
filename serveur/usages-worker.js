/* LE POINT DE CHUTE DES USAGES — Cloudflare Worker.
 *
 * GitHub Pages ne peut rien dire de son propre trafic : c'est de l'hébergement
 * statique, sans journal d'accès. Il faut donc un endroit à soi où les relevés
 * arrivent. Celui-ci tient en une page, se déploie gratuitement, et n'a besoin
 * de rien d'autre qu'un espace clé-valeur.
 *
 * DEUX ROUTES, ET C'EST TOUT.
 *
 *   POST /            un relevé arrive. On le range sous l'identifiant de
 *                     l'installation, en écrasant le précédent.
 *   GET  /?k=SECRET   on lit l'agrégat.
 *
 * POURQUOI ÉCRASER ? Parce que les compteurs du logiciel sont CUMULATIFS : le
 * dernier relevé d'une installation contient toute son histoire. Il n'y a donc
 * rien à accumuler ici, rien à dédupliquer, et la base ne grossit qu'avec le
 * nombre d'installations — pas avec le temps.
 *
 * UNE CLÉ N'EST PAS UNE PERSONNE, et ce fichier a longtemps écrit le contraire :
 * « le nombre de clés EST le nombre d'utilisateurs ». C'était faux dans les deux
 * sens, et le relevé le répétait en toutes lettres à qui le lisait.
 *
 *   UNE PERSONNE, PLUSIEURS CLÉS. L'identité tient dans un localStorage, cloisonné
 *   par navigateur, par profil et par adresse. Le poste de classe, l'ordinateur de
 *   la maison et le téléphone font trois clés ; Chrome et Firefox sur la même
 *   machine en font deux ; vider les données du site en fabrique une neuve, et le
 *   navigateur peut l'effacer tout seul. Rien ne les recoupe — et c'est voulu :
 *   le relevé ne transporte ni adresse IP, ni empreinte, ni compte.
 *
 *   PLUSIEURS PERSONNES, UNE CLÉ. Un tableau blanc de salle utilisé par six
 *   professeurs, un ordinateur de classe, une session partagée : une seule clé.
 *   Et quand le navigateur refuse le stockage, le logiciel se rabat sur
 *   l'identifiant « anonyme » — toutes ces installations se rangent alors sous
 *   la MÊME clé, et seuls les compteurs de la dernière arrivée survivent.
 *
 * ET LA BASE NE DÉCROÎT JAMAIS : aucune clé n'expire ni n'est supprimée. Le
 * total est un cumul depuis la mise en service, pas une population. Seule la
 * ligne « ayant servi ces 30 derniers jours » est bornée dans le temps.
 *
 * ------------------------------------------------------------------
 * POSE
 *
 *   1. npm install -g wrangler   (une fois)
 *   2. wrangler kv namespace create USAGES
 *      → recopier l'id dans wrangler.toml
 *   3. wrangler secret put CLE_LECTURE
 *      → choisir un mot de passe : c'est lui qui protège la lecture
 *   4. wrangler deploy
 *   5. mettre l'adresse obtenue dans window.GM_USAGES_URL, dans index.html
 *
 * Lecture : https://…workers.dev/?k=VOTRE_CLE
 * ------------------------------------------------------------------
 */

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(requete, env) {
        const url = new URL(requete.url);

        if (requete.method === 'OPTIONS') {
            return new Response(null, { headers: CORS });
        }

        /* --- Un relevé arrive ------------------------------------------- */
        if (requete.method === 'POST') {
            let p;
            try { p = await requete.json(); } catch (e) { return rep('json illisible', 400); }
            const id = String(p.installation || '').slice(0, 64);
            if (!id) return rep('sans identifiant', 400);
            /* On garde ce qui sert et rien d'autre : pas d'adresse IP, pas
               d'en-têtes, pas de date plus fine que le jour. */
            const propre = {
                version: str(p.version), jour: str(p.jour),
                depuis: str(p.depuis), dernier: str(p.dernier),
                langue: str(p.langue),
                ouvertures: nombre(p.ouvertures),
                visite: nombre(p.visite),
                ecrans: table(p.ecrans), outils: table(p.outils),
                magies: table(p.magies), instruments: table(p.instruments),
                exports: table(p.exports),
                consignes: { ok: nombre(p.consignes && p.consignes.ok),
                             rate: nombre(p.consignes && p.consignes.rate) },
                incomprises: table(p.incomprises, 100),
                recu: new Date().toISOString().slice(0, 10),
            };
            await env.USAGES.put('u:' + id, JSON.stringify(propre));
            return rep('ok');
        }

        /* --- On lit l'agrégat ------------------------------------------- */
        if (requete.method === 'GET') {
            if (!env.CLE_LECTURE || url.searchParams.get('k') !== env.CLE_LECTURE) {
                return rep('non', 403);
            }
            const total = {
                installations: 0, ouvertures: 0, visites: 0,
                consignes: { ok: 0, rate: 0 },
                versions: {}, ecrans: {}, outils: {}, magies: {},
                instruments: {}, exports: {}, incomprises: {},
                actifs30j: 0,
            };
            /* TRENTE DATES, PAS TRENTE ET UNE. En retranchant 30 jours puis en
               tronquant au jour, la borne tombe sur J-30 ; et la comparaison étant
               un « >= », elle INCLUT ce jour-là. Cela faisait 31 dates distinctes
               sous une phrase qui en annonce 30. On retranche donc 29 : aujourd'hui
               plus les 29 jours précédents, c'est exactement ce que dit la phrase. */
            const limite = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);
            let curseur;
            do {
                const lot = await env.USAGES.list({ prefix: 'u:', cursor: curseur });
                for (const c of lot.keys) {
                    const brut = await env.USAGES.get(c.name);
                    if (!brut) continue;
                    let d; try { d = JSON.parse(brut); } catch (e) { continue; }
                    total.installations++;
                    if ((d.dernier || '') >= limite) total.actifs30j++;
                    total.ouvertures += d.ouvertures || 0;
                    total.visites += d.visite || 0;
                    total.consignes.ok += (d.consignes && d.consignes.ok) || 0;
                    total.consignes.rate += (d.consignes && d.consignes.rate) || 0;
                    ajouter(total.versions, { [d.version || '?']: 1 });
                    ['ecrans', 'outils', 'magies', 'instruments', 'exports', 'incomprises']
                        .forEach(r => ajouter(total[r], d[r]));
                }
                curseur = lot.list_complete ? null : lot.cursor;
            } while (curseur);

            if (url.searchParams.get('format') === 'json') {
                return new Response(JSON.stringify(total, null, 1),
                    { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
            }
            return new Response(enClair(total),
                { headers: { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' } });
        }

        return rep('méthode inconnue', 405);
    },
};

/* --- petites mains ------------------------------------------------------ */
const rep = (m, code = 200) =>
    new Response(m, { status: code, headers: CORS });
const str = (v) => typeof v === 'string' ? v.slice(0, 40) : '';
const nombre = (v) => Number.isFinite(+v) ? Math.max(0, Math.min(1e7, Math.round(+v))) : 0;
const table = (o, max = 60) => {
    const r = {};
    if (!o || typeof o !== 'object') return r;
    Object.keys(o).slice(0, max).forEach(k => { r[String(k).slice(0, 120)] = nombre(o[k]); });
    return r;
};
const ajouter = (cible, source) => {
    if (!source) return;
    Object.entries(source).forEach(([k, v]) => { cible[k] = (cible[k] || 0) + (+v || 0); });
};
const enClair = (t) => {
    const bloc = (titre, o, n = 40) => {
        const r = Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);
        return r.length ? `\n${titre}\n` + r.map(([k, v]) => `  ${v}× ${k}`).join('\n') + '\n' : '';
    };
    let s = 'GÉOMASTER — usages\n\n';
    s += `${t.installations} installation(s) — un navigateur sur un appareil, pas une personne\n`;
    s += `dont ${t.actifs30j} ayant servi ces 30 derniers jours\n`;
    s += `${t.ouvertures} chargement(s) de page\n`;
    s += `consignes : ${t.consignes.ok} faites, ${t.consignes.rate} refusées\n`;
    s += `visite guidée : ${t.visites} fois\n`;
    s += bloc('VERSIONS', t.versions);
    s += bloc('ÉCRANS', t.ecrans);
    s += bloc('OUTILS', t.outils);
    s += bloc('CONSTRUCTIONS MAGIQUES', t.magies);
    s += bloc('INSTRUMENTS', t.instruments);
    s += bloc('EXPORTS', t.exports);
    s += bloc('PHRASES NON COMPRISES', t.incomprises, 80);
    /* CE QUE CES CHIFFRES NE COMPTENT PAS. Sans cette note, « 323 » se cite comme
       « 323 professeurs », et c'est faux des deux côtés à la fois. Elle est écrite
       ici plutôt que dans un fichier d'à côté parce que c'est ICI qu'on lit le
       relevé — une mise en garde qu'il faut aller chercher ne sert à rien. */
    s += '\nCE QUE CES CHIFFRES NE COMPTENT PAS\n'
       + "  · l'usage hors connexion : clé USB, fichier local, salle sans réseau\n"
       + '  · les élèves qui ouvrent le lien de partage — zéro, par construction\n'
       + "  · le logiciel affiché dans un cadre (ENT, Moodle, aperçu)\n"
       + '  · une visite de moins de huit secondes\n'
       + "  · ce qu'une installation fait le jour où elle sert pour la dernière\n"
       + '    fois : le relevé part au début de la journée, pas à la fin\n'
       + 'ET UNE INSTALLATION NE DISPARAÎT JAMAIS : le total ne peut que monter.\n';
    return s;
};
