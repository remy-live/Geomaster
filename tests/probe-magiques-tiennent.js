/* LES FIGURES MAGIQUES DOIVENT TENIR QUAND ON TIRE DESSUS.
 *
 * Une construction n'est pas une image : c'est un enchaînement de raisons. Le
 * triangle équilatéral n'est pas « trois points bien placés », c'est « C est B
 * tourné de 60° autour de A » — et cela reste vrai où qu'on mette A et B.
 *
 * Mesuré avant cette sonde, sur la même figure, avant puis après avoir déplacé
 * le sommet A de 60 px à gauche et 40 px en haut :
 *
 *     triangle équilatéral   240/240/240        →  303/246/240
 *     carré                  240/240/240/240    →  303/240/240/209
 *     symétrie centrale      OA = OA' = 437     →  OA = 487, OA' = 437
 *     translation            AA' = DO = 488     →  AA' = 519, DO = 488
 *     cercle circonscrit     163/163/163        →  193/163/163
 *
 * Les bâtisseurs calculaient une position, puis l'oubliaient. La figure était
 * juste une fois — à l'instant du clic — et fausse au premier geste de l'élève,
 * ce qui est exactement le contraire de ce qu'un logiciel de géométrie doit
 * apprendre. Un élève qui tire sur un sommet doit voir la propriété résister ;
 * c'est comme cela qu'on comprend qu'elle ne dépend pas du dessin.
 *
 * La sonde ne compare donc PAS les longueurs à l'identique — la figure a le
 * droit de changer de taille. Elle vérifie la PROPRIÉTÉ : les côtés restent
 * égaux, l'angle reste droit, le centre reste équidistant.
 */
const { chromium } = require('playwright');
const path = require('path');

const FICHIER = 'file://' + path.join(__dirname, '..', 'index.html');

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(FICHIER);
    await page.waitForFunction(() => window.app && window.app.entities);

    const resultats = await page.evaluate(() => {
        const app = window.app;
        const sorties = [];
        const d = (u, v) => Math.hypot(u.x - v.x, u.y - v.y);
        // « tous égaux à 1 % près » : on compare des longueurs à l'écran
        const memes = (xs) => {
            const mn = Math.min(...xs), mx = Math.max(...xs);
            return mx - mn <= mx * 0.01;
        };
        const nomme = (l) => app.entities.find(e => e instanceof Point && e.label === l);
        // les sommets ajoutés par la construction : les points visibles créés
        // après son début (les bâtisseurs les nomment maintenant)
        const anonymes = (depuis) => app.entities.slice(depuis)
            .filter(e => e instanceof Point && e.visible !== false && !e.estConstruction);

        const essais = [
            {
                nom: 'triangle équilatéral', pose: 'segment',
                bati: (P) => app.buildEquilateralTriangle(P.seg, 0, 0),
                dit: 'les trois côtés restent égaux',
                mesure: (P) => {
                    const C = nomme('C');
                    if (!C) return null;
                    return memes([d(P.A, P.B), d(P.A, C), d(P.B, C)]);
                }
            },
            {
                nom: 'carré', pose: 'segment',
                bati: (P) => app.buildSquare(P.seg, 0, 0),
                dit: 'quatre côtés égaux et un angle droit',
                mesure: () => {
                    const q = ['A', 'B', 'C', 'D'].map(nomme);
                    if (!q.every(Boolean)) return null;
                    const cotes = q.map((x, i) => d(x, q[(i + 1) % 4]));
                    const diag = [d(q[0], q[2]), d(q[1], q[3])];
                    return memes(cotes) && memes(diag)
                        && Math.abs(diag[0] - cotes[0] * Math.SQRT2) < cotes[0] * 0.01;
                }
            },
            {
                nom: 'hexagone', pose: 'segment',
                bati: (P) => app.buildHexagon(P.seg, 0, 0),
                dit: 'six sommets à égale distance du centre',
                depuis: true,
                mesure: (P, depuis) => {
                    const s = anonymes(depuis);
                    if (s.length < 5) return null;
                    return memes(s.concat([P.B]).map(p => d(P.A, p)));
                }
            },
            {
                nom: 'pentagone', pose: 'segment',
                bati: (P) => app.buildRegularPentagon(P.seg, 0, 0),
                dit: 'cinq sommets à égale distance du centre',
                depuis: true,
                mesure: (P, depuis) => {
                    const s = anonymes(depuis).filter(p => Math.abs(d(P.A, p) - d(P.A, P.B)) < d(P.A, P.B) * 0.02);
                    if (s.length < 4) return null;
                    return memes(s.concat([P.B]).map(p => d(P.A, p)));
                }
            },
            {
                nom: 'losange', pose: 'segment',
                bati: (P) => app.buildRhombus(P.seg, 0, 0),
                dit: 'quatre côtés de même longueur',
                depuis: true,
                mesure: (P, depuis) => {
                    const s = anonymes(depuis);
                    if (s.length < 2) return null;
                    const [D, C] = s;
                    return memes([d(P.A, P.B), d(P.A, D), d(D, C), d(C, P.B)]);
                }
            },
            {
                nom: 'symétrie centrale', pose: 'figure',
                bati: (P) => app.buildSymCentrale(P.A, P.O),
                dit: "O reste le milieu de [AA']",
                mesure: (P) => {
                    const A2 = nomme("A'");
                    if (!A2) return null;
                    return Math.abs(d(P.O, P.A) - d(P.O, A2)) < 1
                        && Math.abs(d(P.A, A2) - 2 * d(P.O, P.A)) < 1;
                }
            },
            {
                nom: 'symétrie axiale', pose: 'axe',
                bati: (P) => app.buildSymAxiale([P.A], P.axe),
                dit: "A et A' restent à la même distance de l'axe",
                mesure: (P) => {
                    const A2 = nomme("A'");
                    if (!A2) return null;
                    const dr = (p) => MathUtils.distanceToLine(p.x, p.y, P.axe.p1, P.axe.p2, 'Line');
                    return Math.abs(dr(P.A) - dr(A2)) < 1 && dr(P.A) > 5;
                }
            },
            {
                nom: 'translation', pose: 'figure',
                bati: (P) => app.buildTranslation([P.A], P.D, P.O),
                dit: "AA' reste égal au vecteur DO",
                mesure: (P) => {
                    const A2 = nomme("A'");
                    if (!A2) return null;
                    return Math.abs((A2.x - P.A.x) - (P.O.x - P.D.x)) < 1
                        && Math.abs((A2.y - P.A.y) - (P.O.y - P.D.y)) < 1;
                }
            },
            {
                nom: 'rotation', pose: 'figure',
                bati: (P) => app.buildRotation([P.A], P.O, 90, 1),
                dit: "OA' = OA et l'angle reste de 90°",
                mesure: (P) => {
                    const A2 = nomme("A'");
                    if (!A2) return null;
                    const a = Math.atan2(P.A.y - P.O.y, P.A.x - P.O.x);
                    const b = Math.atan2(A2.y - P.O.y, A2.x - P.O.x);
                    let ecart = Math.abs(((b - a) * 180 / Math.PI + 540) % 360 - 180);
                    return Math.abs(d(P.O, P.A) - d(P.O, A2)) < 1 && Math.abs(ecart - 90) < 1;
                }
            },
            {
                nom: 'homothétie', pose: 'figure',
                bati: (P) => app.buildHomothetie([P.A], P.O, 2),
                dit: "OA' reste le double de OA, dans la même direction",
                mesure: (P) => {
                    const A2 = nomme("A'");
                    if (!A2) return null;
                    return Math.abs(d(P.O, A2) - 2 * d(P.O, P.A)) < 1
                        && Math.abs((A2.x - P.O.x) - 2 * (P.A.x - P.O.x)) < 1;
                }
            },
            {
                nom: 'parallélogramme', pose: 'trois',
                bati: (P) => app.buildParallelogram(P.A, P.B, P.C),
                dit: 'les côtés opposés restent parallèles et égaux',
                depuis: true,
                mesure: (P, depuis) => {
                    const s = anonymes(depuis);
                    if (!s.length) return null;
                    const D = s[0];
                    return Math.abs((D.x - P.A.x) - (P.C.x - P.B.x)) < 1
                        && Math.abs((D.y - P.A.y) - (P.C.y - P.B.y)) < 1;
                }
            },
            {
                nom: 'cercle circonscrit', pose: 'trois-droit',
                bati: (P) => app.buildCircumscribedCircle(P.A, P.B, P.C),
                dit: 'le centre reste à égale distance des trois sommets',
                mesure: (P) => {
                    const O = nomme('O');
                    if (!O) return null;
                    return memes([d(O, P.A), d(O, P.B), d(O, P.C)]);
                }
            },
            {
                nom: 'escargot de Pythagore', pose: 'deux',
                bati: (P) => app.buildPythagorasSnail(null, 0, 0, P.A, P.B),
                dit: 'les angles au sommet restent droits',
                depuis: true,
                mesure: (P, depuis) => {
                    const s = anonymes(depuis).filter(p => p.visible !== false);
                    const tous = app.entities.slice(depuis).filter(e => e instanceof Point);
                    if (tous.length < 4) return null;
                    // le premier triangle : A, B, et le sommet construit sur B
                    const C = tous.find(p => Math.abs(d(P.B, p) - d(P.A, P.B)) < 1 && p !== P.A);
                    if (!C) return null;
                    const u = { x: P.A.x - P.B.x, y: P.A.y - P.B.y };
                    const v = { x: C.x - P.B.x, y: C.y - P.B.y };
                    return Math.abs(u.x * v.x + u.y * v.y) < d(P.A, P.B) * d(P.B, C) * 0.02;
                }
            },
        ];

        essais.forEach((essai) => {
            if (app.stopAnimation) app.stopAnimation();
            app.entities = []; app.historyPast = []; app.stepInstructions = {};
            if (app.cslOublier) app.cslOublier();
            const P = {};
            const m = (n, x, y) => { P[n] = new Point(x, y, n); app.addEntity(P[n]); return P[n]; };
            m('A', 480, 620); m('B', 720, 620);
            if (essai.pose === 'segment') {
                P.seg = new Segment(P.A, P.B, { color: '#000', width: 2 });
                app.addEntity(P.seg);
            }
            if (essai.pose === 'trois') m('C', 720, 400);
            if (essai.pose === 'trois-droit') m('C', 640, 380);
            if (essai.pose === 'axe') {
                const a1 = new Point(900, 300, ''), a2 = new Point(900, 800, '');
                app.addEntity(a1); app.addEntity(a2);
                P.axe = new Line(a1, a2, { color: '#000', width: 2 });
                app.addEntity(P.axe);
            }
            if (essai.pose === 'figure') { m('C', 720, 400); m('D', 500, 780); m('O', 900, 500); }
            const depuis = app.entities.length;
            try { essai.bati(P); } catch (e) { sorties.push({ nom: essai.nom, erreur: e.message }); return; }

            const avant = essai.mesure(P, depuis);
            if (avant === null) { sorties.push({ nom: essai.nom, erreur: 'figure introuvable' }); return; }
            // on tire sur A, comme un élève
            P.A.x -= 60; P.A.y -= 40;
            app.updateDependents(P.A);
            const apres = essai.mesure(P, depuis);
            sorties.push({ nom: essai.nom, dit: essai.dit, avant, apres });
        });
        return sorties;
    });

    let rate = 0;
    resultats.forEach((r) => {
        if (r.erreur) { console.log('  ! ' + r.nom.padEnd(24) + r.erreur); rate++; return; }
        if (!r.avant) { console.log('  ✗ ' + r.nom.padEnd(24) + 'fausse dès la construction : ' + r.dit); rate++; return; }
        if (!r.apres) { console.log('  ✗ ' + r.nom.padEnd(24) + 'se défait quand on tire sur A : ' + r.dit); rate++; return; }
        console.log('  ✓ ' + r.nom.padEnd(24) + r.dit);
    });

    if (erreurs.length) {
        console.log('  ! erreurs de page : ' + erreurs.slice(0, 3).join(' | '));
        rate++;
    }

    await nav.close();
    if (rate) {
        console.log('\n' + rate + ' figure(s) magique(s) ne tiennent pas.');
        process.exit(1);
    }
    console.log('\nLes ' + resultats.length + ' figures magiques gardent leur propriété quand on déplace un sommet.');
})();
