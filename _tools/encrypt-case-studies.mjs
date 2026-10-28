#!/usr/bin/env node
// Encrypt the password-protected case studies for publishing (Luke 2026-10-27/28): /shrp/ (AI-org: see PAGES).
//
//   node _tools/encrypt-case-studies.mjs <output site dir>   e.g. ../lukeschenker.com (the main checkout, at publish)
//   node _tools/encrypt-case-studies.mjs --preview           a full encrypted copy of the site in _gate-preview/,
//                                                            served by the "lukeschenker-gate-preview" preview (port 4601)
//
// The password comes from STATICRYPT_PASSWORD or is asked for. This script never writes it anywhere.
//
// Where things live: this worktree (branch hifi-2026, never pushed) holds the readable pages and stays the place to
// edit them. Only this script's output, which is ciphertext plus the gate, ever goes to the public repo. Every file
// in that repo is public, so the readable pages and anything marked data-encrypt-inline must never be committed there.
//
// For each page this script:
//   1. inlines every <script src=... data-encrypt-inline> so that script's contents are encrypted with the page
//      (SHRP's usage chart: the per-tester data stays behind the password; see the note at its tag);
//   2. builds the gate from _tools/gate/password_template.html plus the page's own head links, title and header video;
//   3. encrypts with StatiCrypt 3.5.4 (pinned), reusing the salt in _tools/gate/staticrypt.json so the remembered
//      password survives re-encrypting and one entry unlocks both pages (the salt is not secret: StatiCrypt README);
//   4. refuses to finish if any of the page's readable text shows up in the output.
// Then it writes what the homepage modal needs: /assets/data/case-study-gates.json (each gate's content) and
// /assets/js/staticrypt-engine.js (StatiCrypt's engine, copied out of the encrypted output).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATICRYPT = 'staticrypt@3.5.4';
const SALT_CONFIG = join(SITE, '_tools/gate/staticrypt.json');
const TEMPLATE = readFileSync(join(SITE, '_tools/gate/password_template.html'), 'utf8');
const VERSION = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ''); // cache-busting for the gate's assets

// Gate copy per page [Luke-decided 2026-10-28; he refines it live]. *Starred* parts show in white (case-study-gate.js).
// The email body helps him tell real people apart.
const ASK = 'If you would like the password, *email me at luke@lukeschenker.com with your company email*, and I\'ll usually get back to you *in under 10 minutes*.';
// AI-org is public for now [Luke-decided 2026-10-28: "I'm still pretty early in the job hunt"]. To put it behind the
// password again, uncomment its line (its copy is ready) and rerun this script; the homepage modal picks it up.
const PAGES = [
    { dir: 'shrp', name: 'SHRP', lead: 'This page covers internal product research. ' + ASK },
    // { dir: 'ai-org', name: 'AI org', lead: 'This page covers how my AI org works internally. ' + ASK },
];
const emailBody = name => `Hi Luke,\n\nI'd like the password for your ${name} case study.\n\nName:\nCompany:\nRole:\n\nThanks!`;

// Never copied into the preview: the readable sources' tooling, git, the preview itself, and private files.
const PRIVATE = ['assets/js/shrp-usage-chart.js'];
const SKIP_IN_COPY = ['.git', '.gitignore', '.DS_Store', '_gate-preview', '_tools', ...PRIVATE];

function fail(message) {
    console.error('encrypt-case-studies: ' + message);
    process.exit(1);
}

function one(html, regex, what, page) {
    const m = html.match(regex);
    if (!m) fail(`${page}: couldn't find ${what}`);
    return m;
}

function attr(tag, name) {
    const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? m[1] : '';
}

function decodeEntities(s) {
    return s.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"');
}

function askPassword() {
    return new Promise(done => {
        const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        rl.question('Case-study password: ', answer => {
            rl.close();
            done(answer.trim());
        });
    });
}

const preview = process.argv[2] === '--preview';
const out = preview ? join(SITE, '_gate-preview') : process.argv[2];
if (!out) fail('usage: node _tools/encrypt-case-studies.mjs <output site dir> | --preview');
const OUT = resolve(process.cwd(), out);

const password = process.env.STATICRYPT_PASSWORD || await askPassword();
if (!password) fail('no password given');

if (preview) {
    // A full copy of the site laid out exactly like the public one, with the gate(s) in place (PAGES).
    // Copied entry by entry: Node refuses to copy a folder into a folder inside itself.
    rmSync(OUT, { recursive: true, force: true });
    const keep = src => {
        const rel = relative(SITE, src);
        return !SKIP_IN_COPY.some(skip => rel === skip || rel.startsWith(skip + sep) || rel.endsWith(sep + skip));
    };
    for (const entry of readdirSync(SITE)) {
        if (keep(join(SITE, entry))) cpSync(join(SITE, entry), join(OUT, entry), { recursive: true, filter: keep });
    }
}

const work = mkdtempSync(join(tmpdir(), 'encrypt-case-studies-'));
const gates = {};
let engine = null;
try {
    for (const { dir, name, lead } of PAGES) {
        let page = readFileSync(join(SITE, dir, 'index.html'), 'utf8');

        // 1. Inline the scripts whose contents must be encrypted too.
        page = page.replace(/<script src="([^"?]+)(?:\?[^"]*)?"([^>]*)\bdata-encrypt-inline\b[^>]*><\/script>/g, (tag, src) => {
            const code = readFileSync(join(SITE, src), 'utf8');
            if (/<\/script/i.test(code)) fail(`${src} contains "</script", can't inline it`);
            return `<script>\n// Inlined from ${src} at encryption time (data-encrypt-inline).\n${code}\n</script>`;
        });
        if (/<script\b[^>]*\bdata-encrypt-inline\b/.test(page)) fail(`${dir}: a data-encrypt-inline script wasn't inlined (check its tag's format)`);

        // 2. The gate, from the page's own parts.
        const head = page.slice(0, page.indexOf('</head>'));
        // Link previews and search snippet (og:, twitter:, description), plus every <link>.
        const headLines = head.split('\n').filter(line => /<meta property="og:|<meta name="(twitter:|description)|<link /.test(line)).join('\n');
        const title = one(head, /<title>([^<]*)<\/title>/, 'the <title>', dir)[1];
        const bodyClass = (page.match(/<body class="([^"]*)"/) || [, ''])[1];
        const video = one(page, /<video [^>]*\bdata-scrub\b[^>]*>/, 'the header video (data-scrub)', dir)[0];
        const h1 = decodeEntities(one(page, /<h1>([^<]*)<\/h1>/, 'the page title <h1>', dir)[1].trim());
        gates[`/${dir}/`] = {
            title: h1,
            lead,
            subject: `Password for your ${name} case study`,
            body: emailBody(name),
            video: { src: attr(video, 'src'), poster: attr(video, 'poster'), label: attr(video, 'aria-label') },
        };
        const gate = TEMPLATE
            .replace('{{HEAD}}', headLines)
            .replace('{{BODY_CLASS}}', bodyClass)
            .replace('{{GATE_JSON}}', JSON.stringify(gates[`/${dir}/`]).replace(/</g, '\\u003c'))
            .replaceAll('{{VERSION}}', VERSION);
        if (/\{\{[A-Z_]+\}\}/.test(gate)) fail(`${dir}: an unfilled {{TOKEN}} is left in the gate`);

        mkdirSync(join(work, dir), { recursive: true });
        writeFileSync(join(work, dir, 'index.html'), page);
        writeFileSync(join(work, `${dir}-template.html`), gate);

        // 3. Encrypt. The password goes in through the environment, never on the command line. Run from the site root
        //    with site-relative output and config paths: StatiCrypt prefixes "./" to --config.
        execFileSync('npx', ['--yes', STATICRYPT, join(work, dir, 'index.html'),
            '-t', join(work, `${dir}-template.html`),
            '-d', relative(SITE, join(OUT, dir)) || '.',
            '--config', relative(SITE, SALT_CONFIG),
            '--template-title', title,
        ], { cwd: SITE, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, STATICRYPT_PASSWORD: password } });

        // 4. Nothing readable may leak: every section heading and every inlined script must be absent.
        const encrypted = readFileSync(join(OUT, dir, 'index.html'), 'utf8');
        const probes = [...page.matchAll(/<h2[^>]*>([^<]{12,})<\/h2>/g)].map(m => m[1].trim());
        if (dir === 'shrp') probes.push('const USAGE');
        if (!probes.length) fail(`${dir}: found no headings to check the output against`);
        for (const probe of probes) {
            if (encrypted.includes(probe)) fail(`${dir}: readable text found in the output: "${probe.slice(0, 40)}"`);
        }
        engine = engine || one(encrypted, /<script id="staticrypt-engine">\s*([\s\S]*?)\s*<\/script>/, 'the engine block', dir)[1];
        console.log(`encrypt-case-studies: ${dir}/index.html encrypted (${probes.length} leak checks passed)`);
    }

    // What the homepage modal needs.
    mkdirSync(join(OUT, 'assets/data'), { recursive: true });
    writeFileSync(join(OUT, 'assets/data/case-study-gates.json'), JSON.stringify(gates, null, 2) + '\n');
    writeFileSync(join(OUT, 'assets/js/staticrypt-engine.js'),
        `// StatiCrypt ${STATICRYPT.split('@')[1]} engine (MIT, github.com/robinmoisson/staticrypt), copied out of the encrypted\n` +
        `// case studies by _tools/encrypt-case-studies.mjs so the homepage modal can check the password. Generated: don't edit.\n` +
        engine + '\n');
    for (const file of PRIVATE) {
        if (existsSync(join(OUT, file))) fail(`${file} is in ${OUT}: delete it there first; it must never be published`);
    }
    console.log(`encrypt-case-studies: done -> ${OUT}`);
} finally {
    rmSync(work, { recursive: true, force: true });
}
