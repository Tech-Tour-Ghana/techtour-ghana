// Pure YouTube link helpers, safe for server and client.

const ID = /^[\w-]{11}$/;

export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | undefined;
  if (host === 'youtu.be') {
    id = u.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, rest] = u.pathname.split('/');
    if (u.pathname === '/watch') id = u.searchParams.get('v') ?? undefined;
    else if (kind === 'embed' || kind === 'shorts' || kind === 'live') id = rest;
  }
  return id && ID.test(id) ? id : null;
}

export const youTubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const youTubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
