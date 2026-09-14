/* LE BANC D'ESSAI DES PHRASES.
 *
 * « Tu peux me faire un bouton caché de debug pour que je puisse tester des
 *   phrases ? »
 *
 * POURQUOI IL MANQUAIT. Une phrase à la fois, c'est une phrase par minute : on
 * ouvre la barre, on écrit, on regarde, on efface la figure, on recommence.
 * Vingt formulations d'une même consigne prennent la demi-heure — et l'on ne
 * compare rien, puisqu'on ne les voit jamais ensemble. Or c'est exactement la
 * question qu'on se pose en écrivant un énoncé : LAQUELLE de ces tournures
 * passe ?
 *
 * CE QUI FAIT QU'ON S'EN SERVIRA, ET QUE LA SONDE VÉRIFIE.
 *
 * 1. LA FIGURE OUVERTE N'EST PAS TOUCHÉE. On tombe sur ce panneau en pleine
 *    préparation de cours ; un outil de mise au point qui abîme le travail en
 *    cours ne sera plus jamais ouvert. La sonde construit une vraie figure,
 *    relève son code compact ET son énoncé, joue cinq phrases dans le banc, et
 *    exige que les deux soient identiques au caractère près. Pas « à peu près
 *    pareil » : identiques. Les essais se jouent sur une feuille de côté — on
 *    met la vraie de côté, on travaille, on la remet, sans sérialisation :
 *    ce sont les mêmes objets qui reviennent, pas des copies.
 *
 * 2. UNE LETTRE NE FERME PAS LE PANNEAU. Les autres secrets se referment sur
 *    n'importe quelle touche et n'importe quel clic — ils ne contiennent que du
 *    texte à lire, on n'y perd rien. Celui-ci contient des phrases qu'on TAPE :
 *    la première lettre l'aurait refermé, et le premier clic dans la zone de
 *    saisie aussi. Il ne cède qu'à Échap et au clic sur le fond. C'est la même
 *    règle que pour la barre de l'énoncé, pour la même raison : on n'écarte pas
 *    d'un geste ce qui porte du travail.
 *
 * 3. CHAQUE PHRASE EST VRAIMENT EXÉCUTÉE. Pas analysée, pas devinée : c'est la
 *    réponse du logiciel qui s'affiche, avec ce qu'elle a construit et les
 *    instruments qu'elle a sortis. Un banc qui prédirait au lieu d'exécuter
 *    mentirait précisément le jour où l'on en aurait besoin.
 *
 * 4. LES PHRASES D'UN PAQUET SE SUIVENT SUR LA MÊME FEUILLE. « Trace le segment
 *    [AB] » puis « Place le milieu de [AB] » n'aurait aucun sens autrement.
 *
 * 5. ON PEUT Y REVENIR. Le texte et la case sont retenus d'une ouverture à
 *    l'autre — on ferme souvent pour aller regarder la figure, et retaper vingt
 *    phrases serait la meilleure façon de ne plus s'en servir. Et l'adresse
 *    « #phrases » l'ouvre directement : sept clics sur la date de version, c'est
 *    bien pour un secret, c'est pénible pour un outil quotidien, et
 *    impraticable sur un téléphone où l'on n'a pas de console.
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

    const ouvert = () => page.evaluate(() =>
        document.getElementById('secretVoile').classList.contains('ouvert')
        && !!document.getElementById('bancTexte'));

    console.log('\n=== une vraie figure, qu\'il ne faudra pas abîmer ===');
    const avant = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.executerConsigneAvec('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm', false);
        a.executerConsigneAvec('Trace la médiatrice de [AB]', false);
        return { code: a.getCompressedString(), n: a.entities.length,
                 passe: a.historyPast.length,
                 prog: (a.programmeDeConstruction(false) || []).join(' | ') };
    });
    ck('le décor est planté', avant.n > 5, avant.n + ' objets');

    console.log('\n=== le banc s\'ouvre et joue ce qu\'on lui donne ===');
    await page.evaluate(() => window.app.bancPhrases());
    await page.waitForTimeout(250);
    ck('le panneau est là', await ouvert());

    await page.click('#bancTexte');
    await page.fill('#bancTexte', [
        'Trace le segment [MN] de 6 cm',
        'Place le milieu I de [MN]',
        'Trace un dodécaèdre étoilé de Poinsot',
    ].join('\n'));
    ck('  taper dedans ne le referme pas', await ouvert());

    await page.check('#bancOutils');
    await page.click('#bancGo');
    await page.waitForTimeout(500);

    const res = await page.evaluate(() =>
        [...document.querySelectorAll('#bancResultats .banc-ligne')].map(l => ({
            ok: l.classList.contains('ok'),
            phrase: l.querySelector('.banc-phrase').textContent,
            detail: [...l.querySelectorAll('.banc-detail')].map(d => d.textContent).join(' / '),
            chiffres: l.querySelector('.banc-chiffres').textContent })));
    ck('trois lignes, trois verdicts', res.length === 3, res.length + ' ligne(s)');
    ck('  la première passe', res[0] && res[0].ok, res[0] && res[0].detail);
    ck('  la deuxième AUSSI : elle s\'appuie sur la première, même feuille',
       res[1] && res[1].ok, res[1] && res[1].detail);
    ck('  la troisième est refusée, et le refus est expliqué',
       res[2] && !res[2].ok && /pas compris/i.test(res[2].detail),
       res[2] && res[2].detail);
    /* LE BANC EST FIDÈLE, PAS GÉNÉREUX. « Trace le segment [MN] de 6 cm » ne
       sort aucun instrument — ni dans le banc, ni hors de lui : c'est vérifié.
       Le milieu, lui, se construit au compas, et c'est là qu'on doit voir les
       gestes. Viser la mauvaise ligne aurait fait passer le banc pour fautif
       alors qu'il ne faisait que dire la vérité. */
    ck('  et les instruments comptent : le milieu se construit au compas',
       /[1-9]\d* geste/.test((res[1] || {}).chiffres || ''), (res[1] || {}).chiffres);
    ck('  tandis qu\'un simple segment n\'en demande aucun, ici comme ailleurs',
       / 0 geste/.test((res[0] || {}).chiffres || ''), (res[0] || {}).chiffres);
    const dehors = await page.evaluate(() => window.app.bancIsoler(() => {
        window.app.executerConsigneAvec('Trace le segment [MN] de 6 cm', true);
        return window.app.entities.filter(e => e instanceof ToolAnimation).length;
    }));
    ck('    — mesuré hors de l\'interface du banc aussi', dehors === 0, dehors + ' geste(s)');
    const bilan = await page.evaluate(() => (document.querySelector('.banc-bilan') || {}).textContent || '');
    ck('  le bilan compte juste', /2 phrase\(s\) comprise\(s\) sur 3/.test(bilan), bilan.trim());

    console.log('\n=== et la figure ouverte n\'a pas bougé d\'un caractère ===');
    const apres = await page.evaluate(() => {
        const a = window.app;
        return { code: a.getCompressedString(), n: a.entities.length,
                 passe: a.historyPast.length,
                 prog: (a.programmeDeConstruction(false) || []).join(' | ') };
    });
    ck('le même nombre d\'objets', apres.n === avant.n, avant.n + ' → ' + apres.n);
    ck('  le même code compact, au caractère près', apres.code === avant.code,
       apres.code === avant.code ? avant.code.length + ' caractères'
                                 : 'LA FIGURE A CHANGÉ');
    ck('  le même énoncé', apres.prog === avant.prog,
       apres.prog === avant.prog ? 'inchangé' : apres.prog.slice(0, 60));
    ck('  et rien n\'est tombé dans l\'historique — pas de Ctrl+Z à faire',
       apres.passe === avant.passe, avant.passe + ' → ' + apres.passe);

    console.log('\n=== il ne se ferme que si on le lui demande ===');
    await page.keyboard.press('KeyZ');
    await page.waitForTimeout(150);
    ck('une lettre ne le ferme pas', await ouvert());
    await page.click('#bancTexte');
    await page.waitForTimeout(120);
    ck('  un clic dans la zone de saisie non plus', await ouvert());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);
    ck('  Échap, oui', !(await ouvert()));

    console.log('\n=== on y revient sans tout retaper ===');
    await page.evaluate(() => window.app.bancPhrases());
    await page.waitForTimeout(250);
    const repris = await page.evaluate(() => ({
        lignes: document.getElementById('bancTexte').value.split('\n').filter(Boolean).length,
        coche: document.getElementById('bancOutils').checked }));
    ck('les phrases sont retrouvées', repris.lignes === 3, repris.lignes + ' ligne(s)');
    ck('  et la case aussi', repris.coche === true, String(repris.coche));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    console.log('\n=== il s\'ouvre aussi par l\'adresse ===');
    const p2 = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    await p2.goto(PAGE + '#phrases');
    await p2.waitForFunction(() => window.app);
    await p2.waitForTimeout(800);
    ck('« #phrases » l\'ouvre', await p2.evaluate(() =>
        document.getElementById('secretVoile').classList.contains('ouvert')
        && !!document.getElementById('bancTexte')));
    await p2.close();

    /* L'interface élève ne doit rien savoir de tout cela. */
    const p3 = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    await p3.goto(PAGE + '?mode=lecture#phrases');
    await p3.waitForFunction(() => window.app);
    await p3.waitForTimeout(800);
    const chezEleve = await p3.evaluate(() => ({
        lecture: document.body.classList.contains('mode-lecture'),
        banc: !!document.getElementById('bancTexte') }));
    ck('  mais jamais dans l\'interface élève',
       !chezEleve.lecture || !chezEleve.banc, JSON.stringify(chezEleve));
    await p3.close();

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
