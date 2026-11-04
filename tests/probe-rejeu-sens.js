/* LE CRAYON REFAIT LE GESTE, PAS LES GRADUATIONS.
 *
 * « J'ai dessiné un segment AB en utilisant la règle, j'ai commencé au 6 cm
 *   (point A) puis est allé au 0 (point B) et lors du rejeu, le crayon est allé
 *   du B au A donc de 0 à 6. »
 *
 * MESURÉ AVANT. Règle posée en (300, 460), bien horizontale : la graduation 0
 * tombe en x = 300, la graduation 6 en x = 600. On appuie juste au-dessus du
 * bord gradué (l'aimant rattrape les 6 px qui manquent — appuyer SUR le bord
 * attrape la règle et la fait tourner, ce qui est une autre histoire), et l'on
 * glisse de 600 vers 300. La mémoire était déjà juste : p1 = A en x = 600,
 * p2 = B en x = 300. Mais au rejeu, en espionnant les traits vraiment posés sur
 * la toile, le premier allait de x = 300 vers x = 320 : le crayon partait du 0
 * et montait vers le 6. L'élève voyait donc son trait se refaire à l'envers.
 *
 * LA CAUSE. planRegle échangeait les deux abscisses pour que sA < sB, parce que
 * tout l'escalier d'après — la pose de l'instrument, le chevauchement de trois
 * centimètres, l'avance du crayon — était écrit dans un seul sens. Le sens du
 * geste était perdu une ligne après avoir été lu.
 *
 * CE QUE LA SONDE MESURE. Pas le plan : l'encre. Elle enveloppe moveTo et
 * lineTo de la toile pendant le rejeu et garde les traits posés à la hauteur du
 * trait ; le PREMIER dit d'où le crayon part et où il va. Trois gestes :
 *   — du 6 vers le 0 (le cas rapporté),
 *   — du 0 vers le 6 (qui marchait : il doit continuer de marcher),
 *   — un trait de 14 cm tracé à rebours, plus long que la règle, donc en
 *     plusieurs poses : là le sens et le glissement doivent tenir ensemble, et
 *     le crayon ne doit jamais quitter l'instrument.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* La règle : posée là, et pas ailleurs — les abscisses attendues en dépendent. */
const RX = 300, RY = 460;

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
    await page.locator('#btn-ruler').click();

    /* Où cliquer pour viser la graduation voulue. On vise 6 px AU-DESSUS du
       bord : sur le bord, la poignée de rotation de la règle prend la main. */
    const vise = (xLocal) => page.evaluate(([xLocal, RX, RY]) => {
        const a = window.app;
        const r = a.canvas.getBoundingClientRect(), v = a.view;
        return { x: r.left + v.x + (RX + xLocal) * v.zoom,
                 y: r.top + v.y + (RY - 6) * v.zoom };
    }, [xLocal, RX, RY]);

    const poser = () => page.evaluate(([RX, RY]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.rulerWidget.x = RX; a.rulerWidget.y = RY; a.rulerWidget.angle = 0;
        a.setTool('segment');
        a.render();
    }, [RX, RY]);

    const glisser = async (de, vers) => {
        const A = await vise(de), B = await vise(vers);
        await page.mouse.move(A.x, A.y);
        await page.mouse.down();
        for (let k = 1; k <= 20; k++) {
            await page.mouse.move(A.x + (B.x - A.x) * k / 20, A.y + (B.y - A.y) * k / 20);
            await page.waitForTimeout(10);
        }
        await page.mouse.up();
        await page.waitForTimeout(250);
    };

    /* L'ENCRE, PAS LE PLAN. On enveloppe la toile et l'on regarde les traits
       posés à la hauteur du trait, longs de plus de 20 px : le premier dit d'où
       le crayon part, le dernier jusqu'où il est allé. */
    const rejouer = () => page.evaluate(async (RY) => {
        const a = window.app;
        const seg = a.entities.filter(e => e.constructor.name === 'Segment').pop();
        if (!seg) return { erreur: 'aucun segment tracé' };
        const memoire = { x1: Math.round(seg.p1.x), x2: Math.round(seg.p2.x) };
        const ctx = a.ctx;
        const mt = ctx.moveTo.bind(ctx), lt = ctx.lineTo.bind(ctx);
        let dep = null; const traits = [];
        ctx.moveTo = (x, y) => { dep = { x, y }; mt(x, y); };
        ctx.lineTo = (x, y) => { if (dep) traits.push({ ay: dep.y, ax: dep.x, bx: x, by: y }); lt(x, y); };
        a.playbackSpeed = 200;
        a.playFromStart();
        await new Promise(r => setTimeout(r, 4500));
        ctx.moveTo = mt; ctx.lineTo = lt;
        const miens = traits.filter(t => Math.abs(t.ay - RY) < 3 && Math.abs(t.by - RY) < 3
                                      && Math.abs(t.bx - t.ax) > 20);
        if (!miens.length) return { erreur: 'aucun trait posé le long de la règle', memoire };
        const p = miens[0], d = miens[miens.length - 1];
        return { memoire, n: miens.length,
                 premier: { de: Math.round(p.ax), vers: Math.round(p.bx) },
                 dernier: { de: Math.round(d.ax), vers: Math.round(d.bx) } };
    }, RY);

    const cas = async (nom, de, vers) => {
        await poser();
        await glisser(de, vers);
        const r = await rejouer();
        const xDe = RX + de, xVers = RX + vers;
        if (r.erreur) { ck(nom, false, r.erreur); return r; }
        ck(nom + ' : la mémoire garde l\'ordre du geste',
            Math.abs(r.memoire.x1 - xDe) < 6 && Math.abs(r.memoire.x2 - xVers) < 6,
            `p1 en x=${r.memoire.x1}, p2 en x=${r.memoire.x2} (geste ${xDe}→${xVers})`);
        ck(nom + ' : le crayon part de là où la main est partie',
            Math.abs(r.premier.de - xDe) < 6,
            `premier trait posé : ${r.premier.de}→${r.premier.vers}`);
        ck(nom + ' : et il va dans le sens du geste',
            Math.sign(r.premier.vers - r.premier.de) === Math.sign(xVers - xDe),
            `${r.premier.de}→${r.premier.vers}`);
        ck(nom + ' : au bout, le trait est entier',
            Math.abs(r.dernier.de - xDe) < 6 && Math.abs(r.dernier.vers - xVers) < 8,
            `dernier trait posé : ${r.dernier.de}→${r.dernier.vers}`);
        return r;
    };

    console.log('\n=== le rejeu refait le trait dans le sens où on l\'a fait ===');
    /* 6 cm = 300 px d'unité, 0 cm = 0 px : le cas rapporté. */
    await cas('du 6 vers le 0', 300, 0);
    /* Et le sens qui marchait doit continuer de marcher. */
    await cas('du 0 vers le 6', 0, 300);

    console.log('\n=== un trait plus long que la règle, tracé à rebours ===');
    /* 14 cm = 700 px pour une règle de 8 cm : il faut la faire glisser. */
    const long = await cas('du 14 cm vers le 0', 700, 0);
    void long;

    /* LE CRAYON NE QUITTE PAS L'INSTRUMENT, MÊME À REBOURS. On déroule les cent
       images à la main et l'on mesure l'abscisse du crayon DEPUIS L'ORIGINE DE
       LA RÈGLE telle qu'elle est posée à cet instant : elle doit rester entre 0
       et la portée. Un sens juste avec une pose fausse passerait tout ce qui
       précède et échouerait ici. */
    const images = await page.evaluate(() => {
        const a = window.app;
        let i = -1;
        a.entities.forEach((e, k) => {
            if (i >= 0 || !(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
            if (!a.planRegle(e, a.entities[k + 1])) return;
            i = k;
        });
        if (i < 0) return { erreur: 'aucun tracé à la règle' };
        const anim = a.entities[i], cible = a.entities[i + 1];
        const plan = a.planRegle(anim, cible);
        /* SANS LE SENS, LE RECUL NE SE MESURE PAS : (crayon - sDebut) * sens
           vaudrait NaN, et NaN < x est faux — la ligne passerait au vert en
           n'ayant rien mesuré. On refuse donc d'aller plus loin. */
        if (plan.sens === undefined || plan.sDebut === undefined)
            return { erreur: 'le plan ne dit pas le sens du geste' };
        const w = a.rulerWidget;
        let dehors = 0, recule = 0, dernier = null, pire = 0;
        for (let k = 0; k <= 100; k++) {
            const t = k / 100;
            a.replayIndex = i; a.isToolAnimating = true; a.currentAnimProgress = t;
            a.applyInterpolation(anim, t);
            const et = a.etapeRegle(plan, t);
            /* l'avancée se compte dans le sens du geste */
            const avance = (et.crayon - plan.sDebut) * plan.sens;
            if (dernier !== null && avance < dernier - 0.5) recule++;
            dernier = avance;
            const c = plan.point(et.crayon);
            const s = (c.x - w.x) * Math.cos(w.angle) + (c.y - w.y) * Math.sin(w.angle);
            if (s < -1 || s > plan.portee + 1) { dehors++; pire = Math.max(pire, Math.max(-s, s - plan.portee)); }
        }
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        return { passes: plan.passes, L: Math.round(plan.L), portee: plan.portee,
                 sens: plan.sens, dehors, recule, pire: Math.round(pire) };
    });
    if (images.erreur) ck('les images du trait long', false, images.erreur);
    else {
        ck('le trait long demande bien plusieurs poses',
            images.passes > 1, `${images.passes} pose(s) pour ${images.L} px de trait et ${images.portee} px de règle`);
        ck('le plan sait que le geste allait à rebours',
            images.sens === -1, `sens = ${images.sens}`);
        ck('le crayon ne quitte jamais la règle',
            images.dehors === 0, images.dehors ? `${images.dehors} image(s) hors de l'instrument, jusqu'à ${images.pire} px` : '0 image sur 101');
        ck('et il ne revient jamais en arrière',
            images.recule === 0, images.recule ? `${images.recule} recul(s)` : 'aucun recul');
    }

    ck('aucune erreur de page', erreurs.length === 0, erreurs[0] || '');
    await nav.close();
    console.log(fail ? `\n\x1b[31m${fail} échec(s)\x1b[0m` : '\n\x1b[32mtout est vert\x1b[0m');
    process.exit(fail ? 1 : 0);
})().catch(e => { console.log('\x1b[31mBOUM\x1b[0m ' + e.message); process.exit(1); });
