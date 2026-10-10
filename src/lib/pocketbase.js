// PocketBase access for the Panorama site (read-only).
// SERVER_BASE: used by the Node server for data (runtime; set POCKETBASE_INTERNAL_URL if needed).
// PUBLIC_BASE: used for image URLs loaded by the visitor's browser.
const env = (k) => (typeof process !== 'undefined' && process.env ? process.env[k] : undefined);
const PUBLIC_BASE = (env('PUBLIC_POCKETBASE_URL') || import.meta.env.PUBLIC_POCKETBASE_URL || 'https://admin.videotheatre.gr').replace(/\/$/, '');
const SERVER_BASE = (env('POCKETBASE_INTERNAL_URL') || PUBLIC_BASE).replace(/\/$/, '');
const VENUE_ID = env('PANORAMA_VENUE_ID') || '';
const VENUE_SLUG = env('PANORAMA_VENUE_SLUG') || 'panorama-digital-theatre';
const TIMEOUT_MS = 10000;

export const lastErrors = [];
const recordError = (msg) => {
  console.error('[pocketbase] ' + msg);
  lastErrors.unshift({ at: new Date().toISOString(), msg });
  lastErrors.length = Math.min(lastErrors.length, 20);
};

async function getJson(path) {
  const res = await fetch(SERVER_BASE + path, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(() => '')).slice(0, 160)}`);
  return res.json();
}

// Every page of a collection; errors are logged, never hidden.
export async function list(collection, params = {}) {
  const items = [];
  for (let page = 1; ; page++) {
    const qs = new URLSearchParams({ perPage: '200', ...params, page: String(page) });
    let data;
    try {
      data = await getJson('/api/collections/' + collection + '/records?' + qs);
    } catch (e) {
      recordError(`${collection}: ${e?.cause?.code || ''} ${e?.message || e}`);
      return items;
    }
    items.push(...(data.items || []));
    if (!data.totalPages || page >= data.totalPages) return items;
  }
}

export const mediaUrl = (r) => (r?.id && r?.file ? PUBLIC_BASE + '/api/files/media/' + r.id + '/' + r.file : null);

// Media by record ID (never by file name), cached for 5 minutes.
const mediaCache = new Map();
export async function mediaById(id) {
  if (!id) return null;
  const hit = mediaCache.get(id);
  if (hit && hit.expires > Date.now()) return hit.url;
  try {
    const url = mediaUrl(await getJson('/api/collections/media/records/' + id));
    mediaCache.set(id, { url, expires: Date.now() + 5 * 60 * 1000 });
    return url;
  } catch (e) {
    recordError(`media ${id}: ${e?.message || e}`);
    return hit?.url || null;
  }
}

const findVenue = (venues) =>
  (VENUE_ID && venues.find((v) => v.id === VENUE_ID)) ||
  venues.find((v) => v.slug === VENUE_SLUG) ||
  venues.find((v) => /panorama/i.test((v.slug || '') + ' ' + v.name));

// Contact details come from the venue record, so they are edited in the admin.
export async function venueInfo() {
  const venues = await list('venues', { filter: 'editorial_status="published"' });
  const v = findVenue(venues);
  if (!v) return { name: 'Panorama Digital Theatre', address: '', phone: '', email: '' };
  return { id: v.id, name: v.name, address: v.address || '', phone: v.phone || '', email: v.email || '' };
}

const day = (d) => (d ? String(d).slice(0, 10) : '');
const today = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
};

// "Coming soon" switches to "now" by itself when its start date arrives.
function statusOf(p, presentations) {
  const s = p.display_status || 'now';
  if (s !== 'upcoming') return s;
  const start = day(p.upcoming_date) || presentations[0]?.start || '';
  return start && start <= today() ? 'now' : 'upcoming';
}

export const formatDate = (d) => (d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '');
export const youtubeEmbed = (url) => {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? 'https://www.youtube-nocookie.com/embed/' + m[1] : null;
};
const validUrl = (u) => (/^https?:\/\//i.test(u || '') ? u.trim() : '');
export const ticketUrl = (p) => (p.status === 'past' ? '' : validUrl(p.ticketing_url) || p.presentations.find((x) => x.ticketingUrl)?.ticketingUrl || '');

// Productions presented at Panorama, split into current (now + coming soon) and archive.
// Order: now (latest start first), then coming soon (soonest first); archive newest first.
export async function experiences(lang = 'el') {
  const [venues, productions, runs, spaces] = await Promise.all([
    list('venues', { filter: 'editorial_status="published"' }),
    list('productions', { filter: 'editorial_status="published"', expand: 'poster,hero_image' }),
    list('runs'),
    list('spaces'),
  ]);
  const venue = findVenue(venues);
  if (!venue) {
    recordError(`venue not found (venues: ${venues.length}, slug "${VENUE_SLUG}")`);
    return { current: [], archive: [] };
  }
  const venueRuns = runs.filter((r) => r.venue === venue.id);
  const ids = new Set(venueRuns.map((r) => r.production));
  const all = await Promise.all(
    productions.filter((p) => ids.has(p.id)).map(async (p) => {
      const t = lang === 'el' ? {} : (await list('production_translations', { filter: `production="${p.id}" && language="${lang}" && translation_status="published"`, perPage: '1' }))[0] || {};
      const presentations = venueRuns
        .filter((r) => r.production === p.id)
        .map((r) => ({ space: spaces.find((s) => s.id === r.space)?.name || '', start: day(r.start_date), end: day(r.end_date), ticketingUrl: validUrl(r.ticketing_url) }))
        .sort((a, b) => a.start.localeCompare(b.start));
      return {
        ...p,
        title: t.title || p.title || '',
        short_description: t.short_description || p.short_description || '',
        description: t.description || p.description || '',
        poster: mediaUrl(p.expand?.poster),
        hero: mediaUrl(p.expand?.hero_image),
        presentations,
        start: day(p.upcoming_date) || presentations[0]?.start || '',
        end: presentations.map((x) => x.end).filter(Boolean).sort().pop() || '',
        status: statusOf(p, presentations),
      };
    })
  );
  const items = all.filter((p) => p.title);
  const rank = { now: 0, upcoming: 1 };
  const current = items
    .filter((p) => p.status !== 'past')
    .sort((a, b) => rank[a.status] - rank[b.status] || (a.status === 'now' ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)));
  const archive = items.filter((p) => p.status === 'past').sort((a, b) => (b.end || b.start).localeCompare(a.end || a.start));
  return { current, archive };
}

export async function health() {
  lastErrors.length = 0;
  const [venues, productions, runs] = await Promise.all([
    list('venues', { filter: 'editorial_status="published"' }),
    list('productions', { filter: 'editorial_status="published"' }),
    list('runs'),
  ]);
  const venue = findVenue(venues);
  return {
    serverBase: SERVER_BASE,
    counts: { venues: venues.length, productions: productions.length, runs: runs.length },
    venue: venue ? { id: venue.id, slug: venue.slug } : null,
    runsAtVenue: venue ? runs.filter((r) => r.venue === venue.id).length : 0,
    errors: [...lastErrors],
  };
}
