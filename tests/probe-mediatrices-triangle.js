/* UNE MÉDIATRICE SE CONSTRUIT AU COMPAS, ET LE TEXTE DIT CE QUE LA MAIN FAIT.
 *
 * « J'ai mis : Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm
 *   et ses médiatrices. J'ai eu cela, ce qui clairement n'est pas ce qu'il fait
 *   aux instruments :
 *     6. Pose l'équerre : son bord contre la droite (AB), son angle droit sur ?.
 *     7. Couche la règle sur le trait obtenu et prolonge-le. … »
 *
 * DEUX MENSONGES DANS LA MÊME LIGNE, ET LE SECOND EST LE PIRE.
 *
 * Le point d'interrogation, d'abord : c'est le milieu de [AB], calculé,
 * invisible, sans lettre. Le programme allait chercher la tournure générale de
 * la perpendiculaire — « passant par … » — et n'avait rien à mettre dans le
 * trou. Un énoncé qui demande de poser l'équerre sur un point qu'il ne sait pas
 * nommer ne se refait pas.
 *
 * Et surtout : CE GESTE N'AVAIT PAS LIEU. Mesuré sur la phrase de l'utilisateur,
 * instruments sortis, les trois médiatrices tenaient en trois objets — trois
 * PerpendicularLine, zéro animation, zéro arc. Rien ne bougeait à l'écran : les
 * droites paraissaient d'un coup, pendant que le texte décrivait une équerre
 * posée et une règle couchée. Le logiciel annonçait un geste qu'il ne faisait
 * pas — et il savait pourtant le faire, puisque « Trace la médiatrice de [AB] »
 * sort le compas depuis toujours.
 *
 * LA CORRECTION EST DE N'EN AVOIR QU'UNE. Le triangle passe maintenant par
 * cslPoserMediatrice, la même que la phrase seule : quatre arcs — deux depuis
 * chaque extrémité, du même écartement —, les deux croisements, et la règle qui
 * joint. Le programme, lui, n'a plus besoin de décrire l'équerre : il reconnaît
 * la figure et écrit « Trace la médiatrice de [AB] », ce qui est à la fois plus
 * court et plus vrai.
 *
 * CE QUE LA SONDE TIENT.
 *   1. Le mot « médiatrice » est écrit, et le « ? » a disparu — DES DEUX CÔTÉS,
 *      avec et sans les instruments. Sans les instruments il n'y a pas de geste
 *      à décrire, mais il y a toujours un milieu sans nom.
 *   2. Aux instruments, le compas sort vraiment : quatre arcs par médiatrice, et
 *      une droite tracée à la règle. C'est le comptage qui distingue le geste
 *      fait du geste annoncé.
 *   3. Chaque côté garde SA marque de codage — sauf sur un triangle équilatéral,
 *      où les six moitiés sont vraiment égales et doivent porter la même.
 *   4. Et la perpendiculaire ordinaire reste une perpendiculaire. C'est la
 *      garde-fou de la correction : reconnue trop largement, « Trace la
 *      perpendiculaire à (AB) passant par C » devenait « Trace la médiatrice de
 *      [AB] » dès que C tombait au milieu — vrai, et pourtant faux comme énoncé,
 *      puisque C disparaissait de la consigne qui le nomme. La reconnaissance ne
 *      vaut donc que pour un point SANS LETTRE.
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

    const faire = (phrases, outils) => page.evaluate(([phrases, outils]) => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a._consignes = [];
        a._cslSujet = null; if (a.cslOublier) a.cslOublier();
        let msg = '', ok = true;
        phrases.forEach(p => {
            const r = a.executerConsigneAvec(p, outils);
            if (!(r && r.ok)) { ok = false; msg += (r && r.message) || 'refusée'; }
        });
        const arcs = a.entities.filter(e => e instanceof CompassArc).length;
        return {
            ok, msg,
            prog: a.programmeDeConstruction(false) || [],
            /* On compte des MÉDIATRICES, pas une classe : c'est la figure qui les
               dit, et la façon de les faire peut changer. */
            meds: a.entities.filter(e => a.pgMediatriceDe(e)).length,
            arcs,
            reglesQuiTracent: a.entities.filter(e => e instanceof ToolAnimation
                && e.originalType === 'trace' && e.widgetType === 'ruler').length,
            marques: a.entities.filter(e => e.codageMilieu).map(e => e.codageMilieu),
        };
    }, [phrases, outils]);

    const PHRASE = ['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm et ses médiatrices'];

    console.log('\n=== le mot est écrit, et le « ? » a disparu ===');
    for (const outils of [true, false]) {
        const r = await faire(PHRASE, outils);
        const txt = r.prog.join(' | ');
        ck((outils ? 'avec' : 'sans') + ' les instruments : la phrase passe', r.ok, r.msg);
        ck('  trois fois « la médiatrice de »',
           (txt.match(/la médiatrice de \[/g) || []).length === 3, txt);
        ck('  et plus aucun point d\'interrogation', !/\?/.test(txt), txt);
        ck('  plus aucune équerre annoncée',
           !/perpendiculaire à la droite/.test(txt), txt);
    }

    console.log('\n=== aux instruments, le compas sort pour de bon ===');
    const avec = await faire(PHRASE, true);
    const sans = await faire(PHRASE, false);
    ck('trois médiatrices sur la figure, dans les deux cas',
       avec.meds === 3 && sans.meds === 3, `avec ${avec.meds}, sans ${sans.meds}`);
    /* LE TÉMOIN EST LE TRIANGLE SEUL, AUX MÊMES INSTRUMENTS. Comparer à la
       version sans outils mesurerait la case à cocher, pas les médiatrices : le
       triangle y perd déjà ses deux arcs de report et ses trois coups de règle.
       Ce qu'on veut lire, c'est ce que les trois médiatrices AJOUTENT. */
    const nu = await faire(['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm'], true);
    ck('douze arcs de plus que le triangle seul — quatre par médiatrice',
       avec.arcs - nu.arcs === 12, `${nu.arcs} → ${avec.arcs}`);
    ck('  et trois coups de règle de plus pour joindre les croisements',
       avec.reglesQuiTracent - nu.reglesQuiTracent === 3,
       `${nu.reglesQuiTracent} → ${avec.reglesQuiTracent}`);
    ck('sans les instruments, aucun arc du tout', sans.arcs === 0, String(sans.arcs));

    console.log('\n=== chaque côté garde sa marque, sauf s\'il est vraiment égal ===');
    const scalene = await faire(PHRASE, true);
    ck('trois côtés inégaux : trois marques différentes',
       new Set(scalene.marques).size === 3, JSON.stringify(scalene.marques));
    const equi = await faire(['Trace un triangle équilatéral ABC',
                              'Trace les médiatrices du triangle ABC'], true);
    ck('équilatéral : une seule marque, les six moitiés sont égales',
       equi.marques.length === 3 && new Set(equi.marques).size === 1,
       JSON.stringify(equi.marques));

    console.log('\n=== une perpendiculaire ordinaire reste une perpendiculaire ===');
    const perp = await faire(['Place les points A et B', 'Place un point C',
                              'Trace la perpendiculaire à (AB) passant par C'], false);
    const tp = perp.prog.join(' | ');
    ck('le C nommé reste dans l\'énoncé', /passant par C/.test(tp), tp);
    ck('  et on ne l\'appelle pas « médiatrice »', !/médiatrice/.test(tp), tp);
    const haut = await faire(['Trace un triangle ABC', 'Trace les hauteurs du triangle ABC'], false);
    const th = haut.prog.join(' | ');
    ck('les hauteurs restent des perpendiculaires',
       (th.match(/perpendiculaire/g) || []).length === 3 && !/médiatrice/.test(th), th);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
