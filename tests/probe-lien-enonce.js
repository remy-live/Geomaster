/* LE LIEN PORTE LA FIGURE, PAS SA RELECTURE.
 *
 * L'énoncé engendré est un TEXTE RELU sur la figure — le panneau le dit
 * lui-même : « relu sur la figure, se met à jour tout seul ». Épingler cette
 * relecture dans le code de partage, c'est figer une interprétation dans un
 * format qui ne pourra plus jamais perdre un champ.
 *
 * On avait commencé à le faire, et à moitié : sur les trois marques d'énoncé
 * ajoutées le même jour, UNE seule voyageait. Le lien rendait donc un énoncé qui
 * n'était ni celui de l'auteur ni une relecture honnête. Mesuré à l'ouverture
 * d'un lien :
 *
 *     pentagone       régulier de 5,6 cm de côté
 *                  →  tel que BC = 5,7 cm, CD = 5,6 cm, DE = 5,7 cm…
 *     circonscrit     intersection de la médiatrice de [AB] et de [BC]
 *                  →  intersection de la droite précédente et de la droite précédente
 *
 * La bonne réponse n'est pas d'emporter l'étiquette : c'est de rendre la figure
 * LISIBLE, pour que celui qui ouvre le lien retrouve l'énoncé par le même chemin
 * que celui qui l'a tracée.
 *
 *   — le pentagone perdait son « régulier » parce que l'angle de rotation était
 *     arrondi au centième de radian dans le lien : 1,25664 devenait 1,26, soit
 *     0,19° d'écart répété quatre fois. Ce n'est pas une question d'énoncé, c'est
 *     la figure elle-même qui n'arrivait pas entière ;
 *   — les points d'appui du nombre d'or portent maintenant le GRIS des traits de
 *     construction, et la couleur voyage depuis toujours ;
 *   — et la médiatrice se RECONNAÎT — perpendiculaire à [AB], passant par son
 *     milieu — au lieu de porter une étiquette.
 *
 * Reste la signature d'un motif décoratif (rosace, yin-yang, octogramme…), qui
 * ne voyage pas : rouverte par lien, la rosace redevient ce qu'elle est
 * vraiment, un cercle et six arcs. C'est moins joli, et ce n'est pas faux —
 * c'est déjà la position tenue pour les dessins au compas.
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
        const sortie = {};
        const figures = [
            ['pentagone', 'segment', (P) => app.buildRegularPentagon(P.seg, 0, 0)],
            ['hexagone', 'segment', (P) => app.buildHexagon(P.seg, 0, 0)],
            ['carré', 'segment', (P) => app.buildSquare(P.seg, 0, 0)],
            ['losange', 'segment', (P) => app.buildRhombus(P.seg, 0, 0)],
            ['triangle équilatéral', 'segment', (P) => app.buildEquilateralTriangle(P.seg, 0, 0)],
            ['cercle circonscrit', 'trois', (P) => app.buildCircumscribedCircle(P.A, P.B, P.C)],
            ['médiatrice', 'deux', (P) => app.buildMediatrice(null, 0, 0, P.A, P.B)],
        ];
        figures.forEach(([nom, pose, bati]) => {
            if (app.stopAnimation) app.stopAnimation();
            app.entities = []; app.historyPast = []; app.stepInstructions = {};
            if (app.cslOublier) app.cslOublier();
            const P = {};
            const m = (n, x, y) => { P[n] = new Point(x, y, n); app.addEntity(P[n]); return P[n]; };
            m('A', 480, 620); m('B', 720, 620);
            if (pose === 'segment') {
                P.seg = new Segment(P.A, P.B, { color: '#000', width: 2 });
                app.addEntity(P.seg);
            }
            if (pose === 'trois') m('C', 640, 380);
            try { bati(P); } catch (e) { sortie[nom] = { erreur: e.message }; return; }
            if (app.stopAnimation) app.stopAnimation();

            const avant = app.programmeDeConstruction() || [];
            const code = app.getCompressedString();
            app.entities = []; app.historyPast = [];
            app.loadFromCompressedString(code);
            const apres = app.programmeDeConstruction() || [];
            sortie[nom] = { avant, apres, octets: code.length,
                            pareil: JSON.stringify(avant) === JSON.stringify(apres) };
        });
        return sortie;
    });

    console.log('\n=== l\'énoncé survit au lien, sans voyager dedans ===');
    Object.entries(r).forEach(([nom, v]) => {
        if (v.erreur) { ck(nom, false, v.erreur); return; }
        ck(nom, v.pareil, v.pareil
            ? v.avant[v.avant.length - 1]
            : '\n      avant : ' + v.avant.join('\n              ')
              + '\n      après : ' + v.apres.join('\n              '));
    });

    console.log('\n=== et le lien ne porte AUCUNE relecture ===');
    /* La vérification qui tient tout : on relit le code de partage lui-même. S'il
       contenait une phrase d'énoncé — « médiatrice », « régulier », « rosace » —
       c'est qu'on aurait épinglé la relecture au lieu de rendre la figure lisible. */
    const code = await page.evaluate(() => {
        const app = window.app;
        if (app.stopAnimation) app.stopAnimation();
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        const A = new Point(480, 620, 'A'), B = new Point(720, 620, 'B'), C = new Point(640, 380, 'C');
        app.addEntity(A); app.addEntity(B); app.addEntity(C);
        app.buildCircumscribedCircle(A, B, C);
        if (app.stopAnimation) app.stopAnimation();
        return app.getCompressedString();
    });
    const mots = ['médiatrice', 'mediatrice', 'régulier', 'rosace', 'pentagone', 'hexagone'];
    const trouves = mots.filter(m => code.toLowerCase().includes(m));
    ck('aucun mot d\'énoncé dans le code de partage', trouves.length === 0,
       trouves.length ? 'trouvé : ' + trouves.join(', ') : code.length + ' octets');

    console.log('\n=== l\'angle d\'une rotation arrive entier ===');
    /* Deux décimales suffisent à une position, pas à un angle : le cinquième de
       tour du pentagone perdait 0,19° et le pentagone n'était plus régulier. */
    const angle = await page.evaluate(() => {
        const app = window.app;
        if (app.stopAnimation) app.stopAnimation();
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        const A = new Point(480, 620, 'A'), B = new Point(720, 620, 'B');
        app.addEntity(A); app.addEntity(B);
        const s = new Segment(A, B, { color: '#000', width: 2 });
        app.addEntity(s);
        app.buildRegularPentagon(s, 0, 0);
        if (app.stopAnimation) app.stopAnimation();
        const cotes = () => {
            const O = app.entities.find(e => e instanceof Point && e.label === 'A');
            const sur = app.entities.filter(e => e instanceof Point && e.label
                && e.visible !== false && !app.estTraceDeConstruction(e) && e !== O);
            const r = sur.map(p => Math.hypot(p.x - O.x, p.y - O.y)).filter(d => d > 1);
            return { mini: Math.min(...r), maxi: Math.max(...r) };
        };
        const avant = cotes();
        const code = app.getCompressedString();
        app.entities = []; app.historyPast = [];
        app.loadFromCompressedString(code);
        return { avant, apres: cotes() };
    });
    const ecart = Math.abs(angle.apres.maxi - angle.apres.mini);
    ck('les cinq sommets restent à la même distance du centre après le lien',
       ecart < 0.5, 'écart ' + Math.round(ecart * 100) / 100 + ' px');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
