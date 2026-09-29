/* LES INSTRUMENTS MESURENT LA MÊME CHOSE QUE LA FIGURE.
 *
 * « Bug découvert entre le compas et l'équerre, problème de longueur. De
 *   mémoire, un carreau Seyes, c'est 0,8 cm. »
 *
 * La mémoire est bonne, et c'est ce qui rend le défaut visible. Sur fond
 * « cahier », GéoMaster pose cmScale = 0,8 : le carreau Seyes vaut 8 mm, donc
 * un CENTIMÈTRE vaut 62,5 pixels et non 50. La figure le savait, le compas le
 * savait — il affichait 2,4 cm pour un écartement de 150 px, ce qui est juste.
 * Les instruments, eux, gravaient leurs traits tous les 50 px en les appelant
 * « 1 », « 2 », « 3 » :
 *
 *     une même longueur de 150 px, sur fond cahier
 *       le segment dit    2,4 cm
 *       le compas dit     2,4 cm
 *       la règle grave      3 cm      ← 25 % de trop
 *
 * Un élève qui reporte au compas puis relit à la règle trouve donc deux
 * réponses. C'est la faute la plus coûteuse dans un cahier : elle ne se voit
 * qu'au moment où l'on compare, c'est-à-dire pendant l'exercice.
 *
 * LA CAUSE TENAIT EN UNE LIGNE, RÉPÉTÉE QUATRE FOIS — deux instruments, chacun
 * à l'écran et à l'export : « const mm = 5; const cm = 50; ». Un nombre en dur
 * là où il fallait une division. Les quatre passent désormais par gmGraduations,
 * qui compte en MILLIMÈTRES et non en pixels : l'écart d'un centimètre valant
 * 62,5 px, aucun test de divisibilité sur les pixels ne pouvait retomber juste.
 *
 * CE QUE CETTE SONDE VÉRIFIE N'EST PAS UNE CONSTANTE MAIS UN ACCORD. Elle
 * demande à chacun — la figure, le compas, la règle, l'équerre, à l'écran comme
 * à l'export — ce que vaut UNE MÊME LONGUEUR, et exige qu'ils répondent la même
 * chose. C'est la seule formulation qui survivra au jour où l'on ajoutera un
 * troisième fond avec une troisième échelle.
 *
 * UNE CONSÉQUENCE ASSUMÉE : sur fond cahier, la règle de 400 px porte 6
 * graduations et non 7. C'est le même objet sur une feuille dont l'échelle a
 * changé — comme une vraie règle posée sur du Seyes, où un centimètre couvre un
 * carreau et quart.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * SECOND SIGNALEMENT, MÊME RACINE : « bug de longueur », avec une capture.
 *
 * Le crayon était à la graduation 4,1 de l'équerre et l'étiquette du trait
 * annonçait 5,1 — le rapport vaut exactement 1,25, soit 1/0,8. On avait corrigé
 * LES INSTRUMENTS ; trois autres lecteurs divisaient encore par 50 en douce, et
 * le premier est celui qu'on a sous les yeux EN TRAÇANT :
 *
 *     sur cahier, un trait de 4 cm    pendant le geste   5,0
 *                                      une fois posé      4,0
 *                                      à l'équerre        4
 *
 * Trois réponses pour un seul trait, et c'est la fausse qu'on regarde pendant
 * qu'on trace. Les deux autres : la RÈGLE-FANTÔME dessinée sous le trait, qui
 * gravait ses traits tous les 50 px (elle contredisait donc la vraie règle
 * posée à côté d'elle), et la CALCULATRICE, où « AB » valait 5 pour un segment
 * que la figure appelait 4,0 cm — « AB+BC » répondant 8,75 au lieu de 7.
 *
 * CE QUE CE SECOND TOUR A APPRIS : ce n'était pas « un instrument à corriger »
 * mais une conversion ÉPARPILLÉE. Elle tient maintenant dans gmCm(), une seule
 * fonction, et la sonde ne cherche plus des lecteurs un par un : elle relève
 * TOUS LES NOMBRES écrits sur le canevas dans une même situation sur les deux
 * papiers, et exige que la même figure — la même en centimètres — donne les
 * mêmes nombres. C'est ainsi que les trois ont été trouvés, et c'est ce filet-là
 * qui attrapera le quatrième.
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
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* ON PASSE PAR LA VRAIE COMMANDE : toggleGrid fait le tour des cinq fonds et
       pose cmScale au passage. Régler cmScale à la main testerait un réglage que
       personne ne peut atteindre. */
    const allerAuFond = (voulu) => page.evaluate((voulu) => {
        const a = window.app;
        for (let i = 0; i < 6 && a.gridMode !== voulu; i++) a.toggleGrid();
        return { gridMode: a.gridMode, cmScale: a.cmScale };
    }, voulu);

    /* CE QUE CHACUN DIT D'UNE MÊME LONGUEUR.
       ON NE DEMANDE RIEN AU CODE INTERNE : on lit les graduations SUR
       L'INSTRUMENT, dans le SVG qu'il produit — c'est ce qu'un élève voit. Une
       première version de cette sonde appelait gmGraduations, la fonction
       ajoutée par le correctif ; confrontée à la version d'avant, elle ne
       rougissait pas : elle PLANTAIT, « gmGraduations is not defined », et une
       sonde qui plante ne dit rien. C'est la même faute qu'un autre jour avec
       le logo secret, et c'est pourquoi on mesure l'objet et non la méthode. */
    const interroger = (px) => page.evaluate((px) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(300, 300, 'A'), B = new Point(300 + px, 300, 'B');
        a.addEntity(A); a.addEntity(B);
        a.addEntity(new Segment(A, B));
        if (!a.activeWidgets.ruler) a.toggleWidget('ruler');
        if (!a.activeWidgets.setsquare) a.toggleWidget('setsquare');
        if (!a.activeWidgets.compass) a.toggleWidget('compass');
        a.compassWidget.radius = px;
        const arrondi = (v) => Math.round(v * 100) / 100;
        /* la figure : c'est elle la référence, c'est ce que l'énoncé écrira */
        const figure = arrondi(px / UNIT * (a.cmScale || 1));
        /* le compas : ce qu'il affiche de son écartement */
        const compas = arrondi(Math.round(px / UNIT * (a.cmScale || 1) * 10) / 10);
        /* LES INSTRUMENTS : leurs graduations, relevées dans le SVG qu'ils
           produisent. Le nombre « k » y est gravé à une certaine abscisse ; le
           rapport des deux donne le pas de l'instrument, en pixels par
           centimètre. On lit ensuite « px » à ce pas, au millimètre près, comme
           sur une vraie règle — 2,4 cm ne tombe sur aucun trait entier. */
        const pasDe = (svg) => {
            const m = [...svg.matchAll(/<text ([^>]*)>(\d+)<\/text>/g)].map((x) => {
                const at = x[1], n = Number(x[2]);
                const t = at.match(/transform="rotate\([-\d.]+,\s*[-\d.]+,\s*([-\d.]+)\)"/);
                const v = t ? Number(t[1]) : Number((at.match(/x="([-\d.]+)"/) || [])[1]);
                return { v, n };
            }).filter(p => Number.isFinite(p.v) && p.v > 1 && p.n > 0);
            if (!m.length) return null;
            return { pas: m[0].v / m[0].n, nombres: m.map(p => p.n),
                     dernier: Math.max(...m.map(p => p.n)) };
        };
        const gR = pasDe(a.rulerWidget.getSVG('text'));
        const gE = pasDe(a.setSquareWidget.getSVG('text'));
        const lire = (g) => (g ? Math.round(px / g.pas * 10) / 10 : null);
        return { figure, compas,
                 regle: lire(gR), equerre: lire(gE),
                 pasRegle: gR ? Math.round(gR.pas * 10) / 10 : null,
                 nbGraduations: gR ? gR.nombres.filter((v, i, t) => t.indexOf(v) === i).length : 0,
                 derniere: gR ? gR.dernier : null,
                 cmEnPx: Math.round(UNIT / (a.cmScale || 1) * 10) / 10,
                 carreauCm: arrondi(UNIT / UNIT * (a.cmScale || 1)) };
    }, px);

    for (const [titre, fond, attenduCm, attenduGrad] of [
        ['le quadrillage ordinaire', 0, 3, 7],
        ['le cahier Seyes', 4, 2.4, 6],
    ]) {
        console.log(`\n=== ${titre} ===`);
        const f = await allerAuFond(fond);
        ck('on y est', f.gridMode === fond, 'cmScale ' + f.cmScale);
        const r = await interroger(150);
        ck('un carreau vaut ce qu\'il doit valoir',
           r.carreauCm === (fond === 4 ? 0.8 : 1), r.carreauCm + ' cm');
        ck('  et un centimètre fait ' + (fond === 4 ? '62,5' : '50') + ' px',
           r.cmEnPx === (fond === 4 ? 62.5 : 50), r.cmEnPx + ' px');

        /* LE CŒUR : tous disent la même chose de la même longueur. */
        console.log('  150 px, lus par chacun :');
        ck('    la figure dit ' + attenduCm, r.figure === attenduCm, r.figure + ' cm');
        ck('    le compas dit pareil', r.compas === attenduCm, r.compas + ' cm');
        ck('    la règle grave pareil', r.regle === attenduCm,
           r.regle === null ? 'aucune graduation à cet endroit' : r.regle + ' cm');
        ck('    l\'équerre grave pareil', r.equerre === attenduCm,
           r.equerre === null ? 'aucune graduation à cet endroit' : r.equerre + ' cm');

        ck('  la règle de 400 px porte ' + attenduGrad + ' graduations',
           r.nbGraduations === attenduGrad, r.nbGraduations + ', jusqu\'à ' + r.derniere);
    }

    /* ET L'EXPORT GRAVE LA MÊME CHOSE QUE L'ÉCRAN. Les graduations y sont
       écrites par un second passage de code — c'est exactement là que les deux
       ont divergé jusqu'ici, et ce serait le premier endroit à repartir. */
    console.log('\n=== et le SVG exporté grave les mêmes nombres ===');
    for (const [titre, fond] of [['quadrillage', 0], ['cahier', 4]]) {
        await allerAuFond(fond);
        const svg = await page.evaluate(() => {
            const a = window.app;
            if (!a.activeWidgets.ruler) a.toggleWidget('ruler');
            if (!a.activeWidgets.setsquare) a.toggleWidget('setsquare');
            return { regle: a.rulerWidget.getSVG('text'),
                     equerre: a.setSquareWidget.getSVG('text'),
                     cmEnPx: Math.round(UNIT / (a.cmScale || 1) * 10) / 10 };
        });
        /* CE QU'ON VÉRIFIE EST LA PLACE DU NOMBRE, pas combien il y en a :
           l'équerre s'amincit et s'arrête avant le bout, la règle non. Le
           nombre « k » doit être gravé à k centimètres du zéro, et c'est cela
           seul qui dit si l'export a la même échelle que l'écran. */
        const cmEnPx = svg.cmEnPx;
        /* Le second bord de l'équerre est gravé EN ORDONNÉE, texte tourné d'un
           quart de tour : son abscisse vaut 22 pour tous les nombres. On le
           reconnaît à sa rotation, et on le lit sur son propre axe. */
        const places = (s) => [...s.matchAll(/<text ([^>]*)>(\d+)<\/text>/g)]
            .map(m => {
                const at = m[1], n = Number(m[2]);
                const tour = at.match(/transform="rotate\([-\d.]+,\s*[-\d.]+,\s*([-\d.]+)\)"/);
                /* Pour le texte tourné, on prend le CENTRE de la rotation : le y
                   du texte porte en plus le décalage de ligne de base, qui n'a
                   rien à voir avec l'échelle. */
                const v = tour ? Number(tour[1])
                               : Number((at.match(/x="([-\d.]+)"/) || [])[1]);
                return { x: v, n, tourne: !!tour };
            })
            .filter(p => Number.isFinite(p.x) && p.x > 1);
        const faux = (l) => l.filter(p => Math.abs(p.x - p.n * cmEnPx) > 0.5);
        const pR = places(svg.regle), pE = places(svg.equerre);
        ck(`${titre} : la règle grave chaque nombre à ${cmEnPx} px du zéro`,
           pR.length > 0 && faux(pR).length === 0,
           pR.map(p => p.n + '@' + p.x).join(' '));
        ck('  et l\'équerre au même pas',
           pE.length > 0 && faux(pE).length === 0,
           pE.map(p => p.n + '@' + p.x).join(' '));
    }

    /* LE COMPAS ET L'ÉQUERRE, LE GESTE DU SIGNALEMENT : on reporte une longueur
       au compas, on la relit sur l'équerre. Les deux doivent s'accorder à tous
       les écartements, pas seulement à celui qu'on a mesuré. */
    console.log('\n=== reporter au compas, relire à l\'équerre ===');
    await allerAuFond(4);
    const ecarts = await page.evaluate(() => {
        const a = window.app;
        if (!a.activeWidgets.compass) a.toggleWidget('compass');
        if (!a.activeWidgets.setsquare) a.toggleWidget('setsquare');
        /* le pas de l'équerre, lu sur elle */
        const svg = a.setSquareWidget.getSVG('text');
        const m = [...svg.matchAll(/<text ([^>]*)>(\d+)<\/text>/g)].map((x) => {
            const at = x[1], n = Number(x[2]);
            const t = at.match(/transform="rotate\([-\d.]+,\s*[-\d.]+,\s*([-\d.]+)\)"/);
            const v = t ? Number(t[1]) : Number((at.match(/x="([-\d.]+)"/) || [])[1]);
            return { v, n };
        }).filter(p => Number.isFinite(p.v) && p.v > 1 && p.n > 0);
        const pas = m.length ? m[0].v / m[0].n : null;
        const out = [];
        for (const px of [62.5, 125, 150, 187.5, 250]) {
            a.compassWidget.radius = px;
            const compas = Math.round(px / UNIT * (a.cmScale || 1) * 10) / 10;
            out.push({ px, compas, equerre: pas ? Math.round(px / pas * 10) / 10 : null });
        }
        return out;
    });
    ecarts.forEach(e => {
        const accord = e.equerre !== null
            ? Math.abs(e.equerre - e.compas) < 0.01
            : Math.abs(e.compas * 10 % 10) > 0;   // pas de trait entier : normal
        ck(`  ${e.px} px : compas ${e.compas} cm`, accord,
           e.equerre === null ? 'pas de graduation entière ici' : 'équerre ' + e.equerre + ' cm');
    });

    /* ============================================================
       CE QU'ON LIT EN TRAÇANT — le second signalement
       « Bug de longueur » : crayon à la graduation 4,1, étiquette 5,1.
       On ne demande rien à une fonction : on relève le texte écrit sur le
       canevas pendant le geste, celui que l'œil lit.
       ============================================================ */
    console.log('\n=== le nombre affiché PENDANT le tracé ===');
    await page.evaluate(() => {
        window.__ecrits = [];
        const a = window.app;
        if (!a.__fillTextPiege) {
            const vrai = a.ctx.fillText.bind(a.ctx);
            a.ctx.fillText = function (t, x, y) { window.__ecrits.push(String(t)); return vrai(t, x, y); };
            a.__fillTextPiege = true;
        }
    });
    for (const [titre, fond] of [['le quadrillage ordinaire', 0], ['le cahier Seyes', 4]]) {
        await allerAuFond(fond);
        const r = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            a.view = { zoom: 1, x: 0, y: 0 };
            a.activeWidgets.ruler = false; a.activeWidgets.setsquare = false;
            const u = UNIT / (a.cmScale || 1);            /* un centimètre, ici */
            a.currentTool = 'segment';
            a.creationStartPoint = { x: 300, y: 400 };
            a.mousePos = { x: 300 + 4 * u, y: 400 };
            a.isDraggingCreation = true; a.tactileMode = false;
            window.__ecrits = [];
            a.render();
            const pendant = window.__ecrits.filter(s => /^\d+[.,]\d+$/.test(s));
            /* et le même trait, posé pour de bon */
            a.isDraggingCreation = false; a.creationStartPoint = null;
            const p1 = new Point(300, 400), p2 = new Point(300 + 4 * u, 400);
            a.addEntity(p1); a.addEntity(p2);
            const s = new Segment(p1, p2); s.showLength = true; a.addEntity(s);
            return { pendant, apres: s.texteLongueur() };
        });
        console.log(`  ${titre} :`);
        ck('    un trait de 4 cm s\'annonce « 4.0 » pendant le geste',
           r.pendant.length === 1 && r.pendant[0] === '4.0',
           r.pendant.join(' / ') || 'rien d\'affiché');
        ck('      et « 4.0 » une fois posé — le même nombre',
           r.apres === '4.0' && r.pendant[0] === r.apres,
           `pendant ${r.pendant[0]} · après ${r.apres}`);
    }

    /* ============================================================
       LE FILET : tous les nombres du canevas, sur les deux papiers
       La même figure EN CENTIMÈTRES doit donner les mêmes nombres. C'est ce
       relevé-là qui a trouvé les trois lecteurs fautifs, et non une lecture du
       code : il attrapera le quatrième sans qu'on ait à y penser.
       Les INSTRUMENTS sont hors du filet, et pour une raison : une règle de
       400 px porte moins de centimètres sur du Seyes — c'est la conséquence
       assumée, vérifiée plus haut, et non un désaccord.
       ============================================================ */
    console.log('\n=== la même figure, les mêmes nombres, sur les deux papiers ===');
    const SCENES = ['segment en cours', 'cercle en cours', 'segment posé',
                    'compas ouvert à 3 cm', 'calculatrice : AB + BC'];
    const relever = async (fond) => {
        await allerAuFond(fond);
        return page.evaluate((SCENES) => {
            const a = window.app;
            const out = {};
            for (const scene of SCENES) {
                a.entities = []; a.historyPast = [];
                a.view = { zoom: 1, x: 0, y: 0 };
                a.activeWidgets = { ruler: false, setsquare: false, compass: false, protractor: false };
                a.isDraggingCreation = false; a.creationStartPoint = null;
                a.currentTool = 'move'; a.tactileMode = false;
                /* LES INSTRUMENTS SONT HORS DU FILET, y compris la règle-fantôme
                   dessinée sous le trait : une règle de 600 px porte moins de
                   centimètres sur du Seyes, et c'est la conséquence assumée, pas
                   un désaccord. On la mesure à part, juste après. Ce filet-ci ne
                   juge que les LECTEURS DE LONGUEUR, qui doivent tous rendre le
                   même nombre pour la même longueur réelle. */
                a.showTools = false;
                const u = UNIT / (a.cmScale || 1);
                const O = { x: 300, y: 400 };
                if (scene === 'segment en cours') {
                    a.currentTool = 'segment';
                    a.creationStartPoint = { x: O.x, y: O.y };
                    a.mousePos = { x: O.x + 4 * u, y: O.y };
                    a.isDraggingCreation = true;
                } else if (scene === 'cercle en cours') {
                    a.currentTool = 'circle';
                    a.creationStartPoint = { x: O.x, y: O.y };
                    a.mousePos = { x: O.x + 3 * u, y: O.y };
                    a.isDraggingCreation = true;
                } else if (scene === 'segment posé') {
                    const p1 = new Point(O.x, O.y), p2 = new Point(O.x + 4 * u, O.y);
                    a.addEntity(p1); a.addEntity(p2);
                    const s = new Segment(p1, p2); s.showLength = true; a.addEntity(s);
                } else if (scene === 'compas ouvert à 3 cm') {
                    a.activeWidgets.compass = true;
                    if (!a.compassWidget) a.compassWidget = new CompassWidget(O.x, O.y);
                    a.compassWidget.x = O.x; a.compassWidget.y = O.y;
                    a.compassWidget.radius = 3 * u;
                } else if (scene === 'calculatrice : AB + BC') {
                    const A = new Point(O.x, O.y, 'A');
                    const B = new Point(O.x + 4 * u, O.y, 'B');
                    const C = new Point(O.x + 4 * u, O.y + 3 * u, 'C');
                    a.addEntity(A); a.addEntity(B); a.addEntity(C);
                    out[scene] = [String(a.evaluateExpression('AB')),
                                  String(a.evaluateExpression('BC')),
                                  String(a.evaluateExpression('AB+BC'))];
                    continue;
                }
                window.__ecrits = [];
                a.render();
                out[scene] = window.__ecrits.filter(s => /\d/.test(s));
            }
            return out;
        }, SCENES);
    };
    const blanc = await relever(0);
    const cahier = await relever(4);
    for (const scene of SCENES) {
        const a = (blanc[scene] || []).join(' ');
        const b = (cahier[scene] || []).join(' ');
        ck(`« ${scene} » dit la même chose sur les deux papiers`, a === b,
           a === b ? (a || 'aucun nombre') : `blanc « ${a} » · cahier « ${b} »`);
    }
    /* et la calculatrice dit bien ce que la figure dit */
    ck('  et la calculatrice compte en vrais centimètres',
       (cahier['calculatrice : AB + BC'] || []).join(' ') === '4 3 7',
       (cahier['calculatrice : AB + BC'] || []).join(' '));

    /* ============================================================
       LA RÈGLE-FANTÔME dessinée sous le trait est une RÈGLE
       Elle gravait tous les 50 px, et contredisait donc la vraie règle posée
       juste à côté d'elle.
       ============================================================ */
    console.log('\n=== la règle-fantôme sous le trait ===');
    for (const [titre, fond, attendu] of [
        ['le quadrillage ordinaire', 0, 12],
        ['le cahier Seyes', 4, 9],
    ]) {
        await allerAuFond(fond);
        const n = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            a.activeWidgets.ruler = false; a.activeWidgets.setsquare = false;
            a.showTools = true; a.currentTool = 'segment'; a.tactileMode = false;
            a.creationStartPoint = { x: 200, y: 400 };
            a.mousePos = { x: 600, y: 400 };
            a.isDraggingCreation = true;
            window.__ecrits = [];
            a.render();
            a.isDraggingCreation = false; a.creationStartPoint = null;
            const entiers = window.__ecrits.filter(s => /^\d+$/.test(s)).map(Number);
            return entiers.length ? Math.max(...entiers) : 0;
        });
        ck(`${titre} : la règle-fantôme de 600 px va jusqu'à ${attendu}`,
           n === attendu, 'jusqu\'à ' + n);
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
