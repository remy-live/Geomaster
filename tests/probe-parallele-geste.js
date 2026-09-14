/* LA PARALLÈLE AUX INSTRUMENTS : LE GESTE, PAS LE RÉSULTAT.
 *
 * « Pour la construction de parallèles par énoncé, l'équerre écrase la règle —
 *   en gros les outils se superposent. Quand on trace la parallèle à (AB)
 *   passant par C, on n'est pas obligé qu'un côté de l'angle droit passe par C
 *   quand on place l'équerre le long de (AB) ; il faudra juste que quand on
 *   glisse l'équerre, ça touche le point C. »
 *
 * DEUX DÉFAUTS, UN SEUL POINT FAUTIF. Les deux instruments étaient posés en F,
 * le pied de la perpendiculaire menée de C. Tout découlait de là.
 *
 * 1. L'ÉQUERRE ÉTAIT DÉJÀ ALIGNÉE SUR C AVANT DE GLISSER, et c'est un
 *    contresens : poser son angle droit exactement au pied de la
 *    perpendiculaire suppose qu'on sache déjà tracer cette perpendiculaire,
 *    donc qu'on sache faire ce que la leçon cherche à apprendre. En classe, on
 *    pose l'équerre N'IMPORTE OÙ le long de la droite ; c'est le GLISSEMENT qui
 *    amène le bord sur C. La sonde tient donc deux choses à la fois : que
 *    l'équerre part LOIN du pied — sinon elle vise, et le geste ne montre plus
 *    rien — et qu'à l'arrivée le bord passe EXACTEMENT par C, sinon le geste
 *    est joli mais faux.
 *
 * 2. LA RÈGLE ÉTAIT SOUS L'ÉQUERRE. Mesuré avant : leurs corps se recouvraient,
 *    et l'on ne voyait plus lequel servait de rail. L'orientation de l'équerre
 *    n'était pas choisie — son grand côté partait dans le sens de A vers B, quel
 *    qu'il soit —, si bien que son corps tombait tantôt du côté de C, tantôt de
 *    l'autre. La sonde calcule le recouvrement réel des deux corps (un triangle
 *    rectangle de 400×250, un rectangle de 400×60, aux poses exactes) et exige
 *    ZÉRO, dans les quatre configurations : C au-dessus, C en dessous, A et B
 *    échangés, droite oblique. Elles se touchent le long d'une arête, comme sur
 *    une vraie table ; elles ne se recouvrent nulle part.
 *
 * ET LA PERPENDICULAIRE, elle, range l'équerre AVANT de sortir la règle : les
 * deux ne sont jamais dehors ensemble. La sonde le vérifie aussi, pour que
 * personne ne « répare » un jour ce qui n'est pas cassé.
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

    /* Les corps réels des deux instruments, aux poses réellement produites.
       La règle est un rectangle 400×60 depuis son origine ; l'équerre un
       triangle rectangle 400×250, angle droit à l'origine. Ce sont les
       dimensions des widgets, pas des nombres choisis pour la sonde. */
    const geste = (ax, ay, bx, by, cx, cy) => page.evaluate(([ax, ay, bx, by, cx, cy]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(ax, ay, 'A'), B = new Point(bx, by, 'B'), C = new Point(cx, cy, 'C');
        a.addEntity(A); a.addEntity(B); a.addEntity(C);
        a.cslGesteParallele(C, A, B);
        const anims = a.entities.filter(e => e instanceof ToolAnimation);
        const regleAnim = anims.find(e => e.widgetType === 'ruler' && e.originalType === 'move');
        const sqAnims = anims.filter(e => e.widgetType === 'setsquare' && e.originalType === 'move');
        if (!regleAnim || sqAnims.length < 1) return { erreur: 'gestes absents' };
        const pose = (s) => ({ x: s.x, y: s.y, a: s.angle });
        const R = pose(regleAnim.startState);
        const S = pose(sqAnims[0].startState);
        const Sa = pose(sqAnims[sqAnims.length - 1].endState);
        const g = (o, lx, ly) => ({ x: o.x + lx * Math.cos(o.a) - ly * Math.sin(o.a),
                                    y: o.y + lx * Math.sin(o.a) + ly * Math.cos(o.a) });
        const eq = [g(S, 0, 0), g(S, 400, 0), g(S, 0, 250)];
        const dans = (p, poly) => {
            let c = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
                if (((poly[i].y > p.y) !== (poly[j].y > p.y)) &&
                    (p.x < (poly[j].x - poly[i].x) * (p.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x))
                    c = !c;
            return c;
        };
        let dedans = 0, total = 0;
        for (let lx = 2; lx < 400; lx += 4) for (let ly = 2; ly < 60; ly += 4) {
            total++; if (dans(g(R, lx, ly), eq)) dedans++;
        }
        /* Le pied de la perpendiculaire, celui qu'il ne faut PAS viser. */
        const u0 = { x: B.x - A.x, y: B.y - A.y }, l2 = u0.x * u0.x + u0.y * u0.y || 1;
        const k = ((C.x - A.x) * u0.x + (C.y - A.y) * u0.y) / l2;
        const F = { x: A.x + k * u0.x, y: A.y + k * u0.y };
        /* Le bord traçant de l'équerre à l'arrivée : C doit être dessus. */
        const b0 = g(Sa, 0, 0), b1 = g(Sa, 400, 0);
        const vx = b1.x - b0.x, vy = b1.y - b0.y, L = Math.hypot(vx, vy) || 1;
        /* Le départ est-il bien SUR la droite (AB) ? On pose l'équerre dessus. */
        const surAB = Math.abs((S.x - A.x) * u0.y - (S.y - A.y) * u0.x) / (Math.hypot(u0.x, u0.y) || 1);
        return {
            recouvre: 100 * dedans / total,
            duPied: Math.hypot(S.x - F.x, S.y - F.y),
            surAB,
            distC: Math.abs((C.x - b0.x) * vy - (C.y - b0.y) * vx) / L,
            leLong: ((C.x - b0.x) * vx + (C.y - b0.y) * vy) / L,
        };
    }, [ax, ay, bx, by, cx, cy]);

    const CAS = [
        ['C au-dessus, A à gauche', [400, 500, 800, 500, 560, 300]],
        ['les mêmes, A et B échangés', [800, 500, 400, 500, 560, 300]],
        ['C en dessous', [400, 500, 800, 500, 560, 700]],
        ['droite oblique', [300, 250, 700, 600, 350, 600]],
        ['C presque au-dessus de A', [400, 500, 800, 500, 410, 280]],
    ];

    console.log('\n=== les deux instruments ne se recouvrent plus ===');
    for (const [nom, p] of CAS) {
        const r = await geste(...p);
        ck(nom, !r.erreur && r.recouvre === 0,
           r.erreur || `${r.recouvre.toFixed(1)} % du corps de la règle sous l'équerre`);
    }

    console.log('\n=== l\'équerre se pose sur la droite, mais PAS au pied ===');
    for (const [nom, p] of CAS) {
        const r = await geste(...p);
        ck(nom + ' : sur (AB)', r.surAB < 0.01, r.surAB.toFixed(3) + ' px de la droite');
        ck('  et loin du pied — elle ne vise pas C',
           r.duPied > 100, Math.round(r.duPied) + ' px du pied de la perpendiculaire');
    }

    console.log('\n=== et pourtant, à l\'arrivée, le bord touche C ===');
    for (const [nom, p] of CAS) {
        const r = await geste(...p);
        ck(nom, r.distC < 0.01, r.distC.toFixed(3) + ' px du bord traçant');
        ck('  et C tombe DANS la longueur du bord, pas au-delà',
           r.leLong > 0 && r.leLong < 400,
           Math.round(r.leLong) + ' px le long d\'un bord de 400');
    }

    console.log('\n=== la parallèle obtenue est vraiment parallèle, et passe par C ===');
    const juste = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(300, 250, 'A'), B = new Point(700, 600, 'B'), C = new Point(350, 600, 'C');
        a.addEntity(A); a.addEntity(B); a.addEntity(C);
        const d = a.cslGesteParallele(C, A, B);
        const p2 = d.getDynamicP2();
        const u = { x: B.x - A.x, y: B.y - A.y }, v = { x: p2.x - C.x, y: p2.y - C.y };
        const croix = Math.abs(u.x * v.y - u.y * v.x)
            / ((Math.hypot(u.x, u.y) || 1) * (Math.hypot(v.x, v.y) || 1));
        return { ecartAngulaire: Math.asin(Math.min(1, croix)) * 180 / Math.PI,
                 passeParC: d.p1 === C };
    });
    ck('parallèle à 0° près', juste.ecartAngulaire < 0.01,
       juste.ecartAngulaire.toFixed(4) + '°');
    ck('  et accrochée à C, donc elle le suivra', juste.passeParC);

    console.log('\n=== la perpendiculaire range l\'équerre avant de sortir la règle ===');
    const perp = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(300, 500, 'A'), B = new Point(800, 500, 'B'), C = new Point(520, 280, 'C');
        a.addEntity(A); a.addEntity(B); a.addEntity(C);
        a.cslGestePerpendiculaire(C, A, B);
        /* On rejoue la suite des gestes et l'on note qui est dehors à chaque
           instant : les deux ne doivent jamais l'être ensemble. */
        let sq = false, rg = false, ensemble = false;
        const suite = [];
        a.entities.filter(e => e instanceof ToolAnimation).forEach(e => {
            const t = e.originalType || '';
            if (e.widgetType === 'setsquare') sq = true;
            if (e.widgetType === 'ruler') rg = true;
            if (t === 'setsquareHide') sq = false;
            if (t === 'rulerHide') rg = false;
            if (sq && rg) ensemble = true;
            suite.push(`${e.widgetType}${sq && rg ? '(LES DEUX)' : ''}`);
        });
        return { ensemble, suite: suite.join(' → ') };
    });
    ck('les deux ne sont jamais dehors en même temps',
       !perp.ensemble, perp.suite);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
