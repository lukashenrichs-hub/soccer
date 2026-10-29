import { Plus, Share2, Users, Trophy, History, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'stats' | 'history' | 'players';
  setActiveTab: (tab: 'stats' | 'history' | 'players') => void;
  onOpenNewMatch: () => void;
  onOpenShare: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMatch,
  onOpenShare,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/aistudio/logoFlyer3D_a83d64ce.png"
            alt="VTV Freier Grund 2016 e.V."
            className="w-10 h-10 object-contain drop-shadow shrink-0"
          />
          <button
            onClick={() => setActiveTab('stats')}
            className="text-left group focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white block group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                VTV Freier Grund
              </span>
              <span className="text-xs bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono hidden sm:inline">
                Dienstagskick ⚽
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'stats'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabelle & Quoten</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Spielverlauf</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'players'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Spielerkader</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Hellen Betrachtungsmodus aktivieren' : 'Dunkelmodus aktivieren'}
              className="inline-flex items-center justify-center p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors min-h-[40px] min-w-[40px]"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-500" />
              )}
            </button>
          )}

          <button
            onClick={onOpenShare}
            title="Link teilen & WhatsApp Report"
            className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-colors min-h-[40px] min-w-[40px]"
          >
            <Share2 className="w-4 h-4 text-emerald-400 sm:mr-1.5" />
            <span className="hidden sm:inline">Teilen</span>
          </button>

          <button
            onClick={onOpenNewMatch}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Spiel eintragen</span>
          </button>
        </div>
      </div>
    </header>
  );
};
