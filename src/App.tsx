import React, { useState } from 'react';
import { useFootballData } from './hooks/useFootballData';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StatsDashboard } from './components/StatsDashboard';
import { MatchHistory } from './components/MatchHistory';
import { PlayersView } from './components/PlayersView';
import { QuickMatchModal } from './components/QuickMatchModal';
import { ShareModal } from './components/ShareModal';
import { ColdStartLoading } from './components/ColdStartLoading';
import { MatchCelebrationModal } from './components/MatchCelebrationModal';
import { Match } from './types';
import { 
  Trophy, 
  History, 
  Users, 
  Plus, 
  AlertCircle,
  RefreshCw,
  Share2
} from 'lucide-react';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    data,
    loading,
    error,
    refresh,
    addMatch,
    editMatch,
    deleteMatch,
    updateAttendees,
    addPlayer,
    deletePlayer,
    resetSeed,
    importData,
    emergencyScanAndRestore,
  } = useFootballData();

  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'players'>('stats');
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [celebrationMatch, setCelebrationMatch] = useState<Match | null>(null);

  const handleOpenNewMatch = () => {
    setEditingMatch(null);
    setIsMatchModalOpen(true);
  };

  const handleOpenEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleSaveMatch = async (matchData: {
    participantIds: string[];
    loserIds: string[];
    sessionDate?: string;
    note?: string;
  }) => {
    const newMatch = await addMatch(matchData);
    if (newMatch) {
      setCelebrationMatch(newMatch);
    }
    return newMatch;
  };

  const handleEditMatch = async (
    id: string,
    matchData: {
      participantIds?: string[];
      loserIds?: string[];
      sessionDate?: string;
      note?: string;
    }
  ) => {
    const updated = await editMatch(id, matchData);
    setSaveSuccessToast('Spielergebnis erfolgreich aktualisiert! ✏️');
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 3500);
    return updated;
  };

  // Loading Screen (Render Cold Start with animation & humor)
  if (loading && !data) {
    return <ColdStartLoading />;
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

  // Calculate total games: 73 historical + live matches
  const historicalMatches = data.historicalTotalMatches || 73;
  const totalGamesCount = historicalMatches + data.matches.length;

  // Compute monthly match count (current month)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const currentMonthName = new Date().toLocaleDateString('de-DE', { month: 'long' });
  const monthMatchesCount = data.matches.filter((m) => {
    const matchMonth = m.sessionDate
      ? m.sessionDate.slice(0, 7)
      : new Date(m.timestamp).toISOString().slice(0, 7);
    return matchMonth === currentMonthPrefix;
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-12">
      {/* Top Header with Theme Switch */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMatch={handleOpenNewMatch}
        onOpenShare={() => setIsShareModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
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
              totalMatches={totalGamesCount}
              monthMatchesCount={monthMatchesCount}
              monthName={currentMonthName}
              activePlayersCount={data.players.length}
              onOpenNewMatch={handleOpenNewMatch}
              onOpenShare={() => setIsShareModalOpen(true)}
            />
            <StatsDashboard
              data={data}
              onOpenNewMatch={handleOpenNewMatch}
            />
          </>
        )}

        {/* Tab 2: Match History with Edit & Delete */}
        {activeTab === 'history' && (
          <MatchHistory
            data={data}
            onDeleteMatch={deleteMatch}
            onEditMatch={handleOpenEditMatch}
            onBackToStats={() => setActiveTab('stats')}
            onOpenNewMatch={handleOpenNewMatch}
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

      {/* Mobile Fixed Bottom Navigation Bar (5-destination layout including Teilen & Backup) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
        <div className="grid grid-cols-5 items-center h-16 px-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'stats' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] mt-1">Tabelle</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'history' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] mt-1">Spiele</span>
          </button>

          <button
            onClick={handleOpenNewMatch}
            className="flex flex-col items-center justify-center h-full text-emerald-400 font-semibold group -mt-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 ring-4 ring-slate-950 group-active:scale-95 transition-all">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-[9px] text-emerald-400 mt-0.5 font-extrabold tracking-tight">Eintragen</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === 'players' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1">Kader</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex flex-col items-center justify-center h-full transition-colors text-slate-400 hover:text-emerald-300"
          >
            <Share2 className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] mt-1">Teilen</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <QuickMatchModal
        isOpen={isMatchModalOpen}
        onClose={() => {
          setIsMatchModalOpen(false);
          setEditingMatch(null);
        }}
        players={data.players}
        activeAttendeeIds={data.activeAttendeeIds}
        matchToEdit={editingMatch}
        onSaveMatch={handleSaveMatch}
        onEditMatch={handleEditMatch}
        onUpdateAttendees={updateAttendees}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={data}
        onResetSeed={resetSeed}
        onImportData={importData}
        onEmergencyScanAndRestore={emergencyScanAndRestore}
      />

      <MatchCelebrationModal
        match={celebrationMatch}
        players={data.players}
        onClose={() => setCelebrationMatch(null)}
      />
    </div>
  );
}
