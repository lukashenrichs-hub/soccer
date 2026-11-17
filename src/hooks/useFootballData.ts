import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, firebaseConfigError, handleFirestoreError, OperationType } from '../firebase';
import { ActivityType, AppData, Match, Player } from '../types';

const STORAGE_KEY = 'vtv_state_cache_v3';
const VAULT_KEY = 'vtv_protected_matches_vault_v1';

const INITIAL_PLAYERS = [
  'Max',
  'Jonas',
  'Felix',
  'Lukas Henrichs',
  'Basti',
  'Elton',
  'Lukas Heider',
  'Nico',
  'Sandro',
  'Stefan',
  'Tom',
  'Robin',
];

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

function getInitialPlayers(): Player[] {
  const now = new Date().toISOString();
  return INITIAL_PLAYERS.map((name, index) => ({
    id: `p_${index + 1}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    active: true,
    createdAt: now,
    historicalStats: HISTORICAL_BASELINES[name],
  }));
}

/**
 * Cleans up legacy and temporary storage keys so stale test records from earlier
 * browser sessions can never resurrect or duplicate matches.
 */
function cleanLegacyBrowserStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(VAULT_KEY);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== STORAGE_KEY && (k.startsWith('vtv_') || k.includes('matches_backup'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Builds a canonical signature for a match based on its real-world traits.
 * Two matches with the exact same date, sport, participants, and losers are duplicate records.
 */
export function buildMatchSignature(m: Partial<Match>): string {
  const p = Array.isArray(m.participantIds) ? [...m.participantIds].sort().join(',') : '';
  const l = Array.isArray(m.loserIds) ? [...m.loserIds].sort().join(',') : '';
  const sport = m.activityType || 'football';
  const date = m.sessionDate || (m.timestamp ? m.timestamp.split('T')[0] : '');
  return `${date}_${sport}_${p}_${l}`;
}

function cleanForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (typeof val === 'string') {
        cleaned[key] = val;
      } else if (Array.isArray(val)) {
        cleaned[key] = val.filter((item) => item !== undefined);
      } else if (typeof val === 'object' && val !== null) {
        cleaned[key] = cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

function getLocalBackup(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AppData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.players)) {
        parsed.players.forEach((p) => {
          if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
            p.historicalStats = HISTORICAL_BASELINES[p.name];
          }
        });
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return {
    players: getInitialPlayers(),
    matches: [],
    activeAttendeeIds: [],
    historicalTotalMatches: 73,
    deletedMatchIds: [],
    lastUpdated: new Date().toISOString(),
  };
}

function saveLocalBackup(state: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useFootballData() {
  const [data, setData] = useState<AppData>(() => getLocalBackup());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const playersRef = useRef<Player[]>(data.players);
  const matchesRef = useRef<Match[]>(data.matches);
  const metadataRef = useRef<{
    activeAttendeeIds: string[];
    historicalTotalMatches: number;
    deletedMatchIds: string[];
    lastUpdated: string;
  }>({
    activeAttendeeIds: data.activeAttendeeIds,
    historicalTotalMatches: data.historicalTotalMatches || 73,
    deletedMatchIds: data.deletedMatchIds || [],
    lastUpdated: data.lastUpdated,
  });

  const updateCompositeData = useCallback(() => {
    const deletedSet = new Set(metadataRef.current.deletedMatchIds);
    const filteredMatches = matchesRef.current.filter((m) => !deletedSet.has(m.id));
    // Sort matches newest first
    filteredMatches.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const fullData: AppData = {
      players: playersRef.current,
      matches: filteredMatches,
      activeAttendeeIds: metadataRef.current.activeAttendeeIds,
      historicalTotalMatches: metadataRef.current.historicalTotalMatches,
      deletedMatchIds: metadataRef.current.deletedMatchIds,
      lastUpdated: metadataRef.current.lastUpdated || new Date().toISOString(),
    };

    setData(fullData);
    saveLocalBackup(fullData);
    setLoading(false);
  }, []);

  // Set up real-time Firestore listeners with automatic initial seeding
  useEffect(() => {
    let unsubscribePlayers: (() => void) | undefined;
    let unsubscribeMatches: (() => void) | undefined;
    let unsubscribeMetadata: (() => void) | undefined;

    const setupFirestoreSync = async () => {
      if (firebaseConfigError) {
        setError(firebaseConfigError);
        setLoading(false);
        return;
      }
      try {
        cleanLegacyBrowserStorage();

        // 1. Players Real-Time Listener
        const playersPath = 'players';
        unsubscribePlayers = onSnapshot(
          collection(db, playersPath),
          async (snapshot) => {
            if (snapshot.empty) {
              console.log('[Firestore] No players found in cloud database. Seeding initial 12 players...');
              const initial = getInitialPlayers();
              const batch = writeBatch(db);
              for (const p of initial) {
                batch.set(doc(db, playersPath, p.id), cleanForFirestore(p));
              }
              try {
                await batch.commit();
              } catch (seedErr) {
                handleFirestoreError(seedErr, OperationType.WRITE, playersPath);
              }
              playersRef.current = initial;
            } else {
              const loadedPlayers: Player[] = [];
              snapshot.forEach((docSnap) => {
                const p = docSnap.data() as Player;
                if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
                  p.historicalStats = HISTORICAL_BASELINES[p.name];
                }
                loadedPlayers.push(p);
              });
              playersRef.current = loadedPlayers;
            }
            updateCompositeData();
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, playersPath);
          }
        );

        // 2. Metadata Real-Time Listener
        const metaPath = 'metadata';
        unsubscribeMetadata = onSnapshot(
          doc(db, metaPath, 'appState'),
          (docSnap) => {
            if (docSnap.exists()) {
              const meta = docSnap.data();
              metadataRef.current = {
                activeAttendeeIds: Array.isArray(meta.activeAttendeeIds) ? meta.activeAttendeeIds : [],
                historicalTotalMatches: meta.historicalTotalMatches || 73,
                deletedMatchIds: Array.isArray(meta.deletedMatchIds) ? meta.deletedMatchIds : [],
                lastUpdated: meta.lastUpdated || new Date().toISOString(),
              };
            } else {
              // Create default metadata doc
              setDoc(
                doc(db, metaPath, 'appState'),
                {
                  activeAttendeeIds: [],
                  historicalTotalMatches: 73,
                  deletedMatchIds: [],
                  lastUpdated: new Date().toISOString(),
                },
                { merge: true }
              ).catch((e) => handleFirestoreError(e, OperationType.WRITE, `${metaPath}/appState`));
            }
            updateCompositeData();
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `${metaPath}/appState`);
          }
        );

        // 3. Matches Real-Time Listener
        const matchesPath = 'matches';
        unsubscribeMatches = onSnapshot(
          collection(db, matchesPath),
          (snapshot) => {
            const cloudMatches: Match[] = [];
            snapshot.forEach((docSnap) => {
              cloudMatches.push(docSnap.data() as Match);
            });

            // Sort newest first by timestamp
            cloudMatches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            matchesRef.current = cloudMatches;
            updateCompositeData();
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, matchesPath);
          }
        );
      } catch (err: any) {
        console.error('Failed to initialize Firestore sync:', err);
        setError('Verbindung zur Cloud-Datenbank konnte nicht hergestellt werden.');
        setLoading(false);
      }
    };

    setupFirestoreSync();

    return () => {
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribeMatches) unsubscribeMatches();
      if (unsubscribeMetadata) unsubscribeMetadata();
    };
  }, [updateCompositeData]);

  // Add Match to Firestore (Permanently stored in Google Cloud Firestore)
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
      const isAlternative = matchData.activityType && matchData.activityType !== 'football';
      const finalLosers = Array.isArray(matchData.loserIds) ? matchData.loserIds : [];

      if (!isAlternative && finalLosers.length === 0) {
        throw new Error('Mindestens ein Verlierer muss angegeben werden.');
      }

      let finalParticipants =
        Array.isArray(matchData.participantIds) && matchData.participantIds.length > 0
          ? matchData.participantIds
          : data.activeAttendeeIds.length > 0
          ? data.activeAttendeeIds
          : finalLosers;

      for (const loserId of finalLosers) {
        if (!finalParticipants.includes(loserId)) {
          finalParticipants = [...finalParticipants, loserId];
        }
      }

      const winnerIds = finalParticipants.filter((id) => !finalLosers.includes(id));
      const now = new Date();
      const dateStr = matchData.sessionDate || now.toISOString().split('T')[0];
      let matchTimestamp = now.toISOString();
      if (matchData.sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(matchData.sessionDate)) {
        const [y, m, d] = matchData.sessionDate.split('-').map(Number);
        const customDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        matchTimestamp = customDate.toISOString();
      }

      const cleanNote = matchData.note ? matchData.note.trim() : '';

      // Double-tap Guard (prevent accidental identical duplicate within 30 seconds)
      const candidateMatch: Partial<Match> = {
        sessionDate: dateStr,
        activityType: matchData.activityType || 'football',
        participantIds: finalParticipants,
        loserIds: finalLosers,
      };
      const candidateSig = buildMatchSignature(candidateMatch);
      const nowMs = Date.now();
      const recentDuplicate = matchesRef.current.find((m) => {
        if (buildMatchSignature(m) !== candidateSig) return false;
        const mTime = new Date(m.timestamp).getTime();
        return Number.isFinite(mTime) && Math.abs(nowMs - mTime) < 30000;
      });
      if (recentDuplicate) {
        console.warn('[Firestore] Duplicate submission within 30s prevented.');
        return recentDuplicate;
      }

      const newMatch: Match = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: matchTimestamp,
        sessionDate: dateStr,
        scoreTo: isAlternative ? 0 : 10,
        participantIds: finalParticipants,
        loserIds: finalLosers,
        winnerIds,
        note: cleanNote,
        activityType: matchData.activityType || 'football',
        sportName: matchData.sportName || (isAlternative ? 'Badminton' : 'Fußball'),
      };

      const path = 'matches';
      try {
        await setDoc(doc(db, path, newMatch.id), cleanForFirestore(newMatch));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `${path}/${newMatch.id}`);
      }

      // Also persist to metadata lastUpdated
      setDoc(
        doc(db, 'metadata', 'appState'),
        { lastUpdated: new Date().toISOString() },
        { merge: true }
      ).catch(() => {});

      return newMatch;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Match from Firestore (Permanent removal)
  const deleteMatch = async (id: string, _pin: string = '57290') => {
    const path = 'matches';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }

    // Add to tombstone list in metadata
    const updatedDeletedIds = Array.from(new Set([...metadataRef.current.deletedMatchIds, id]));
    metadataRef.current.deletedMatchIds = updatedDeletedIds;
    try {
      await setDoc(
        doc(db, 'metadata', 'appState'),
        {
          deletedMatchIds: updatedDeletedIds,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'metadata/appState');
    }

    return true;
  };

  // Clear all matches from Firestore
  const clearAllMatches = async (_pin: string = '57290') => {
    const path = 'matches';
    try {
      const snap = await getDocs(collection(db, path));
      const batch = writeBatch(db);
      const deletedIds: string[] = [];
      snap.forEach((d) => {
        batch.delete(d.ref);
        deletedIds.push(d.id);
      });
      await batch.commit();

      await setDoc(
        doc(db, 'metadata', 'appState'),
        {
          deletedMatchIds: Array.from(new Set([...metadataRef.current.deletedMatchIds, ...deletedIds])),
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // Edit Match in Firestore
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
    _pin: string = '57290'
  ) => {
    const existing = matchesRef.current.find((m) => m.id === id);
    if (!existing) throw new Error('Spiel nicht gefunden');

    const finalLosers = matchData.loserIds !== undefined ? matchData.loserIds : existing.loserIds;
    const finalParticipants =
      matchData.participantIds !== undefined ? matchData.participantIds : existing.participantIds;
    const winnerIds = finalParticipants.filter((pid) => !finalLosers.includes(pid));

    const cleanNote =
      matchData.note !== undefined
        ? (matchData.note || '').trim()
        : (existing.note || '');

    const updatedMatch: Match = {
      ...existing,
      participantIds: finalParticipants,
      loserIds: finalLosers,
      winnerIds,
      sessionDate: matchData.sessionDate || existing.sessionDate,
      note: cleanNote,
      activityType: matchData.activityType || existing.activityType,
      sportName: matchData.sportName || existing.sportName,
    };

    const path = 'matches';
    try {
      await setDoc(doc(db, path, id), cleanForFirestore(updatedMatch), { merge: true });
      await setDoc(
        doc(db, 'metadata', 'appState'),
        { lastUpdated: new Date().toISOString() },
        { merge: true }
      );
      return updatedMatch;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `${path}/${id}`);
    }
  };

  // Update session attendees in Firestore
  const updateAttendees = async (attendeeIds: string[]) => {
    try {
      await setDoc(
        doc(db, 'metadata', 'appState'),
        {
          activeAttendeeIds: attendeeIds,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'metadata/appState');
    }
  };

  // Add Player to Firestore
  const addPlayer = async (name: string, _pin: string = '57290') => {
    const cleanName = name.trim();
    if (!cleanName) return;

    const newPlayer: Player = {
      id: `p_${Date.now()}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: cleanName,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const path = 'players';
    try {
      await setDoc(doc(db, path, newPlayer.id), cleanForFirestore(newPlayer));
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `${path}/${newPlayer.id}`);
    }
  };

  // Delete Player from Firestore
  const deletePlayer = async (id: string, _pin: string = '57290') => {
    const path = 'players';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `${path}/${id}`);
    }
  };

  // Reset to original 12 players in Firestore
  const resetSeed = async (_pin: string = '57290') => {
    try {
      // 1. Delete all matches in Firestore
      const matchesSnap = await getDocs(collection(db, 'matches'));
      const batch1 = writeBatch(db);
      matchesSnap.forEach((d) => batch1.delete(d.ref));
      await batch1.commit();

      // 2. Clear players and seed original 12
      const playersSnap = await getDocs(collection(db, 'players'));
      const batch2 = writeBatch(db);
      playersSnap.forEach((d) => batch2.delete(d.ref));

      const initial = getInitialPlayers();
      for (const p of initial) {
        batch2.set(doc(db, 'players', p.id), cleanForFirestore(p));
      }
      await batch2.commit();

      // 3. Reset metadata
      await setDoc(doc(db, 'metadata', 'appState'), {
        activeAttendeeIds: [],
        historicalTotalMatches: 73,
        deletedMatchIds: [],
        lastUpdated: new Date().toISOString(),
      });

      // Clear local storage caches
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(VAULT_KEY);
      } catch {}
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'reset-seed');
    }
  };

  // Import JSON backup into Firestore
  const importData = async (importedData: Partial<AppData>, _pin: string = '57290') => {
    try {
      const batch = writeBatch(db);

      if (Array.isArray(importedData.players)) {
        for (const p of importedData.players) {
          if (p && p.id) {
            batch.set(doc(db, 'players', p.id), cleanForFirestore(p));
          }
        }
      }

      if (Array.isArray(importedData.matches)) {
        for (const m of importedData.matches) {
          if (m && m.id) {
            batch.set(doc(db, 'matches', m.id), cleanForFirestore(m));
          }
        }
      }

      await batch.commit();

      await setDoc(
        doc(db, 'metadata', 'appState'),
        {
          activeAttendeeIds: importedData.activeAttendeeIds || [],
          historicalTotalMatches: importedData.historicalTotalMatches || 73,
          deletedMatchIds: importedData.deletedMatchIds || [],
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'import');
    }
  };

  // Cache cleanup & server deduplication
  const emergencyScanAndRestore = async () => {
    cleanLegacyBrowserStorage();
    const path = 'matches';
    const snap = await getDocs(collection(db, path));
    const seenSignatures = new Map<string, string>();
    const dupIds: string[] = [];

    snap.docs.forEach((d) => {
      const m = d.data() as Match;
      const sig = buildMatchSignature(m);
      if (seenSignatures.has(sig)) {
        dupIds.push(d.id);
      } else {
        seenSignatures.set(sig, d.id);
      }
    });

    if (dupIds.length > 0) {
      for (const id of dupIds) {
        await deleteDoc(doc(db, path, id)).catch(() => {});
      }
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VAULT_KEY);
    } catch {
      // ignore
    }

    updateCompositeData();
    return dupIds.length;
  };

  const forceSync = async (_silent?: boolean) => {
    // Firestore onSnapshot already keeps state synced live in real time
  };

  return {
    data,
    loading,
    error,
    isSaving,
    refresh: forceSync,
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
