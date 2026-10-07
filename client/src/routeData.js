import React, { createContext, useContext } from 'react';
export const RouteDataContext = createContext({});
export const useRouteData = () => useContext(RouteDataContext);
export const SITE_URL = 'https://get-it-done-steel.vercel.app';
export const staticRoutes = ['/about', '/trust-safety', '/faq', '/contact', '/terms', '/privacy'];
export const routeLabels = {
  '/': 'Local help, made simple',
  '/tasks': 'Browse tasks',
  '/post-task': 'Post a task',
  '/profile': 'Your profile',
  '/admin': 'Marketplace administration',
  '/login': 'Log in',
  '/register': 'Create an account',
  '/about': 'About Get It Done',
  '/trust-safety': 'Trust & safety',
  '/faq': 'Frequently asked questions',
  '/contact': 'Contact us',
  '/terms': 'Terms of service',
  '/privacy': 'Privacy policy',
};

export async function loadRouteData(rawUrl, apiOrigin) {
  const url = new URL(rawUrl, SITE_URL);
  const path = url.pathname;
  const data = { path, status: 200 };
  const get = async (endpoint) => {
    const response = await fetch(`${apiOrigin.replace(/\/$/, '')}/api${endpoint}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw Object.assign(new Error('Unable to load marketplace data.'), {
        status: response.status === 404 ? 404 : 503,
      });
    return response.json();
  };
  try {
    if (path === '/') {
      const [categories, tasks] = await Promise.all([
        get('/categories'),
        get('/tasks?limit=6&status=OPEN'),
      ]);
      Object.assign(data, categories, tasks);
    } else if (path === '/tasks') {
      const params = new URLSearchParams(url.search);
      if (!params.has('status')) params.set('status', 'OPEN');
      params.set('limit', '12');
      const [categories, tasks] = await Promise.all([get('/categories'), get(`/tasks?${params}`)]);
      Object.assign(data, categories, tasks);
    } else if (/^\/tasks\/[^/]+$/.test(path)) {
      const result = await get(`/tasks/${encodeURIComponent(path.split('/')[2])}`);
      // Serialize only public task content. Never include offers, private contact or payments.
      const t = result.task;
      data.task = Object.fromEntries(
        [
          'id',
          'title',
          'description',
          'budget',
          'status',
          'location',
          'latitude',
          'longitude',
          'isRemote',
          'dueDate',
          'images',
          'createdAt',
          'category',
          'poster',
          '_count',
        ].map((key) => [key, t[key]]),
      );
    } else if (/^\/users\/[^/]+$/.test(path)) {
      data.profile = (await get(`/users/${encodeURIComponent(path.split('/')[2])}`)).user;
    } else if (!routeLabels[path]) data.status = 404;
  } catch (error) {
    data.status = error.status || 503;
    data.error =
      data.status === 404
        ? 'This page could not be found.'
        : 'The marketplace is temporarily unavailable. Please try again.';
  }
  return data;
}

export function metadata(rawUrl, data = {}) {
  const url = new URL(rawUrl, SITE_URL);
  const path = url.pathname;
  const label =
    data.status === 404
      ? 'Page not found'
      : data.task?.title || data.profile?.name || routeLabels[path] || 'Tasker profile';
  const descriptions = {
    '/': 'Find help with cleaning, repairs, moving and digital projects. Post a task, compare offers and connect with local taskers on Get It Done.',
    '/tasks':
      'Browse local and remote tasks on Get It Done. Filter by category, budget and location, explore available work and send a tailored offer.',
    '/about':
      'Meet Get It Done, a community services marketplace connecting people who need everyday help with taskers offering local and remote skills.',
    '/trust-safety':
      'Understand identity badges, private task conversations and demo payment flows on Get It Done, with practical tips for choosing local help.',
    '/faq':
      'Find answers about posting tasks, comparing offers, messaging hired taskers and using the Get It Done community marketplace demonstration.',
    '/contact':
      'Contact Get It Done with marketplace questions, feedback or technical issues. Share the details of your request through our contact form.',
    '/terms':
      'Read the Get It Done terms of service covering marketplace use, user responsibilities, task agreements and simulated payment functionality.',
    '/privacy':
      'Learn how Get It Done handles account information, task listings, messages and identity submissions, and how to contact us about your data.',
  };
  const noindex =
    data.status >= 400 ||
    url.search.length > 0 ||
    (!['/', '/tasks', ...staticRoutes].includes(path) && !(data.task?.status === 'OPEN'));
  return {
    label,
    title: `${label} | Get It Done`,
    description: data.task
      ? `${data.task.title}. View the task details, estimated budget and location, and send an offer on the Get It Done marketplace.`.slice(
          0,
          160,
        )
      : descriptions[path] ||
        'Use Get It Done to manage your account, connect with taskers and organize local or remote tasks in the community marketplace.',
    canonical: SITE_URL + path,
    noindex,
  };
}
