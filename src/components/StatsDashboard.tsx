import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  Award, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  Filter, 
  Percent, 
  Search, 
  ShieldCheck, 
  SlidersHorizontal, 
  TrendingDown, 
  TrendingUp, 
  User, 
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { AppData, FilterOption, Match, PlayerStats, SortField } from '../types';
import { calculatePlayerStats, sortPlayerStats } from '../utils/stats';

interface StatsDashboardProps {
  data: AppData;
  onOpenNewMatch: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  data,
  onOpenNewMatch,
}) => {
  const [sortField, setSortField] = useState<SortField>('lossRatePersonal_asc');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerStats, setSelectedPlayerStats] = useState<PlayerStats | null>(null);

  const totalMatches = data.matches.length;

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
        return stat.gamesPlayed > 0;
      }
      if (filterOption === 'undefeated') {
        return stat.gamesPlayed > 0 && stat.losses === 0;
      }
      return true;
    });
  }, [rawStats, searchQuery, filterOption]);

  // Sorted stats
  const sortedStats = useMemo(() => {
    return sortPlayerStats(filteredStats, sortField);
  }, [filteredStats, sortField]);

  // Calculate key highlight players among players with at least 1 game
  const playersWithGames = useMemo(
    () => rawStats.filter((s) => s.gamesPlayed > 0),
    [rawStats]
  );

  const bestRatePlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (a.lossRatePersonal !== b.lossRatePersonal) {
        return a.lossRatePersonal - b.lossRatePersonal;
      }
      return b.gamesPlayed - a.gamesPlayed;
    })[0];
  }, [playersWithGames]);

  const fewestLossesPlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.gamesPlayed - a.gamesPlayed;
    })[0];
  }, [playersWithGames]);

  const mostLossesPlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses;
      return b.lossRatePersonal - a.lossRatePersonal;
    })[0];
  }, [playersWithGames]);

  const highestRatePlayer = useMemo(() => {
    if (playersWithGames.length === 0) return null;
    return [...playersWithGames].sort((a, b) => {
      if (b.lossRatePersonal !== a.lossRatePersonal) {
        return b.lossRatePersonal - a.lossRatePersonal;
      }
      return b.losses - a.losses;
    })[0];
  }, [playersWithGames]);

  // Matches for player modal
  const selectedPlayerMatches = useMemo(() => {
    if (!selectedPlayerStats) return [];
    return data.matches.filter((m) =>
      m.participantIds.includes(selectedPlayerStats.player.id)
    );
  }, [selectedPlayerStats, data.matches]);

  return (
    <div className="space-y-6">
      {/* 4 Spotlight / Key Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Döner-König (Beste Quote / Seltenste Niederlagen) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>🥙</span>
              Döner-König (Beste Quote)
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded font-mono border border-emerald-800/60">Rang #1</span>
          </div>
          {bestRatePlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                <span>{bestRatePlayer.player.name}</span>
                <span className="text-sm">👑</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {bestRatePlayer.lossRatePersonal}%
                </span>
                <span className="text-xs text-slate-400">
                  Niederlagenquote ({bestRatePlayer.losses}N in {bestRatePlayer.gamesPlayed}Sp)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300/80 flex items-center gap-1">
                <span>Hat sich den Döner verdient!</span>
                <span>·</span>
                <span>{bestRatePlayer.wins} Siege</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 2: Wenigste Niederlagen Absolut */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Wenigste Niederlagen (Absolut)
            </span>
          </div>
          {fewestLossesPlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate">
                {fewestLossesPlayer.player.name}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-sky-400 tabular-nums">
                  {fewestLossesPlayer.losses}
                </span>
                <span className="text-xs text-slate-400">
                  Niederlagen bei {fewestLossesPlayer.gamesPlayed} Einsätzen
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Nur {fewestLossesPlayer.lossRatePersonal}% der Einsätze verloren
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 3: Döner-Sponsor / Scharfe Soße (Häufigste Niederlagen Absolut) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span>🌶️</span>
              Döner-Sponsor (Meiste Pleiten)
            </span>
            <span className="text-[10px] text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded font-mono border border-rose-800/60">Pechvogel</span>
          </div>
          {mostLossesPlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate flex items-center gap-2">
                <span>{mostLossesPlayer.player.name}</span>
                <span className="text-sm">🥙</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
                  {mostLossesPlayer.losses}
                </span>
                <span className="text-xs text-slate-400">
                  Niederlagen bei {mostLossesPlayer.gamesPlayed} Einsätzen
                </span>
              </div>
              <div className="mt-2 text-[11px] text-rose-300/80">
                Nächste Döner-Runde oder extra scharfe Soße! ({mostLossesPlayer.lossRatePersonal}% Quote)
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
        </div>

        {/* Card 4: Höchste Niederlagenquote */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Percent className="w-4 h-4" />
              Höchste Niederlagenquote (%)
            </span>
          </div>
          {highestRatePlayer ? (
            <div>
              <div className="text-xl font-bold text-white mb-1 truncate">
                {highestRatePlayer.player.name}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                  {highestRatePlayer.lossRatePersonal}%
                </span>
                <span className="text-xs text-slate-400">
                  aller eigenen Spiele verloren
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                {highestRatePlayer.losses} Niederlagen in {highestRatePlayer.gamesPlayed} Spielen
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Noch keine Spiele erfasst</div>
          )}
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
              <option value="lossRatePersonal_asc">Beste Quote (wenigste % Verluste)</option>
              <option value="lossRatePersonal_desc">Höchste Quote (meiste % Verluste)</option>
              <option value="losses_asc">Wenigste Niederlagen (absolut)</option>
              <option value="losses_desc">Meiste Niederlagen (absolut)</option>
              <option value="gamesPlayed_desc">Meiste Spiele / Einsätze</option>
              <option value="lossRateTotal_asc">Quote aller Gesamtspiele (geringste)</option>
              <option value="lossRateTotal_desc">Quote aller Gesamtspiele (höchste)</option>
              <option value="name_asc">Name (A–Z)</option>
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
              <th className="py-3.5 px-3 text-right">Einsätze</th>
              <th className="py-3.5 px-3 text-right">Niederlagen</th>
              <th className="py-3.5 px-3 text-right">Siege</th>
              <th className="py-3.5 px-4 text-left min-w-[200px]">
                Quote eigene Einsätze (%)
              </th>
              <th className="py-3.5 px-3 text-right">Quote alle Spiele (%)</th>
              <th className="py-3.5 pr-6 pl-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                  Keine Spieler gefunden.
                </td>
              </tr>
            ) : (
              sortedStats.map((stat, index) => {
                const isTopLossRate =
                  bestRatePlayer &&
                  stat.player.id === bestRatePlayer.player.id &&
                  stat.gamesPlayed > 0;
                const isWorstLoss =
                  mostLossesPlayer &&
                  stat.player.id === mostLossesPlayer.player.id &&
                  stat.losses > 0;

                return (
                  <tr
                    key={stat.player.id}
                    onClick={() => setSelectedPlayerStats(stat)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-4 pl-6 pr-3 font-mono text-xs font-bold text-slate-400">
                      {index === 0 && stat.gamesPlayed > 0 ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                          1
                        </span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>

                    {/* Name & Badges */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {stat.player.name}
                        </span>
                        {stat.isAttendeeToday && (
                          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            Heute da
                          </span>
                        )}
                        {isTopLossRate && (
                          <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/90 border border-emerald-700/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>🥙</span> Döner-König
                          </span>
                        )}
                        {isWorstLoss && (
                          <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/90 border border-rose-700/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>🌶️</span> Döner-Sponsor
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Games Played (Einsätze) */}
                    <td className="py-4 px-3 text-right font-mono font-medium text-slate-200 tabular-nums">
                      {stat.gamesPlayed}
                    </td>

                    {/* Absolute Losses */}
                    <td className="py-4 px-3 text-right">
                      <span className="font-mono font-bold text-rose-400 tabular-nums">
                        {stat.losses}
                      </span>
                    </td>

                    {/* Calculated Wins */}
                    <td className="py-4 px-3 text-right font-mono text-emerald-400 tabular-nums font-medium">
                      {stat.wins}
                    </td>

                    {/* Quote Eigene Einsätze (with visual bar) */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-200 tabular-nums">
                            {stat.lossRatePersonal}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {stat.losses} von {stat.gamesPlayed} verloren
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                          {stat.gamesPlayed > 0 ? (
                            <>
                              <div
                                style={{ width: `${stat.lossRatePersonal}%` }}
                                className="h-full bg-rose-500 rounded-l-full"
                                title={`${stat.lossRatePersonal}% Niederlagen`}
                              />
                              <div
                                style={{ width: `${100 - stat.lossRatePersonal}%` }}
                                className="h-full bg-emerald-500 rounded-r-full"
                                title={`${100 - stat.lossRatePersonal}% Siege`}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full bg-slate-800" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quote Alle Gesamtspiele */}
                    <td className="py-4 px-3 text-right font-mono text-xs text-slate-300 tabular-nums">
                      {stat.lossRateTotal}%
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({stat.losses} / {totalMatches})
                      </span>
                    </td>

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
            return (
              <div
                key={stat.player.id}
                onClick={() => setSelectedPlayerStats(stat)}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 active:scale-[0.99] transition-transform"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-white text-base">
                      {stat.player.name}
                    </span>
                    {stat.isAttendeeToday && (
                      <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                        Heute da
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-800/60 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Einsätze</span>
                    <span className="font-mono font-bold text-white text-sm tabular-nums">
                      {stat.gamesPlayed}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rose-300 block">Niederlagen</span>
                    <span className="font-mono font-bold text-rose-400 text-sm tabular-nums">
                      {stat.losses}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-300 block">Siege</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      {stat.wins}
                    </span>
                  </div>
                </div>

                {/* Loss Rate Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Niederlagenquote:</span>
                    <span className="font-mono font-bold text-rose-400 tabular-nums">
                      {stat.lossRatePersonal}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                    {stat.gamesPlayed > 0 ? (
                      <>
                        <div
                          style={{ width: `${stat.lossRatePersonal}%` }}
                          className="h-full bg-rose-500 rounded-l-full"
                        />
                        <div
                          style={{ width: `${100 - stat.lossRatePersonal}%` }}
                          className="h-full bg-emerald-500 rounded-r-full"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Quote alle Spiele: {stat.lossRateTotal}%</span>
                    <span>Ziel: &lt; 50%</span>
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
            <strong>Gesamtspiele der Runde:</strong> {totalMatches} Partien bis 10 Tore.
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

      {/* Individual Player Match History Modal */}
      {selectedPlayerStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Spieler-Statistik
                </span>
                <h3 className="text-2xl font-bold text-white">
                  {selectedPlayerStats.player.name}
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
              {/* Stat Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Einsätze / Spiele</span>
                  <span className="text-2xl font-extrabold font-mono text-white tabular-nums">
                    {selectedPlayerStats.gamesPlayed}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Niederlagen (Absolut)</span>
                  <span className="text-2xl font-extrabold font-mono text-rose-400 tabular-nums">
                    {selectedPlayerStats.losses}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Quote eigene Spiele</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {selectedPlayerStats.lossRatePersonal}%
                  </span>
                </div>

                <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Quote alle Spiele</span>
                  <span className="text-2xl font-extrabold font-mono text-sky-400 tabular-nums">
                    {selectedPlayerStats.lossRateTotal}%
                  </span>
                </div>
              </div>

              {/* Match History for this player */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Beteiligte Spiele ({selectedPlayerMatches.length})
                </h4>
                {selectedPlayerMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 bg-slate-800/40 rounded-xl text-center">
                    Noch keine Spiele für diesen Spieler absolviert.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedPlayerMatches.map((m, idx) => {
                      const didLose = m.loserIds.includes(selectedPlayerStats.player.id);
                      const timeStr = new Date(m.timestamp).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
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
                              <span className="font-semibold block text-white">
                                {didLose ? 'Niederlage' : 'Sieg'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {m.sessionDate} · {timeStr} {m.note ? `· ${m.note}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono font-medium text-slate-300">
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
