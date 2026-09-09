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
    ck('sans adresse configurée, rien ne part du tout',
       eteinte === 'éteint', eteinte);

    /* CE QUE LE DÉPÔT EMBARQUE, ET SURTOUT CE QU'IL N'EMBARQUE PAS. L'adresse du
       point de chute est publique par nature — le logiciel doit l'appeler depuis
       le navigateur de chacun, elle est donc lisible par tous, et ce n'est pas
       un défaut : cette adresse ne sait qu'ÉCRIRE. La clé de lecture, elle, ne
       doit JAMAIS s'y trouver : un fichier publié n'est pas un coffre, et
       quiconque afficherait la source lirait alors le relevé de tout le monde.
       C'est la seule fuite possible de tout ce montage, et elle tiendrait à une
       étourderie de copier-coller. On la mesure donc. */
    const source = require('fs').readFileSync(
        path.resolve(__dirname, '..', 'index.html'), 'utf8');
    const trouve = source.match(/window\.GM_USAGES_URL\s*=\s*'([^']*)'/);
    const livree = trouve ? trouve[1] : '(ligne introuvable)';
    ck('le fichier livré porte une adresse de point de chute',
       /^https:\/\/[^\s?#]+$/.test(livree), livree || '(vide)');
    ck('  et pas la moindre trace de la clé de lecture',
       !/[?&]k=/.test(livree) && !/\?/.test(livree),
       livree.includes('?') ? 'IL Y A UNE REQUÊTE DANS L\'ADRESSE' : 'aucune');

    const enLocal = await page.evaluate(() => {
        window.GM_USAGES_URL = 'https://exemple.invalid/usages';
        return window.app.usageEnvoyer();
    });
    ck('  et depuis un fichier local, rien ne part NON PLUS',
       enLocal === 'local', enLocal + ' (protocole ' + await page.evaluate(() => location.protocol) + ')');
    ck('  toujours aucune requête sortie', dehors.length === 0,
       dehors.slice(0, 2).join(' | ') || 'aucune');

    /* Sur le site publié, en revanche, elle part. On sert donc la page en http
       pour de bon — c'est la seule façon de le vérifier.
     *
     * ET SUR DEUX SERVEURS, PAS UN. La sonde n'en montait qu'un seul et postait
     * sur lui-même : même origine, donc aucune règle inter-origines exercée.
     * Or le vrai montage est inter-origines par nature — la page vient de
     * github.io, le point de chute est un workers.dev. Tout un pan du chemin
     * n'était donc pas mesuré, celui-là même qui peut faire disparaître un envoi
     * sans un mot : une requête inter-origines annonçant application/json exige
     * du navigateur un vol de reconnaissance préalable, et s'il échoue la
     * requête est abandonnée EN SILENCE. D'où le passage à text/plain, qui rend
     * la requête « simple » et supprime ce vol. Deux ports, donc deux origines,
     * et le chemin réel est enfin sous mesure. */
    const http = require('http');
    const fs = require('fs');
    const fichier = path.resolve(__dirname, '..', 'index.html');

    const site = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(fs.readFileSync(fichier));
    });
    await new Promise(k => site.listen(0, '127.0.0.1', k));
    const portSite = site.address().port;

    const recu = [];
    const vols = [];          /* les OPTIONS reçus : il ne doit pas y en avoir */
    let refuse = false;       /* pour jouer la panne du point de chute */
    const collecte = http.createServer((req, res) => {
        const cors = { 'Access-Control-Allow-Origin': '*',
                       'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                       'Access-Control-Allow-Headers': 'Content-Type' };
        if (req.method === 'OPTIONS') { vols.push(req.url); res.writeHead(200, cors); res.end(); return; }
        if (req.method === 'POST') {
            let corps = '';
            req.on('data', d => { corps += d; });
            req.on('end', () => {
                if (refuse) { res.writeHead(503, cors); res.end(); return; }
                recu.push(corps);
                res.writeHead(204, cors); res.end();
            });
            return;
        }
        res.writeHead(405, cors); res.end();
    });
    await new Promise(k => collecte.listen(0, '127.0.0.1', k));
    /* Une AUTRE origine : localhost et 127.0.0.1 désignent la même machine mais
       sont deux origines distinctes pour le navigateur — et le port diffère
       aussi. C'est exactement la situation de github.io vers workers.dev. */
    const chute = 'http://localhost:' + collecte.address().port + '/usages';

    const web = await nav.newPage({ viewport: { width: 1400, height: 950 } });
    await web.goto('http://127.0.0.1:' + portSite + '/');
    await web.waitForFunction(() => window.app);

    /* D'ABORD LA PANNE, car c'est elle qui a coûté cher. Un envoi refusé ne doit
       PAS brûler la journée : sendBeacon rendait « vrai » dès la mise en file,
       le jour se marquait aussitôt, et l'envoi suivant n'était tenté que le
       lendemain — indéfiniment si la cause durait. On croyait alors n'avoir
       aucun utilisateur, quand on avait seulement un tuyau bouché. */
    refuse = true;
    const enPanne = await web.evaluate((u) => {
        window.GM_USAGES_URL = u;
        window.app.checkAutoSave = () => {};
        return window.app.usageEnvoyer();
    }, chute);
    const jourBrule = await web.evaluate(() => {
        try { return localStorage.getItem('gm_usage_envoi'); } catch (e) { return 'illisible'; }
    });
    ck('un point de chute en panne se voit', /^refusé 503/.test(enPanne), enPanne);
    ck('  et il NE BRÛLE PAS la journée : on réessaiera',
       !jourBrule, jourBrule ? 'JOURNÉE PERDUE (' + jourBrule + ')' : 'le jour n\'est pas marqué');

    refuse = false;
    const envoi = await web.evaluate(() => {
        window.app.setTool('circle');
        window.app.compterUsage('incomprises', 'Trace une chose impossible');
        return window.app.usageEnvoyer();
    });
    for (let t = 0; t < 40 && !recu.length; t++) await web.waitForTimeout(100);
    ck('depuis le site publié, le relevé part — vers une AUTRE origine',
       envoi === 'envoyé' && recu.length === 1,
       envoi + ', ' + recu.length + ' relevé(s) reçu(s)');
    ck('  sans vol de reconnaissance : la requête est « simple »',
       vols.length === 0, vols.length + ' OPTIONS reçu(s)');
    const dit = await web.evaluate(() => window.app.usageTexte());
    ck('  et le relevé DIT que la remontée a marché',
       /remontée : .*envoyé/.test(dit),
       (dit.split('\n').find(l => l.startsWith('remontée')) || '(ligne absente)'));
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
    await new Promise(k => site.close(k));
    await new Promise(k => collecte.close(k));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
