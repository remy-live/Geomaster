/* LE POINT D'ARRIVÉE SE TROUVE, IL NE SE POSE PAS.
 *
 * « Quand on trace un long segment avec la règle qui s'allonge, il faut
 *   dessiner le point final qu'à la fin du tracé ; là tu mets les deux points et
 *   tu traces. »
 *
 * Sur une feuille, on pose A, on couche la règle, on trace — et B est ce qu'on
 * TROUVE à la graduation, au bout du geste. Le poser d'avance, c'est donner la
 * réponse avant la construction : le rejeu montrait deux points déjà là et un
 * trait qui venait les relier, ce qui n'est le geste de personne. Le troisième
 * sommet d'un triangle suivait déjà cette règle — il naît du croisement de deux
 * arcs de compas — ; le second, non. Et le rectangle et le parallélogramme
 * posaient leurs TROIS premiers sommets d'un coup avant de sortir le moindre
 * instrument.
 *
 * MAIS PAS N'IMPORTE OÙ DANS L'ORDRE, ET C'EST TOUT LE PIÈGE.
 *
 * Le rejeu dessine le trait en cours en regardant l'objet qui SUIT immédiatement
 * l'animation (render : `this.entities[this.replayIndex + 1]`). Glisser le point
 * d'arrivée ENTRE l'animation et son segment, et c'est LUI que le rejeu trouve :
 * la règle se couche alors sur une feuille blanche, le crayon court pour rien, et
 * le segment paraît d'un coup à la fin. C'est très exactement ce qui avait fait
 * poser le point AVANT le geste, et c'est le genre de correction qui en défait
 * une autre sans rien casser de visible au comptage.
 *
 * Le point va donc APRÈS le segment : l'animation garde son trait juste derrière
 * elle, et le point vient en dernier. La sonde tient les deux bouts —
 *
 *   1. UN SEUL POINT VISIBLE AVANT LE PREMIER INSTRUMENT. C'est la demande, en
 *      un nombre. Le rectangle et le parallélogramme en posaient trois.
 *   2. AUCUNE ANIMATION DE TRACÉ N'EST SUIVIE D'UN POINT. C'est l'invariant du
 *      rejeu, et c'est lui qu'une correction naïve casse.
 *   3. ET, MESURÉ IMAGE PAR IMAGE, le point d'arrivée ne se dessine pas pendant
 *      que le crayon court, mais se dessine une fois le trait fini. Les deux
 *      règles ci-dessus peuvent être tenues et celle-ci fausse : c'est elle
 *      qu'on voit à l'écran.
 *
 * Enfin, les CONSTRUCTIONS MAGIQUES ne changent pas : quand l'élève a cliqué
 * trois points, ils existent pour de bon avant qu'on trace, et le bâtisseur ne
 * doit surtout pas les ranger une seconde fois. C'est le même buildRectangle des
 * deux côtés — seul l'appel venu d'une phrase lui dit quels sommets restent à
 * trouver.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Les figures qui commencent par un côté à la règle. Toutes passent par le même
   premier geste, mais par trois chemins de code différents : cslPremierCote pour
   les triangles et le carré, le couple rectangle/parallélogramme par leur
   bâtisseur à trois points, et le losange par le compas. */
const FIGURES = [
    ['triangle quelconque', 'Trace un triangle ABC'],
    ['triangle 6/5/4', 'Trace un triangle ABC tel que AB = 6 cm, BC = 5 cm et CA = 4 cm'],
    ['triangle au rapporteur', 'Trace un triangle ABC tel que AB = 6 cm, BAC = 50° et ABC = 60°'],
    ['triangle rectangle', 'Trace un triangle rectangle en A'],
    ['carré de 12 cm', 'Trace un carré ABCD de 12 cm de côté'],
    ['losange', 'Trace un losange ABCD de 5 cm de côté'],
    ['hexagone', 'Trace un hexagone ABCDEF'],
    ['rectangle', 'Trace un rectangle ABCD de 10 cm sur 4 cm'],
    ['parallélogramme', 'Trace un parallélogramme ABCD'],
];

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
        ['ruler', 'setsquare'].forEach(w => {
            if (!window.app.activeWidgets[w]) window.app.toggleWidget(w);
        });
    });

    const batir = (phrase) => page.evaluate((phrase) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        let boum = null, ok = false;
        try { const r = a.executerConsigneAvec(phrase, true); ok = !!(r && r.ok); }
        catch (e) { boum = e.message; }
        /* Un point de construction invisible ne se voit pas : il ne donne donc
           jamais la réponse d'avance, et ne compte pas ici. */
        const vu = (e) => e instanceof Point && e.visible !== false;
        const iPremierOutil = a.entities.findIndex(e => e instanceof ToolAnimation
            && e.originalType === 'trace');
        const suivis = [];
        a.entities.forEach((e, k) => {
            if (!(e instanceof ToolAnimation) || e.originalType !== 'trace') return;
            if (e.widgetType !== 'ruler' && e.widgetType !== 'setsquare') return;
            const s = a.entities[k + 1];
            if (s instanceof Point) suivis.push(k + ' → Point ' + (s.label || '?'));
        });
        return {
            ok, boum, iPremierOutil,
            avant: a.entities.slice(0, Math.max(iPremierOutil, 0)).filter(vu).length,
            suivisDUnPoint: suivis,
            total: a.entities.length,
        };
    }, phrase);

    console.log('\n=== un seul point est sur la feuille quand l\'instrument sort ===');
    for (const [nom, phrase] of FIGURES) {
        const r = await batir(phrase);
        if (!r.ok || r.boum) { ck(nom, false, r.boum || 'consigne refusée'); continue; }
        ck(nom, r.avant === 1, r.avant + ' point(s) posé(s) d\'avance');
    }

    console.log('\n=== et le rejeu garde son trait juste derrière l\'animation ===');
    for (const [nom, phrase] of FIGURES) {
        const r = await batir(phrase);
        if (!r.ok || r.boum) { ck(nom, false, r.boum || 'consigne refusée'); continue; }
        ck(nom, r.suivisDUnPoint.length === 0,
           r.suivisDUnPoint.length ? 'le crayon court à vide : ' + r.suivisDUnPoint.join(', ')
                                   : 'aucune animation suivie d\'un point');
    }

    /* LA MESURE QUI COMPTE : on gèle le rejeu au milieu du premier trait et l'on
       regarde qui se dessine. Les deux vérifications précédentes peuvent être
       vertes et celle-ci rouge — c'est elle qu'on voit à l'écran. */
    console.log('\n=== image par image : B n\'apparaît qu\'au bout du crayon ===');
    const film = (phrase) => page.evaluate((phrase) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec(phrase, true);
        const i = a.entities.findIndex(e => e instanceof ToolAnimation
            && e.originalType === 'trace' && e.widgetType === 'ruler');
        if (i < 0) return { erreur: 'aucun tracé à la règle' };
        const seg = a.entities[i + 1];
        const arrivee = a.entities[i + 2];
        if (!(seg instanceof Segment)) return { erreur: 'ce n\'est pas un segment qui suit' };
        if (!(arrivee instanceof Point)) return { erreur: 'aucun point après le segment' };

        /* On espionne le dessin de CE point-là, et l'on rend une image comme le
           rejeu la rendrait, au milieu du geste puis une fois le trait fini. */
        const vrai = arrivee.draw.bind(arrivee);
        let vues = 0;
        arrivee.draw = function (...args) { vues++; return vrai(...args); };
        const image = (idx, t) => {
            vues = 0;
            a.replayIndex = idx;
            a.isToolAnimating = (t !== null);
            a.currentAnimProgress = (t === null) ? undefined : t;
            if (t !== null) a.applyInterpolation(a.entities[idx], t);
            a.render();
            return vues;
        };
        const auMilieu = image(i, 0.5);
        const presqueFini = image(i, 0.98);
        /* Une fois le trait posé, le rejeu avance. Le rendu dessine ce qui est
           STRICTEMENT avant replayIndex (slice(0, limit)) : pour que le point du
           rang i+2 soit dessiné, il faut que le curseur l'ait dépassé. */
        const apres = image(i + 3, null);
        a.isToolAnimating = false; a.currentAnimProgress = undefined;
        a.replayIndex = a.entities.length;
        delete arrivee.draw;
        return { nom: arrivee.label || ('le point du rang ' + (i + 2)), auMilieu, presqueFini, apres };
    }, phrase);

    for (const [nom, phrase] of FIGURES) {
        const f = await film(phrase);
        if (f.erreur) { ck(nom, false, f.erreur); continue; }
        ck(nom + ' — ' + f.nom + ' absent pendant le trait',
           f.auMilieu === 0 && f.presqueFini === 0,
           'dessiné ' + f.auMilieu + ' fois à mi-course, ' + f.presqueFini + ' à 98 %');
        ck('  et présent une fois le trait fini', f.apres > 0,
           f.apres ? 'oui' : 'NON — le point ne revient jamais');
    }

    /* LE MÊME BÂTISSEUR SERT AU DOIGT. Trois points déjà cliqués : ils sont sur
       la feuille pour de bon, et les ranger une seconde fois les dédoublerait. */
    console.log('\n=== les constructions magiques, elles, ne changent pas ===');
    const magie = await page.evaluate(() => {
        const a = window.app;
        const essai = (quel) => {
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            const pA = new Point(300, 500, 'A'), pB = new Point(300, 300, 'B'),
                  pC = new Point(600, 300, 'C');
            [pA, pB, pC].forEach(p => a.addEntity(p));
            if (quel === 'rectangle') a.buildRectangle(pA, pB, pC);
            else a.buildParallelogram(pA, pB, pC);
            const pts = a.entities.filter(e => e instanceof Point);
            return {
                doublons: pts.length - new Set(pts).size,
                sommets: pts.length,
                avant: a.entities.slice(0, a.entities.findIndex(e => e instanceof ToolAnimation))
                    .filter(e => e instanceof Point).length,
            };
        };
        return { rect: essai('rectangle'), para: essai('parallélogramme') };
    });
    ['rect', 'para'].forEach((k) => {
        const m = magie[k];
        ck((k === 'rect' ? 'rectangle' : 'parallélogramme') + ' au doigt : aucun doublon',
           m.doublons === 0, m.doublons + ' point(s) rangé(s) deux fois');
        ck('  les 3 points cliqués restent posés d\'avance', m.avant === 3,
           m.avant + ' avant le premier instrument');
        ck('  et le quatrième sommet est bien là', m.sommets === 4, m.sommets + ' sommets');
    });

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
