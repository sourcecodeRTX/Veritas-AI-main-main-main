import { openDB, IDBPDatabase } from 'idb';

export interface AnalysisRecord {
  id?: number;
  timestamp: number;
  url?: string;
  textPreview?: string;
  results: any;
  starred: boolean;
  tags: string[];
  notes?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Get or create the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB('veritas-ai', 1, {
      upgrade(db) {
        // Create analyses object store
        const store = db.createObjectStore('analyses', {
          keyPath: 'id',
          autoIncrement: true,
        });
        
        // Create indexes
        store.createIndex('by-timestamp', 'timestamp');
        store.createIndex('by-starred', 'starred');
      },
    });
  }
  return dbPromise;
}

/**
 * Save an analysis to IndexedDB
 */
export async function saveAnalysis(
  results: any,
  url?: string,
  text?: string
): Promise<number> {
  try {
    const db = await getDB();
    const id = await db.add('analyses', {
      timestamp: Date.now(),
      url,
      textPreview: text?.substring(0, 500), // Store only preview
      results,
      starred: false,
      tags: [],
      notes: ''
    });
    
    console.log('[Storage] Analysis saved with ID:', id);
    return id as number;
  } catch (error) {
    console.error('[Storage] Failed to save analysis:', error);
    throw error;
  }
}

/**
 * Get analysis history (most recent first)
 */
export async function getAnalysisHistory(limit = 50): Promise<AnalysisRecord[]> {
  try {
    const db = await getDB();
    const tx = db.transaction('analyses', 'readonly');
    const index = tx.store.index('by-timestamp');
    const records = await index.getAll();
    
    // Return most recent first, limited
    return records.reverse().slice(0, limit);
  } catch (error) {
    console.error('[Storage] Failed to get history:', error);
    return [];
  }
}

/**
 * Get a single analysis by ID
 */
export async function getAnalysis(id: number): Promise<AnalysisRecord | undefined> {
  try {
    const db = await getDB();
    return await db.get('analyses', id);
  } catch (error) {
    console.error('[Storage] Failed to get analysis:', error);
    return undefined;
  }
}

/**
 * Delete an analysis
 */
export async function deleteAnalysis(id: number): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('analyses', id);
    console.log('[Storage] Analysis deleted:', id);
  } catch (error) {
    console.error('[Storage] Failed to delete analysis:', error);
    throw error;
  }
}

/**
 * Toggle star/favorite status
 */
export async function toggleStar(id: number): Promise<void> {
  try {
    const db = await getDB();
    const record = await db.get('analyses', id);
    
    if (record) {
      record.starred = !record.starred;
      await db.put('analyses', record);
      console.log('[Storage] Star toggled for:', id);
    }
  } catch (error) {
    console.error('[Storage] Failed to toggle star:', error);
    throw error;
  }
}

/**
 * Update analysis notes
 */
export async function updateNotes(id: number, notes: string): Promise<void> {
  try {
    const db = await getDB();
    const record = await db.get('analyses', id);
    
    if (record) {
      record.notes = notes;
      await db.put('analyses', record);
      console.log('[Storage] Notes updated for:', id);
    }
  } catch (error) {
    console.error('[Storage] Failed to update notes:', error);
    throw error;
  }
}

/**
 * Add tag to analysis
 */
export async function addTag(id: number, tag: string): Promise<void> {
  try {
    const db = await getDB();
    const record = await db.get('analyses', id);
    
    if (record && !record.tags.includes(tag)) {
      record.tags.push(tag);
      await db.put('analyses', record);
      console.log('[Storage] Tag added:', tag);
    }
  } catch (error) {
    console.error('[Storage] Failed to add tag:', error);
    throw error;
  }
}

/**
 * Remove tag from analysis
 */
export async function removeTag(id: number, tag: string): Promise<void> {
  try {
    const db = await getDB();
    const record = await db.get('analyses', id);
    
    if (record) {
      record.tags = record.tags.filter((t: string) => t !== tag);
      await db.put('analyses', record);
      console.log('[Storage] Tag removed:', tag);
    }
  } catch (error) {
    console.error('[Storage] Failed to remove tag:', error);
    throw error;
  }
}

/**
 * Get all starred/favorite analyses
 */
export async function getFavorites(): Promise<AnalysisRecord[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('analyses');
    const favorites = all.filter(r => r.starred);
    
    return favorites.reverse(); // Most recent first
  } catch (error) {
    console.error('[Storage] Failed to get favorites:', error);
    return [];
  }
}

/**
 * Search analyses by text (simple search in results)
 */
export async function searchAnalyses(query: string): Promise<AnalysisRecord[]> {
  try {
    const db = await getDB();
    const allRecords = await db.getAll('analyses');
    const lowerQuery = query.toLowerCase();
    
    return allRecords.filter(record => {
      const searchText = JSON.stringify(record.results).toLowerCase();
      return searchText.includes(lowerQuery) || 
             record.url?.toLowerCase().includes(lowerQuery) ||
             record.textPreview?.toLowerCase().includes(lowerQuery);
    }).reverse();
  } catch (error) {
    console.error('[Storage] Failed to search:', error);
    return [];
  }
}

/**
 * Export all data as JSON
 */
export async function exportAllData(): Promise<string> {
  try {
    const db = await getDB();
    const all = await db.getAll('analyses');
    
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      count: all.length,
      analyses: all
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('[Storage] Failed to export data:', error);
    throw error;
  }
}

/**
 * Import data from JSON
 */
export async function importData(jsonData: string): Promise<number> {
  try {
    const data = JSON.parse(jsonData);
    const analyses = data.analyses || data; // Support both formats
    
    const db = await getDB();
    let count = 0;
    
    for (const record of analyses) {
      delete record.id; // Let auto-increment assign new IDs
      await db.add('analyses', record);
      count++;
    }
    
    console.log('[Storage] Imported', count, 'analyses');
    return count;
  } catch (error) {
    console.error('[Storage] Failed to import data:', error);
    throw error;
  }
}

/**
 * Clear all data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('analyses');
    console.log('[Storage] All data cleared');
  } catch (error) {
    console.error('[Storage] Failed to clear data:', error);
    throw error;
  }
}

/**
 * Get storage statistics
 */
export async function getStats(): Promise<{
  total: number;
  starred: number;
  tags: Record<string, number>;
}> {
  try {
    const db = await getDB();
    const all = await db.getAll('analyses');
    
    const stats = {
      total: all.length,
      starred: all.filter(r => r.starred).length,
      tags: {} as Record<string, number>
    };
    
    // Count tags
    all.forEach(record => {
      record.tags.forEach((tag: string) => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1;
      });
    });
    
    return stats;
  } catch (error) {
    console.error('[Storage] Failed to get stats:', error);
    return { total: 0, starred: 0, tags: {} };
  }
}
