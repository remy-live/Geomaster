/* LE RELEVÉ DIT-IL CE QU'IL COMPTE ?
 *
 * « 323 utilisateur(s), dont 284 actif(s) ces 30 derniers jours — ça veut dire
 *   des utilisateurs différents ? »
 *
 * NON, ET LE RELEVÉ L'AFFIRMAIT POURTANT. Le serveur range un relevé par clé,
 * et la clé est un identifiant tiré au hasard, rangé dans le localStorage du
 * navigateur. Le fichier du serveur écrivait noir sur blanc « le nombre de clés
 * EST le nombre d'utilisateurs », et le relevé imprimait « utilisateur(s) ».
 * C'est faux DANS LES DEUX SENS :
 *
 *   UNE PERSONNE, PLUSIEURS CLÉS — le poste de classe, l'ordinateur de la maison
 *   et le téléphone en font trois ; Chrome et Firefox sur la même machine, deux ;
 *   vider les données du site en fabrique une neuve.
 *   PLUSIEURS PERSONNES, UNE CLÉ — un tableau de salle partagé par six
 *   professeurs n'en fait qu'une ; et quand le navigateur refuse le stockage,
 *   toutes les installations se rangent sous la MÊME clé « anonyme ».
 *
 * CETTE SONDE EST LA PREMIÈRE À EXÉCUTER LE SERVEUR. probe-usages.js tient le
 * côté logiciel — ce qui se compte sur la machine, et ce qui ne part pas. Le
 * Worker, lui, n'avait jamais été exécuté par personne : la phrase que lit le
 * professeur était la seule ligne du projet que rien ne vérifiait. On le charge
 * donc pour de vrai, dans un bac à sable, avec un faux espace clé-valeur, et
 * l'on exerce ses deux routes.
 *
 * TROIS CHOSES SE VÉRIFIENT.
 *
 * 1. LE MOT. Le relevé dit « installation(s) », et dit ce qu'une installation
 *    est. Un chiffre juste sous un mot faux reste un mensonge.
 * 2. LES TRENTE JOURS EN FONT TRENTE. La borne était obtenue en retranchant
 *    30 jours puis en tronquant au jour, et la comparaison est un « >= » :
 *    cela faisait 31 dates distinctes sous une phrase qui en annonce 30.
 * 3. CE QU'UNE CLÉ RECOUVRE. Deux relevés de même identifiant ne font qu'une
 *    installation et c'est le dernier qui reste ; deux identifiants en font
 *    deux ; et « anonyme » les fond toutes en une seule — la sonde le montre
 *    au lieu de le supposer.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = path.resolve(__dirname, '..', 'serveur', 'usages-worker.js');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Le Worker est un module ES ; on le charge dans un bac à sable en détournant
   son unique export. Rien n'est écrit sur le disque, rien ne sort sur le réseau. */
function chargerWorker() {
    const src = fs.readFileSync(SOURCE, 'utf8').replace('export default {', 'globalThis.__W = {');
    if (src.indexOf('globalThis.__W') < 0) throw new Error('export default introuvable');
    const bac = vm.createContext({ Response, URL, Date, Number, Math, Object, String, JSON, console });
    vm.runInContext(src, bac);
    return bac.globalThis ? bac.globalThis.__W : bac.__W;
}

/* Un espace clé-valeur en mémoire, aux manières de Cloudflare KV. */
function fauxKV() {
    const m = new Map();
    return {
        _m: m,
        async put(k, v) { m.set(k, v); },
        async get(k) { return m.has(k) ? m.get(k) : null; },
        async list({ prefix, cursor }) {
            void cursor;
            return { keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
                     list_complete: true, cursor: null };
        },
    };
}

const jour = (decalage) => new Date(Date.now() - decalage * 864e5).toISOString().slice(0, 10);

(async () => {
    const W = chargerWorker();
    const env = { USAGES: fauxKV(), CLE_LECTURE: 'mot-de-passe-de-la-sonde' };
    const poster = (corps) => W.fetch(new Request('https://exemple/', {
        method: 'POST', body: JSON.stringify(corps) }), env);
    const lire = async (q = '') => (await W.fetch(
        new Request('https://exemple/?k=' + env.CLE_LECTURE + q), env)).text();

    /* ============================================================
       1. UNE CLÉ PAR IDENTIFIANT — ET LE DERNIER RELEVÉ GAGNE
       ============================================================ */
    console.log('\n=== une clé par identifiant ===');
    await poster({ installation: 'aaa', dernier: jour(0), ouvertures: 4,
                   consignes: { ok: 3, rate: 1 }, visite: 1 });
    await poster({ installation: 'bbb', dernier: jour(0), ouvertures: 7,
                   consignes: { ok: 2, rate: 0 }, visite: 0 });
    ck('deux identifiants, deux clés', env.USAGES._m.size === 2, env.USAGES._m.size + ' clé(s)');
    /* le même identifiant revient avec des compteurs plus gros : il écrase */
    await poster({ installation: 'aaa', dernier: jour(0), ouvertures: 9,
                   consignes: { ok: 5, rate: 1 }, visite: 1 });
    ck('  le même identifiant ne fait toujours qu\'une clé', env.USAGES._m.size === 2,
       env.USAGES._m.size + ' clé(s)');
    let t = await lire();
    ck('  et c\'est son DERNIER relevé qui compte', /16 chargement/.test(t),
       (t.match(/\d+ chargement\(s\) de page/) || ['?'])[0] + '   (9 + 7)');

    /* ============================================================
       2. LE MOT QUE LIT LE PROFESSEUR
       ============================================================ */
    console.log('\n=== le relevé dit ce qu\'il compte ===');
    ck('il parle d\'INSTALLATIONS et non d\'utilisateurs',
       /installation\(s\)/.test(t) && !/utilisateur\(s\)/.test(t),
       (t.split('\n')[2] || '').slice(0, 76));
    ck('  et il dit ce qu\'une installation est',
       /pas une personne/.test(t), (t.split('\n')[2] || '').slice(0, 76));
    ck('  « ouverture » est devenu « chargement de page »',
       /chargement\(s\) de page/.test(t) && !/^\d+ ouverture\(s\)$/m.test(t));
    for (const mot of ['hors connexion', 'lien de partage', 'cadre',
                       'huit secondes', 'DISPARAÎT JAMAIS']) {
        ck('  la note dit : ' + mot, t.includes(mot));
    }

    /* ============================================================
       3. TRENTE JOURS FONT TRENTE DATES
       La borne était J-30 avec un « >= » : trente et une dates sous une phrase
       qui en annonce trente. On pose un relevé sur chaque jour de J-0 à J-31 et
       l'on compte combien tombent dedans.
       ============================================================ */
    console.log('\n=== « ces 30 derniers jours » en fait bien trente ===');
    const env2 = { USAGES: fauxKV(), CLE_LECTURE: 'x' };
    const poster2 = (c) => W.fetch(new Request('https://exemple/', {
        method: 'POST', body: JSON.stringify(c) }), env2);
    for (let k = 0; k <= 31; k++) {
        await poster2({ installation: 'j' + k, dernier: jour(k), ouvertures: 1 });
    }
    const t2 = await (await W.fetch(new Request('https://exemple/?k=x&format=json'), env2)).json();
    ck('32 installations posées, une par jour de J-0 à J-31',
       t2.installations === 32, t2.installations + ' installation(s)');
    ck('  exactement 30 tombent dans la fenêtre', t2.actifs30j === 30,
       t2.actifs30j + ' dans les 30 derniers jours');

    /* ============================================================
       4. « ANONYME » FOND TOUT LE MONDE EN UN
       Ce n'est pas un défaut du serveur : c'est le repli du logiciel quand le
       navigateur refuse le stockage. Mais c'est le serveur qui l'additionne, et
       le relevé n'a aucun moyen de dire que cette clé-là en vaut cent.
       ============================================================ */
    console.log('\n=== le repli « anonyme » ===');
    const env3 = { USAGES: fauxKV(), CLE_LECTURE: 'x' };
    for (let k = 0; k < 5; k++) {
        await W.fetch(new Request('https://exemple/', { method: 'POST',
            body: JSON.stringify({ installation: 'anonyme', dernier: jour(0), ouvertures: 1 }) }), env3);
    }
    const t3 = await (await W.fetch(new Request('https://exemple/?k=x&format=json'), env3)).json();
    ck('cinq machines sans stockage comptent pour UNE', t3.installations === 1,
       t3.installations + ' installation(s) pour 5 envois');
    ck('  et leurs compteurs s\'écrasent au lieu de s\'ajouter', t3.ouvertures === 1,
       t3.ouvertures + ' chargement(s) pour 5 envois d\'une ouverture chacun');

    /* ============================================================
       5. LA LECTURE RESTE FERMÉE SANS LA CLÉ
       ============================================================ */
    console.log('\n=== la porte reste fermée ===');
    const sans = await W.fetch(new Request('https://exemple/'), env);
    ck('sans clé, on n\'obtient rien', sans.status === 403, 'code ' + sans.status);
    const fausse = await W.fetch(new Request('https://exemple/?k=raté'), env);
    ck('  avec une mauvaise clé non plus', fausse.status === 403, 'code ' + fausse.status);
    const vide = await W.fetch(new Request('https://exemple/', { method: 'POST', body: '{}' }), env);
    ck('  un relevé sans identifiant est refusé', vide.status === 400, 'code ' + vide.status);

    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BOUM', e); process.exit(1); });
