import React from 'react';
import { Calendar, Plus } from 'lucide-react';

interface HeroSectionProps {
  totalMatches: number;
  todayMatchesCount: number;
  activePlayersCount: number;
  onOpenNewMatch: () => void;
  onOpenShare: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalMatches,
  todayMatchesCount,
  activePlayersCount,
  onOpenNewMatch,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8">
      {/* Background Banner with Hall Photo and Scrim */}
      <div className="absolute inset-0">
        <img
          src="/assets/aistudio/Bild-Klassenwettkampf-2-scaled_3e46e4a1.jpeg"
          alt="Sporthalle VTV Freier Grund"
          className="w-full h-full object-cover object-[center_35%] opacity-25 sm:opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-400 mb-3 tracking-wide">
              <span className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-700/70 px-2.5 py-1 rounded-lg font-semibold text-emerald-300">
                <Calendar className="w-3.5 h-3.5" />
                Sporthalle VTV Freier Grund
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">Dienstags bis 10 Tore</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
                ⚽ Wöchentliche Hallenrunde
              </span>
            </div>

            {/* Title with Club Logo */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <img
                src="/assets/aistudio/logoFlyer3D_a83d64ce.png"
                alt="VTV Freier Grund 2016 e.V."
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md shrink-0"
              />
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Dienstagskick
                </h1>
                <p className="text-xs sm:text-sm text-emerald-400 font-medium">
                  Vereinigte Turnvereine Freier Grund 2016 e.V.
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
              Hallenfußball in unserer VTV-Halle: Jedes Spiel geht bis 10 Tore. Hier siehst du die Rangliste aller Spieler – 
              wer viel spielt, Siege holt und sich in Unterzahl behauptet, klettert nach oben!
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenNewMatch}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-xl shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Neues Spiel eintragen
              </button>
            </div>
          </div>

          {/* Hall Photo Card - discreet & authentic */}
          <div className="hidden lg:flex flex-col items-end shrink-0">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 shadow-2xl bg-slate-900/80 p-1.5 backdrop-blur-md max-w-[240px] group">
              <img
                src="/assets/aistudio/Bild-Klassenwettkampf-2-scaled_3e46e4a1.jpeg"
                alt="VTV Sporthalle Freier Grund"
                className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
              <div className="pt-2 pb-0.5 px-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  VTV Halle
                </span>
                <span className="text-slate-400 text-[10px]">Unsere Spielstätte</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Gesamtspiele (All-Time)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                {totalMatches}
              </span>
              <span className="text-xs text-slate-400 font-medium">Spiele</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Heute gespielt</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
                {todayMatchesCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Partien</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Spielerkader</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-sky-400">
                {activePlayersCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">Spieler</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
