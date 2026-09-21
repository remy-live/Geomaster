/* LE LOGICIEL NE DIT PAS QU'IL A FAIT CE QU'IL N'A PAS FAIT.
 *
 * « Tu penses qu'on oublie des choses essentielles ? »
 *
 * C'est la faute la plus grave que ce logiciel puisse commettre, et la seule que
 * l'élève ne voit pas : répondre « oui » et dessiner autre chose. Le professeur
 * s'en aperçoit, trois minutes trop tard. IDEES.md la met en tête de liste depuis
 * le début — et elle y est restée, parce qu'AUCUNE SONDE NE LA TENAIT. Tout ce
 * qui a été corrigé cette semaine l'a été parce qu'une sonde le mesurait ; cette
 * classe-là n'avait pas de garde-fou, et c'est pour cela qu'elle a survécu.
 *
 * MESURÉ AVANT, sur un triangle ABC déjà tracé :
 *
 *   « Trace deux triangles semblables »          → « Triangle DEF », UN triangle
 *   « Trace un angle égal à l'angle ABC »        → « Angle ABC marqué », rien
 *   « Trace les carrés de Pythagore… »           → « Carré ABCD », UN carré
 *   « Trace un losange à partir de deux cercles » → « Losange DEFG », ZÉRO cercle
 *   « Trace la symétrie axiale d'un carré »      → « Carré DEFG », ni axe ni image
 *   « Trace une droite graduée »                 → « Droite (d) », sans graduation
 *
 * LA RÈGLE QUE TIENT CETTE SONDE tient en une phrase : quand le logiciel répond
 * OUI, ce que la consigne promet littéralement doit être sur la feuille. Un
 * nombre écrit — « deux cercles » — se compte. Un genre nommé — « cercle »,
 * « symétrie », « graduée » — se cherche. On ne juge rien d'autre : ni le beau,
 * ni le juste, seulement le promis.
 *
 * ET LE REFUS EST UNE RÉPONSE ACCEPTABLE. Une phrase refusée ne ment pas ; elle
 * dit ce qu'elle ne sait pas faire, et ce qu'on peut écrire à la place. Le jour
 * où l'une de ces constructions existe, la ligne change de camp toute seule : la
 * sonde vérifie alors la figure au lieu du refus, sans qu'on ait rien à retoucher
 * ici. C'est le point : la liste ne peut plus vieillir en silence.
 *
 * ELLE PASSE AUSSI SUR TOUT LE CATALOGUE — 205 phrases engendrées, celles qui
 * MARCHENT — parce qu'une promesse peut se casser là aussi. C'est ce balayage qui
 * a trouvé, sur feuille vide, « Place le centre du cercle circonscrit O au
 * triangle ABC » répondre « C — centre du cercle circonscrit de OAB » : les noms
 * sont relevés dans l'ordre où ils apparaissent, O venait en tête, le triangle
 * inventé devenait OAB et la lettre qui restait allait au centre.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.resolve(RACINE, 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Les phrases du catalogue : la première colonne de chaque ligne de tableau. */
const corpus = () => fs.readFileSync(path.join(RACINE, 'CONSIGNES.md'), 'utf8')
    .split('\n')
    .filter(l => /^\|/.test(l) && !/^\|\s*-+/.test(l) && !/Ce qu'on écrit/.test(l))
    .map(l => (l.split('|')[1] || '').trim())
    .filter(Boolean);

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

    /* LA RÈGLE, une fois pour toutes. Elle vit dans la page parce qu'elle doit
       lire la figure ; elle ne juge que des promesses LITTÉRALES. */
    const juger = (phrases, prep) => page.evaluate(([phrases, prep]) => {
        const a = window.app;
        const compter = {
            cercle: () => a.entities.filter(e => e instanceof Circle).length,
            triangle: () => a.entities.filter(e => e instanceof Polygon
                && (e.points || e.vertices || []).length === 3).length,
            carre: () => a.entities.filter(e => e instanceof Polygon
                && (e.points || e.vertices || []).length === 4).length,
            droite: () => a.entities.filter(e => e instanceof Line
                || e instanceof ParallelLine || e instanceof PerpendicularLine).length,
            segment: () => a.entities.filter(e => e instanceof Segment).length,
            point: () => a.entities.filter(e => e instanceof Point && e.visible !== false).length,
        };
        const genreDe = (mot) => /cercle/.test(mot) ? 'cercle'
            : /triangle/.test(mot) ? 'triangle'
            : /carr/.test(mot) ? 'carre'
            : /droite/.test(mot) ? 'droite'
            : /segment/.test(mot) ? 'segment'
            : /point/.test(mot) ? 'point' : null;
        const NOMBRES = { deux: 2, trois: 3, quatre: 4 };
        return phrases.map((p) => {
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            (prep || []).forEach(x => { try { a.executerConsigneAvec(x, false); } catch (e) { void e; } });
            const avant = {};
            Object.keys(compter).forEach(k => { avant[k] = compter[k](); });
            const nAvant = a.entities.length;
            let r;
            try { r = a.executerConsigneAvec(p, false); }
            catch (e) { return { p, boum: e.message }; }
            const ok = !!(r && r.ok);
            const msg = (r && r.message) || '';
            if (!ok) return { p, ok: false, msg };          // un refus ne ment pas
            const t = p.toLowerCase();
            const manque = [];
            /* UNE PROMESSE DE NOMBRE SE COMPTE, et l'on ne compte que ce que la
               consigne vient d'ajouter : la préparation ne doit pas payer pour
               elle. */
            Object.keys(NOMBRES).forEach((mot) => {
                const m = t.match(new RegExp('\\b' + mot + '\\s+([a-zéèêç-]+)'));
                if (!m) return;
                const g = genreDe(m[1]);
                if (!g) return;
                const gagne = compter[g]() - avant[g];
                if (gagne < NOMBRES[mot]) manque.push(`« ${mot} ${m[1]} » → ${gagne}`);
            });
            /* UNE PROMESSE DE GENRE SE CHERCHE. « à partir de deux cercles » ne
               demande pas d'en tracer un de plus si la figure en a déjà, mais une
               phrase qui dit « cercle » sur une feuille sans cercle en veut un. */
            if (/\bcercles?\b/.test(t) && !/centre|circonscrit|inscrit|sur le cercle/.test(t)
                && compter.cercle() === 0
                && !a.entities.some(e => e instanceof Arc || e instanceof CompassArc)) {
                manque.push('« cercle » → aucun');
            }
            if (/sym[ée]trie|sym[ée]trique/.test(t) && a.entities.length <= nAvant) {
                manque.push('« symétrie » → rien de plus');
            }
            if (/\bgradu[ée]e?s?\b/.test(t)
                && !a.entities.some(e => e.graduations || e.repere
                    || e instanceof TextLabel || e instanceof Annotation)) {
                manque.push('« graduée » → aucune graduation');
            }
            return { p, ok: true, msg, manque };
        });
    }, [phrases, prep || null]);

    /* ============================================================
       1. LES PHRASES QUI MENTAIENT
       ============================================================ */
    console.log('\n=== les phrases qui répondaient « oui » en faisant autre chose ===');
    const MENTEUSES = [
        'Trace deux triangles semblables',
        "Trace un angle égal à l'angle ABC",
        'Trace les carrés de Pythagore sur le triangle ABC',
        'Trace un losange à partir de deux cercles',
        "Trace la symétrie axiale d'un carré",
        'Trace une droite graduée',
    ];
    for (const r of await juger(MENTEUSES, ['Trace un triangle ABC'])) {
        if (r.boum) { ck(r.p, false, 'BOUM ' + r.boum); continue; }
        /* Deux issues acceptables, une seule inacceptable : faire ET dire.
           Refuser est une réponse ; mentir n'en est pas une. */
        const tenue = !r.ok || !r.manque.length;
        ck('« ' + r.p + ' »', tenue,
           r.ok ? (r.manque.length ? 'DIT OUI et ' + r.manque.join(', ')
                                   : 'faite, et la figure le confirme')
                : 'refusée : ' + r.msg.slice(0, 70));
        /* Un refus doit ENSEIGNER : dire ce qu'on peut écrire à la place. Sans
           cela, on a seulement remplacé un mensonge par une porte close. */
        if (!r.ok) {
            ck('    et le refus dit quoi écrire à la place',
               /écrivez|en attendant|plutôt/i.test(r.msg), r.msg.slice(0, 80));
        }
    }

    /* ============================================================
       2. LE MÊME JUGEMENT SUR TOUT LE CATALOGUE
       ============================================================ */
    console.log('\n=== la même règle sur les 205 phrases du catalogue ===');
    const phrases = corpus();
    ck('le catalogue est lisible', phrases.length > 150, phrases.length + ' phrases');
    const verdicts = await juger(phrases, null);
    const menteuses = verdicts.filter(r => r.ok && r.manque && r.manque.length);
    const boums = verdicts.filter(r => r.boum);
    ck('aucune ne lève d\'exception', boums.length === 0,
       boums.slice(0, 2).map(r => r.p + ' : ' + r.boum).join(' | ') || 'aucune');
    ck('aucune ne promet ce qu\'elle ne fait pas',
       menteuses.length === 0,
       menteuses.slice(0, 3).map(r => `« ${r.p} » ${r.manque.join(', ')}`).join(' | ') || 'aucune');

    /* ============================================================
       3. LE TRIANGLE EST CELUI QUE LA PHRASE NOMME
       C'est le balayage ci-dessus qui l'a trouvé : sur feuille vide, les noms
       sont relevés dans l'ordre d'apparition, et le centre passait devant les
       sommets.
       ============================================================ */
    console.log('\n=== et les noms sont ceux qu\'on a écrits ===');
    for (const [p, centre, sommets] of [
        ['Place le centre du cercle circonscrit O au triangle ABC', 'O', 'ABC'],
        ['Place le centre de gravité G du triangle KLM', 'G', 'KLM'],
        ["Place l'orthocentre H du triangle RST", 'H', 'RST'],
    ]) {
        const r = await page.evaluate((p) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            let res;
            try { res = a.executerConsigneAvec(p, false); }
            catch (e) { return { boum: e.message }; }
            return { ok: !!(res && res.ok), msg: (res && res.message) || '' };
        }, p);
        ck('« ' + p + ' » sur feuille vide',
           !r.boum && r.ok && r.msg.startsWith(centre + ' ') && r.msg.includes(sommets),
           r.boum ? 'BOUM ' + r.boum : r.msg);
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
