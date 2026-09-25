/* LE CRAYON TRACE LA PARALLÈLE DU CÔTÉ DE LA FIGURE.
 *
 * « Lorsque j'ai tracé une parallèle — une droite, un point, puis l'équerre qui
 *   glisse le long de la règle —, lors du replay le crayon a dessiné du mauvais
 *   côté. »
 *
 * MESURÉ, ET C'ÉTAIT PIRE QUE DE TRAVERS : le trait ne touchait pas du tout le
 * côté où se trouve la figure. Compté dans deux fenêtres posées à 200 px de C,
 * pendant tout le tracé, sur « la parallèle à (AB) passant par C » :
 *
 *     avancement     côté de B     côté opposé
 *         15 %            0            125
 *         99 %            0            133
 *
 * Zéro. La parallèle se traçait entièrement dans le vide de la feuille, à
 * l'opposé du segment dont elle est parallèle — c'est-à-dire là où l'œil ne peut
 * pas comparer les deux droites, ce qui est pourtant tout l'objet de la figure.
 *
 * LA CAUSE TIENT À LA MAIN DE L'ÉQUERRE. Son bord de tracé est son côté +x ; le
 * côté qui monte le rail est ce bord tourné d'un quart de tour, et c'est LUI qui
 * doit pointer vers C, sans quoi l'instrument glisserait à travers la règle.
 * Selon le côté de la droite où tombe C, le bord de tracé vaut donc +AB ou −AB :
 * une fois sur deux il part à l'envers. Mesuré : le produit scalaire du sens du
 * crayon par celui de (AB) valait −1.
 *
 * ET LE CRAYON NE PEUT PAS RECULER. C'est une règle posée plus tôt, et elle est
 * juste : il ne court que dans le sens de l'instrument, sinon il tracerait
 * derrière la règle, dans le vide. On ne peut pas non plus retourner l'équerre —
 * le modèle n'en a qu'une main, là où le carton d'une trousse se retourne.
 *
 * RESTE LA POSE. Le recul de l'équerre décide de la portion de droite que le
 * trait couvre ; il était fixe (130 px), on le choisit maintenant pour que cette
 * portion tombe le long du segment de référence. Le geste ne change pas, la pose
 * seule change :
 *
 *     portion couverte, en px depuis C, dans le sens A→B
 *                          avant            après
 *     C au-dessus       −270 … +130      −151 … +249
 *     C en dessous      −130 … +270       −60 … +340
 *
 * CE QUE CETTE SONDE MESURE N'EST PAS LE PLAN MAIS L'ENCRE, et l'encre du TRAIT
 * SEUL : l'équerre porte des graduations noires le long de son bord, et les
 * compter reviendrait à mesurer l'instrument au lieu du trait. On rend donc deux
 * fois la même image gelée, l'une avec la parallèle et l'autre sans, et l'on
 * compte ce qui diffère. C'est le seul relevé qui distingue « le trait est du
 * bon côté » de « l'équerre est du bon côté ».
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

    /* La figure, la même des deux côtés : (AB) qui monte vers la droite, et C
       au-dessus ou en dessous — c'est ce qui fait basculer la main de l'équerre. */
    const poser = (cy) => page.evaluate((cy) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        const A = new Point(500, 500, 'A'), B = new Point(900, 400, 'B'),
              C = new Point(600, cy, 'C');
        [A, B, C].forEach(p => a.addEntity(p));
        a.addEntity(new Line(A, B));
        const r = a.executerConsigneAvec('Trace la parallèle à (AB) passant par C', true);
        const i = a.entities.findIndex(e => e.originalType === 'trace'
            && e.widgetType === 'setsquare');
        return { ok: !!(r && r.ok), msg: (r && r.message) || '', i };
    }, cy);

    /* L'ENCRE DU TRAIT SEUL, dans une fenêtre posée à d px de C le long de la
       droite, comptée dans le sens A→B (signe +1 vers B). */
    const encre = (i, t, signe, d) => page.evaluate(([i, t, signe, d]) => {
        const a = window.app;
        const C = a.entities.find(e => e instanceof Point && e.label === 'C');
        const A = a.entities.find(e => e instanceof Point && e.label === 'A');
        const B = a.entities.find(e => e instanceof Point && e.label === 'B');
        const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
        const u = { x: (B.x - A.x) / L, y: (B.y - A.y) / L };
        const ctx = a.canvas.getContext('2d');
        const lire = () => {
            const cx = C.x + u.x * d * signe, cy = C.y + u.y * d * signe;
            const x = Math.round(cx * a.view.zoom + a.view.x) - 16;
            const y = Math.round(cy * a.view.zoom + a.view.y) - 16;
            return ctx.getImageData(x, y, 32, 32).data;
        };
        const geler = () => {
            a.isReplaying = true; a.isToolAnimating = true;
            a.replayIndex = i; a.currentAnimProgress = t;
            a.applyInterpolation(a.entities[i], t);
        };
        geler(); a.render(); const avec = lire();
        const cible = a.entities[i + 1];
        const memo = cible.color;
        cible.color = 'rgba(0,0,0,0)';
        geler(); a.render(); const sans = lire();
        cible.color = memo;
        let n = 0;
        for (let k = 0; k < avec.length; k += 4) if (Math.abs(avec[k] - sans[k]) > 40) n++;
        return n;
    }, [i, t, signe, d]);

    for (const [titre, cy] of [['C au-dessus de (AB)', 250], ['C en dessous', 700]]) {
        console.log(`\n=== la parallèle, ${titre} ===`);
        const p = await poser(cy);
        ck('la construction sort ses instruments', p.ok && p.i >= 0,
           p.i >= 0 ? p.msg : 'aucune animation de tracé — ' + p.msg);
        if (p.i < 0) continue;

        /* LE TRAIT EST DU CÔTÉ DE LA FIGURE. C'est le fait que l'utilisateur a
           vu, et c'est celui-là qu'on tient : à la fin du geste, il y a de
           l'encre du côté de B. */
        const finB = await encre(p.i, 0.99, +1, 150);
        const finA = await encre(p.i, 0.99, -1, 150);
        ck('  à la fin, le trait est passé du côté de B', finB > 0, finB + ' px');
        ck('    et il déborde peu de l\'autre côté', finA < finB,
           `${finA} px contre ${finB}`);

        /* ET IL GRANDIT : un trait posé d'un coup à la fin n'est pas un tracé.
           C'est la faute qu'une sonde voisine a déjà corrigée une fois. */
        const tot = [];
        for (const t of [0.2, 0.55, 0.99]) {
            tot.push(await encre(p.i, t, +1, 150) + await encre(p.i, t, +1, 300));
        }
        ck('  et il grandit pendant le geste', tot[2] > tot[0],
           tot.join(' → ') + ' px');

        /* LE PLAN, pour nommer la cause si jamais l'encre repasse au rouge :
           la portion couverte doit pencher du côté de B. */
        const plan = await page.evaluate((i) => {
            const a = window.app;
            const pl = a.planRegle(a.entities[i], a.entities[i + 1]);
            const C = a.entities.find(e => e instanceof Point && e.label === 'C');
            const A = a.entities.find(e => e instanceof Point && e.label === 'A');
            const B = a.entities.find(e => e instanceof Point && e.label === 'B');
            const L = Math.hypot(B.x - A.x, B.y - A.y) || 1;
            const u = { x: (B.x - A.x) / L, y: (B.y - A.y) / L };
            const s = (p) => (p.x - C.x) * u.x + (p.y - C.y) * u.y;
            const e0 = s(pl.point(pl.sA)), e1 = s(pl.point(pl.sB));
            return { versB: Math.round(Math.max(e0, e1)),
                     versA: Math.round(Math.min(e0, e1)) };
        }, p.i);
        ck('  la portion couverte penche vers B', plan.versB > -plan.versA,
           `de ${plan.versA} à ${plan.versB} px depuis C`);
        /* Et C reste SOUS le bord : une parallèle qui ne passerait pas par le
           point ne serait plus la bonne droite. */
        ck('    tout en gardant C sous le bord de l\'équerre',
           plan.versA < 0 && plan.versB > 0, `${plan.versA} … ${plan.versB}`);
    }

    /* LA PERPENDICULAIRE PASSE PAR LE MÊME CHEMIN DE CODE et ne doit pas avoir
       bougé : elle se trace à l'équerre puis se prolonge à la règle. */
    console.log('\n=== la perpendiculaire trace toujours, et par ses deux morceaux ===');
    const perp = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        const A = new Point(500, 500, 'A'), B = new Point(900, 400, 'B'),
              C = new Point(600, 250, 'C');
        [A, B, C].forEach(p => a.addEntity(p));
        a.addEntity(new Line(A, B));
        const r = a.executerConsigneAvec('Trace la perpendiculaire à (AB) passant par C', true);
        const anims = a.entities.filter(e => e.originalType === 'trace');
        const d = a.entities.find(e => e instanceof PerpendicularLine);
        const A2 = a.entities.find(e => e instanceof Point && e.label === 'A');
        const B2 = a.entities.find(e => e instanceof Point && e.label === 'B');
        const q = d && d.getDynamicP2 ? d.getDynamicP2() : null;
        let droit = null;
        if (d && q) {
            const v1 = { x: B2.x - A2.x, y: B2.y - A2.y };
            const v2 = { x: q.x - d.p1.x, y: q.y - d.p1.y };
            const c = (v1.x * v2.x + v1.y * v2.y)
                / ((Math.hypot(v1.x, v1.y) || 1) * (Math.hypot(v2.x, v2.y) || 1));
            droit = Math.round(Math.abs(c) * 1000) / 1000;
        }
        return { ok: !!(r && r.ok), msg: (r && r.message) || '',
                 traces: anims.length, droit };
    });
    ck('elle est construite', perp.ok, perp.msg);
    ck('  avec au moins deux coups de crayon', perp.traces >= 2, perp.traces + ' tracés');
    ck('  et elle est bien perpendiculaire', perp.droit !== null && perp.droit < 0.01,
       String(perp.droit));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
