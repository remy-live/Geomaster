/* UNE DROITE A UN NOM, ET SON NOM VA AU BORD.
 *
 * « Si on clique hors de la zone de "écris l'énoncé", la barre disparaît.
 *   Donne un nom aux droites — écris le nom le plus proche possible d'un bord,
 *   soit droite, soit gauche, au plus logique. Comme cela dans l'énoncé, on peut
 *   avoir "trace une droite (d)". Active le rangement auto on/off en on. Pour la
 *   médiatrice dans la bibliothèque ou la construction magique, trace les 3, pas
 *   deux seulement. »
 *
 * QUATRE CHOSES, ET ELLES SE TIENNENT PAR LE MÊME FIL : le logiciel doit dire
 * ce qu'il fait, et ne pas défaire ce qu'on a fait.
 *
 * 1. LA BARRE NE SE FERME PLUS D'UN CLIC À CÔTÉ. Elle se refermait comme toutes
 *    les fenêtres — sauf que les autres ne contiennent rien qu'on ait ÉCRIT. On
 *    tape une phrase de quinze mots, la main glisse, le clic tombe à deux
 *    centimètres, et tout disparaît. Mesuré : la barre se fermait, et la
 *    prochaine ouverture repartait de zéro. Il reste deux sorties, toutes deux
 *    délibérées — la croix et Échap. Et Échap écoute depuis la PAGE : tant qu'un
 *    clic à côté fermait la barre, le foyer ne pouvait pas sortir du champ sans
 *    qu'elle disparaisse ; maintenant qu'elle reste, il le peut — un Échap
 *    branché sur le seul champ n'aurait plus rien fermé.
 *
 * 2. LE NOM D'UNE DROITE VA AU BORD. Il se posait au second point, qui sur une
 *    droite n'est qu'un point de passage arbitraire — souvent au milieu de la
 *    figure, là où il y a le plus de monde. Au tableau on écrit (d) au bout du
 *    trait, contre le bord, parce que c'est le seul endroit sûrement vide. La
 *    sonde vérifie que le nom sort dans le dernier quart du cadre, à droite —
 *    ou en haut quand la droite est plutôt verticale, car « à droite » n'y veut
 *    plus rien dire.
 *
 * 3. ET L'ÉNONCÉ NE PERD PAS LES DEUX POINTS. C'est le piège de cette
 *    demande-là : dire « Trace la droite (d) » après avoir placé A et B rend
 *    l'énoncé INCONSTRUCTIBLE — rien ne dit plus par où passe (d), et l'élève
 *    trace la première droite venue. Le nom s'AJOUTE, il ne remplace pas.
 *
 * 4. TROIS MÉDIATRICES, PAS DEUX. Deux suffisent à trouver le centre, et c'est
 *    exactement pourquoi on n'en traçait que deux. Mais le théorème dit que les
 *    trois sont CONCOURANTES, et la troisième est la seule à le montrer. La
 *    sonde tient aussi que le centre reste juste : OA = OB = OC, y compris
 *    après avoir tiré sur un sommet — une propriété qui ne survit pas au
 *    déplacement n'était pas une propriété.
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

    console.log('\n=== la barre de l\'énoncé ne se sabote plus elle-même ===');
    const ouvrir = async (texte) => {
        await page.evaluate(() => window.app.ouvrirConsigneEclair());
        await page.waitForTimeout(250);
        await page.evaluate((t) => { document.getElementById('ceChamp').value = t; }, texte);
    };
    const etatBarre = () => page.evaluate(() => ({
        ouverte: document.getElementById('consigneEclair').classList.contains('ouvert'),
        texte: document.getElementById('ceChamp').value }));

    const PHRASE = 'Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm';
    await ouvrir(PHRASE);
    /* Franchement à côté : en bas à gauche, loin de la boîte centrée en haut. */
    await page.mouse.click(120, 760);
    await page.waitForTimeout(200);
    const apresClic = await etatBarre();
    ck('un clic à côté ne referme plus la barre',
       apresClic.ouverte, apresClic.ouverte ? 'toujours ouverte' : 'ELLE A DISPARU');
    ck('  et la phrase écrite est intacte',
       apresClic.texte === PHRASE, apresClic.texte.slice(0, 30) + '…');

    /* Échap doit marcher MÊME quand le foyer a quitté le champ — c'est
       précisément le cas que le clic à côté vient de créer. */
    const foyer = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const apresEchap = await etatBarre();
    ck('  Échap la ferme, foyer ou pas', !apresEchap.ouverte,
       'foyer sur ' + foyer + (apresEchap.ouverte ? ' — ELLE RESTE OUVERTE' : ''));

    await ouvrir('Place un point A');
    await page.click('#ceFermer');
    await page.waitForTimeout(200);
    ck('  et la croix aussi', !(await etatBarre()).ouverte);

    console.log('\n=== le bouton du rangement auto dit la vérité ===');
    const rangement = () => page.evaluate(() => ({
        mode: !!window.app.isAutoLabelMode,
        allume: document.getElementById('btnAutoLabelToggle').classList.contains('active') }));
    const depart = await rangement();
    ck('au démarrage il est actif, et son bouton est allumé',
       depart.mode && depart.allume, JSON.stringify(depart));
    await page.evaluate(() => window.app.toggleAutoLabelMode());
    const eteint = await rangement();
    ck('  un appui l\'éteint, des deux côtés à la fois',
       !eteint.mode && !eteint.allume, JSON.stringify(eteint));
    await page.evaluate(() => window.app.toggleAutoLabelMode());
    const rallume = await rangement();
    ck('  et le rallume', rallume.mode && rallume.allume, JSON.stringify(rallume));

    console.log('\n=== une droite tracée reçoit un nom ===');
    const poser = (x1, y1, x2, y2, l1, l2) => page.evaluate(([x1, y1, x2, y2, l1, l2]) => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const p1 = new Point(x1, y1, l1), p2 = new Point(x2, y2, l2);
        if (!l1) { p1.visible = false; p1.showLabel = false; }
        if (!l2) { p2.visible = false; p2.showLabel = false; }
        a.addEntity(p1); a.addEntity(p2);
        const d = a.baptiserDroite(new Line(p1, p2));
        a.addEntity(d);
        const anc = d.ancreNomDroite(null, a.ctx);
        const b = (a.canvas.parentElement || a.canvas).getBoundingClientRect();
        return { nom: d.nomDroite,
                 x: anc.x * a.view.zoom + a.view.x, y: anc.y * a.view.zoom + a.view.y,
                 L: b.width, H: b.height,
                 prog: a.programmeDeConstruction(false) || [] };
    }, [x1, y1, x2, y2, l1, l2]);

    const oblique = await poser(300, 300, 600, 420, 'A', 'B');
    ck('elle s\'appelle (d)', oblique.nom === 'd', String(oblique.nom));
    ck('  et son nom sort dans le dernier quart du cadre, à droite',
       oblique.x > oblique.L * 0.75 && oblique.x < oblique.L,
       `x = ${Math.round(oblique.x)} sur ${Math.round(oblique.L)}`);

    /* La même, tracée dans l'autre sens : le nom ne doit pas sauter à l'autre
       bout. Une droite n'a pas de sens ; son nom ne doit pas en avoir un. */
    const envers = await poser(600, 420, 300, 300, 'B', 'A');
    ck('  tracée à l\'envers, le nom reste du même côté',
       envers.x > envers.L * 0.75,
       `x = ${Math.round(envers.x)} (à l'endroit : ${Math.round(oblique.x)})`);

    const verticale = await poser(400, 200, 410, 700, 'A', 'B');
    ck('  presque verticale, il passe en HAUT — « à droite » n\'y veut rien dire',
       verticale.y < verticale.H * 0.25,
       `y = ${Math.round(verticale.y)} sur ${Math.round(verticale.H)}`);

    const horizontale = await poser(200, 400, 900, 400, 'A', 'B');
    ck('  horizontale, il retourne à droite',
       horizontale.x > horizontale.L * 0.75, `x = ${Math.round(horizontale.x)}`);

    console.log('\n=== et l\'énoncé nomme la droite SANS perdre ses deux points ===');
    const ligne = oblique.prog.find(l => /droite/.test(l)) || '';
    ck('« Trace la droite (AB), que l\'on note (d). »',
       /\(AB\)/.test(ligne) && /\(d\)/.test(ligne), ligne || '(aucune ligne « droite »)');
    ck('  les deux points sont placés avant',
       /Place les points A et B/.test(oblique.prog[0] || ''), oblique.prog[0] || '(rien)');

    /* Quand l'outil « droite sans points » a effacé les extrémités, il n'y a
       rien à citer — et « une droite (d) » est alors exactement juste. */
    const sansPoints = await poser(300, 300, 600, 420, '', '');
    const ligneSP = sansPoints.prog.find(l => /droite/.test(l)) || '';
    ck('sans points visibles, l\'énoncé dit « Trace une droite (d). »',
       /une droite \(d\)/.test(ligneSP), ligneSP || '(aucune)');

    console.log('\n=== les TROIS médiatrices du cercle circonscrit ===');
    const circ = await page.evaluate(() => {
        const a = window.app;
        a.entities = []; a.historyPast = [];
        const A = new Point(300, 560, 'A'), B = new Point(700, 520, 'B'), C = new Point(480, 240, 'C');
        a.addEntity(A); a.addEntity(B); a.addEntity(C);
        a.buildCircumscribedCircle(A, B, C);
        const O = a.entities.find(e => e.label === 'O');
        return { roles: a.entities.filter(e => e.roleDroite).map(e => e.roleDroite),
                 rayons: O ? [A, B, C].map(p => Math.round(Math.hypot(p.x - O.x, p.y - O.y))) : [] };
    });
    ck('les trois sont tracées, pas deux', circ.roles.length === 3, circ.roles.join(' · '));
    ck('  et le centre reste équidistant des 3 sommets',
       circ.rayons.length === 3 && new Set(circ.rayons).size === 1, circ.rayons.join(' / '));

    /* La troisième ne sert pas à placer O — ce sont les deux premières qui le
       définissent. Elle sert à MONTRER qu'il est là. Encore faut-il qu'elle y
       reste quand la figure bouge. */
    const tire = await page.evaluate(() => {
        const a = window.app;
        const A = a.entities.find(e => e.label === 'A');
        A.x += 70; A.y -= 40;
        a.entities.forEach(e => { if (e.update) e.update(); });
        const O = a.entities.find(e => e.label === 'O');
        const som = ['A', 'B', 'C'].map(l => a.entities.find(e => e.label === l));
        return som.map(p => Math.round(Math.hypot(p.x - O.x, p.y - O.y)));
    });
    ck('  après avoir tiré A de 80 px, il l\'est encore',
       new Set(tire).size === 1, tire.join(' / '));

    console.log('\n=== la bibliothèque montre la même chose que le bâtisseur ===');
    const biblio = await page.evaluate(() => {
        const a = window.app;
        const ex = (window.GM_EXEMPLES || []).find(e => /circonscrit/i.test(e.n));
        if (!ex) return { erreur: 'entrée absente' };
        a.entities = []; a.historyPast = [];
        a.loadFromCompressedString(a.codeExemple(ex).split('~')[0]);
        const O = a.entities.find(e => e.label === 'O');
        const som = ['A', 'B', 'C'].map(l => a.entities.find(e => e instanceof Point && e.label === l));
        return { droites: a.entities.filter(e => e instanceof Line).length,
                 rayons: (O && som.every(Boolean))
                     ? som.map(p => Math.round(Math.hypot(p.x - O.x, p.y - O.y))) : [] };
    });
    ck('l\'exemple stocké porte lui aussi 3 médiatrices',
       biblio.droites === 3, biblio.droites + ' droite(s)');
    ck('  et son cercle est bien circonscrit',
       biblio.rayons.length === 3 && new Set(biblio.rayons).size === 1, biblio.rayons.join(' / '));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
