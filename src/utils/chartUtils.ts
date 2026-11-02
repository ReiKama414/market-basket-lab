// Shared helpers for ECharts tooltips

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * ECharts renders tooltip formatter output as HTML. Item names come from user-uploaded CSV files,
 * so they must be escaped (otherwise names like "<b>" break the tooltip or inject markup).
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
