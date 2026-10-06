


function base64UrlEncode(input: string): string {
  
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function encodeShortCode(slug: string): string {
  return base64UrlEncode(slug);
}

export function buildShortUrl(slug: string): string {
  const code = encodeShortCode(slug);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/s/${code}`;
  }
  return `/s/${code}`;
}
