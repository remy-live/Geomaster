// L'EXPORT TikZ. Une image dans un document LaTeX reste une image : on ne peut
// plus ni la mettre à l'échelle du texte, ni corriger un nom de point. Un dessin
// TikZ, si.
//
// Cette sonde ne se contente pas de regarder si « ça ressemble à du TikZ » :
// elle RELIT LES COORDONNÉES PRODUITES et vérifie que la figure exportée est la
// figure demandée — AB = 5 cm dans le fichier veut dire 5 cm à la règle. Le
// fichier est aussi compilé pour de vrai quand pdflatex est là.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  const produire = (phrases, apres) => page.evaluate(([ph, ap]) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app._consignes = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    for (const x of ph) { try { app.executerConsigneAvec(x, ap !== 'sans'); } catch (e) { void e; } }
    if (ap === 'vecteur') {
      const pts = app.entities.filter(e => e.constructor.name === 'Point' && e.label);
      if (pts.length >= 2) { const v = new Segment(pts[0], pts[1]); v.fleche = true; app.addEntity(v); }
    }
    return app.genererTikZ();
  }, [phrases, apres || '']);

  /* Les coordonnées écrites dans le fichier, relues comme le ferait LaTeX. */
  const lireCoords = (code) => {
    const m = {};
    for (const l of code.split('\n')) {
      const r = l.match(/\\coordinate \((\w+)\) at \(([-\d.]+),([-\d.]+)\)/);
      if (r) m[r[1]] = [parseFloat(r[2]), parseFloat(r[3])];
    }
    return m;
  };
  const dist = (a, b) => +Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(2);

  console.log('\n=== la figure exportée est la figure demandée ===');
  /* LE POINT DE TOUT L'EXPORT. Le fichier est en CENTIMÈTRES RÉELS : ce que
     l'énoncé demande doit se lire directement dans les nombres du .tex, à la
     règle près. Sans cela on aurait un joli code qui dessine autre chose. */
  let code = await produire(['Trace un triangle ABC rectangle en A tel que AB = 5 cm et AC = 3 cm',
                             'Affiche les mesures des angles']);
  let c = lireCoords(code);
  console.log('  ' + JSON.stringify(c));
  ck('les trois sommets sont là', !!(c.A && c.B && c.C), Object.keys(c).join(','));
  ck('AB mesure 5 cm dans le fichier', dist(c.A, c.B) === 5, String(dist(c.A, c.B)));
  ck('AC mesure 3 cm', dist(c.A, c.C) === 3, String(dist(c.A, c.C)));
  ck('et BC vaut √34 = 5,83 cm', Math.abs(dist(c.B, c.C) - 5.83) < 0.02, String(dist(c.B, c.C)));
  /* L'écran fait DESCENDRE les y, TikZ les fait MONTER. Sans le retournement, la
     figure sort en miroir — juste au compas, fausse à l'œil. */
  ck('les y sont retournés : C est au-dessus de A', c.C[1] > c.A[1], `${c.C[1]} > ${c.A[1]}`);
  /* Le repère part du coin de la figure : des nombres petits et positifs, qu'on
     peut relire et corriger à la main. */
  ck('les coordonnées restent petites et positives',
     Object.values(c).every(v => v[0] >= -0.01 && v[1] >= -0.01 && v[0] < 40 && v[1] < 40),
     JSON.stringify(Object.values(c)));

  console.log('\n=== le code se relit, et ne demande rien d\'autre que tikz ===');
  ck('le dessin est un tikzpicture', /\\begin\{tikzpicture\}/.test(code) && /\\end\{tikzpicture\}/.test(code));
  ck('l\'unité est le centimètre', /x=1cm,y=1cm/.test(code));
  ck('les points sont des \\coordinate NOMMÉES, pas des nombres en vrac',
     /\\draw.*\(A\) -- \(B\)/.test(code), (code.match(/\\draw[^\n]*\(A\)[^\n]*/) || [''])[0]);
  /* « ($(A)+(30:1)$) » exige \usetikzlibrary{calc} : le fichier ne compilerait
     pas chez qui ne l'a pas chargée, et ne l'apprendrait qu'à l'erreur. Les
     coordonnées, on les a déjà — on les écrit. */
  ck('aucune syntaxe « calc » : le préambule annoncé suffit', !/\$\(/.test(code),
     (code.match(/[^\n]*\$\([^\n]*/) || [''])[0]);
  ck('le préambule nécessaire est dit en tête', /usepackage\{tikz\}/.test(code));
  /* L'angle droit se code par un CARRÉ, pas par un arc : c'est la convention du
     cahier, et TikZ ne la connaît pas tout seul. */
  const carre = code.split('\n').filter(l => /\\draw/.test(l) && (l.match(/--/g) || []).length === 2
    && !/\(A\)|\(B\)|\(C\)/.test(l));
  ck('l\'angle droit sort en carré, pas en arc', carre.length >= 1, carre[0] || '(aucun)');
  ck('les angles mesurés portent leur valeur', /\^\\circ/.test(code),
     (code.match(/[^\n]*circ[^\n]*/) || [''])[0]);
  /* Les instruments sont des objets d'écran : ils n'ont rien à faire dans un
     document — et ce qui n'est pas rendu est ÉCRIT, pas passé sous silence. */
  ck('les animations d\'instruments ne sortent pas', !/ToolAnimation/.test(code));

  console.log('\n=== chaque type d\'objet a sa traduction ===');
  /* SANS LES INSTRUMENTS. Un cercle construit au compas n'est pas un cercle :
     c'est une suite d'arcs, et c'est très bien ainsi — mais ce qu'on vérifie
     ici, c'est la traduction de CHAQUE TYPE d'objet, cercle compris. */
  code = await produire(['Trace un triangle ABC', 'Trace le cercle circonscrit au triangle ABC',
                         'Trace la droite (AB)', 'Trace la demi-droite [AC)'], 'sans');
  /* Attention au faux positif : les POINTS sont eux aussi des « circle », de
     1,2 pt. Le vrai cercle est un \draw dont le rayon se compte en centimètres. */
  const cercles = code.split('\n').filter(l => /^\s+\\draw/.test(l) && /circle \([\d.]+\)\s*;/.test(l)
    && !/circle \(1\.2pt\)/.test(l));
  ck('le cercle devient un \\draw … circle', cercles.length >= 1, cercles[0] || '(aucun)');
  /* L'arc, lui, se voit quand la construction est faite AUX INSTRUMENTS : le
     compas ne trace pas des cercles entiers. */
  const avecOutils = await produire(['Trace un triangle ABC',
                                     'Trace le cercle circonscrit au triangle ABC']);
  const arcs = avecOutils.split('\n').filter(l => /^\s+\\draw/.test(l) && /arc \(/.test(l));
  ck('l\'arc devient un \\draw … arc', arcs.length >= 1, arcs[0] || '(aucun)');
  /* Une droite ne s'arrête nulle part : ses deux bouts doivent SORTIR de la
     figure, sinon on a exporté un segment en croyant exporter une droite. */
  const bornes = Object.values(lireCoords(code));
  const maxX = Math.max(...bornes.map(v => v[0]));
  const maxY = Math.max(...bornes.map(v => v[1]));
  const longues = code.split('\n').filter(l => {
    const m = [...l.matchAll(/\(([-\d.]+),([-\d.]+)\)/g)];
    return /^\s+\\draw/.test(l) && m.some(v =>
      parseFloat(v[1]) < -0.5 || parseFloat(v[1]) > maxX + 0.5 ||
      parseFloat(v[2]) < -0.5 || parseFloat(v[2]) > maxY + 0.5);
  });
  ck('la droite et la demi-droite débordent vraiment de la figure',
     longues.length >= 2, `${longues.length} trait(s) prolongé(s)`);
  /* Le nom d'un point va OÙ IL EST À L'ÉCRAN : on le déplace à la main quand il
     gêne un trait, et tout ramener au même coin rendrait un dessin dont les noms
     sont à replacer un par un. */
  ck('les noms suivent l\'angle du point', /label=\{\[label distance=-2pt\]-?\d+:\$/.test(code),
     (code.match(/[^\n]*label distance[^\n]*/) || [''])[0]);

  console.log('\n=== plusieurs angles au même sommet ne se chevauchent pas ===');
  /* Trois demi-droites issues d'un même point, ce sont trois angles — et leurs
     valeurs tombaient au MÊME ENDROIT : mesuré, 0,6 cm entre des étiquettes qui
     en font 0,9. À l'écran de LaTeX, « 30° 60° 30° » se lisaient l'un par-dessus
     l'autre. Chacune s'éloigne maintenant un peu plus du sommet que la
     précédente, comme on le fait à la main. */
  const empile = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = [];
    const O = app.createPointAt(300, 600);
    const bras = (deg) => app.createPointAt(300 + Math.cos(-deg * Math.PI / 180) * 300,
                                            600 + Math.sin(-deg * Math.PI / 180) * 300);
    const P = [bras(0), bras(30), bras(90), bras(120)];
    P.forEach(q => app.addEntity(new Segment(O, q)));
    for (let i = 0; i < 3; i++) app.addEntity(new Angle(P[i], O, P[i + 1]));
    const code = app.genererTikZ();
    const n = code.split('\n').filter(l => /\\node/.test(l) && /circ/.test(l))
      .map(l => { const m = l.match(/at \(([-\d.]+),([-\d.]+)\)/); return m ? [+m[1], +m[2]] : null; })
      .filter(Boolean);
    let mini = 99;
    for (let i = 0; i < n.length; i++) {
      for (let j = i + 1; j < n.length; j++) {
        mini = Math.min(mini, Math.hypot(n[i][0] - n[j][0], n[i][1] - n[j][1]));
      }
    }
    return { combien: n.length, mini: +mini.toFixed(2), code };
  });
  console.log('  ' + JSON.stringify({ combien: empile.combien, mini: empile.mini }));
  ck('les trois valeurs sont écrites', empile.combien === 3, String(empile.combien));
  /* Une étiquette « 30° » en \small fait environ 0,9 cm de large : c'est le
     seuil au-dessous duquel deux voisines se touchent. */
  ck('  et aucune n\'en touche une autre', empile.mini >= 0.85, `${empile.mini} cm`);
  /* « font=\small » est une OPTION du nœud, pas du texte : c'est l'écriture
     idiomatique de TikZ, et un moteur qui ne connaîtrait pas l'option l'ignore
     au lieu de l'imprimer telle quelle au milieu de la figure. */
  ck('la taille est une option du nœud, pas du texte',
     !/\{\\small /.test(empile.code) && /font=\\small/.test(empile.code),
     (empile.code.match(/[^\n]*small[^\n]*/) || [''])[0]);

  console.log('\n=== le vecteur sort en flèche ===');
  code = await produire(['Place les points A et B'], 'vecteur');
  ck('un segment fléché devient « -> », le mot même de TikZ',
     /\\draw\[[^\]]*->\]/.test(code) || /\\draw\[->\]/.test(code),
     (code.match(/[^\n]*->[^\n]*/) || [''])[0]);
  const sansFleche = await produire(['Place les points A et B', 'Trace [AB]']);
  ck('  et un segment ordinaire, non', !/->/.test(sansFleche));

  console.log('\n=== une feuille vide n\'exporte rien ===');
  const vide = await page.evaluate(() => {
    const app = window.app; app.entities = []; return app.genererTikZ();
  });
  ck('rien à exporter, rien de produit', vide === null, JSON.stringify(vide));

  /* ================================================================
     ET SURTOUT : LE FICHIER COMPILE. Tout le reste ne vaut rien si
     pdflatex le refuse. Quand LaTeX n'est pas installé sur la machine, on
     le dit au lieu de faire semblant d'avoir vérifié.
     ================================================================ */
  console.log('\n=== pdflatex l\'accepte ===');
  let pdflatex = true;
  try { execFileSync('pdflatex', ['--version'], { stdio: 'ignore' }); } catch (e) { pdflatex = false; }
  if (!pdflatex) {
    console.log('  · pdflatex absent de cette machine : compilation NON vérifiée ici');
  } else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gmtikz-'));
    const cas = {
      'triangle': ['Trace un triangle ABC rectangle en A tel que AB = 5 cm et AC = 3 cm',
                   'Affiche les mesures des angles'],
      'cercles': ['Trace un triangle ABC', 'Trace le cercle circonscrit au triangle ABC',
                  'Trace les médiatrices du triangle ABC'],
      'rotation': ["Trace un triangle ABC puis place O et construis A'B'C' image de ABC "
                   + "par la rotation de centre O et d'angle 60°"],
      'translation': ["Trace un triangle ABC puis place D et E et construis A'B'C' image "
                      + 'de ABC par la translation de vecteur DE'],
    };
    for (const [nom, phrases] of Object.entries(cas)) {
      const tikz = await produire(phrases, 'vecteur');
      const f = path.join(dir, nom + '.tex');
      fs.writeFileSync(f, '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{tikz}\n'
        + '\\begin{document}\n' + tikz + '\\end{document}\n');
      let ok = false, erreur = '';
      try {
        execFileSync('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', nom + '.tex'],
          { cwd: dir, stdio: 'ignore', timeout: 60000 });
        ok = fs.existsSync(path.join(dir, nom + '.pdf'));
      } catch (e) {
        try {
          erreur = (fs.readFileSync(path.join(dir, nom + '.log'), 'utf8')
            .split('\n').filter(l => l.startsWith('!'))[0] || '').slice(0, 120);
        } catch (e2) { erreur = String(e).slice(0, 120); }
      }
      ck(`« ${nom} » compile`, ok, erreur);
    }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { void e; }
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
