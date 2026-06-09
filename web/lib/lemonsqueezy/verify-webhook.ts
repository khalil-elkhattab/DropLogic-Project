import crypto from 'node:crypto';

export function verifyLemonSqueezyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !rawBody) {
    return false;
  }

  const signature = Buffer.from(signatureHeader, 'hex');
  const hmac = Buffer.from(
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
    'hex',
  );

  if (signature.length !== hmac.length) {
    return false;
  }

  return crypto.timingSafeEqual(hmac, signature);
}
