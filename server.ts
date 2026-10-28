import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'football-stats.json');

const INITIAL_PLAYERS = [
  'Max',
  'Jonas',
  'Felix',
  'Lukas Henrichs',
  'Basti',
  'Elton',
  'Lukas Heider',
  'Nico',
  'Sandro',
  'Stefan',
  'Tom',
  'Robin',
];

const HISTORICAL_BASELINES: Record<string, { games: number; losses: number; wins: number }> = {
  'Sandro': { games: 73, losses: 39, wins: 34 },
  'Max': { games: 64, losses: 30, wins: 34 },
  'Felix': { games: 63, losses: 28, wins: 35 },
  'Basti': { games: 62, losses: 28, wins: 34 },
  'Jonas': { games: 55, losses: 29, wins: 26 },
  'Lukas Henrichs': { games: 51, losses: 31, wins: 20 },
  'Lukas': { games: 51, losses: 31, wins: 20 },
  'Nico': { games: 48, losses: 21, wins: 27 },
  'Stefan': { games: 26, losses: 9, wins: 17 },
  'Elton': { games: 23, losses: 12, wins: 11 },
  'Tom': { games: 14, losses: 8, wins: 6 },
  'Lukas Heider': { games: 8, losses: 5, wins: 3 },
  'Robin': { games: 4, losses: 2, wins: 2 },
};

interface HistoricalStats {
  games: number;
  losses: number;
  wins?: number;
}

interface Player {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  historicalStats?: HistoricalStats;
}

interface Match {
  id: string;
  timestamp: string;
  sessionDate: string;
  scoreTo: number;
  participantIds: string[];
  loserIds: string[];
  winnerIds: string[];
  note?: string;
}

interface AppData {
  players: Player[];
  matches: Match[];
  activeAttendeeIds: string[];
  lastUpdated: string;
  historicalTotalMatches?: number;
}

function getInitialData(): AppData {
  const now = new Date().toISOString();
  return {
    players: INITIAL_PLAYERS.map((name, index) => ({
      id: `p_${index + 1}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name,
      active: true,
      createdAt: now,
      historicalStats: HISTORICAL_BASELINES[name],
    })),
    matches: [],
    activeAttendeeIds: [],
    historicalTotalMatches: 73,
    lastUpdated: now,
  };
}

function loadData(): AppData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: AppData = JSON.parse(raw);

    // Merge baseline historical stats for players if missing
    let changed = false;
    parsed.players.forEach((p) => {
      if (!p.historicalStats && HISTORICAL_BASELINES[p.name]) {
        p.historicalStats = HISTORICAL_BASELINES[p.name];
        changed = true;
      }
    });

    if (!parsed.historicalTotalMatches) {
      parsed.historicalTotalMatches = 73;
      changed = true;
    }

    if (changed) {
      saveData(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error loading data, falling back to initial data:', err);
    return getInitialData();
  }
}

function saveData(data: AppData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

// In-memory cache loaded once on start
let appData: AppData = loadData();

// API Routes
app.get('/api/state', (_req, res) => {
  res.json(appData);
});

app.post('/api/matches', (req, res) => {
  const { participantIds, loserIds, sessionDate, note } = req.body;

  if (!Array.isArray(loserIds) || loserIds.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Verlierer muss angegeben werden.' });
  }

  // Participants default to active attendees or loserIds if not provided
  let finalParticipants: string[] = Array.isArray(participantIds) && participantIds.length > 0
    ? participantIds
    : appData.activeAttendeeIds.length > 0
      ? appData.activeAttendeeIds
      : loserIds;

  // Ensure all losers are in participants list
  for (const loserId of loserIds) {
    if (!finalParticipants.includes(loserId)) {
      finalParticipants = [...finalParticipants, loserId];
    }
  }

  const winnerIds = finalParticipants.filter((id) => !loserIds.includes(id));
  const now = new Date();
  const dateStr = sessionDate || now.toISOString().split('T')[0];
  let matchTimestamp = now.toISOString();
  if (sessionDate && /^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    const [y, m, d] = sessionDate.split('-').map(Number);
    const customDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    matchTimestamp = customDate.toISOString();
  }

  const newMatch: Match = {
    id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: matchTimestamp,
    sessionDate: dateStr,
    scoreTo: 10,
    participantIds: finalParticipants,
    loserIds,
    winnerIds,
    note: note || undefined,
  };

  appData.matches.unshift(newMatch);
  saveData(appData);

  res.status(201).json({ match: newMatch, state: appData });
});

app.delete('/api/matches/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = appData.matches.length;
  appData.matches = appData.matches.filter((m) => m.id !== id);

  if (appData.matches.length === initialLength) {
    return res.status(404).json({ error: 'Spiel nicht gefunden.' });
  }

  saveData(appData);
  res.json({ success: true, state: appData });
});

app.put('/api/matches/:id', (req, res) => {
  const { id } = req.params;
  const { participantIds, loserIds, note, sessionDate } = req.body;
  const match = appData.matches.find((m) => m.id === id);

  if (!match) {
    return res.status(404).json({ error: 'Spiel nicht gefunden.' });
  }

  if (Array.isArray(loserIds) && loserIds.length > 0) {
    match.loserIds = loserIds;
  }

  if (Array.isArray(participantIds) && participantIds.length > 0) {
    match.participantIds = participantIds;
    // ensure all losers are in participants
    for (const lId of match.loserIds) {
      if (!match.participantIds.includes(lId)) {
        match.participantIds.push(lId);
      }
    }
  }

  match.winnerIds = match.participantIds.filter((pId) => !match.loserIds.includes(pId));
  if (typeof note === 'string') {
    match.note = note.trim() || undefined;
  }
  if (sessionDate) {
    match.sessionDate = sessionDate;
  }

  saveData(appData);
  res.json({ match, state: appData });
});

app.post('/api/attendees', (req, res) => {
  const { attendeeIds } = req.body;
  if (!Array.isArray(attendeeIds)) {
    return res.status(400).json({ error: 'attendeeIds muss ein Array sein.' });
  }
  appData.activeAttendeeIds = attendeeIds;
  saveData(appData);
  res.json({ success: true, activeAttendeeIds: appData.activeAttendeeIds });
});

app.post('/api/players', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name ist erforderlich.' });
  }
  const cleanName = name.trim();
  const existing = appData.players.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Ein Spieler mit diesem Namen existiert bereits.' });
  }

  const newPlayer: Player = {
    id: `p_${Date.now()}_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: cleanName,
    active: true,
    createdAt: new Date().toISOString(),
  };

  appData.players.push(newPlayer);
  saveData(appData);
  res.status(201).json({ player: newPlayer, state: appData });
});

app.put('/api/players/:id', (req, res) => {
  const { id } = req.params;
  const { name, active } = req.body;
  const player = appData.players.find((p) => p.id === id);
  if (!player) {
    return res.status(404).json({ error: 'Spieler nicht gefunden.' });
  }
  if (typeof name === 'string' && name.trim()) {
    player.name = name.trim();
  }
  if (typeof active === 'boolean') {
    player.active = active;
  }
  saveData(appData);
  res.json({ player, state: appData });
});

app.delete('/api/players/:id', (req, res) => {
  const { id } = req.params;
  appData.players = appData.players.filter((p) => p.id !== id);
  appData.activeAttendeeIds = appData.activeAttendeeIds.filter((pId) => pId !== id);
  saveData(appData);
  res.json({ success: true, state: appData });
});

app.post('/api/reset-seed', (_req, res) => {
  appData = getInitialData();
  saveData(appData);
  res.json({ success: true, state: appData });
});

app.post('/api/import', (req, res) => {
  const { players, matches, activeAttendeeIds } = req.body;
  if (!Array.isArray(players) || !Array.isArray(matches)) {
    return res.status(400).json({ error: 'Ungültiges Datenformat für den Import.' });
  }
  appData = {
    players,
    matches,
    activeAttendeeIds: Array.isArray(activeAttendeeIds) ? activeAttendeeIds : [],
    lastUpdated: new Date().toISOString(),
  };
  saveData(appData);
  res.json({ success: true, state: appData });
});

app.get('/download-zip', (_req, res) => {
  const zipPath = path.resolve(process.cwd(), 'public/vtv-dienstagskick.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'vtv-freier-grund-kick.zip');
  } else {
    res.status(404).send('ZIP file not found.');
  }
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distHtml = path.resolve(process.cwd(), 'dist/index.html');

  if (isProduction && fs.existsSync(distHtml)) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
