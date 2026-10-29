import { useEffect, useState, useCallback, useRef } from 'react';
import { AppData, Match, Player } from '../types';

const STORAGE_KEY = 'vtv_freier_grund_data_cache';
const PERMANENT_MATCHES_KEY = 'vtv_permanent_matches_history';

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

export function getKnownMatches(): Match[] {
  const matchesMap = new Map<string, Match>();
  try {
    // 1. From permanent matches archive
    const permRaw = localStorage.getItem(PERMANENT_MATCHES_KEY);
    if (permRaw) {
      const parsed: Match[] = JSON.parse(permRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach((m) => {
          if (m && m.id) matchesMap.set(m.id, m);
        });
      }
    }

    // 2. From standard cache
    const cacheRaw = localStorage.getItem(STORAGE_KEY);
    if (cacheRaw) {
      const parsed: AppData = JSON.parse(cacheRaw);
      if (parsed && Array.isArray(parsed.matches)) {
        parsed.matches.forEach((m) => {
          if (m && m.id) matchesMap.set(m.id, m);
        });
      }
    }
  } catch {
    // ignore
  }

  return Array.from(matchesMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function saveKnownMatches(matches: Match[]) {
  try {
    const existing = getKnownMatches();
    const map = new Map<string, Match>();
    existing.forEach((m) => map.set(m.id, m));
    matches.forEach((m) => map.set(m.id, m));

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    localStorage.setItem(PERMANENT_MATCHES_KEY, JSON.stringify(combined));
    return combined;
  } catch {
    return matches;
  }
}

function getLocalBackup(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.players)) {
      parsed.players.forEach((p: Player) => {
        if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
          p.historicalStats = HISTORICAL_BASELINES[p.name];
        }
      });
      if (!parsed.historicalTotalMatches) {
        parsed.historicalTotalMatches = 73;
      }
      // Ensure all known permanent matches are attached
      const allKnown = getKnownMatches();
      if (allKnown.length > (parsed.matches?.length || 0)) {
        parsed.matches = allKnown;
      }
      return parsed as AppData;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveLocalBackup(state: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (Array.isArray(state.matches) && state.matches.length > 0) {
      saveKnownMatches(state.matches);
    }
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
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: AppData = await res.json();

      if (isMountedRef.current) {
        const localMatches = getKnownMatches();
        const serverMatches = json.matches || [];

        // Identify matches present in local storage that server doesn't have
        const serverIds = new Set(serverMatches.map((m) => m.id));
        const missingOnServer = localMatches.filter((m) => !serverIds.has(m.id));

        if (missingOnServer.length > 0) {
          console.warn(`[Auto-Recovery] Found ${missingOnServer.length} local matches missing on server. Auto-syncing...`);
          // Push missing matches to server non-destructively
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matches: localMatches }),
          })
            .then(async (r) => {
              if (r.ok) {
                const syncRes = await r.json();
                if (isMountedRef.current && syncRes.state) {
                  setData(syncRes.state);
                  lastUpdatedRef.current = syncRes.state.lastUpdated;
                  saveLocalBackup(syncRes.state);
                }
              }
            })
            .catch(console.error);

          // In the meantime, use merged state on client
          const mergedMap = new Map<string, Match>();
          serverMatches.forEach((m) => mergedMap.set(m.id, m));
          localMatches.forEach((m) => mergedMap.set(m.id, m));
          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          const mergedState: AppData = {
            ...json,
            matches: mergedList,
          };
          setData(mergedState);
          saveLocalBackup(mergedState);
        } else {
          // Server has all matches
          if (serverMatches.length > 0) {
            saveKnownMatches(serverMatches);
          }
          saveLocalBackup(json);
          if (json.lastUpdated !== lastUpdatedRef.current || !data) {
            lastUpdatedRef.current = json.lastUpdated;
            setData(json);
          }
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Failed to fetch state:', err);
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

    // Live background polling for multi-device sync
    const interval = setInterval(() => {
      fetchState(true);
    }, 4000);

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
      const updatedState = resJson.state as AppData;
      setData(updatedState);
      saveLocalBackup(updatedState);
      return resJson.match as Match;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMatch = async (id: string, pin: string = '57290') => {
    const res = await fetch(`/api/matches/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': pin,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Fehler beim Löschen des Spiels');
    }

    const resJson = await res.json();
    const updatedState = resJson.state as AppData;

    // Also remove from permanent matches cache so it doesn't auto-restore
    try {
      const remaining = getKnownMatches().filter((m) => m.id !== id);
      localStorage.setItem(PERMANENT_MATCHES_KEY, JSON.stringify(remaining));
    } catch {
      // ignore
    }

    setData(updatedState);
    saveLocalBackup(updatedState);
    return true;
  };

  const editMatch = async (
    id: string,
    matchData: {
      participantIds?: string[];
      loserIds?: string[];
      sessionDate?: string;
      note?: string;
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
    localStorage.removeItem(PERMANENT_MATCHES_KEY);
    setData(resJson.state);
    saveLocalBackup(resJson.state);
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
  };

  // Emergency scanner: scans entire localStorage across all keys for matches
  const emergencyScanAndRestore = async () => {
    try {
      const foundMatchesMap = new Map<string, Match>();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        try {
          const val = localStorage.getItem(key);
          if (!val) continue;
          if (val.includes('"scoreTo"') || val.includes('"participantIds"')) {
            const parsed = JSON.parse(val);
            const matchesArr: Match[] = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed.matches)
              ? parsed.matches
              : [];
            matchesArr.forEach((m) => {
              if (m && m.id && Array.isArray(m.loserIds)) {
                foundMatchesMap.set(m.id, m);
              }
            });
          }
        } catch {
          // ignore parsing error
        }
      }

      const allRecovered = Array.from(foundMatchesMap.values());
      if (allRecovered.length > 0) {
        saveKnownMatches(allRecovered);
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matches: allRecovered }),
        });
        if (res.ok) {
          const syncRes = await res.json();
          if (syncRes.state) {
            setData(syncRes.state);
            saveLocalBackup(syncRes.state);
            return allRecovered.length;
          }
        }
      }
      return allRecovered.length;
    } catch (e) {
      console.error('Emergency scan failed:', e);
      return 0;
    }
  };

  return {
    data,
    loading,
    error,
    isSaving,
    refresh: fetchState,
    addMatch,
    deleteMatch,
    editMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
    emergencyScanAndRestore,
  };
}
