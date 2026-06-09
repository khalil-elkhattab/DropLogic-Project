export function getBackendUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_SERVER_FASTAPI_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

export function isAllowedBackendUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const backendHost = new URL(getBackendUrl()).host;
    return parsed.host === backendHost;
  } catch {
    return false;
  }
}

export function resolveBakedVideoUrl(renderId: string): string {
  const uniqueId = renderId.replace(/^local_bake_/, '');
  return `${getBackendUrl()}/static/outputs/final_video_${uniqueId}.mp4`;
}
