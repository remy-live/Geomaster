/* LE REJEU TOURNE DANS LE SENS OÙ LA MAIN A TOURNÉ.
 *
 * « Quand je rejoue une animation, le compas ne va pas dans le sens où j'ai
 *   tracé initialement. »
 *
 * C'ÉTAIT LE PRIX D'UNE CORRECTION PRÉCÉDENTE, et le commentaire du code le
 * disait sans voir ce qu'il coûtait : « le rejeu redessine l'encre telle qu'elle
 * est : un seul balayage d'une borne à l'autre, DANS LE SENS CROISSANT ». Pour
 * que l'encre ne s'efface pas quand on revient sur ses pas, l'arc ne garde que
 * les deux BORNES de la rotation — la plus petite, la plus grande. Rangées ainsi,
 * elles ne disent plus de quel bout la main est partie, et l'animation recevait
 * ces bornes dans cet ordre-là.
 *
 * MESURÉ AVANT, un arc tracé de 0° vers −88° : l'arc gardé « −88° → 0° », et
 * l'animation « −88° → 0° » aussi. À mi-rejeu la mine était bien à −44°, mais
 * l'encre se remplissait de −88° VERS 0° : le trait naissait au bout où le geste
 * s'était terminé.
 *
 * ET UN SECOND DÉFAUT SE CACHAIT DERRIÈRE. Le dessin du rejeu passait à
 * `ctx.arc` le drapeau de l'arc rangé, toujours faux (horaire). Or
 * `ctx.arc(…, 0, −0,77, false)` ne dessine pas 44° : il part de 0 et va EN AVANT
 * jusqu'à −0,77, soit 316° — l'arc COMPLÉMENTAIRE. Un rejeu à rebours montrait
 * donc le grand arc qui se vide au lieu du petit qui se remplit. Les deux
 * corrections sont nécessaires, et aucune ne suffit seule : c'est pourquoi cette
 * sonde mesure les DEUX — de quel bout l'animation part, et quelle étendue est
 * réellement dessinée à mi-course. Épreuve faite dans les deux sens : sur la
 * version d'avant, le départ est faux et l'étendue juste ; en ne corrigeant que
 * le départ, le départ est juste et l'étendue monte à 316°.
 *
 * L'ARC, LUI, NE CHANGE PAS : ses deux bornes rangées décrivent exactement la
 * même encre, et la sonde l'exige — sans quoi on aurait réparé le rejeu en
 * déplaçant le trait.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};
const deg = (r) => Math.round(r * 180 / Math.PI);

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.waitForTimeout(900);
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* On trace à la main : la mine part d'un angle et suit son cercle. Les étapes
       intermédiaires comptent — c'est la succession des positions qui fabrique la
       rotation, et donc le sens. */
    const tracer = async (chemin) => {
        const g = await page.evaluate((depart) => {
            const a = window.app;
            a.entities = []; a.historyPast = []; a.historyFuture = [];
            a.view = { x: 0, y: 0, zoom: 1 };
            if (!a.activeWidgets.compass) a.toggleWidget('compass');
            const w = a.compassWidget;
            w.x = 600; w.y = 500; w.radius = 200;
            w.angle = depart * Math.PI / 180;
            w.rotMin = undefined; w.rotMax = undefined; w.sensGeste = 0;
            a.currentTracingArc = null;
            a.render();
            const b = a.canvas.getBoundingClientRect();
            return { cx: b.left + 600, cy: b.top + 500, r: 200 };
        }, chemin[0]);
        const pos = (d) => ({ x: g.cx + Math.cos(d * Math.PI / 180) * g.r,
                              y: g.cy + Math.sin(d * Math.PI / 180) * g.r });
        const p0 = pos(chemin[0]);
        await page.mouse.move(p0.x, p0.y);
        await page.mouse.down();
        for (let k = 1; k < chemin.length; k++) {
            const pas = (chemin[k] > chemin[k - 1]) ? 4 : -4;
            for (let d = chemin[k - 1] + pas; (pas > 0 ? d <= chemin[k] : d >= chemin[k]); d += pas) {
                const q = pos(d);
                await page.mouse.move(q.x, q.y);
                await page.waitForTimeout(5);
            }
        }
        await page.mouse.up();
        await page.waitForTimeout(200);
    };

    /* Ce que le rejeu DESSINE à la moitié : on fige l'avancement et l'on
       espionne ctx.arc. Lire l'angle de la mine ne suffirait pas — c'est la
       deuxième moitié du défaut : la mine était au bon endroit et l'encre à
       l'envers. */
    const miRejeu = () => page.evaluate(() => {
        const a = window.app;
        const arc = a.entities.filter(e => e.constructor.name === 'CompassArc').pop();
        const anim = a.entities.filter(e => e.constructor.name === 'ToolAnimation'
            && e.widgetType === 'compass').pop();
        if (!arc || !anim) return null;
        const i = a.entities.indexOf(anim);
        const vus = [];
        const vrai = a.ctx.arc.bind(a.ctx);
        a.ctx.arc = function (x, y, rr, s, e2, ccw) { vus.push({ s, e: e2, ccw: !!ccw, rr }); return vrai(x, y, rr, s, e2, ccw); };
        a.replayIndex = i; a.isToolAnimating = true; a.ArcTracing = false;
        a.applyInterpolation(anim, 0.5); a.ArcTracing = true;
        a.currentAnimProgress = 0.5;
        a.dessinerTout();
        a.ctx.arc = vrai;
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        const tirets = vus.filter(v => Math.abs(v.rr - arc.radius) < 2);
        const etendue = (d) => {
            let x = (d.ccw ? d.s - d.e : d.e - d.s) * 180 / Math.PI;
            while (x < 0) x += 360;
            return x;
        };
        return {
            arc: { debut: arc.startAngle, fin: arc.endAngle },
            anim: { depart: anim.startState.angle, arrivee: anim.endState.angle },
            mine: a.compassWidget.angle,
            dessine: tirets.length ? { de: tirets[0].s, etendue: etendue(tirets[0]) } : null,
        };
    });

    // ------------------------------------------------------------------
    console.log('\n=== dans le sens des aiguilles : rien ne change ===');
    await tracer([0, 90]);
    let m = await miRejeu();
    ck('l\'animation part de 0°', !!m && Math.abs(deg(m.anim.depart)) <= 2,
       m ? `${deg(m.anim.depart)}° → ${deg(m.anim.arrivee)}°` : 'arc ou animation manquant');
    ck('et à mi-course, l\'encre couvre la moitié du geste',
       !!m && m.dessine && Math.abs(m.dessine.etendue - 44) < 6,
       m && m.dessine ? `${Math.round(m.dessine.etendue)}° dessinés depuis ${deg(m.dessine.de)}°` : 'rien dessiné');

    console.log('\n=== dans l\'autre sens : le rejeu suit la main ===');
    await tracer([0, -90]);
    m = await miRejeu();
    ck('l\'arc gardé range toujours ses bornes dans l\'ordre croissant',
       !!m && m.arc.debut < m.arc.fin && Math.abs(deg(m.arc.debut) + 88) < 4 && Math.abs(deg(m.arc.fin)) < 4,
       m ? `${deg(m.arc.debut)}° → ${deg(m.arc.fin)}°` : '');
    ck('mais l\'animation part du bout où la main a commencé (0°)',
       !!m && Math.abs(deg(m.anim.depart)) <= 2 && deg(m.anim.arrivee) < -80,
       m ? `${deg(m.anim.depart)}° → ${deg(m.anim.arrivee)}°  (−88° → 0° avant la correction)` : '');
    /* CETTE LIGNE GARDE LA SECONDE MOITIÉ DE LA CORRECTION, et son chiffre a été
       mesuré plutôt qu'affirmé. Sur la version d'avant elle passait au vert —
       44° dessinés, mais depuis −88°, le mauvais bout : c'est la ligne du dessus
       qui prend ce défaut-là. En revanche, si l'on corrigeait le SENS de
       l'animation sans corriger le drapeau passé à ctx.arc, elle verrait 316° :
       vérifié en remettant ce seul drapeau. Les deux lignes ensemble couvrent les
       deux moitiés ; aucune ne suffit seule. */
    ck('et l\'encre dessinée est le PETIT arc qui se remplit, non le grand qui se vide',
       !!m && m.dessine && Math.abs(m.dessine.etendue - 44) < 6,
       m && m.dessine ? `${Math.round(m.dessine.etendue)}° dessinés depuis ${deg(m.dessine.de)}° (316° si l'on corrige le sens sans le drapeau — mesuré)` : 'rien dessiné');

    console.log('\n=== un geste qui revient sur ses pas garde son bout de départ ===');
    /* La main part de 0°, monte à +60°, puis redescend à +20° : l'encre couvre
       0°→60° — elle ne s'efface pas — et le rejeu doit partir de 0°. */
    await tracer([0, 60, 20]);
    m = await miRejeu();
    ck('l\'encre couvre tout ce que la mine a visité',
       !!m && Math.abs(deg(m.arc.debut)) < 4 && Math.abs(deg(m.arc.fin) - 56) < 8,
       m ? `${deg(m.arc.debut)}° → ${deg(m.arc.fin)}°` : '');
    ck('et le rejeu part du bout d\'où la main est partie',
       !!m && Math.abs(deg(m.anim.depart)) <= 4,
       m ? `${deg(m.anim.depart)}° → ${deg(m.anim.arrivee)}°` : '');

    // ------------------------------------------------------------------
    console.log('\n=== et le sens survit à l\'enregistrement et au lien ===');
    await tracer([0, -90]);
    const parFichier = await page.evaluate(() => {
        const a = window.app;
        const json = JSON.stringify({ data: a.serialize() });
        /* `deserialize` REND la liste, il ne la pose pas : l'appeler sans prendre
           son résultat laisserait une feuille vide, où tout est vrai sans rien
           prouver. */
        a.entities = a.deserialize(JSON.parse(json).data);
        const anim = a.entities.filter(e => e.constructor.name === 'ToolAnimation'
            && e.widgetType === 'compass').pop();
        return anim ? { depart: anim.startState.angle, arrivee: anim.endState.angle } : null;
    });
    ck('après enregistrement et relecture, l\'animation part encore de 0°',
       !!parFichier && Math.abs(deg(parFichier.depart)) <= 2 && deg(parFichier.arrivee) < -80,
       parFichier ? `${deg(parFichier.depart)}° → ${deg(parFichier.arrivee)}°` : 'animation perdue');

    await tracer([0, -90]);
    const parLien = await page.evaluate(() => {
        const a = window.app;
        const lien = a.getCompressedString();
        a.entities = []; a.historyPast = [];
        a.loadFromCompressedString(lien);
        const anim = a.entities.filter(e => e.constructor.name === 'ToolAnimation'
            && e.widgetType === 'compass').pop();
        return anim ? { depart: anim.startState.angle, arrivee: anim.endState.angle } : null;
    });
    ck('et après un lien de partage aussi',
       !!parLien && Math.abs(deg(parLien.depart)) <= 2 && deg(parLien.arrivee) < -80,
       parLien ? `${deg(parLien.depart)}° → ${deg(parLien.arrivee)}°` : 'animation perdue par le lien');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
