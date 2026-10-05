/* LE CENTRE D'UNE FIGURE, ET SES LONGUEURS.
 *
 * « Tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm… »
 * « Il n'arrive pas à faire de centre H. » — « Et il se trompe sur les longueurs. »
 *
 * DEUX DÉFAUTS DANS UNE SEULE PHRASE, et tous deux SILENCIEUX : la réponse
 * disait « Rectangle ABCD », ok, et rien d'autre.
 *
 *   · LE CENTRE ÉTAIT IGNORÉ. Le « de centre H » ne traçait rien et ne refusait
 *     rien. Pire, écrit à part : « Place le centre H du rectangle ABCD » traçait
 *     UN SECOND RECTANGLE, nommé HABC — le mot « rectangle » envoyait la phrase
 *     au bâtisseur de figures, qui prenait le H pour un sommet. Et « Place H le
 *     centre de ABCD » posait un point à 28 px du centre en répondant « Point H
 *     placé ». Trois formulations, trois façons de dire qu'on avait fait ce
 *     qu'on n'avait pas fait.
 *
 *   · LA SECONDE LONGUEUR ÉTAIT INVENTÉE. « AB = 8 cm et BC = 10 cm » donnait
 *     8 cm et 4,96. Mesuré en faisant varier les deux : BC ne dépendait QUE de
 *     AB — elle valait 0,62 × AB, le rapport du rectangle par défaut, quelle que
 *     soit la valeur écrite. Le lecteur de mesures nommées existait pourtant
 *     (cslPolygoneMesures), mais il exige la chaîne ENTIÈRE — les quatre côtés
 *     et une diagonale. C'est juste pour un quadrilatère quelconque, où rien
 *     d'autre ne fixe la forme, et de trop pour un rectangle, dont le NOM donne
 *     déjà les angles : deux côtés adjacents suffisent.
 *
 * CE QUE LA SONDE MESURE. Les longueurs en CENTIMÈTRES telles que le logiciel
 * les calcule lui-même, et l'écart entre le point posé et le vrai centre, en
 * pixels. Pas le message : un message juste sur une figure fausse est
 * exactement ce qu'on vient de corriger.
 *
 * TROIS AUTRES DÉFAUTS SONT TOMBÉS EN SUIVANT L'ÉNONCÉ LIGNE À LIGNE, et ils
 * sont ici parce qu'ils viennent du même exercice :
 *
 *   · « Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC] »
 *     n'en posait QU'UN et répondait « E est le milieu de [AH] », sans un mot
 *     sur les deux autres. La règle du pluriel ne se déclenchait que sur le mot
 *     « milieux » ; cette phrase-là écrit « le milieu » trois fois.
 *
 *   · « Tracer la droite (d) parallèle à (AB) passant par H » perdait le (d).
 *     Deux lignes plus loin, « Elle coupe la droite (d) en G » ne trouvait plus
 *     aucune droite d, retombait sur la dernière tracée — elle-même — et
 *     refusait : « Un objet ne se coupe pas lui-même. » Un refus JUSTE sur une
 *     figure FAUSSE : rien n'indiquait où était l'erreur.
 *
 *   · « l'arc de cercle de centre M d'extrémités E et F » réclamait un rayon
 *     qui est écrit dans la phrase : c'est ME. La forme « de E à F » était lue,
 *     « d'extrémités E et F » non.
 *
 * CE QUI RESTE REFUSÉ, ET QUI EST VRAI : « Placer X et Y tels que HXMY soit un
 * losange » rend un losange XYHM — H et M voisins au lieu d'opposés — et ignore
 * XY = 11 cm. La sonde le CONSTATE au lieu de le taire : c'est une construction
 * qui n'existe pas (deux sommets opposés connus, une diagonale donnée), et tant
 * qu'elle n'existe pas, la mesure doit le dire.
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
    const page = await nav.newPage({ viewport: { width: 1600, height: 1100 } });
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

    /* Joue une suite de phrases sur une feuille vide et rend la figure obtenue,
       en centimètres — l'unité de l'énoncé. */
    const jouer = (phrases) => page.evaluate((phrases) => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        if (a.cslOublier) a.cslOublier();
        const dits = [];
        for (const p of phrases) {
            let r;
            try { r = a.executerConsigneAvec(p, false); }
            catch (e) { dits.push({ ok: false, msg: 'BOUM ' + e.message }); continue; }
            dits.push({ ok: !!(r && r.ok), msg: (r && (r.message || r.erreur)) || '?' });
        }
        const N = {};
        a.entities.filter(e => e instanceof Point).forEach(p => { N[p.label] = p; });
        /* la page ne rend que des COORDONNÉES : les longueurs se calculent ici,
           pour que chaque épreuve dise d'où vient son chiffre. */
        return { dits, points: Object.keys(N).join(''),
                 N: Object.fromEntries(Object.entries(N).map(
                     ([k, p]) => [k, { x: Math.round(p.x), y: Math.round(p.y) }])) };
    }, phrases);

    const UNITE = await page.evaluate(() => gmCm(100));   // combien de cm pour 100 px
    const cm = (A, B) => Math.round(Math.hypot(A.x - B.x, A.y - B.y) / 100 * UNITE * 100) / 100;
    const mil = (P, Q) => ({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 });
    const px = (A, B) => Math.round(Math.hypot(A.x - B.x, A.y - B.y) * 10) / 10;

    /* ============================================================
       1. LA PHRASE DE L'ÉNONCÉ, MOT POUR MOT
       ============================================================ */
    console.log('\n=== la phrase de l\'énoncé, mot pour mot ===');
    let r = await jouer(['tracer un rectangle ABCD de centre H tel que : AB = 8 cm, '
        + 'BC = 10 cm, A en haut à gauche, B en haut à droite et C en bas à droite.']);
    let N = r.N;
    ck('elle est acceptée', r.dits[0].ok, r.dits[0].msg);
    ck('  AB mesure 8 cm', N.A && N.B && Math.abs(cm(N.A, N.B) - 8) < 0.05,
       N.A && N.B ? cm(N.A, N.B) + ' cm' : 'pas de A ou de B');
    ck('  BC mesure 10 cm, et non 4,96', N.B && N.C && Math.abs(cm(N.B, N.C) - 10) < 0.05,
       N.B && N.C ? cm(N.B, N.C) + ' cm' : 'pas de B ou de C');
    ck('  H existe', !!N.H, N.H ? 'oui' : 'NON');
    ck('  et il est AU CENTRE, au pixel près', N.H && N.A && N.C && px(N.H, mil(N.A, N.C)) < 1,
       N.H && N.A && N.C ? px(N.H, mil(N.A, N.C)) + ' px du milieu de [AC]' : '—');
    ck('  la réponse le dit', /centre\s+H/.test(r.dits[0].msg), r.dits[0].msg);
    /* l'énoncé impose aussi les places : A en haut à gauche, C en bas à droite */
    ck('  A est en haut à gauche de C', N.A && N.C && N.A.x < N.C.x && N.A.y < N.C.y,
       N.A && N.C ? `A(${N.A.x},${N.A.y}) C(${N.C.x},${N.C.y})` : '—');

    /* ============================================================
       2. LA SECONDE LONGUEUR EST LUE, QUELLE QU'ELLE SOIT
       Le défaut se voyait en la faisant varier : elle ne bougeait pas.
       ============================================================ */
    console.log('\n=== la seconde longueur n\'est plus inventée ===');
    for (const [ab, bc] of [[8, 10], [8, 3], [4, 2]]) {
        const q = await jouer([`Trace un rectangle ABCD tel que AB = ${ab} cm et BC = ${bc} cm`]);
        const M = q.N;
        const vu = (M.B && M.C) ? cm(M.B, M.C) : null;
        ck(`AB = ${ab}, BC = ${bc}`, vu !== null && Math.abs(vu - bc) < 0.05,
           'BC = ' + vu + ' cm');
    }
    {
        const q = await jouer(['Trace un parallélogramme ABCD tel que AB = 8 cm et BC = 3 cm']);
        const M = q.N;
        ck('le parallélogramme aussi', M.B && M.C && Math.abs(cm(M.B, M.C) - 3) < 0.05,
           M.B && M.C ? cm(M.B, M.C) + ' cm' : '—');
    }
    {
        /* LES MOTS, PAS LA PLACE. « de largeur 3 et de longueur 8 » rendait un
           rectangle de 3 sur 1,86 : la première valeur lue devenait la longueur. */
        const q = await jouer(['Trace un rectangle ABCD de largeur 3 cm et de longueur 8 cm']);
        const M = q.N;
        ck('« largeur 3 et longueur 8 » dans cet ordre-là', M.A && M.B && M.C
            && Math.abs(cm(M.A, M.B) - 8) < 0.05 && Math.abs(cm(M.B, M.C) - 3) < 0.05,
           M.A && M.B && M.C ? `${cm(M.A, M.B)} sur ${cm(M.B, M.C)} cm` : '—');
    }

    /* ============================================================
       3. LE CENTRE ÉCRIT À PART — LES TROIS FORMULATIONS
       ============================================================ */
    console.log('\n=== et le centre, écrit sur sa propre ligne ===');
    const BASE = 'Trace un rectangle ABCD de 8 cm sur 5 cm';
    for (const ph of ['Place le centre H du rectangle ABCD',
                      'Place H le centre de ABCD',
                      'Place H le point d\'intersection des diagonales de ABCD']) {
        const q = await jouer([BASE, ph]);
        const M = q.N;
        const bon = M.H && M.A && M.C && px(M.H, mil(M.A, M.C)) < 1;
        /* et SURTOUT : rien d'autre n'a été tracé */
        const sommets = ['A', 'B', 'C', 'D', 'H'].filter(n => M[n]).length;
        ck(`« ${ph} »`, bon && sommets === 5 && Object.keys(M).length === 5,
           (M.H ? px(M.H, mil(M.A, M.C)) + ' px du centre, ' : 'pas de H, ')
           + Object.keys(M).length + ' points — ' + q.dits[1].msg.slice(0, 50));
    }
    {
        /* UN QUADRILATÈRE QUELCONQUE N'A PAS DE CENTRE, et le refus vaut mieux
           qu'un point posé sur une propriété qui n'existe pas.
           IL FAUT LE FABRIQUER : « Place les points A, B, C, D » les pose en
           losange — les deux diagonales ont alors le même milieu, et le centre
           existe pour de bon. Ma première version de cette sonde l'ignorait et
           criait au défaut sur une figure juste. On déplace donc D à la main,
           ce qui est une MISE EN PLACE et non une mesure. */
        const q = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = []; a.historyFuture = [];
            a.view = { zoom: 1, x: 0, y: 0 };
            if (a.cslOublier) a.cslOublier();
            a.executerConsigneAvec('Place les points A, B, C, D', false);
            const D = a.entities.find(e => e instanceof Point && e.label === 'D');
            D.x -= 90; D.y += 40;                  // plus aucun parallélogramme
            const r = a.executerConsigneAvec('Place H le centre de ABCD', false);
            return { ok: !!(r && r.ok), msg: (r && (r.message || r.erreur)) || '?',
                     H: a.entities.some(e => e instanceof Point && e.label === 'H') };
        });
        ck('un quadrilatère quelconque se refuse', !q.ok && !q.H, q.msg.slice(0, 80));
    }

    /* ============================================================
       4. LES TROIS MILIEUX DE LA LIGNE SUIVANTE
       ============================================================ */
    console.log('\n=== « E le milieu de…, F le milieu de… et M le milieu de… » ===');
    r = await jouer(['tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm',
                     'Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC].']);
    N = r.N;
    ck('les trois sont posés', !!(N.E && N.F && N.M),
       ['E', 'F', 'M'].filter(n => N[n]).join('') || 'aucun');
    ck('  E est bien le milieu de [AH]', N.E && px(N.E, mil(N.A, N.H)) < 1,
       N.E ? px(N.E, mil(N.A, N.H)) + ' px' : '—');
    ck('  F celui de [BH]', N.F && px(N.F, mil(N.B, N.H)) < 1,
       N.F ? px(N.F, mil(N.B, N.H)) + ' px' : '—');
    ck('  M celui de [DC]', N.M && px(N.M, mil(N.D, N.C)) < 1,
       N.M ? px(N.M, mil(N.D, N.C)) + ' px' : '—');

    /* ============================================================
       5. LA DROITE (d) GARDE SON NOM — ET SE LAISSE CITER ENSUITE
       ============================================================ */
    console.log('\n=== la droite (d) garde son nom ===');
    r = await jouer(['tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm',
                     'Tracer la droite (d) parallèle à (AB) passant par H.',
                     'Tracer la droite perpendiculaire à (AB) passant par D.',
                     'Elle coupe la droite (d) en G.']);
    ck('la parallèle s\'appelle (d)', /\(d\)/.test(r.dits[1].msg), r.dits[1].msg);
    ck('  et deux lignes plus loin on peut la citer', r.dits[3].ok && !!r.N.G,
       r.dits[3].msg);
    ck('  G est bien sur la parallèle, à la hauteur de H', r.N.G && r.N.H
        && Math.abs(r.N.G.y - r.N.H.y) < 1,
       r.N.G ? `G(${r.N.G.x},${r.N.G.y}) H(${r.N.H.x},${r.N.H.y})` : '—');

    /* ============================================================
       6. L'ARC DONNÉ PAR SES DEUX EXTRÉMITÉS
       ============================================================ */
    console.log('\n=== l\'arc de centre M d\'extrémités E et F ===');
    const arc = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = []; a.historyFuture = [];
        a.view = { zoom: 1, x: 0, y: 0 };
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm', false);
        a.executerConsigneAvec('Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC].', false);
        const avant = a.entities.length;
        const r = a.executerConsigneAvec("Tracer le petit arc de cercle de centre M d'extrémités E et F.", false);
        const arcs = a.entities.slice(avant).filter(e => e.constructor.name === 'Arc');
        const N = {};
        a.entities.filter(e => e instanceof Point).forEach(p => { N[p.label] = p; });
        if (!arcs.length) return { ok: !!(r && r.ok), msg: (r && (r.message || r.erreur)) || '?', arc: null };
        const A0 = arcs[0];
        const bal = Math.abs(A0.endAngle - A0.startAngle);
        return { ok: !!(r && r.ok), msg: (r && (r.message || r.erreur)) || '?',
                 arc: { r: Math.round(A0.radius * 10) / 10, balayage: Math.round(bal * 1000) / 1000 },
                 ME: Math.round(Math.hypot(N.M.x - N.E.x, N.M.y - N.E.y) * 10) / 10,
                 MF: Math.round(Math.hypot(N.M.x - N.F.x, N.M.y - N.F.y) * 10) / 10 };
    });
    ck('l\'arc est tracé', !!arc.arc, arc.msg);
    ck('  son rayon est ME, écrit dans la phrase', arc.arc
        && Math.abs(arc.arc.r - arc.ME) < 1, arc.arc ? `r = ${arc.arc.r}, ME = ${arc.ME}` : '—');
    ck('  et il passe aussi par F', arc.arc && Math.abs(arc.ME - arc.MF) < 1,
       `ME = ${arc.ME}, MF = ${arc.MF}`);
    ck('  « le PETIT arc » balaie moins d\'un demi-tour', arc.arc
        && arc.arc.balayage <= Math.PI + 1e-6, arc.arc ? arc.arc.balayage + ' rad' : '—');

    /* ============================================================
       7. CE QUI RESTE À FAIRE, ET QUI EST DIT
       Une sonde qui tait ce qui ne marche pas ne sert à rien. Celle-ci ne fait
       pas échouer la suite sur une construction qui n'a jamais existé — elle
       l'IMPRIME, pour que la prochaine lecture sache où elle en est.
       ============================================================ */
    console.log('\n=== ce qui n\'est pas encore fait (constaté, non exigé) ===');
    r = await jouer(['tracer un rectangle ABCD de centre H tel que : AB = 8 cm, BC = 10 cm',
                     'Placer E le milieu de [AH], F le milieu de [BH] et M le milieu de [DC].',
                     'Placer X et Y tels que HXMY soit un losange, XY = 11 cm.']);
    N = r.N;
    const losangeJuste = N.H && N.X && N.M && N.Y
        && Math.abs(cm(N.H, N.X) - cm(N.X, N.M)) < 0.05
        && Math.abs(cm(N.X, N.Y) - 11) < 0.05;
    console.log(`    HXMY : HX = ${N.X ? cm(N.H, N.X) : '?'} cm, XM = ${N.X ? cm(N.X, N.M) : '?'} cm, `
        + `XY = ${N.X && N.Y ? cm(N.X, N.Y) : '?'} cm (voulu : côtés égaux, XY = 11)`);
    console.log(`    réponse : « ${r.dits[2].msg} »`);
    console.log(losangeJuste
        ? '    → la construction existe maintenant : cette section doit devenir une épreuve.'
        : '    → deux sommets OPPOSÉS connus et une diagonale donnée : cette construction'
          + '\n      n\'existe pas. H et M sortent voisins, et XY = 11 cm est ignoré.');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
