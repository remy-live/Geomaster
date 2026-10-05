/* UN ÉNONCÉ ENTIER, DE BOUT EN BOUT — ET IL DOIT DONNER BATMAN.
 *
 * « Ça ne fonctionne pas. C'est pas terrible, c'est censé donner Batman. »
 *
 * Vingt-quatre lignes collées dans le panneau des consignes. Avant, QUINZE
 * passaient — et le reste ne refusait pas : il répondait « ok » en faisant autre
 * chose. C'est la seule façon dont un logiciel de construction peut vraiment
 * tromper : la figure est fausse, et rien ne le dit.
 *
 * QUATRE SILENCES, mesurés un par un sur ce qui se posait VRAIMENT sur la
 * feuille — jamais sur ce que la réponse annonçait :
 *
 * 1. « Elle coupe la droite (HX) en I, la droite (MY) en O et la droite (d) en
 *    G » ne posait que I. Les deux autres morceaux ne tombaient pas dans le
 *    vide : le découpeur de phrases les prenait pour des consignes neuves —
 *    « la droite » en commence une, d'ordinaire — et ils repartaient vers le
 *    traceur de droites, qui TRAÇAIT (MY) et (d) par-dessus elles-mêmes.
 *    Réponse : « I — croisement · Droite (MY) · Droite (d) », ok.
 *    O et G n'existaient donc pas. Les lignes suivantes les citaient, et
 *    « la droite (OP) » les faisait NAÎTRE comme points libres posés n'importe
 *    où : toute la figure se bâtissait sur des points inventés.
 *
 * 2. « Placer X et Y tels que HXMY soit un losange » rendait un losange XYHM.
 *    Les lettres étaient lues DANS L'ORDRE DU TEXTE — X, Y, H, M — au lieu de
 *    l'ordre du groupe HXMY, et H et M sortaient VOISINS quand l'énoncé les veut
 *    OPPOSÉS. Côtés mesurés : 8,67 et 5,01 cm ; diagonale 5 au lieu de 11.
 *
 * 3. Deux sommets OPPOSÉS connus, c'est une construction à part : les diagonales
 *    d'un losange se coupent en leur milieu et à angle droit, donc X et Y sont
 *    sur la perpendiculaire à [HM] en son milieu, à 5,5 cm de part et d'autre.
 *    Le bâtisseur général, lui, posait la forme idéale par SIMILITUDE sur les
 *    deux points connus — ce qui suppose qu'ils sont voisins.
 *
 * 4. « Trace les triangles GHI et JHK » n'en traçait qu'un, et « la ligne
 *    polygonale EADOLMNPCBF » n'était pas comprise du tout.
 *
 * CE QUE LA SONDE MESURE, ET POURQUOI C'EST BATMAN QUI SERT DE JUGE. Pas les
 * messages : les POINTS. Vingt-quatre lettres doivent exister, le losange doit
 * avoir quatre côtés égaux et ses deux diagonales aux bonnes mesures, et la
 * figure doit être SYMÉTRIQUE — c'est elle qui dit que tout tient, parce qu'une
 * seule erreur en amont fait basculer tout un côté. Un logo de Batman de
 * travers est un défaut visible à l'œil nu ; un logo symétrique ne s'obtient pas
 * par hasard sur vingt-quatre points construits les uns sur les autres.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* L'énoncé, tel qu'il est tapé — ponctuation et parenthèses comprises. */
const ENONCE = [
    'tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm, A en haut à gauche, B en haut à droite et C en bas à droite.',
    'Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC].',
    'Placer X et Y tels que HXMY soit un losange, XY = 11 cm. (placer X du côté gauche)',
    'La droite (EC) coupe (MY) en N et la droite (FD) coupe (MX) en L.',
    'Tracer la droite (d) parallèle à (AB) passant par H.',
    'Tracer la droite perpendiculaire à (AB) passant par L.',
    'Elle coupe la droite (HX) en I, la droite (MY) en O et la droite (d) en G.',
    'Tracer la parallèle à (BC) passant par N.',
    'Elle coupe la droite (HY) en K, la droite (MX) en P et la droite (d) en J.',
    'La droite (KM) coupe la droite (OP) en T et la droite (DO) en V.',
    'La droite (IM) coupe la droite (OP) en U et la droite (CP) en W.',
    'Les droites (MN) et (LT) se coupent en R.',
    'Les droites (LM) et (NU) se coupent en S.',
    "Tracer le petit arc de cercle C1 de centre M d'extrémités E et F.",
    "Tracer le petit arc de cercle C2 de centre M d'extrémités V et W.",
    'Trace les triangles GHI et JHK.',
    'Trace le trapèze RSUT.',
    'Trace les segments [OV] et [PW].',
    'Trace la ligne polygonale EADOLMNPCBF.',
];

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const page = await nav.newPage({ viewport: { width: 1600, height: 1100 } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        const a = window.app;
        a.checkAutoSave = () => {};
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        if (a.cslOublier) a.cslOublier();
    });

    /* ============================================================
       1. CHAQUE LIGNE EST ACCEPTÉE — ET POSE CE QU'ELLE ANNONCE
       ============================================================ */
    console.log('\n=== les dix-neuf lignes de l\'énoncé ===');
    const journal = [];
    for (const ph of ENONCE) {
        const r = await page.evaluate((ph) => {
            const a = window.app;
            const avant = a.entities.filter(e => e instanceof Point).map(p => p.label);
            let ret;
            try { ret = a.executerConsigneAvec(ph, false); }
            catch (e) { return { ok: false, msg: 'BOUM ' + e.message, neufs: '' }; }
            const pts = a.entities.filter(e => e instanceof Point);
            return { ok: !!(ret && ret.ok),
                     msg: ((ret && (ret.message || ret.erreur)) || '?').slice(0, 58),
                     neufs: pts.filter(p => !avant.includes(p.label)).map(p => p.label).join('') };
        }, ph);
        journal.push(r);
        ck(ph.slice(0, 54), r.ok, `[${r.neufs || '—'}] ${r.msg}`);
    }

    /* ============================================================
       2. LES VINGT-TROIS POINTS EXISTENT
       C'est le premier défaut : la moitié d'une phrase abandonnée sous un « ok ».
       ============================================================ */
    console.log('\n=== les vingt-quatre points de la figure ===');
    const figure = await page.evaluate(() => {
        const a = window.app;
        const N = {};
        a.entities.filter(e => e instanceof Point).forEach(p => { N[p.label] = p; });
        const cm = (px) => Math.round(gmCm(px) * 100) / 100;
        const d = (x, y) => (N[x] && N[y]) ? cm(Math.hypot(N[x].x - N[y].x, N[x].y - N[y].y)) : null;
        return {
            N: Object.fromEntries(Object.entries(N).map(([k, p]) =>
                [k, { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }])),
            mes: { AB: d('A', 'B'), BC: d('B', 'C'),
                   HX: d('H', 'X'), XM: d('X', 'M'), MY: d('M', 'Y'), YH: d('Y', 'H'),
                   HM: d('H', 'M'), XY: d('X', 'Y'),
                   ME: d('M', 'E'), MF: d('M', 'F'), MV: d('M', 'V'), MW: d('M', 'W') },
            arcs: a.entities.filter(e => e.constructor.name === 'Arc').length,
            segments: a.entities.filter(e => e.constructor.name === 'Segment').length,
        };
    });
    const ATTENDUS = 'ABCDEFGHIJKLMNOPRSTUVWXY'.replace(/Q|Z/g, '').split('');
    const absents = ATTENDUS.filter(l => !figure.N[l]);
    ck('les vingt-quatre lettres sont posées', absents.length === 0,
       absents.length ? 'manquent : ' + absents.join('') : Object.keys(figure.N).length + ' points');

    /* ============================================================
       3. LE RECTANGLE ET LE LOSANGE SONT AUX MESURES DE L'ÉNONCÉ
       ============================================================ */
    console.log('\n=== les mesures écrites dans l\'énoncé ===');
    const m = figure.mes;
    ck('AB = 8 cm', Math.abs(m.AB - 8) < 0.05, m.AB + ' cm');
    ck('BC = 10 cm', Math.abs(m.BC - 10) < 0.05, m.BC + ' cm');
    ck('HXMY a quatre côtés égaux',
       [m.HX, m.XM, m.MY, m.YH].every(v => v !== null && Math.abs(v - m.HX) < 0.05),
       `${m.HX} · ${m.XM} · ${m.MY} · ${m.YH} cm`);
    ck('  XY = 11 cm, la diagonale donnée', Math.abs(m.XY - 11) < 0.05, m.XY + ' cm');
    ck('  et HM vaut la moitié de BC', Math.abs(m.HM - 5) < 0.05, m.HM + ' cm');
    ck('X est du côté gauche, comme demandé',
       figure.N.X && figure.N.H && figure.N.X.x < figure.N.H.x,
       figure.N.X ? `X en x = ${figure.N.X.x}, H en x = ${figure.N.H.x}` : '—');

    /* ============================================================
       4. LES DEUX ARCS SONT POSSIBLES
       C'est le juge le plus sévère : ME = MF et MV = MW ne tombent juste que si
       TOUTE la figure est juste. Avant, MV = 3,2 cm pour MW = 38,22.
       ============================================================ */
    console.log('\n=== les deux arcs de centre M ===');
    ck('ME = MF — le premier arc existe', Math.abs(m.ME - m.MF) < 0.02,
       `${m.ME} et ${m.MF} cm`);
    ck('MV = MW — le second aussi', Math.abs(m.MV - m.MW) < 0.02,
       `${m.MV} et ${m.MW} cm`);
    ck('  les deux arcs sont tracés', figure.arcs === 2, figure.arcs + ' arc(s)');

    /* ============================================================
       5. ET LA FIGURE EST SYMÉTRIQUE — C'EST CELA, BATMAN
       L'axe est la verticale par H. Chaque lettre a sa jumelle, et une seule
       erreur en amont fait basculer tout un côté.
       ============================================================ */
    console.log('\n=== la figure est symétrique, et c\'est le juge ===');
    const PAIRES = [['A', 'B'], ['D', 'C'], ['E', 'F'], ['X', 'Y'], ['L', 'N'],
                    ['I', 'K'], ['O', 'P'], ['G', 'J'], ['T', 'U'], ['V', 'W'],
                    ['R', 'S']];
    const axe = figure.N.H ? figure.N.H.x : null;
    let pire = 0, pireNom = '';
    for (const [g, dte] of PAIRES) {
        const P = figure.N[g], Q = figure.N[dte];
        if (!P || !Q || axe === null) { pire = 1e9; pireNom = g + dte; break; }
        const e = Math.max(Math.abs((axe - P.x) - (Q.x - axe)), Math.abs(P.y - Q.y));
        if (e > pire) { pire = e; pireNom = g + dte; }
    }
    ck('les onze paires se répondent de part et d\'autre de (H)', pire < 0.5,
       pire > 1e8 ? 'un point manque : ' + pireNom
                  : `écart maximal ${Math.round(pire * 100) / 100} px, sur ${pireNom}`);
    ck('  M est sur l\'axe', figure.N.M && axe !== null && Math.abs(figure.N.M.x - axe) < 0.5,
       figure.N.M ? Math.abs(figure.N.M.x - axe) + ' px' : '—');

    /* ============================================================
       6. LE TRAIT FINAL EST BIEN LÀ
       ============================================================ */
    console.log('\n=== le trait du feutre foncé ===');
    ck('les deux triangles d\'oreille, pas un seul',
       /JHK/.test(journal[15].msg) && /GHI/.test(journal[15].msg), journal[15].msg);
    ck('  la ligne polygonale fait ses dix segments',
       /10 segments/.test(journal[18].msg), journal[18].msg);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
