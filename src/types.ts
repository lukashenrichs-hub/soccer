export interface Player {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
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
}

export type SortField =
  | 'lossRatePersonal_asc'  // Seltenste Niederlagen (Beste Quote)
  | 'lossRatePersonal_desc' // Häufigste Niederlagen (% Quote)
  | 'losses_asc'            // Wenigste Niederlagen (absolut)
  | 'losses_desc'           // Meiste Niederlagen (absolut)
  | 'gamesPlayed_desc'      // Meiste Einsätze
  | 'lossRateTotal_asc'     // Quote aller Spiele (geringste)
  | 'lossRateTotal_desc'    // Quote aller Spiele (höchste)
  | 'name_asc';

export type FilterOption = 'all' | 'active_players' | 'undefeated';
