import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import axios from 'axios';
import { connectDB, db } from './db.js';
import { newsArticles, upcomingMatches, matchHighlights } from './mockData.js';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// REST API Endpoints
app.get('/api/news', (req, res) => {
  res.json(newsArticles);
});

app.get('/api/schedule', (req, res) => {
  res.json(upcomingMatches);
});

app.get('/api/highlights', async (req, res) => {
  try {
    // ScoreBat free Highlights API
    const response = await axios.get('https://www.scorebat.com/video-api/v3/feed/');
    
    // Parse first 10 items and map to our frontend interface format
    const realHighlights = response.data.response.slice(0, 10).map((item, index) => ({
      id: 201 + index,
      title: item.title,
      description: `Watch match recap highlights from ${item.competition}. Match played on ${new Date(item.date).toLocaleDateString()}.`,
      duration: "Highlight",
      videoUrl: item.matchviewUrl, // fallback link
      embedHtml: item.videos[0]?.embed || '', // ScoreBat iframe HTML embed string
      thumbnail: item.thumbnail,
      views: "Feed",
      date: new Date(item.date).toLocaleDateString()
    }));
    
    res.json(realHighlights);
  } catch (error) {
    console.warn("Failed to fetch real highlights from ScoreBat. Falling back to mock data.", error.message);
    res.json(matchHighlights);
  }
});

// Authentication Database API
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: 'Username and email are required.' });
  }
  try {
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }
    
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
    const user = await db.createUser({ username, email, password, avatar, provider: 'local' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('Registration API error:', err);
    res.status(500).json({ error: 'Database server registration error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }
  try {
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'No user registered with this email.' });
    }
    
    // Check password if it exists
    if (user.password && user.password !== password) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('Login API error:', err);
    res.status(500).json({ error: 'Database server authentication error.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { username, email, avatar } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: 'Google profile attributes are missing.' });
  }
  try {
    let user = await db.findUserByEmail(email);
    if (!user) {
      // Create user record for first-time Google sign-in
      user = await db.createUser({ username, email, avatar, provider: 'google' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('Google Auth API error:', err);
    res.status(500).json({ error: 'Database server Google authentication error.' });
  }
});

// Setup Server and WebSockets
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Live Match state
let liveMatches = [
  {
    id: 1,
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeScore: 1,
    awayScore: 1,
    minute: 64,
    status: "live",
    league: "La Liga (El Clásico)",
    stats: {
      possession: [52, 48],
      shots: [8, 7],
      shotsOnTarget: [4, 3],
      corners: [3, 4],
      fouls: [6, 8],
      yellowCards: [1, 2],
      redCards: [0, 0]
    },
    events: [
      { minute: 12, type: "yellow_card", team: "Barcelona", player: "Gavi", text: "Gavi booked for a late challenge on Bellingham." },
      { minute: 28, type: "goal", team: "Real Madrid", player: "Vinícius Jr.", text: "GOAL! Vinícius Jr. drives a low shot into the bottom corner. Assist by Kroos." },
      { minute: 42, type: "goal", team: "Barcelona", player: "Lewandowski", text: "GOAL! Lewandowski headers in a brilliant cross from Raphinha." }
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
  },
  {
    id: 2,
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    homeScore: 0,
    awayScore: 0,
    minute: 14,
    status: "live",
    league: "Premier League",
    stats: {
      possession: [58, 42],
      shots: [3, 1],
      shotsOnTarget: [1, 0],
      corners: [2, 1],
      fouls: [2, 3],
      yellowCards: [0, 0],
      redCards: [0, 0]
    },
    events: [
      { minute: 5, type: "shot", team: "Manchester City", player: "Haaland", text: "Haaland's header from a De Bruyne cross flies just over the bar." }
    ],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  }
];

const chatUsernames = [
  "Madridista_9", "BarcaFanatic", "KloppsKop", "CityZen2026", "Gunner4Life", 
  "SoccerGuru", "CR7_Legend", "Messi_GOAT", "TacticalMind", "GoalMachine", 
  "UltraFootball", "PitchSide", "StumpedRef", "RedDevilBob", "TheSpecialOne"
];

const genericComments = [
  "What a match this is!",
  "Ref has been absolutely terrible today.",
  "That was NOT a foul! Dive!",
  "Wow, the intensity is insane.",
  "Who do you think will get subbed first?",
  "This is a proper tactical battle.",
  "Stunning atmosphere in the stadium!",
  "Are you seeing these passing sequences? Beautiful.",
  "No way they hold on to this score.",
  "Can we talk about that defender? Solid as a rock.",
  "Midfield is a warzone right now.",
  "My heart cannot take this anymore!",
  "What a save by the goalkeeper!"
];

const teamComments = {
  "Real Madrid": {
    goal: ["HALA MADRID!!!", "VINI IS UNSTOPPABLE!", "Oh my god what a goal!", "Siuuuuuu!", "Bellingham link-up play is world class."],
    shot: ["So close!", "Ahhh should have scored that!", "Nice try Vini!", "Keep pressing, Hala Madrid!"],
    card: ["Never a yellow card!!", "Ref is biased!", "Calm down guys, don't get sent off."]
  },
  "Barcelona": {
    goal: ["VISCA EL BARCA!!!", "Lewangoalski does it again!", "Tiki-taka is back!", "Beautiful team goal!", "Incredible build up!"],
    shot: ["Raphinha was so close!", "Almost the second!", "We are dominating, keep going!", "Great attempt!"],
    card: ["That is a ridiculous decision!", "Ref is bought...", "Gavi needs to be careful, he plays with too much fire."]
  },
  "Manchester City": {
    goal: ["Cmon City!", "Haaland is inevitable!", "De Bruyne masterclass once again!", "Blue Moon rising!", "What a strike!"],
    shot: ["De Bruyne just wide!", "Foden is cooking today!", "Unlucky Haaland, next one is in."]
  },
  "Liverpool": {
    goal: ["YESSSS! GET IN!", "Salah is the Egyptian King!", "What a finish!", "Allez Allez Allez!", "Unbelievable counter attack!"],
    shot: ["Salah almost! Great save.", "Ah, Diaz should have passed there.", "We are getting closer!"]
  }
};

// WebSocket broadcast helper
const broadcast = (data) => {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

// Active users tracking
let liveViewers = 42568;

// Match simulation interval
setInterval(() => {
  // Organically fluctuation of viewer count
  liveViewers += Math.floor(Math.random() * 21) - 10;
  if (liveViewers < 40000) liveViewers = 41200;
  
  // 1. Advance match minutes
  liveMatches.forEach(match => {
    if (match.minute >= 90) {
      // Reset match to simulate continuous loops
      match.minute = 1;
      match.homeScore = 0;
      match.awayScore = 0;
      match.stats = {
        possession: [50, 50],
        shots: [0, 0],
        shotsOnTarget: [0, 0],
        corners: [0, 0],
        fouls: [0, 0],
        yellowCards: [0, 0],
        redCards: [0, 0]
      };
      match.events = [{ minute: 1, type: "start", text: "Match Kickoff! The referee blows the whistle." }];
      
      broadcast({ type: 'match_reset', matchId: match.id, match });
      return;
    }

    match.minute += 1;

    // 2. Randomly trigger game events (15% chance per game minute)
    if (Math.random() < 0.18) {
      const isHome = Math.random() < 0.53; // slight home advantage
      const activeTeam = isHome ? match.homeTeam : match.awayTeam;
      const opponentTeam = isHome ? match.awayTeam : match.homeTeam;
      const activeIndex = isHome ? 0 : 1;
      const opponentIndex = isHome ? 1 : 0;
      
      const eventTypes = ["shot", "shot", "foul", "corner", "yellow_card", "goal"];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      let eventText = "";
      let player = "";
      
      // Select random player
      const teamSquads = {
        "Real Madrid": ["Bellingham", "Vinícius Jr.", "Mbappé", "Valverde", "Rodrygo", "Modric", "Carvajal"],
        "Barcelona": ["Lewandowski", "Pedri", "Gavi", "Yamal", "De Jong", "Raphinha", "Araujo"],
        "Manchester City": ["Haaland", "De Bruyne", "Foden", "Bernardo Silva", "Rodri", "Grealish", "Alvarez"],
        "Liverpool": ["Salah", "Luis Diaz", "Darwin Nuñez", "Szoboszlai", "Mac Allister", "Van Dijk", "Alexander-Arnold"]
      };
      
      const squad = teamSquads[activeTeam] || ["Player A", "Player B", "Player C"];
      player = squad[Math.floor(Math.random() * squad.length)];
      
      if (eventType === "shot") {
        match.stats.shots[activeIndex]++;
        const onTarget = Math.random() < 0.45;
        if (onTarget) {
          match.stats.shotsOnTarget[activeIndex]++;
          eventText = `Shot on target! ${player} fires a powerful drive, but the goalkeeper makes a diving save.`;
        } else {
          eventText = `${player} attempts a long-range shot, but it sails high and wide of the goal.`;
        }
        
        // Broadcast Event
        const newEvent = { minute: match.minute, type: "shot", team: activeTeam, player, text: eventText };
        match.events.push(newEvent);
        broadcast({ type: 'match_event', matchId: match.id, event: newEvent, stats: match.stats });
        
        // Spawn chat reactions
        setTimeout(() => {
          const commentsList = teamComments[activeTeam]?.shot || genericComments;
          const user = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
          const comment = commentsList[Math.floor(Math.random() * commentsList.length)];
          broadcast({ type: 'chat_message', matchId: match.id, user, text: comment, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) });
        }, 800);
      } 
      else if (eventType === "foul") {
        match.stats.fouls[activeIndex]++;
        eventText = `Foul by ${player}. The referee awards a free-kick to ${opponentTeam}.`;
        const newEvent = { minute: match.minute, type: "foul", team: activeTeam, player, text: eventText };
        match.events.push(newEvent);
        broadcast({ type: 'match_event', matchId: match.id, event: newEvent, stats: match.stats });
      } 
      else if (eventType === "corner") {
        match.stats.corners[activeIndex]++;
        eventText = `Corner kick for ${activeTeam}. ${player} walks over to deliver it.`;
        const newEvent = { minute: match.minute, type: "corner", team: activeTeam, player, text: eventText };
        match.events.push(newEvent);
        broadcast({ type: 'match_event', matchId: match.id, event: newEvent, stats: match.stats });
      } 
      else if (eventType === "yellow_card") {
        match.stats.yellowCards[activeIndex]++;
        match.stats.fouls[activeIndex]++;
        eventText = `Yellow Card! ${player} is booked for a tactical foul, stopping a dangerous counter-attack.`;
        const newEvent = { minute: match.minute, type: "yellow_card", team: activeTeam, player, text: eventText };
        match.events.push(newEvent);
        broadcast({ type: 'match_event', matchId: match.id, event: newEvent, stats: match.stats });
        
        setTimeout(() => {
          const commentsList = teamComments[activeTeam]?.card || genericComments;
          const user = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
          const comment = commentsList[Math.floor(Math.random() * commentsList.length)];
          broadcast({ type: 'chat_message', matchId: match.id, user, text: comment });
        }, 800);
      } 
      else if (eventType === "goal") {
        // Increment Score
        if (isHome) match.homeScore++;
        else match.awayScore++;
        
        match.stats.shots[activeIndex]++;
        match.stats.shotsOnTarget[activeIndex]++;
        
        eventText = `⚽ GOAL!!! ${player} makes a brilliant run and slots it past the keeper! What a fantastic goal for ${activeTeam}!`;
        
        const newEvent = { 
          minute: match.minute, 
          type: "goal", 
          team: activeTeam, 
          player, 
          text: eventText,
          score: `${match.homeScore} - ${match.awayScore}`
        };
        match.events.push(newEvent);
        broadcast({ 
          type: 'match_event', 
          matchId: match.id, 
          event: newEvent, 
          stats: match.stats,
          homeScore: match.homeScore,
          awayScore: match.awayScore
        });
        
        // Spawn multiple goal reactions
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const commentsList = teamComments[activeTeam]?.goal || genericComments;
            const user = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
            const comment = commentsList[Math.floor(Math.random() * commentsList.length)];
            broadcast({ type: 'chat_message', matchId: match.id, user, text: comment });
          }, 400 + i * 500);
        }
      }
    } else {
      // Dynamic shift in possession
      const shift = Math.floor(Math.random() * 5) - 2; // -2 to 2
      let newHomePoss = match.stats.possession[0] + shift;
      if (newHomePoss > 75) newHomePoss = 75;
      if (newHomePoss < 25) newHomePoss = 25;
      match.stats.possession[0] = newHomePoss;
      match.stats.possession[1] = 100 - newHomePoss;
      
      broadcast({ type: 'match_stats_update', matchId: match.id, stats: match.stats });
    }
  });

  // 3. Keep chat active even when no major event is happening (spawn general comments)
  if (Math.random() < 0.6) {
    const matchId = Math.random() < 0.5 ? 1 : 2;
    const user = chatUsernames[Math.floor(Math.random() * chatUsernames.length)];
    const comment = genericComments[Math.floor(Math.random() * genericComments.length)];
    broadcast({ 
      type: 'chat_message', 
      matchId, 
      user, 
      text: comment,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})
    });
  }

  // Broadcast viewer update
  broadcast({ type: 'viewer_update', viewers: liveViewers });

}, 4000); // Trigger updates every 4 seconds (equals 1 virtual match minute)


// Handle Upgrade requests for WebSockets
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket server');
  
  // Send initial matches state and initial viewer count immediately
  ws.send(JSON.stringify({ type: 'initial_state', matches: liveMatches, viewers: liveViewers }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // User sent chat message
      if (data.type === 'send_chat') {
        const chatMsg = {
          type: 'chat_message',
          matchId: data.matchId,
          user: data.username || "AnonymousFan",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
          isSelf: true
        };
        // Broadcast to everyone
        broadcast(chatMsg);
      }
    } catch (err) {
      console.error("Error handling ws message", err);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Express API & WebSockets running at http://localhost:${PORT}`);
});
