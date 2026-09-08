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
 * nombre d'utilisateurs — pas avec le temps. Une clé par installation, et le
 * nombre de clés EST le nombre d'utilisateurs.
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
                utilisateurs: 0, ouvertures: 0, visites: 0,
                consignes: { ok: 0, rate: 0 },
                versions: {}, ecrans: {}, outils: {}, magies: {},
                instruments: {}, exports: {}, incomprises: {},
                actifs30j: 0,
            };
            const limite = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
            let curseur;
            do {
                const lot = await env.USAGES.list({ prefix: 'u:', cursor: curseur });
                for (const c of lot.keys) {
                    const brut = await env.USAGES.get(c.name);
                    if (!brut) continue;
                    let d; try { d = JSON.parse(brut); } catch (e) { continue; }
                    total.utilisateurs++;
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
    s += `${t.utilisateurs} utilisateur(s), dont ${t.actifs30j} actif(s) ces 30 derniers jours\n`;
    s += `${t.ouvertures} ouverture(s)\n`;
    s += `consignes : ${t.consignes.ok} faites, ${t.consignes.rate} refusées\n`;
    s += `visite guidée : ${t.visites} fois\n`;
    s += bloc('VERSIONS', t.versions);
    s += bloc('ÉCRANS', t.ecrans);
    s += bloc('OUTILS', t.outils);
    s += bloc('CONSTRUCTIONS MAGIQUES', t.magies);
    s += bloc('INSTRUMENTS', t.instruments);
    s += bloc('EXPORTS', t.exports);
    s += bloc('PHRASES NON COMPRISES', t.incomprises, 80);
    return s;
};
