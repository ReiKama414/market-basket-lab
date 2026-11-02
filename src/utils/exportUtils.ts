// Utility functions for exporting data and rules
import { AssociationRule, FrequentItemset } from '../types/basket';

/** Quote a CSV field and escape embedded double quotes (RFC 4180). */
function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL after the download has started
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCSV(lines: string[], filename: string) {
  // UTF-8 BOM keeps Chinese item names readable when opened in Excel
  const csvContent = '\uFEFF' + lines.join('\n');
  downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportRulesToCSV(rules: AssociationRule[], filename = 'association_rules.csv') {
  const headers = [
    'Antecedent (前項)',
    'Consequent (後項)',
    'Support (支持度)',
    'Confidence (信心度)',
    'Lift (提升度)',
    'Conviction (確信度)',
    'Leverage (槓桿率)',
    'Count (共購筆數)',
    'Antecedent Count',
    'Consequent Count'
  ];

  const rows = rules.map(r => [
    csvField(r.antecedent.join(', ')),
    csvField(r.consequent.join(', ')),
    (r.support * 100).toFixed(2) + '%',
    (r.confidence * 100).toFixed(2) + '%',
    r.lift.toFixed(3),
    r.conviction === 999 ? '∞' : r.conviction.toFixed(3),
    r.leverage.toFixed(5),
    r.count,
    r.antecedentCount,
    r.consequentCount
  ]);

  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))], filename);
}

export function exportRulesToJSON(rules: AssociationRule[], filename = 'association_rules.json') {
  const jsonContent = JSON.stringify(rules, null, 2);
  downloadBlob(new Blob([jsonContent], { type: 'application/json;charset=utf-8;' }), filename);
}

export function exportItemsetsToCSV(itemsets: FrequentItemset[], filename = 'frequent_itemsets.csv') {
  const headers = ['Itemset (頻繁項集)', 'Size (項目數)', 'Support (支持度)', 'Count (出現次數)'];
  const rows = itemsets.map(s => [
    csvField(s.items.join(', ')),
    s.size,
    (s.support * 100).toFixed(2) + '%',
    s.count
  ]);

  downloadCSV([headers.join(','), ...rows.map(e => e.join(','))], filename);
}
