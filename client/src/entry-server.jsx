import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { loadRouteData, metadata, SITE_URL } from './routeData';
import { structuredData } from './components/PageMeta';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
export async function render(url, template, apiOrigin) {
  const data = await loadRouteData(url, apiOrigin);
  const meta = metadata(url, data);
  const markup = renderToString(<App url={url} initialData={data} />);
  const head = `<title>${escape(meta.title)}</title><meta name="description" content="${escape(meta.description)}"><meta name="robots" content="${meta.noindex ? 'noindex,follow' : 'index,follow'}"><link rel="canonical" href="${escape(meta.canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${escape(meta.canonical)}"><meta property="og:image" content="${SITE_URL}/social-card.png"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json" id="page-schema">${json(structuredData(url, data))}</script>`;
  return {
    status: data.status,
    html: template
      .replace('<!--head-->', head)
      .replace('<!--app-->', markup)
      .replace('<!--data-->', `<script>window.__ROUTE_DATA__=${json(data)}</script>`),
  };
}
