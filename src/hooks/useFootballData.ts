import { useEffect, useState, useCallback, useRef } from 'react';
import { AppData, Match, Player } from '../types';

const STORAGE_KEY = 'vtv_freier_grund_data_cache';

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
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.matches) && Array.isArray(parsed.players)) {
      // Ensure historical stats are present
      parsed.players.forEach((p: Player) => {
        if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
          p.historicalStats = HISTORICAL_BASELINES[p.name];
        }
      });
      if (!parsed.historicalTotalMatches) {
        parsed.historicalTotalMatches = 73;
      }
      return parsed as AppData;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveLocalBackup(state: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
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
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: AppData = await res.json();
      if (isMountedRef.current) {
        // RESILIENT AUTO-RECOVERY CHECK:
        // If server lost matches due to container sleep/restart (e.g. Render free tier),
        // but this browser has saved matches in localStorage:
        const local = getLocalBackup();
        if (json.matches.length === 0 && local && local.matches.length > 0) {
          console.warn('[Auto-Recovery] Server restarted empty. Restoring cached matches to server...');
          fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(local),
          })
            .then(async (r) => {
              if (r.ok) {
                const restored = await r.json();
                if (isMountedRef.current && restored.state) {
                  setData(restored.state);
                  lastUpdatedRef.current = restored.state.lastUpdated;
                  saveLocalBackup(restored.state);
                }
              }
            })
            .catch(console.error);

          setData(local);
        } else {
          // Normal sync: keep local backup in sync with latest server state
          if (json.matches.length >= (local?.matches.length || 0)) {
            saveLocalBackup(json);
          }
          if (json.lastUpdated !== lastUpdatedRef.current) {
            lastUpdatedRef.current = json.lastUpdated;
            setData(json);
          }
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Failed to fetch state:', err);
        // Fallback to local storage if offline
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchState(false);

    // Live background polling for multi-device sync
    const interval = setInterval(() => {
      fetchState(true);
    }, 3500);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchState]);

  const addMatch = async (matchData: {
    participantIds?: string[];
    loserIds: string[];
    sessionDate?: string;
    note?: string;
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
      setData(resJson.state);
      saveLocalBackup(resJson.state);
      return resJson.match as Match;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': '57290' },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fehler beim Löschen');
      }
      const resJson = await res.json();
      setData(resJson.state);
      saveLocalBackup(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  const editMatch = async (
    id: string,
    matchData: {
      participantIds?: string[];
      loserIds?: string[];
      note?: string;
    }
  ) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': '57290',
        },
        body: JSON.stringify(matchData),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fehler beim Bearbeiten des Spiels');
      }
      const resJson = await res.json();
      setData(resJson.state);
      saveLocalBackup(resJson.state);
      return resJson.match as Match;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAttendees = async (attendeeIds: string[]) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeIds }),
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren der Anwesenheit');
      setData((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, activeAttendeeIds: attendeeIds };
        saveLocalBackup(updated);
        return updated;
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addPlayer = async (name: string) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': '57290',
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
      return resJson.player as Player;
    } finally {
      setIsSaving(false);
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': '57290' },
      });
      if (!res.ok) throw new Error('Fehler beim Löschen des Spielers');
      const resJson = await res.json();
      setData(resJson.state);
      saveLocalBackup(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  const resetSeed = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/reset-seed', {
        method: 'POST',
        headers: { 'x-admin-pin': '57290' },
      });
      if (!res.ok) throw new Error('Fehler beim Zurücksetzen');
      const resJson = await res.json();
      setData(resJson.state);
      saveLocalBackup(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  const importData = async (imported: Partial<AppData>) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-pin': '57290',
        },
        body: JSON.stringify(imported),
      });
      if (!res.ok) throw new Error('Fehler beim Importieren');
      const resJson = await res.json();
      setData(resJson.state);
      saveLocalBackup(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    data,
    loading,
    error,
    isSaving,
    refresh: fetchState,
    addMatch,
    editMatch,
    deleteMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
  };
}
