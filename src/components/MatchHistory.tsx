import React, { useState } from 'react';
import { Trash2, Edit3, Calendar, Trophy, XCircle, CheckCircle, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { AppData, Match, Player } from '../types';
import { AdminPinModal } from './AdminPinModal';
import { isAdminAuthenticated } from '../utils/adminAuth';

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
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<{
    type: 'edit' | 'delete';
    match?: Match;
    matchId?: string;
  } | null>(null);

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

  const handleRequestEdit = (match: Match) => {
    if (isAdminAuthenticated()) {
      onEditMatch(match);
    } else {
      setPendingAdminAction({ type: 'edit', match });
      setIsPinModalOpen(true);
    }
  };

  const handleRequestDeleteClick = (matchId: string) => {
    if (isAdminAuthenticated()) {
      setDeleteConfirmId(matchId);
    } else {
      setPendingAdminAction({ type: 'delete', matchId });
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    if (!pendingAdminAction) return;
    if (pendingAdminAction.type === 'edit' && pendingAdminAction.match) {
      onEditMatch(pendingAdminAction.match);
    } else if (pendingAdminAction.type === 'delete' && pendingAdminAction.matchId) {
      setDeleteConfirmId(pendingAdminAction.matchId);
    }
    setPendingAdminAction(null);
  };

  const matches = data.matches;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Chronologische Liste aller live erfassten Partien bis 10 Tore. (Bearbeiten & Löschen PIN-geschützt)
          </p>
        </div>

        <button
          onClick={onOpenNewMatch}
          className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors shrink-0"
        >
          + Neues Spiel erfassen
        </button>
      </div>

      {/* List */}
      {matches.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Noch keine Spiele eingetragen</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sobald am Dienstag die ersten Partien bis 10 Tore gespielt werden, tauchen sie hier detailliert mit Gewinnern und Verlierern auf.
          </p>
          <button
            onClick={onOpenNewMatch}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            Erstes Spiel eintragen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => {
            let dateFormatted: string;
            if (match.sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(match.sessionDate)) {
              const [y, m, d] = match.sessionDate.split('-').map(Number);
              dateFormatted = new Date(y, m - 1, d).toLocaleDateString('de-DE', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            } else {
              dateFormatted = new Date(match.timestamp).toLocaleDateString('de-DE', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            }

            const losers = match.loserIds.map((id) => playerMap.get(id)?.name || 'Unbekannt');
            const winners = match.winnerIds.map((id) => playerMap.get(id)?.name || 'Unbekannt');

            return (
              <div
                key={match.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
              >
                {/* Top Info: Date ONLY (No time) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                      #{matches.length - idx}
                    </span>
                    <span className="text-slate-300 font-medium">{dateFormatted}</span>
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
                        <span className="text-slate-400 font-mono text-[11px]">
                          {wCount} gegen {lCount}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Actions: Edit & Delete (Protected with PIN 57290) */}
                  {deleteConfirmId === match.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in">
                      <span className="text-[11px] text-rose-400 font-medium hidden sm:inline">
                        Wirklich löschen?
                      </span>
                      <button
                        onClick={() => handleDelete(match.id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors"
                      >
                        {isDeleting ? 'Lösche...' : 'Ja, löschen'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRequestEdit(match)}
                        title="Spiel bearbeiten (PIN erforderlich)"
                        className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => handleRequestDeleteClick(match.id)}
                        title="Spiel löschen (PIN erforderlich)"
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

      {/* Admin PIN Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAdminAction(null);
        }}
        onSuccess={handlePinSuccess}
        title="Admin-PIN eingeben"
        description="Um vergangene Spiele nachträglich zu bearbeiten oder zu löschen, ist der 5-stellige Admin-PIN erforderlich."
      />
    </div>
  );
};
