/* UNE PARALLÈLE DOIT SAVOIR À QUOI ELLE EST PARALLÈLE — ET S'EN SOUVENIR.
 *
 * « Cannot read properties of null (reading 'x') — en traçant la parallèle puis
 *   après en voulant une construction magique. »
 *
 * Le fichier de secours envoyé avec le message portait la réponse, à une ligne
 * près :
 *
 *     {"type":"ParallelLine","id":"33vhtb38p","color":"#000000","p1Id":"r516ybkx6"}
 *
 * PAS DE `refLineId`. La parallèle savait par où elle passe, elle ne savait plus
 * à QUOI elle est parallèle.
 *
 * POURQUOI. Une parallèle se construit avec une droite de référence, et on lui
 * passait `{p1: a, p2: b}` — un objet fabriqué pour l'occasion, qui n'appartient
 * pas à la figure et n'a donc pas d'identité. Or l'enregistrement ne sait écrire
 * que des RENVOIS : « ma référence est l'objet n° 7 ». Il n'avait rien à écrire,
 * `refLineId` valait `undefined`, et le champ disparaissait du fichier.
 *
 * TROIS CONSÉQUENCES, DE LA PLUS DISCRÈTE À LA PLUS BRUTALE.
 *   · La parallèle ne suivait pas sa droite : elle copiait deux points, elle ne
 *     s'accrochait pas à l'objet.
 *   · Rouverte, elle n'avait plus de référence du tout.
 *   · Et l'enregistrement SUIVANT plantait : mesuré sur le fichier envoyé, la
 *     version d'avant lève « Cannot read properties of undefined (reading 'id') »
 *     dès qu'on redemande le code compact — c'est-à-dire à la sauvegarde
 *     automatique, donc sans rien faire de particulier.
 *
 * LA SONDE TIENT LES TROIS ÉTAGES.
 *   1. La référence est une VRAIE entité dès qu'il en existe une — la droite (d)
 *      nommée, ou la droite (AB) si elle est tracée.
 *   2. La parallèle survit aux DEUX formats d'enregistrement, .json et lien
 *      compact, dans les quatre façons de la demander — et son second point se
 *      recalcule après relecture, ce qui est la seule preuve qu'elle est encore
 *      reliée à quelque chose.
 *   3. Le vrai fichier de secours se relit sans planter, et tout ce qu'on peut
 *      lui demander ensuite marche : rendu, rejeu, cadrage, code compact,
 *      enregistrement, énoncé.
 *
 * Et un garde-fou pour les fichiers d'hier, qu'on ne peut pas réécrire : une
 * référence perdue rend deux points nuls au lieu de lever. Un trait orphelin ne
 * doit pas emporter la figure entière.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Les quatre façons de demander une parallèle ou une perpendiculaire. */
const CAS = [
    ['à une droite nommée (d)',
     ['Trace une droite (d)', 'Place un point A', 'Trace la parallèle à (d) passant par A'], true],
    ['à (AB), la droite n\'étant pas tracée',
     ['Place les points A, B et C', 'Trace la parallèle à (AB) passant par C'], false],
    ['à (AB), la droite étant tracée',
     ['Place les points A, B et C', 'Trace la droite (AB)', 'Trace la parallèle à (AB) passant par C'], true],
    ['perpendiculaire à (AB)',
     ['Place les points A, B et C', 'Trace la perpendiculaire à (AB) passant par C'], false],
];

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

    const essai = (phrases) => page.evaluate((phrases) => {
        const a = window.app;
        const laDroite = () => a.entities.find(e => e instanceof ParallelLine
            || e instanceof PerpendicularLine);
        const bout = (d) => {
            if (!d) return null;
            try { const q = d.getDynamicP2(); return q ? { x: Math.round(q.x), y: Math.round(q.y) } : null; }
            catch (e) { return { erreur: e.message }; }
        };
        a.entities = []; a.historyPast = [];
        phrases.forEach(p => a.executerConsigneAvec(p, true));
        const d0 = laDroite();
        const vraie = !!(d0 && d0.refLine && d0.refLine.id && a.entities.includes(d0.refLine));
        const q0 = bout(d0);

        /* .json */
        const json = a.serialize();
        a.entities = a.deserialize(json);
        const dJ = laDroite();
        const qJ = bout(dJ);
        let rJ = 'ok'; try { a.render(); } catch (e) { rJ = 'CRASH ' + e.message; }

        /* lien compact */
        a.entities = []; a.historyPast = [];
        phrases.forEach(p => a.executerConsigneAvec(p, true));
        const code = a.getCompressedString();
        a.entities = [];
        a.loadFromCompressedString(code);
        const dC = laDroite();
        const qC = bout(dC);
        let rC = 'ok'; try { a.render(); } catch (e) { rC = 'CRASH ' + e.message; }
        /* Et l'on redemande le code : c'est CE geste-là qui plantait. */
        let encore = 'ok';
        try { a.getCompressedString(); } catch (e) { encore = 'CRASH ' + e.message; }
        return { vraie, q0, json: !!dJ, qJ, rJ, compact: !!dC, qC, rC, encore };
    }, phrases);

    console.log('\n=== la référence est une vraie entité de la figure ===');
    for (const [nom, phrases, attendu] of CAS) {
        const r = await essai(phrases);
        if (attendu) {
            ck(nom, r.vraie, r.vraie ? 'accrochée à la droite elle-même'
                                     : 'RÉFÉRENCE SANS IDENTITÉ');
        } else {
            /* Quand la droite n'est pas tracée, il n'y a rien à quoi
               s'accrocher — et on ne la trace pas, car « la parallèle à (AB) »
               ne demande pas de tracer (AB). Le filet doit alors suffire. */
            ck(nom + ' : pas de droite à quoi s\'accrocher, c\'est normal',
               !r.vraie, 'deux points, pas d\'entité');
        }
    }

    console.log('\n=== elle survit au fichier .json ===');
    for (const [nom, phrases] of CAS) {
        const r = await essai(phrases);
        ck(nom, r.json && r.qJ && !r.qJ.erreur,
           r.json ? ('second point ' + (r.qJ ? (r.qJ.erreur || `(${r.qJ.x}, ${r.qJ.y})`) : 'INTROUVABLE'))
                  : 'LA PARALLÈLE A DISPARU');
        ck('  et le rendu qui suit ne plante pas', r.rJ === 'ok', r.rJ);
    }

    console.log('\n=== et au lien compact ===');
    for (const [nom, phrases] of CAS) {
        const r = await essai(phrases);
        ck(nom, r.compact && r.qC && !r.qC.erreur,
           r.compact ? ('second point ' + (r.qC ? (r.qC.erreur || `(${r.qC.x}, ${r.qC.y})`) : 'INTROUVABLE'))
                     : 'LA PARALLÈLE A DISPARU');
        ck('  et redemander le code ne plante plus — c\'est ce que fait la sauvegarde automatique',
           r.encore === 'ok', r.encore);
    }

    console.log('\n=== le fichier de secours envoyé se relit, et tout marche ensuite ===');
    const fichier = path.resolve(__dirname, 'fixtures', 'secours-parallele.json');
    if (!fs.existsSync(fichier)) {
        ck('le fichier témoin est là', false, fichier + ' manquant');
    } else {
        const secours = JSON.parse(fs.readFileSync(fichier, 'utf8'));
        const r = await page.evaluate((data) => {
            const a = window.app;
            const j = {};
            try { a.entities = a.deserialize(data); j.objets = a.entities.length; }
            catch (e) { return { relecture: 'CRASH ' + e.message }; }
            const tente = (nom, fn) => { try { fn(); j[nom] = 'ok'; } catch (e) { j[nom] = 'CRASH ' + e.message; } };
            tente('rendu', () => a.render());
            tente('cadrage', () => a.getSceneBounds(true));
            tente('code', () => a.getCompressedString());
            tente('enregistrement', () => a.serialize());
            tente('enonce', () => a.programmeDeConstruction(false));
            tente('rejeu', () => a.playFromStart());
            const par = a.entities.find(e => e instanceof ParallelLine);
            j.parallele = !!par;
            return j;
        }, secours.data);
        ck('il se relit', !r.relecture, r.relecture || r.objets + ' objets');
        ['rendu', 'cadrage', 'code', 'enregistrement', 'enonce', 'rejeu'].forEach(k => {
            ck('  ' + k, r[k] === 'ok', r[k]);
        });
    }

    console.log('\n=== un trait orphelin n\'emporte pas la figure ===');
    const orphelin = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.executerConsigneAvec('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', false);
        const A = a.entities.find(e => e.label === 'A');
        const perdue = new ParallelLine(A, null);
        a.addEntity(perdue);
        const j = {};
        const tente = (nom, fn) => { try { fn(); j[nom] = 'ok'; } catch (e) { j[nom] = 'CRASH ' + e.message; } };
        tente('coordonnees', () => MathUtils.getLineCoords(null));
        tente('secondPoint', () => perdue.getDynamicP2());
        tente('rendu', () => a.render());
        tente('enregistrement', () => a.serialize());
        j.triangle = a.entities.filter(e => e instanceof Segment).length;
        return j;
    });
    ck('une référence nulle ne lève pas', orphelin.coordonnees === 'ok', orphelin.coordonnees);
    ck('  son second point vaut « rien », pas une erreur', orphelin.secondPoint === 'ok', orphelin.secondPoint);
    ck('  la figure se dessine quand même', orphelin.rendu === 'ok', orphelin.rendu);
    ck('  et s\'enregistre', orphelin.enregistrement === 'ok', orphelin.enregistrement);
    ck('  le triangle est toujours là', orphelin.triangle === 3, orphelin.triangle + ' côtés');

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
