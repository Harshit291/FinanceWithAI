/**
 * add-responsive.mjs
 * Injects mobile-responsive CSS into all resume HTML files in /public.
 * Handles two layout types:
 *   - sidebar (resume.html, resume_optionA.html, resume_optionC.html)
 *   - full-width (resume_optionD.html)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

/* ─────────────────────────────────────────────────────────────────────────────
   CSS for SIDEBAR layouts (resume.html / optionA / optionC)
   Two-column grid (.body = main + aside) stacks to single column on mobile.
───────────────────────────────────────────────────────────────────────────── */
const SIDEBAR_RESPONSIVE = `
    /* ══ MOBILE RESPONSIVE (sidebar layouts) ══ */
    @media (max-width: 680px) {
      html { font-size: 12.5px; }

      .page { margin: 0; border-radius: 0; box-shadow: none; }

      /* Header: stack name + contact */
      .header {
        grid-template-columns: 1fr;
        padding: 24px 20px 20px;
        gap: 14px;
      }
      .name { font-size: 1.9rem; }
      .contact-grid { align-items: flex-start; }
      .contact-item { font-size: 0.78rem; }

      /* Summary */
      .summary-strip { padding: 14px 20px; font-size: 0.8rem; }

      /* Body: sidebar below main */
      .body { grid-template-columns: 1fr; }
      .main  { padding: 20px 20px 16px; border-right: none; border-bottom: 1px solid var(--border); }
      .aside { padding: 20px; }

      /* Job bullets tighter */
      .job ul li { font-size: 0.77rem; }

      /* Project card */
      .project-card { padding: 14px 16px; }

      /* Skills pills wrap freely */
      .skills-pills { gap: 4px; }
      .tag { font-size: 0.67rem; padding: 3px 7px; }

      /* Portfolio links: stack vertically */
      .portfolio-link { width: 100%; }

      /* Cert list */
      .cert-list li { font-size: 0.73rem; }
    }

    @media (max-width: 400px) {
      html { font-size: 11.5px; }
      .name { font-size: 1.6rem; }
      .header { padding: 20px 16px 16px; }
      .main, .aside { padding: 16px; }
      .summary-strip { padding: 12px 16px; }
    }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   CSS for FULL-WIDTH layout (resume_optionD.html)
   2-col grids (jobs, project-inner, edu-certs, bottom) all stack to 1-col.
───────────────────────────────────────────────────────────────────────────── */
const FULLWIDTH_RESPONSIVE = `
    /* ══ MOBILE RESPONSIVE (full-width layout) ══ */
    @media (max-width: 680px) {
      html { font-size: 12.5px; }

      .page { margin: 0; border-radius: 0; box-shadow: none; }

      /* Header: stack name + contact */
      .header {
        grid-template-columns: 1fr;
        padding: 24px 20px 20px;
        gap: 14px;
      }
      .name { font-size: 1.9rem; }
      .contact-row { align-items: flex-start; }
      .contact-item { font-size: 0.78rem; }

      /* Summary */
      .summary { padding: 14px 20px; font-size: 0.8rem; }

      /* Body padding */
      .body { padding: 20px; }

      /* Skills table: label above pills */
      .skills-table { grid-template-columns: 1fr; gap: 4px 0; }
      .skills-cat { padding-top: 10px; }

      /* Work experience: jobs stack */
      .jobs-grid { grid-template-columns: 1fr; gap: 14px; }
      .job { padding: 14px 16px; }
      .job ul li { font-size: 0.75rem; }

      /* Project card: inner grid stacks */
      .project-card { padding: 16px 18px; }
      .project-inner { grid-template-columns: 1fr; gap: 14px; }
      .project-top { flex-wrap: wrap; gap: 8px; }
      .project-url { margin-left: 0; }

      /* Education + Certs: stack */
      .edu-certs-grid { grid-template-columns: 1fr; gap: 16px; }

      /* Bottom row: stack */
      .bottom-grid { grid-template-columns: 1fr; gap: 16px; }

      /* Portfolio links wrap */
      .portfolio-links { flex-direction: column; }
      .portfolio-link { width: 100%; }

      /* Tags */
      .tag { font-size: 0.67rem; padding: 3px 7px; }
    }

    @media (max-width: 400px) {
      html { font-size: 11.5px; }
      .name { font-size: 1.6rem; }
      .header { padding: 20px 16px 16px; }
      .body { padding: 16px; }
      .summary { padding: 12px 16px; }
    }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Also add a responsive meta viewport fix for Option C's page2 section
───────────────────────────────────────────────────────────────────────────── */
const OPTIONC_EXTRA = `
    @media (max-width: 680px) {
      .page2 { padding: 20px; }
      .page2-header { flex-direction: column; gap: 8px; align-items: flex-start; }
      .page2-header .p2-contact { flex-wrap: wrap; gap: 8px; }
      .page2-grid { grid-template-columns: 1fr; gap: 16px; }
    }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Apply to all resume HTML files
───────────────────────────────────────────────────────────────────────────── */
const files = fs.readdirSync(publicDir)
  .filter(f => f.startsWith('resume') && f.endsWith('.html'))
  .map(f => ({ name: f, full: path.join(publicDir, f) }));

console.log(`📱  Adding mobile responsiveness to ${files.length} file(s):\n`);

for (const { name, full } of files) {
  let html = fs.readFileSync(full, 'utf8');

  // Skip if already patched
  if (html.includes('MOBILE RESPONSIVE')) {
    console.log(`   ⏭  ${name} — already responsive, skipping.`);
    continue;
  }

  // Choose the right CSS block
  let css = SIDEBAR_RESPONSIVE;
  if (name === 'resume_optionD.html') {
    css = FULLWIDTH_RESPONSIVE;
  } else if (name === 'resume_optionC.html') {
    css = SIDEBAR_RESPONSIVE + OPTIONC_EXTRA;
  }

  // Inject just before the closing </style> of the FIRST <style> block
  // (avoid injecting into the embedded font <style> blocks)
  // Strategy: find '@media print' block (present in all files) and append after it
  const printMediaEnd = html.indexOf('@media print');
  if (printMediaEnd === -1) {
    // Fallback: inject before first </style>
    html = html.replace('</style>', css + '\n  </style>');
  } else {
    // Find the closing brace of the @media print block
    let depth = 0, i = printMediaEnd;
    while (i < html.length) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') { depth--; if (depth === 0) { i++; break; } }
      i++;
    }
    // Insert our responsive CSS right after the @media print block
    html = html.slice(0, i) + '\n' + css + html.slice(i);
  }

  fs.writeFileSync(full, html, 'utf8');
  const kb = Math.round(fs.statSync(full).size / 1024);
  console.log(`   ✅  ${name} — ${kb} KB`);
}

console.log('\n🎉  Done! All resume files are now mobile-responsive.');
