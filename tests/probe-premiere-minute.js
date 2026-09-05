// La première minute. Une feuille vide et vingt-deux icônes muettes ne disaient
// pas ce que ce logiciel sait faire de mieux : écrire une phrase et voir la
// figure se construire. Pendant ce temps, la télécommande de rejeu — l'élément
// le plus intimidant de l'écran — s'affichait sur une feuille où il n'y avait
// rien à rejouer. Cette sonde garde l'échange : l'invitation quand c'est vide,
// la télécommande quand il y a quelque chose.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1600);

  const etat = () => page.evaluate(() => {
    const vu = (id) => {
      const e = document.getElementById(id);
      return e ? getComputedStyle(e).display !== 'none' : null;
    };
    return { ligne: vu('premiereLigne'), rejeu: vu('replayBar'),
             objets: window.app.entities.length,
             outil: window.app.currentTool };
  });

  console.log('\n=== une feuille vide invite, elle ne commande pas ===');
  let e = await etat();
  ck('la phrase d\'invitation est là', e.ligne === true, JSON.stringify(e));
  ck('et la télécommande de rejeu, non', e.rejeu === false, JSON.stringify(e));
  /* Ce n'est pas une décoration : la phrase doit être lisible et modifiable. */
  const champ = await page.evaluate(() => {
    const c = document.getElementById('premiereLigneChamp');
    const b = c.getBoundingClientRect();
    return { valeur: c.value, lisible: b.width > 200 && b.height > 20,
             modifiable: !c.readOnly && !c.disabled };
  });
  ck('elle porte une vraie phrase, modifiable',
     /triangle ABC/.test(champ.valeur) && champ.lisible && champ.modifiable,
     JSON.stringify(champ));

  console.log('\n=== elle ne mange pas le premier clic de qui veut dessiner ===');
  /* Posée au milieu de la feuille, elle prendrait le clic destiné au canevas.
     Seuls le champ et le bouton reçoivent les appuis ; le reste les laisse
     passer — et l'invitation s'efface dès qu'un outil est pris. */
  const clic = await page.evaluate(() => {
    const l = document.getElementById('premiereLigne');
    const b = l.getBoundingClientRect();
    // un point du bloc, mais hors du champ et du bouton
    const sous = document.elementFromPoint(b.x + 10, b.y + b.height - 4);
    return { pointerEvents: getComputedStyle(l).pointerEvents,
             dessous: sous ? (sous.id || sous.tagName) : null };
  });
  ck('le bloc laisse passer les clics', clic.pointerEvents === 'none', JSON.stringify(clic));
  /* Et rien ne doit la recouvrir : au doigt, la palette de style flotte en haut
     à droite de la feuille et masquait le bouton « Tracer ». */
  const libre = await page.evaluate(() => {
    const go = document.getElementById('premiereLigneGo').getBoundingClientRect();
    const d = document.elementFromPoint(go.x + go.width / 2, go.y + go.height / 2);
    return { dessus: d ? d.id : null };
  });
  ck('rien ne recouvre le bouton « Tracer »', libre.dessus === 'premiereLigneGo', JSON.stringify(libre));
  await page.evaluate(() => window.app.setTool('segment'));
  await page.waitForTimeout(200);
  e = await etat();
  ck('et prendre un outil l\'efface', e.ligne === false, JSON.stringify(e));
  await page.evaluate(() => window.app.setTool('move'));
  await page.waitForTimeout(200);
  ck('reposer l\'outil « déplacer » la ramène', (await etat()).ligne === true);

  console.log('\n=== la phrase trace, ET montre où elle vit ===');
  await page.click('#premiereLigneGo'); await page.waitForTimeout(900);
  const apres = await page.evaluate(() => {
    const c = window.app.consignesListe()[0] || {};
    const boite = document.getElementById('instructionBox');
    return { objets: window.app.entities.length, texte: c.texte, faite: !!c.faite,
             panneau: getComputedStyle(boite).display !== 'none',
             ligne: getComputedStyle(document.getElementById('premiereLigne')).display !== 'none',
             rejeu: getComputedStyle(document.getElementById('replayBar')).display !== 'none' };
  });
  console.log('  ' + JSON.stringify(apres));
  ck('la figure est tracée', apres.objets > 3, String(apres.objets));
  /* Le point de tout ceci : la phrase ne s'évapore pas. Elle se range dans le
     panneau des consignes, qui s'ouvre — on a fait le geste et appris où le
     refaire. Sans cela on aurait vu un tour de magie, pas une commande. */
  ck('la phrase est rangée dans les consignes, et marquée faite',
     /triangle ABC/.test(apres.texte || '') && apres.faite, JSON.stringify(apres.texte));
  ck('le panneau des consignes s\'est ouvert', apres.panneau);
  ck('l\'invitation a disparu', !apres.ligne);
  ck('et la télécommande est apparue', apres.rejeu);

  console.log('\n=== et l\'échange se refait dans l\'autre sens ===');
  await page.evaluate(() => { window.app.entities = []; window.app.setTool('move'); window.app.render(); });
  await page.waitForTimeout(250);
  e = await etat();
  ck('feuille revidée : l\'invitation revient, la télécommande repart',
     e.ligne === true && e.rejeu === false, JSON.stringify(e));

  console.log('\n=== le vocabulaire est celui d\'un professeur ===');
  /* « Zone de boucle », « Fin : MAX », « Pause » : la langue d'un banc de
     montage vidéo dans un logiciel de géométrie. */
  const mots = await page.evaluate(() => {
    window.app.executerConsigne('Trace un triangle ABC');
    window.app.render();
    const t = document.getElementById('timelineDrawer');
    if (t) t.style.display = 'block';
    const bar = document.getElementById('replayBar');
    return bar.innerText.replace(/\s+/g, ' ').trim();
  });
  console.log('  ' + JSON.stringify(mots));
  for (const mot of ['ZONE DE BOUCLE', 'MAX', 'Pause']) {
    ck(`« ${mot} » a disparu de la télécommande`, !new RegExp(mot).test(mots));
  }
  ck('et ce qui le remplace se lit', /REJOUER EN BOUCLE/.test(mots) && /la fin/.test(mots), mots);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
