// Gras, italique, souligné et encadré : à l'écran, à la relecture, dans le lien.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);
  const box = await page.evaluate(() => { const r = window.app.canvas.getBoundingClientRect(); return { x: r.left, y: r.top }; });

  const ecrire = async (texte, styles, taille) => {
    await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; window.app.setTool('text'); });
    await page.mouse.click(box.x + 300, box.y + 300); await page.waitForTimeout(220);
    if (taille) await page.fill('#ghostTextSize', String(taille));
    for (const s of styles) { await page.click('#btn' + s); await page.waitForTimeout(60); }
    await page.click('#ghostTextInput');
    await page.keyboard.type(texte);
    await page.waitForTimeout(120);
  };

  console.log('\n=== ce qu\'on voit en tapant est ce qu\'on obtient ===');
  await ecrire('Propriete', ['TexteGras', 'TexteSoul'], 24);
  const pendant = await page.evaluate(() => {
    const g = document.getElementById('ghostTextInput');
    return { html: g.innerHTML,
             actifs: ['btnTexteGras','btnTexteItal','btnTexteSoul','btnTexteCadre']
               .filter(i => document.getElementById(i).classList.contains('actif')) };
  });
  console.log('  ' + JSON.stringify(pendant));
  ck('le champ porte le gras', /<b>/.test(pendant.html), pendant.html);
  ck('le champ porte le souligné', /<u>/.test(pendant.html), pendant.html);
  ck('les deux boutons sont allumés, les autres non',
     JSON.stringify(pendant.actifs) === '["btnTexteGras","btnTexteSoul"]', JSON.stringify(pendant.actifs));
  await page.evaluate(() => window.app.validerTexteFantome()); await page.waitForTimeout(150);
  const cree = await page.evaluate(() => {
    const t = window.app.entities.find(e => e.constructor.name === 'TextLabel');
    const m = t.lignesRiches()[0][0];
    return { text: t.text, cadre: t.cadre, m, police: t.policeMorceau(m) };
  });
  console.log('  ' + JSON.stringify(cree));
  ck('le passage créé porte le même style',
     cree.m.g === true && cree.m.s === true && cree.m.i === false && cree.cadre === false,
     JSON.stringify(cree.m));
  ck('sa police est préfixée « bold »', /^bold /.test(cree.police), cree.police);

  console.log('\n=== le gras se voit vraiment à l\'écran ===');
  const encre = await page.evaluate(() => {
    const a = window.app;
    const t = a.entities.find(e => e.constructor.name === 'TextLabel');
    const compter = () => { a.render();
      const d = a.ctx.getImageData(250, 250, 500, 200).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return n; };
    const avecGras = compter();
    const garde = t.morceaux;
    t.morceaux = null; t.gras = false; t.souligne = false;   // le même texte, tout nu
    const sansRien = compter();
    t.morceaux = garde;
    const em = t.emprise(a.ctx);
    t.cadre = true;
    const avecCadre = compter();
    const emCadre = t.emprise(a.ctx);
    return { avecGras, sansRien, avecCadre, larg: Math.round(em.largeur), largCadre: Math.round(emCadre.largeur),
             marge: Math.round(t.margeCadre()) };
  });
  console.log('  ' + JSON.stringify(encre));
  ck('le gras et le souligné ajoutent de l\'encre', encre.avecGras > encre.sansRien + 100,
     `${encre.sansRien} → ${encre.avecGras}`);
  ck('l\'encadré en ajoute encore', encre.avecCadre > encre.avecGras + 300, `${encre.avecCadre}`);
  ck('l\'emprise du texte ne change pas avec l\'encadré', encre.larg === encre.largCadre,
     `${encre.larg} vs ${encre.largCadre}`);
  ck('la marge de l\'encadré suit la taille', encre.marge === Math.round(24 * 0.45), encre.marge + 'px');

  console.log('\n=== la zone sensible englobe la bordure ===');
  const touche = await page.evaluate(() => {
    const t = window.app.entities.find(e => e.constructor.name === 'TextLabel');
    t.cadre = true; const mg = t.margeCadre();
    const surBord = t.isNear(t.x - mg + 1, t.y - mg + 1);
    t.cadre = false; const sansCadre = t.isNear(t.x - mg + 1, t.y - mg + 1);
    t.cadre = true;
    return { surBord, sansCadre };
  });
  ck('on attrape le texte par sa bordure', touche.surBord === true);

  console.log('\n=== aller-retour par le lien ===');
  const url = await page.evaluate(() => {
    const a = window.app;
    const u = a.getCompressedString();
    const brut = LZString.decompressFromEncodedURIComponent(u);
    a.clearCanvas(); a.loadFromCompressedString(u);
    const t = a.entities.find(e => e.constructor.name === 'TextLabel');
    return { ligne: brut.split('¦').find(l => l.indexOf('9;') === 0),
             relu: t ? { text: t.text, m: t.lignesRiches()[0][0],
                         cadre: t.cadre, fond: t.fond, taille: t.fontSize } : null };
  });
  console.log('  ' + JSON.stringify(url));
  ck('le style survit au lien', url.relu && url.relu.m && url.relu.m.g && url.relu.m.s
     && !url.relu.m.i && url.relu.cadre, JSON.stringify(url.relu));
  ck('la taille et le texte aussi', url.relu && url.relu.taille === 24 && url.relu.text === 'Propriete');

  console.log('\n=== un texte ordinaire ne paie rien dans le lien ===');
  const nu = await page.evaluate(() => {
    const a = window.app;
    a.clearCanvas();
    const t = new TextLabel(100, 100, 'Simple');
    a.addEntity(t);
    const brut = LZString.decompressFromEncodedURIComponent(a.getCompressedString());
    return brut.split('¦').find(l => l.indexOf('9;') === 0);
  });
  console.log('  ' + JSON.stringify(nu));
  ck('aucun champ de style ajouté', nu.split(';').length <= 4, nu);

  console.log('\n=== réédition : le style revient ===');
  await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const t = new TextLabel(300, 300, 'Encadre');
    t.fontSize = 22; t.italique = true; t.cadre = true; t.fond = '#c8e6c9';
    a.addEntity(t); a.setTool('move'); a.render();
  });
  await page.mouse.dblclick(box.x + 310, box.y + 310); await page.waitForTimeout(300);
  const re = await page.evaluate(() => ({
    actifs: ['btnTexteGras','btnTexteItal','btnTexteSoul','btnTexteCadre']
      .filter(i => document.getElementById(i).classList.contains('actif')),
    fondVisible: getComputedStyle(document.getElementById('ghostTextFond')).display,
    fondValeur: document.getElementById('ghostTextFond').value,
    // le style vit maintenant DANS le contenu, plus sur le conteneur : un texte
    // enregistré à l'ancienne (drapeau d'ensemble) se rouvre balisé
    html: document.getElementById('ghostTextInput').innerHTML,
    dedans: (() => { const e = document.querySelector('#ghostTextInput i');
      return e ? getComputedStyle(e).fontStyle : 'aucun'; })(),
  }));
  console.log('  ' + JSON.stringify(re));
  ck('italique et encadré sont rallumés',
     JSON.stringify(re.actifs) === '["btnTexteItal","btnTexteCadre"]', JSON.stringify(re.actifs));
  ck('le sélecteur de fond apparaît, à la bonne couleur',
     re.fondVisible !== 'none' && re.fondValeur === '#c8e6c9', re.fondValeur);
  ck('le contenu du champ est en italique', re.dedans === 'italic', re.html);

  console.log('\n=== export SVG ===');
  const svg = await page.evaluate(() => {
    const a = window.app;
    a.clearCanvas();
    const t = new TextLabel(200, 200, 'Titre');
    t.gras = true; t.souligne = true; t.cadre = true; t.fond = '#ffe0b2'; t.fontSize = 20;
    a.addEntity(t);
    return a.generateSVGString(false, 'text');
  });
  if (svg) {
    ck('le gras part en font-weight', /font-weight="bold"/.test(svg));
    ck('l\'encadré part en rect', /<rect[^>]*fill="#ffe0b2"/.test(svg));
    ck('le souligné est un filet', (svg.match(/<rect/g) || []).length >= 2);
    const bloc = svg.match(/<rect[^>]*fill="#ffe0b2"[^>]*>/);
    console.log('  ' + (bloc ? bloc[0] : '(pas de cadre)'));
    console.log('  ' + (svg.match(/<text[^>]*>Titre<\/text>/) || ['(pas de texte)'])[0]);
  } else console.log('  (pas de générateur SVG accessible depuis le test)');

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
