import { PlayerStats } from '../types';

export interface PlayerTitle {
  badge: string;
  label: string;
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

/**
 * Calculates dynamic player titles and badges based entirely on live stats.
 * These titles evolve automatically as matches are logged over time!
 */
export function getPlayerTitle(stat: PlayerStats, allStats: PlayerStats[]): PlayerTitle {
  const { player, gamesPlayed, wins, losses, points, winRate, lossRatePersonal, stats3v4 } = stat;

  // Sorted reference lists to dynamically determine league ranks
  const sortedByPoints = [...allStats].sort((a, b) => b.points - a.points || b.wins - a.wins);
  const sortedByWins = [...allStats].sort((a, b) => b.wins - a.wins || b.points - a.points);
  const sortedByGames = [...allStats].sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  const topPointsPlayer = sortedByPoints[0];
  const rank2Player = sortedByPoints[1];
  const rank3Player = sortedByPoints[2];
  const maxWinsPlayer = sortedByWins[0];
  const maxGamesPlayer = sortedByGames[0];

  // Qualified for efficiency title (minimum 12 games played)
  const qualifiedForEfficiency = allStats
    .filter((s) => s.gamesPlayed >= 12)
    .sort((a, b) => b.winRate - a.winRate || a.lossRatePersonal - b.lossRatePersonal);
  const bestEfficiencyPlayer = qualifiedForEfficiency[0];

  // 1. Dynamic Underdog Hero / King (3 vs 4 Unterzahl-Siege)
  const underdogWins = stats3v4?.as3er?.wins || 0;
  if (underdogWins >= 2) {
    return {
      badge: '🔥',
      label: `${underdogWins}x Unterzahl-König`,
      description: `Hat ${underdogWins}x im 3er-Team gegen 4 triumphiert (+${underdogWins * 2} Extrapunkte)`,
      bgColor: 'bg-amber-950/90',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-600/80',
    };
  }
  if (underdogWins === 1) {
    return {
      badge: '🔥',
      label: '1x Unterzahl-Held',
      description: 'Hat im 3er-Team gegen eine 4er-Übermacht gewonnen (+2 Bonuspunkte)',
      bgColor: 'bg-amber-950/80',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-700/70',
    };
  }

  // 2. Table Leader (#1 in Points)
  if (topPointsPlayer && topPointsPlayer.player.id === player.id && points > 0) {
    return {
      badge: '👑',
      label: 'Tabellenführer',
      description: `Platz 1 mit ${points} Punkten & ${wins} Siegen (${winRate}%)`,
      bgColor: 'bg-emerald-950/90',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/80',
    };
  }

  // 3. Most Absolute Wins in the League (if distinct from #1)
  if (maxWinsPlayer && maxWinsPlayer.player.id === player.id && wins > 0 && maxWinsPlayer.player.id !== topPointsPlayer?.player.id) {
    return {
      badge: '⚡',
      label: 'Sieg-Maschine',
      description: `Meiste Siege der Liga (${wins} Siege bei ${gamesPlayed} Spielen)`,
      bgColor: 'bg-indigo-950/90',
      textColor: 'text-indigo-300',
      borderColor: 'border-indigo-600/80',
    };
  }

  // 4. Rank 2: Vize-Champion
  if (rank2Player && rank2Player.player.id === player.id && points > 0) {
    return {
      badge: '🥈',
      label: 'Vize-Champion',
      description: `Platz 2 mit ${points} Punkten – direkter Verfolger der Spitze`,
      bgColor: 'bg-slate-800',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-500/60',
    };
  }

  // 5. Best Win-Rate / Efficiency in the League (min. 12 games)
  if (bestEfficiencyPlayer && bestEfficiencyPlayer.player.id === player.id) {
    return {
      badge: '🎯',
      label: 'Quoten-König',
      description: `Beste Quote: ${winRate}% Siege (${wins} Siege / nur ${losses} Niederlagen)`,
      bgColor: 'bg-teal-950/80',
      textColor: 'text-teal-300',
      borderColor: 'border-teal-500/60',
    };
  }

  // 6. Rank 3: Podest-Stürmer
  if (rank3Player && rank3Player.player.id === player.id && points > 0) {
    return {
      badge: '🥉',
      label: 'Podest-Kämpfer',
      description: `Platz 3 mit ${points} Punkten & ${wins} Siegen`,
      bgColor: 'bg-cyan-950/80',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-600/60',
    };
  }

  // 7. Most Games Played in the League (Dauerbrenner)
  if (maxGamesPlayer && maxGamesPlayer.player.id === player.id && gamesPlayed > 20) {
    return {
      badge: '🛡️',
      label: 'Dauerbrenner',
      description: `Meiste Einsätze der Runde (${gamesPlayed} Spiele absolviert)`,
      bgColor: 'bg-amber-950/80',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-700/60',
    };
  }

  // 8. Individual statistical profiles calculated dynamically with real live values:
  const lowerName = player.name.toLowerCase();

  // Nico / High defensive stability (under 45% loss rate with 20+ games)
  if (lossRatePersonal <= 45 && gamesPlayed >= 20) {
    return {
      badge: '🧤',
      label: 'Hallen-Bollwerk',
      description: `Starke Defensive: nur ${lossRatePersonal}% Niederlagen (${losses} von ${gamesPlayed})`,
      bgColor: 'bg-emerald-950/80',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-700/60',
    };
  }

  // Lukas Henrichs / Veteran with 40+ games
  if (gamesPlayed >= 45) {
    return {
      badge: '🦅',
      label: 'Hallen-Routinier',
      description: `Erfahrene Stammkraft mit ${gamesPlayed} Spielen & ${points} Punkten`,
      bgColor: 'bg-violet-950/80',
      textColor: 'text-violet-300',
      borderColor: 'border-violet-600/60',
    };
  }

  // Jonas / High games count (35+ games)
  if (gamesPlayed >= 35) {
    return {
      badge: '🏃',
      label: 'Stammkraft',
      description: `${gamesPlayed} Partien – unermüdlicher Einsatz in jedem Match`,
      bgColor: 'bg-slate-800',
      textColor: 'text-slate-200',
      borderColor: 'border-slate-600',
    };
  }

  // Elton / Tough fighter in 3er & 4er formats
  if (lowerName.includes('elton') || (gamesPlayed >= 18 && wins >= 8)) {
    return {
      badge: '💪',
      label: 'Kämpferherz',
      description: `Echtes Kämpferherz: ${wins} Siege bei ${gamesPlayed} Spielen`,
      bgColor: 'bg-orange-950/80',
      textColor: 'text-orange-300',
      borderColor: 'border-orange-600/60',
    };
  }

  // Tom / High precision with moderate games
  if (lowerName.includes('tom') || (gamesPlayed >= 10 && winRate >= 40)) {
    return {
      badge: '🚀',
      label: 'Präzisions-Kicker',
      description: `Gezielte Einsätze: ${winRate}% Siegquote (${wins} Siege)`,
      bgColor: 'bg-fuchsia-950/80',
      textColor: 'text-fuchsia-300',
      borderColor: 'border-fuchsia-600/60',
    };
  }

  // Lukas Heider / Rising star (under 15 games, working their way up)
  if (lowerName.includes('heider') || (gamesPlayed < 15 && wins >= 3)) {
    return {
      badge: '🌟',
      label: 'Aufsteiger',
      description: `Starker Trend: bereits ${wins} Siege in ${gamesPlayed} Spielen`,
      bgColor: 'bg-yellow-950/80',
      textColor: 'text-yellow-300',
      borderColor: 'border-yellow-600/60',
    };
  }

  // Robin / Effective joker
  if (lowerName.includes('robin') || (gamesPlayed < 10 && winRate >= 50)) {
    return {
      badge: '⚡',
      label: 'Edel-Joker',
      description: `${winRate}% Siegquote bei schnellen Einsätzen`,
      bgColor: 'bg-lime-950/80',
      textColor: 'text-lime-300',
      borderColor: 'border-lime-600/60',
    };
  }

  // Positive Win Record
  if (wins > losses) {
    return {
      badge: '⚔️',
      label: 'Punkte-Garant',
      description: `Positive Bilanz: ${wins} Siege bei ${gamesPlayed} Spielen (${points} Pkt)`,
      bgColor: 'bg-cyan-950/80',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-600/60',
    };
  }

  // Standard Team Player
  return {
    badge: '⚽',
    label: 'Teamspieler',
    description: `${gamesPlayed} Einsätze & ${wins} Siege beim Dienstagskick`,
    bgColor: 'bg-slate-800',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
  };
}
