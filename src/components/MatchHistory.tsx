import React, { useState } from 'react';
import { Trash2, Edit3, Calendar, Clock, Trophy, XCircle, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { AppData, Match, Player } from '../types';

interface MatchHistoryProps {
  data: AppData;
  onDeleteMatch: (id: string) => Promise<any>;
  onEditMatch: (match: Match) => void;
  onBackToStats: () => void;
  onOpenNewMatch: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  data,
  onDeleteMatch,
  onEditMatch,
  onBackToStats,
  onOpenNewMatch,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const playerMap = new Map<string, Player>();
  data.players.forEach((p) => playerMap.set(p.id, p));

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDeleteMatch(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const matches = data.matches;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div>
          <button
            onClick={onBackToStats}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 mb-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zur Rangliste & Quoten
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Spielprotokoll & Historie
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronologische Aufzeichnung aller absolvierten Partien (bis 10 Tore).
          </p>
        </div>

        <button
          onClick={onOpenNewMatch}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap min-h-[40px]"
        >
          + Spiel eintragen
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">
            Noch keine Spiele eingetragen
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Sobald ihr das erste Spiel bis 10 beendet habt, tippt auf "Spiel eintragen" und markiert das Verliererteam.
          </p>
          <button
            onClick={onOpenNewMatch}
            className="px-4 py-2 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all"
          >
            Erstes Spiel erfassen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => {
            const dateObj = new Date(match.timestamp);
            const dateFormatted = dateObj.toLocaleDateString('de-DE', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const timeFormatted = dateObj.toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const losers = match.loserIds.map((id) => playerMap.get(id)?.name || 'Unbekannt');
            const winners = match.winnerIds.map((id) => playerMap.get(id)?.name || 'Unbekannt');

            return (
              <div
                key={match.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Top Info */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                      #{matches.length - idx}
                    </span>
                    <span className="text-slate-300 font-medium">{dateFormatted}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono">{timeFormatted} Uhr</span>
                    <span className="text-slate-500">·</span>
                    {(() => {
                      const lCount = match.loserIds.length;
                      const wCount = match.winnerIds.length;
                      const is3v3 = lCount === 3 && wCount === 3;
                      const is4v4 = lCount === 4 && wCount === 4;
                      const is3v4 = (lCount === 3 && wCount === 4) || (lCount === 4 && wCount === 3);
                      const isUnderdogVictory = is3v4 && wCount === 3;

                      if (isUnderdogVictory) {
                        return (
                          <span className="bg-amber-950/80 border border-amber-600/70 text-amber-300 px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center gap-1 shadow-sm">
                            <span>🔥</span> 3 vs 4 (Unterzahl-Sieg des 3er-Teams!)
                          </span>
                        );
                      }
                      if (is3v4) {
                        return (
                          <span className="bg-amber-950/40 border border-amber-800/40 text-amber-200 px-2 py-0.5 rounded font-mono text-[11px] font-medium">
                            3 vs 4 (4er-Team gewinnt)
                          </span>
                        );
                      }
                      if (is3v3) {
                        return (
                          <span className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-2 py-0.5 rounded font-mono text-[11px] font-medium">
                            ⚡ 3 vs 3 (3er-Teams)
                          </span>
                        );
                      }
                      if (is4v4) {
                        return (
                          <span className="bg-sky-950/60 border border-sky-800/50 text-sky-300 px-2 py-0.5 rounded font-mono text-[11px] font-medium">
                            🛡️ 4 vs 4 (4er-Teams)
                          </span>
                        );
                      }
                      return (
                        <span className="bg-slate-800 border border-slate-700/60 text-slate-200 px-2 py-0.5 rounded font-mono text-[11px] font-medium">
                          {lCount} vs {wCount}
                        </span>
                      );
                    })()}
                    {match.note && (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                          {match.note}
                        </span>
                      </>
                    )}
                  </div>

                  {deleteConfirmId === match.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-300">Wirklich löschen?</span>
                      <button
                        onClick={() => handleDelete(match.id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-500 rounded-lg"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditMatch(match)}
                        title="Spiel nachträglich bearbeiten"
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(match.id)}
                        title="Spiel löschen"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Team Losers vs Winners Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Losers (Red) */}
                  <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Verlierer ({losers.length})
                      </span>
                      <span className="text-[10px] text-rose-400/80 font-mono">Endstand bis 10</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {losers.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs font-semibold bg-rose-900/60 border border-rose-700/60 text-rose-200 rounded-lg"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Winners (Green) */}
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Gewinner ({winners.length})
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono">10 Tore erreicht</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {winners.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs font-semibold bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 rounded-lg"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
