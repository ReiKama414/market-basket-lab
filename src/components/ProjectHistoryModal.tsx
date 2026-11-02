import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Trash2,
  Play,
  X,
  Clock,
  Save,
  CheckCircle2
} from 'lucide-react';
import {
  SavedProject,
  HistoryRecord,
  listProjects,
  listHistory,
  deleteProject,
  clearHistory,
  saveProject
} from '../storage/db';
import { AnalysisResult, ColumnMapping, MiningConfig } from '../types/basket';
import { useEscapeKey } from '../utils/useEscapeKey';

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResult: AnalysisResult | null;
  csvContent: string;
  /** Column mapping of the current (custom) dataset; required to reload custom CSV projects correctly */
  mapping?: ColumnMapping;
  config: MiningConfig;
  currentDatasetName: string;
  onLoadProject: (project: SavedProject) => void;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  isOpen,
  onClose,
  currentResult,
  csvContent,
  mapping,
  config,
  currentDatasetName,
  onLoadProject
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'history'>('projects');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const loadData = async () => {
    try {
      const pList = await listProjects();
      const hList = await listHistory();
      // Most recently saved first
      setProjects([...pList].sort((a, b) => b.updatedAt - a.updatedAt));
      setHistory(hList);
    } catch (err) {
      console.error('讀取專案庫失敗', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const handleSaveCurrent = async () => {
    const name = newProjectName.trim() || `${currentDatasetName} (${new Date().toLocaleDateString()})`;
    const project: SavedProject = {
      id: `proj-${Date.now()}`,
      name,
      category: '自訂分析',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      csvContent,
      mapping,
      // Persist the config that actually produced the displayed result (not unapplied slider edits)
      config: currentResult?.config ?? config,
      stats: currentResult?.stats,
      rulesCount: currentResult?.rules.length
    };

    await saveProject(project);
    setNewProjectName('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
    await loadData();
  };

  const handleDeleteProj = async (id: string) => {
    await deleteProject(id);
    await loadData();
  };

  const handleClearHistory = async () => {
    await clearHistory();
    await loadData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <FolderArchive className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 m-0">
                專案庫與探勘歷史紀錄 (IndexedDB)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 m-0">
                純本機離線持久化，關閉瀏覽器資料不遺失
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="關閉對話框"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeTab === 'projects'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              已存專案 ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeTab === 'history'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              探勘紀錄 ({history.length})
            </button>
          </div>

          {activeTab === 'history' && history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center space-x-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空紀錄</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'projects' && (
            <div className="space-y-4">
              {/* Save Current Session Input */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                  儲存目前分析為專案：
                </span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder={`專案名稱 (預設: ${currentDatasetName})...`}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    onClick={handleSaveCurrent}
                    className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded text-xs font-medium flex items-center space-x-1 shrink-0 transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>儲存</span>
                  </button>
                </div>
                {saveSuccessMsg && (
                  <span className="text-[11px] text-zinc-700 dark:text-zinc-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>已成功儲存至本機 IndexedDB！</span>
                  </span>
                )}
              </div>

              {/* Projects List */}
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                    尚未儲存任何自訂專案
                  </div>
                ) : (
                  projects.map(proj => (
                    <div
                      key={proj.id}
                      className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{proj.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>儲存時間: {new Date(proj.updatedAt).toLocaleString()}</span>
                          <span>規則數: {proj.rulesCount || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => {
                            onLoadProject(proj);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded text-xs font-medium flex items-center space-x-1 transition"
                        >
                          <Play className="w-3 h-3" />
                          <span>載入</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProj(proj.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition"
                          title="刪除專案"
                          aria-label="刪除專案"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                  尚無探勘歷史紀錄
                </div>
              ) : (
                history.map(record => (
                  <div
                    key={record.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="text-zinc-900 dark:text-zinc-100 font-sans font-medium flex items-center space-x-2">
                        <span>{record.datasetName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] uppercase font-mono">
                          {record.algorithm}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="flex items-center space-x-1 font-sans">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                        </span>
                        <span>耗時: {record.executionTimeMs}ms</span>
                        <span>項集: {record.itemsetsCount}</span>
                        <span>規則: {record.rulesCount} 條</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-medium transition"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
