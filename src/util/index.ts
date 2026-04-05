import { RequestContext } from '..';

const DEFAULT_AVATAR = 'https://discord.bots.gg/img/bot_icon_placeholder.png';
const USER_AGENT = 'botsgg-worker/1.0 (+https://github.com/Snazzah/botsgg-widget)';

export interface BotsGGBot {
  userId: string;
  clientId: string;
  username: string;
  globalName: string | null;
  discriminator: string;
  avatarURL: string | null;
  coOwners: BotsGGOwner[];
  prefix: string;
  helpCommand: string;
  libraryName: string;
  website: null | string;
  supportInvite: null | string;
  botInvite: string;
  shortDescription: string;
  longDescription: string;
  openSource: null | string;
  slashCommandsOnly: boolean;
  shardCount: number;
  guildCount: number;
  verified: boolean;
  online: boolean;
  inGuild: boolean;
  owner: BotsGGOwner;
  addedDate: string;
  status: string;
}

export interface BotsGGOwner {
  username: string;
  discriminator: string;
  userId: string;
  globalName: string | null;
}

export async function fetchBot(id: string, ctx: RequestContext) {
  const cached = await ctx.env.DATA_CACHE.get<BotsGGBot>(`bot/${id}`, {
    type: 'json',
    cacheTtl: 60 * 60 * 3
  });
  if (cached) return cached;

  const response = await fetch(`https://discord.bots.gg/api/v1/bots/${id}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'X-Forwarded-For': ctx.req.headers.get('cf-connecting-ip'),
      ...(ctx.env.BOTSGG_AUTH ? { Authorization: ctx.env.BOTSGG_AUTH } : {})
    }
  });

  if (response.status === 404) return null;
  else if (response.status === 403) throw new Error('Forbidden');

  const bot: BotsGGBot = await response.json();
  await ctx.env.DATA_CACHE.put(`bot/${id}`, JSON.stringify(bot), { expirationTtl: 60 * 60 * 3 });
  return bot;
}

export async function fetchAvatar(id: string, avatarUrl: string | null, ctx: RequestContext, skipCacheCheck = false): Promise<ArrayBuffer> {
  if (!skipCacheCheck) {
    const cached = await ctx.env.BUFFER_CACHE.get(`botAvatar/${id}`, {
      type: 'arrayBuffer',
      cacheTtl: 60 * 60 * 3
    });
    if (cached) return cached as unknown as ArrayBuffer;
  }

  const response = await fetch(avatarUrl ? avatarUrl.replace('.jpg', '.png') : DEFAULT_AVATAR, {
    headers: { 'User-Agent': USER_AGENT, 'X-Forwarded-For': ctx.req.headers.get('cf-connecting-ip') }
  });

  if (response.status !== 200) return fetchAvatar(id, null, ctx, true);

  const buffer = await response.arrayBuffer();
  await ctx.env.BUFFER_CACHE.put(`botAvatar/${id}`, buffer, { expirationTtl: 60 * 60 * 3 });
  return buffer;
}
