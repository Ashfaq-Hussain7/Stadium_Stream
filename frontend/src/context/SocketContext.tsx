import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import confetti from 'canvas-confetti';

export interface MatchEvent {
  minute: number;
  type: string;
  team: string;
  player: string;
  text: string;
  score?: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  league: string;
  stats: MatchStats;
  events: MatchEvent[];
  videoUrl: string;
}

export interface ChatMessage {
  matchId: number;
  user: string;
  text: string;
  timestamp?: string;
  isSelf?: boolean;
}

interface SocketContextType {
  matches: LiveMatch[];
  chatMessages: Record<number, ChatMessage[]>;
  viewers: number;
  isConnected: boolean;
  sendChatMessage: (matchId: number, username: string, text: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [chatMessages, setChatMessages] = useState<Record<number, ChatMessage[]>>({});
  const [viewers, setViewers] = useState<number>(42000);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server on port 5000
    const wsUrl = `ws://${window.location.hostname}:5000`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to StadiumStream WebSocket');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'initial_state':
            setMatches(data.matches);
            setViewers(data.viewers);
            break;
            
          case 'viewer_update':
            setViewers(data.viewers);
            break;
            
          case 'match_reset':
            setMatches(prev => prev.map(m => m.id === data.matchId ? data.match : m));
            // clear chats for this match
            setChatMessages(prev => ({
              ...prev,
              [data.matchId]: []
            }));
            break;
            
          case 'match_stats_update':
            setMatches(prev => prev.map(m => m.id === data.matchId ? { ...m, stats: data.stats } : m));
            break;
            
          case 'match_event':
            setMatches(prev => prev.map(m => {
              if (m.id === data.matchId) {
                const updatedMatch = {
                  ...m,
                  stats: data.stats,
                  events: [...m.events, data.event]
                };
                if (data.homeScore !== undefined) updatedMatch.homeScore = data.homeScore;
                if (data.awayScore !== undefined) updatedMatch.awayScore = data.awayScore;
                
                return updatedMatch;
              }
              return m;
            }));
            
            // Trigger confetti on GOAL!
            if (data.event.type === 'goal') {
              triggerGoalConfetti();
            }
            break;
            
          case 'chat_message':
            setChatMessages(prev => {
              const matchId = data.matchId;
              const currentMsgs = prev[matchId] || [];
              
              // Cap chat messages at 50
              const updatedMsgs = [...currentMsgs, {
                matchId,
                user: data.user,
                text: data.text,
                timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isSelf: !!data.isSelf
              }].slice(-50);
              
              return {
                ...prev,
                [matchId]: updatedMsgs
              };
            });
            break;
        }
      } catch (err) {
        console.error("Error processing websocket payload", err);
      }
    };

    socket.onclose = () => {
      console.log('StadiumStream WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendChatMessage = (matchId: number, username: string, text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'send_chat',
        matchId,
        username,
        text
      }));
    }
  };

  const triggerGoalConfetti = () => {
    // Beautiful dynamic confetti spray
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#00e676', '#00f0ff', '#ffd700']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#00e676', '#00f0ff', '#ffd700']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  return (
    <SocketContext.Provider value={{ matches, chatMessages, viewers, isConnected, sendChatMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
