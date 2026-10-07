import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { metadata, SITE_URL, useRouteData } from '../routeData';

export function structuredData(url, data) {
  const meta = metadata(url, data);
  const path = new URL(url, SITE_URL).pathname;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Get It Done',
      url: SITE_URL + '/',
    },
  ];
  if (path !== '/')
    schema.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        ...(/^\/tasks\//.test(path)
          ? [{ '@type': 'ListItem', position: 2, name: 'Browse tasks', item: SITE_URL + '/tasks' }]
          : []),
        {
          '@type': 'ListItem',
          position: /^\/tasks\//.test(path) ? 3 : 2,
          name: meta.label,
          item: meta.canonical,
        },
      ],
    });
  return schema;
}

export default function PageMeta() {
  const location = useLocation();
  const data = useRouteData();
  const url = location.pathname + location.search;
  const meta = metadata(url, data.path === location.pathname ? data : {});
  useEffect(() => {
    document.title = meta.title;
    const set = (selector, attrs) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        document.head.append(element);
      }
      Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    };
    set('meta[name="description"]', { name: 'description', content: meta.description });
    set('meta[name="robots"]', {
      name: 'robots',
      content: meta.noindex ? 'noindex,follow' : 'index,follow',
    });
    set('link[rel="canonical"]', { rel: 'canonical', href: meta.canonical });
    for (const [name, content] of Object.entries({
      'og:title': meta.title,
      'og:description': meta.description,
      'og:url': meta.canonical,
    }))
      set(`meta[property="${name}"]`, { property: name, content });
    let script = document.getElementById('page-schema');
    if (!script) {
      script = document.createElement('script');
      script.id = 'page-schema';
      script.type = 'application/ld+json';
      document.head.append(script);
    }
    script.textContent = JSON.stringify(
      structuredData(url, data.path === location.pathname ? data : {}),
    );
  }, [url, meta.title, meta.description, meta.canonical, meta.noindex, data]);
  if (location.pathname === '/') return null;
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <Link to="/">Home</Link>
      <span aria-hidden="true">/</span>
      {/^\/tasks\//.test(location.pathname) && (
        <>
          <Link to="/tasks">Browse tasks</Link>
          <span aria-hidden="true">/</span>
        </>
      )}
      <span aria-current="page">{meta.label}</span>
    </nav>
  );
}
