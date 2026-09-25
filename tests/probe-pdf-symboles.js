/* LE PDF PORTE LES SYMBOLES MATHÉMATIQUES.
 *
 * C'était le seul maillon cassé de la chaîne du symbole, et il était laissé
 * ouvert faute d'une décision : la police embarquée, Instrument Sans, a les
 * lettres et les accents, pas les mathématiques. À l'écran et dans le SVG cela
 * ne se voyait pas — le navigateur descend sa pile de polices GLYPHE PAR GLYPHE
 * et remplace ce qui manque. jsPDF, lui, choisit UNE police par passage de texte
 * et écrit le glyphe « absent » pour tout le reste ; or ce glyphe ne dessine
 * rien. Mesuré : « A ∉ D » sortait « A   D », et le TEXTE du PDF — celui qu'on
 * cherche avec Ctrl+F — ne portait que « A   D  a   b  ( A B )   ( C D ) ».
 * Quarante des quarante-sept symboles partageaient la même largeur, celle du
 * glyphe absent ; les sept autres — × ÷ · ° → ← … — étaient dans Instrument Sans
 * depuis toujours, et c'est pourquoi le degré des angles, lui, sortait bien.
 *
 * LA POLICE PORTE MAINTENANT TOUT. Les quarante symboles qui manquaient sont
 * pris dans DejaVu Sans, réduits à ces seuls glyphes, ramenés de 2048 à 1000
 * unités par cadratin — l'échelle de l'hôte — et FUSIONNÉS dans la police
 * embarquée. Coût : 1 Ko sur 178, parce qu'on n'embarque que quarante dessins.
 *
 * POURQUOI FUSIONNER PLUTÔT QU'AJOUTER UNE SECONDE POLICE, c'est toute
 * l'affaire : une pile de familles dans le SVG ne servirait à rien, jsPDF ne
 * sachant pas en descendre les marches. Il aurait fallu découper chaque texte en
 * passages — lettres ici, symboles là — et recalculer leurs abscisses. Une seule
 * police qui porte tout épargne ce découpage, et c'est pourquoi cette sonde
 * vérifie la POLICE et non le SVG.
 *
 * ET LES DEUX LICENCES SONT UNE CONDITION, PAS UN ORNEMENT. L'OFL d'Instrument
 * Sans réserve son nom aux versions non modifiées ; la licence Bitstream Vera de
 * DejaVu n'autorise l'ajout de glyphes qu'à condition de renommer sans
 * « Bitstream » ni « Vera », et impose de joindre son avis. Un fichier unique
 * qu'on distribue sans elles n'est pas distribuable. La sonde les tient donc
 * comme elle tient le reste — c'est la seule façon qu'elles ne disparaissent pas
 * au prochain remplacement de police.
 *
 * LE GARDE-FOU RESTE, ET IL SE TAIT TOUT SEUL. L'export nomme les symboles que
 * le PDF ne sait pas écrire ; il n'interroge pas une liste, il demande au
 * document s'il sait écrire ce qu'on lui donne. Maintenant que la police porte
 * tout, il n'a plus rien à dire — et il reparlera le jour où un caractère venu
 * d'ailleurs traversera la feuille.
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

(async () => {
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME });
    const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 },
                                       acceptDownloads: true });
    const page = await ctx.newPage();
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

    /* ============================================================
       1. LA POLICE DU PDF SAIT ÉCRIRE LES QUARANTE-SEPT
       On ne devine pas la couverture d'une police, on la DEMANDE au document :
       jsPDF donne au glyphe absent une largeur unique, qu'on relève sur un
       caractère de la zone à usage privé — il n'est dans aucune police.
       ============================================================ */
    console.log('\n=== la police embarquée porte les symboles ===');
    const police = await page.evaluate(() => {
        window.gmEnsurePdfLibs();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const enregistree = window.gmEnregistrerPolice(pdf);
        pdf.setFont('GeoSans', 'normal');
        const absent = pdf.getTextWidth('');
        const lettre = pdf.getTextWidth('A');
        const S = GmFormule.SYMBOLES;
        const vus = new Set();
        Object.keys(S).forEach(k => vus.add(S[k]));
        const perdus = [...vus].filter(c => Math.abs(pdf.getTextWidth(c) - absent) < 0.01);
        /* Le gras aussi : un énoncé en gras ne doit pas perdre ses symboles. */
        pdf.setFont('GeoSans', 'bold');
        const perdusGras = [...vus].filter(c => Math.abs(pdf.getTextWidth(c) - absent) < 0.01);
        return { enregistree, total: vus.size, perdus, perdusGras,
                 etalonUtilisable: Math.abs(absent - lettre) > 0.01 };
    });
    ck('la police est enregistrée dans le document', police.enregistree);
    ck('  et l\'étalon du glyphe absent est utilisable', police.etalonUtilisable);
    ck('aucun des symboles n\'est perdu', police.perdus.length === 0,
       police.perdus.join(' ') || `les ${police.total} y sont`);
    ck('  y compris en gras', police.perdusGras.length === 0,
       police.perdusGras.join(' ') || 'tous');

    /* ============================================================
       2. LE PDF POUR DE VRAI, ET L'ENCRE QU'IL PORTE
       Une largeur non nulle ne prouve pas qu'un trait est posé. On exporte, on
       relit le PDF avec pdf.js — celui de la page — et l'on compte l'encre.
       ============================================================ */
    console.log('\n=== et le PDF exporté les montre ===');
    await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        ['A \\notin D', 'a \\ge b', '(AB) \\parallel (CD)']
            .forEach((t, i) => { const L = new TextLabel(200, 200 + i * 100, t);
                                 L.fontSize = 28; a.addEntity(L); });
        a.render();
        if (a.closeModal) a.closeModal();
    });
    const dl = page.waitForEvent('download', { timeout: 90000 });
    await page.evaluate(() => window.app.exportPDF(false, 'vector'));
    const fichier = path.join(require('os').tmpdir(), 'gm-probe-symboles.pdf');
    await (await dl).saveAs(fichier);
    const octets = fs.statSync(fichier).size;
    ck('le PDF est produit', octets > 5000, Math.round(octets / 1024) + ' ko');

    /* L'AVERTISSEMENT SE TAIT. Il nomme les symboles que le PDF ne sait pas
       écrire ; il n'a plus rien à nommer, et c'est lui-même qui le constate. */
    await page.waitForTimeout(300);
    const averti = await page.evaluate(() => {
        const m = document.getElementById('customModal');
        return !!(m && getComputedStyle(m).display !== 'none');
    });
    ck('  et l\'export ne signale plus aucun symbole perdu', !averti);
    await page.evaluate(() => { if (window.app.closeModal) window.app.closeModal(); });

    /* ON RELIT LE PDF, page rendue, et l'on compte l'encre : un symbole écrit
       avec le glyphe « absent » ne dessine rien, et cette mesure-là le verrait. */
    const b64 = fs.readFileSync(fichier).toString('base64');
    const rendu = await page.evaluate(async (b64) => {
        window.app.assurerWorkerPdf();
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const doc = await pdfjsLib.getDocument({ data: u8 }).promise;
        const p = await doc.getPage(1);
        const vp = p.getViewport({ scale: 2 });
        const cv = document.createElement('canvas');
        cv.width = vp.width; cv.height = vp.height;
        const c = cv.getContext('2d');
        c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
        await p.render({ canvasContext: c, viewport: vp }).promise;
        const d = c.getImageData(0, 0, cv.width, cv.height).data;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) if ((d[i] + d[i + 1] + d[i + 2]) / 3 < 128) n++;
        /* Et le TEXTE du PDF, qui doit porter les caractères eux-mêmes : c'est
           ce qui permet de chercher « ∉ » dans le document. */
        const t = await p.getTextContent();
        return { encre: n, texte: t.items.map(x => x.str).join(' ') };
    }, b64);
    ck('  la page porte de l\'encre', rendu.encre > 2000, rendu.encre + ' pixels');
    for (const c of ['∉', '≥', '∥']) {
        ck(`  le caractère ${c} est dans le texte du PDF`, rendu.texte.includes(c),
           rendu.texte.slice(0, 40));
    }
    try { fs.unlinkSync(fichier); } catch (e) { void e; }

    /* ============================================================
       3. LES DEUX LICENCES SONT DANS LE FICHIER
       Une condition de distribution, pas un ornement.
       ============================================================ */
    console.log('\n=== et le fichier porte ce que les licences exigent ===');
    const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
    ck('la licence SIL d\'Instrument Sans y est',
       html.includes('SIL OPEN FONT LICENSE Version 1.1')
       && html.includes('The Instrument Sans Project Authors'));
    ck('la licence Bitstream Vera de DejaVu y est',
       html.includes('Copyright (c) 2003 by Bitstream, Inc.')
       && html.includes('Bitstream Vera is a trademark of Bitstream, Inc.')
       && html.includes('only if the fonts'));
    /* LE RENOMMAGE EST CE QUI REND LA FUSION LICITE : l'OFL réserve
       « Instrument Sans » aux versions non modifiées, et Bitstream Vera interdit
       « Bitstream » et « Vera » dans le nom d'une version augmentée. */
    const nom = await page.evaluate(() => {
        window.gmEnsurePdfLibs();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        window.gmEnregistrerPolice(pdf);
        /* le nom interne de la police, tel que le fichier TTF le déclare */
        const vfs = pdf.existsFileInVFS && pdf.existsFileInVFS('GeoSans-Regular.ttf')
            ? pdf.getFileFromVFS('GeoSans-Regular.ttf') : '';
        const bin = atob(vfs);
        let txt = '';
        for (let i = 0; i < bin.length; i++) {
            const c = bin.charCodeAt(i);
            txt += (c >= 32 && c < 127) ? String.fromCharCode(c) : ' ';
        }
        return { contientGeoMaster: /G\s*e\s*o\s*M\s*a\s*s\s*t\s*e\s*r/.test(txt),
                 contientBitstream: /B\s*i\s*t\s*s\s*t\s*r\s*e\s*a\s*m/.test(txt),
                 contientVera: /\bV\s*e\s*r\s*a\b/.test(txt),
                 octets: bin.length };
    });
    ck('la police fusionnée porte un nom à elle', nom.contientGeoMaster,
       Math.round(nom.octets / 1024) + ' ko');
    ck('  qui ne reprend ni « Bitstream » ni « Vera »',
       !nom.contientBitstream && !nom.contientVera);

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
