/* UNE DROITE SE NOTE (d), PAS d.
 *
 * « Pour le nom des droites sur le canvas, tu oublies les parenthèses autour. »
 *
 * Les parenthèses ne sont pas une décoration : elles DISENT qu'on parle d'une
 * droite. A est un point, (d) est une droite, [AB] un segment — c'est le premier
 * accord de notation qu'on demande à un élève, et le logiciel ne le tenait qu'à
 * moitié. Sur la feuille il n'y avait que la lettre, si bien qu'un d posé à côté
 * d'un trait ressemblait au nom d'un point ; et l'énoncé rédigé trois
 * centimètres plus bas, lui, écrivait bien « la parallèle à (d) ». Deux
 * notations pour un même objet, sur le même écran.
 *
 * DEUX NIVEAUX, ET TOUT TIENT À NE PAS LES CONFONDRE.
 *   · Le nom RANGÉ est « d ». C'est ce qu'on tape pour renommer, ce que les
 *     phrases citent, ce que les fichiers portent.
 *   · Ce qui s'ÉCRIT est « (d) ».
 * Ajouter les parenthèses au nom stocké aurait donné « ((d)) » au premier
 * aller-retour — et « la parallèle à (d) » ne trouverait plus rien.
 *
 * TROIS CONSÉQUENCES QUE LA SONDE TIENT, PARCE QU'AUCUNE N'EST ÉVIDENTE.
 *
 * 1. LA ZONE DE PRÉHENSION SUIT LE TEXTE. Le nom se prend au doigt pour le
 *    faire glisser le long de la droite ; la zone était un disque de 16 px
 *    autour de l'ancre. Avec les parenthèses, le texte est deux fois plus large
 *    qu'une lettre seule — les deux tiers seraient restés hors de prise.
 *
 * 2. LA MÉTHODE DOIT ÊTRE RECOPIÉE SUR LA PARALLÈLE ET LA PERPENDICULAIRE.
 *    Elles ne descendent pas de LinearObject : leurs méthodes de nom leur sont
 *    recopiées une à une. En oubliant celle-ci, le rendu levait « this
 *    .nomDroiteAffiche is not a function » — et comme les bâtisseurs dessinent
 *    en construisant, « Trace deux droites parallèles » répondait « Je n'ai pas
 *    su faire ça ». Un défaut d'affichage se déguisait en défaut de langue.
 *
 * 3. ET LE SVG N'EMPORTAIT PAS LE NOM DU TOUT. Mesuré avant : un SVG exporté
 *    d'une figure portant (d) et A ne contenait qu'un seul texte, « A ». La
 *    droite arrivait anonyme dans le document où l'on colle la figure à côté de
 *    l'énoncé qui la nomme.
 *
 * Plus une politesse : on voit « (d) » sur la feuille, donc on le retape avec
 * ses parenthèses. Le champ de renommage les retire.
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

    /* Ce qui est réellement écrit sur la feuille, quel que soit le genre de
       droite — c'est le seul endroit où la question se pose. */
    const ecrits = (phrases, apres) => page.evaluate(([phrases, apres]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        phrases.forEach(p => a.executerConsigneAvec(p, false));
        if (apres) new Function('app', apres)(a);
        const c = a.ctx, vrai = c.fillText.bind(c), vus = [];
        c.fillText = function (t, x, y) { vus.push(String(t)); return vrai(t, x, y); };
        let boum = null;
        try { a.render(); } catch (e) { boum = e.message; }
        c.fillText = vrai;
        return { vus, boum, ranges: a.entities.filter(e => e.nomDroite).map(e => e.nomDroite) };
    }, [phrases, apres || null]);

    console.log('\n=== une droite porte ses parenthèses, quel que soit son genre ===');
    const droite = await ecrits(['Trace une droite (d)']);
    ck('une droite tracée à la phrase', !droite.boum && droite.vus.includes('(d)'),
       droite.boum || JSON.stringify(droite.vus));
    ck('  et son nom RANGÉ n\'en a pas', droite.ranges.join(',') === 'd',
       JSON.stringify(droite.ranges));

    const deux = await ecrits(['Trace deux droites parallèles']);
    ck('deux droites d\'un coup', !deux.boum
       && deux.vus.includes('(d)') && deux.vus.includes("(d')"),
       deux.boum || JSON.stringify(deux.vus));

    /* La parallèle et la perpendiculaire ne descendent pas de LinearObject :
       leurs méthodes de nom leur sont RECOPIÉES. En oublier une ne se voit pas
       au premier coup d'œil — elle lève au rendu, et le bâtisseur qui dessine
       en construisant rend alors un refus de langue. */
    const par = await ecrits(['Trace la parallèle à (d) passant par A'],
        "const p = app.entities.find(e => e instanceof ParallelLine); p.nomDroite = 'e';");
    ck('une PARALLÈLE nommée s\'écrit aussi', !par.boum && par.vus.includes('(e)'),
       par.boum || JSON.stringify(par.vus));
    const perp = await ecrits(['Trace la perpendiculaire à (d) passant par A'],
        "const p = app.entities.find(e => e instanceof PerpendicularLine); p.nomDroite = 'f';");
    ck('  et une PERPENDICULAIRE aussi', !perp.boum && perp.vus.includes('(f)'),
       perp.boum || JSON.stringify(perp.vus));

    console.log('\n=== les bâtisseurs ne trébuchent plus sur l\'affichage ===');
    const phrases = await page.evaluate(() => {
        const a = window.app;
        const out = {};
        ['Trace deux droites parallèles', 'Trace deux droites perpendiculaires',
         'Trace la parallèle à (d) passant par A'].forEach(p => {
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            const r = a.executerConsigneAvec(p, false);
            out[p] = !!(r && r.ok);
        });
        return out;
    });
    Object.entries(phrases).forEach(([p, ok]) => {
        ck('« ' + p + ' »', ok, ok ? 'faite' : 'REFUSÉE — le rendu lève sans doute');
    });

    console.log('\n=== la zone de préhension suit la largeur du texte ===');
    const prise = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace une droite (d)', false);
        const d = a.entities.find(e => e.nomDroite);
        const an = d.ancreNomDroite(null, a.ctx);
        const largeur = (() => {
            const c = a.ctx; c.save();
            c.font = "italic 15px " + (window.GM_POLICE_PILE || "'Segoe UI', sans-serif");
            const w = c.measureText(d.nomDroiteAffiche()).width; c.restore(); return w;
        })();
        const au = (dx) => d.nomDroiteTouche(an.x + dx, an.y);
        return { largeur, centre: au(0), bord: au(largeur / 2 - 2), dehors: au(largeur / 2 + 14) };
    });
    ck('le texte « (d) » fait sa vraie largeur', prise.largeur > 14,
       Math.round(prise.largeur) + ' px');
    ck('  on l\'attrape au centre', prise.centre);
    ck('  et jusqu\'au bord des parenthèses', prise.bord,
       prise.bord ? 'oui' : 'NON — les deux tiers hors de prise');
    ck('  mais pas loin à côté', !prise.dehors);

    console.log('\n=== le SVG emporte le nom, avec ses parenthèses ===');
    const svg = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace la parallèle à (d) passant par A', false);
        const s = a.generateSVGString(false, 'text') || '';
        return (s.match(/<text[^>]*>([^<]*)<\/text>/g) || []).map(t => t.replace(/<[^>]*>/g, ''));
    });
    ck('le nom de la droite y est', svg.includes('(d)'), JSON.stringify(svg));
    ck('  et le point aussi, comme avant', svg.includes('A'), JSON.stringify(svg));

    console.log('\n=== on peut retaper les parenthèses sans les doubler ===');
    const retape = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace une droite (d)', false);
        const d = a.entities.find(e => e.nomDroite);
        const r = a.canvas.getBoundingClientRect();
        const ecran = (p) => ({ x: r.left + p.x * a.view.zoom + a.view.x,
                                y: r.top + p.y * a.view.zoom + a.view.y });
        const m = ecran({ x: (d.p1.x + d.p2.x) / 2, y: (d.p1.y + d.p2.y) / 2 });
        a.nommerDroite(d, m.x, m.y);
        const champ = a.activeRenameInput;
        if (!champ) return { erreur: 'pas de champ' };
        const ouvert = champ.value;
        champ.value = "(e')";
        champ.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        return { ouvert, range: d.nomDroite, affiche: d.nomDroiteAffiche() };
    });
    ck('le champ s\'ouvre sur le nom NU', retape.ouvert === 'd',
       JSON.stringify(retape.ouvert));
    ck('  taper « (e\') » range « e\' », sans doubler',
       retape.range === "e'", JSON.stringify(retape.range));
    ck('  et la feuille écrit « (e\') »',
       retape.affiche === "(e')", JSON.stringify(retape.affiche));

    console.log('\n=== et les phrases citent toujours le nom nu ===');
    const langue = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace une droite (d)', false);
        const r1 = a.executerConsigneAvec('Place un point M sur (d)', false);
        const r2 = a.executerConsigneAvec('Trace la perpendiculaire à (d) passant par M', false);
        return { sur: !!(r1 && r1.ok), perp: !!(r2 && r2.ok),
                 prog: (a.programmeDeConstruction(false) || []).join(' | ') };
    });
    ck('« Place un point M sur (d) » marche toujours', langue.sur);
    ck('  « la perpendiculaire à (d) » aussi', langue.perp);
    ck('  et l\'énoncé écrit (d) comme la feuille',
       /\(d\)/.test(langue.prog), langue.prog);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
