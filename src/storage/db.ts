// IndexedDB Storage Layer using 'idb'
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ColumnMapping, DatasetStats, MiningConfig, AssociationRule } from '../types/basket';

export interface SavedProject {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  csvContent: string;
  mapping?: ColumnMapping;
  config: MiningConfig;
  stats?: DatasetStats;
  rulesCount?: number;
}

export interface PinnedRule {
  id: string;
  projectId: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  conviction: number;
  leverage: number;
  notes?: string;
  pinnedAt: number;
}

export interface HistoryRecord {
  id: string;
  projectId: string;
  datasetName: string;
  algorithm: string;
  executionTimeMs: number;
  rulesCount: number;
  itemsetsCount: number;
  config: MiningConfig;
  timestamp: number;
}

interface MarketBasketDB extends DBSchema {
  projects: {
    key: string;
    value: SavedProject;
    indexes: { 'by-updated': number };
  };
  pinnedRules: {
    key: string;
    value: PinnedRule;
    indexes: { 'by-project': string; 'by-pinnedAt': number };
  };
  history: {
    key: string;
    value: HistoryRecord;
    indexes: { 'by-timestamp': number };
  };
  preferences: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'MarketBasketLab_v2';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MarketBasketDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MarketBasketDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MarketBasketDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updated', 'updatedAt');
        }

        // Pinned rules store
        if (!db.objectStoreNames.contains('pinnedRules')) {
          const ruleStore = db.createObjectStore('pinnedRules', { keyPath: 'id' });
          ruleStore.createIndex('by-project', 'projectId');
          ruleStore.createIndex('by-pinnedAt', 'pinnedAt');
        }

        // History store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }

        // Preferences store
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

// === Project Storage APIs ===
export async function saveProject(project: SavedProject): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

export async function getProject(id: string): Promise<SavedProject | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function listProjects(): Promise<SavedProject[]> {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-updated');
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['projects', 'pinnedRules'], 'readwrite');
  await tx.objectStore('projects').delete(id);

  // Cascade delete pinned rules
  const ruleIndex = tx.objectStore('pinnedRules').index('by-project');
  let cursor = await ruleIndex.openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// === Pinned Rules APIs ===
/**
 * Stable identity of a rule, independent of the run-local `rule.id` (rule-0, rule-1, ...)
 * which changes whenever thresholds / algorithm / dataset change.
 */
export function ruleKey(rule: Pick<AssociationRule, 'antecedent' | 'consequent'>): string {
  return `${[...rule.antecedent].sort().join('|')}=>${[...rule.consequent].sort().join('|')}`;
}

export function pinnedStorageId(projectId: string, rule: Pick<AssociationRule, 'antecedent' | 'consequent'>): string {
  return `${projectId}::${ruleKey(rule)}`;
}

export async function pinRule(rule: AssociationRule, projectId: string, notes = ''): Promise<PinnedRule> {
  const db = await getDB();
  const pinned: PinnedRule = {
    id: pinnedStorageId(projectId, rule),
    projectId,
    antecedent: rule.antecedent,
    consequent: rule.consequent,
    support: rule.support,
    confidence: rule.confidence,
    lift: rule.lift,
    conviction: rule.conviction,
    leverage: rule.leverage,
    notes,
    pinnedAt: Date.now()
  };
  await db.put('pinnedRules', pinned);
  return pinned;
}

export async function unpinRule(ruleId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pinnedRules', ruleId);
}

/** Unpin by stable rule identity (also cleans up entries written with the legacy id format). */
export async function unpinRuleByKey(
  projectId: string,
  rule: Pick<AssociationRule, 'antecedent' | 'consequent'>
): Promise<void> {
  const db = await getDB();
  const key = ruleKey(rule);
  const existing = await db.getAllFromIndex('pinnedRules', 'by-project', projectId);
  await Promise.all(existing.filter((p) => ruleKey(p) === key).map((p) => db.delete('pinnedRules', p.id)));
}

export async function listPinnedRules(projectId?: string): Promise<PinnedRule[]> {
  const db = await getDB();
  if (projectId) {
    return db.getAllFromIndex('pinnedRules', 'by-project', projectId);
  }
  return db.getAllFromIndex('pinnedRules', 'by-pinnedAt');
}

// === History APIs ===
export async function recordHistory(record: HistoryRecord): Promise<void> {
  const db = await getDB();
  await db.put('history', record);
}

export async function listHistory(limit = 20): Promise<HistoryRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('history', 'by-timestamp');
  return all.reverse().slice(0, limit);
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('history');
}

// === Preferences APIs ===
export async function setPreference<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('preferences', { key, value });
}

export async function getPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  const db = await getDB();
  const row = await db.get('preferences', key);
  return row ? (row.value as T) : defaultValue;
}
