import { AppData, Match, Player, PlayerStats, SortField } from '../types';

export function calculatePlayerStats(data: AppData): PlayerStats[] {
  const { players, matches, activeAttendeeIds } = data;
  const totalMatches = matches.length;

  return players.map((player) => {
    // Matches where player participated
    const playerMatches = matches.filter((m) => m.participantIds.includes(player.id));
    const gamesPlayed = playerMatches.length;

    // Matches where player lost
    const playerLosses = matches.filter((m) => m.loserIds.includes(player.id)).length;
    const wins = Math.max(0, gamesPlayed - playerLosses);

    // Rate A: losses / own games
    const lossRatePersonal = gamesPlayed > 0 ? (playerLosses / gamesPlayed) * 100 : 0;

    // Rate B: losses / total matches of the group
    const lossRateTotal = totalMatches > 0 ? (playerLosses / totalMatches) * 100 : 0;

    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
    const isAttendeeToday = activeAttendeeIds.includes(player.id);

    return {
      player,
      gamesPlayed,
      losses: playerLosses,
      wins,
      lossRatePersonal: Math.round(lossRatePersonal * 10) / 10,
      lossRateTotal: Math.round(lossRateTotal * 10) / 10,
      winRate: Math.round(winRate * 10) / 10,
      isAttendeeToday,
    };
  });
}

export function sortPlayerStats(stats: PlayerStats[], sortBy: SortField): PlayerStats[] {
  return [...stats].sort((a, b) => {
    switch (sortBy) {
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
  const totalMatches = data.matches.length;
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

  let shareUrl = window.location.origin;
  if (shareUrl.includes('ais-dev-')) {
    shareUrl = shareUrl.replace('ais-dev-', 'ais-pre-');
  }

  text += `\n📲 Live-Tabelle & Spiele eintragen:\n${shareUrl}`;
  return text;
}
