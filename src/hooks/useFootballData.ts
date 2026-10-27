import { useEffect, useState, useCallback, useRef } from 'react';
import { AppData, Match, Player } from '../types';

export function useFootballData() {
  const [data, setData] = useState<AppData | null>(null);
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
        // Only update state if timestamp changed or initial load
        if (json.lastUpdated !== lastUpdatedRef.current) {
          lastUpdatedRef.current = json.lastUpdated;
          setData(json);
        }
        setLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Failed to fetch state:', err);
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
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fehler beim Löschen');
      }
      const resJson = await res.json();
      setData(resJson.state);
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
      setData((prev) => (prev ? { ...prev, activeAttendeeIds: attendeeIds } : prev));
    } finally {
      setIsSaving(false);
    }
  };

  const addPlayer = async (name: string) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Fehler beim Hinzufügen des Spielers');
      }
      const resJson = await res.json();
      setData(resJson.state);
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
      });
      if (!res.ok) throw new Error('Fehler beim Löschen des Spielers');
      const resJson = await res.json();
      setData(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  const resetSeed = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/reset-seed', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Fehler beim Zurücksetzen');
      const resJson = await res.json();
      setData(resJson.state);
    } finally {
      setIsSaving(false);
    }
  };

  const importData = async (imported: Partial<AppData>) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imported),
      });
      if (!res.ok) throw new Error('Fehler beim Importieren');
      const resJson = await res.json();
      setData(resJson.state);
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
    deleteMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
  };
}
