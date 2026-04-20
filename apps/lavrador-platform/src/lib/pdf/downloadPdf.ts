import { createElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

/**
 * Lazily imports @react-pdf/renderer (heavy lib) and triggers a browser download.
 * Call this only in a browser click handler — never at module load time.
 */
export async function downloadPdf(
  filename: string,
  documentElement: React.ReactElement<DocumentProps>,
) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(documentElement).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
