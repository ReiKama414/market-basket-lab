import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  X,
  FileText,
  Table
} from 'lucide-react';
import Papa from 'papaparse';
import { ColumnMapping } from '../types/basket';
import { detectColumns } from '../datasets/csvParser';
import { useEscapeKey } from '../utils/useEscapeKey';

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLoad: (csvString: string, mapping: ColumnMapping) => void;
}

export const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmLoad
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [totalRowsCount, setTotalRowsCount] = useState<number>(0);
  const [mapping, setMapping] = useState<ColumnMapping>({
    orderCol: '',
    itemCol: '',
    isWideFormat: false
  });
  const [isDragging, setIsDragging] = useState(false);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      setCsvContent(text);

      const parsed = Papa.parse<Record<string, string>>(text.trim(), {
        header: true,
        preview: 10,
        skipEmptyLines: 'greedy'
      });

      const detectedHeaders = parsed.meta.fields || [];
      setHeaders(detectedHeaders);
      setPreviewRows(parsed.data);

      const detected = detectColumns(detectedHeaders);
      setMapping(detected);

      const lines = text.split('\n').filter(Boolean).length - 1;
      setTotalRowsCount(lines);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!csvContent) return;
    onConfirmLoad(csvContent, mapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-3xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <UploadCloud className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 m-0">匯入交易 CSV 檔案</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 m-0">
                支援縱向訂單紀錄與橫向購物籃格式，具備欄位自動對應
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
            aria-label="關閉視窗"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Zone */}
        {!csvContent ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
              isDragging
                ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/40 hover:border-zinc-400'
            }`}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                點擊上傳或將 CSV 檔案拖曳至此處
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                支援 .csv, .tsv 等文字格式 (UTF-8 編碼)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* File Info */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{fileName}</span>
                <span className="text-zinc-500 font-mono text-[11px] shrink-0">
                  (約 {totalRowsCount.toLocaleString()} 列)
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setCsvContent(''); setFileName(''); }}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline shrink-0 ml-2"
              >
                更換檔案
              </button>
            </div>

            {/* Safeguard Warning */}
            {totalRowsCount > 30000 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-start space-x-2 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">資料量保護啟動：</span>
                  此檔案共有 {totalRowsCount.toLocaleString()} 列。系統預設擷取前 30,000 筆訂單以確保瀏覽器極速運算。
                </div>
              </div>
            )}

            {/* Column Mapping */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">欄位對應設定 (自動推測)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                    訂單編號欄位 (Order / Transaction ID)
                  </label>
                  <select
                    value={mapping.orderCol}
                    onChange={(e) => setMapping({ ...mapping, orderCol: e.target.value })}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                    商品名稱欄位 (Item / Product Description)
                  </label>
                  <select
                    value={mapping.itemCol}
                    onChange={(e) => setMapping({ ...mapping, itemCol: e.target.value })}
                    disabled={mapping.isWideFormat}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 disabled:opacity-40 focus:outline-none"
                  >
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mapping.isWideFormat}
                    onChange={(e) => setMapping({ ...mapping, isWideFormat: e.target.checked })}
                    className="rounded bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-0 w-3.5 h-3.5"
                  />
                  <span>橫向購物籃格式 (每列為單筆訂單，多個商品分布在不同欄位)</span>
                </label>
              </div>
            </div>

            {/* Preview Table */}
            <div className="space-y-1">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                <Table className="w-3.5 h-3.5" />
                <span>前 5 筆原始資料預覽：</span>
              </div>
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-40">
                <table className="w-full text-left text-xs text-zinc-800 dark:text-zinc-200">
                  <thead className="bg-zinc-100 dark:bg-zinc-950 text-[10px] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="py-1.5 px-2.5 font-semibold whitespace-nowrap">
                          {h}
                          {h === mapping.orderCol && <span className="ml-1 text-zinc-900 dark:text-white font-bold">(訂單)</span>}
                          {h === mapping.itemCol && <span className="ml-1 text-zinc-900 dark:text-white font-bold">(商品)</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
                    {previewRows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-950">
                        {headers.map(h => (
                          <td key={h} className="py-1 px-2.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300 text-[11px]">
                            {row[h] || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md text-xs font-semibold transition"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!csvContent}
            className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 text-white dark:text-zinc-900 rounded-md text-xs font-semibold shadow-xs transition"
          >
            確認並開始分析
          </button>
        </div>
      </div>
    </div>
  );
};
