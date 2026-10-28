export interface HistoricalStats {
  games: number;
  losses: number;
  wins?: number;
}

export interface Player {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  historicalStats?: HistoricalStats;
}

export interface Match {
  id: string;
  timestamp: string;
  sessionDate: string;
  scoreTo: number;
  participantIds: string[];
  loserIds: string[];
  winnerIds: string[];
  note?: string;
}

export interface AppData {
  players: Player[];
  matches: Match[];
  activeAttendeeIds: string[];
  lastUpdated: string;
  historicalTotalMatches?: number;
}

export interface FormatStats {
  games: number;
  wins: number;
  losses: number;
  lossRate: number; // %
  winRate: number;  // %
}

// Backward compatibility alias
export type TeamSizeStats = FormatStats;

export interface Stats3v4Detail {
  overall: FormatStats;       // All 3 vs 4 games
  as3er: FormatStats;         // In 3er team against 4 (Unterzahl)
  as4er: FormatStats;         // In 4er team against 3 (Überzahl)
}

export interface PlayerStats {
  player: Player;
  gamesPlayed: number;       // Einsätze der Person
  losses: number;            // Anzahl der Niederlagen (absolut)
  wins: number;              // Berechnete Siege
  lossRatePersonal: number;  // Quote: Niederlagen / eigene Spiele (%)
  lossRateTotal: number;     // Quote: Niederlagen / Gesamtspiele aller Runden (%)
  winRate: number;           // Quote: Siege / eigene Spiele (%)
  isAttendeeToday: boolean;  // Heute in der Halle anwesend
  team3: FormatStats;        // Legacy / general 3er team
  team4: FormatStats;        // Legacy / general 4er team
  stats3v3: FormatStats;     // Genau 3 vs. 3 Partien
  stats4v4: FormatStats;     // Genau 4 vs. 4 Partien
  stats3v4: Stats3v4Detail;  // 3 vs. 4 Partien (Gesamt, im 3er Unterzahl, im 4er Überzahl)
  historical?: HistoricalStats;
}

export type SortField =
  | 'lossRatePersonal_asc'        // Seltenste Niederlagen (Beste Quote)
  | 'lossRatePersonal_desc'       // Häufigste Niederlagen (% Quote)
  | 'losses_asc'                  // Wenigste Niederlagen (absolut)
  | 'losses_desc'                 // Meiste Niederlagen (absolut)
  | 'gamesPlayed_desc'            // Meiste Einsätze
  | 'lossRateTotal_asc'           // Quote aller Spiele (geringste)
  | 'lossRateTotal_desc'          // Quote aller Spiele (höchste)
  | '3v3_lossRate_asc'            // Beste Quote in 3 vs 3
  | '4v4_lossRate_asc'            // Beste Quote in 4 vs 4
  | '3v4_underdog_wins_desc'      // Meiste Siege im 3er gegen 4 (Unterzahl-König)
  | '3v4_underdog_winRate_desc'   // Beste Siegquote im 3er gegen 4
  | '3v4_lossRate_asc'            // Geringste Niederlagenquote in 3 vs 4 gesamt
  | 'team3_lossRate_asc'          // Legacy alias
  | 'team4_lossRate_asc'          // Legacy alias
  | 'name_asc';

export type FilterOption = 'all' | 'active_players' | 'undefeated';
export type TeamModeFilter = 'all' | '3v3' | '4v4' | '3v4';

