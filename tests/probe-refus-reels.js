/* LES DIX-SEPT REFUS RÉELS, UN PAR UN.
 *
 * Le relevé d'usage ne donne pas des impressions, il donne des PHRASES : sur
 * 448 ouvertures, 104 consignes faites et 17 refusées — et les dix-sept sont
 * listées, avec leur nombre d'occurrences. En les additionnant on retombe
 * exactement sur 17 : on les tient donc toutes, sans échantillon ni devinette.
 *
 * TROIS sont de vrais refus (« coucou », deux fois et une fois capitalisé). Les
 * QUATORZE autres sont des intentions légitimes d'enseignant. Cette sonde les
 * joue toutes, au caractère près, et exige de chacune le comportement décidé.
 *
 * HUIT tenaient à un mot mal tapé : voir probe-orthographe.js, qui les traite à
 * part parce que le garde-fou y est plus délicat que le correctif.
 *
 * LES SIX AUTRES, ET CE QU'ON A TROUVÉ EN LES MESURANT.
 *
 * 1. « Fais moi la symétrie centrale par rapport au point O de la figure
 *    ABCDEFGHI » (×2). Mesuré : sur feuille vierge, le logiciel répondait
 *    « Point O placé » — il lisait « par rapport au point O » comme « place le
 *    point O », faisait autre chose que ce qu'on demandait, et NE REFUSAIT PAS.
 *    C'est le pire des trois sorts. Deux causes : le mot « symétrie » n'était pas
 *    un déclencheur de transformation (seuls « symétrique », « image de »,
 *    « translation », « rotation » l'étaient), et l'objet était du mauvais côté
 *    du séparateur — la phrase dit le CENTRE d'abord, la FIGURE ensuite. La sonde
 *    vérifie les deux ordres, et pour la symétrie AXIALE aussi : le texte du
 *    centre est gardé tel quel, sans quoi « par rapport à (EF) de la figure ABC »
 *    deviendrait une symétrie centrale de centre E.
 *
 * 2. « Trace la médiatrice de [ACB] » (×2). Celle-ci DOIT rester refusée : un
 *    segment a deux extrémités. Mais le refus disait comment on écrit une
 *    médiatrice sans dire ce qui n'allait pas, devant une phrase qui a l'air
 *    juste. Il nomme maintenant la faute et propose les trois segments que ces
 *    lettres désignent — c'est très probablement l'un d'eux.
 *
 * 3. « … et l'angle de sommet D mesure 30° » (×1). « en D » et « EDF » étaient
 *    lus, « de sommet D » non — alors que la même tournure était déjà admise pour
 *    « isocèle de sommet A ». La sonde vérifie que l'angle obtenu est BIEN celui
 *    demandé, mesuré sur la figure : un triangle tracé avec un angle ignoré aurait
 *    l'air juste.
 *
 * 4. « Tracer ABC tel que AB = 7cm ; BC = 8cm et AC = 6cm » (×1), sans le mot
 *    « triangle ». Trois côtés donnés déterminent un triangle et un seul. À
 *    QUATRE lettres on se taît — un quadrilatère n'est pas fixé par ses côtés —,
 *    et la sonde tient ce bord-là, qui est le seul endroit où compléter serait
 *    deviner.
 *
 * 5. « trace une droite (d) et un point A qui n'est pas sur (d) et la parallèle à
 *    (d) passant par A » (×1) MARCHE AUJOURD'HUI. Ce refus vient d'une version
 *    antérieure : les 51 ouvertures encore sur 2026-09-09 · 10h rappellent que
 *    ces dix-sept refus se sont accumulés sur dix-huit versions. La sonde la garde
 *    pour que la réparation ne se défasse pas.
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
        window.app.showModal = () => {};
    });

    const jouer = (phrase, prep) => page.evaluate(([phrase, prep]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        (prep || []).forEach(p => { try { a.executerConsigneAvec(p, false); } catch (e) { void e; } });
        const n0 = a.entities.length;
        let r;
        try { r = a.executerConsigneAvec(phrase, false); }
        catch (e) { return { boum: e.message }; }
        const pts = a.entities.filter(e => e instanceof Point && e.label);
        return { ok: !!(r && r.ok), msg: (r && r.message) || '',
                 astuce: (r && r.astuce) || '', neufs: a.entities.length - n0,
                 noms: pts.map(e => e.label).join(','),
                 /* pour vérifier un angle sur la FIGURE et non dans la réponse */
                 pos: pts.reduce((o, e) => { o[e.label] = { x: e.x, y: e.y }; return o; }, {}) };
    }, [phrase, prep || null]);

    /* ============================================================
       1. LA SYMÉTRIE CENTRALE D'UNE FIGURE NOMMÉE  (×2)
       ============================================================ */
    console.log('\n=== « Fais moi la symétrie centrale par rapport au point O de la figure ABCDEFGHI » ===');
    const s9 = await jouer(
        'Fais moi la symétrie centrale par rapport au point O de la figure ABCDEFGHI',
        ['Trace un polygone ABCDEFGHI']);
    ck('la symétrie est faite', !s9.boum && s9.ok, s9.boum ? 'BOUM ' + s9.boum : s9.msg);
    ck('  les neuf images sont là',
       ["A'", "B'", "C'", "D'", "E'", "F'", "G'", "H'", "I'"].every(n => s9.noms.split(',').includes(n)),
       s9.noms);
    ck('  et le logiciel dit comment on l\'écrit',
       /formulation/i.test(s9.astuce) && /sym[ée]trique/i.test(s9.astuce), s9.astuce.slice(0, 110));

    console.log('\n=== les deux ordres, et la symétrie axiale au passage ===');
    const ORDRES = [
        ['le centre puis la figure', 'Trace la symétrie centrale par rapport à O de la figure ABC',
         ['Trace un triangle ABC', 'Place le point O']],
        ['la figure puis le centre', 'Trace le symétrique de la figure ABC par rapport à O',
         ['Trace un triangle ABC', 'Place le point O']],
        ['« de centre O » au lieu de « par rapport à »',
         'Trace la symétrie centrale de centre O de la figure ABC',
         ['Trace un triangle ABC', 'Place le point O']],
        ['axiale, axe donné par deux points',
         'Trace la symétrie axiale par rapport à (AB) de la figure ABC',
         ['Trace un triangle ABC']],
        ['axiale, axe nommé (d)', 'Fais la symétrie axiale par rapport à (d) de la figure ABC',
         ['Trace un triangle ABC', 'Trace une droite (d)']],
    ];
    for (const [quoi, phrase, prep] of ORDRES) {
        const r = await jouer(phrase, prep);
        ck(quoi, !r.boum && r.ok, r.boum ? 'BOUM ' + r.boum : r.msg.slice(0, 80));
    }
    /* L'AXE NE DOIT PAS DEVENIR UN CENTRE. Si l'on ne gardait du « par rapport
       à (AB) » que sa première lettre, la symétrie axiale se transformerait en
       symétrie centrale de centre A — la figure aurait l'air faite, et elle
       serait fausse. La réponse le dit : « par rapport à (AB) ». */
    const ax = await jouer('Trace la symétrie axiale par rapport à (AB) de la figure ABC',
                           ['Trace un triangle ABC']);
    ck('  et l\'axe reste un axe', /\(AB\)/.test(ax.msg), ax.msg.slice(0, 80));

    /* UNE PHRASE DÉJÀ DANS LE BON ORDRE N'EST PAS RETOURNÉE. */
    const deja = await jouer("Construis A'B'C' symétrique de ABC par rapport à O",
                             ['Trace un triangle ABC', 'Place le point O']);
    ck('  une phrase déjà correcte n\'est pas reformulée',
       deja.ok && !/la figure d'abord/i.test(deja.astuce), deja.astuce.slice(0, 80) || 'rien dit');

    /* ============================================================
       2. « LA MÉDIATRICE DE [ACB] »  (×2) — REFUS, MAIS UN REFUS QUI DIT QUOI
       ============================================================ */
    console.log('\n=== « Trace la médiatrice de [ACB] » ===');
    const acb = await jouer('Trace la médiatrice de [ACB]',
                            ['Trace un triangle ABC tel que AB = 7 cm, BC = 8 cm et AC = 6 cm']);
    ck('elle reste refusée — un segment a deux extrémités', !acb.boum && !acb.ok,
       acb.boum ? 'BOUM' : acb.msg.slice(0, 60));
    ck('  et le refus NOMME la faute', /trois lettres|3 lettres/i.test(acb.msg), acb.msg);
    ck('  et propose les segments possibles',
       /\[AC\]/.test(acb.msg) && /\[CB\]|\[BC\]/.test(acb.msg), acb.msg);
    ck('  rien n\'a été tracé', acb.neufs === 0, acb.neufs + ' objet(s)');
    const ab = await jouer('Trace la médiatrice de [AB]',
                           ['Trace un triangle ABC tel que AB = 7 cm, BC = 8 cm et AC = 6 cm']);
    ck('  et la phrase juste passe toujours', ab.ok, ab.msg);

    /* ============================================================
       3. « L'ANGLE DE SOMMET D MESURE 30° »  (×1)
       On vérifie l'angle SUR LA FIGURE : une réponse « Triangle EDF » serait
       identique avec l'angle ignoré.
       ============================================================ */
    console.log('\n=== « … et l\'angle de sommet D mesure 30° » ===');
    const ang = await jouer(
        'Trace un triangle EDF tel que DF = 3 cm; DE = 5 cm et l\'angle de sommet D mesure 30°');
    ck('le triangle est tracé', !ang.boum && ang.ok, ang.boum ? 'BOUM ' + ang.boum : ang.msg);
    if (ang.ok && ang.pos.D && ang.pos.E && ang.pos.F) {
        const v = (p, q) => ({ x: q.x - p.x, y: q.y - p.y });
        const u1 = v(ang.pos.D, ang.pos.E), u2 = v(ang.pos.D, ang.pos.F);
        const cos = (u1.x * u2.x + u1.y * u2.y)
            / (Math.hypot(u1.x, u1.y) * Math.hypot(u2.x, u2.y));
        const deg = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
        ck('  et l\'angle en D mesure bien 30°', Math.abs(deg - 30) < 1,
           (+deg.toFixed(2)) + '°');
        /* les deux longueurs aussi : un angle juste sur un triangle faux ne vaut rien */
        const cm = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) / 50;
        ck('    DF = 3 cm et DE = 5 cm', Math.abs(cm(ang.pos.D, ang.pos.F) - 3) < 0.05
           && Math.abs(cm(ang.pos.D, ang.pos.E) - 5) < 0.05,
           `DF = ${cm(ang.pos.D, ang.pos.F).toFixed(2)} · DE = ${cm(ang.pos.D, ang.pos.E).toFixed(2)}`);
    } else if (ang.ok) {
        ck('  et l\'angle en D mesure bien 30°', false, 'D, E ou F introuvable : ' + ang.noms);
    }

    /* ============================================================
       4. « TRACER ABC TEL QUE … » SANS LE MOT TRIANGLE  (×1)
       ============================================================ */
    console.log('\n=== « Tracer ABC tel que AB = 7cm ; BC = 8cm et AC = 6cm » ===');
    const abc = await jouer('Tracer ABC tel que AB = 7cm ; BC = 8cm et AC = 6cm');
    ck('le triangle est tracé', !abc.boum && abc.ok, abc.boum ? 'BOUM ' + abc.boum : abc.msg);
    ck('  et le logiciel dit pourquoi c\'est un triangle',
       /trois c[ôo]t[ée]s/i.test(abc.astuce), abc.astuce.slice(0, 100) || 'rien dit');
    if (abc.ok && abc.pos.A && abc.pos.B && abc.pos.C) {
        const cm = (a, b) => Math.hypot(b.x - a.x, b.y - a.y) / 50;
        ck('    et les trois longueurs sont les bonnes',
           Math.abs(cm(abc.pos.A, abc.pos.B) - 7) < 0.05
           && Math.abs(cm(abc.pos.B, abc.pos.C) - 8) < 0.05
           && Math.abs(cm(abc.pos.A, abc.pos.C) - 6) < 0.05,
           `AB = ${cm(abc.pos.A, abc.pos.B).toFixed(2)} · BC = ${cm(abc.pos.B, abc.pos.C).toFixed(2)} `
           + `· AC = ${cm(abc.pos.A, abc.pos.C).toFixed(2)}`);
    }

    /* LE BORD QUI COMPTE : à QUATRE lettres, on ne complète pas. Un
       quadrilatère n'est pas fixé par ses côtés — « ABCD tel que AB = 5,
       BC = 3, CD = 5, DA = 3 » est un rectangle comme un parallélogramme
       aplati, et choisir pour le professeur serait deviner. */
    console.log('\n=== mais à quatre lettres, on se taît ===');
    const quad = await jouer('Tracer ABCD tel que AB = 5 cm, BC = 3 cm, CD = 5 cm et DA = 3 cm');
    ck('aucune figure n\'est inventée', !quad.ok || quad.neufs === 0,
       quad.ok ? 'A CONSTRUIT : ' + quad.msg : quad.msg.slice(0, 70));
    /* et une phrase à trois lettres SANS les trois longueurs non plus */
    const deuxCotes = await jouer('Tracer ABC tel que AB = 7 cm et BC = 8 cm');
    ck('  ni avec deux longueurs seulement', !deuxCotes.ok || deuxCotes.neufs === 0,
       deuxCotes.ok ? 'A CONSTRUIT : ' + deuxCotes.msg : deuxCotes.msg.slice(0, 70));

    /* ============================================================
       5. LA PHRASE À TROIS PROPOSITIONS, RÉPARÉE AVANT CE RELEVÉ
       ============================================================ */
    console.log('\n=== « une droite (d) et un point A … et la parallèle … » ===');
    const trois = await jouer('trace une droite (d) et un point A qui n\'est pas sur (d) '
        + 'et la parallèle à (d) passant par A');
    ck('les trois choses sont faites', !trois.boum && trois.ok && trois.neufs >= 3,
       trois.boum ? 'BOUM ' + trois.boum : trois.neufs + ' objets — ' + trois.msg.slice(0, 70));

    /* ============================================================
       6. ET LES TROIS VRAIS REFUS LE RESTENT
       ============================================================ */
    console.log('\n=== les trois vrais refus ===');
    for (const p of ['coucou', 'Coucou']) {
        const r = await jouer(p);
        ck(`« ${p} » est refusée`, !r.boum && !r.ok, r.boum ? 'BOUM' : r.msg.slice(0, 60));
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
