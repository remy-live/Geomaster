// GéoMaster doit tourner SANS AUCUN RÉSEAU, ouvert par un double-clic sur le
// fichier. Ici toute requête qui n'est pas le fichier lui-même est coupée, et
// l'on refait la chaîne complète : dessiner, reconnaître, importer un PDF,
// exporter en PDF et en SVG, partager, afficher le QR code.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const FIXTURES = path.resolve(__dirname, 'fixtures') + '/';
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  /* La coupure. Seuls passent le fichier lui-même et ce qu'il fabrique en
     mémoire (data:, blob:) — c'est exactement la situation d'une salle sans
     internet, ou d'une clé USB. Toute autre requête est notée ET refusée : on
     ne veut pas d'un logiciel qui « marche quand même » parce qu'un cache
     traînait. */
  const dehors = [];
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    dehors.push(u);
    return route.abort();
  });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  console.log('\n=== la page s\'ouvre ===');
  const base = await page.evaluate(() => ({
    app: !!window.app, canvas: !!document.getElementById('geoCanvas'),
    protocole: window.location.protocol,
    // la police embarquée doit être là, sinon le PDF ne ressemblera pas à l'écran
    police: !!window.GM_POLICE_PILE,
  }));
  console.log('  ' + JSON.stringify(base));
  ck('l\'application démarre depuis un fichier local', base.app && base.canvas && base.protocole === 'file:');
  ck('la police embarquée est en place', base.police === true);

  console.log('\n=== dessiner et reconnaître ===');
  const dessin = await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.saveState(); app.setTool('magic_croquis');
    const co = [[250,300],[650,300],[650,500],[250,500],[250,300]], pts = [];
    for (let i = 0; i < 4; i++) { const [ax,ay] = co[i], [bx,by] = co[i+1];
      for (let k = 0; k <= 14; k++) pts.push({ x: ax+(bx-ax)*k/14, y: ay+(by-ay)*k/14 }); }
    ev('pointerdown', pts[0], 1);
    for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i], 1);
    ev('pointerup', pts[pts.length-1], 0);
    const quoi = document.getElementById('croquisQuoi').textContent;
    app.repondreChoixCroquis(false);
    return { quoi, points: app.entities.filter(e => e.constructor.name === 'Point').length };
  });
  console.log('  ' + JSON.stringify(dessin));
  ck('le rectangle à main levée est reconnu', /rectangle/i.test(dessin.quoi), dessin.quoi);
  ck('et construit', dessin.points === 4, String(dessin.points));

  console.log('\n=== importer un PDF (pdf.js et son worker) ===');
  const b64 = fs.readFileSync(FIXTURES + 'trois.pdf').toString('base64');
  await page.evaluate(async (b64) => {
    const bin = atob(b64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    await window.app.handleFileUpload(new File([u], 'trois.pdf', { type: 'application/pdf' }));
  }, b64);
  await page.waitForTimeout(2500);
  const modale = await page.evaluate(() => ({
    aff: getComputedStyle(document.getElementById('pdfSelectorModal')).display,
    info: document.getElementById('pdfPageInfo').textContent }));
  ck('les trois pages du PDF sont lues', modale.aff !== 'none' && /\/\s*3/.test(modale.info), modale.info);
  await page.evaluate(() => app.changePdfPage(1)); await page.waitForTimeout(600);
  await page.evaluate(() => app.confirmPdfPage()); await page.waitForTimeout(2500);
  const fond = await page.evaluate(() => {
    const g = window.app.bgImage;
    if (!g) return { fond: false };
    const c = document.createElement('canvas'); c.width = c.height = 60;
    const cx = c.getContext('2d');
    try { cx.drawImage(g.img || g.image || g.canvas, 0, 0, 60, 60); } catch (e) { return { fond: true, err: String(e) }; }
    const d = cx.getImageData(0, 0, 60, 60).data;
    let encre = 0; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 10 && d[i] < 200) encre++;
    return { fond: true, largeur: Math.round(g.width), encre };
  });
  console.log('  ' + JSON.stringify(fond));
  ck('la page choisie est posée en fond, avec ses pixels', fond.fond && fond.encre > 10, JSON.stringify(fond));

  console.log('\n=== exporter ===');
  /* Ces deux exports injectent les 1,8 Mo de bibliothèques laissées en
     type="text/plain" dans le fichier. C'est le moment de vérité : si elles
     étaient allées les chercher dehors, rien ne s'écrirait ici. */
  const pdf = await page.evaluate(async () => {
    try { await window.app.executeExport('pdf', false, 'text'); }
    catch (e) { return { err: String(e) }; }
    return { jsPDF: typeof window.jspdf, svg2pdf: typeof window.svg2pdf };
  });
  console.log('  PDF : ' + JSON.stringify(pdf));
  ck('l\'export PDF aboutit', !pdf.err && pdf.jsPDF === 'object' && pdf.svg2pdf === 'object', JSON.stringify(pdf));
  const svg = await page.evaluate(async () => {
    try { await window.app.executeExport('svg', false, 'text'); return { ok: true }; }
    catch (e) { return { err: String(e) }; }
  });
  ck('l\'export SVG aussi', svg.ok === true, JSON.stringify(svg));

  console.log('\n=== partager, et le dire honnêtement ===');
  const part = await page.evaluate(() => {
    window.app.afficherQRCode();
    const cv = document.getElementById('qrCanvas');
    let encre = 0;
    if (cv && cv.width) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 100) encre++; }
    const r = { lien: document.getElementById('qrLien').textContent,
                info: document.getElementById('qrInfo').innerHTML, modules: cv ? cv.width : 0, encre };
    document.getElementById('qrModal').style.display = 'none';
    return r;
  });
  console.log('  lien : ' + part.lien.slice(0, 70) + '…');
  ck('le lien encode bien la figure', /\?fig=/.test(part.lien) && part.lien.length > 60);
  ck('le QR code est dessiné', part.modules > 100 && part.encre > 1000, `${part.modules}px, ${part.encre} px noirs`);
  ck('et il prévient que ce lien est LOCAL', /local/i.test(part.info), part.info.slice(-90));

  /* `index_offline.html` est le fichier qu'on emporte : la copie exacte de
     `index.html`, sous un nom qui dit à quoi elle sert. Elle n'a aucune raison
     d'en différer — et si elle en diffère, c'est qu'on a oublié de la refaire
     après une modification, et qu'elle est donc périmée sans le dire. Git ne
     stocke qu'un seul objet pour deux fichiers identiques : cette copie ne pèse
     rien tant qu'elle est juste. */
  console.log('\n=== la copie hors connexion est-elle à jour ? ===');
  const crypto = require('crypto');
  const somme = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
  const copie = path.resolve(__dirname, '..', 'index_offline.html');
  const existe = fs.existsSync(copie);
  ck('index_offline.html existe', existe);
  if (existe) {
    const a = somme(path.resolve(__dirname, '..', 'index.html')), c = somme(copie);
    console.log(`  index.html ${a} · index_offline.html ${c}`);
    ck('il est identique à index.html (sinon : cp index.html index_offline.html)',
       a === c, a === c ? '' : `${a} ≠ ${c}`);
  }

  console.log('\n=== le verdict ===');
  console.log('  requêtes réseau tentées : ' + (dehors.length ? JSON.stringify(dehors.slice(0, 5)) : 'aucune'));
  ck('AUCUNE requête n\'est sortie de la page', dehors.length === 0, dehors.slice(0, 3).join(' | '));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
