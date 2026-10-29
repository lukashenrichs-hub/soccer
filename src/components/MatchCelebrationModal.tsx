import React, { useEffect, useState, useRef } from 'react';
import { Flame, Trophy, Zap, Shield, ArrowRight, X, Sparkles } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-dismiss countdown after 6.5 seconds (gives enough time to celebrate!)
  useEffect(() => {
    if (!match) return;

    const duration = 6500;
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

  // Particle & Fireworks celebration canvas
  useEffect(() => {
    if (!match) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#fbbf24', '#ffffff'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Create 90 explosive celebration confetti particles
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: width / 2,
        y: height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.008 + 0.005,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;

        if (p.alpha > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [match]);

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
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer select-none overflow-hidden animate-in fade-in duration-300"
    >
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Rotating Radiance Rays Aura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-25">
        <div
          className={`w-[600px] h-[600px] rounded-full blur-3xl animate-pulse ${
            isUnderdogHeroWin ? 'bg-amber-500' : is3v3 ? 'bg-emerald-500' : 'bg-cyan-500'
          }`}
        />
      </div>

      {/* Main Celebration Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 text-center overflow-hidden transition-all duration-300 z-10 ${
          isUnderdogHeroWin
            ? 'bg-gradient-to-b from-amber-950/95 via-slate-900 to-slate-950 border-amber-500 shadow-amber-500/50'
            : is3v3
            ? 'bg-gradient-to-b from-emerald-950/95 via-slate-900 to-slate-950 border-emerald-400 shadow-emerald-500/40'
            : is4v4
            ? 'bg-gradient-to-b from-sky-950/95 via-slate-900 to-slate-950 border-sky-400 shadow-sky-500/40'
            : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-emerald-500/80 shadow-emerald-500/30'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dynamic Glowing Impact Badge with Shockwave */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Shockwave ping ring */}
            <div
              className={`absolute inset-0 rounded-3xl opacity-75 animate-ping ${
                isUnderdogHeroWin ? 'bg-amber-500' : is3v3 ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
            />

            {isUnderdogHeroWin ? (
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 to-red-500 border-2 border-amber-300 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/80">
                🔥
                <span className="absolute -bottom-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg border border-amber-200">
                  +2 Extra-Pkt
                </span>
              </div>
            ) : is3v3 ? (
              <div className="relative w-22 h-22 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-300 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/60">
                ⚡
              </div>
            ) : is4v4 ? (
              <div className="relative w-22 h-22 rounded-3xl bg-gradient-to-tr from-sky-600 to-indigo-600 border-2 border-sky-300 flex items-center justify-center text-4xl shadow-xl shadow-sky-500/60">
                🛡️
              </div>
            ) : (
              <div className="relative w-22 h-22 rounded-3xl bg-gradient-to-tr from-emerald-600 to-cyan-500 border-2 border-emerald-300 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/60">
                🏆
              </div>
            )}
          </div>
        </div>

        {/* Headlines */}
        {isUnderdogHeroWin ? (
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400 text-amber-300 text-xs font-black uppercase tracking-widest">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              Unterzahl-Sensation!
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              3 schlagen 4! 🔥
            </h3>
            <p className="text-xs sm:text-sm text-amber-200 font-medium max-w-sm mx-auto leading-relaxed">
              Legendärer Coup! Das 3er-Team trotzt der Übermacht und sahnt <strong>+2 Bonuspunkte</strong> in der Tabelle ab!
            </p>
          </div>
        ) : is3v3 ? (
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 text-xs font-black uppercase tracking-widest">
              <Zap className="w-4 h-4 text-emerald-400" />
              3 vs. 3 Blitz-Match!
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sieg bis 10 Tore! ⚡
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Volles Tempo auf dem Parkett – 3 Punkte für die Siegermannschaft gutgeschrieben!
            </p>
          </div>
        ) : is4v4 ? (
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/25 border border-sky-400 text-sky-300 text-xs font-black uppercase tracking-widest">
              <Shield className="w-4 h-4 text-sky-400" />
              4 vs. 4 Vollbesetzung!
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hallen-Schlacht entschieden! 🛡️
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Volle 8 Spieler auf dem Hallenparkett bis zum 10. Tor gefightet!
            </p>
          </div>
        ) : (
          <div className="space-y-1 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest">
              <Trophy className="w-4 h-4 text-amber-400" />
              Spiel gewertet
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sieg erfolgreich eingetragen! ⚽
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Tabelle und persönliche Statistiken aller Mitspieler wurden aktualisiert.
            </p>
          </div>
        )}

        {/* Squad Breakdown (Winners & Losers) */}
        <div className="grid grid-cols-2 gap-3 my-4 text-left">
          {/* Winners Card */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isUnderdogHeroWin
                ? 'bg-amber-950/70 border-amber-500/80 shadow-md shadow-amber-500/20'
                : 'bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sieger ({winners.length})
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 font-bold">
                {isUnderdogHeroWin ? '+5 Pkt' : '+3.5 Pkt'}
              </span>
            </div>
            <div className="space-y-1">
              {winners.map((name) => (
                <div
                  key={name}
                  className="text-xs font-bold text-white flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded-lg"
                >
                  <span className="text-amber-400 text-xs">👑</span>
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Losers Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Verlierer ({losers.length})
              </span>
              <span className="text-[10px] text-rose-400 font-mono font-bold">-1 Pkt</span>
            </div>
            <div className="space-y-1">
              {losers.map((name) => (
                <div
                  key={name}
                  className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-lg"
                >
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className={`w-full py-3 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg min-h-[44px] cursor-pointer ${
            isUnderdogHeroWin
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/30'
              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-500/30'
          }`}
        >
          <span>Weiter zur aktualisierten Tabelle</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Countdown Bar */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full transition-all duration-75 ease-linear rounded-full ${
              isUnderdogHeroWin ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
