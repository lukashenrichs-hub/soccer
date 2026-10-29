import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Zap, Shield, CheckCircle, XCircle, X } from 'lucide-react';
import { Match, Player } from '../types';

interface MatchCelebrationModalProps {
  match: Match | null;
  players: Player[];
  onClose: () => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  match,
  players,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!match) return;

    // Auto-dismiss countdown after 3.8 seconds
    const duration = 3800;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [match, onClose]);

  if (!match) return null;

  const playerMap = new Map<string, Player>();
  players.forEach((p) => playerMap.set(p.id, p));

  const losers = match.loserIds.map((id) => playerMap.get(id)?.name || 'Spieler');
  const winners = match.winnerIds.map((id) => playerMap.get(id)?.name || 'Spieler');

  const lCount = match.loserIds.length;
  const wCount = match.winnerIds.length;

  const is3v3 = lCount === 3 && wCount === 3;
  const is4v4 = lCount === 4 && wCount === 4;
  const is3v4 = (lCount === 3 && wCount === 4) || (lCount === 4 && wCount === 3);
  const isUnderdogHeroWin = is3v4 && wCount === 3; // 3 players beat 4 players!
  const isOverdogWin = is3v4 && wCount === 4; // 4 players beat 3 players

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 text-center overflow-hidden transition-all duration-300 ${
          isUnderdogHeroWin
            ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-500 shadow-amber-500/30'
            : is3v3
            ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500 shadow-emerald-500/20'
            : is4v4
            ? 'bg-gradient-to-b from-sky-950 via-slate-900 to-slate-950 border-sky-500 shadow-sky-500/20'
            : 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/70 shadow-emerald-500/20'
        }`}
      >
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic Celebration Header Icon */}
        <div className="flex justify-center mb-3">
          {isUnderdogHeroWin ? (
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/50 animate-bounce">
                🔥
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                +2 Pkt Bonus
              </span>
            </div>
          ) : is3v3 ? (
            <div className="w-18 h-18 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/40 animate-pulse">
              ⚡
            </div>
          ) : is4v4 ? (
            <div className="w-18 h-18 rounded-3xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-3xl shadow-lg shadow-sky-500/40 animate-pulse">
              🛡️
            </div>
          ) : (
            <div className="w-18 h-18 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/40">
              🏆
            </div>
          )}
        </div>

        {/* Headline */}
        {isUnderdogHeroWin ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Unterzahl-Sensation!
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              3 schlagen 4!
            </h3>
            <p className="text-xs text-amber-200/90 mt-1">
              Das 3er-Team holt den heroischen Sieg gegen 4 Mann und sichert sich <strong>+2 Extra-Punkte</strong> in der Tabelle!
            </p>
          </div>
        ) : isOverdogWin ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              4 vs. 3 Überzahl
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              4er-Team siegt!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Die Überzahl erfolgreich bis 10 Tore ausgespielt.
            </p>
          </div>
        ) : is3v3 ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              3 vs. 3 Blitz-Match
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              10 Tore erreicht!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Schnelles Hallenmatch gewertet & Punkte verteilt.
            </p>
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy className="w-3.5 h-3.5 text-sky-400" />
              4 vs. 4 Vollbesetzung
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Partie bis 10 beendet!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Klassischer Fight mit voller Mannschaftsstärke.
            </p>
          </div>
        )}

        {/* Team breakdown */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-800">
          {/* Winners */}
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-left">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Gewinner ({winners.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {winners.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-extrabold bg-emerald-900/90 border border-emerald-600/80 text-white rounded-lg shadow-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Losers */}
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-left">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              Verlierer ({losers.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {losers.map((name, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-950/90 border border-rose-800/70 text-rose-200 rounded-lg"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar & Dismiss info */}
        <div className="mt-5 pt-3">
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                isUnderdogHeroWin ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Tippen zum Schließen
          </span>
        </div>
      </div>
    </div>
  );
};
