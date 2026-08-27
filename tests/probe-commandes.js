// Aucune commande de l'interface ne doit pointer dans le vide.
// C'est le garde-fou contre le bois mort : un bouton dont la fonction a été
// renommée ou jamais écrite est trouvé ici, pas par l'utilisateur.
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push('page: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erreurs.push('console: ' + m.text().slice(0, 140)); });
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(PAGE); await page.waitForTimeout(2000);

  console.log('\n=== au chargement ===');
  ck('aucune erreur au démarrage', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
  erreurs.length = 0;

  console.log('\n=== chaque commande appelle une fonction qui existe ===');
  const mortes = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('[onclick], [onpointerdown]').forEach((e) => {
      const code = (e.getAttribute('onclick') || '') + ';' + (e.getAttribute('onpointerdown') || '');
      [...code.matchAll(/\bapp\.([A-Za-z_$][\w$]*)\s*\(/g)].forEach((m) => {
        if (typeof window.app[m[1]] !== 'function')
          out.push(m[1] + ' (sur « ' + (e.id || (e.innerText || '').trim().slice(0, 18)) + ' »)');
      });
    });
    return out;
  });
  ck('aucun appel vers une méthode inexistante', mortes.length === 0, mortes.join(', '));

  console.log('\n=== les identifiants sont uniques ===');
  const dup = await page.evaluate(() => {
    const vus = {}, dup = [];
    document.querySelectorAll('[id]').forEach(e => { vus[e.id] = (vus[e.id] || 0) + 1; });
    Object.keys(vus).forEach(k => { if (vus[k] > 1) dup.push(k + ' ×' + vus[k]); });
    return dup;
  });
  ck('aucun identifiant en double', dup.length === 0, dup.join(', '));

  console.log('\n=== on clique sur tout, rien ne doit se casser ===');
  await page.evaluate(() => {
    window.print = () => {};
    window.open = () => null;
    HTMLAnchorElement.prototype.click = function () { /* pas de téléchargement pendant le test */ };
  });
  const cibles = await page.evaluate(() => {
    const vus = [];
    document.querySelectorAll('[onclick], [onpointerdown]').forEach((e, i) => {
      const code = (e.getAttribute('onclick') || '') + ' ' + (e.getAttribute('onpointerdown') || '');
      // on laisse de côté ce qui détruirait la session de test elle-même
      if (/reload|location\s*=|clearCanvas|newProject|reset/i.test(code)) return;
      e.setAttribute('data-audit', 'a' + i);
      vus.push({ sel: 'a' + i, code: code.trim().slice(0, 70),
                 nom: e.id || (e.innerText || '').trim().slice(0, 20) });
    });
    return vus;
  });
  const casses = [];
  for (const c of cibles) {
    erreurs.length = 0;
    await page.evaluate((sel) => {
      const e = document.querySelector(`[data-audit="${sel}"]`);
      if (!e) return;
      const oc = e.getAttribute('onclick'), op = e.getAttribute('onpointerdown');
      try {
        if (op) new Function('event', op).call(e, new PointerEvent('pointerdown', { bubbles: true }));
        if (oc) new Function('event', oc).call(e, new MouseEvent('click', { bubbles: true }));
      } catch (err) { (window.__err = window.__err || []).push(sel + ' :: ' + err.message); }
    }, c.sel);
    await page.waitForTimeout(25);
    const jete = await page.evaluate(() => { const e = window.__err || []; window.__err = []; return e; });
    if (jete.length || erreurs.length) casses.push({ ...c, quoi: [...jete, ...erreurs] });
  }
  casses.forEach(x => console.log(`      ✗ ${x.nom} — ${x.code}\n        ${x.quoi.join(' | ').slice(0, 160)}`));
  ck(`les ${cibles.length} commandes s'exécutent sans erreur`, casses.length === 0,
     casses.length ? casses.length + ' en échec' : '');
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
