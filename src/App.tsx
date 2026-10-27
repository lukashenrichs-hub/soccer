import React, { useState } from 'react';
import { useFootballData } from './hooks/useFootballData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StatsDashboard } from './components/StatsDashboard';
import { MatchHistory } from './components/MatchHistory';
import { PlayersView } from './components/PlayersView';
import { QuickMatchModal } from './components/QuickMatchModal';
import { ShareModal } from './components/ShareModal';
import { 
  Trophy, 
  History, 
  Users, 
  Plus, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const {
    data,
    loading,
    error,
    refresh,
    addMatch,
    deleteMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
  } = useFootballData();

  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'players'>('stats');
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const handleSaveMatch = async (matchData: {
    participantIds: string[];
    loserIds: string[];
    note?: string;
  }) => {
    const newMatch = await addMatch(matchData);
    setSaveSuccessToast('Spiel bis 10 Tore erfolgreich gewertet & gespeichert! ⚽');
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 3500);
    return newMatch;
  };

  // Loading Screen
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
          ⚽
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Lade VTV Freier Grund Statistiken...</span>
        </div>
      </div>
    );
  }

  // Fallback if data is missing
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Verbindungsfehler</h2>
        <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
          {error || 'Daten konnten nicht geladen werden.'}
        </p>
        <button
          onClick={() => refresh(false)}
          className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-semibold text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Compute today's match count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMatchesCount = data.matches.filter((m) => m.sessionDate === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMatch={() => setIsMatchModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full">
        {/* Toast Banner */}
        {saveSuccessToast && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 p-4 bg-emerald-950 border border-emerald-500 rounded-2xl shadow-2xl text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>{saveSuccessToast}</span>
          </div>
        )}

        {/* Tab 1: Stats & Quotes (Dashboard) */}
        {activeTab === 'stats' && (
          <>
            <HeroSection
              totalMatches={data.matches.length}
              todayMatchesCount={todayMatchesCount}
              activePlayersCount={data.players.length}
              onOpenNewMatch={() => setIsMatchModalOpen(true)}
              onOpenShare={() => setIsShareModalOpen(true)}
            />
            <StatsDashboard
              data={data}
              onOpenNewMatch={() => setIsMatchModalOpen(true)}
            />
          </>
        )}

        {/* Tab 2: Match History */}
        {activeTab === 'history' && (
          <MatchHistory
            data={data}
            onDeleteMatch={deleteMatch}
            onBackToStats={() => setActiveTab('stats')}
            onOpenNewMatch={() => setIsMatchModalOpen(true)}
          />
        )}

        {/* Tab 3: Player Management */}
        {activeTab === 'players' && (
          <PlayersView
            data={data}
            onAddPlayer={addPlayer}
            onDeletePlayer={deletePlayer}
            onBackToStats={() => setActiveTab('stats')}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Clean 4-destination thumb layout) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
        <div className="grid grid-cols-4 items-center h-16 px-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'stats' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[11px] mt-1">Tabelle</span>
          </button>

          <button
            onClick={() => setIsMatchModalOpen(true)}
            className="flex flex-col items-center justify-center h-full text-emerald-400 font-semibold"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-[10px] text-emerald-300 mt-1 font-bold">Spiel eintragen</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'history' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[11px] mt-1">Spiele</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'players' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] mt-1">Kader</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <QuickMatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        players={data.players}
        activeAttendeeIds={data.activeAttendeeIds}
        onSaveMatch={handleSaveMatch}
        onUpdateAttendees={updateAttendees}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={data}
        onResetSeed={resetSeed}
        onImportData={importData}
      />
    </div>
  );
}
