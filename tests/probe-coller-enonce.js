// COLLER UN ÉNONCÉ ENTIER DANS LE CHAMP D'ACCUEIL.
//
// « Quand je rentre la consigne il me dit qu'il ne connaît pas le point A. Et
// je ne vois pas l'animation se faire. » — un professeur à qui l'on avait
// envoyé un énoncé de dix-neuf lignes. Deux défauts derrière une seule plainte.
//
// Le champ d'accueil est un <input type="text"> : il change les retours à la
// ligne en ESPACES, sans rien dire. Dix-neuf consignes devenaient donc UNE
// phrase de deux cents caractères, dont le logiciel ne comprenait que le début
// — d'où le point A qu'il ne connaissait pas, deux lignes plus loin.
//
// ATTENTION, PIÈGE DE MESURE : écrire champ.value = "a\nb" ne reproduit PAS un
// collage. L'affectation SUPPRIME les retours à la ligne et soude les mots ;
// un vrai Ctrl+V les change en espaces. Une sonde écrite en .value validerait
// un correctif qui ne marche pas en vrai. On passe donc par le presse-papier.
//
// Et la boîte « une sauvegarde automatique a été trouvée » s'ouvre 500 ms après
// le chargement : elle prend le clavier et ne le rend plus. Une sonde qui tape
// avant accuse le mauvais coupable — on attend, et l'on vide la sauvegarde.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;

let fail = 0;
const ck = (n, ok, d) => { console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

const ENONCE = ['Trace un triangle ABC tel que AB = 9 cm, AC = 8 cm et BC = 6 cm',
                "Place l'orthocentre H du triangle ABC",
                '',
                'Place le milieu D de [AB]',
                'Place le milieu E de [BC]',
                'Trace [DE] en vert'].join('\n');

(async () => {
    const b = await chromium.launch({ executablePath: NAVIGATEUR });
    const ctx = await b.newContext({ viewport: { width: 1400, height: 950 },
        permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForFunction(() => window.app);
    // La boîte de sauvegarde automatique paraît 500 ms après le constructeur.
    await page.waitForTimeout(900);
    const net = () => page.evaluate(() => {
        try { localStorage.removeItem('geoMaster_backup'); } catch (e) { void e; }
        const m = document.getElementById('customModal'); if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
        window.app.entities = []; window.app.historyPast = [];
        if (window.app.cslOublier) window.app.cslOublier();
        const l = window.app.consignesListe(); l.length = 0; l.push(window.app.consigneNeuve());
        window.app.majConsignes(0);
        const b2 = document.getElementById('instructionBox'); if (b2) b2.style.display = 'none';
        const pl = document.getElementById('premiereLigne'); if (pl) pl.style.display = '';
        if (window.app.majFeuilleVide) window.app.majFeuilleVide();
        window.app.render();
    });
    const coller = async (texte) => {
        await page.evaluate((t) => navigator.clipboard.writeText(t), texte);
        await page.locator('#premiereLigneChamp').click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Control+V');
        await page.waitForTimeout(1100);
    };

    console.log('\n=== un vrai collage, pas une affectation ===');
    await net();
    await coller(ENONCE);
    const r = await page.evaluate(() => {
        const app = window.app;
        return { consignes: app.consignesListe().filter(c => (c.texte || '').trim())
                     .map(c => ({ t: c.texte, etat: c.etat })),
            pointsA: app.entities.filter(e => e.constructor.name === 'Point' && e.label === 'A').length,
            accueil: getComputedStyle(document.getElementById('premiereLigne')).display,
            panneau: getComputedStyle(document.getElementById('instructionBox')).display };
    });
    ck('une consigne par ligne, et la ligne vide ne compte pas',
       r.consignes.length === 5, r.consignes.length + ' consigne(s)');
    ck('chaque ligne est bien celle de l\'énoncé',
       r.consignes.every((c, i) => c.t === ENONCE.split('\n').filter(Boolean)[i]),
       JSON.stringify(r.consignes.map(c => c.t.slice(0, 26))));
    ck('toutes passent', r.consignes.every(c => c.etat === 'ok'),
       JSON.stringify(r.consignes.map(c => c.etat)));
    ck('UN SEUL point nommé A', r.pointsA === 1, r.pointsA + ' point(s) A');
    ck("la ligne d'accueil s'efface et le panneau s'ouvre",
       r.accueil === 'none' && r.panneau !== 'none', `accueil ${r.accueil}, panneau ${r.panneau}`);

    console.log('\n=== un collage d\'UNE ligne reste celui du navigateur ===');
    await net();
    const natif = await page.evaluate(() => {
        const champ = document.getElementById('premiereLigneChamp');
        const dt = new DataTransfer(); dt.setData('text', 'Trace un carré ABCD de 4 cm de côté');
        const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
        champ.dispatchEvent(ev);
        return ev.defaultPrevented;
    });
    ck('le logiciel ne se met pas en travers', natif === false, 'defaultPrevented = ' + natif);

    console.log('\n=== la case « aux instruments » est honorée ===');
    await net();
    await page.evaluate(() => { const c = document.getElementById('plInstruments'); if (c) c.checked = true; });
    await coller(['Trace un segment [AB] de longueur 7 cm',
                  'Trace la médiatrice du segment [AB]'].join('\n'));
    const ri = await page.evaluate(() => ({
        ins: window.app.consignesListe().filter(c => (c.texte || '').trim()).map(c => !!c.instruments),
        anim: window.app.entities.filter(e => e.constructor.name === 'ToolAnimation').length }));
    ck('chaque consigne collée est marquée « aux instruments »',
       ri.ins.length >= 2 && ri.ins.every(Boolean), JSON.stringify(ri.ins));
    ck("et l'animation existe pour de bon", ri.anim > 0, ri.anim + ' pose(s) d\'instrument');
    await page.evaluate(() => { const c = document.getElementById('plInstruments'); if (c) c.checked = false; });

    console.log('\n=== le logiciel compte ses ratés, il ne les tait pas ===');
    await net();
    await coller(['Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm',
                  'Exercice 3',
                  'Place le milieu D de [AB]'].join('\n'));
    const rr = await page.evaluate(() => ({
        etats: window.app.consignesListe().filter(c => (c.texte || '').trim()).map(c => c.etat),
        toast: (document.getElementById('toast-notification') || {}).innerText || '' }));
    ck('la ligne qui ne trace rien est marquée ratée',
       rr.etats.filter(e => e === 'rate').length === 1, JSON.stringify(rr.etats));
    ck('et le compte est dit', /\d+\s*(ligne|sur)/i.test(rr.toast), JSON.stringify(rr.toast.slice(0, 80)));

    console.log('\n=== la ligne suivante se désigne ===');
    await net();
    const vierge = await page.evaluate(() => {
        window.app.toggleInstructions();
        return [...document.querySelectorAll('.csl-champ')].map(c => c.placeholder);
    });
    ck("sur un panneau vierge, l'exemple reste",
       vierge[0] === 'Trace un triangle ABC…', JSON.stringify(vierge));
    await net();
    await page.locator('#premiereLigneChamp').click();
    await page.keyboard.type('Trace un triangle ABC tel que AB = 6 cm, AC = 5 cm et BC = 4 cm');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    const ap = await page.evaluate(() => {
        const cs = [...document.querySelectorAll('.csl-champ')];
        const vide = cs.find(c => !c.value.trim());
        if (vide) vide.focus();
        return { places: cs.map(c => c.placeholder),
                 fond: vide ? getComputedStyle(vide).backgroundColor : null,
                 nb: cs.length };
    });
    ck('la case vide dit où continuer',
       ap.places.some(p => /ensuite/i.test(p)), JSON.stringify([...new Set(ap.places)]));
    ck('et la case où est le curseur se voit',
       ap.fond && ap.fond !== 'rgba(0, 0, 0, 0)' && ap.fond !== 'transparent', ap.fond);

    console.log('\n=== on peut enchaîner sans cliquer nulle part ===');
    await page.keyboard.type("Place l'orthocentre H du triangle ABC");
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    const rb = await page.evaluate(() => window.app.consignesListe()
        .filter(c => (c.texte || '').trim()).map(c => c.etat));
    ck('la frappe en aveugle marche', rb.length >= 2 && rb.slice(0, 2).every(e => e === 'ok'),
       JSON.stringify(rb));

    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await b.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
