/* LE MENU CONTEXTUEL SE DÉPLIE, COMME LA PALETTE.
 *
 * « Rajoute aux menus contextuels juste une petite flèche comme le menu de
 *   style, pour étendre le menu contextuel à toutes les options. »
 *
 * CE QUI PRÉCÈDE CETTE FLÈCHE. Le menu du point faisait 352 px, celui du milieu
 * 437 — « un peu lourd ». Trois rangées en sont parties : le cadran de position
 * du nom, croix/disque/pixel, et la taille du nom. Le menu est tombé à 194 px.
 * Mais « ça me sert très peu » n'est pas « jamais » : la flèche rend ces
 * réglages sans les imposer.
 *
 * TROIS CHOSES SE VÉRIFIENT, ET LA TROISIÈME EST CELLE QU'ON OUBLIE.
 *
 * 1. LE MENU NAÎT REPLIÉ. C'est l'état qu'on veut quatre-vingt-dix-neuf fois sur
 *    cent, et il se souvient du dernier choix d'une ouverture à l'autre — même
 *    mécanique que la palette, et pour la même raison : c'est une habitude de
 *    travail, pas un réglage à reprendre à chaque objet.
 *
 * 2. CE QUI SE DÉPLIE FONCTIONNE. Un bouton sans action vaut moins que pas de
 *    bouton : la sonde ne regarde pas si les rangées PARAISSENT, elle CLIQUE et
 *    vérifie que le point change de style et que son nom change de taille.
 *
 * 3. LA FLÈCHE NE PARAÎT QUE S'IL Y A QUELQUE CHOSE À DÉPLIER. Un segment n'a
 *    pas de rangée repliée ; un chevron qui n'ouvre rien serait pire que pas de
 *    chevron du tout.
 *
 * LE CADRAN DE POSITION EST REVENU — DERRIÈRE LE PLI, et sur demande. Il avait
 * été supprimé avec le reste quand le menu pesait 437 px, au motif que le nom se
 * déplace au doigt (voir probe-nom-au-doigt.js). Mais viser une lettre de 14 px
 * au tableau n'est pas viser un cadran de 60, et les deux gestes ne se valent
 * pas. Il coûte 79 px, tous derrière le pli : 334 -> 413 px déplié, 232 replié,
 * inchangé. La sonde ne regarde pas s'il PARAÎT — elle le TIRE, et vérifie que
 * le nom se déplace LÀ OÙ IL EST PEINT, en piégeant fillText.
 *
 * ET UN MENU OUVERT SUR UN FANTÔME. Mesuré en remettant le cadran : après un
 * Ctrl+Z, « entities.includes(selectedObject) » rend FALSE — deserialize ne
 * modifie pas les objets, il en fabrique de nouveaux. Le menu restait ouvert sur
 * l'objet disparu, et le cadran montrait son angle pendant que le nom, à
 * l'écran, était revenu au sien : le logiciel affichait un état qui n'existait
 * plus. Le menu se referme donc sur une annulation. C'était vrai de TOUT le menu
 * avant le cadran ; c'est le cadran, qui montre un état au lieu de le subir, qui
 * l'a rendu visible.
 *
 * LA FLÈCHE EST DEVENUE UNE BARRE. « Je trouve ça un peu moche, la petite
 * flèche » — et au tableau, un chevron de 20 px dans un coin se rate. Le pli est
 * maintenant une barre pleine largeur en bas du menu, chevron dessiné au centre :
 * cible mesurée 168 × 30 px au lieu de 20 × 20 — toute la largeur du menu moins
 * ses marges. Elle coûte 38 px de hauteur (194 → 232 replié, 296 → 334 déplié) ;
 * c'est le prix assumé d'une cible qu'on ne rate pas, et la sonde mesure donc
 * la LARGEUR de la barre autant que la hauteur du menu — c'est la largeur qui
 * est l'objet du changement.
 *
 * UN PIÈGE DE CSS, mesuré et noté pour qui relira : « .ctx-plus { display:none } »
 * ne repliait RIEN. La règle « .menu-row { display:flex } » est déclarée plus bas
 * dans la feuille, à spécificité égale, et c'est la dernière qui gagne — le menu
 * restait à 296 px au lieu de 194. Le sélecteur porte donc « #contextMenu »
 * devant, et ce n'est pas du zèle.
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
    const ctx = await nav.newContext({ viewport: { width: 1400, height: 1100 } });
    const page = await ctx.newPage();
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        try {
            localStorage.removeItem('geoMaster_backup');
            localStorage.removeItem('gm_menu_replie');
        } catch (e) { void e; }
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });

    const ouvrir = async (quoi) => {
        const c = await page.evaluate((quoi) => {
            const a = window.app;
            a.entities = []; a.historyPast = []; a.historyFuture = [];
            a.view = { zoom: 1, x: 0, y: 0 };
            if (a.cslOublier) a.cslOublier();
            let o;
            if (quoi === 'point') { o = new Point(500, 400, 'A'); a.addEntity(o); }
            else {
                a.executerConsigneAvec('Trace le segment [AB]', false);
                o = a.entities.find(e => e instanceof Segment);
            }
            a.saveState();
            a.selectedObject = o;
            const p = (o instanceof Point) ? o : { x: (o.p1.x + o.p2.x) / 2, y: (o.p1.y + o.p2.y) / 2 };
            return { x: p.x, y: p.y };
        }, quoi);
        await page.evaluate((c) => {
            const a = window.app, b = a.canvas.getBoundingClientRect();
            a.canvas.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
                clientX: b.left + c.x, clientY: b.top + c.y, button: 2 }));
        }, c);
        await page.waitForTimeout(300);
    };
    const etat = () => page.evaluate(() => {
        const m = document.getElementById('contextMenu');
        const b = document.getElementById('btnPliageMenu');
        const bb = b ? b.getBoundingClientRect() : null;
        return { h: Math.round(m.getBoundingClientRect().height),
                 deplie: m.classList.contains('deplie'),
                 fleche: !!(bb && bb.height > 1),
                 barreL: bb ? Math.round(bb.width) : 0,
                 menuL: Math.round(m.getBoundingClientRect().width),
                 plus: [...m.querySelectorAll('.ctx-plus')]
                        .filter(e => e.getBoundingClientRect().height > 2).length };
    });

    /* ============================================================
       1. REPLIÉ À L'OUVERTURE, DÉPLIÉ D'UN APPUI
       ============================================================ */
    console.log('\n=== le menu du point naît replié ===');
    await ouvrir('point');
    let e = await etat();
    /* 232 px : les 194 px d'avant, plus les 38 px de la barre de pli. */
    ck('il est court', e.h < 245, e.h + ' px');
    ck('  rien n\'est déplié', !e.deplie && e.plus === 0, e.plus + ' rangée(s) visible(s)');
    ck('  mais la flèche est là', e.fleche);
    ck('  et elle tient toute la largeur', e.barreL > e.menuL - 30,
       e.barreL + ' px de barre pour ' + e.menuL + ' px de menu');

    console.log('\n=== un appui, et tout paraît ===');
    await page.click('#btnPliageMenu');
    await page.waitForTimeout(250);
    e = await etat();
    ck('le menu s\'allonge', e.deplie && e.h > 260, e.h + ' px');
    ck('  les trois rangées repliées sont là', e.plus === 3, e.plus + ' rangée(s)');

    /* ============================================================
       2. ET CE QUI PARAÎT FONCTIONNE
       Un bouton sans action vaut moins que pas de bouton.
       ============================================================ */
    console.log('\n=== ce qu\'on déplie agit vraiment ===');
    const avant = await page.evaluate(() => {
        const A = window.app.entities[0];
        return { style: A.pointStyle || 'cross', taille: A.fontSize || 14 };
    });
    await page.click('#rowPointStyle .icon-btn:nth-child(2)');   /* disque */
    await page.waitForTimeout(150);
    await page.click('#rowTextProps .icon-btn:nth-child(3)');    /* agrandir */
    await page.waitForTimeout(150);
    const apres = await page.evaluate(() => {
        const A = window.app.entities[0];
        return { style: A.pointStyle || 'cross', taille: A.fontSize || 14 };
    });
    ck('le style du point a changé', apres.style === 'dot',
       `${avant.style} → ${apres.style}`);
    ck('  et la taille du nom aussi', apres.taille > avant.taille,
       `${avant.taille} → ${apres.taille}`);

    /* ============================================================
       3. PAS DE FLÈCHE QUAND IL N'Y A RIEN À DÉPLIER
       ============================================================ */
    console.log('\n=== un segment n\'a rien à déplier ===');
    await ouvrir('segment');
    e = await etat();
    ck('aucune flèche chez lui', !e.fleche, JSON.stringify(e));
    ck('  et aucune rangée repliée n\'apparaît', e.plus === 0, e.plus + '');

    /* ============================================================
       4. LE CHOIX SE RETIENT — ET LE CADRAN NE REVIENT PAS
       ============================================================ */
    console.log('\n=== on y revient comme on l\'a laissé ===');
    await page.reload();
    await page.waitForFunction(() => window.app);
    await page.evaluate(() => {
        const m = document.getElementById('customModal');
        if (m) m.style.display = 'none';
        window.app.checkAutoSave = () => {};
    });
    await ouvrir('point');
    e = await etat();
    ck('déplié hier, déplié aujourd\'hui', e.deplie && e.plus === 3,
       `${e.h} px, ${e.plus} rangée(s)`);
    ck('  et le cadran est du voyage', await page.evaluate(
        () => document.getElementById('labelPosBox').getBoundingClientRect().height > 2));

    /* ============================================================
       5. LE CADRAN DÉPLACE LE NOM LÀ OÙ IL EST PEINT
       Pas « labelAngle a changé » : où la lettre tombe sur la feuille. On piège
       fillText, parce que c'est le seul endroit où le logiciel dit la vérité.
       ============================================================ */
    console.log('\n=== le cadran déplace le nom pour de vrai ===');
    const ouEstLeNom = () => page.evaluate(() => {
        const c = window.app.ctx, vrai = c.fillText.bind(c);
        let vu = null;
        c.fillText = function (t, x, y) { if (t === 'A') vu = { x: Math.round(x), y: Math.round(y) }; return vrai(t, x, y); };
        window.app.render();
        c.fillText = vrai;
        return vu;
    });
    const nomAvant = await ouEstLeNom();
    const etats0 = await page.evaluate(() => window.app.historyPast.length);
    const boite = await page.evaluate(() => {
        const r = document.getElementById('labelPosBox').getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, c: Math.round(r.width) };
    });
    ck('  le cadran se vise au doigt', boite.c >= 56, boite.c + ' px de côté');
    await page.mouse.move(boite.cx, boite.cy - 20);      /* le bouton part en haut */
    await page.mouse.down();
    await page.mouse.move(boite.cx + 40, boite.cy, { steps: 6 });   /* on l'amène à droite */
    await page.mouse.up();
    await page.waitForTimeout(200);
    const nomApres = await ouEstLeNom();
    ck('le nom a bougé sur la feuille',
       nomAvant && nomApres && (nomApres.x !== nomAvant.x || nomApres.y !== nomAvant.y),
       JSON.stringify(nomAvant) + ' -> ' + JSON.stringify(nomApres));
    ck('  et il est parti à DROITE du point, comme le bouton',
       nomApres.x > nomAvant.x && nomApres.y > nomAvant.y,
       'dx ' + (nomApres.x - nomAvant.x) + ', dy ' + (nomApres.y - nomAvant.y));

    /* un glissement = un Ctrl+Z, comme tout autre geste */
    const etats1 = await page.evaluate(() => window.app.historyPast.length);
    ck('  un glissement vaut un état, pas six', etats1 === etats0 + 1,
       etats0 + ' -> ' + etats1 + ' état(s)');
    await page.evaluate(() => window.app.undo());
    await page.waitForTimeout(200);
    const nomRevenu = await ouEstLeNom();
    ck('  et un Ctrl+Z le ramène', nomRevenu && nomRevenu.x === nomAvant.x && nomRevenu.y === nomAvant.y,
       JSON.stringify(nomRevenu));

    /* ============================================================
       6. ET LE MENU NE RESTE PAS OUVERT SUR UN OBJET DISPARU
       ============================================================ */
    const fantome = await page.evaluate(() => {
        const a = window.app;
        return { ouvert: document.getElementById('contextMenu').style.display !== 'none',
                 choisi: !!a.selectedObject,
                 orphelin: !!(a.selectedObject && !a.entities.includes(a.selectedObject)) };
    });
    ck('le menu se referme sur une annulation', !fantome.ouvert && !fantome.orphelin,
       JSON.stringify(fantome));

    ck('aucune erreur JS', erreurs.length === 0, erreurs.slice(0, 2).join(' | '));

    await nav.close();
    console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
    process.exit(fail ? 1 : 0);
})();
