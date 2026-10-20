import QRCode from 'qrcode';

/**
 * Build the full public URL for scanning and confirming a document (Gate Pass or Attendance Confirm)
 * This allows guards to scan with any smartphone camera and open directly without logging in.
 */
export function getQrConfirmUrl(type: 'gate_pass' | 'attendance', id: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'https://longkhai-portal.vercel.app';
  return `${base}/scan-confirm?type=${type}&id=${encodeURIComponent(id)}`;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}
