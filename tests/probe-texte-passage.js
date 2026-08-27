// Le style par passage : un mot en gras au milieu d'une phrase.
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

  // sélectionne les caractères [a,b) du champ, comme le ferait un double-clic
  const selectionner = (a, bb) => page.evaluate(({ a, bb }) => {
    const g = document.getElementById('ghostTextInput');
    const noeuds = []; const marcher = (n) => n.childNodes.forEach(e => {
      if (e.nodeType === 3) noeuds.push(e); else if (e.nodeType === 1) marcher(e); });
    marcher(g);
    let i = 0, deb = null, fin = null;
    noeuds.forEach(n => {
      const l = n.nodeValue.length;
      if (deb === null && a <= i + l) deb = { n, o: a - i };
      if (fin === null && bb <= i + l) fin = { n, o: bb - i };
      i += l;
    });
    const r = document.createRange();
    r.setStart(deb.n, deb.o); r.setEnd(fin.n, fin.o);
    const s = document.getSelection(); s.removeAllRanges(); s.addRange(r);
    g.focus();
  }, { a, bb });

  console.log('\n=== un seul mot en gras ===');
  await page.evaluate(() => { window.app.entities = []; window.app.historyPast = []; window.app.setTool('text'); });
  await page.mouse.click(box.x + 250, box.y + 250); await page.waitForTimeout(250);
  await page.click('#ghostTextInput');
  await page.keyboard.type('Le triangle est isocele');
  await selectionner(3, 11);                      // « triangle »
  await page.click('#btnTexteGras'); await page.waitForTimeout(120);
  const etatBouton = await page.evaluate(() => ({
    gras: document.getElementById('btnTexteGras').classList.contains('actif'),
    html: document.getElementById('ghostTextInput').innerHTML,
  }));
  console.log('  ' + JSON.stringify(etatBouton));
  ck('le bouton s\'allume sur la sélection', etatBouton.gras === true);
  ck('le champ porte une balise de gras', /<b>|font-weight/.test(etatBouton.html), etatBouton.html);

  await page.evaluate(() => window.app.validerTexteFantome()); await page.waitForTimeout(150);
  const t = await page.evaluate(() => {
    const t = window.app.entities.find(e => e.constructor.name === 'TextLabel');
    return { text: t.text, morceaux: t.morceaux, glob: [t.gras, t.italique, t.souligne] };
  });
  console.log('  ' + JSON.stringify(t));
  ck('le texte nu est intact', t.text === 'Le triangle est isocele', t.text);
  ck('trois passages, le deuxième en gras',
     t.morceaux && t.morceaux.length === 1 && t.morceaux[0].length === 3
     && t.morceaux[0][1].t === 'triangle' && t.morceaux[0][1].g === true
     && t.morceaux[0][0].g === false && t.morceaux[0][2].g === false,
     JSON.stringify(t.morceaux));
  ck('aucun drapeau global n\'a été posé', JSON.stringify(t.glob) === '[false,false,false]');

  console.log('\n=== le gras se voit, et ne décale pas la suite ===');
  const mes = await page.evaluate(() => {
    const a = window.app, t = a.entities.find(e => e.constructor.name === 'TextLabel');
    const em = t.emprise(a.ctx);
    const garde = t.morceaux;
    t.morceaux = null;                       // même texte, tout ordinaire
    const emNu = t.emprise(a.ctx);
    t.morceaux = garde;
    // l'abscisse de fin du dernier passage doit valoir la largeur totale
    let x = 0;
    t.morceaux[0].forEach(m => { a.ctx.font = t.policeMorceau(m); x += a.ctx.measureText(m.t).width; });
    return { larg: Math.round(em.largeur), largNu: Math.round(emNu.largeur), somme: Math.round(x) };
  });
  console.log('  ' + JSON.stringify(mes));
  ck('la ligne est plus large qu\'en tout maigre', mes.larg > mes.largNu, `${mes.largNu} → ${mes.larg}`);
  ck('l\'emprise vaut la somme des passages', mes.larg === mes.somme, `${mes.larg} vs ${mes.somme}`);

  console.log('\n=== aller-retour par le lien ===');
  const url = await page.evaluate(() => {
    const a = window.app;
    const u = a.getCompressedString();
    const brut = LZString.decompressFromEncodedURIComponent(u);
    a.clearCanvas(); a.loadFromCompressedString(u);
    const t = a.entities.find(e => e.constructor.name === 'TextLabel');
    return { ligne: brut.split('¦').find(l => l.indexOf('9;') === 0),
             text: t && t.text, morceaux: t && t.morceaux };
  });
  console.log('  ' + JSON.stringify(url));
  const codeUrl = url.ligne.split(';').pop();
  ck('le lien porte le code des plages, sans répéter le texte',
     /^\d[0-9a-z]*(\.\d[0-9a-z]*)+$/.test(codeUrl) && /[1-7]/.test(codeUrl) && codeUrl.length < 12,
     codeUrl);
  ck('les passages reviennent à l\'identique',
     JSON.stringify(url.morceaux) === JSON.stringify(t.morceaux), JSON.stringify(url.morceaux));

  console.log('\n=== réédition : le gras est toujours là ===');
  await page.evaluate(() => { window.app.setTool('move'); window.app.render(); });
  await page.mouse.dblclick(box.x + 255, box.y + 255); await page.waitForTimeout(300);
  const re = await page.evaluate(() => ({
    html: document.getElementById('ghostTextInput').innerHTML,
    texte: document.getElementById('ghostTextInput').innerText,
  }));
  console.log('  ' + JSON.stringify(re));
  ck('le champ retrouve le balisage', /<b>triangle<\/b>/.test(re.html), re.html);
  ck('et le texte complet', re.texte === 'Le triangle est isocele', re.texte);

  console.log('\n=== deux lignes, la première soulignée ===');
  await page.evaluate(() => { window.app.validerTexteFantome(); window.app.entities = []; window.app.setTool('text'); });
  await page.mouse.click(box.x + 250, box.y + 500); await page.waitForTimeout(250);
  await page.click('#ghostTextInput');
  await page.keyboard.type('Titre');
  await selectionner(0, 5);
  await page.click('#btnTexteSoul'); await page.waitForTimeout(100);
  await page.evaluate(() => {                       // curseur en fin, puis retour ligne
    const g = document.getElementById('ghostTextInput'); const s = document.getSelection();
    const r = document.createRange(); r.selectNodeContents(g); r.collapse(false);
    s.removeAllRanges(); s.addRange(r); g.focus();
  });
  await page.keyboard.press('Enter');
  // Le navigateur reconduit le souligné sur la ligne suivante, comme un traitement
  // de texte : on le coupe, ce qui est justement le geste à vérifier.
  await page.click('#btnTexteSoul'); await page.waitForTimeout(100);
  await page.keyboard.type('suite ordinaire');
  await page.evaluate(() => window.app.validerTexteFantome()); await page.waitForTimeout(150);
  const deux = await page.evaluate(() => {
    const t = window.app.entities.find(e => e.constructor.name === 'TextLabel');
    return { text: t.text, m: t.morceaux, em: Math.round(t.emprise(window.app.ctx).hauteur) };
  });
  console.log('  ' + JSON.stringify(deux));
  ck('deux lignes', deux.m && deux.m.length === 2, JSON.stringify(deux.m && deux.m.length));
  ck('la première est soulignée, la seconde non',
     deux.m && deux.m[0][0].s === true && deux.m[1][0].s === false, JSON.stringify(deux.m));
  ck('le texte nu porte le retour à la ligne', deux.text === 'Titre\nsuite ordinaire', JSON.stringify(deux.text));

  console.log('\n=== export SVG ===');
  const svg = await page.evaluate(() => window.app.generateSVGString(false, 'text'));
  const textes = svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [];
  console.log('  ' + textes.slice(0, 3).join('\n  '));
  ck('le souligné sort en filet', /<rect[^>]*fill="[^"]*"\/>/.test(svg));
  // Une balise <text> par LIGNE, ses passages en <tspan> : c'est le PDF qui
  // avance de ses propres largeurs, il ne peut plus y avoir de chevauchement.
  ck('les deux lignes sont exportées', textes.length >= 2, textes.length + ' lignes');
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
