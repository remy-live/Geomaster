/* LE MOT MAL TAPÉ, ET LA SECONDE LECTURE.
 *
 * CE QUI A DÉCLENCHÉ CETTE SONDE N'EST PAS UNE IDÉE, C'EST UN RELEVÉ. Sur
 * 448 ouvertures réelles : 104 consignes comprises, 17 refusées — et les
 * dix-sept sont connues, une par une. SEPT d'entre elles sont la même phrase,
 * recopiée d'une feuille d'exercice :
 *
 *     « Tracer le traingle ABC tel que : AB = 7 cm ; BC = 8 cm et AC = 6 cm »
 *
 * Mesuré en ne changeant qu'une chose à la fois — c'est la seule façon de savoir
 * lequel des écarts casse la lecture : l'infinitif « Tracer », les deux-points
 * après « tel que », les points-virgules entre les longueurs et le « 7cm » collé
 * passaient DÉJÀ. Le seul obstacle était « traingle ». Avec « paralléle » (une
 * fois), HUIT des dix-sept refus réels tiennent à un mot mal tapé.
 *
 * TROIS CHOSES SONT VÉRIFIÉES ICI, ET LA DEUXIÈME EST LA PLUS IMPORTANTE.
 *
 * 1. LES MOTS MAL TAPÉS PASSENT, ET LE LOGICIEL DIT CE QU'IL A LU. Corriger en
 *    silence serait lui faire dire qu'il a compris une phrase qu'il n'a pas lue.
 *    « traingle » échange deux lettres voisines : au sens de Levenshtein c'est
 *    une distance DEUX, et une correction qui ne compterait que les lettres
 *    changées, ajoutées ou retirées ne l'attraperait pas — or c'est la faute de
 *    frappe la plus banale qui soit. La sonde tient les quatre sortes de faute.
 *
 * 2. UNE PHRASE QUI MARCHE N'EST JAMAIS RÉÉCRITE. La correction n'a lieu
 *    QU'APRÈS un refus : c'est ce qui rend la chose sûre, et cela ne dépend
 *    d'aucune liste. La sonde passe les 218 phrases du catalogue à la seconde
 *    lecture et exige ZÉRO réécriture — non pas parce qu'on l'espère, mais parce
 *    que le vocabulaire en est TIRÉ. Elle vérifie aussi que ce qui doit être
 *    refusé le reste : la correction ne doit pas servir à comprendre n'importe
 *    quoi.
 *
 * 3. LE VOCABULAIRE EST ENGENDRÉ, PAS ÉCRIT À LA MAIN. Il sort des 218 phrases
 *    de window.GM_CATALOGUE, c'est-à-dire de ce que le logiciel sait faire. Une
 *    liste recopiée à côté se périmerait au premier ajout, et personne ne s'en
 *    apercevrait. La sonde vérifie que le vocabulaire vient bien de là — qu'il
 *    contient des mots du catalogue et rien qui n'y soit.
 *
 * DEUX LIMITES MESURÉES, ÉCRITES ICI PLUTÔT QUE MASQUÉES.
 *   · Sur 68 mots courants hors catalogue, quatre sont réécrits, dont un à tort :
 *     « partie » → « partir ». Conséquence bornée : la correction n'a lieu
 *     qu'après un refus, et si la phrase corrigée échoue à son tour c'est le
 *     refus D'ORIGINE qui est rendu — aucun mot inventé n'apparaît. La sonde
 *     tient ce dernier point, qui est celui qui protège.
 *   · Une phrase qui réussit n'est pas relue, même si elle réussit de travers :
 *     « Place le mileu I de [AB] » pose un POINT I et l'annonce ainsi
 *     (« Point I placé »), sans mentir, mais sans faire le milieu. La sonde fixe
 *     ce comportement pour qu'on sache ce qu'on change le jour où on le changera.
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
        return { ok: !!(r && r.ok), msg: (r && r.message) || '',
                 astuce: (r && r.astuce) || '', neufs: a.entities.length - n0 };
    }, [phrase, prep || null]);

    /* ============================================================
       1. LES PHRASES RÉELLEMENT REFUSÉES, TELLES QU'ELLES ONT ÉTÉ TAPÉES
       ============================================================ */
    console.log('\n=== les phrases réelles, au caractère près ===');
    const REELLES = [
        ['×4 sur la feuille d\'exercice',
         'Tracer le traingle ABC tel que : AB = 7 cm ; BC = 8 cm et AC = 6 cm', /triangle/i],
        ['×1 la même, « 7cm » collé',
         'Tracer le traingle ABC tel que AB = 7cm ; BC = 8cm et AC = 6cm', /triangle/i],
        ['×1 l\'accent à l\'envers', 'trace une paralléle à (d) passant par A', /parallèle/i],
    ];
    for (const [quoi, phrase, attendu] of REELLES) {
        const prep = /paral/.test(phrase) ? ['Trace une droite (d)', 'Place un point A'] : [];
        const r = await jouer(phrase, prep);
        ck(`${quoi} : comprise`, !r.boum && r.ok, r.boum ? 'BOUM ' + r.boum : r.msg);
        ck('  et le logiciel DIT ce qu\'il a lu',
           attendu.test(r.astuce || '') && /orthographe/i.test(r.astuce || ''),
           r.astuce || 'AUCUNE ASTUCE');
    }

    /* ============================================================
       2. LES QUATRE SORTES DE FAUTE DE FRAPPE
       On les joue POUR DE BON : ce qui compte est la figure obtenue et ce que
       le logiciel dit avoir lu, pas la valeur que rend une fonction. Une sonde
       qui interroge une méthode ajoutée par le correctif PLANTE sur la version
       d'avant au lieu de rougir, et « n'est pas une fonction » ne dit rien du
       défaut. C'est arrivé deux fois dans ce projet : plus jamais.
       ============================================================ */
    console.log('\n=== les quatre sortes de faute ===');
    const FAUTES = [
        ['deux lettres échangées', 'Trace un traingle ABC', 'traingle', 'triangle'],
        ['une lettre oubliée', 'Trace un hexagne ABCDEF de 3 cm de côté', 'hexagne', 'hexagone'],
        ['une lettre en trop', 'Trace un triiangle ABC', 'triiangle', 'triangle'],
        ['une lettre pour une autre', 'Trace un triamgle ABC', 'triamgle', 'triangle'],
    ];
    for (const [quoi, phrase, mauvais, bon] of FAUTES) {
        const prep = /\(AB\)|\[AB\]/.test(phrase) ? ['Place les points A, B et C'] : [];
        const r = await jouer(phrase, prep);
        ck(`${quoi} — « ${mauvais} » → « ${bon} »`,
           !r.boum && r.ok && r.astuce.includes(`« ${mauvais} » → « ${bon} »`),
           r.boum ? 'BOUM ' + r.boum : (r.ok ? (r.astuce || 'COMPRISE SANS RIEN DIRE') : r.msg.slice(0, 60)));
    }

    /* L'ACCENT, LUI, N'ÉTAIT PRESQUE JAMAIS UN OBSTACLE — et il fallait le
       mesurer avant de croire le contraire. Quinze phrases écrites sans accents
       passaient DÉJÀ : trapeze, regulier, equilateral, isocele,
       parallelogramme, mediatrice, arete, tetraedre, carree… La seule qui
       achoppait est « une paralléle à (d) », vérifiée plus haut. Cette section
       n'est donc pas un témoin de défaut : c'est le garde-fou qui empêche la
       seconde lecture de casser une tolérance qui existait avant elle. */
    console.log('\n=== les accents oubliés passaient déjà, et passent toujours ===');
    const SANS_ACCENT = [
        [[], 'Trace un trapeze ABCD'],
        [[], 'Trace un polygone regulier à 7 côtés'],
        [[], 'Trace un triangle equilateral ABC de 4 cm de côté'],
        [[], 'Trace un parallelogramme ABCD'],
        [[], 'Trace un tetraedre'],
        [['Place les points A, B'], 'Trace la mediatrice de [AB]'],
        [['Place les points A, B, C'], 'Trace la paralléle à (AB) passant par C'],
    ];
    const ratés = [];
    for (const [prep, p] of SANS_ACCENT) {
        const r = await jouer(p, prep);
        if (!r.ok) ratés.push(p);
    }
    ck(`les ${SANS_ACCENT.length} phrases sans accents sont comprises`, ratés.length === 0,
       ratés.length ? ratés.join(' | ') : SANS_ACCENT.length + ' / ' + SANS_ACCENT.length);

    /* ============================================================
       3. CE QUI MARCHE N'EST JAMAIS RÉÉCRIT — LE POINT QUI PROTÈGE
       Mesuré sur la conséquence observable : aucune des 218 phrases ne doit
       repartir avec une note d'orthographe. Cette section passe donc AUSSI sur
       la version d'avant, et c'est voulu : ce n'est pas un témoin de défaut,
       c'est le garde-fou qui empêche le correctif de déborder.
       ============================================================ */
    console.log('\n=== les 218 phrases du catalogue passent intactes ===');
    const cat = await page.evaluate(() => {
        const a = window.app;
        const dur = [];
        const liste = window.GM_CATALOGUE || [];
        a.bancIsoler(() => {
            liste.forEach(l => {
                a.entities = []; a.historyPast = [];
                if (a.cslOublier) a.cslOublier();
                let r;
                try { r = a.executerConsigneAvec(l[1], false); } catch (e) { void e; return; }
                if (r && /orthographe/i.test(r.astuce || '')) dur.push(l[1] + ' → ' + r.astuce);
            });
        });
        return { n: liste.length, dur };
    });
    ck('le catalogue est bien là', cat.n > 200, cat.n + ' phrases');
    ck('  aucune ne repart corrigée', cat.dur.length === 0,
       cat.dur.length ? cat.dur.slice(0, 3).join(' | ') : cat.n + ' / ' + cat.n + ' intactes');

    console.log('\n=== et ce qui doit être refusé le reste ===');
    for (const p of ['coucou', 'bonjour', 'azertyuiop',
                     'trace un dodécaèdre étoilé de Poinsot', 'blabla blabla blabla']) {
        const r = await jouer(p);
        ck(`« ${p} » est refusée`, !r.boum && !r.ok, r.boum ? 'BOUM' : r.msg.slice(0, 60));
    }

    /* LE GARDE-FOU QUI PROTÈGE VRAIMENT : quand la phrase corrigée échoue à son
       tour, c'est le refus D'ORIGINE qui est rendu. Sans cela, le logiciel
       parlerait d'un mot que personne n'a écrit. */
    console.log('\n=== une correction qui ne mène à rien ne se montre pas ===');
    const perdu = await jouer('Trace la partie hachurée');
    ck('la phrase reste refusée', !perdu.ok, perdu.msg.slice(0, 70));
    ck('  et aucun mot inventé n\'apparaît dans la réponse',
       !/orthographe/i.test(perdu.astuce || '') && !/partir/i.test(perdu.msg + perdu.astuce),
       perdu.astuce || 'aucune astuce');

    /* ============================================================
       4. LE VOCABULAIRE VIENT DU CATALOGUE
       ============================================================ */
    console.log('\n=== le vocabulaire est engendré, pas écrit à la main ===');
    /* ICI SEULEMENT on regarde dedans — c'est la SOURCE du vocabulaire qu'on
       vérifie, et elle n'a pas de conséquence observable autre qu'elle-même.
       L'absence de la méthode est donc un ÉCHEC énoncé, pas une exception. */
    const voc = await page.evaluate(() => {
        const a = window.app;
        if (typeof a.cslVocabulaire !== 'function') return { absent: true };
        const v = a.cslVocabulaire();
        const texte = (window.GM_CATALOGUE || []).map(l => l[1]).join(' ').toLowerCase();
        return { n: v.length,
                 dehors: v.filter(x => texte.indexOf(x.mot) < 0).map(x => x.mot),
                 court: v.filter(x => x.mot.length < 6).map(x => x.mot),
                 a: ['triangle', 'parallèle', 'médiatrice', 'hexagone']
                        .filter(m => !v.some(x => x.mot === m)) };
    });
    if (voc.absent) {
        ck('le vocabulaire est tiré du catalogue', false, 'cslVocabulaire n\'existe pas');
        voc.n = 0; voc.dehors = []; voc.court = []; voc.a = ['(pas de vocabulaire)'];
    }
    ck('il y a du vocabulaire', voc.n > 100, voc.n + ' mots');
    ck('  chacun vient du catalogue', voc.dehors.length === 0, voc.dehors.slice(0, 5).join(' '));
    ck('  aucun mot trop court pour être corrigé sans risque',
       voc.court.length === 0, voc.court.join(' '));
    ck('  et les mots qui comptent y sont', voc.a.length === 0,
       voc.a.length ? 'MANQUE ' + voc.a.join(' ') : 'triangle · parallèle · médiatrice · hexagone');

    /* ============================================================
       5. LA LIMITE, FIXÉE POUR QU'ON SACHE CE QU'ON CHANGE
       Une phrase qui réussit n'est pas relue, même de travers.
       ============================================================ */
    console.log('\n=== la limite connue : une réussite n\'est pas relue ===');
    const mileu = await jouer('Place le mileu I de [AB]', ['Trace le segment [AB]']);
    ck('« mileu » passe pour « point » — et c\'est ce qui est ANNONCÉ',
       mileu.ok && /point/i.test(mileu.msg) && !/milieu/i.test(mileu.msg), mileu.msg);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
