import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString?: string): string {
  if (!timeString) return '-';
  return timeString;
}

/**
 * Format any document ID to standard 4 digits: e.g. GP26-000010 -> GP26-0010
 */
export function formatDocId(id?: string): string {
  if (!id) return '';
  return id.replace(/^([A-Za-z]+)(\d{2})-(\d+)$/, (_, prefix, yy, seq) => {
    return `${prefix}${yy}-${String(parseInt(seq, 10)).padStart(4, '0')}`;
  });
}

export function generateDocId(prefix: string, existingListOrCount: any[] | number): string {
  const year = new Date().getFullYear();
  const yearSuffix = year.toString().slice(-2);
  let count = 0;

  if (Array.isArray(existingListOrCount)) {
    const currentYearPrefix = `${prefix}${yearSuffix}-`;
    let maxSeq = 0;
    let foundCount = 0;

    for (const item of existingListOrCount) {
      const id = typeof item === 'string' ? item : item?.id;
      if (typeof id === 'string' && id.startsWith(currentYearPrefix)) {
        foundCount++;
        const match = id.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    }
    count = Math.max(maxSeq, foundCount);
  } else if (typeof existingListOrCount === 'number') {
    count = existingListOrCount;
  }

  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${yearSuffix}-${sequence}`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function sortNewestFirst<T extends { id: string; createdAt?: string; date?: string; fromDate?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date || a.fromDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.date || b.fromDate || 0).getTime();
    if (timeA && timeB && timeA !== timeB) {
      return timeB - timeA;
    }
    const matchA = a.id.match(/-(\d+)$/);
    const matchB = b.id.match(/-(\d+)$/);
    if (matchA && matchB) {
      const numA = parseInt(matchA[1], 10);
      const numB = parseInt(matchB[1], 10);
      if (numA !== numB) return numB - numA;
    }
    return (b.id || '').localeCompare(a.id || '');
  });
}
