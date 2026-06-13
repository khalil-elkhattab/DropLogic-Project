import { normalizeDropletAssetUrl } from '@/lib/asset-proxy';
import { buildBackendAssetUrl } from '@/lib/backend';

/**
 * Trigger a browser file download for a baked MP4 (via same-origin /api/download proxy).
 */
export async function downloadVideoFile(
  videoUrl: string,
  filename?: string,
): Promise<void> {
  const absolute = buildBackendAssetUrl(videoUrl);
  const normalized = normalizeDropletAssetUrl(absolute);

  if (!normalized) {
    throw new Error('Download URL is not allowed');
  }

  const name = filename || `droplogic-ad-${Date.now()}.mp4`;
  const downloadUrl = `/api/download?url=${encodeURIComponent(normalized)}&filename=${encodeURIComponent(name)}`;

  const response = await fetch(downloadUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
