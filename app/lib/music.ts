import { getHostname, getYouTubeEmbedUrl } from './url-utils';

export type MusicProviderId =
  | 'spotify'
  | 'youtube-music'
  | 'apple-music'
  | 'soundcloud'
  | 'jiosaavn'
  | 'wynk'
  | 'gaana'
  | 'hungama'
  | 'generic';

export type MusicProvider = {
  id: MusicProviderId;
  label: string;
  accent: string;
  background: string;
};

const PROVIDERS: Record<MusicProviderId, MusicProvider> = {
  spotify: {
    id: 'spotify',
    label: 'Spotify',
    accent: '#1ED760',
    background: 'linear-gradient(135deg, #08110d 0%, #113323 55%, #1ED760 140%)',
  },
  'youtube-music': {
    id: 'youtube-music',
    label: 'YouTube Music',
    accent: '#FF0033',
    background: 'linear-gradient(135deg, #180407 0%, #431018 52%, #FF0033 145%)',
  },
  'apple-music': {
    id: 'apple-music',
    label: 'Apple Music',
    accent: '#FA243C',
    background: 'linear-gradient(135deg, #16060e 0%, #4c1930 54%, #fa243c 145%)',
  },
  soundcloud: {
    id: 'soundcloud',
    label: 'SoundCloud',
    accent: '#FF5500',
    background: 'linear-gradient(135deg, #1a0900 0%, #5e2400 52%, #ff5500 145%)',
  },
  jiosaavn: {
    id: 'jiosaavn',
    label: 'JioSaavn',
    accent: '#2BC5B4',
    background: 'linear-gradient(135deg, #06110f 0%, #0e3d37 52%, #2bc5b4 145%)',
  },
  wynk: {
    id: 'wynk',
    label: 'Wynk',
    accent: '#FF5A3C',
    background: 'linear-gradient(135deg, #190804 0%, #542117 52%, #ff5a3c 145%)',
  },
  gaana: {
    id: 'gaana',
    label: 'Gaana',
    accent: '#E72C30',
    background: 'linear-gradient(135deg, #170608 0%, #4d1417 52%, #e72c30 145%)',
  },
  hungama: {
    id: 'hungama',
    label: 'Hungama',
    accent: '#FF6A00',
    background: 'linear-gradient(135deg, #180d04 0%, #5c3200 52%, #ff6a00 145%)',
  },
  generic: {
    id: 'generic',
    label: 'Music',
    accent: '#D4A017',
    background: 'linear-gradient(135deg, #17120a 0%, #403017 52%, #d4a017 145%)',
  },
};

function parseUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl);
  } catch {
    try {
      return new URL(`https://${rawUrl}`);
    } catch {
      return null;
    }
  }
}

export function getMusicProvider(sourceUrl: string | null | undefined): MusicProvider {
  const hostname = getHostname(sourceUrl)?.toLowerCase();

  if (!hostname) {
    return PROVIDERS.generic;
  }

  if (hostname.endsWith('spotify.com')) {
    return PROVIDERS.spotify;
  }

  if (hostname === 'music.youtube.com') {
    return PROVIDERS['youtube-music'];
  }

  if (hostname.endsWith('music.apple.com') || hostname.endsWith('itunes.apple.com')) {
    return PROVIDERS['apple-music'];
  }

  if (hostname.endsWith('soundcloud.com')) {
    return PROVIDERS.soundcloud;
  }

  if (hostname.endsWith('jiosaavn.com') || hostname.endsWith('saavn.com')) {
    return PROVIDERS.jiosaavn;
  }

  if (hostname.endsWith('wynk.in') || hostname.endsWith('wynkmusic.com')) {
    return PROVIDERS.wynk;
  }

  if (hostname.endsWith('gaana.com')) {
    return PROVIDERS.gaana;
  }

  if (hostname.endsWith('hungama.com')) {
    return PROVIDERS.hungama;
  }

  if (hostname.endsWith('youtube.com') || hostname.endsWith('youtu.be')) {
    return PROVIDERS['youtube-music'];
  }

  return PROVIDERS.generic;
}

export function isKnownMusicUrl(sourceUrl: string | null | undefined): boolean {
  return getMusicProvider(sourceUrl).id !== 'generic';
}

export function getMusicEmbedUrl(sourceUrl: string | null | undefined): string | null {
  const provider = getMusicProvider(sourceUrl);
  const parsed = parseUrl(sourceUrl);

  if (!parsed) {
    return null;
  }

  if (provider.id === 'spotify') {
    const match = parsed.pathname.match(/\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (!match) {
      return null;
    }

    const [, kind, id] = match;
    return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`;
  }

  if (provider.id === 'youtube-music') {
    return getYouTubeEmbedUrl(sourceUrl, {
      autoplay: false,
      mute: false,
    });
  }

  if (provider.id === 'soundcloud') {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(parsed.toString())}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`;
  }

  if (provider.id === 'apple-music') {
    return parsed.toString().replace('://music.apple.com/', '://embed.music.apple.com/');
  }

  return null;
}

export function getMusicProviderSummary(sourceUrl: string | null | undefined): string {
  const provider = getMusicProvider(sourceUrl);
  return provider.label;
}
