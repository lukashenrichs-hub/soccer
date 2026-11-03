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
  activityType?: 'football' | 'badminton' | 'touchtennis' | 'other';
  sportName?: string;
}

interface AppData {
  players: Player[];
  matches: Match[];
  activeAttendeeIds: string[];
  lastUpdated: string;
  historicalTotalMatches?: number;
  deletedMatchIds?: string[];
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
    deletedMatchIds: [],
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

    if (!parsed.deletedMatchIds) {
      parsed.deletedMatchIds = [];
      changed = true;
    }

    // Filter out any matches that were marked deleted
    if (parsed.deletedMatchIds.length > 0 && Array.isArray(parsed.matches)) {
      const delSet = new Set(parsed.deletedMatchIds);
      const prevLen = parsed.matches.length;
      parsed.matches = parsed.matches.filter((m) => !delSet.has(m.id));
      if (parsed.matches.length !== prevLen) {
        changed = true;
      }
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

// Health & Keepalive endpoint (can be pinged by free cron/uptime services to prevent Render sleep)
app.get('/api/ping', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'vtv-dienstagskick',
    matchesCount: appData.matches.length,
    timestamp: new Date().toISOString(),
  });
});

// Auto-sync: merges client matches with server matches, strictly ignoring deleted tombstones
app.post('/api/sync', (req, res) => {
  const { matches } = req.body;
  if (!Array.isArray(matches)) {
    return res.status(400).json({ error: 'matches must be an array' });
  }

  let mergedCount = 0;
  const existingIds = new Set(appData.matches.map((m) => m.id));
  const deletedSet = new Set(appData.deletedMatchIds || []);

  for (const match of matches) {
    if (match && match.id && !existingIds.has(match.id) && !deletedSet.has(match.id)) {
      appData.matches.push(match);
      existingIds.add(match.id);
      mergedCount++;
    }
  }

  if (mergedCount > 0) {
    // Keep matches sorted newest first
    appData.matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    saveData(appData);
    console.log(`[Sync] Merged ${mergedCount} matches from client. Total now: ${appData.matches.length}`);
  }

  res.json({ success: true, mergedCount, totalMatches: appData.matches.length, state: appData });
});

// API Routes
app.get('/api/state', (_req, res) => {
  res.json(appData);
});

app.post('/api/matches', (req, res) => {
  const { participantIds, loserIds, sessionDate, note, activityType, sportName } = req.body;
  const isAlternative = activityType && activityType !== 'football';

  const finalLosers: string[] = Array.isArray(loserIds) ? loserIds : [];

  // For football, at least one loser is needed to determine the match result
  if (!isAlternative && finalLosers.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Verlierer muss angegeben werden.' });
  }

  // Participants default to active attendees or loserIds if not provided
  let finalParticipants: string[] = Array.isArray(participantIds) && participantIds.length > 0
    ? participantIds
    : appData.activeAttendeeIds.length > 0
      ? appData.activeAttendeeIds
      : finalLosers;

  if (finalParticipants.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein anwesender Spieler muss angegeben werden.' });
  }

  // Ensure all losers are in participants list
  for (const loserId of finalLosers) {
    if (!finalParticipants.includes(loserId)) {
      finalParticipants = [...finalParticipants, loserId];
    }
  }

  const winnerIds = finalParticipants.filter((id) => !finalLosers.includes(id));
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
    scoreTo: isAlternative ? 0 : 10,
    participantIds: finalParticipants,
    loserIds: finalLosers,
    winnerIds,
    note: note || undefined,
    activityType: activityType || 'football',
    sportName: sportName || (isAlternative ? 'Badminton' : 'Fußball'),
  };

  appData.matches.unshift(newMatch);
  saveData(appData);

  res.status(201).json({ match: newMatch, state: appData });
});

const ADMIN_PIN = '57290';

const requireAdminPin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const pin = req.headers['x-admin-pin'] || req.body?.pin || req.query?.pin;
  if (pin !== ADMIN_PIN) {
    return res.status(403).json({ error: 'PIN ungültig oder erforderlich.' });
  }
  next();
};

app.delete('/api/matches/:id', requireAdminPin, (req, res) => {
  const { id } = req.params;
  appData.matches = appData.matches.filter((m) => m.id !== id);

  if (!appData.deletedMatchIds) {
    appData.deletedMatchIds = [];
  }
  if (!appData.deletedMatchIds.includes(id)) {
    appData.deletedMatchIds.push(id);
  }

  saveData(appData);
  res.json({ success: true, state: appData });
});

// Clear all matches / reset history endpoint (PIN protected)
app.post('/api/matches/clear-all', requireAdminPin, (_req, res) => {
  if (!appData.deletedMatchIds) appData.deletedMatchIds = [];
  appData.matches.forEach((m) => {
    if (!appData.deletedMatchIds!.includes(m.id)) {
      appData.deletedMatchIds!.push(m.id);
    }
  });
  appData.matches = [];
  saveData(appData);
  res.json({ success: true, message: 'Alle erfassten Spiele wurden erfolgreich gelöscht.', state: appData });
});

app.put('/api/matches/:id', requireAdminPin, (req, res) => {
  const { id } = req.params;
  const { participantIds, loserIds, note, sessionDate, activityType, sportName } = req.body;
  const match = appData.matches.find((m) => m.id === id);

  if (!match) {
    return res.status(404).json({ error: 'Spiel nicht gefunden.' });
  }

  if (Array.isArray(loserIds)) {
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
  if (activityType) {
    match.activityType = activityType;
  }
  if (sportName) {
    match.sportName = sportName;
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

app.post('/api/players', requireAdminPin, (req, res) => {
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

app.put('/api/players/:id', requireAdminPin, (req, res) => {
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

app.delete('/api/players/:id', requireAdminPin, (req, res) => {
  const { id } = req.params;
  appData.players = appData.players.filter((p) => p.id !== id);
  appData.activeAttendeeIds = appData.activeAttendeeIds.filter((pId) => pId !== id);
  saveData(appData);
  res.json({ success: true, state: appData });
});

app.post('/api/reset-seed', requireAdminPin, (_req, res) => {
  appData = getInitialData();
  saveData(appData);
  res.json({ success: true, state: appData });
});

app.post('/api/import', requireAdminPin, (req, res) => {
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
    const stat = fs.statSync(zipPath);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="vtv-freier-grund-kick.zip"',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
    });
    fs.createReadStream(zipPath).pipe(res);
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
