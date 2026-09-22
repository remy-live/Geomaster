/* LE LOGICIEL DIT LUI-MÊME CE QU'IL SAIT FAIRE — ET C'EST VRAI AUJOURD'HUI.
 *
 * « J'ai toujours besoin du fichier en md, rien n'est totalement dit dans
 *   GéoMaster ou si ? »
 *
 * Non, et c'était pire qu'incomplet. Mesuré : l'application montrait 89 phrases
 * d'exemple sur les 218 qu'elle comprend — 40 % — et ces 89 étaient ÉCRITES À LA
 * MAIN dans le HTML. Elles pouvaient donc dériver exactement comme IDEES.md, qui
 * annonçait « à faire » une fonctionnalité déjà faite, et comme tests/README.md,
 * à qui il manquait 46 sondes sur 122. Trois listes tenues à la main, trois qui
 * périment : la même faute, la troisième fois.
 *
 * D'OÙ CE TABLEAU, ENGENDRÉ. tests/catalogue.js exécute réellement chaque phrase
 * dans un navigateur et recopie la réponse ; il écrit DU MÊME PASSAGE
 * CONSIGNES.md — pour qui lit le dépôt — et window.GM_CATALOGUE — pour le
 * logiciel. Une mesure, deux copies, aucune liste à tenir d'accord.
 *
 * MAIS UN TABLEAU ENGENDRÉ N'EST HONNÊTE QUE S'IL EST RÉENGENDRÉ. Écrit une fois
 * et oublié, il devient exactement ce qu'on voulait fuir : une quatrième liste à
 * la main, et la pire, puisqu'elle a l'air d'être vraie. Cette sonde est donc ce
 * qui rend le procédé fiable, et elle ne se contente pas de comparer deux
 * fichiers — elle REJOUE les 218 phrases dans un navigateur et confronte chaque
 * réponse à ce que le tableau prétend. Si une correction change une réponse sans
 * qu'on régénère, elle le dit, en nommant la phrase.
 *
 * Elle rejoue avec la MÊME préparation que le catalogue — les mêmes points sur la
 * feuille, les mêmes consignes préalables —, sans quoi elle comparerait des
 * réponses obtenues sur une autre figure. C'est pour cela que catalogue.js expose
 * ses GROUPES : deux copies de la liste des phrases auraient divergé au premier
 * ajout, et l'on aurait rendu vert un désaccord.
 *
 * Le tableau n'est encore lu par personne dans l'interface — l'aide et la
 * recherche viendront s'y brancher plus tard. Il est tenu à jour dès maintenant :
 * une vérité qu'on laisse pourrir en attendant de s'en servir n'est plus une
 * vérité le jour où l'on s'en sert.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { GROUPES, FEUILLE } = require('./catalogue.js');

const RACINE = path.resolve(__dirname, '..');
const PAGE = 'file://' + path.resolve(RACINE, 'index.html');

let fail = 0;
const ck = (nom, ok, detail) => {
    console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${nom}${detail ? ' — ' + detail : ''}`);
    if (!ok) fail++;
};

/* Les phrases de CONSIGNES.md, pour vérifier que les deux sorties du même
   passage sont bien restées d'accord. */
const duMd = () => {
    const md = fs.readFileSync(path.join(RACINE, 'CONSIGNES.md'), 'utf8');
    return md.split('\n')
        .filter(l => /^\|/.test(l) && !/^\|\s*-+/.test(l) && !/Ce qu'on écrit/.test(l))
        .map(l => (l.split('|')[1] || '').trim())
        .filter(Boolean);
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

    console.log('\n=== le tableau est là, et il est complet ===');
    const tab = await page.evaluate(() => {
        const c = window.GM_CATALOGUE;
        if (!Array.isArray(c)) return null;
        return { n: c.length, groupes: [...new Set(c.map(x => x[0]))],
                 malformees: c.filter(x => !Array.isArray(x) || x.length !== 3
                     || !x[1] || typeof x[2] !== 'string').length,
                 paires: c.map(x => [x[1], x[2]]) };
    });
    ck('window.GM_CATALOGUE existe', !!tab);
    if (!tab) { await nav.close(); console.log('\n=== 1 échec ==='); process.exit(1); }
    ck('  il porte les 218 phrases du catalogue', tab.n >= 200, tab.n + ' phrases');
    ck('  rangées par groupe', tab.groupes.length >= 15, tab.groupes.length + ' groupes');
    ck('  et aucune ligne n\'est bancale', tab.malformees === 0, String(tab.malformees));

    /* DEUX SORTIES DU MÊME PASSAGE : elles ne peuvent différer que si l'une des
       deux a été retouchée à la main, ce qui est précisément l'accident. */
    console.log('\n=== il dit la même chose que CONSIGNES.md ===');
    const md = duMd();
    ck('autant de phrases des deux côtés', md.length === tab.n,
       `${md.length} dans le .md, ${tab.n} dans la page`);
    const ecarts = md.filter((p, i) => tab.paires[i] && tab.paires[i][0] !== p).slice(0, 3);
    ck('  et ce sont les mêmes, dans le même ordre', ecarts.length === 0,
       ecarts.join(' | ') || 'aucun écart');

    /* LE CŒUR DE LA SONDE. Comparer deux fichiers ne prouve rien d'autre que
       leur ressemblance ; ce qu'on veut savoir, c'est si le tableau dit encore
       la vérité SUR LE LOGICIEL D'AUJOURD'HUI. On rejoue donc tout. */
    console.log('\n=== et surtout : ce qu\'il annonce est ce qui se passe ===');
    const plat = [];
    GROUPES.forEach(([titre, phrases]) => {
        phrases.forEach((entree) => {
            const ph = Array.isArray(entree) ? entree[0] : entree;
            const opt = (Array.isArray(entree) ? entree[1] : null) || {};
            plat.push({ groupe: titre, p: ph, pts: opt.pts || null, prep: opt.prep || null });
        });
    });
    ck('la sonde rejoue exactement les phrases du catalogue', plat.length === tab.n,
       `${plat.length} à rejouer, ${tab.n} annoncées`);

    const rejoue = await page.evaluate(([plat, feuille]) => {
        const a = window.app;
        return plat.map((x) => {
            a.entities = []; a.historyPast = []; a._consignes = []; a._cslSujet = null;
            if (a.cslOublier) a.cslOublier();
            (x.pts || feuille).forEach(p => a.addEntity(new Point(p[0], p[1], p[2])));
            (x.prep || []).forEach((q) => {
                try { a.executerConsigneAvec(q, false); } catch (e) { void e; }
            });
            let r;
            try { r = a.executerConsigneAvec(x.p, false); }
            catch (e) { return 'EXCEPTION — ' + e.message; }
            return String((r && r.message) || '');
        });
    }, [plat, FEUILLE]);

    const desaccords = [];
    plat.forEach((x, i) => {
        const annonce = tab.paires[i] ? tab.paires[i][1] : '(absente)';
        if (rejoue[i] !== annonce) {
            desaccords.push(`« ${x.p} » annonce « ${annonce} », répond « ${rejoue[i]} »`);
        }
    });
    ck('les 218 réponses sont celles que le tableau annonce',
       desaccords.length === 0,
       desaccords.length
           ? `${desaccords.length} désaccord(s) — relancez « node tests/catalogue.js » : `
             + desaccords.slice(0, 2).join(' ; ')
           : 'aucun désaccord');

    /* LE POIDS, puisque c'est la question qu'on pose toujours d'un fichier
       unique : il doit rester une paille dans un fichier qui embarque déjà
       pdf.js et une police. */
    console.log('\n=== et il ne pèse rien ===');
    const octets = fs.statSync(path.join(RACINE, 'index.html')).size;
    const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
    const i = html.indexOf('/* GM_CATALOGUE:DÉBUT');
    const j = html.indexOf('/* GM_CATALOGUE:FIN */');
    const poids = (i >= 0 && j >= 0) ? Buffer.byteLength(html.slice(i, j), 'utf8') : -1;
    ck('les deux bornes sont en place', i >= 0 && j > i,
       i >= 0 ? 'oui' : 'absentes — catalogue.js ne saurait plus où écrire');
    ck('  et le tableau pèse moins de 1 % du fichier',
       poids > 0 && poids / octets < 0.01,
       `${Math.round(poids / 102.4) / 10} ko sur ${Math.round(octets / 104857.6) / 10} Mo `
       + `(${Math.round(poids / octets * 10000) / 100} %)`);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
