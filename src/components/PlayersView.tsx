import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users, ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import { AppData, Player } from '../types';

interface PlayersViewProps {
  data: AppData;
  onAddPlayer: (name: string) => Promise<any>;
  onDeletePlayer: (id: string) => Promise<any>;
  onBackToStats: () => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  data,
  onAddPlayer,
  onDeletePlayer,
  onBackToStats,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      setIsAdding(true);
      setErrorMsg(null);
      await onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Hinzufügen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeletePlayer(id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Löschen');
    }
  };

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
            Spielerkader ({data.players.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verwalte eure feste Dienstagstruppe oder füge Gastspieler hinzu.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-200 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Add Player Bar */}
      <form onSubmit={handleAdd} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex gap-3">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Neuen Spieler hinzufügen (z. B. Gastspieler)"
          className="flex-1 px-4 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={isAdding || !newPlayerName.trim()}
          className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-800 disabled:text-slate-400 rounded-xl transition-all flex items-center gap-2 shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Hinzufügen</span>
        </button>
      </form>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.players.map((player, idx) => {
          const matchCount = data.matches.filter((m) => m.participantIds.includes(player.id)).length;
          const lossCount = data.matches.filter((m) => m.loserIds.includes(player.id)).length;

          return (
            <div
              key={player.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-white truncate">
                    {player.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{matchCount} Einsätze</span>
                    <span>·</span>
                    <span className="text-rose-400 font-medium">{lossCount} Niederlagen</span>
                  </div>
                </div>
              </div>

              {confirmDeleteId === player.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg text-xs font-bold"
                    title="Löschen bestätigen"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                    title="Abbrechen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(player.id)}
                  title="Spieler entfernen"
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
