import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Percent, 
  Search, 
  ShieldCheck, 
  TrendingDown, 
  Users, 
  X, 
  XCircle, 
  Zap, 
  Flame, 
  Swords, 
  ShieldAlert,
  Trophy,
  Calendar
} from 'lucide-react';
import { AppData, FilterOption, Match, PlayerStats, SortField, TeamModeFilter } from '../types';
import { calculatePlayerStats, sortPlayerStats } from '../utils/stats';

interface StatsDashboardProps {
  data: AppData;
  onOpenNewMatch: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  data,
  onOpenNewMatch,
}) => {
  // Default sort is fair Dienstagskick-Punkte (rewards activity, wins, underdog wins)
  const [sortField, setSortField] = useState<SortField>('points_desc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [teamMode, setTeamMode] = useState<TeamModeFilter>('all');
  const [subFilter3v4, setSubFilter3v4] = useState<'all' | 'as3er' | 'as4er'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerStats | null>(null);

  const totalMatches = (data.historicalTotalMatches || 73) + data.matches.length;

  // Calculate raw stats for all players
  const rawStats = useMemo(() => calculatePlayerStats(data), [data]);

  // Filter stats
  const filteredStats = useMemo(() => {
    return rawStats.filter((stat) => {
      // Search
      if (searchQuery.trim()) {
        const matchesName = stat.player.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
        if (!matchesName) return false;
      }

      // Filter Option
      if (filterOption === 'active_players') {
        if (teamMode === '3v3') return stat.stats3v3.games > 0;
        if (teamMode === '4v4') return stat.stats4v4.games > 0;
        if (teamMode === '3v4') {
          if (subFilter3v4 === 'as3er') return stat.stats3v4.as3er.games > 0;
          if (subFilter3v4 === 'as4er') return stat.stats3v4.as4er.games > 0;
          return stat.stats3v4.overall.games > 0;
        }
        return stat.gamesPlayed > 0;
      }
      if (filterOption === 'undefeated') {
        if (teamMode === '3v3') return stat.stats3v3.games > 0 && stat.stats3v3.losses === 0;
        if (teamMode === '4v4') return stat.stats4v4.games > 0 && stat.stats4v4.losses === 0;
        if (teamMode === '3v4') {
          if (subFilter3v4 === 'as3er') return stat.stats3v4.as3er.games > 0 && stat.stats3v4.as3er.losses === 0;
          if (subFilter3v4 === 'as4er') return stat.stats3v4.as4er.games > 0 && stat.stats3v4.as4er.losses === 0;
          return stat.stats3v4.overall.games > 0 && stat.stats3v4.overall.losses === 0;
        }
        return stat.gamesPlayed > 0 && stat.losses === 0;
      }
      return true;
    });
  }, [rawStats, searchQuery, filterOption, teamMode, subFilter3v4]);

  // Sorted stats
  const sortedStats = useMemo(() => {
    return sortPlayerStats(filteredStats, sortField);
  }, [filteredStats, sortField]);

  // Calculate key highlight players among players with at least 1 game
  const playersWithGames = useMemo(
    () => rawStats.filter((s) => s.gamesPlayed > 0),
    [rawStats]
  );

  // Overall points leader (Rank #1 in fair points table)
  const pointsLeader = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.lossRatePersonal - b.lossRatePersonal;
    })[0];
  }, [playersWithGames]);

  // Player with most total appearances (Fleißigster Spieler)
  const mostGamesPlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0];
  }, [playersWithGames]);

  // Player with lowest personal loss rate
  const bestRatePlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (teamMode === '3v3') {
        if (a.stats3v3.games === 0 && b.stats3v3.games > 0) return 1;
        if (b.stats3v3.games === 0 && a.stats3v3.games > 0) return -1;
        if (a.stats3v3.lossRate !== b.stats3v3.lossRate) return a.stats3v3.lossRate - b.stats3v3.lossRate;
        return b.stats3v3.games - a.stats3v3.games;
      }
      if (teamMode === '4v4') {
        if (a.stats4v4.games === 0 && b.stats4v4.games > 0) return 1;
        if (b.stats4v4.games === 0 && a.stats4v4.games > 0) return -1;
        if (a.stats4v4.lossRate !== b.stats4v4.lossRate) return a.stats4v4.lossRate - b.stats4v4.lossRate;
        return b.stats4v4.games - a.stats4v4.games;
      }
      if (teamMode === '3v4') {
        if (a.stats3v4.overall.games === 0 && b.stats3v4.overall.games > 0) return 1;
        if (b.stats3v4.overall.games === 0 && a.stats3v4.overall.games > 0) return -1;
        if (a.stats3v4.overall.lossRate !== b.stats3v4.overall.lossRate) return a.stats3v4.overall.lossRate - b.stats3v4.overall.lossRate;
        return b.stats3v4.overall.games - a.stats3v4.overall.games;
      }
      if (a.lossRatePersonal !== b.lossRatePersonal) {
        return a.lossRatePersonal - b.lossRatePersonal;
      }
      return b.gamesPlayed - a.gamesPlayed;
    })[0];
  }, [playersWithGames, teamMode]);

  // In 3v4: Underdog King (most wins with 3 against 4)
  const underdogKing = useMemo(() => {
    const contenders = playersWithGames.filter((s) => s.stats3v4.as3er.wins > 0);
    if (contenders.length === 0) return null;
    return [...contenders].sort((a, b) => {
      if (b.stats3v4.as3er.wins !== a.stats3v4.as3er.wins) {
        return b.stats3v4.as3er.wins - a.stats3v4.as3er.wins;
      }
      if (b.stats3v4.as3er.winRate !== a.stats3v4.as3er.winRate) {
        return b.stats3v4.as3er.winRate - a.stats3v4.as3er.winRate;
      }
      return b.stats3v4.as3er.games - a.stats3v4.as3er.games;
    })[0];
  }, [playersWithGames]);

  // In 3v4: Favorite Flop (most losses with 4 against 3)
  const favoriteFlop = useMemo(() => {
    const contenders = playersWithGames.filter((s) => s.stats3v4.as4er.losses > 0);
    if (contenders.length === 0) return null;
    return [...contenders].sort((a, b) => {
      if (b.stats3v4.as4er.losses !== a.stats3v4.as4er.losses) {
        return b.stats3v4.as4er.losses - a.stats3v4.as4er.losses;
      }
      return b.stats3v4.as4er.lossRate - a.stats3v4.as4er.lossRate;
    })[0];
  }, [playersWithGames]);

  // In 3v4: Most Underdog Matches Played
  const mostUnderdogGames = useMemo(() => {
    const contenders = playersWithGames.filter((s) => s.stats3v4.as3er.games > 0);
    if (contenders.length === 0) return null;
    return [...contenders].sort((a, b) => b.stats3v4.as3er.games - a.stats3v4.as3er.games)[0];
  }, [playersWithGames]);

  // Absolute most losses (Pechvogel)
  const mostLossesPlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (teamMode === '3v3') {
        if (b.stats3v3.losses !== a.stats3v3.losses) return b.stats3v3.losses - a.stats3v3.losses;
        return b.stats3v3.lossRate - a.stats3v3.lossRate;
      }
      if (teamMode === '4v4') {
        if (b.stats4v4.losses !== a.stats4v4.losses) return b.stats4v4.losses - a.stats4v4.losses;
        return b.stats4v4.lossRate - a.stats4v4.lossRate;
      }
      if (teamMode === '3v4') {
        if (b.stats3v4.overall.losses !== a.stats3v4.overall.losses) return b.stats3v4.overall.losses - a.stats3v4.overall.losses;
        return b.stats3v4.overall.lossRate - a.stats3v4.overall.lossRate;
      }
      if (b.losses !== a.losses) return b.losses - a.losses;
      return b.lossRatePersonal - a.lossRatePersonal;
    })[0];
  }, [playersWithGames, teamMode]);

  // Matches for player modal
  const selectedPlayerMatches = useMemo(() => {
    if (!selectedPlayerStats) return [];
    return data.matches.filter((m) =>
      m.participantIds.includes(selectedPlayerStats.player.id)
    );
  }, [selectedPlayerStats, data.matches]);

  return (
    <div className="space-y-6">
      {/* Team Size Format Segmented Control */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-white">Spielformat wählen:</span>
        </div>

        <div className="flex items-center p-1 bg-slate-800 rounded-xl overflow-x-auto gap-1">
          <button
            onClick={() => {
              setTeamMode('all');
              setSortField('points_desc');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              teamMode === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Alle Formate (Gesamt-Rangliste)
          </button>

          <button
            onClick={() => {
              setTeamMode('3v3');
              setSortField('3v3_lossRate_asc');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              teamMode === '3v3'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ⚡ 3 vs. 3
          </button>

          <button
            onClick={() => {
              setTeamMode('4v4');
              setSortField('4v4_lossRate_asc');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              teamMode === '4v4'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🛡️ 4 vs. 4
          </button>

          <button
            onClick={() => {
              setTeamMode('3v4');
              setSortField('3v4_underdog_wins_desc');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              teamMode === '3v4'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-800/40'
            }`}
          >
            🔥 3 vs. 4 (Unterzahl / Überzahl)
          </button>
        </div>
      </div>

      {/* Special Information Banner when 3 vs 4 is active */}
      {teamMode === '3v4' && (
        <div className="p-4 bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>3 vs. 4 Spezial-Auswertung</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono uppercase">
                  Unterzahl-Bonus
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Ein Sieg im <strong>3er-Team gegen 4</strong> wiegt besonders schwer und bringt <strong>+2 Extra-Punkte</strong> in der Rangliste!
              </p>
            </div>
          </div>

          {/* Subfilter for 3vs4 */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl shrink-0">
            <button
              onClick={() => setSubFilter3v4('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                subFilter3v4 === 'all'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Alle 3vs4
            </button>
            <button
              onClick={() => {
                setSubFilter3v4('as3er');
                setSortField('3v4_underdog_wins_desc');
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                subFilter3v4 === 'as3er'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              👑 Im 3er (Unterzahl)
            </button>
            <button
              onClick={() => {
                setSubFilter3v4('as4er');
                setSortField('3v4_lossRate_asc');
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                subFilter3v4 === 'as4er'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🛡️ Im 4er (Überzahl)
            </button>
          </div>
        </div>
      )}

      {/* 4 Spotlight / Key Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tabellenführer / Unterzahl-König */}
        <div className={`p-5 rounded-2xl shadow-lg relative overflow-hidden ${
          teamMode === '3v4'
            ? 'bg-gradient-to-br from-slate-900 to-amber-950/50 border border-amber-500/40'
            : 'bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold flex items-center gap-1.5 uppercase tracking-wider ${
              teamMode === '3v4' ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              <span>{teamMode === '3v4' ? '🔥' : '👑'}</span>
              {teamMode === '3v4'
                ? 'Unterzahl-König (3 gegen 4)'
                : teamMode === '3v3'
                ? '3vs3 Spitzenreiter'
                : teamMode === '4v4'
                ? '4vs4 Spitzenreiter'
                : 'Tabellenführer (Rang #1)'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
              teamMode === '3v4'
                ? 'text-amber-400 bg-amber-950/80 border-amber-800/60'
                : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60'
            }`}>
              {teamMode === '3v4' ? 'Held' : 'Rang #1'}
            </span>
          </div>

          {teamMode === '3v4' ? (
            underdogKing ? (
              <div>
                <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                  <span>{underdogKing.player.name}</span>
                  <span className="text-sm">🔥</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                    {underdogKing.stats3v4.as3er.wins}
                  </span>
                  <span className="text-xs text-slate-300">
                    Siege zu dritt gegen 4!
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-amber-300/90 flex items-center gap-1">
                  <span>{underdogKing.stats3v4.as3er.winRate}% Siegquote in Unterzahl</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-2">Noch kein Sieg zu dritt gegen vier erfasst</div>
            )
          ) : pointsLeader ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                <span>{pointsLeader.player.name}</span>
                <span className="text-sm">🏆</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {pointsLeader.points}
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  Punkte
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300/80 flex items-center gap-1">
                <span>{pointsLeader.wins} Siege & {pointsLeader.gamesPlayed} Einsätze</span>
                <span>·</span>
                <span>{pointsLeader.lossRatePersonal}% Pleiten</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 2: Beste Quote (% Pleiten) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Percent className="w-4 h-4" />
              Beste Quote (Seltenste Pleiten)
            </span>
          </div>

          {bestRatePlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate">
                {bestRatePlayer.player.name}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-sky-400 tabular-nums">
                  {teamMode === '3v3'
                    ? `${bestRatePlayer.stats3v3.lossRate}%`
                    : teamMode === '4v4'
                    ? `${bestRatePlayer.stats4v4.lossRate}%`
                    : teamMode === '3v4'
                    ? `${bestRatePlayer.stats3v4.overall.lossRate}%`
                    : `${bestRatePlayer.lossRatePersonal}%`}
                </span>
                <span className="text-xs text-slate-400">
                  Niederlagenquote
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {teamMode === '3v3'
                  ? `${bestRatePlayer.stats3v3.losses}N in ${bestRatePlayer.stats3v3.games} 3vs3-Spielen`
                  : teamMode === '4v4'
                  ? `${bestRatePlayer.stats4v4.losses}N in ${bestRatePlayer.stats4v4.games} 4vs4-Spielen`
                  : teamMode === '3v4'
                  ? `${bestRatePlayer.stats3v4.overall.losses}N in ${bestRatePlayer.stats3v4.overall.games} 3vs4-Spielen`
                  : `Nur ${bestRatePlayer.losses}N in ${bestRatePlayer.gamesPlayed} Einsätzen`}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 3: Meiste Niederlagen (Pechvogel) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>🌶️</span>
              {teamMode === '3v4'
                ? 'Überzahl-Pechvogel (4 gegen 3)'
                : 'Meiste Niederlagen (Pechvogel)'}
            </span>
            <span className="text-[10px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded font-mono border border-rose-800/60">
              Pechvogel
            </span>
          </div>

          {teamMode === '3v4' ? (
            favoriteFlop ? (
              <div>
                <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                  <span>{favoriteFlop.player.name}</span>
                  <span className="text-sm">🥙</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
                    {favoriteFlop.stats3v4.as4er.losses}
                  </span>
                  <span className="text-xs text-slate-400">
                    Niederlagen im 4er gegen 3!
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-rose-300/80">
                  Autsch! Trotz Überzahl gegen 3 verloren
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-2">Kein Überzahl-Verlust verzeichnet</div>
            )
          ) : mostLossesPlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                <span>{mostLossesPlayer.player.name}</span>
                <span className="text-sm">🥙</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
                  {teamMode === '3v3'
                    ? mostLossesPlayer.stats3v3.losses
                    : teamMode === '4v4'
                    ? mostLossesPlayer.stats4v4.losses
                    : mostLossesPlayer.losses}
                </span>
                <span className="text-xs text-slate-400">
                  Niederlagen absolut
                </span>
              </div>
              <div className="mt-2 text-[11px] text-rose-300/80">
                {mostLossesPlayer.gamesPlayed} Spiele absolviert ({mostLossesPlayer.lossRatePersonal}% Quote)
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 4: Fleißigster Spieler or Tapferster Kämpfer */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              {teamMode === '3v4' ? (
                <>
                  <Swords className="w-4 h-4" />
                  Tapferster 3er-Kämpfer
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  Fleißigster Spieler
                </>
              )}
            </span>
          </div>

          {teamMode === '3v4' ? (
            mostUnderdogGames ? (
              <div>
                <div className="text-xl font-bold text-white mb-1 truncate">
                  {mostUnderdogGames.player.name}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                    {mostUnderdogGames.stats3v4.as3er.games}
                  </span>
                  <span className="text-xs text-slate-400">
                    Spiele im 3er gegen 4
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {mostUnderdogGames.stats3v4.as3er.wins} Siege in Unterzahl
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
            )
          ) : mostGamesPlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate">
                {mostGamesPlayer.player.name}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                  {mostGamesPlayer.gamesPlayed}
                </span>
                <span className="text-xs text-slate-400">
                  Einsätze
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Stammkraft beim Dienstagskick ({mostGamesPlayer.wins} Siege)
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>
      </div>

      {/* Fairness & Scoring Explainer Strip */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Dienstagskick-Punkte:</strong> Belohnt fleißige Teilnahme, Siege und Heldentaten in Unterzahl.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
          +3 Pkt / Sieg · +0,5 Pkt / Einsatz · -1 Pkt / Niederlage · 🔥 +2 Pkt / Unterzahl-Sieg
        </div>
      </div>

      {/* Control Strip: Filter Tabs, Sort Selector & Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Filter Segmented Control */}
        <div className="flex items-center p-1 bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterOption('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              filterOption === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Alle Spieler ({rawStats.length})
          </button>
          <button
            onClick={() => setFilterOption('active_players')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              filterOption === 'active_players'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Mit Einsätzen ({playersWithGames.length})
          </button>
          <button
            onClick={() => setFilterOption('undefeated')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              filterOption === 'undefeated'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Ungeschlagen 🛡️
          </button>
        </div>

        {/* Sort Selector & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Spieler suchen..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 min-h-[36px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Field */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 min-h-[36px]"
            >
              {teamMode === '3v4' ? (
                <>
                  <option value="3v4_underdog_wins_desc">👑 Meiste Siege im 3er gegen 4 (Unterzahl-König)</option>
                  <option value="3v4_underdog_winRate_desc">🔥 Beste Siegquote im 3er gegen 4</option>
                  <option value="3v4_lossRate_asc">🛡️ Geringste Pleitenquote in 3 vs 4 gesamt</option>
                  <option value="points_desc">🏆 Dienstagskick-Punkte</option>
                  <option value="gamesPlayed_desc">Meiste Einsätze gesamt</option>
                  <option value="name_asc">Name (A–Z)</option>
                </>
              ) : teamMode === '3v3' ? (
                <>
                  <option value="3v3_lossRate_asc">Beste Quote in 3 vs. 3</option>
                  <option value="points_desc">🏆 Dienstagskick-Punkte</option>
                  <option value="wins_desc">Meiste Siege</option>
                  <option value="losses_asc">Wenigste Niederlagen</option>
                  <option value="gamesPlayed_desc">Meiste Einsätze</option>
                  <option value="name_asc">Name (A–Z)</option>
                </>
              ) : teamMode === '4v4' ? (
                <>
                  <option value="4v4_lossRate_asc">Beste Quote in 4 vs. 4</option>
                  <option value="points_desc">🏆 Dienstagskick-Punkte</option>
                  <option value="wins_desc">Meiste Siege</option>
                  <option value="losses_asc">Wenigste Niederlagen</option>
                  <option value="gamesPlayed_desc">Meiste Einsätze</option>
                  <option value="name_asc">Name (A–Z)</option>
                </>
              ) : (
                <>
                  <option value="points_desc">🏆 Dienstagskick-Punkte (Fairer Score)</option>
                  <option value="wins_desc">Meiste Siege</option>
                  <option value="lossRatePersonal_asc">Beste Quote (% seltenste Verluste)</option>
                  <option value="gamesPlayed_desc">Meiste Spiele / Einsätze</option>
                  <option value="3v4_underdog_wins_desc">👑 Meiste Siege im 3er gegen 4</option>
                  <option value="losses_asc">Wenigste Niederlagen (absolut)</option>
                  <option value="losses_desc">Meiste Niederlagen (absolut)</option>
                  <option value="name_asc">Name (A–Z)</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View (Desktop & Tablet) */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-3 w-14">#</th>
              <th className="py-3.5 px-3">Spieler</th>

              {teamMode === '3v4' ? (
                <>
                  <th className="py-3.5 px-3 text-right">3vs4 Spiele</th>
                  <th className="py-3.5 px-3 text-center bg-amber-950/20 text-amber-300">
                    👑 Im 3er gegen 4 (Unterzahl)
                  </th>
                  <th className="py-3.5 px-3 text-center">🛡️ Im 4er gegen 3 (Überzahl)</th>
                  <th className="py-3.5 px-4 text-left min-w-[180px]">3vs4 Niederlagenquote</th>
                </>
              ) : (
                <>
                  <th className="py-3.5 px-3 text-right text-emerald-400 font-bold">🏆 Punkte</th>
                  <th className="py-3.5 px-3 text-right">Einsätze</th>
                  <th className="py-3.5 px-3 text-right">Siege</th>
                  <th className="py-3.5 px-3 text-right">Niederlagen</th>
                  <th className="py-3.5 px-4 text-left min-w-[170px]">
                    {teamMode === '3v3'
                      ? 'Quote in 3 vs. 3 (%)'
                      : teamMode === '4v4'
                      ? 'Quote in 4 vs. 4 (%)'
                      : 'Quote eigene Spiele (%)'}
                  </th>
                  {teamMode === 'all' && (
                    <>
                      <th className="py-3.5 px-3 text-center">⚡ 3 vs 3</th>
                      <th className="py-3.5 px-3 text-center">🛡️ 4 vs 4</th>
                      <th className="py-3.5 px-3 text-center text-amber-400 bg-amber-950/20">
                        🔥 3 vs 4
                      </th>
                    </>
                  )}
                </>
              )}

              <th className="py-3.5 pr-6 pl-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                  Keine Spieler gefunden.
                </td>
              </tr>
            ) : (
              sortedStats.map((stat, index) => {
                const currentRate =
                  teamMode === '3v3'
                    ? stat.stats3v3.lossRate
                    : teamMode === '4v4'
                    ? stat.stats4v4.lossRate
                    : teamMode === '3v4'
                    ? stat.stats3v4.overall.lossRate
                    : stat.lossRatePersonal;

                const currentGames =
                  teamMode === '3v3'
                    ? stat.stats3v3.games
                    : teamMode === '4v4'
                    ? stat.stats4v4.games
                    : teamMode === '3v4'
                    ? stat.stats3v4.overall.games
                    : stat.gamesPlayed;

                const currentLosses =
                  teamMode === '3v3'
                    ? stat.stats3v3.losses
                    : teamMode === '4v4'
                    ? stat.stats4v4.losses
                    : teamMode === '3v4'
                    ? stat.stats3v4.overall.losses
                    : stat.losses;

                const currentWins =
                  teamMode === '3v3'
                    ? stat.stats3v3.wins
                    : teamMode === '4v4'
                    ? stat.stats4v4.wins
                    : teamMode === '3v4'
                    ? stat.stats3v4.overall.wins
                    : stat.wins;

                const isTopPoints = index === 0 && currentGames > 0;
                const isUnderdogHero = stat.stats3v4.as3er.wins > 0;

                return (
                  <tr
                    key={stat.player.id}
                    onClick={() => setSelectedPlayerStats(stat)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-4 pl-6 pr-3 font-mono text-xs font-bold text-slate-400">
                      {isTopPoints ? (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          1
                        </span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>

                    {/* Name & Badges */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {stat.player.name}
                        </span>
                        {stat.isAttendeeToday && (
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            Heute da
                          </span>
                        )}
                        {isUnderdogHero && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/90 border border-amber-700/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>🔥</span> {stat.stats3v4.as3er.wins}x Unterzahl-Sieg
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Format 3vs4 View */}
                    {teamMode === '3v4' ? (
                      <>
                        {/* 3vs4 Games */}
                        <td className="py-4 px-3 text-right font-mono font-medium text-slate-200 tabular-nums">
                          {stat.stats3v4.overall.games}
                        </td>

                        {/* Im 3er gegen 4 (Unterzahl) */}
                        <td className="py-4 px-3 text-center bg-amber-950/10">
                          {stat.stats3v4.as3er.games > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-800/60 font-mono text-[11px]">
                                <strong className="text-amber-400 font-bold">{stat.stats3v4.as3er.wins} Siege</strong>
                                <span className="text-slate-400"> / {stat.stats3v4.as3er.losses} Niederlagen</span>
                              </span>
                              <span className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                                {stat.stats3v4.as3er.winRate}% Siegquote in Unterzahl
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">–</span>
                          )}
                        </td>

                        {/* Im 4er gegen 3 (Überzahl) */}
                        <td className="py-4 px-3 text-center">
                          {stat.stats3v4.as4er.games > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 font-mono text-[11px] text-slate-300">
                                <span className="text-emerald-400 font-bold">{stat.stats3v4.as4er.wins}S</span> /{' '}
                                <span className="text-rose-400 font-bold">{stat.stats3v4.as4er.losses}N</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {stat.stats3v4.as4er.lossRate}% Pleitenquote
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">–</span>
                          )}
                        </td>

                        {/* 3vs4 Overall Loss Rate */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-slate-200 tabular-nums">
                                {stat.stats3v4.overall.lossRate}%
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {stat.stats3v4.overall.losses} von {stat.stats3v4.overall.games} verloren
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                              {stat.stats3v4.overall.games > 0 ? (
                                <>
                                  <div
                                    style={{ width: `${stat.stats3v4.overall.lossRate}%` }}
                                    className="h-full bg-rose-500 rounded-l-full"
                                  />
                                  <div
                                    style={{ width: `${100 - stat.stats3v4.overall.lossRate}%` }}
                                    className="h-full bg-emerald-500 rounded-r-full"
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-slate-800" />
                              )}
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Punkte Column (Prominent) */}
                        <td className="py-4 px-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-extrabold text-sm border border-emerald-500/30 tabular-nums">
                            {stat.points} Pkt
                          </span>
                        </td>

                        {/* Games Played */}
                        <td className="py-4 px-3 text-right font-mono font-medium text-slate-200 tabular-nums">
                          {currentGames}
                        </td>

                        {/* Wins */}
                        <td className="py-4 px-3 text-right font-mono text-emerald-400 tabular-nums font-semibold">
                          {currentWins}
                        </td>

                        {/* Absolute Losses */}
                        <td className="py-4 px-3 text-right">
                          <span className="font-mono font-bold text-rose-400 tabular-nums">
                            {currentLosses}
                          </span>
                        </td>

                        {/* Rate Bar */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-slate-200 tabular-nums">
                                {currentRate}%
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {currentLosses} von {currentGames}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                              {currentGames > 0 ? (
                                <>
                                  <div
                                    style={{ width: `${currentRate}%` }}
                                    className="h-full bg-rose-500 rounded-l-full"
                                  />
                                  <div
                                    style={{ width: `${100 - currentRate}%` }}
                                    className="h-full bg-emerald-500 rounded-r-full"
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-slate-800" />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Quick Columns in All View */}
                        {teamMode === 'all' && (
                          <>
                            <td className="py-4 px-3 text-center text-xs">
                              {stat.stats3v3.games > 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] text-slate-300">
                                  <span className="text-emerald-400 font-bold">{stat.stats3v3.wins}S</span> /{' '}
                                  <span className="text-rose-400 font-bold">{stat.stats3v3.losses}N</span>
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">–</span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-center text-xs">
                              {stat.stats4v4.games > 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[11px] text-slate-300">
                                  <span className="text-emerald-400 font-bold">{stat.stats4v4.wins}S</span> /{' '}
                                  <span className="text-rose-400 font-bold">{stat.stats4v4.losses}N</span>
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">–</span>
                              )}
                            </td>

                            <td className="py-4 px-3 text-center text-xs bg-amber-950/10">
                              {stat.stats3v4.overall.games > 0 ? (
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono text-[10px] text-slate-300">
                                  3er: <span className="text-amber-400 font-bold">{stat.stats3v4.as3er.wins}S</span> · 4er: <span className="text-emerald-400">{stat.stats3v4.as4er.wins}S</span>
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">–</span>
                              )}
                            </td>
                          </>
                        )}
                      </>
                    )}

                    {/* Action */}
                    <td className="py-4 pr-6 pl-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 inline" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="md:hidden space-y-3">
        {sortedStats.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            Keine Spieler gefunden.
          </div>
        ) : (
          sortedStats.map((stat, index) => {
            const currentRate =
              teamMode === '3v3'
                ? stat.stats3v3.lossRate
                : teamMode === '4v4'
                ? stat.stats4v4.lossRate
                : teamMode === '3v4'
                ? stat.stats3v4.overall.lossRate
                : stat.lossRatePersonal;

            const currentGames =
              teamMode === '3v3'
                ? stat.stats3v3.games
                : teamMode === '4v4'
                ? stat.stats4v4.games
                : teamMode === '3v4'
                ? stat.stats3v4.overall.games
                : stat.gamesPlayed;

            const currentLosses =
              teamMode === '3v3'
                ? stat.stats3v3.losses
                : teamMode === '4v4'
                ? stat.stats4v4.losses
                : teamMode === '3v4'
                ? stat.stats3v4.overall.losses
                : stat.losses;

            const currentWins =
              teamMode === '3v3'
                ? stat.stats3v3.wins
                : teamMode === '4v4'
                ? stat.stats4v4.wins
                : teamMode === '3v4'
                ? stat.stats3v4.overall.wins
                : stat.wins;

            return (
              <div
                key={stat.player.id}
                onClick={() => setSelectedPlayerStats(stat)}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 active:scale-[0.99] transition-transform"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-white text-base">
                      {stat.player.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                      {stat.points} Pkt
                    </span>
                    {stat.stats3v4.as3er.wins > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        🔥 {stat.stats3v4.as3er.wins}x 3vs4
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Key Numbers Grid: 4 items */}
                <div className="grid grid-cols-4 gap-2 p-2.5 bg-slate-800/60 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block">Punkte</span>
                    <span className="font-mono font-extrabold text-emerald-300 text-sm tabular-nums">
                      {stat.points}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Einsätze</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {currentGames}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-400 block">Siege</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      {currentWins}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rose-300 block">Niederl.</span>
                    <span className="font-mono font-bold text-rose-400 text-sm tabular-nums">
                      {currentLosses}
                    </span>
                  </div>
                </div>

                {/* Loss Rate Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">
                      {teamMode === '3v4' ? '3vs4 Pleitenquote:' : 'Niederlagenquote:'}
                    </span>
                    <span className="font-mono font-bold text-rose-400 tabular-nums">
                      {currentRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    {currentGames > 0 ? (
                      <>
                        <div
                          style={{ width: `${currentRate}%` }}
                          className="h-full bg-rose-500 rounded-l-full"
                        />
                        <div
                          style={{ width: `${100 - currentRate}%` }}
                          className="h-full bg-emerald-500 rounded-r-full"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footnote / Objective Summary */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Gesamtspiele der Runde:</strong> {totalMatches} Partien bis 10 Tore ({data.historicalTotalMatches || 73} historisch überliefert + {data.matches.length} neue App-Spiele).
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewMatch}
            className="text-emerald-400 hover:text-emerald-300 underline font-medium"
          >
            + Neues Spiel erfassen
          </button>
        </div>
      </div>

      {/* Individual Player Match History Modal with 3vs3, 4vs4 & 3vs4 Detail */}
      {selectedPlayerStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Spieler-Statistik & Spielformate
                </span>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>{selectedPlayerStats.player.name}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedPlayerStats.points} Punkte
                  </span>
                  {selectedPlayerStats.stats3v4.as3er.wins > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                      👑 {selectedPlayerStats.stats3v4.as3er.wins}x Unterzahl-Sieg
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlayerStats(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Overall Stat Cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-800/40 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold block mb-0.5">Punkte</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {selectedPlayerStats.points}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Einsätze</span>
                  <span className="text-xl font-extrabold font-mono text-white tabular-nums">
                    {selectedPlayerStats.gamesPlayed}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-emerald-300 block mb-0.5">Siege</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {selectedPlayerStats.wins}
                  </span>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-center">
                  <span className="text-[10px] text-rose-300 block mb-0.5">Niederlagen</span>
                  <span className="text-xl font-extrabold font-mono text-rose-400 tabular-nums">
                    {selectedPlayerStats.losses}
                  </span>
                </div>
              </div>

              {/* Data Origin Breakdown Card */}
              {selectedPlayerStats.historical && (
                <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">📚 Langzeit-Historie:</span>
                    <span>{selectedPlayerStats.historical.games} Spiele ({selectedPlayerStats.historical.losses}N / {selectedPlayerStats.historical.wins ?? (selectedPlayerStats.historical.games - selectedPlayerStats.historical.losses)}S)</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    + {selectedPlayerMatches.length} App-Spiele
                  </span>
                </div>
              )}

              {/* Format Comparison Boxes: 3vs3, 4vs4 & 3vs4 Highlight */}
              <div className="space-y-3 pt-1">
                {/* 3 vs 4 Highlight Card */}
                <div className="p-4 bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      3 vs. 4 Spezial-Statistik ({selectedPlayerStats.stats3v4.overall.games} Spiele)
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                      Unterzahl-Bonus: +2 Pkt/Sieg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Im 3er gegen 4 (Unterzahl) */}
                    <div className="p-3 bg-amber-900/20 border border-amber-700/40 rounded-xl space-y-1">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                        <span>👑 Im 3er gegen 4:</span>
                        <span className="font-mono text-[10px]">{selectedPlayerStats.stats3v4.as3er.games} Sp</span>
                      </div>
                      <div className="text-base font-extrabold font-mono text-white">
                        <span className="text-amber-400">{selectedPlayerStats.stats3v4.as3er.wins} Siege</span>
                        <span className="text-slate-400 text-xs"> / {selectedPlayerStats.stats3v4.as3er.losses} Niederlagen</span>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Siegquote in Unterzahl: <strong className="text-amber-300 font-mono">{selectedPlayerStats.stats3v4.as3er.winRate}%</strong>
                      </div>
                    </div>

                    {/* Im 4er gegen 3 (Überzahl) */}
                    <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-1">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>🛡️ Im 4er gegen 3:</span>
                        <span className="font-mono text-[10px]">{selectedPlayerStats.stats3v4.as4er.games} Sp</span>
                      </div>
                      <div className="text-base font-extrabold font-mono text-white">
                        <span className="text-emerald-400">{selectedPlayerStats.stats3v4.as4er.wins} Siege</span>
                        <span className="text-slate-400 text-xs"> / {selectedPlayerStats.stats3v4.as4er.losses} Niederlagen</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Niederlagenquote: <strong className="text-slate-200 font-mono">{selectedPlayerStats.stats3v4.as4er.lossRate}%</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3vs3 and 4vs4 2-col Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 3 vs 3 Card */}
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                      <span>⚡ 3 vs. 3</span>
                      <span className="text-[10px] font-mono">{selectedPlayerStats.stats3v3.games} Sp</span>
                    </div>
                    <div className="text-base font-extrabold font-mono text-white">
                      <span className="text-emerald-400">{selectedPlayerStats.stats3v3.wins}S</span> -{' '}
                      <span className="text-rose-400">{selectedPlayerStats.stats3v3.losses}N</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Quote: <strong className="text-emerald-300 font-mono">{selectedPlayerStats.stats3v3.lossRate}% Pleiten</strong>
                    </div>
                  </div>

                  {/* 4 vs 4 Card */}
                  <div className="p-3.5 bg-sky-950/30 border border-sky-800/50 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                      <span>🛡️ 4 vs. 4</span>
                      <span className="text-[10px] font-mono">{selectedPlayerStats.stats4v4.games} Sp</span>
                    </div>
                    <div className="text-base font-extrabold font-mono text-white">
                      <span className="text-emerald-400">{selectedPlayerStats.stats4v4.wins}S</span> -{' '}
                      <span className="text-rose-400">{selectedPlayerStats.stats4v4.losses}N</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Quote: <strong className="text-sky-300 font-mono">{selectedPlayerStats.stats4v4.lossRate}% Pleiten</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match History for this player */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Beteiligte Spiele ({selectedPlayerMatches.length})
                </h4>
                {selectedPlayerMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-800/40 rounded-xl text-center">
                    Noch keine Spiele für diesen Spieler in der App erfasst.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedPlayerMatches.map((m) => {
                      const didLose = m.loserIds.includes(selectedPlayerStats.player.id);
                      const myTeamSize = didLose ? m.loserIds.length : m.winnerIds.length;
                      const oppTeamSize = didLose ? m.winnerIds.length : m.loserIds.length;
                      const is3v4 = (myTeamSize === 3 && oppTeamSize === 4) || (myTeamSize === 4 && oppTeamSize === 3);
                      const is3v3 = myTeamSize === 3 && oppTeamSize === 3;
                      const is4v4 = myTeamSize === 4 && oppTeamSize === 4;

                      let dateFormatted = m.sessionDate;
                      if (m.sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(m.sessionDate)) {
                        const [y, mth, d] = m.sessionDate.split('-').map(Number);
                        dateFormatted = new Date(y, mth - 1, d).toLocaleDateString('de-DE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        });
                      }

                      let formatBadge = `${myTeamSize} vs ${oppTeamSize}`;
                      if (is3v3) formatBadge = '3 vs 3';
                      else if (is4v4) formatBadge = '4 vs 4';
                      else if (is3v4) {
                        formatBadge = myTeamSize === 3 ? '🔥 3 vs 4 (Du im 3er-Team / Unterzahl)' : '🛡️ 3 vs 4 (Du im 4er-Team / Überzahl)';
                      }

                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            didLose
                              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                              : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {didLose ? (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white">
                                  {didLose ? 'Niederlage' : 'Sieg'}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  is3v4 && myTeamSize === 3 && !didLose
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold'
                                    : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {formatBadge}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {dateFormatted} {m.note ? `· ${m.note}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-medium text-slate-300 shrink-0">
                            Ziel: 10
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlayerStats(null)}
                className="px-5 py-2.5 text-xs font-medium text-slate-300 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
