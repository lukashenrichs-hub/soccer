import React, { useState, useEffect, useRef } from 'react';
import { Check, ShieldAlert, X, RotateCcw, UserMinus, UserCheck, Flame } from 'lucide-react';
import { Player } from '../types';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  activeAttendeeIds: string[];
  onSaveMatch: (matchData: {
    participantIds: string[];
    loserIds: string[];
    note?: string;
  }) => Promise<any>;
  onUpdateAttendees?: (attendeeIds: string[]) => Promise<any>;
}

export const QuickMatchModal: React.FC<QuickMatchModalProps> = ({
  isOpen,
  onClose,
  players,
  activeAttendeeIds,
  onSaveMatch,
  onUpdateAttendees,
}) => {
  // Active participants on the pitch
  const [participants, setParticipants] = useState<string[]>([]);
  // Losers in this game
  const [losers, setLosers] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const prevIsOpenRef = useRef(false);

  // Initialize participants ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Default: If active attendees exist, use them. Otherwise default to all active players.
      const initialParticipants =
        activeAttendeeIds.length >= 2
          ? activeAttendeeIds
          : players.filter((p) => p.active).map((p) => p.id);
      setParticipants(initialParticipants);
      setLosers([]);
      setNote('');
      setErrorMsg(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle between Winner and Loser
  const toggleLoserOrWinner = (id: string) => {
    // If not participating yet, bring them into game as loser
    if (!participants.includes(id)) {
      setParticipants((prev) => [...prev, id]);
      setLosers((prev) => [...prev, id]);
      return;
    }

    // If participating and currently loser -> turn into winner
    if (losers.includes(id)) {
      setLosers((prev) => prev.filter((lId) => lId !== id));
    } else {
      // Is winner -> turn into loser
      setLosers((prev) => [...prev, id]);
    }
  };

  // Toggle in or out of the match (Pause / Nicht in der Halle)
  const togglePause = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (participants.includes(id)) {
      // Remove from match
      setParticipants((prev) => prev.filter((pId) => pId !== id));
      setLosers((prev) => prev.filter((lId) => lId !== id));
    } else {
      // Add back to match as winner by default
      setParticipants((prev) => [...prev, id]);
      setLosers((prev) => prev.filter((lId) => lId !== id));
    }
  };

  const handleResetLosers = () => {
    setLosers([]);
  };

  const handleSelectAllPlayers = () => {
    const allIds = players.filter((p) => p.active).map((p) => p.id);
    setParticipants(allIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (losers.length === 0) {
      setErrorMsg('Bitte tippe mindestens einen Verlierer an (rote Markierung).');
      return;
    }

    if (participants.length < 2) {
      setErrorMsg('Mindestens 2 Spieler müssen an einem Spiel teilnehmen.');
      return;
    }

    if (losers.length === participants.length) {
      setErrorMsg('Es können nicht alle beteiligten Spieler verloren haben. Mindestens ein Sieger muss übrig bleiben.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Save match
      await onSaveMatch({
        participantIds: participants,
        loserIds: losers,
        note: note.trim() || undefined,
      });

      // Automatically remember participants for the next match
      if (onUpdateAttendees) {
        onUpdateAttendees(participants).catch(() => {});
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlayers = players.filter((p) => p.active);
  const winnersCount = participants.length - losers.length;
  const pausedCount = activePlayers.length - participants.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-8 my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <span className="bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                VTV FREIER GRUND
              </span>
              <span>·</span>
              <span>BIS 10 TORE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Spiel eintragen</span>
              <span className="text-base text-slate-400 font-normal">
                ({participants.length} auf dem Platz)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              <strong>Rot = Verloren</strong> · <strong>Grün = Gewonnen</strong> · Über "Pause" kannst du Aussetzer markieren.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-200 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Counter Strip */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>{losers.length} Verlierer</span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{winnersCount} Gewinner</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span>{pausedCount} Pausiert / Sofa</span>
            </div>
          </div>

          {/* Player Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verlierer antippen:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetLosers}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Verlierer leeren
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={handleSelectAllPlayers}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Alle 12 aktivieren
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {activePlayers.map((player) => {
                const isParticipating = participants.includes(player.id);
                const isLoser = losers.includes(player.id);

                return (
                  <div
                    key={player.id}
                    onClick={() => toggleLoserOrWinner(player.id)}
                    className={`relative p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[70px] ${
                      isLoser
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-md shadow-rose-950/50'
                        : isParticipating
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-slate-100 hover:border-emerald-400'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-500 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="font-bold text-sm truncate pr-1 text-white">
                        {player.name}
                      </span>
                      {isLoser ? (
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                          ✕
                        </span>
                      ) : isParticipating ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600/70 text-emerald-200 flex items-center justify-center text-xs font-bold shrink-0">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          Pause
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/50">
                      <span className="font-semibold text-[11px]">
                        {isLoser ? (
                          <span className="text-rose-400">Verloren</span>
                        ) : isParticipating ? (
                          <span className="text-emerald-400">Gewonnen</span>
                        ) : (
                          <span className="text-slate-400">Pausiert</span>
                        )}
                      </span>

                      {/* Pause / Play Quick Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => togglePause(e, player.id)}
                        title={isParticipating ? 'Als pausiert / abwesend markieren' : 'Am Spiel teilnehmen lassen'}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          isParticipating
                            ? 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {isParticipating ? 'Pause' : '+ Mitspielen'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Notiz / Bemerkung (optional, z. B. "10:8", "Golden Goal"):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z. B. Spiel 3 oder 10:9"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || losers.length === 0}
            className={`px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all min-h-[44px] ${
              losers.length === 0
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? 'Speichere...' : 'Spiel bis 10 speichern'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
