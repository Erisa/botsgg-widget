import { Context, Hono } from 'hono';
import { poweredBy } from 'hono/powered-by';

import { BOTSGG_PATH, handleWidget, ReadonlyArrayToUnion, WIDGET_TYPES, WidgetType } from './widget';
import { fetchBot } from './util';

type Env = {
  BUFFER_CACHE: KVNamespace;
  DATA_CACHE: KVNamespace;
  SVG_CACHE: KVNamespace;
  BOTSGG_AUTH?: string;
};

export type RequestContext = Context<{
  Bindings: Env;
}>;

export const BADGES_TYPES = ['servers', 'library', 'status'] as const;
export type BadgeType = ReadonlyArrayToUnion<typeof BADGES_TYPES>;

const app = new Hono<{ Bindings: Env }>();

app.use('*', poweredBy());

app.use('*', async (c, next) => {
  if (c.req.header('cf-worker')) return c.text('This service is not meant for worker subrequests.', 403);
  await next();
});

app.get('/', (c) => {
  return c.redirect('https://github.com/Snazzah/botsgg-widget');
});

app.get('/widget/:id/:type{[a-z]+(?:\\.[sS][vV][gG])}', async (c) => {
  const type = c.req.param('type').replace('.svg', '');
  const width = parseInt(c.req.query('w'));
  const widthValid = !isNaN(width) && isFinite(width) && width > 30;
  if (!type || !WIDGET_TYPES.includes(type as WidgetType)) return c.text('Invalid type. Available widget types: ' + WIDGET_TYPES, 400);

  try {
    return c.newResponse(await handleWidget(c.req.param('id'), type as WidgetType, c, widthValid ? width : undefined), 200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `max-age=${60 * 60 * 3}`
    });
  } catch (e) {
    if (e.message === 'Forbidden') return c.text('Forbidden', 403);
    return c.text('Internal Server Error', 500);
  }
});

app.get('/badge/:id/:type', async (c) => {
  const id = c.req.param('id');
  const type = c.req.param('type') as BadgeType;
  if (!type || !BADGES_TYPES.includes(type)) return c.text('Invalid type. Available badge types: ' + BADGES_TYPES, 400);
  const logoSvg = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${BOTSGG_PATH}" fill="white" /></svg>`;

  const host = c.req.header('host');
  const sendJson = c.req.header('accept') === 'application/json';
  console.log(c.req.raw.url);

  if (sendJson) {
    const bot = await fetchBot(id, c);
    if (!bot)
      return c.json({
        schemaVersion: 1,
        label: type,
        message: 'bot not found',
        labelColor: '#14171e',
        color: '#ff4949',
        logoSvg,
        isError: true
      }, 404);

    let message = '';
    let colorOverride: string | null = null;

    switch (type) {
      case 'servers':
        message = bot.guildCount.toLocaleString();
        break;
      case 'library':
        message = bot.libraryName || 'N/A';
        break;
      case 'status':
        message = bot.status || 'N/A';
        if (bot.status === 'online') colorOverride = '#43b581';
        else if (bot.status === 'idle') colorOverride = '#faa61a';
        else if (bot.status === 'dnd') colorOverride = '#f04747';
        else if (bot.status === 'offline') colorOverride = '#747f8d';
        else if (bot.status === 'streaming') colorOverride = '#9676cb';
        break;
    }
    
    return c.json({
      schemaVersion: 1,
      label: type,
      message,
      labelColor: '#14171e',
      logoSvg,
      color: colorOverride || '#060608',
    });
  }

  if (!host) return c.text('I dunno what host this is.', 400);

  const endpointUrl = new URL(c.req.raw.url);
  endpointUrl.protocol = 'https';
  const searchParam = endpointUrl.search;
  endpointUrl.search = '';
  endpointUrl.hash = '';

  const shieldsUrl = new URL('https://img.shields.io/endpoint');
  shieldsUrl.search = searchParam;
  shieldsUrl.searchParams.set('url', endpointUrl.href);
  shieldsUrl.searchParams.delete('logo');
  shieldsUrl.searchParams.set('cacheSeconds', `${60 * 60 * 3}`);
  shieldsUrl.searchParams.set('link', `https://discord.bots.gg/bots/${id}`);
  const res = await fetch(shieldsUrl);

  return new Response(res.body, {
    status: res.status,
    headers: {
      "access-control-allow-origin": res.headers.get("access-control-allow-origin")!,
      "cache-control": res.headers.get("cache-control")!,
      "content-type": res.headers.get("content-type")!,
    },
  });
})

export default app;
