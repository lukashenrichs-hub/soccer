import React from 'react';
import { Calendar, Flame, Plus, Users, Zap } from 'lucide-react';
import bannerImg from '../assets/images/vtv_freier_grund_kick_1793111887480.jpg';

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
  onOpenShare,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-8">
      {/* Background Banner with Measured Scrim */}
      <div className="absolute inset-0">
        <img
          src={bannerImg}
          alt="Sporthalle VTV Freier Grund"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-400 mb-3 tracking-wide">
            <span className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-700/70 px-2.5 py-1 rounded-lg font-semibold text-emerald-300">
              <Calendar className="w-3.5 h-3.5" />
              Sporthalle VTV Freier Grund
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">Dienstags bis 10 Tore</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-300 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded-lg">
              🥙 Danach Döner-Runde
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Dienstagskick & Döner-Rangliste
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Hallenfußball in der VTV-Halle: Jedes Spiel geht bis 10. Wer verliert am seltensten und 
            holt sich den verdienten Döner-König – und wer muss nach den meisten Pleiten die Getränke oder den Döner sponsern?
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
