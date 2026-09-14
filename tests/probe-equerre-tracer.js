/* L'ÉQUERRE QU'ON REGARDE À TRAVERS, ET LA PARALLÈLE QU'ON TRACE.
 *
 * « Rends l'équerre de manière globale un peu moins opaque. Pour la parallèle,
 *   tu oublies de tracer la parallèle… »
 *
 * DEUX DEMANDES, DEUX CAUSES QU'ON N'AURAIT PAS DEVINÉES EN LISANT LE CODE.
 *
 * 1. L'ÉQUERRE N'ÉTAIT PAS TROP OPAQUE : ELLE ÉTAIT PEINTE TROIS FOIS. On
 *    cherchait un réglage de couleur ; c'était une addition. Mesuré : la méthode
 *    draw() de chaque instrument était appelée TROIS FOIS par image — deux
 *    passes anciennes, plus la passe ordonnée par z-index, celle qui décide
 *    lequel est au-dessus et qui sert aussi à l'export. Or trois couches
 *    translucides ne font pas une couche translucide : à 0,5 chacune il reste
 *    0,88 d'opacité. Baisser le réglage n'y pouvait rien — trois fois moins
 *    opaque restait presque opaque. La sonde compte donc les APPELS, pas les
 *    couleurs : un par instrument et par image, sinon le défaut revient par la
 *    porte de derrière le jour où quelqu'un rétablira une passe.
 *    Et elle mesure ce qui compte vraiment : le CONTRASTE d'un trait noir vu à
 *    travers. Il en restait 8 % ; il en reste 44 %.
 *
 * 2. LA PARALLÈLE N'ÉTAIT PAS TRACÉE, elle PARAISSAIT. Le crayon court le long
 *    de la règle pour un segment ou une droite — jamais pour une parallèle ni
 *    une perpendiculaire : le test qui déclenche le tracé progressif exigeait un
 *    LinearObject, un Segment, une Line ou une Ray, et une ParallelLine n'est
 *    aucun des quatre. Elle descend de GeometryObject, parce qu'elle n'a pas
 *    deux extrémités mais un point et une direction — et c'est précisément ce
 *    qui la faisait rater : même admise, p2 était nul et le crayon n'avait nulle
 *    part où aller. L'équerre glissait donc jusqu'à C, puis le trait apparaissait
 *    d'un coup. Tout le geste était montré SAUF celui qui fait la figure.
 *
 * LA SONDE FIGE L'ÉTAT AU LIEU DE COURIR APRÈS L'ANIMATION. Guetter une image
 * au vol pendant un rejeu donne des mesures qui dépendent de la vitesse de la
 * machine — on l'a payé en cherchant ce défaut-ci. On pose donc l'index de
 * rejeu, le drapeau d'animation et l'avancement à la main, on demande UN rendu,
 * et l'on regarde les traits réellement dessinés. À mi-course, le trait doit
 * faire la moitié de sa longueur finale : c'est cela, « être tracé ».
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

    console.log('\n=== chaque instrument ne se peint qu\'une fois par image ===');
    const passes = await page.evaluate(() => {
        const a = window.app;
        a.entities = [];
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(t => {
            if (!a.activeWidgets[t]) a.toggleWidget(t);
        });
        const w = { ruler: a.rulerWidget, setsquare: a.setSquareWidget,
                    protractor: a.protractorWidget, compass: a.compassWidget };
        const n = {}, vrais = {};
        Object.entries(w).forEach(([k, o]) => {
            if (!o) return;
            n[k] = 0; vrais[k] = o.draw.bind(o);
            o.draw = function (c) { n[k]++; return vrais[k](c); };
        });
        a.render();
        Object.entries(w).forEach(([k, o]) => { if (o) o.draw = vrais[k]; });
        return n;
    });
    Object.entries(passes).forEach(([nom, n]) => {
        ck(nom, n === 1, n + ' appel(s) à draw() par image');
    });

    console.log('\n=== et l\'on voit le trait à travers l\'équerre ===');
    const vu = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const p1 = new Point(200, 300, ''), p2 = new Point(900, 300, '');
        p1.visible = false; p2.visible = false;
        a.addEntity(p1); a.addEntity(p2);
        a.addEntity(new Segment(p1, p2, { color: '#000000', width: 4 }));
        /* Le canevas est TRANSPARENT : le blanc vient de la page. On compose
           donc sur blanc, comme le voit l'œil — sans quoi le fond se lit « 0 »
           et l'on conclut exactement l'inverse de la vérité. */
        const lire = (x0, y0) => {
            const d = a.canvas.getContext('2d').getImageData(x0, y0, 30, 3).data;
            let s = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) {
                const al = d[i + 3] / 255;
                s += ((d[i] * al + 255 * (1 - al)) + (d[i + 1] * al + 255 * (1 - al))
                      + (d[i + 2] * al + 255 * (1 - al))) / 3;
                n++;
            }
            return s / n;
        };
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(t => {
            if (a.activeWidgets[t]) a.toggleWidget(t);
        });
        a.render();
        const traitNu = lire(490, 299), fondNu = lire(490, 340);
        a.toggleWidget('setsquare');
        const w = a.setSquareWidget; w.x = 250; w.y = 250; w.angle = 0;
        a.render();
        const traitSous = lire(490, 299), fondSous = lire(490, 340);
        return { nu: fondNu - traitNu, sous: fondSous - traitSous };
    });
    const garde = Math.round(100 * vu.sous / (vu.nu || 1));
    ck('un trait noir reste lisible sous l\'équerre',
       garde >= 30, garde + ' % du contraste conservé (8 % avant)');

    console.log('\n=== la parallèle est TRACÉE, pas seulement posée ===');
    /* On fige l'état au lieu de courir après l'animation : la mesure ne dépend
       plus de la vitesse de la machine. */
    const tracer = (phrases) => page.evaluate((phrases) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(t => {
            if (a.activeWidgets[t]) a.toggleWidget(t);
        });
        phrases.forEach(p => a.executerConsigneAvec(p, true));
        const cible = a.entities.find(e => e instanceof ParallelLine
            || e instanceof PerpendicularLine || e instanceof Segment && e.p1 && e.p1.label);
        const i = a.entities.indexOf(cible);
        const anim = a.entities[i - 1];
        if (!anim || !(anim instanceof ToolAnimation) || anim.originalType !== 'trace') {
            return { erreur: 'pas d\'animation de tracé devant ' + (cible && cible.constructor.name) };
        }
        const c = a.ctx;
        const vm = c.moveTo.bind(c), vl = c.lineTo.bind(c);
        const mesure = (prog) => {
            const traits = [];
            let d = null;
            c.moveTo = function (x, y) { d = { x, y }; return vm(x, y); };
            c.lineTo = function (x, y) {
                if (d) { const L = Math.hypot(x - d.x, y - d.y); if (L > 40) traits.push(Math.round(L)); }
                return vl(x, y);
            };
            a.replayIndex = i - 1; a.isToolAnimating = true; a.currentAnimProgress = prog;
            a.dessinerTout();
            c.moveTo = vm; c.lineTo = vl;
            return traits;
        };
        const aMi = mesure(0.5), aFond = mesure(1.0), auDebut = mesure(0.02);
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        return { quoi: cible.constructor.name, mi: aMi, fond: aFond, debut: auDebut };
    }, phrases);

    for (const [nom, phrases] of [
        ['la parallèle', ['Place les points A, B et C', 'Trace la parallèle à (AB) passant par C']],
        ['la perpendiculaire', ['Place les points A, B et C', 'Trace la perpendiculaire à (AB) passant par C']],
    ]) {
        const r = await tracer(phrases);
        if (r.erreur) { ck(nom, false, r.erreur); continue; }
        /* Le trait du crayon : celui qui grandit avec l'avancement. On cherche
           une longueur présente à mi-course qui vaut la moitié d'une longueur
           présente à la fin — c'est la signature d'un tracé progressif, et rien
           d'autre sur la figure ne se comporte ainsi. */
        const couple = r.fond.find(L => r.mi.some(m => Math.abs(m - L / 2) <= 3));
        ck(nom + ' grandit avec le geste', !!couple,
           couple ? `${Math.round(couple / 2)} px à mi-course, ${couple} px à la fin`
                  : `mi-course : ${r.mi.join(', ')} · fin : ${r.fond.join(', ')}`);
        ck('  et au tout début, le crayon n\'a presque rien tracé',
           !r.debut.some(L => couple && Math.abs(L - couple) <= 3),
           'longueurs vues : ' + ([...new Set(r.debut)].sort((x, y) => x - y).join(', ') || 'aucune'));
    }

    console.log('\n=== et le segment, qui marchait déjà, marche toujours ===');
    const seg = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        ['ruler', 'setsquare', 'protractor', 'compass'].forEach(t => {
            if (a.activeWidgets[t]) a.toggleWidget(t);
        });
        /* Il faut une phrase qui sorte VRAIMENT la règle : « Trace le segment
           [AB] de 6 cm » n'en sort aucune, ici comme ailleurs — c'est mesuré
           dans probe-banc-phrases. Le triangle, lui, se construit aux
           instruments. */
        a.executerConsigneAvec('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', true);
        let i = -1;
        a.entities.forEach((e, k) => {
            if (i >= 0 || !(e instanceof Segment)) return;
            const av = a.entities[k - 1];
            if (av instanceof ToolAnimation && av.originalType === 'trace'
                && (av.widgetType === 'ruler' || av.widgetType === 'setsquare')) i = k;
        });
        if (i < 0) return null;
        const c = a.ctx;
        const vm = c.moveTo.bind(c), vl = c.lineTo.bind(c);
        const mesure = (prog) => {
            const t = []; let d = null;
            c.moveTo = function (x, y) { d = { x, y }; return vm(x, y); };
            c.lineTo = function (x, y) {
                if (d) { const L = Math.hypot(x - d.x, y - d.y); if (L > 40) t.push(Math.round(L)); }
                return vl(x, y);
            };
            a.replayIndex = i - 1; a.isToolAnimating = true; a.currentAnimProgress = prog;
            a.dessinerTout();
            c.moveTo = vm; c.lineTo = vl;
            return t;
        };
        const mi = mesure(0.5), fond = mesure(1.0);
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        return { mi, fond };
    });
    const coupleSeg = seg && seg.fond.find(L => seg.mi.some(m => Math.abs(m - L / 2) <= 3));
    ck('le segment se trace toujours progressivement', !!coupleSeg,
       coupleSeg ? `${Math.round(coupleSeg / 2)} px à mi-course, ${coupleSeg} px à la fin`
                 : (seg ? `mi : ${seg.mi.join(', ')} · fin : ${seg.fond.join(', ')}` : 'pas d\'animation'));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
