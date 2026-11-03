import { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityType, AppData, Match, Player } from '../types';

const STORAGE_KEY = 'vtv_state_cache_v3';

// Remove old legacy keys that caused zombie matches to re-appear across devices
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('vtv_permanent_matches_history');
    localStorage.removeItem('vtv_freier_grund_data_cache');
  }
} catch {
  // ignore
}

const HISTORICAL_BASELINES: Record<string, { games: number; losses: number; wins: number }> = {
  'Sandro': { games: 73, losses: 39, wins: 34 },
  'Max': { games: 64, losses: 30, wins: 34 },
  'Felix': { games: 63, losses: 28, wins: 35 },
  'Basti': { games: 62, losses: 28, wins: 34 },
  'Jonas': { games: 55, losses: 29, wins: 26 },
  'Lukas Henrichs': { games: 51, losses: 31, wins: 20 },
  'Lukas': { games: 51, losses: 31, wins: 20 },
  'Nico': { games: 48, losses: 21, wins: 27 },
  'Stefan': { games: 26, losses: 9, wins: 17 },
  'Elton': { games: 23, losses: 12, wins: 11 },
  'Tom': { games: 14, losses: 8, wins: 6 },
  'Lukas Heider': { games: 8, losses: 5, wins: 3 },
  'Robin': { games: 4, losses: 2, wins: 2 },
};

function getLocalBackup(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: AppData = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.players)) {
      parsed.players.forEach((p: Player) => {
        if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
          p.historicalStats = HISTORICAL_BASELINES[p.name];
        }
      });
      if (!parsed.historicalTotalMatches) {
        parsed.historicalTotalMatches = 73;
      }
      if (Array.isArray(parsed.deletedMatchIds) && parsed.deletedMatchIds.length > 0) {
        const delSet = new Set(parsed.deletedMatchIds);
        parsed.matches = (parsed.matches || []).filter((m) => !delSet.has(m.id));
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveLocalBackup(state: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useFootballData() {
  const [data, setData] = useState<AppData | null>(() => getLocalBackup());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);
  const lastUpdatedRef = useRef<string>('');

  const fetchState = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(null);
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: AppData = await res.json();

      if (isMountedRef.current) {
        // Enforce tombstones
        if (Array.isArray(json.deletedMatchIds) && json.deletedMatchIds.length > 0) {
          const delSet = new Set(json.deletedMatchIds);
          json.matches = (json.matches || []).filter((m) => !delSet.has(m.id));
        }

        // Server is the single source of truth - update state and local cache
        lastUpdatedRef.current = json.lastUpdated || '';
        setData(json);
        saveLocalBackup(json);
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Failed to fetch state from server:', err);
        const local = getLocalBackup();
        if (local && !data) {
          setData(local);
          setLoading(false);
        }
        if (!silent) {
          setError('Verbindung zum Server fehlgeschlagen. Versuche erneut...');
        }
      }
    }
  }, [data]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchState(false);

    // Live background polling for instant multi-device synchronization
    const interval = setInterval(() => {
      fetchState(true);
    }, 3000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchState]);

  const addMatch = async (matchData: {
    participantIds?: string[];
    loserIds?: string[];
    sessionDate?: string;
    note?: string;
    activityType?: ActivityType;
    sportName?: string;
  }) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fehler beim Speichern des Spiels');
      }

      const resJson = await res.json();
      const updatedState = resJson.state as AppData;
      setData(updatedState);
      saveLocalBackup(updatedState);
      lastUpdatedRef.current = updatedState.lastUpdated;
      return resJson.match as Match;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMatch = async (id: string, pin: string = '57290') => {
    // Optimistically remove from state & local storage immediately
    setData((prev) => {
      if (!prev) return null;
      const updatedMatches = prev.matches.filter((m) => m.id !== id);
      const updatedDeletedIds = Array.from(new Set([...(prev.deletedMatchIds || []), id]));
      const nextState: AppData = {
        ...prev,
        matches: updatedMatches,
        deletedMatchIds: updatedDeletedIds,
        lastUpdated: new Date().toISOString(),
      };
      saveLocalBackup(nextState);
      return nextState;
    });

    const res = await fetch(`/api/matches/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': pin,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      // If 404, it was already deleted on server, which is fine
      if (res.status !== 404) {
        throw new Error(errJson.error || 'Fehler beim Löschen des Spiels');
      }
    }

    const resJson = await res.json().catch(() => ({}));
    if (resJson && resJson.state) {
      const serverState = resJson.state as AppData;
      setData(serverState);
      saveLocalBackup(serverState);
      lastUpdatedRef.current = serverState.lastUpdated;
    }
    return true;
  };

  const clearAllMatches = async (pin: string = '57290') => {
    const res = await fetch('/api/matches/clear-all', {
      method: 'POST',
      headers: {
        'x-admin-pin': pin,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Löschen der Spiele');
    }

    const resJson = await res.json();
    const updatedState = resJson.state as AppData;
    setData(updatedState);
    saveLocalBackup(updatedState);
    lastUpdatedRef.current = updatedState.lastUpdated;
    return true;
  };

  const forceSync = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('vtv_permanent_matches_history');
      localStorage.removeItem('vtv_freier_grund_data_cache');
    } catch {
      // ignore
    }
    await fetchState(false);
  };

  const editMatch = async (
    id: string,
    matchData: {
      participantIds?: string[];
      loserIds?: string[];
      sessionDate?: string;
      note?: string;
      activityType?: ActivityType;
      sportName?: string;
    },
    pin: string = '57290'
  ) => {
    const res = await fetch(`/api/matches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin,
      },
      body: JSON.stringify(matchData),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Aktualisieren des Spiels');
    }

    const resJson = await res.json();
    const updatedState = resJson.state as AppData;
    setData(updatedState);
    saveLocalBackup(updatedState);
    lastUpdatedRef.current = updatedState.lastUpdated;
    return resJson.match as Match;
  };

  const updateAttendees = async (attendeeIds: string[]) => {
    const res = await fetch('/api/attendees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendeeIds }),
    });

    if (res.ok) {
      setData((prev) => (prev ? { ...prev, activeAttendeeIds: attendeeIds } : null));
    }
  };

  const addPlayer = async (name: string, pin: string = '57290') => {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Hinzufügen des Spielers');
    }

    const resJson = await res.json();
    setData(resJson.state);
    saveLocalBackup(resJson.state);
    lastUpdatedRef.current = resJson.state.lastUpdated;
  };

  const deletePlayer = async (id: string, pin: string = '57290') => {
    const res = await fetch(`/api/players/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': pin,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Entfernen des Spielers');
    }

    const resJson = await res.json();
    setData(resJson.state);
    saveLocalBackup(resJson.state);
    lastUpdatedRef.current = resJson.state.lastUpdated;
  };

  const resetSeed = async (pin: string = '57290') => {
    const res = await fetch('/api/reset-seed', {
      method: 'POST',
      headers: {
        'x-admin-pin': pin,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Zurücksetzen');
    }

    const resJson = await res.json();
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('vtv_permanent_matches_history');
      localStorage.removeItem('vtv_freier_grund_data_cache');
    } catch {
      // ignore
    }
    setData(resJson.state);
    saveLocalBackup(resJson.state);
    lastUpdatedRef.current = resJson.state.lastUpdated;
  };

  const importData = async (importedData: Partial<AppData>, pin: string = '57290') => {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': pin,
      },
      body: JSON.stringify(importedData),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Importieren der Daten');
    }

    const resJson = await res.json();
    setData(resJson.state);
    saveLocalBackup(resJson.state);
    lastUpdatedRef.current = resJson.state.lastUpdated;
  };

  // Safe manual sync: purges any corrupted local caches and forces clean reload from server
  const emergencyScanAndRestore = async () => {
    await forceSync();
    return data?.matches?.length || 0;
  };

  return {
    data,
    loading,
    error,
    isSaving,
    refresh: fetchState,
    addMatch,
    deleteMatch,
    clearAllMatches,
    forceSync,
    editMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
    emergencyScanAndRestore,
  };
}
