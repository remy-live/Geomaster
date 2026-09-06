/* LES SOMMETS D'UNE ÉTOILE SE CONSTRUISENT, ILS NE SE PLACENT PAS.
 *
 * « Pour les étoiles, les points sont placés sur le cercle mais arbitrairement,
 * pas en utilisant le compas et les arcs de cercle. »
 *
 * C'était exactement cela. Les sommets dépendaient bien du cercle — ils y
 * glissaient quand on le déplaçait — mais leur position venait d'une seule
 * ligne :
 *
 *     const ang = -Math.PI / 2 + k * 2 * Math.PI / n;
 *
 * Une division de 2π. Rien sur la feuille ne disait d'où ils sortaient, et l'on
 * ne pouvait pas refaire le geste : c'est un dessin qui a l'air juste, pas une
 * construction.
 *
 * Deux gestes suffisent à presque tout, et ce sont ceux qu'on fait à la main :
 * REPORTER l'écartement de proche en proche — le rayon se reporte six fois
 * exactement — et COUPER UN ARC EN DEUX par la médiatrice de sa corde, qui passe
 * par le centre. De six on passe à douze, de quatre à huit, de cinq à dix. Le
 * côté du pentagone, lui, se construit au nombre d'or.
 *
 * Ce qui ne se construit pas ainsi ne se construit pas du tout : sept, neuf et
 * onze parts sont IMPOSSIBLES à la règle et au compas — Gauss et Wantzel l'ont
 * démontré. Le logiciel le dit et sort le rapporteur, au lieu de faire semblant.
 *
 * La sonde vérifie les trois choses qui font la différence :
 *   1. chaque sommet est le CROISEMENT d'un arc de compas (ou d'une médiatrice)
 *      avec le cercle — pas un point posé ;
 *   2. la figure TIENT quand on agrandit le cercle et quand on le déplace : les
 *      écarts restent exactement 360°/n. Mesuré avant que les arcs de report ne
 *      soient croisés comme les cercles qu'ils sont, une étoile à douze branches
 *      déplacée de 70 px perdait trois sommets et ses écarts passaient de 30° à
 *      15°–60° ;
 *   3. et pour sept branches, on ANNONCE que ce n'est pas constructible.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);

    const r = await page.evaluate(() => {
        const app = window.app;
        const sortie = [];
        [5, 6, 7, 8, 10, 12].forEach((n) => {
            app.entities = []; app.historyPast = [];
            if (app.cslOublier) app.cslOublier();
            let rep;
            try { rep = app.executerConsigneAvec('Trace une étoile à ' + n + ' branches', false); }
            catch (e) { sortie.push({ n, erreur: e.message }); return; }
            const cercle = app.entities.find(e => e instanceof Circle);
            if (!cercle) { sortie.push({ n, erreur: 'pas de cercle' }); return; }
            const O = cercle.p1, bord = cercle.p2;

            const mesurer = () => {
                const R = Math.hypot(bord.x - O.x, bord.y - O.y);
                const S = app.entities.filter(e => e instanceof Point && e.label
                    && e.visible !== false && e !== O
                    && Math.abs(Math.hypot(e.x - O.x, e.y - O.y) - R) < 0.5);
                const a = S.map(q => Math.atan2(q.y - O.y, q.x - O.x)).sort((u, v) => u - v);
                const ec = a.map((x, i) =>
                    ((a[(i + 1) % a.length] - x + Math.PI * 4) % (Math.PI * 2)) * 180 / Math.PI);
                return { combien: S.length,
                         mini: Math.round(Math.min(...ec) * 100) / 100,
                         maxi: Math.round(Math.max(...ec) * 100) / 100 };
            };

            /* Chaque sommet est-il un CROISEMENT ? Le tout premier point du tour
               est posé sur le cercle — il faut bien commencer quelque part — mais
               tous les autres doivent naître d'un arc de compas ou d'une
               médiatrice. */
            const R0 = Math.hypot(bord.x - O.x, bord.y - O.y);
            const S0 = app.entities.filter(e => e instanceof Point && e.label
                && e.visible !== false && e !== O
                && Math.abs(Math.hypot(e.x - O.x, e.y - O.y) - R0) < 0.5);
            const croises = S0.filter(q => (q.parents || []).length === 2
                && (q.parents || []).some(x => x instanceof CompassArc
                    || x instanceof Segment || x instanceof Line)).length;

            const avant = mesurer();
            bord.x = O.x + (bord.x - O.x) * 1.45;
            bord.y = O.y + (bord.y - O.y) * 1.45;
            app.updateDependents();
            const grand = mesurer();
            const dx = -70, dy = 55;
            O.x += dx; O.y += dy;
            if (app.emporterRayons) app.emporterRayons(O, dx, dy);
            app.updateDependents();
            const bouge = mesurer();

            sortie.push({ n, croises, total: S0.length, avant, grand, bouge,
                          astuce: (rep && rep.astuce) || '' });
        });
        return sortie;
    });

    console.log('\n=== les sommets sont des croisements, pas des positions ===');
    r.forEach((x) => {
        if (x.erreur) { ck(x.n + ' branches', false, x.erreur); return; }
        if (x.n === 7) {
            /* Sept parts ne se construisent pas : les sommets sont au rapporteur,
               et c'est justement ce qu'il faut ANNONCER. */
            ck('sept branches : on annonce que ce n\'est pas constructible',
               /Wantzel/.test(x.astuce) && /RAPPORTEUR/.test(x.astuce),
               x.astuce.split('. ').slice(-1)[0]);
            return;
        }
        ck(x.n + ' branches : tous construits sauf le point de départ',
           x.croises === x.total - 1 && x.total === x.n,
           x.croises + ' croisements sur ' + x.total + ' sommets');
    });

    console.log('\n=== et la figure tient quand on change le cercle ===');
    r.forEach((x) => {
        if (x.erreur || x.n === 7) return;
        const juste = (m) => m.combien === x.n
            && Math.abs(m.maxi - m.mini) < 0.5
            && Math.abs(m.maxi - 360 / x.n) < 0.5;
        const dire = (m) => m.combien + ' sommets, ' + m.mini + '–' + m.maxi + '°';
        ck(x.n + ' branches, agrandi puis déplacé', juste(x.avant) && juste(x.grand) && juste(x.bouge),
           'au tracé ' + dire(x.avant) + ' | agrandi ' + dire(x.grand)
           + ' | déplacé ' + dire(x.bouge));
    });

    console.log('\n=== la bulle dit COMMENT le cercle a été partagé ===');
    const attendu = { 5: /NOMBRE D'OR/, 6: /SIX FOIS/, 8: /médiatrice/,
                      10: /NOMBRE D'OR/, 12: /six fois/ };
    r.forEach((x) => {
        if (x.erreur || x.n === 7) return;
        ck(x.n + ' branches', attendu[x.n].test(x.astuce),
           x.astuce.split('. ').slice(-1)[0].slice(0, 110));
    });

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
