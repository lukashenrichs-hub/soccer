import { AppData, Match, Player, PlayerStats, SortField } from '../types';

export function calculatePlayerStats(data: AppData): PlayerStats[] {
  const { players, matches, activeAttendeeIds } = data;
  const histTotal = data.historicalTotalMatches || 73;
  const totalMatches = histTotal + matches.length;

  return players.map((player) => {
    const histGames = player.historicalStats?.games || 0;
    const histLosses = player.historicalStats?.losses || 0;
    const histWins = player.historicalStats?.wins ?? Math.max(0, histGames - histLosses);

    // Live matches recorded in the app
    const playerMatches = matches.filter((m) => m.participantIds.includes(player.id));
    const liveGames = playerMatches.length;
    const liveLosses = matches.filter((m) => m.loserIds.includes(player.id)).length;
    const liveWins = Math.max(0, liveGames - liveLosses);

    // Combined total
    const gamesPlayed = histGames + liveGames;
    const losses = histLosses + liveLosses;
    const wins = histWins + liveWins;

    // Rate A: losses / own games
    const lossRatePersonal = gamesPlayed > 0 ? (losses / gamesPlayed) * 100 : 0;

    // Rate B: losses / total matches of the group
    const lossRateTotal = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;

    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
    const isAttendeeToday = activeAttendeeIds.includes(player.id);

    // Detailed format stats:
    // 3 vs 3 (both teams 3)
    let g3v3 = 0, w3v3 = 0, l3v3 = 0;
    // 4 vs 4 (both teams 4)
    let g4v4 = 0, w4v4 = 0, l4v4 = 0;
    // 3 vs 4 (one team 3, other 4)
    let g3v4_all = 0, w3v4_all = 0, l3v4_all = 0;
    let g3v4_as3 = 0, w3v4_as3 = 0, l3v4_as3 = 0;
    let g3v4_as4 = 0, w3v4_as4 = 0, l3v4_as4 = 0;

    // General 3er and 4er team stats
    let team3Games = 0, team3Wins = 0, team3Losses = 0;
    let team4Games = 0, team4Wins = 0, team4Losses = 0;

    playerMatches.forEach((m) => {
      const isLoser = m.loserIds.includes(player.id);
      const myTeamSize = isLoser ? m.loserIds.length : m.winnerIds.length;
      const oppTeamSize = isLoser ? m.winnerIds.length : m.loserIds.length;

      // General team size
      if (myTeamSize === 3) {
        team3Games++;
        if (isLoser) team3Losses++;
        else team3Wins++;
      } else if (myTeamSize === 4) {
        team4Games++;
        if (isLoser) team4Losses++;
        else team4Wins++;
      }

      // Format 3 vs 3
      if (myTeamSize === 3 && oppTeamSize === 3) {
        g3v3++;
        if (isLoser) l3v3++;
        else w3v3++;
      }

      // Format 4 vs 4
      if (myTeamSize === 4 && oppTeamSize === 4) {
        g4v4++;
        if (isLoser) l4v4++;
        else w4v4++;
      }

      // Format 3 vs 4
      if ((myTeamSize === 3 && oppTeamSize === 4) || (myTeamSize === 4 && oppTeamSize === 3)) {
        g3v4_all++;
        if (isLoser) l3v4_all++;
        else w3v4_all++;

        if (myTeamSize === 3) {
          // In 3er team against 4 (Unterzahl)
          g3v4_as3++;
          if (isLoser) l3v4_as3++;
          else w3v4_as3++;
        } else if (myTeamSize === 4) {
          // In 4er team against 3 (Überzahl)
          g3v4_as4++;
          if (isLoser) l3v4_as4++;
          else w3v4_as4++;
        }
      }
    });

    const calcRates = (g: number, w: number, l: number) => ({
      games: g,
      wins: w,
      losses: l,
      lossRate: g > 0 ? Math.round((l / g) * 1000) / 10 : 0,
      winRate: g > 0 ? Math.round((w / g) * 1000) / 10 : 0,
    });

    return {
      player,
      gamesPlayed,
      losses,
      wins,
      lossRatePersonal: Math.round(lossRatePersonal * 10) / 10,
      lossRateTotal: Math.round(lossRateTotal * 10) / 10,
      winRate: Math.round(winRate * 10) / 10,
      isAttendeeToday,
      historical: player.historicalStats,
      team3: calcRates(team3Games, team3Wins, team3Losses),
      team4: calcRates(team4Games, team4Wins, team4Losses),
      stats3v3: calcRates(g3v3, w3v3, l3v3),
      stats4v4: calcRates(g4v4, w4v4, l4v4),
      stats3v4: {
        overall: calcRates(g3v4_all, w3v4_all, l3v4_all),
        as3er: calcRates(g3v4_as3, w3v4_as3, l3v4_as3),
        as4er: calcRates(g3v4_as4, w3v4_as4, l3v4_as4),
      },
    };
  });
}

export function sortPlayerStats(stats: PlayerStats[], sortBy: SortField): PlayerStats[] {
  return [...stats].sort((a, b) => {
    switch (sortBy) {
      case '3v3_lossRate_asc':
      case 'team3_lossRate_asc':
        if (a.stats3v3.games === 0 && b.stats3v3.games > 0) return 1;
        if (b.stats3v3.games === 0 && a.stats3v3.games > 0) return -1;
        if (a.stats3v3.lossRate !== b.stats3v3.lossRate) return a.stats3v3.lossRate - b.stats3v3.lossRate;
        return b.stats3v3.games - a.stats3v3.games;

      case '4v4_lossRate_asc':
      case 'team4_lossRate_asc':
        if (a.stats4v4.games === 0 && b.stats4v4.games > 0) return 1;
        if (b.stats4v4.games === 0 && a.stats4v4.games > 0) return -1;
        if (a.stats4v4.lossRate !== b.stats4v4.lossRate) return a.stats4v4.lossRate - b.stats4v4.lossRate;
        return b.stats4v4.games - a.stats4v4.games;

      case '3v4_underdog_wins_desc':
        // Most wins in 3er team against 4
        if (b.stats3v4.as3er.wins !== a.stats3v4.as3er.wins) {
          return b.stats3v4.as3er.wins - a.stats3v4.as3er.wins;
        }
        if (b.stats3v4.as3er.winRate !== a.stats3v4.as3er.winRate) {
          return b.stats3v4.as3er.winRate - a.stats3v4.as3er.winRate;
        }
        return b.stats3v4.as3er.games - a.stats3v4.as3er.games;

      case '3v4_underdog_winRate_desc':
        if (a.stats3v4.as3er.games === 0 && b.stats3v4.as3er.games > 0) return 1;
        if (b.stats3v4.as3er.games === 0 && a.stats3v4.as3er.games > 0) return -1;
        if (b.stats3v4.as3er.winRate !== a.stats3v4.as3er.winRate) {
          return b.stats3v4.as3er.winRate - a.stats3v4.as3er.winRate;
        }
        return b.stats3v4.as3er.wins - a.stats3v4.as3er.wins;

      case '3v4_lossRate_asc':
        if (a.stats3v4.overall.games === 0 && b.stats3v4.overall.games > 0) return 1;
        if (b.stats3v4.overall.games === 0 && a.stats3v4.overall.games > 0) return -1;
        if (a.stats3v4.overall.lossRate !== b.stats3v4.overall.lossRate) {
          return a.stats3v4.overall.lossRate - b.stats3v4.overall.lossRate;
        }
        return b.stats3v4.overall.games - a.stats3v4.overall.games;
      case 'lossRatePersonal_asc':
        // Primary: lowest personal loss rate. If tied or 0 games, more games played ranks higher
        if (a.gamesPlayed === 0 && b.gamesPlayed > 0) return 1;
        if (b.gamesPlayed === 0 && a.gamesPlayed > 0) return -1;
        if (a.lossRatePersonal !== b.lossRatePersonal) {
          return a.lossRatePersonal - b.lossRatePersonal;
        }
        return b.gamesPlayed - a.gamesPlayed;

      case 'lossRatePersonal_desc':
        // Primary: highest personal loss rate
        if (a.gamesPlayed === 0 && b.gamesPlayed > 0) return 1;
        if (b.gamesPlayed === 0 && a.gamesPlayed > 0) return -1;
        if (b.lossRatePersonal !== a.lossRatePersonal) {
          return b.lossRatePersonal - a.lossRatePersonal;
        }
        return b.losses - a.losses;

      case 'losses_asc':
        // Absolute fewest losses
        if (a.losses !== b.losses) return a.losses - b.losses;
        return b.gamesPlayed - a.gamesPlayed;

      case 'losses_desc':
        // Absolute most losses
        if (b.losses !== a.losses) return b.losses - a.losses;
        return b.gamesPlayed - a.gamesPlayed;

      case 'gamesPlayed_desc':
        if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
        return a.losses - b.losses;

      case 'lossRateTotal_asc':
        if (a.lossRateTotal !== b.lossRateTotal) return a.lossRateTotal - b.lossRateTotal;
        return b.gamesPlayed - a.gamesPlayed;

      case 'lossRateTotal_desc':
        if (b.lossRateTotal !== a.lossRateTotal) return b.lossRateTotal - a.lossRateTotal;
        return b.losses - a.losses;

      case 'name_asc':
      default:
        return a.player.name.localeCompare(b.player.name, 'de');
    }
  });
}

export function generateWhatsAppReport(data: AppData): string {
  const totalMatches = (data.historicalTotalMatches || 73) + data.matches.length;
  const stats = calculatePlayerStats(data);
  const sorted = sortPlayerStats(stats, 'lossRatePersonal_asc').filter((s) => s.gamesPlayed > 0);

  const todayStr = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  let text = `⚽ *VTV Freier Grund – Dienstagskick & Döner-Runde* (${todayStr})\n`;
  text += `Halle: VTV Freier Grund | Gesamtspiele: *${totalMatches}* (bis 10 Tore)\n\n`;
  text += `🏆 *Döner-Rangliste (seltenste Niederlagen %):*\n`;

  if (sorted.length === 0) {
    text += `Noch keine Spiele erfasst.\n`;
  } else {
    sorted.forEach((item, index) => {
      const medal = index === 0 ? '🥙🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      text += `${medal} *${item.player.name}*: ${item.losses} Niederlagen in ${item.gamesPlayed} Spielen (${item.lossRatePersonal}% Quote)\n`;
    });
  }

  // Döner-König (Rang 1)
  if (sorted.length > 0) {
    text += `\n🥙 *Döner-König:* ${sorted[0].player.name} (Beste Quote: nur ${sorted[0].lossRatePersonal}% Pleiten!)\n`;
  }

  // Pechvogel / Döner-Sponsor
  const worstAbsolute = [...sorted].sort((a, b) => b.losses - a.losses)[0];
  if (worstAbsolute && worstAbsolute.losses > 0) {
    text += `🌶️ *Döner-Sponsor (Pechvogel):* ${worstAbsolute.player.name} (${worstAbsolute.losses} Niederlagen absolut)\n`;
  }

  // Format Highlights (3v3, 4v4, 3v4)
  const best3v3 = [...sorted].filter(s => s.stats3v3.games > 0).sort((a, b) => a.stats3v3.lossRate - b.stats3v3.lossRate || b.stats3v3.games - a.stats3v3.games)[0];
  const best4v4 = [...sorted].filter(s => s.stats4v4.games > 0).sort((a, b) => a.stats4v4.lossRate - b.stats4v4.lossRate || b.stats4v4.games - a.stats4v4.games)[0];
  
  // Unterzahl-König: Who wins most as 3 against 4
  const bestUnderdog = [...sorted].filter(s => s.stats3v4.as3er.wins > 0).sort((a, b) => b.stats3v4.as3er.wins - a.stats3v4.as3er.wins || b.stats3v4.as3er.winRate - a.stats3v4.as3er.winRate)[0];

  if (best3v3) {
    text += `⚡ *Bester in 3 vs. 3:* ${best3v3.player.name} (${best3v3.stats3v3.wins}S / ${best3v3.stats3v3.losses}N · ${best3v3.stats3v3.lossRate}% Pleiten)\n`;
  }
  if (best4v4) {
    text += `🛡️ *Bester in 4 vs. 4:* ${best4v4.player.name} (${best4v4.stats4v4.wins}S / ${best4v4.stats4v4.losses}N · ${best4v4.stats4v4.lossRate}% Pleiten)\n`;
  }
  if (bestUnderdog) {
    text += `🔥 *Unterzahl-König (3 vs. 4):* ${bestUnderdog.player.name} (${bestUnderdog.stats3v4.as3er.wins} Siege zu dritt gegen 4! ${bestUnderdog.stats3v4.as3er.winRate}% Siegquote)\n`;
  }

  let shareUrl = window.location.origin;
  if (shareUrl.includes('ais-dev-')) {
    shareUrl = shareUrl.replace('ais-dev-', 'ais-pre-');
  }

  text += `\n📲 Live-Tabelle & Spiele eintragen:\n${shareUrl}`;
  return text;
}
