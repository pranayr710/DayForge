/**
 * Phase 2 Sync Boundary (Supabase).
 * Local IndexedDB remains the active source of truth in Phase 1.
 * Do not claim cloud sync is active until Supabase integration is implemented.
 */
export interface SyncStatus {
  enabled: boolean;
  provider: 'local-only' | 'supabase';
  lastSyncedAt: string | null;
  pendingChanges: number;
}

export interface SyncAdapter {
  getStatus(): SyncStatus;
  pushChanges(): Promise<void>;
  pullChanges(): Promise<void>;
}

export const localOnlySyncAdapter: SyncAdapter = {
  getStatus: () => ({
    enabled: false,
    provider: 'local-only',
    lastSyncedAt: null,
    pendingChanges: 0,
  }),
  pushChanges: async () => {
    // Phase 2 hook
  },
  pullChanges: async () => {
    // Phase 2 hook
  },
};
