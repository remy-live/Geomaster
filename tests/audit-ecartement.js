/* ON NE REPORTE QUE CE QU'ON A D'ABORD PRIS.
 *
 * « Pour la translation, il manque à un moment le fait que le compas prend
 * l'écartement entre l'origine du vecteur et le point dont on veut faire
 * l'image. »
 *
 * C'est le geste fondateur du compas, et il est en deux temps : on POSE la
 * pointe sur un point, la mine sur un autre — voilà l'écartement, et il vaut une
 * longueur qui existe sur la figure — puis on PORTE ce même écartement ailleurs.
 * Le second geste ne se justifie que par le premier. Un compas qui s'ouvre tout
 * seul au centre de l'arc qu'il va tracer fait apparaître une longueur venue de
 * nulle part : c'est un tour de passe-passe, pas une construction.
 *
 * L'audit applique donc UNE règle à toutes les figures :
 *
 *   Chaque fois que l'écartement du compas CHANGE, il doit changer à un endroit
 *   où la longueur existe — la pointe sur un point de la figure, la mine sur un
 *   autre, à la bonne distance et dans la bonne direction.
 *
 * Garder l'écartement pour reporter dix fois est légitime — c'est même tout
 * l'intérêt. Ce qui ne l'est pas, c'est de l'obtenir sans le prendre.
 */
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);

    const rapport = await page.evaluate(() => {
        const app = window.app;

        /* La règle, appliquée à une feuille déjà construite. */
        const examiner = () => {
            const pts = app.entities.filter(e => e instanceof Point);
            const fautes = [];
            const mesures = [];
            let ecartement = null;
            app.entities.forEach((e, i) => {
                if (!(e instanceof ToolAnimation)) return;
                if (e.widgetType !== 'compass') return;
                const fin = e.endState || {};
                if (typeof fin.radius !== 'number' || fin.radius <= 0) return;
                if (ecartement !== null && Math.abs(fin.radius - ecartement) < 1) return;
                /* L'écartement change ici : il doit se PRENDRE sur la figure —
                   ou être DÉCLARÉ réglé sur la règle graduée, ce qui est l'autre
                   geste légitime, celui d'une longueur donnée par l'énoncé. */
                const r = fin.radius;
                if (e.ecartementMesure) { mesures.push(Math.round(r)); ecartement = r; return; }
                if (e.ecartementDeclare) { mesures.push(e.ecartementDeclare); ecartement = r; return; }
                const pointe = pts.find(p => Math.hypot(p.x - fin.x, p.y - fin.y) < 3);
                let pris = false;
                if (pointe) {
                    pris = pts.some((q) => {
                        if (q === pointe) return false;
                        const d = Math.hypot(q.x - pointe.x, q.y - pointe.y);
                        if (Math.abs(d - r) > 1.5) return false;
                        if (typeof fin.angle !== 'number') return true;
                        const a = Math.atan2(q.y - pointe.y, q.x - pointe.x);
                        const ec = Math.abs(((a - fin.angle) * 180 / Math.PI + 540) % 360 - 180);
                        return ec < 8;
                    });
                }
                if (!pris) {
                    fautes.push({ i, r: Math.round(r),
                                  ou: pointe ? (pointe.label || 'un point') : 'nulle part',
                                  depuis: ecartement === null ? 'fermé' : Math.round(ecartement) });
                }
                ecartement = r;
            });
            /* ET L'ARC S'AFFICHE LÀ OÙ LE COMPAS L'A TRACÉ. Le geste et la
               trace sont deux objets distincts : rien n'oblige le second à suivre
               le premier, et c'est arrivé — l'écartement de la médiatrice porté à
               AB pendant que le rapport qui recalcule l'arc restait à 0,7 × AB.
               Le compas tournait à un rayon, l'arc s'affichait à un autre. */
            const decales = [];
            app.entities.forEach((e, i) => {
                if (!(e instanceof ToolAnimation) || e.widgetType !== 'compass') return;
                if (e.originalType !== 'trace') return;
                let suite = null;
                for (let j = i + 1; j < Math.min(i + 4, app.entities.length); j++) {
                    const q = app.entities[j];
                    if (q instanceof CompassArc || q instanceof Arc || q instanceof Circle) { suite = q; break; }
                }
                if (!suite) return;
                const c = suite.center || suite.p1;
                if (!c) return;
                const R = (suite instanceof Circle)
                    ? Math.hypot(suite.p2.x - c.x, suite.p2.y - c.y) : suite.radius;
                const dc = Math.hypot(c.x - e.endState.x, c.y - e.endState.y);
                const dr = Math.abs(R - (e.endState.radius || 0));
                if (dc > 1 || dr > 1) decales.push({ centre: Math.round(dc), rayon: Math.round(dr),
                    compas: Math.round(e.endState.radius || 0), arc: Math.round(R) });
            });
            return { fautes, mesures, decales };
        };

        const poser = (pose) => {
            if (app.stopAnimation) app.stopAnimation();
            app.entities = []; app.historyPast = []; app.stepInstructions = {};
            if (app.cslOublier) app.cslOublier();
            const P = {};
            const m = (n, x, y) => { P[n] = new Point(x, y, n); app.addEntity(P[n]); return P[n]; };
            if (pose === 'vide') return P;
            m('A', 480, 620); m('B', 720, 620);
            if (pose === 'segment') {
                P.seg = new Segment(P.A, P.B, { color: '#000', width: 2 });
                app.addEntity(P.seg);
            }
            if (pose === 'trois' || pose === 'figure') m('C', 700, 400);
            if (pose === 'figure') { m('D', 500, 800); m('O', 950, 520); }
            if (pose === 'axe') {
                const a1 = new Point(950, 300, ''), a2 = new Point(950, 850, '');
                app.addEntity(a1); app.addEntity(a2);
                P.axe = new Line(a1, a2, { color: '#000', width: 2 });
                app.addEntity(P.axe);
            }
            return P;
        };

        const MAGIQUES = [
            ['triangle équilatéral', 'segment', (P) => app.buildEquilateralTriangle(P.seg, 0, 0)],
            ['médiatrice', 'deux', (P) => app.buildMediatrice(null, 0, 0, P.A, P.B)],
            ['carré', 'segment', (P) => app.buildSquare(P.seg, 0, 0)],
            ['hexagone', 'segment', (P) => app.buildHexagon(P.seg, 0, 0)],
            ['pentagone régulier', 'segment', (P) => app.buildRegularPentagon(P.seg, 0, 0)],
            ['losange', 'segment', (P) => app.buildRhombus(P.seg, 0, 0)],
            ['hexagramme', 'segment', (P) => app.buildHexagram(P.seg, 0, 0)],
            ['rosace', 'deux', (P) => app.buildRosette(null, 0, 0, P.A, P.B)],
            ['graine de vie', 'deux', (P) => app.buildSeedOfLife(null, 0, 0, P.A, P.B)],
            ['yin-yang', 'deux', (P) => app.buildYinYang(null, 0, 0, P.A, P.B)],
            ['octogramme', 'deux', (P) => app.buildOctagram(null, 0, 0, P.A, P.B)],
            ['escargot de Pythagore', 'deux', (P) => app.buildPythagorasSnail(null, 0, 0, P.A, P.B)],
            ['parallélogramme', 'trois', (P) => app.buildParallelogram(P.A, P.B, P.C)],
            ['rectangle', 'trois', (P) => app.buildRectangle(P.A, P.B, P.C)],
            ['bissectrice', 'trois', (P) => app.buildBisector(P.A, P.B, P.C)],
            ['cercle circonscrit', 'trois', (P) => app.buildCircumscribedCircle(P.A, P.B, P.C)],
            ['symétrie centrale', 'figure', (P) => app.buildSymCentrale(P.A, P.O)],
            ['symétrie axiale', 'axe', (P) => app.buildSymAxiale([P.A], P.axe)],
            ['translation', 'figure', (P) => app.buildTranslation([P.A], P.D, P.O)],
            ['rotation', 'figure', (P) => app.buildRotation([P.A], P.O, 40, 1)],
            ['homothétie', 'figure', (P) => app.buildHomothetie([P.A], P.O, 2)],
        ];

        const sortie = { magiques: [], consignes: [] };
        MAGIQUES.forEach(([nom, pose, bati]) => {
            const P = poser(pose);
            try { bati(P); } catch (e) { sortie.magiques.push({ nom, erreur: e.message }); return; }
            if (app.stopAnimation) app.stopAnimation();
            sortie.magiques.push(Object.assign({ nom }, examiner()));
        });

        /* Les consignes qui sortent le compas, jouées AVEC les instruments. */
        const PHRASES = [
            'Trace un triangle équilatéral ABC de 4 cm de côté',
            'Trace un hexagone régulier de 3 cm',
            'Trace la médiatrice de [AB]',
            'Trace une rosace',
            'Trace une rosace de 4 cm',
            'Trace une étoile à 5 branches',
            'Trace une étoile à 6 branches',
            'Trace une étoile à 12 branches',
            'Trace un hexagone inscrit dans un cercle de rayon 3 cm',
            'Trace un carré inscrit dans un cercle de rayon 3 cm',
            'Trace un triangle équilatéral inscrit dans un cercle de rayon 3 cm',
            'Trace un chat',
            'Trace un panda',
            'Trace un cœur',
            'Trace une spirale du carré',
            'Reporte la longueur AB à partir de C',
            'Trace le symétrique de A par rapport au point B',
            'Trace un losange ABCD de 4 cm de côté',
        ];
        PHRASES.forEach((ph) => {
            /* Feuille VIDE : une consigne pose ses propres points. Deux points
               posés d'avance à 240 px l'un de l'autre faisaient croire à un
               écartement injustifié là où le compas prenait tranquillement les
               4 cm qu'il venait de placer. */
            poser(/\[AB\]/.test(ph) ? 'deux' : 'vide');
            let r;
            try { r = app.executerConsigneAvec(ph, true); }
            catch (e) { sortie.consignes.push({ ph, erreur: e.message }); return; }
            if (!r || !r.ok) { sortie.consignes.push({ ph, refuse: (r && r.message) || 'refusée' }); return; }
            sortie.consignes.push(Object.assign({ ph }, examiner()));
        });
        return sortie;
    });

    let rate = 0;
    const bloc = (titre, liste, cle) => {
        console.log('\n=== ' + titre + ' ===');
        liste.forEach((x) => {
            const nom = x[cle];
            if (x.erreur) { console.log('  \x1b[31m!\x1b[0m ' + nom + ' — ' + x.erreur); rate++; return; }
            if (x.refuse) { console.log('  · ' + nom + ' — refusée, non jugée'); return; }
            const dit = x.mesures && x.mesures.length
                ? '   (' + x.mesures.length + ' écartement(s) déclarés : '
                  + [...new Set(x.mesures.map(m => typeof m === 'string' ? m : 'réglé à la règle'))]
                    .join(' ; ') + ')' : '';
            const dec = x.decales || [];
            if (dec.length) {
                rate += dec.length;
                console.log('  \x1b[31m✗\x1b[0m ' + nom + ' — ' + dec.length
                    + ' arc(s) affichés ailleurs que là où le compas les a tracés :');
                dec.slice(0, 3).forEach(d => console.log('        compas ' + d.compas
                    + ' px, arc ' + d.arc + ' px ; centre décalé de ' + d.centre + ' px'));
            }
            if (!x.fautes.length) { if (!dec.length) console.log('  \x1b[32m✓\x1b[0m ' + nom + dit); return; }
            rate += x.fautes.length;
            console.log('  \x1b[31m✗\x1b[0m ' + nom + ' — ' + x.fautes.length
                + ' écartement(s) pris nulle part :');
            x.fautes.slice(0, 4).forEach(f => console.log('        ouverture ' + f.depuis
                + ' → ' + f.r + ' px, sur ' + f.ou));
        });
    };
    bloc('les constructions magiques', rapport.magiques, 'nom');
    bloc('les consignes au compas', rapport.consignes, 'ph');

    if (erreurs.length) { console.log('\n  ! erreurs de page : ' + erreurs.slice(0, 3).join(' | ')); rate++; }

    await nav.close();
    console.log('\n' + (rate ? '=== ' + rate + ' écartement(s) sortis de nulle part ===' : '=== tout tient ==='));
    process.exit(rate ? 1 : 0);
})();
