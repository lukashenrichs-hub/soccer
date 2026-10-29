import React, { useState, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';

const MESSAGES = [
  '⚽ Der Server schnürt noch seine Hallenschuhe...',
  '💡 Flutlicht in der VTV-Halle wird eingeschaltet...',
  '🔥 Bälle werden aufgepumpt & Leibchen sortiert...',
  '☕ Der Render-Server trinkt den letzten Schluck Kaffee...',
  '🧤 Torwart hechtet sich warm – gleich rollt der Ball!',
  '📋 Spielberichtsbogen liegt bereit – fast geschafft!',
];

export const ColdStartLoading: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3800);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Soccer Ball & VTV Logo */}
        <div className="flex items-center justify-center gap-3">
          <img
            src="/assets/aistudio/logoFlyer3D_a83d64ce.png"
            alt="VTV Freier Grund"
            className="w-14 h-14 object-contain drop-shadow"
          />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl animate-bounce">
            ⚽
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            VTV Dienstagskick
          </h2>
          <p className="text-xs text-emerald-400 font-semibold mt-0.5">
            Server wacht auf – einen Moment bitte!
          </p>
        </div>

        {/* Humorous rotating message */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl min-h-[64px] flex items-center justify-center">
          <p className="text-xs sm:text-sm text-slate-200 font-medium transition-all duration-300">
            {MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress & Timer Ticker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              Verbindung aufbauen...
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-300">
              ⏱️ {seconds}s
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(95, (seconds / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* Friendly explanation badge */}
        <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 leading-relaxed text-left flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Render Free-Plan Info:</strong> Wenn die Seite 15 Minuten nicht genutzt wurde, schläft der Server ein. Der erste Aufruf dauert ca. <strong>30–50 Sekunden</strong>. Danach ist alles sofort da!
          </span>
        </div>
      </div>
    </div>
  );
};
