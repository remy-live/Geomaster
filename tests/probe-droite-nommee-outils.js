/* CE QUI DEVIENT FAUX QUAND LA DROITE PORTE UN NOM.
 *
 * « J'ai mis "trace une droite (d)" et "un point A qui n'est pas sur (d)" et
 *   "trace la parallèle à (d) passant par A". J'ai l'impression que ça ne
 *   fonctionnait plus avec les outils. »
 *
 * Trois défauts se cachaient dans ces trois phrases, et chacun aurait suffi à
 * gâcher la figure.
 *
 * 1. UN CHEMIN DE CODE QUI IGNORAIT LE RÉGLAGE. « La parallèle à (AB) » sortait
 *    l'équerre et la règle ; « la parallèle à (d) » ne sortait rien. Mesuré :
 *    six animations d'un côté, ZÉRO de l'autre, la case « avec les instruments »
 *    cochée dans les deux cas. Ce n'était pas un réglage qui ne prenait pas :
 *    c'était la branche « la droite de référence porte un nom » qui posait le
 *    trait directement, sans jamais regarder le réglage. Même chose pour la
 *    perpendiculaire. La sonde compare maintenant les deux écritures : elles
 *    doivent donner le même nombre d'instruments.
 *
 * 2. UNE NÉGATION LUE À L'ENVERS. « Place un point A qui n'est pas sur (d) »
 *    répondait « A sur (d) » et posait le point DESSUS — mesuré à 0,0 px de la
 *    droite. Le mot « sur » suffisait à décider ; la négation qui le précède
 *    n'était jamais regardée. Rien n'est plus grave dans un logiciel qui exécute
 *    des phrases : faire l'inverse de ce qui est écrit, en annonçant qu'on l'a
 *    fait. Et la conséquence était en cascade — A sur (d), la parallèle à (d)
 *    passant par A est (d) elle-même.
 *
 * 3. ET UN POINT LIBRE QUI TOMBAIT SUR LE TRAIT. Celui-là n'avait été demandé
 *    par personne, et il est le plus sournois : « Trace une droite (d) » passe
 *    par le centre de la vue, et le placement libre posait le point suivant
 *    exactement là. « Place un point A » le déposait donc à 0,0 px de (d). Le
 *    point avait l'air contraint sans l'être, et la figure mentait sans qu'une
 *    seule phrase soit fausse. Un point libre n'est tenu par rien : il ne doit
 *    avoir l'air de rien.
 *
 * S'Y AJOUTE LA LIGNE D'ACCUEIL. C'est là qu'on écrit sa première phrase, donc
 * là qu'on découvre le logiciel — et ce qu'il a de particulier n'est pas de
 * tracer un triangle, c'est de le tracer AUX INSTRUMENTS. La case y est
 * maintenant, partageant la mémoire de la barre éclair. Et l'invitation
 * s'efface dès qu'on touche la feuille : elle ne prenait pas les clics, mais
 * elle restait posée au milieu du dessin qu'on commençait dessous.
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
        try { localStorage.removeItem('gm_eclair_outils'); } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    /* Une suite de phrases, jouée pour de vrai, et ce qu'il en reste. */
    const suite = (phrases, outils) => page.evaluate(([phrases, outils]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const refus = [];
        phrases.forEach(p => {
            const r = a.executerConsigneAvec(p, outils);
            if (!r || !r.ok) refus.push(p + ' → ' + ((r && r.message) || '?'));
        });
        const anims = a.entities.filter(e => e instanceof ToolAnimation);
        const A = a.entities.find(e => e.label === 'A');
        const d = a.entities.find(e => e.nomDroite === 'd');
        let distA = null;
        if (A && d && d.p1 && d.p2) {
            const ux = d.p2.x - d.p1.x, uy = d.p2.y - d.p1.y, L = Math.hypot(ux, uy) || 1;
            distA = Math.abs((A.x - d.p1.x) * uy - (A.y - d.p1.y) * ux) / L;
        }
        return { refus, anims: anims.length,
                 outils: [...new Set(anims.map(e => e.widgetType))].sort().join('+') || '—',
                 distA, objets: a.entities.length };
    }, [phrases, outils]);

    console.log('\n=== la phrase exacte signalée, du début à la fin ===');
    const vrai = await suite(['Trace une droite (d)',
                              'Place un point A qui n\'est pas sur (d)',
                              'Trace la parallèle à (d) passant par A'], true);
    ck('les trois phrases sont comprises', vrai.refus.length === 0, vrai.refus.join(' | '));
    ck('  A n\'est PAS sur (d) — la négation est lue',
       vrai.distA !== null && vrai.distA > 40,
       vrai.distA === null ? 'A ou (d) introuvable' : vrai.distA.toFixed(1) + ' px de (d)');
    ck('  et les instruments sortent : équerre ET règle',
       /ruler/.test(vrai.outils) && /setsquare/.test(vrai.outils),
       vrai.anims + ' animations · ' + vrai.outils);

    console.log('\n=== une droite nommée doit valoir une droite en deux points ===');
    for (const [quoi, mot] of [['parallèle', 'parallèle'], ['perpendiculaire', 'perpendiculaire']]) {
        const nommee = await suite(['Trace une droite (d)', 'Place un point A',
                                    `Trace la ${mot} à (d) passant par A`], true);
        const paire = await suite(['Place les points B, C et A',
                                   `Trace la ${mot} à (BC) passant par A`], true);
        ck(`la ${quoi} à (d) sort autant d'instruments que la ${quoi} à (BC)`,
           nommee.anims > 0 && nommee.outils === paire.outils,
           `(d) : ${nommee.anims} animations ${nommee.outils} · (BC) : ${paire.anims} ${paire.outils}`);
    }

    console.log('\n=== sans les instruments, rien ne sort — le réglage marche dans les deux sens ===');
    const nu = await suite(['Trace une droite (d)', 'Place un point A',
                            'Trace la parallèle à (d) passant par A'], false);
    ck('aucune animation quand la case est décochée', nu.anims === 0, nu.anims + ' animations');

    console.log('\n=== la négation, dans ses formulations ===');
    for (const phrase of ['Place un point A qui n\'est pas sur (d)',
                          'Place un point A hors de (d)',
                          'Place un point A en dehors de (d)',
                          'Place un point A qui n\'appartient pas à (d)']) {
        const r = await suite(['Trace une droite (d)', phrase], false);
        ck('« ' + phrase.replace('Place un point A ', '') + ' »',
           r.distA !== null && r.distA > 40,
           r.distA === null ? 'A introuvable' : r.distA.toFixed(1) + ' px de (d)');
    }
    /* Et l'affirmation continue de dire ce qu'elle dit : le garde-fou qui
       compte, sinon on aurait réparé la négation en cassant « sur ». */
    const dessus = await suite(['Trace une droite (d)', 'Place un point A sur (d)'], false);
    ck('mais « sur (d) » pose toujours A SUR (d)',
       dessus.distA !== null && dessus.distA < 1,
       dessus.distA === null ? 'A introuvable' : dessus.distA.toFixed(2) + ' px de (d)');

    console.log('\n=== un point libre ne se pose pas sur un trait ===');
    const libre = await suite(['Trace une droite (d)', 'Place un point A'], false);
    ck('« Place un point A » après une droite ne tombe pas dessus',
       libre.distA !== null && libre.distA > 40,
       libre.distA === null ? 'A introuvable' : libre.distA.toFixed(1) + ' px de (d)');
    const troisPts = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.executerConsigneAvec('Trace le segment [BC]', false);
        a.executerConsigneAvec('Place un point M', false);
        const M = a.entities.find(e => e.label === 'M');
        const s = a.entities.find(e => e instanceof Segment);
        if (!M || !s) return null;
        const ux = s.p2.x - s.p1.x, uy = s.p2.y - s.p1.y, L = Math.hypot(ux, uy) || 1;
        const k = Math.max(0, Math.min(1, ((M.x - s.p1.x) * ux + (M.y - s.p1.y) * uy) / (L * L)));
        return Math.hypot(M.x - (s.p1.x + ux * k), M.y - (s.p1.y + uy * k));
    });
    ck('  ni sur un segment', troisPts !== null && troisPts > 40,
       troisPts === null ? 'introuvable' : troisPts.toFixed(1) + ' px de [BC]');

    console.log('\n=== la ligne d\'accueil propose les instruments ===');
    const accueil = () => page.evaluate(() => {
        const l = document.getElementById('premiereLigne');
        const c = document.getElementById('plInstruments');
        const lab = document.getElementById('plOutils');
        const r = lab ? lab.getBoundingClientRect() : null;
        return { visible: !!l && l.style.display !== 'none',
                 caseLa: !!c, cochee: c ? c.checked : null,
                 hauteurCible: r ? r.height : 0 };
    });
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a._invitationEcartee = false; a.setTool('move'); a.render();
    });
    await page.waitForTimeout(200);
    const dep = await accueil();
    ck('la case y est, décochée par défaut',
       dep.visible && dep.caseLa && dep.cochee === false, JSON.stringify(dep));

    await page.check('#plInstruments');
    const lance = await page.evaluate(() => {
        const a = window.app;
        document.getElementById('premiereLigneChamp').value =
            'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm';
        a.lancerPremiereLigne();
        const c = a.consignesListe().find(x => (x.texte || '').includes('triangle'));
        return { instruments: !!(c && c.instruments),
                 anims: a.entities.filter(e => e instanceof ToolAnimation).length,
                 memoire: (() => { try { return localStorage.getItem('gm_eclair_outils'); }
                                   catch (e) { return null; } })() };
    });
    ck('  cochée, la première phrase part AVEC les instruments',
       lance.instruments && lance.anims > 0,
       `consigne.instruments=${lance.instruments} · ${lance.anims} animations`);
    ck('  et le choix est partagé avec la barre éclair',
       lance.memoire === '1', 'gm_eclair_outils = ' + lance.memoire);

    console.log('\n=== et l\'invitation s\'efface dès qu\'on touche la feuille ===');
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a._invitationEcartee = false; a.setTool('move'); a.render();
    });
    await page.waitForTimeout(200);
    ck('elle est là avant', (await accueil()).visible);
    const box = await page.evaluate(() => {
        const r = window.app.canvas.getBoundingClientRect(); return { x: r.x, y: r.y };
    });
    await page.mouse.click(box.x + 900, box.y + 700);
    await page.waitForTimeout(250);
    ck('  un clic à côté l\'écarte', !(await accueil()).visible);
    await page.evaluate(() => window.app.render());
    await page.waitForTimeout(150);
    ck('  et elle ne revient pas au redessin suivant', !(await accueil()).visible);

    await page.evaluate(() => {
        window.app.clearAll();
        document.getElementById('btnModalConfirm').click();
    });
    await page.waitForTimeout(350);
    ck('« tout effacer » la redonne : feuille neuve, invitation neuve',
       (await accueil()).visible);

    console.log('\n=== au doigt, la case se vise ===');
    const tel = await nav.newContext({ viewport: { width: 430, height: 860 },
                                       hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const petit = await tel.newPage();
    await petit.goto(PAGE);
    await petit.waitForFunction(() => window.app);
    await petit.evaluate(() => {
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        window.app.entities = []; window.app._invitationEcartee = false;
        window.app.setTool('move'); window.app.render();
    });
    await petit.waitForTimeout(400);
    const cible = await petit.evaluate(() => {
        const lab = document.getElementById('plOutils');
        const r = lab ? lab.getBoundingClientRect() : null;
        return r ? { h: r.height, w: r.width } : null;
    });
    ck('l\'étiquette fait au moins 32 px de haut',
       cible && cible.h >= 32, cible ? Math.round(cible.w) + '×' + Math.round(cible.h) : 'absente');
    await tel.close();

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
