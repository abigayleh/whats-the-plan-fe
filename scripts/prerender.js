#!/usr/bin/env node
// Turns the empty SPA shell into real HTML for the public routes: the landing page is
// rendered to static markup, every public route gets its own metadata, and robots.txt +
// sitemap.xml are written from the same route table. Runs after `vite build`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SITE_NAME, SITE_DESCRIPTION } from '../src/constants/site.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

// Netlify exposes the site's primary address as URL during a build; SITE_URL overrides it.
// Canonical tags, OG urls and the sitemap are all absolute, so this has to be right.
const siteUrl = (process.env.SITE_URL || process.env.URL || 'http://localhost:4173').replace(/\/+$/, '');
const ogImage = `${siteUrl}/og-image.png`;

const text = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const attr = (value) => text(value).replace(/"/g, '&quot;');

function head({
  path, title, description, indexable, jsonLd,
}) {
  const url = `${siteUrl}${path}`;
  const tags = [
    `<title>${text(title)}</title>`,
    `<meta name="description" content="${attr(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    indexable ? null : '<meta name="robots" content="noindex, follow" />',
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${attr(SITE_NAME)}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${attr(SITE_NAME)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${attr(title)}" />`,
    `<meta name="twitter:description" content="${attr(description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    // Escaped so a "</script>" inside the copy can't break out of the block.
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : null,
  ];
  return tags.filter(Boolean).map((tag) => `    ${tag}`).join('\n');
}

// Compiled by the `vite build --ssr` step (see vite.config.js) — JSX that Node can import.
const { default: LandingPage } = await import(pathToFileURL(resolve(root, '.prerender/LandingPage.js')));
const landingMarkup = renderToStaticMarkup(createElement(LandingPage));

const routes = [
  {
    path: '/',
    title: `${SITE_NAME} — collaborative planning for groups`,
    description: SITE_DESCRIPTION,
    indexable: true,
    markup: landingMarkup,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: siteUrl,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript.',
    },
  },
  {
    path: '/login',
    title: `Log in — ${SITE_NAME}`,
    description: `Log in to ${SITE_NAME} to reach your groups' shared calendar, lists, itineraries, pages and chat.`,
    indexable: true,
  },
  {
    path: '/register',
    title: `Create an account — ${SITE_NAME}`,
    description: `Create a ${SITE_NAME} account and start planning with your group: shared calendar, lists, polls, itineraries and chat.`,
    indexable: true,
  },
  // Signs the visitor straight into the shared demo account, so there is nothing to index.
  {
    path: '/demo',
    title: `Live demo — ${SITE_NAME}`,
    description: `Open the ${SITE_NAME} demo account and look around a group that is already set up.`,
    indexable: false,
  },
  // Only reachable with a one-time token from a verification email.
  {
    path: '/verify',
    title: `Verify your email — ${SITE_NAME}`,
    description: `Confirm your email address to finish setting up your ${SITE_NAME} account.`,
    indexable: false,
  },
];

const shell = readFileSync(resolve(dist, 'index.html'), 'utf8');

for (const route of routes) {
  const html = shell
    .replace(/^[ \t]*<title>.*<\/title>\n/m, '')
    .replace(/[ \t]*<\/head>/, `${head(route)}\n  </head>`)
    // Outside #root: main.jsx removes it before React paints, so the client never has to
    // hydrate markup that a logged-in visitor would immediately replace anyway.
    .replace('<div id="root">', route.markup ? `<div id="prerender">${route.markup}</div>\n    <div id="root">` : '<div id="root">');

  const out = route.path === '/' ? resolve(dist, 'index.html') : resolve(dist, `.${route.path}/index.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const indexable = routes.filter((route) => route.indexable);
writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((route) => `  <url><loc>${siteUrl}${route.path}</loc></url>`).join('\n')}
</urlset>
`);

// Everything below the public routes needs a session, so a crawler would only ever get the
// SPA shell there. Keep it out of the index rather than letting it collect empty pages.
// Mirrors the authenticated routes in src/App.jsx — add new ones here too.
const privatePaths = ['/lists', '/pages', '/itinerary', '/polls', '/chat', '/groups', '/profile'];
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *
Allow: /
${[...privatePaths, ...routes.filter((route) => !route.indexable).map((route) => route.path)]
    .map((path) => `Disallow: ${path}`).join('\n')}

Sitemap: ${siteUrl}/sitemap.xml
`);

console.log(`prerendered ${routes.length} routes, sitemap + robots.txt at ${siteUrl}`);