/* À LA MAIN AUSSI, LE POINT D'ARRIVÉE SE TROUVE AU BOUT DU TRAIT.
 *
 * « Quand je dessine un segment avec la règle (outil segment), je dessine un
 *   point A puis je trace le trait et j'obtiens le point B. Normalement à
 *   l'outil, j'ai le point A, je trace et je fais glisser la règle jusqu'au bout
 *   du segment puis je place le point, ce n'est pas le cas. »
 *
 * Les consignes écrites venaient d'être corrigées sur ce point ; l'outil à la
 * main, non. MESURÉ : règle sortie, un trait tiré le long de son bord donnait
 *
 *     0 Point A · 1 Point B · 2 ToolAnimation[ruler] · 3 Segment
 *
 * B était rangé AVANT même que la règle se couche. Au rejeu, les deux points
 * étaient donc là dès la première image et le trait venait les relier : le geste
 * montré n'était celui de personne. Le bon ordre met le point APRÈS l'objet
 * tracé — et surtout jamais ENTRE l'animation et lui, puisque le rejeu dessine
 * le trait en cours en regardant l'entité qui suit immédiatement l'animation ;
 * s'il y trouve un point, le crayon court à vide.
 *
 * LA RÈGLE, ELLE, GLISSAIT DÉJÀ. C'est ce que la sonde vérifie en second, parce
 * que c'est la moitié de la phrase : le trait mesuré fait 690 px pour une règle
 * de 400, et le plan de tracé compte bien trois poses. Ce n'était donc pas le
 * glissement qui manquait, mais le point posé d'avance qui donnait la réponse
 * avant la construction — et rendait le glissement inutile à regarder.
 *
 * DEUX PIÈGES QUE LA SONDE TIENT, PARCE QU'ILS NE SE VOIENT PAS AU COMPTAGE.
 *
 * 1. UN POINT ACCROCHÉ N'EST PAS UN POINT NEUF. Quand le trait arrive sur un
 *    point déjà posé, rien n'est créé : le déplacer le sortirait de l'ordre où
 *    l'élève l'a mis, et le compter deux fois le dédoublerait. La sonde tire un
 *    trait jusqu'à un point existant et vérifie qu'il n'y en a toujours que
 *    deux, à leur place.
 *
 * 2. LE DOIGT ET LA SOURIS SONT DEUX CHEMINS DE CODE. La branche tactile sort
 *    par un `return` avant la branche souris — c'est déjà elle qui, autrefois,
 *    privait la tablette du crayon au rejeu. Une correction faite d'un seul côté
 *    passerait toutes les vérifications à la souris. La sonde ouvre donc un
 *    second navigateur, tactile, et refait le même trait au doigt.
 *
 * Et le reste des outils à deux points suit la même règle : droite, demi-droite,
 * cercle. Le rayon d'un cercle se trouve lui aussi au bout du geste.
 */
const { chromium, devices } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const erreurs = [];

    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    const propre = (p) => p.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });
    await propre(page);

    /* On prépare la feuille et l'on rend les coordonnées écran : la règle est
       posée à plat, et l'on tirera le trait le long de son bord — le bord est la
       ligne y = 0 du repère de l'instrument, son corps est en dessous. */
    const preparer = (p, outil, regle, dejaLa) => p.evaluate(([outil, regle, dejaLa]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        if (regle && !a.activeWidgets.ruler) a.toggleWidget('ruler');
        if (!regle && a.activeWidgets.ruler) a.toggleWidget('ruler');
        if (a.rulerWidget) { a.rulerWidget.x = 300; a.rulerWidget.y = 400; a.rulerWidget.angle = 0; }
        (dejaLa || []).forEach(q => a.addEntity(new Point(q[0], q[1], q[2])));
        a.currentTool = outil;
        a.lastUsedWidgetForCreation = null;
        const r = a.canvas.getBoundingClientRect();
        const e = (x, y) => ({ x: r.left + x * a.view.zoom + a.view.x,
                               y: r.top + y * a.view.zoom + a.view.y });
        return { debut: e(310, 395), fin: e(1000, 395), portee: a.rulerWidget ? a.rulerWidget.width : 0 };
    }, [outil, regle, dejaLa || null]);

    const tracerSouris = async (p, d, f) => {
        await p.mouse.move(d.x, d.y); await p.mouse.down();
        for (let k = 1; k <= 12; k++) {
            await p.mouse.move(d.x + (f.x - d.x) * k / 12, d.y + (f.y - d.y) * k / 12);
        }
        await p.mouse.up();
    };

    /* Ce qu'il faut lire n'est pas « combien d'objets » mais DANS QUEL ORDRE. */
    const ordre = (p) => p.evaluate(() => {
        const a = window.app;
        const i = a.entities.findIndex(e => e instanceof ToolAnimation && e.originalType === 'trace');
        const plan = (i >= 0 && a.planRegle) ? a.planRegle(a.entities[i], a.entities[i + 1]) : null;
        return {
            rangs: a.entities.map(e => e.constructor.name),
            points: a.entities.filter(e => e instanceof Point).length,
            iAnim: i,
            apresAnim: (i >= 0 && a.entities[i + 1]) ? a.entities[i + 1].constructor.name : null,
            dernier: a.entities.length ? a.entities[a.entities.length - 1].constructor.name : null,
            plan: plan ? { L: Math.round(plan.L), portee: Math.round(plan.portee), passes: plan.passes } : null,
        };
    });

    console.log('\n=== le trait tiré le long de la règle ===');
    {
        const g = await preparer(page, 'segment', true);
        await tracerSouris(page, g.debut, g.fin);
        const o = await ordre(page);
        ck('deux points, un segment, une animation',
           o.points === 2 && o.rangs.join(' ') === 'Point ToolAnimation Segment Point',
           o.rangs.join(' · '));
        ck('  le segment suit immédiatement l\'animation', o.apresAnim === 'Segment',
           String(o.apresAnim));
        ck('  et le point d\'arrivée vient en DERNIER', o.dernier === 'Point', String(o.dernier));
        ck('la règle de 400 px se repose trois fois pour 690',
           !!o.plan && o.plan.passes === 3 && o.plan.portee === 400,
           JSON.stringify(o.plan));
    }

    /* LA MESURE QUI COMPTE : on gèle le rejeu au milieu du trait et l'on regarde
       si B se dessine. L'ordre peut être juste et l'image fausse. */
    console.log('\n=== image par image : B n\'apparaît qu\'au bout du crayon ===');
    {
        const film = await page.evaluate(() => {
            const a = window.app;
            const i = a.entities.findIndex(e => e instanceof ToolAnimation && e.originalType === 'trace');
            const b = a.entities[i + 2];
            if (!(b instanceof Point)) return { erreur: 'pas de point après le segment' };
            const vrai = b.draw.bind(b);
            let vues = 0;
            b.draw = function (...args) { vues++; return vrai(...args); };
            const image = (idx, t) => {
                vues = 0;
                a.replayIndex = idx;
                a.isToolAnimating = (t !== null);
                a.currentAnimProgress = (t === null) ? undefined : t;
                if (t !== null) a.applyInterpolation(a.entities[idx], t);
                a.render();
                return vues;
            };
            const milieu = image(i, 0.5);
            /* Le rendu dessine ce qui est STRICTEMENT avant replayIndex : pour
               voir le point du rang i+2, il faut que le curseur l'ait dépassé. */
            const apres = image(i + 3, null);
            a.isToolAnimating = false; a.currentAnimProgress = undefined;
            a.replayIndex = a.entities.length;
            delete b.draw;
            return { nom: b.label || '?', milieu, apres };
        });
        if (film.erreur) ck('le rejeu', false, film.erreur);
        else {
            ck(film.nom + ' ne se dessine pas à mi-course', film.milieu === 0,
               'dessiné ' + film.milieu + ' fois');
            ck('  et se dessine une fois le trait fini', film.apres > 0,
               film.apres ? 'oui' : 'NON');
        }
    }

    console.log('\n=== un point accroché n\'est pas un point neuf ===');
    {
        const g = await preparer(page, 'segment', true, [[1000, 395, 'Z']]);
        await tracerSouris(page, g.debut, g.fin);
        const o = await ordre(page);
        ck('toujours deux points, pas trois', o.points === 2, String(o.points));
        ck('  et Z n\'a pas bougé de sa place',
           o.rangs.join(' ') === 'Point Point ToolAnimation Segment', o.rangs.join(' · '));
    }

    console.log('\n=== les autres outils à deux points suivent ===');
    for (const [outil, regle, attendu] of [
        ['line', true, 'Point ToolAnimation Line Point'],
        ['line_clean', true, 'Point ToolAnimation Line Point'],
        ['ray', true, 'Point ToolAnimation Ray Point'],
        ['circle', false, 'Point Circle Point'],
    ]) {
        const g = await preparer(page, outil, regle);
        await tracerSouris(page, g.debut, g.fin);
        const o = await ordre(page);
        /* Sans instrument sorti, une animation « range la règle » peut traîner en
           tête de liste : elle ne dessine rien, on ne la compte pas. */
        const vus = o.rangs.filter(n => n !== 'ToolAnimation' || true).join(' ');
        ck(outil, vus.endsWith(attendu), vus);
    }

    console.log('\n=== et au doigt, qui est un autre chemin de code ===');
    {
        const ctx = await nav.newContext({ viewport: { width: 900, height: 900 },
            hasTouch: true, isMobile: true, deviceScaleFactor: 2,
            userAgent: devices['iPhone 13'].userAgent });
        const tel = await ctx.newPage();
        tel.on('pageerror', e => erreurs.push('tactile: ' + e.message));
        await tel.goto(PAGE);
        await tel.waitForFunction(() => window.app);
        await propre(tel);
        const g = await tel.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            a.tactileMode = true;
            if (!a.activeWidgets.ruler) a.toggleWidget('ruler');
            a.rulerWidget.x = 120; a.rulerWidget.y = 500; a.rulerWidget.angle = 0;
            a.currentTool = 'segment';
            a.lastUsedWidgetForCreation = null;
            const r = a.canvas.getBoundingClientRect();
            const e = (x, y) => ({ x: r.left + x * a.view.zoom + a.view.x,
                                   y: r.top + y * a.view.zoom + a.view.y });
            return { a: e(130, 495), b: e(460, 495), tactile: a.tactileMode };
        });
        ck('le mode tactile est bien celui qu\'on mesure', g.tactile === true);
        await tel.touchscreen.tap(g.a.x, g.a.y);
        await tel.waitForTimeout(120);
        await tel.touchscreen.tap(g.b.x, g.b.y);
        await tel.waitForTimeout(120);
        const o = await ordre(tel);
        ck('le segment se fait en deux appuis',
           o.rangs.filter(n => n === 'Segment').length === 1, o.rangs.join(' · '));
        ck('  et le point d\'arrivée y est aussi le dernier',
           o.dernier === 'Point' && o.apresAnim !== 'Point', o.rangs.join(' · '));
        await ctx.close();
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
