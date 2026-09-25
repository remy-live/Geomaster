/* LA CONSIGNE AUSSI TROUVE SON POINT D'ARRIVÉE AU BOUT DU TRAIT.
 *
 * « Quand un segment est dessiné sans outils à partir de deux points, les deux
 *   points apparaissent puis le segment. On a fait un comportement inverse en
 *   tracé, je crois. »
 *
 * C'est exactement cela, et la moitié de la phrase importe autant que l'autre :
 * il y a DEUX situations, et une seule était fausse.
 *
 * QUAND LES DEUX POINTS EXISTENT DÉJÀ et qu'on les relie, ils doivent paraître
 * avant le trait. Ils existaient vraiment avant ; les montrer après serait le
 * mensonge inverse. Cette sonde le tient aussi, pour que la correction ne
 * déborde pas.
 *
 * QUAND LA PHRASE LES CRÉE, le second se TROUVE au bout du geste — on pose A, on
 * couche la règle, on trace, et B est ce qu'on lit à la graduation. La règle
 * avait été posée pour le geste à la main et le chemin des consignes ne l'avait
 * jamais suivie. Mesuré :
 *
 *   outil segment à la main      Point(A) · Segment · Point(B)
 *   « Trace le segment [AB] »    Point(A) · Point(B) · Segment
 *
 * Et aux instruments, la même phrase ne sortait AUCUNE animation : la règle ne
 * se couchait même pas. « Avec les instruments de géométrie » était coché, et
 * rien ne distinguait la construction de celle sans outils.
 *
 * CE QUE CETTE SONDE MESURE N'EST PAS SEULEMENT L'ORDRE DES OBJETS. Une liste
 * juste peut donner un rejeu faux : le rejeu dessine le trait en cours en
 * regardant l'objet qui SUIT l'animation, et c'est ce détail qui avait fait
 * poser le point avant le geste la première fois. On gèle donc le rejeu à
 * mi-course et l'on regarde si B est dessiné — ce que l'élève voit.
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

    const jouer = (phrase, avec, prep) => page.evaluate(([phrase, avec, prep]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        (prep || []).forEach(p => { try { a.executerConsigneAvec(p, avec); } catch (e) { void e; } });
        const n0 = a.entities.length;
        let r;
        try { r = a.executerConsigneAvec(phrase, avec); }
        catch (e) { return { boum: e.message }; }
        const neufs = a.entities.slice(n0);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '',
                 ordre: neufs.map(e => e.constructor.name
                     + (e instanceof Point ? '(' + (e.label || '?') + ')' : '')
                     + (e.originalType ? '[' + e.originalType + ']' : '')),
                 /* les indices, pour dire QUI vient avant QUI */
                 iTrait: neufs.findIndex(e => e instanceof Segment || e instanceof Line
                     || e instanceof Ray),
                 iB: neufs.findIndex(e => e instanceof Point && e.label === 'B'),
                 iAnim: neufs.findIndex(e => e.originalType === 'trace') };
    }, [phrase, avec, prep || null]);

    /* ============================================================
       1. LA PHRASE CRÉE LES DEUX POINTS
       ============================================================ */
    for (const [genre, phrase] of [['le segment', 'Trace le segment [AB]'],
                                   ['la droite', 'Trace la droite (AB)'],
                                   ['la demi-droite', 'Trace la demi-droite [AB)']]) {
        console.log(`\n=== ${phrase} — sur feuille vide ===`);
        for (const avec of [false, true]) {
            const r = await jouer(phrase, avec);
            const comment = avec ? 'aux instruments' : 'sans outils';
            ck(`${comment} : ${genre} est tracé`, !r.boum && r.ok,
               r.boum ? 'BOUM ' + r.boum : r.ordre.join(' · '));
            if (r.boum) continue;
            ck('  A est posé en premier',
               r.ordre[0] && /^Point\(A\)/.test(r.ordre[0]), r.ordre[0]);
            ck('  et B se trouve APRÈS le trait', r.iB > r.iTrait && r.iTrait >= 0,
               `trait en ${r.iTrait}, B en ${r.iB}`);
            if (avec) {
                /* AUX INSTRUMENTS, LA RÈGLE SE COUCHE. Sans animation, la case
                   cochée ne change rien et la construction n'est pas montrée. */
                ck('    la règle se couche avant le trait',
                   r.iAnim >= 0 && r.iAnim < r.iTrait,
                   r.iAnim < 0 ? 'aucune animation' : 'animation en ' + r.iAnim);
            }
        }
    }

    /* ============================================================
       2. DEUX POINTS DÉJÀ POSÉS RESTENT AVANT LE TRAIT
       L'autre bord : la correction ne doit pas déborder.
       ============================================================ */
    console.log('\n=== deux points déjà posés, puis reliés ===');
    for (const avec of [false, true]) {
        const r = await jouer('Trace le segment [AB]', avec, ['Place les points A et B']);
        ck(`${avec ? 'aux instruments' : 'sans outils'} : le trait seul est ajouté`,
           !r.boum && r.ok && r.iB < 0, r.ordre.join(' · '));
        ck('  et les deux points sont restés où ils étaient',
           r.ordre.filter(x => /^Point/.test(x)).length === 0,
           r.ordre.filter(x => /^Point/.test(x)).join(' ') || 'aucun point neuf');
    }

    /* ============================================================
       3. CE QUE L'ÉLÈVE VOIT : le rejeu gelé à mi-course
       Une liste juste peut donner un rejeu faux. Le rejeu dessine le trait en
       cours en regardant l'objet qui SUIT l'animation — c'est ce détail qui
       avait fait poser le point avant le geste la première fois.
       ============================================================ */
    console.log('\n=== et à mi-course, B n\'est pas encore là ===');
    const vu = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace le segment [AB]', true);
        const iAnim = a.entities.findIndex(e => e.originalType === 'trace');
        const B = a.entities.find(e => e instanceof Point && e.label === 'B');
        if (iAnim < 0 || !B) return { manque: true };
        /* ON FIGE le rejeu sur l'animation, et l'on demande UN rendu. */
        const encreAutour = (p) => {
            const x = Math.round(p.x * a.view.zoom + a.view.x) - 14;
            const y = Math.round(p.y * a.view.zoom + a.view.y) - 14;
            const d = a.canvas.getContext('2d').getImageData(x, y, 28, 28).data;
            let n = 0;
            for (let i = 0; i < d.length; i += 4) {
                /* la croix d'un point est ROUGE : on ne compte qu'elle */
                if (d[i + 3] > 60 && d[i] > 150 && d[i + 1] < 110 && d[i + 2] < 110) n++;
            }
            return n;
        };
        const geler = (t) => {
            a.isReplaying = true; a.isToolAnimating = true;
            a.replayIndex = iAnim; a.currentAnimProgress = t;
            a.applyInterpolation(a.entities[iAnim], t);
            a.render();
        };
        geler(0.5); const mi = encreAutour(B);
        /* et une fois tout rejoué, B doit être là */
        a.isReplaying = false; a.isToolAnimating = false;
        a.replayIndex = a.entities.length; a.render();
        const fin = encreAutour(B);
        return { mi, fin };
    });
    ck('la consigne a bien sorti la règle', !vu.manque);
    if (!vu.manque) {
        ck('  à mi-course, aucune croix rouge à la place de B', vu.mi === 0, vu.mi + ' px');
        ck('  et une fois le trait fini, elle y est', vu.fin > 20, vu.fin + ' px');
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
