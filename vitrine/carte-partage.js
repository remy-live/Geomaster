/* L'IMAGE QUI PARAÎT QUAND ON PARTAGE LE LIEN — 1200 × 630, le format attendu
   par Facebook, X, WhatsApp, LinkedIn et les ENT. Sans elle, le lien tombe nu
   dans la conversation.

   Le fond est une VRAIE figure photographiée (compasarcs.png, fabriqué par
   cartes.js) : il faut donc relancer cartes.js AVANT celui-ci.

   Usage : node vitrine/carte-partage.js
     GM_CHROME   le navigateur (celui de Playwright par défaut)
     GM_VITRINE  où lire et écrire (le dossier vitrine/ par défaut) */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = (process.env.GM_VITRINE || __dirname).replace(/\/*$/, '/');
void path;
(async () => {
    const b64 = fs.readFileSync(OUT + 'compasarcs.png').toString('base64');
    const html = `<!doctype html><meta charset="utf-8"><style>
      @font-face{font-family:x}
      html,body{margin:0;width:1200px;height:630px;overflow:hidden;
        font-family:'Segoe UI',system-ui,sans-serif}
      .f{position:absolute;inset:0;background:#fff}
      .f img{position:absolute;left:300px;top:-56px;width:1180px}
      /* LE VOILE DOIT COUVRIR TOUTE LA COLONNE DE TEXTE. Trop court, le
         paragraphe tombait sur les médiatrices et devenait illisible — on
         montrait une vitrine qu'on ne peut pas lire. */
      .v{position:absolute;inset:0;
         background:linear-gradient(97deg,#fff 0%,#fff 46%,
           rgba(255,255,255,.55) 56%,rgba(255,255,255,0) 68%)}
      .t{position:absolute;left:62px;top:96px;width:560px}
      h1{margin:0;font-size:62px;letter-spacing:-1.5px;color:#17313f;font-weight:800}
      h1 span{color:#2980b9}
      ul{margin:26px 0 0;padding:0;list-style:none}
      li{margin:0 0 19px;font-size:21px;line-height:1.42;color:#4a6373;
         padding-left:26px;position:relative}
      li::before{content:'';position:absolute;left:0;top:9px;width:11px;height:11px;
                 border-radius:50%;background:#2980b9}
      li b{color:#17313f;font-weight:700}
      li em{font-style:normal;color:#17313f;background:#eef3f6;border-radius:4px;
            padding:1px 5px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
      .u{position:absolute;left:62px;bottom:52px;font-size:20px;color:#2980b9;font-weight:700}
      .p{position:absolute;left:62px;bottom:94px;display:flex;gap:8px}
      .p i{font-style:normal;font-size:14px;color:#5b7383;background:#eef3f6;
           border-radius:20px;padding:6px 14px;font-weight:600}
    </style>
    <div class="f"><img src="data:image/png;base64,${b64}"><div class="v"></div></div>
    <div class="t">
      <h1>Géo<span>Master</span></h1>
      <ul>
        <li><b>La consigne.</b> On écrit <em>« Trace un triangle ABC tel que
            AB&nbsp;=&nbsp;7&nbsp;cm »</em>. Il le trace.</li>
        <li><b>L'animation.</b> Puis il le refait au compas, étape par
            étape — ou pas à pas, à votre rythme.</li>
        <li><b>Les instruments.</b> Et le compas, on peut le prendre
            soi-même : le planter, l'écarter, tourner.</li>
      </ul>
    </div>
    <div class="p"><i>6e → 3e</i><i>Un seul fichier</i><i>Hors connexion</i><i>Gratuit</i></div>
    <div class="u">remy-live.github.io/Geomaster</div>`;
    const nav = await chromium.launch({ executablePath: process.env.GM_CHROME || undefined });
    const page = await nav.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
    await page.setContent(html);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: OUT + 'partage.png' });
    await nav.close();
    console.log('partage.png  ' + Math.round(fs.statSync(OUT + 'partage.png').size / 1024) + ' ko');
})();
