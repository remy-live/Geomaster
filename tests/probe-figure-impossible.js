/* UN CARRÉ QUI N'EN EST PAS UN, ANNONCÉ « ✓ CARRÉ ».
 *
 * « Regarde ce qu'il a fait. D'ailleurs si ce n'est pas possible, il faut
 *   expliquer pourquoi (avec une modale). »
 *
 * Sur une feuille portant déjà un carré ABCD et un cercle de centre E,
 * « trace un carré BCDE » répondait « ✓ Carré BCDE » et reliait les quatre
 * points tels qu'ils étaient. Mesuré : côtés 8, 8, 12,6 et 20,4 cm ; angles 11°,
 * 90°, 72° et 30°. C'est la faute la plus grave que ce logiciel puisse commettre
 * — dire qu'il a fait ce qu'il n'a pas fait — et elle avait ici sa propre porte
 * d'entrée, que probe-dit-vrai ne pouvait pas voir : cette sonde-là vérifie
 * qu'un carré EXISTE, pas qu'il est carré.
 *
 * LA CAUSE TENAIT EN DEUX LIGNES. La forme idéale était calculée, puis JETÉE
 * pour tout sommet déjà nommé sur la feuille :
 *
 *     const deja = this.cslPointNomme(noms[i]);
 *     if (deja) return deja;              // le nom, et rien de la forme
 *
 * Ce n'était donc pas l'affaire d'une phrase bizarre : TOUTE figure nommant un
 * point déjà posé sortait fausse. « Trace un carré ABCD » avec A et B sur la
 * feuille rendait 8, 6,9, 3 et 6,5 cm ; le pentagone ABCDE, 8, 7,2, 3, 3 et
 * 8 cm. Le cas juste était le cas sans aucun point.
 *
 * DEUX POINTS NE CONTREDISENT JAMAIS UN CARRÉ : ils en fixent le côté, et la
 * figure se construit dessus — c'est le cas courant, « je pose A et B, trace le
 * carré ABCD ». À partir du troisième la figure est surdéterminée : ou bien les
 * points s'y prêtent, ou bien AUCUN carré n'a ces sommets-là. La forme est donc
 * posée sur les sommets déjà là par similitude, dans les deux retournements, et
 * ce qui reste est comparé à ce que la figure exige. L'écart toléré est d'un
 * pixel : accepter « presque un carré » serait recommencer la même faute en
 * plus discret.
 *
 * ALORS ON REFUSE, ET L'ON DIT POURQUOI. Une version intermédiaire traçait la
 * figure à côté, sous des lettres libres, plutôt que de refuser : elle ne
 * bloquait jamais rien, et répondait à une question que personne n'avait posée —
 * on demande « un carré BCDE », on reçoit un carré GHIJ. Entre une figure juste
 * qui répond à côté et un refus qui explique, c'est le refus qui apprend quelque
 * chose. Rien n'est tracé, rien n'est effacé, rien n'est déplacé.
 *
 * LE PRIX EST RÉEL, et cette sonde le montre au lieu de le cacher : « Trace un
 * carré ABCD de 3 cm de côté » ne marche plus sur une feuille où A, B et C sont
 * déjà pris. Six entrées du catalogue ont reçu la feuille vide qu'elles
 * supposaient, et probe-patrons vérifie les deux faces — la phrase sur feuille
 * libre, le refus sur la feuille encombrée. La section 3 d'ici tient l'autre
 * bord : trois points qui FORMENT un carré ne doivent pas être refusés.
 *
 * ET LE REFUS S'EXPLIQUE EN GRAND. Le bandeau de la consigne tient une ligne —
 * assez pour « Quels sommets ? », pas pour dire qu'un carré est géométriquement
 * impossible sur CETTE feuille. Un refus qui n'enseigne rien ne vaut guère mieux
 * qu'un mensonge : la modale nomme le sommet en cause, donne les deux distances
 * — celle qu'il a, celle qu'il devrait avoir —, et dit trois façons d'avancer.
 * C'est la RÉPONSE qui la transporte (r.modale) et l'interface qui l'affiche :
 * le banc d'essai et le catalogue rejouent deux cent dix-huit phrases sans
 * qu'une fenêtre s'ouvre.
 *
 * DEUX AUTRES MENSONGES SONT TOMBÉS EN MESURANT, sur feuille vide et aux
 * instruments — donc sans rapport avec le signalement, et invisibles jusque-là :
 *
 *   losange ABCD    côtés 3 · 3 · 3 · 5,2      angles 30 · 60 · 60 · 30
 *   pentagone ABCDE côtés 3 · 3,5 · 3,5 · 3,5 · 3   angles 144 · 54 · 108 · 108 · 54
 *   hexagone ABCDEF côtés 3 · 3 · 3 · 3 · 3 · 3     angles 120 · 60 · 120 · 120 · 120 · 60
 *
 * Le losange : cslBatir distribue les lettres dans l'ordre où les points
 * naissent, et le compas fabrique D avant C — le contour lu A-B-C-D se
 * croisait. Le pentagone et l'hexagone : leurs bâtisseurs partent du CERCLE
 * CIRCONSCRIT, le segment qu'on leur donne va du centre à un sommet, et on leur
 * donnait [AB], deux sommets voisins — A devenait le centre. L'hexagone cachait
 * la faute mieux que tous, son côté valant son rayon : six longueurs égales, et
 * seuls les angles disaient que le contour se croisait.
 */
const { chromium } = require('playwright');
const path = require('path');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* La feuille de la capture : un carré ABCD, un cercle de centre E. */
const FEUILLE = { A: [400, 800], B: [400, 400], C: [800, 400], D: [800, 800],
                  E: [1400, 600], F: [1650, 600] };

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

    /* LA MESURE, une fois pour toutes : la figure que les lettres décrivent
       vraiment, côtés et angles, dans l'ordre où la phrase les a nommées. */
    const jouer = (deja, phrase, lettres, avec) => page.evaluate(
        ([deja, phrase, lettres, avec, FEUILLE]) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            deja.forEach(n => a.addEntity(new Point(FEUILLE[n][0], FEUILLE[n][1], n)));
            let r;
            try { r = a.executerConsigneAvec(phrase, avec); }
            catch (e) { return { boum: e.message }; }
            const P = lettres.split('').map(n =>
                a.entities.find(e => e instanceof Point && e.label === n));
            const base = { ok: !!(r && r.ok), msg: (r && r.message) || '',
                           modale: (r && r.modale) || '' };
            if (P.some(p => !p)) {
                return Object.assign(base, { manque: lettres.split('')
                    .filter((n, i) => !P[i]).join('') });
            }
            const cm = (v) => Math.round(v / 50 * 10) / 10;
            const cotes = P.map((q, i) => {
                const s = P[(i + 1) % P.length];
                return cm(Math.hypot(s.x - q.x, s.y - q.y));
            });
            const angles = P.map((q, i) => {
                const av = P[(i - 1 + P.length) % P.length], ap = P[(i + 1) % P.length];
                const a1 = Math.atan2(av.y - q.y, av.x - q.x);
                const a2 = Math.atan2(ap.y - q.y, ap.x - q.x);
                let d = Math.abs(a1 - a2) * 180 / Math.PI;
                if (d > 180) d = 360 - d;
                return Math.round(d);
            });
            return Object.assign(base, { cotes, angles,
                egaux: cotes.every(x => Math.abs(x - cotes[0]) < 0.05) });
        }, [deja, phrase, lettres, avec, FEUILLE]);

    /* ============================================================
       1. LA FIGURE DU SIGNALEMENT
       ============================================================ */
    console.log('\n=== « trace un carré BCDE » quand B, C, D et E sont déjà là ===');
    for (const avec of [false, true]) {
        const comment = avec ? 'aux instruments' : 'sans instruments';
        const r = await page.evaluate(([avec, FEUILLE]) => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            Object.keys(FEUILLE).forEach(n =>
                a.addEntity(new Point(FEUILLE[n][0], FEUILLE[n][1], n)));
            const avant = a.entities.filter(e => e instanceof Point)
                .map(p => ({ l: p.label, x: p.x, y: p.y }));
            const nAvant = a.entities.length;
            let res;
            try { res = a.executerConsigneAvec('trace un carré BCDE', avec); }
            catch (e) { return { boum: e.message }; }
            /* RIEN N'A ÉTÉ TRACÉ, ET RIEN N'A BOUGÉ D'UN PIXEL. Un refus qui
               laisse des traits derrière lui est pire qu'un refus : il ment de
               la main gauche. */
            const bouges = avant.filter((q) => {
                const p = a.entities.find(e => e instanceof Point && e.label === q.l);
                return !p || Math.hypot(p.x - q.x, p.y - q.y) > 0.001;
            }).map(q => q.l);
            return { ok: !!(res && res.ok), msg: (res && res.message) || '',
                     modale: (res && res.modale) || '',
                     pose: a.entities.length - nAvant, bouges };
        }, [avec, FEUILLE]);

        ck(`${comment} : la consigne est refusée`, !r.boum && r.ok === false,
           r.boum ? 'BOUM ' + r.boum : r.msg.slice(0, 90));
        ck('  le refus nomme le sommet qui gêne', /\bE\b/.test(r.msg || ''));
        ck('  et il chiffre l\'écart', /\d+(,\d)? cm/.test(r.msg || ''),
           ((r.msg || '').match(/\d+(,\d)? cm/g) || []).join(' · '));
        ck('  rien n\'a été ajouté à la feuille', r.pose === 0, r.pose + ' objets');
        ck('  et aucun point n\'a bougé', (r.bouges || []).length === 0,
           (r.bouges || []).join(', ') || 'aucun');
        /* UN REFUS QUI N'ENSEIGNE RIEN NE VAUT GUÈRE MIEUX QU'UN MENSONGE : la
           modale doit nommer le sommet, donner les deux distances — celle qu'il
           a, celle qu'il devrait avoir — et dire quoi écrire à la place. */
        ck('  la modale nomme le sommet qui gêne', /<b>E<\/b>/.test(r.modale || ''),
           r.modale ? Math.round(r.modale.length / 10) * 10 + ' caractères' : 'aucune');
        ck('    elle donne les distances mesurées',
           ((r.modale || '').match(/\d+(,\d)? cm/g) || []).length >= 3,
           ((r.modale || '').match(/\d+(,\d)? cm/g) || []).slice(0, 3).join(' · '));
        ck('    elle dit que rien n\'a été tracé', /Rien n'a été tracé/.test(r.modale || ''));
        ck('    et ce qu\'on peut écrire à la place', /polygone BCDE/.test(r.modale || ''));
    }

    /* ============================================================
       2. DEUX POINTS NE CONTREDISENT RIEN : LA FIGURE SE POSE DESSUS
       ============================================================ */
    console.log('\n=== avec deux sommets déjà posés, la figure se construit dessus ===');
    for (const avec of [false, true]) {
        const comment = avec ? 'aux instruments' : 'sans instruments';
        const r = await jouer(['A', 'B'], 'trace un carré ABCD', 'ABCD', avec);
        ck(`${comment} : « carré ABCD » avec A et B posés`, r.ok, r.msg);
        ck('  les quatre côtés sont égaux', !!r.egaux, (r.cotes || []).join(' · ') + ' cm');
        ck('  les quatre angles sont droits',
           (r.angles || []).every(x => Math.abs(x - 90) < 1),
           (r.angles || []).join('° · ') + '°');
        /* ET C'EST BIEN LE CÔTÉ [AB] QUI COMMANDE : sans cela on aurait un vrai
           carré posé ailleurs, ce qui serait une autre façon de se moquer. */
        ck('  et son côté est celui de [AB], 8 cm', (r.cotes || [])[0] === 8,
           String((r.cotes || [])[0]));
    }

    /* ============================================================
       3. TROIS POINTS QUI S'Y PRÊTENT : ON CONSTRUIT
       A, B et C sont trois sommets d'un carré ; la figure est possible, et
       le quatrième sommet doit tomber à sa place — y compris aux
       instruments, dont le bâtisseur part toujours du même côté de la base.
       ============================================================ */
    console.log('\n=== trois sommets qui forment bien un carré : on le termine ===');
    for (const avec of [false, true]) {
        const r = await jouer(['A', 'B', 'C'], 'trace un carré ABCD', 'ABCD', avec);
        ck(`${avec ? 'aux instruments' : 'sans instruments'} : accepté`, r.ok, r.msg);
        ck('  et D tombe du bon côté', !!r.egaux && (r.cotes || [])[0] === 8,
           (r.cotes || []).join(' · ') + ' cm');
    }

    /* ============================================================
       4. CE QUE LE NOM NE PROMET PAS RESTE PERMIS
       Un polygone ne promet aucune forme : quatre points quelconques lui
       conviennent, et le refus ne doit pas déborder sur lui.
       ============================================================ */
    console.log('\n=== un polygone, lui, relie ce qu\'on lui donne ===');
    const poly = await jouer(['A', 'B', 'C', 'D', 'E'], 'trace le polygone BCDE', 'BCDE', false);
    ck('« trace le polygone BCDE » est accepté', poly.ok, poly.msg);
    ck('  et il ne promet rien sur la forme', !poly.egaux,
       (poly.cotes || []).join(' · ') + ' cm');

    /* ============================================================
       5. LES FIGURES QUE LA MESURE A TROUVÉES EN CHEMIN
       Feuille vide, aux instruments : rien à voir avec le signalement.
       ============================================================ */
    console.log('\n=== et sur feuille vide, chaque figure est celle qu\'elle dit ===');
    const REGULIERS = [
        ['trace un carré ABCD', 'ABCD', 90],
        ['trace un losange ABCD', 'ABCD', null],
        ['trace un pentagone ABCDE', 'ABCDE', 108],
        ['trace un hexagone ABCDEF', 'ABCDEF', 120],
        ['trace un octogone ABCDEFGH', 'ABCDEFGH', 135],
    ];
    for (const avec of [false, true]) {
        for (const [phrase, lettres, attendu] of REGULIERS) {
            const r = await jouer([], phrase, lettres, avec);
            const bons = attendu === null
                ? (r.angles || []).every(x => Math.abs(x - 180) > 5)   // pas aplati
                : (r.angles || []).every(x => Math.abs(x - attendu) < 1);
            ck(`${avec ? 'aux instruments' : 'sans instruments'} : ${phrase.slice(9)}`,
               !!r.egaux && bons,
               (r.cotes || []).join(' · ') + ' cm   ' + (r.angles || []).join('° · ') + '°');
        }
    }

    /* ============================================================
       6. LA MODALE S'OUVRE POUR DE BON — ET SEULEMENT POUR CELA
       On passe par la vraie porte, la ligne de consigne, parce que c'est
       elle qui décide d'afficher. La langue, elle, reste muette : sans
       quoi le catalogue ouvrirait deux cents fenêtres.
       ============================================================ */
    console.log('\n=== la modale s\'ouvre à l\'écran, et pas pour n\'importe quoi ===');
    const ecran = await page.evaluate(([FEUILLE]) => {
        const a = window.app;
        const poser = () => {
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            Object.keys(FEUILLE).forEach(n =>
                a.addEntity(new Point(FEUILLE[n][0], FEUILLE[n][1], n)));
        };
        const modale = () => {
            const m = document.getElementById('customModal');
            return m && getComputedStyle(m).display !== 'none';
        };
        const ligne = (texte) => {
            const l = a.consignesListe();
            while (l.length) l.pop();
            a.ajouterConsigne('');
            l[0].texte = texte;
            l[0].faite = false; l[0].signature = '';
            a.validerConsigne(0);
            return { ouverte: modale(),
                     texte: (document.getElementById('modalMessage') || {}).innerText || '' };
        };
        const fermer = () => { if (a.closeModal) a.closeModal(); };

        poser(); const impossible = ligne('trace un carré BCDE'); fermer();
        /* Une consigne ORDINAIRE ne doit rien ouvrir, réussie ou non : une
           fenêtre qu'on voit partout est une fenêtre qu'on ferme sans lire. */
        poser(); const ordinaire = ligne('trace un bidule truc'); fermer();
        poser(); const banale = ligne('Trace la médiatrice de [AB]'); fermer();
        /* Et la langue seule reste muette. */
        poser();
        try { a.executerConsigneAvec('trace un carré BCDE', false); } catch (e) { void e; }
        const parLaLangue = modale();
        fermer();
        return { impossible, ordinaire, banale, parLaLangue };
    }, [FEUILLE]);
    ck('la consigne impossible ouvre la modale', ecran.impossible.ouverte);
    ck('  et le titre nomme la figure qu\'on avait demandée',
       /Carré BCDE/.test(ecran.impossible.texte),
       ecran.impossible.texte.split('\n')[0]);
    ck('un refus ordinaire n\'ouvre rien', !ecran.ordinaire.ouverte);
    ck('une consigne qui marche n\'ouvre rien non plus', !ecran.banale.ouverte);
    ck('et la langue appelée seule reste muette', !ecran.parLaLangue);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
