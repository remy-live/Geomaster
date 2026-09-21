/* LE NOM DU LOGICIEL, ET LA PORTE QU'IL Y A DERRIÈRE.
 *
 * « J'aimerais entre le Géomaster en haut à gauche et l'input du fichier un écart
 *   un peu plus grand, et quand on passe la souris sur Géomaster, on a un dégradé
 *   animé du nom ; et 7 clics dessus met en mode développeur. »
 *
 * TROIS CHOSES, DONT UNE SEULE EST NOUVELLE. L'écart se mesure : quatre pixels
 * séparaient « GÉOMASTER » du champ du titre, si bien que de loin les deux se
 * lisaient comme une seule ligne. Dix-huit les séparent — la largeur d'une lettre.
 *
 * Le dégradé du nom existait déjà, mais fixe. Au survol il devient un ruban de
 * trois longueurs qui défile derrière les lettres. Et ce n'est PAS la déclaration
 * CSS qu'il faut vérifier : une animation peut être déclarée et ne rien faire —
 * un nom de keyframes inexistant, une propriété non animable, un
 * background-size resté à 100 %. La sonde relève donc la position réelle du
 * dégradé à deux instants, et demande qu'elle ait bougé.
 *
 * LA PORTE, ELLE, EXISTAIT DÉJÀ : sept clics sur la date de version, en petit
 * dans l'aide, ouvrent le cabinet de curiosités — d'où l'on atteint le relevé des
 * usages et le banc d'essai des phrases. Ce qui est nouveau, c'est une SECONDE
 * SERRURE sur la même pièce, et là où l'on peut l'atteindre : le nom est en haut
 * à gauche de la première seconde à la dernière, la date n'existe que si l'on a
 * pensé à ouvrir l'aide. La mécanique est commune (porteDerobee) : deux
 * implémentations auraient divergé au premier réglage, et la sonde vérifie donc
 * que l'ANCIENNE porte marche encore.
 *
 * CE QUI COMPTE VRAIMENT, ET QUI N'EST PAS LE COMPTE DE SEPT.
 *
 *   · UN SECRET NE TOUCHE PAS À LA FIGURE. C'est la règle écrite en tête des
 *     choses cachées : on tombe dessus par accident, souvent en pleine
 *     préparation de cours. La sonde dessine, ouvre le cabinet, le referme, et
 *     exige que la figure soit au même objet près.
 *   · UNE SÉRIE LENTE N'OUVRE RIEN. Sans la fenêtre de deux secondes et demie,
 *     sept clics étalés sur une minute finiraient par ouvrir la porte — et l'on
 *     n'y comprendrait rien.
 *   · ET LE CURSEUR NE PROMET PAS DE LIEN. Rien ne doit annoncer qu'il y a
 *     quelque chose ; c'est le dégradé qui invite, et lui seul.
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

    /* Si le nom n'a pas d'identifiant, la sonde doit le DIRE, pas s'effondrer :
       un plan tage n'est pas un diagnostic. */
    const ouSuisJe = () => page.evaluate(() => {
        const l = document.getElementById('gmLogo');
        if (!l) return null;
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!(await ouSuisJe())) {
        ck('le nom du logiciel porte un identifiant (#gmLogo)', false, 'introuvable');
        await nav.close();
        console.log(`\n=== ${fail} échec(s) ===`);
        process.exit(1);
    }

    console.log('\n=== le nom respire ===');
    const mesure = await page.evaluate(() => {
        const l = document.getElementById('gmLogo');
        const i = document.getElementById('docTitleInput');
        if (!l || !i) return null;
        const rl = l.getBoundingClientRect(), ri = i.getBoundingClientRect();
        const cs = getComputedStyle(l);
        return { ecart: Math.round((ri.left - rl.right) * 10) / 10,
                 curseur: cs.cursor, animAuRepos: cs.animationName };
    });
    ck('le nom et le champ du titre ne se touchent plus',
       !!mesure && mesure.ecart >= 14, mesure ? mesure.ecart + ' px' : '(introuvable)');
    ck('  au repos, le nom ne s\'agite pas',
       mesure.animAuRepos === 'none', mesure.animAuRepos);
    ck('  et son curseur ne promet pas de lien',
       mesure.curseur === 'default', mesure.curseur);

    console.log('\n=== au survol, le dégradé défile POUR DE BON ===');
    {
        const p = await ouSuisJe();
        await page.mouse.move(p.x, p.y);
        await page.waitForTimeout(140);
        const decl = await page.evaluate(() => {
            const cs = getComputedStyle(document.getElementById('gmLogo'));
            return { anim: cs.animationName, fond: cs.backgroundSize };
        });
        ck('l\'animation est bien déclarée', decl.anim !== 'none', decl.anim);
        ck('  et le fond est plus large que les lettres', /300%/.test(decl.fond), decl.fond);
        const lire = () => page.evaluate(() =>
            getComputedStyle(document.getElementById('gmLogo')).backgroundPosition);
        const a = await lire();
        await page.waitForTimeout(500);
        const b = await lire();
        ck('  et la position du dégradé a vraiment bougé', a !== b, `${a} → ${b}`);
        /* On s'éloigne : le nom doit se calmer. */
        await page.mouse.move(p.x, p.y + 400);
        await page.waitForTimeout(140);
        const calme = await page.evaluate(() =>
            getComputedStyle(document.getElementById('gmLogo')).animationName);
        ck('  loin du nom, il se calme', calme === 'none', calme);
    }

    console.log('\n=== sept clics, et la pièce s\'ouvre ===');
    {
        const p = await ouSuisJe();
        const etats = [];
        for (let k = 1; k <= 7; k++) {
            await page.mouse.click(p.x, p.y);
            await page.waitForTimeout(50);
            etats.push(await page.evaluate(() => ({
                presse: document.getElementById('gmLogo').classList.contains('gm-logo-presse'),
                ouvert: !!document.querySelector('#secretVoile.ouvert') })));
        }
        ck('rien ne s\'ouvre avant le septième',
           etats.slice(0, 6).every(e => !e.ouvert),
           etats.map((e, i) => (i + 1) + (e.ouvert ? '✓' : '·')).join(''));
        ck('  le nom s\'emballe à partir du quatrième',
           !etats[2].presse && etats[3].presse,
           etats.map((e, i) => (i + 1) + (e.presse ? '!' : '·')).join(''));
        ck('  et le septième ouvre le cabinet', etats[6].ouvert === true);
        const dedans = await page.evaluate(() => {
            const b = document.getElementById('secretBoite');
            return b ? b.textContent || '' : '';
        });
        ck('  on y trouve le banc d\'essai et les usages',
           /Banc d'essai/.test(dedans) && /usages/.test(dedans),
           dedans.slice(0, 70));
        ck('  et le nom ne reste pas emballé derrière', etats[6].presse === false);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
        ck('  la pièce se referme', !(await page.evaluate(() =>
            !!document.querySelector('#secretVoile.ouvert'))));
    }

    /* SANS LA FENÊTRE DE TEMPS, sept clics étalés sur une minute ouvriraient la
       porte, et l'on n'y comprendrait rien. */
    console.log('\n=== une série lente n\'ouvre rien ===');
    {
        const p = await ouSuisJe();
        for (let k = 0; k < 7; k++) {
            await page.mouse.click(p.x, p.y);
            await page.waitForTimeout(k === 3 ? 2800 : 60);
        }
        ck('une hésitation de trois secondes remet le compte à zéro',
           !(await page.evaluate(() => !!document.querySelector('#secretVoile.ouvert'))));
        await page.waitForTimeout(2700);
    }

    /* LA RÈGLE DE LA MAISON : un secret ne touche pas à la figure. On tombe
       dessus par accident, souvent en pleine préparation de cours. */
    console.log('\n=== et il ne touche à rien ===');
    {
        const avant = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            a.executerConsigneAvec('Trace un triangle ABC', false);
            return { n: a.entities.length,
                     liste: a.entities.map(e => e.constructor.name).join(','),
                     titre: document.getElementById('docTitleInput').value };
        });
        const p = await ouSuisJe();
        for (let k = 0; k < 7; k++) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(45); }
        await page.waitForTimeout(120);
        const pendant = await page.evaluate(() => !!document.querySelector('#secretVoile.ouvert'));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
        const apres = await page.evaluate(() => ({
            n: window.app.entities.length,
            liste: window.app.entities.map(e => e.constructor.name).join(','),
            titre: document.getElementById('docTitleInput').value }));
        ck('la porte s\'ouvre même avec une figure à l\'écran', pendant === true);
        ck('  la figure est intacte, au même objet près',
           avant.n === apres.n && avant.liste === apres.liste,
           `${avant.n} → ${apres.n}`);
        ck('  et le nom du projet n\'a pas bougé',
           avant.titre === apres.titre, `${avant.titre} → ${apres.titre}`);
    }

    /* DEUX SERRURES, UNE SEULE MÉCANIQUE : l'ancienne porte doit marcher encore. */
    console.log('\n=== et l\'ancienne porte, celle de la date de version ===');
    {
        const v = await page.evaluate(() => {
            const el = document.getElementById('gmVersion');
            if (!el) return { absent: true };
            for (let k = 0; k < 7; k++) el.click();
            return { ouvert: !!document.querySelector('#secretVoile.ouvert'),
                     couleur: el.style.color };
        });
        ck('sept clics sur la date ouvrent toujours le cabinet',
           v.ouvert === true, JSON.stringify(v));
        ck('  et elle ne reste pas allumée derrière', !v.couleur, v.couleur || 'éteinte');
        await page.keyboard.press('Escape');
    }

    /* CE QU'IL FAUT SAVOIR QUAND QUELQUE CHOSE CLOCHE.
     * « Dans la backdoor, donne aussi le numéro de version et des infos de debug
     *   au besoin. »
     * « Ça ne marche pas chez moi » ne dit ni la version, ni le navigateur, ni ce
     * qu'il y avait à l'écran. Le relevé répond à ces questions-là et s'arrête. Ce
     * que la sonde tient n'est donc pas « il y a un relevé » mais ce qu'il
     * CONTIENT — et surtout ce qu'il ne contient pas : ni le titre du projet, ni
     * le nom des points. Ce sont les seules choses qui pourraient identifier une
     * classe, et elles n'aident à rien pour déboguer. */
    console.log('\n=== le relevé technique dit ce qu\'il faut, et rien de plus ===');
    {
        const d = await page.evaluate(() => {
            const a = window.app;
            a.entities = []; a.historyPast = [];
            if (a.cslOublier) a.cslOublier();
            const t = document.getElementById('docTitleInput');
            t.value = 'Devoir 4e — Mme Dupont';
            a.executerConsigneAvec('Trace un triangle KLM', false);
            a.ouvrirSecret('cabinet');
            const cab = document.getElementById('secretBoite').textContent || '';
            a.ouvrirSecret('diagnostic');
            const pre = document.querySelector('.secret-releve');
            const liens = [...document.querySelectorAll('.secret-lien')].map(x => x.textContent);
            return { cabinet: cab, releve: pre ? pre.textContent : null, liens,
                     objets: a.entities.length };
        });
        ck('le cabinet annonce la version dès l\'entrée',
           d.cabinet.includes(String(await page.evaluate(() => window.GM_VERSION))),
           d.cabinet.slice(0, 60).replace(/\s+/g, ' '));
        ck('  et il mène au relevé technique',
           /Relevé technique/.test(d.cabinet), d.liens.join(' · '));
        ck('le relevé existe', !!d.releve);
        const attendu = ['version', 'navigateur', 'écran', 'objets', 'outil courant',
                         'mémoire locale', 'erreurs JS'];
        const manque = attendu.filter(k => !new RegExp('^' + k, 'm').test(d.releve || ''));
        ck('  il porte tout ce qu\'on demande au téléphone',
           manque.length === 0, manque.length ? 'manque : ' + manque.join(', ') : attendu.join(', '));
        ck('  le compte d\'objets est le vrai',
           new RegExp('objets\\s*:\\s*' + d.objets + '\\b').test(d.releve || ''),
           d.objets + ' objets');
        /* CE QU'IL NE DOIT PAS CONTENIR. */
        ck('  il ne contient PAS le titre du projet',
           !/Dupont/.test(d.releve || ''), 'titre absent');
        ck('  ni le nom des points de la figure',
           !/\bKLM\b/.test(d.releve || ''), 'figure absente');
        ck('  et on peut le copier', /Copier le relevé/.test(d.liens.join(' ')),
           d.liens.join(' · '));

        /* LES ERREURS ATTRAPÉES Y FIGURENT. Sans elles, le relevé dirait que tout
           va bien sur une page à moitié morte — et la console d'un navigateur ne
           s'ouvre pas sur un ordinateur de salle de classe. */
        const avecErreur = await page.evaluate(() => {
            window.GM_ERREURS = ['Cannot read properties of null (ligne 42)'];
            window.app.ouvrirSecret('diagnostic');
            const pre = document.querySelector('.secret-releve');
            const t = pre ? pre.textContent : '';
            window.GM_ERREURS = [];
            return t;
        });
        ck('une erreur attrapée est reportée dans le relevé',
           /erreurs JS\s*:\s*1/.test(avecErreur) && /ligne 42/.test(avecErreur),
           (avecErreur.match(/erreurs JS.*(\n.*)?/) || [''])[0].trim());
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
    }

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
