// LA HAUTEUR DESCEND À L'ÉQUERRE, ET SON PIED EST UN POINT QUI SUIT.
//
// « Place le pied de la hauteur issue de A » traçait une hauteur et répondait
// « Hauteur issue de A » : les mots « Place » et « pied » étaient ignorés tous
// les deux. Et « Trace la hauteur issue de A » AVEC les instruments ajoutait
// une entité et ZÉRO animation — case cochée comme décochée —, alors que le
// logiciel sait poser l'équerre et la faire glisser le long de la règle depuis
// toujours : il le faisait pour la perpendiculaire, pas pour la hauteur.
//
// Le piège de la correction n'est pas de poser le point, c'est de le poser
// VIVANT. Un pied calculé puis oublié se retrouve à 84 px du vrai dès qu'on
// tire le sommet, et une projection (parent unique) fait exactement pareil :
// elle reprojette depuis la position COURANTE du point. D'où la relation
// « pied » — projeté du premier parent sur la droite des deux autres.
//
// Deux cas que seule la mesure attrape : le triangle OBTUSANGLE, où le pied
// tombe hors du côté (un pied cherché sur le SEGMENT s'y éteint), et le carré
// d'angle droit, qui se lit 90 OU 270 selon l'orientation — une sonde écrite
// « 90 ± 0,5 » passerait au rouge pour rien.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

/* Joue un triangle puis une phrase, et rend tout ce qu'il faut pour juger. */
const JOUER = ({ tri, phrase, instruments, tirer }) => {
    const app = window.app;
    const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
    app.checkAutoSave = () => {};
    app.entities = []; app.historyPast = [];
    if (app.cslOublier) app.cslOublier();
    app.executerConsigneAvec(tri, false);
    const avant = app.entities.length;
    let res = null, err = null;
    try { res = app.executerConsigneAvec(phrase, !!instruments); } catch (e) { err = e.message; }
    const nes = app.entities.slice(avant);
    const pt = (l) => app.entities.find(e => e.constructor.name === 'Point' && e.label === l);
    /* Le pied calculé ICI, à la main, et jamais demandé au logiciel. */
    const pied = (S, a, b) => {
        const ux = b.x - a.x, uy = b.y - a.y, l2 = ux * ux + uy * uy || 1;
        const k = ((S.x - a.x) * ux + (S.y - a.y) * uy) / l2;
        return { x: a.x + k * ux, y: a.y + k * uy, k };
    };
    const lire = () => {
        const A = pt('A'), B = pt('B'), C = pt('C');
        const vrai = pied(A, B, C);
        const dessus = app.entities.filter(e => e.constructor.name === 'Point'
            && e.visible !== false && Math.hypot(e.x - vrai.x, e.y - vrai.y) < 1);
        /* Tout angle droit de la figure doit ENCORE être droit : on le mesure
           au sinus, car le même angle droit se lit 90 ou 270 selon le sens. */
        const droits = app.entities.filter(e => e.constructor.name === 'Angle' && e.isRightAngle)
            .map(e => Math.round(Math.abs(Math.sin(e.getAngleValue() * Math.PI / 180)) * 1000) / 1000);
        return { k: Math.round(vrai.k * 1000) / 1000,
                 dessus: dessus.map(e => e.label || '(sans nom)'),
                 droits };
    };
    const avantTirage = lire();
    let apresTirage = null;
    if (tirer) {
        const q = pt(tirer);
        if (q) { q.x += 150; q.y -= 40; }
        app.entities.forEach(e => e.update && e.update());
        app.updateDependents();
        apresTirage = lire();
    }
    return {
        ok: !!(res && res.ok), msg: (res && res.message) || '', err,
        nouvelles: nes.length,
        animations: nes.filter(e => e.constructor.name === 'ToolAnimation').length,
        widgets: [...new Set(nes.filter(e => e.constructor.name === 'ToolAnimation')
            .map(e => e.widgetType || e.type))].sort().join(','),
        etapes: Object.keys(app.stepInstructions || {}).length,
        avantTirage, apresTirage,
    };
};

const TRI = 'Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm';
// AB = 2, AC = 7, BC = 6 : le pied de la hauteur issue de A tombe HORS de [BC].
const OBTUS = 'Trace un triangle ABC tel que AB = 2 cm, AC = 7 cm et BC = 6 cm';

(async () => {
    const b = await chromium.launch({ executablePath: NAVIGATEUR });
    const page = await b.newPage({ viewport: { width: 1400, height: 950 } });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    await page.waitForTimeout(900);
    const jouer = (o) => page.evaluate(JOUER, o);

    console.log('\n=== le pied est posé, et il est SEUL ===');
    for (const ph of ['Place le pied de la hauteur issue de A',
                      'Place le pied de la hauteur issue de A dans le triangle ABC']) {
        const r = await jouer({ tri: TRI, phrase: ph });
        ck(`« ${ph.slice(0, 48)}… » : exactement un point au pied`,
           r.ok && r.avantTirage.dessus.length === 1,
           `${r.avantTirage.dessus.length} point(s) ${JSON.stringify(r.avantTirage.dessus)} — ${r.err || r.msg}`);
        ck('   et la réponse le nomme', /pied de la hauteur/.test(r.msg), r.msg);
    }
    const rn = await jouer({ tri: TRI, phrase: 'Place le pied H de la hauteur issue de A' });
    ck('le nom écrit est gardé', rn.avantTirage.dessus[0] === 'H' && /^H /.test(rn.msg),
       JSON.stringify(rn.avantTirage.dessus) + ' — ' + rn.msg);

    console.log('\n=== il SUIT quand on tire la figure ===');
    for (const quoi of ['A', 'B', 'C']) {
        const r = await jouer({ tri: TRI, phrase: 'Place le pied de la hauteur issue de A', tirer: quoi });
        ck(`on tire ${quoi} : le pied est toujours au pied`,
           r.apresTirage && r.apresTirage.dessus.length === 1,
           r.apresTirage ? `${r.apresTirage.dessus.length} point(s) au pied recalculé` : 'rien');
    }

    console.log('\n=== le triangle OBTUSANGLE : le pied tombe hors du côté ===');
    const ro = await jouer({ tri: OBTUS, phrase: 'Place le pied de la hauteur issue de A', tirer: 'A' });
    ck('le pied est bien hors de [BC]', ro.avantTirage.k < 0 || ro.avantTirage.k > 1,
       'k = ' + ro.avantTirage.k);
    ck('et il existe quand même, visible et exact', ro.avantTirage.dessus.length === 1,
       JSON.stringify(ro.avantTirage.dessus));
    ck('et il suit encore après le glissement',
       ro.apresTirage && ro.apresTirage.dessus.length === 1,
       ro.apresTirage ? JSON.stringify(ro.apresTirage.dessus) : 'rien');

    console.log("\n=== l'équerre descend vraiment ===");
    const ri = await jouer({ tri: TRI, phrase: 'Trace la hauteur issue de A dans le triangle ABC', instruments: true });
    ck("la hauteur aux instruments pose des poses d'instrument", ri.animations >= 5,
       `${ri.animations} animation(s), ${ri.nouvelles} entité(s)`);
    ck("l'équerre ET la règle sont de la partie", /setsquare/.test(ri.widgets) && /ruler/.test(ri.widgets),
       ri.widgets);
    ck('et la construction se raconte', ri.etapes >= 2, ri.etapes + ' étape(s)');
    const rip = await jouer({ tri: TRI, phrase: 'Place le pied de la hauteur issue de A', instruments: true, tirer: 'B' });
    ck('aux instruments aussi, un seul point au pied', rip.avantTirage.dessus.length === 1,
       JSON.stringify(rip.avantTirage.dessus));
    ck("et l'angle droit reste droit après le glissement",
       rip.apresTirage && rip.apresTirage.droits.length > 0
       && rip.apresTirage.droits.every(v => v > 0.99),
       'sin = ' + JSON.stringify(rip.apresTirage ? rip.apresTirage.droits : null));

    console.log('\n=== le pied survit à l\'enregistrement et au lien ===');
    const rs = await page.evaluate(({ tri, ph }) => {
        const app = window.app;
        app.entities = []; app.historyPast = [];
        if (app.cslOublier) app.cslOublier();
        app.executerConsigneAvec(tri, false);
        app.executerConsigneAvec(ph, false);
        const mesure = () => {
            const pt = (l) => app.entities.find(e => e.constructor.name === 'Point' && e.label === l);
            const A = pt('A'), B = pt('B'), C = pt('C');
            const ux = C.x - B.x, uy = C.y - B.y, l2 = ux * ux + uy * uy || 1;
            const k = ((A.x - B.x) * ux + (A.y - B.y) * uy) / l2;
            const v = { x: B.x + k * ux, y: B.y + k * uy };
            const p = app.entities.filter(e => e.constructor.name === 'Point' && e.subType === 'pied');
            return { n: p.length, parents: p[0] ? p[0].parents.length : 0,
                     ecart: p[0] ? Math.round(Math.hypot(p[0].x - v.x, p[0].y - v.y) * 100) / 100 : null };
        };
        const avant = mesure();
        app.entities = app.deserialize(app.serialize());
        const apresJSON = mesure();
        const lien = app.getCompressedString();
        app.entities = []; app.loadFromCompressedString(lien);
        const pt = (l) => app.entities.find(e => e.constructor.name === 'Point' && e.label === l);
        const A = pt('A'); if (A) { A.x += 150; A.y -= 40; }
        app.entities.forEach(e => e.update && e.update());
        app.updateDependents();
        const apresLien = mesure();
        return { avant, apresJSON, apresLien };
    }, { tri: TRI, ph: 'Place le pied de la hauteur issue de A' });
    ck('après un aller-retour JSON, le pied est toujours une relation',
       rs.apresJSON.n === 1 && rs.apresJSON.parents === 3 && rs.apresJSON.ecart < 0.5,
       JSON.stringify(rs.apresJSON));
    ck('après un aller-retour par le LIEN, il suit encore un glissement',
       rs.apresLien.n === 1 && rs.apresLien.parents === 3 && rs.apresLien.ecart < 0.5,
       JSON.stringify(rs.apresLien));

    console.log("\n=== ce qui ne devait pas bouger n'a pas bougé ===");
    const INCHANGE = [
        ['Trace la hauteur issue de A dans le triangle ABC', 1, 'Hauteur issue de A'],
        ['Trace la hauteur issue de A', 1, 'Hauteur issue de A'],
        ['Trace les hauteurs du triangle ABC', 3, 'Les 3 hauteurs de ABC'],
        ['Trace les hauteurs issues de A et de B', 2, 'Hauteurs issues de A et de B'],
    ];
    for (const [ph, n, msg] of INCHANGE) {
        const r = await jouer({ tri: TRI, phrase: ph });
        ck(`« ${ph.slice(0, 44)} » : ${n} entité(s), message intact`,
           r.nouvelles === n && r.msg === msg, `+${r.nouvelles} — « ${r.msg} »`);
    }

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await b.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
