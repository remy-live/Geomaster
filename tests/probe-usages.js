/* CE QUI SERT, ET RIEN D'AUTRE.
 *
 * « Le site est sur GitHub, puis-je faire des stats de l'utilisation, de qui se
 * sert de quoi ? — Clairement GéoMaster est un outil de prof, c'est pour moi,
 * pour voir les usages. »
 *
 * GitHub Pages n'en donne aucune : hébergement statique, aucun journal d'accès.
 * Et le logiciel promet quelque chose de plus fort qu'une statistique — une
 * sonde coupe TOUTE requête réseau et vérifie que la chaîne entière marche quand
 * même, parce que le vrai cas d'usage est un fichier ouvert d'un double-clic
 * depuis une clé USB, dans une salle sans internet.
 *
 * On compte donc sur place, et RIEN NE PART. C'est la propriété que cette sonde
 * tient d'abord : une séance entière — outils, instruments, consignes,
 * constructions magiques, exports — sans qu'une seule requête quitte la machine.
 * Le reste est du comptage : ce qui sert, combien de fois, et surtout CE QU'ON
 * DEMANDE ET QUE LE LOGICIEL NE COMPREND PAS, avec le texte — la liste de ce
 * qu'il lui reste à apprendre, écrite par ceux qui s'en servent.
 *
 * Deux garde-fous : la liste des phrases refusées est BORNÉE, pour qu'un
 * compteur ne devienne pas une archive ; et l'interface élève ne compte rien,
 * puisque ce n'est pas d'elle qu'on parle.
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

    /* Tout ce qui n'est pas le fichier lui-même est noté. */
    const dehors = [];
    await page.route('**/*', route => {
        const u = route.request().url();
        if (!/^(file|data|blob):/.test(u)) dehors.push(u);
        return route.continue();
    });

    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try { localStorage.clear(); } catch (e) {}
        window.app.checkAutoSave = () => {};
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
    });

    console.log('\n=== une séance ordinaire, et ce qu\'elle laisse ===');
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        a.compterOuverture();
        ['point', 'segment', 'circle', 'segment', 'angle'].forEach(o => a.setTool(o));
        a.setTool('magic_mediatrice');
        a.setTool('magic_hexagon');
        a.toggleWidget('compass');
        a.toggleWidget('ruler');
        a.toggleWidget('compass');   // rangé : ne compte pas une seconde fois
        const liste = a.consignesListe();
        const faire = (t) => {
            let i = liste.findIndex(c => !(c.texte || '').trim());
            if (i < 0) { liste.push(a.consigneNeuve()); i = liste.length - 1; }
            liste[i].texte = t;
            a.validerConsigne(i);
        };
        faire('Trace un carré ABCD de 4 cm de côté');
        faire('Trace un dodécaèdre étoilé de Poinsot');
        faire('Fais-moi un café');
    });
    const u = await page.evaluate(() => window.app.usageLire());
    ck('les outils pris sont comptés, et le plus repris ressort',
       u.outils.segment === 2 && u.outils.point === 1 && u.outils.circle === 1,
       JSON.stringify(u.outils));
    ck('  les constructions magiques comptent à part',
       u.magies.mediatrice === 1 && u.magies.hexagon === 1 && !u.outils.magic_mediatrice,
       JSON.stringify(u.magies));
    ck('  on compte les instruments SORTIS, pas les rangements',
       u.instruments.compass === 1 && u.instruments.ruler === 1,
       JSON.stringify(u.instruments));
    ck('  les consignes faites et refusées sont séparées',
       u.consignes.ok === 1 && u.consignes.rate === 2, JSON.stringify(u.consignes));
    /* C'est le rayon le plus utile : ce que les gens demandent et que le logiciel
       ne sait pas faire. */
    ck('  et les phrases NON COMPRISES sont gardées, avec leur texte',
       !!u.incomprises['Trace un dodécaèdre étoilé de Poinsot']
       && !!u.incomprises['Fais-moi un café'],
       Object.keys(u.incomprises).join(' | '));
    ck('  la taille d\'écran est notée, pas l\'écran',
       u.ecrans.ordinateur >= 1, JSON.stringify(u.ecrans));

    console.log('\n=== et rien n\'est jamais parti ===');
    ck('pas une requête n\'a quitté la machine', dehors.length === 0,
       dehors.length ? dehors.slice(0, 3).join(' | ') : 'aucune');

    console.log('\n=== le relevé se lit, se copie, s\'oublie ===');
    const releve = await page.evaluate(() => window.app.usageTexte());
    ck('le relevé dit la version, la période et les ouvertures',
       /GÉOMASTER — usages/.test(releve) && /ouverture/.test(releve)
       && /du \d{4}-\d{2}-\d{2}/.test(releve), releve.split('\n')[2]);
    ck('  et il range chaque rayon',
       /OUTILS/.test(releve) && /CONSTRUCTIONS MAGIQUES/.test(releve)
       && /INSTRUMENTS/.test(releve) && /PHRASES NON COMPRISES/.test(releve));

    const panneau = await page.evaluate(() => {
        window.app.ouvrirSecret('usages');
        const v = document.getElementById('secretVoile');
        const pre = document.querySelector('.secret-releve');
        return { ouvert: v.classList.contains('ouvert'),
                 lignes: pre ? pre.textContent.split('\n').length : 0,
                 liens: [...document.querySelectorAll('.secret-lien')].map(a => a.textContent) };
    });
    ck('le panneau s\'ouvre derrière la porte dérobée',
       panneau.ouvert && panneau.lignes > 10,
       panneau.lignes + ' lignes, ' + panneau.liens.join(' / '));

    const remis = await page.evaluate(() => {
        window.app.usageOublier(null);
        const u = window.app.usageLire();
        return { outils: Object.keys(u.outils).length,
                 incomprises: Object.keys(u.incomprises).length };
    });
    ck('  et « tout remettre à zéro » efface pour de bon',
       remis.outils === 0 && remis.incomprises === 0, JSON.stringify(remis));

    console.log('\n=== deux garde-fous ===');
    /* La liste des phrases refusées est bornée : un compteur qui garde tout
       n'est plus un compteur, c'est une archive. */
    const borne = await page.evaluate(() => {
        const a = window.app;
        for (let i = 0; i < 140; i++) a.compterUsage('incomprises', 'phrase inconnue n°' + i);
        return Object.keys(a.usageLire().incomprises).length;
    });
    ck('la liste des phrases non comprises est bornée',
       borne <= 100, borne + ' entrées après 140 phrases');

    /* L'élève n'est pas le sujet : son interface ne compte rien. */
    const eleve = await page.evaluate(() => {
        const a = window.app;
        a.usageOublier(null);
        document.body.classList.add('mode-lecture');
        a.setTool('polygon');
        a.compterUsage('outils', 'polygon');
        const apres = Object.keys(a.usageLire().outils).length;
        document.body.classList.remove('mode-lecture');
        return apres;
    });
    ck('  et l\'interface élève ne compte rien', eleve === 0,
       eleve + ' rayon(s) écrit(s) en mode lecture');

    console.log('\n=== la remontée : éteinte, locale, publiée ===');
    /* « Comment je récupère l'info ? » Il faut un point de chute à soi : GitHub
       Pages est statique et n'a pas de journal. La remontée existe donc, mais
       elle obéit à trois règles qui ne se négocient pas. */
    const eteinte = await page.evaluate(() => {
        window.GM_USAGES_URL = '';
        return window.app.usageEnvoyer();
    });
    ck('sans adresse configurée, rien ne part — c\'est l\'état du dépôt',
       eteinte === 'éteint', eteinte);

    const enLocal = await page.evaluate(() => {
        window.GM_USAGES_URL = 'https://exemple.invalid/usages';
        return window.app.usageEnvoyer();
    });
    ck('  et depuis un fichier local, rien ne part NON PLUS',
       enLocal === 'local', enLocal + ' (protocole ' + await page.evaluate(() => location.protocol) + ')');
    ck('  toujours aucune requête sortie', dehors.length === 0,
       dehors.slice(0, 2).join(' | ') || 'aucune');

    /* Sur le site publié, en revanche, elle part. On sert donc la page en http
       pour de bon — c'est la seule façon de le vérifier. */
    const http = require('http');
    const fs = require('fs');
    const fichier = path.resolve(__dirname, '..', 'index.html');
    const recu = [];
    const serveur = http.createServer((req, res) => {
        if (req.method === 'POST') {
            let corps = '';
            req.on('data', d => { corps += d; });
            req.on('end', () => { recu.push(corps); res.writeHead(204, {
                'Access-Control-Allow-Origin': '*' }); res.end(); });
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(fichier));
    });
    await new Promise(k => serveur.listen(0, '127.0.0.1', k));
    const port = serveur.address().port;

    const web = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    await web.goto('http://127.0.0.1:' + port + '/');
    await web.waitForFunction(() => window.app);
    const envoi = await web.evaluate((p) => {
        window.GM_USAGES_URL = 'http://127.0.0.1:' + p + '/usages';
        window.app.checkAutoSave = () => {};
        window.app.setTool('circle');
        window.app.compterUsage('incomprises', 'Trace une chose impossible');
        return window.app.usageEnvoyer();
    }, port);
    for (let t = 0; t < 40 && !recu.length; t++) await web.waitForTimeout(100);
    ck('depuis le site publié, le relevé part', envoi === 'envoyé' && recu.length === 1,
       envoi + ', ' + recu.length + ' relevé(s) reçu(s)');
    let paquet = {};
    try { paquet = JSON.parse(recu[0] || '{}'); } catch (e) {}
    ck('  il porte un identifiant d\'installation, pour compter des UTILISATEURS',
       typeof paquet.installation === 'string' && paquet.installation.length >= 8,
       String(paquet.installation).slice(0, 12) + '…');
    ck('  la version, l\'écran, les outils et les phrases non comprises',
       !!paquet.version && !!paquet.ecrans && !!paquet.outils
       && !!(paquet.incomprises || {})['Trace une chose impossible'],
       Object.keys(paquet).join(','));
    /* Aucune figure, aucun titre de document : ce n'est pas ce qu'on mesure. */
    const interdits = ['entities', 'data', 'figure', 'titre', 'title', 'projectTitle'];
    ck('  et rien de la figure ni du document',
       interdits.every(k => !(k in paquet)),
       interdits.filter(k => k in paquet).join(',') || 'aucun champ interdit');

    /* Une fois par jour, pas à chaque ouverture. */
    const deuxieme = await web.evaluate(() => window.app.usageEnvoyer());
    ck('  et une seule fois par jour', deuxieme === 'déjà' && recu.length === 1,
       deuxieme + ', ' + recu.length + ' reçu(s) au total');

    /* L'élève ne remonte rien, même sur le site publié. */
    const cote = await web.evaluate(() => {
        try { localStorage.removeItem('gm_usage_envoi'); } catch (e) {}
        document.body.classList.add('mode-lecture');
        const r = window.app.usageEnvoyer();
        document.body.classList.remove('mode-lecture');
        return r;
    });
    ck('  l\'interface élève ne remonte rien', cote === 'hors-jeu' && recu.length === 1,
       cote);

    await web.close();
    await new Promise(k => serveur.close(k));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
