/* UNE PHRASE QUI NOMME UNE DROITE PEUT L'INVENTER.
 *
 * « Quand on dit : trace une parallèle à (d) passant par A — et que les objets
 *   n'existent pas, tu les crées. »
 *
 * DEUX PHRASES QUI DEMANDENT LA MÊME CHOSE, DEUX RÉPONSES OPPOSÉES. Sur une
 * feuille vide, « Trace la parallèle à (AB) passant par C » posait A, B, C ET la
 * droite (AB), et le disait. « Trace la parallèle à (d) passant par A »
 * répondait « À quelle droite ? ».
 *
 * Or c'est la SECONDE qu'on écrit en préparant un exercice : une droite qu'on
 * nomme (d) n'a précisément pas à passer par des points qu'on nommerait. Et le
 * refus n'apprenait rien — il conseillait « … à (AB) passant par C »,
 * c'est-à-dire de renoncer à la notation qu'on venait de choisir.
 *
 * LA CAUSE ÉTAIT DANS LE LECTEUR DE NOMS, et elle était invisible. Les noms de
 * droite sont filtrés par une liste de mots courts — « de », « du », « et »,
 * « la »… — pour que « la droite du milieu » ne donne pas une droite nommée
 * « du ». La lettre **d** figure dans cette liste, à cause du « d' » élidé. Le
 * filtre s'appliquait PARTOUT, y compris entre parenthèses : « (d) » ne
 * produisait donc aucun nom, et il n'y avait rien à chercher ni à créer. Or
 * entre parenthèses il n'y a pas d'ambiguïté — on n'écrit pas « (de) ».
 *
 * CE QUE LA SONDE TIENT.
 *   1. Les quatre phrases — parallèle et perpendiculaire, notation (d) et
 *      notation (AB) — réussissent sur une feuille VIDE, avec ou sans les
 *      instruments.
 *   2. Ce qui a été inventé est DIT. Poser sans le dire serait pire que
 *      refuser : on croirait avoir tracé la parallèle à une droite qu'on avait
 *      en tête, alors qu'elle vient d'être inventée. Et quand tout existait
 *      déjà, on ne dit rien — une remarque qui paraît à tort est une remarque
 *      qu'on n'écoutera plus.
 *   3. Le point posé n'atterrit pas SUR la droite inventée : une parallèle à (d)
 *      passant par un point de (d) est (d) elle-même.
 *   4. La parallèle est accrochée à la droite qu'on vient de créer — pas à une
 *      copie de ses coordonnées — donc elle la suit et survit à l'enregistrement.
 *   5. L'énoncé rédigé ensuite REDONNE la figure, en trois lignes qui se
 *      suffisent.
 *   6. Le filtre continue de faire son travail : « la droite du milieu » ne
 *      fabrique toujours pas de droite nommée « du ».
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

    /* Une phrase, seule, sur une feuille vide. */
    const surFeuilleVide = (phrase, outils) => page.evaluate(([phrase, outils]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        let r, boum = null;
        try { r = a.executerConsigneAvec(phrase, outils); }
        catch (e) { boum = e.message; }
        const cible = a.entities.find(e => e instanceof ParallelLine
            || e instanceof PerpendicularLine);
        const d = a.entities.find(e => e.nomDroite);
        const A = a.entities.find(e => e.label === 'A');
        let ecart = null;
        if (A && d && d.p1 && d.p2) {
            const ux = d.p2.x - d.p1.x, uy = d.p2.y - d.p1.y, L = Math.hypot(ux, uy) || 1;
            ecart = Math.abs((A.x - d.p1.x) * uy - (A.y - d.p1.y) * ux) / L;
        }
        return {
            boum,
            ok: !!(r && r.ok),
            message: (r && r.message) || '',
            astuce: (r && r.astuce) || '',
            cible: !!cible,
            accrochee: !!(cible && d && cible.refLine === d),
            nomDroite: d ? d.nomDroite : null,
            ecart,
            gestes: a.entities.filter(e => e instanceof ToolAnimation).length,
            programme: a.programmeDeConstruction(false) || [],
        };
    }, [phrase, outils]);

    console.log('\n=== sur une feuille vide, les quatre phrases passent ===');
    const PHRASES = [
        ['Trace la parallèle à (d) passant par A', 'd'],
        ['Trace la perpendiculaire à (d) passant par A', 'd'],
        ['Trace la parallèle à (AB) passant par C', null],
        ['Trace la perpendiculaire à (AB) passant par C', null],
    ];
    for (const [phrase] of PHRASES) {
        const r = await surFeuilleVide(phrase, false);
        ck('« ' + phrase + ' »', !r.boum && r.ok && r.cible,
           r.boum ? 'CRASH : ' + r.boum : r.message);
    }

    console.log('\n=== et aux instruments aussi ===');
    for (const [phrase] of PHRASES) {
        const r = await surFeuilleVide(phrase, true);
        ck('« ' + phrase + ' »', !r.boum && r.ok && r.gestes > 0,
           r.boum ? 'CRASH : ' + r.boum : r.gestes + ' geste(s) d\'instrument');
    }

    console.log('\n=== ce qui a été inventé est DIT ===');
    const inventee = await surFeuilleVide('Trace la parallèle à (d) passant par A', false);
    ck('la droite (d) est annoncée',
       /droite \(d\) n'existait pas/.test(inventee.astuce), inventee.astuce || '(rien)');
    ck('  et le point A aussi',
       /point A n'existait pas/.test(inventee.astuce), inventee.astuce || '(rien)');
    /* Et l'on ne dit rien quand il n'y a rien à dire : une remarque qui paraît
       à tort est une remarque qu'on cessera de lire. */
    const dejaLa = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        if (a.cslOublier) a.cslOublier();
        a.executerConsigneAvec('Trace une droite (d)', false);
        a.executerConsigneAvec('Place un point A', false);
        const r = a.executerConsigneAvec('Trace la parallèle à (d) passant par A', false);
        return (r && r.astuce) || '';
    });
    ck('  mais rien n\'est dit quand tout existait déjà', !dejaLa, dejaLa || 'silence');

    console.log('\n=== la droite inventée est une vraie droite, et A n\'est pas dessus ===');
    ck('elle porte bien le nom demandé', inventee.nomDroite === 'd', String(inventee.nomDroite));
    ck('  A est à l\'écart de (d) — sinon la parallèle serait (d) elle-même',
       inventee.ecart !== null && inventee.ecart > 40,
       inventee.ecart === null ? 'introuvable' : Math.round(inventee.ecart) + ' px');
    ck('  et la parallèle est ACCROCHÉE à la droite, pas à une copie',
       inventee.accrochee, inventee.accrochee ? 'même objet' : 'référence détachée');

    console.log('\n=== l\'énoncé rédigé ensuite redonne la figure ===');
    const prog = inventee.programme;
    ck('trois lignes, qui se suffisent', prog.length === 3, prog.join(' | '));
    ck('  la droite est tracée en premier',
       /Trace une droite \(d\)/.test(prog[0] || ''), prog[0] || '(rien)');
    ck('  puis le point',
       /point A/.test(prog[1] || ''), prog[1] || '(rien)');
    ck('  puis la parallèle, qui dit à quoi',
       /parall[èe]le à la droite \(d\) passant par A/.test(prog[2] || ''), prog[2] || '(rien)');

    console.log('\n=== le filtre des mots courts fait toujours son travail ===');
    const filtre = await page.evaluate(() => {
        const a = window.app;
        const lire = (t) => a.cslNomsDeDroite(t);
        return {
            duMilieu: lire('Trace la droite du milieu'),
            deAB: lire('Trace la droite de [AB]'),
            parenthese: lire('la parallèle à (d) passant par A'),
            parenthesePrime: lire('la parallèle à (d\') passant par A'),
            deuxNoms: lire('Trace les droites d et d\''),
            /* Vérifié contre la version d'avant : la SEULE réponse qui change
               est celle de « (d) ». Tout le reste est mot pour mot identique —
               une modification de lecteur de phrases doit se prouver étroite,
               sinon elle déplace des choses qu'on ne regardait pas. */
            sansParenthese: lire('Trace la droite d'),
            majuscules: lire('Trace la parallèle à (AB) passant par C'),
        };
    });
    ck('« la droite du milieu » ne fabrique pas une droite « du »',
       !filtre.duMilieu.includes('du'), JSON.stringify(filtre.duMilieu));
    ck('  « la droite de [AB] » non plus',
       !filtre.deAB.includes('de'), JSON.stringify(filtre.deAB));
    ck('mais « (d) » donne bien d', filtre.parenthese.includes('d'),
       JSON.stringify(filtre.parenthese));
    ck('  et « (d\') » donne d\'', filtre.parenthesePrime.includes("d'"),
       JSON.stringify(filtre.parenthesePrime));
    ck('  « les droites d et d\' » en donne toujours deux',
       filtre.deuxNoms.length === 2, JSON.stringify(filtre.deuxNoms));
    ck('  et « la droite d », sans parenthèses, reste écartée comme avant',
       filtre.sansParenthese.length === 0, JSON.stringify(filtre.sansParenthese));
    ck('  et « (AB) » n\'est pas un nom de droite — ce sont deux points',
       filtre.majuscules.length === 0, JSON.stringify(filtre.majuscules));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
