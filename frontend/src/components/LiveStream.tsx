import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, Volume2, VolumeX, Maximize2, Users, Send, MessageSquare, BarChart3, Clock, Eye } from 'lucide-react';

export const LiveStream: React.FC = () => {
  const { matches, chatMessages, viewers, sendChatMessage } = useSocket();
  const { user } = useAuth();
  
  const [selectedMatchId, setSelectedMatchId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats' | 'tactical'>('timeline');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const tacticalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
  const comments = chatMessages[selectedMatchId] || [];

  // Play / Pause toggler
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.log("Video play error", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Mute toggler
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Volume slider update
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  // Trigger fullscreen
  const triggerFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Submit comment
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    sendChatMessage(selectedMatchId, user.username, chatInput.trim());
    setChatInput('');
  };

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Sync isPlaying state on video load
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
      }
    }
  }, [selectedMatchId]);

  // Tactical Canvas simulation: draws 2D circles moving like players on pitch
  useEffect(() => {
    if (activeTab !== 'tactical') return;
    const canvas = tacticalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    
    // Setup player positions
    const homePlayers = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 60 + Math.random() * 80,
      y: 30 + Math.random() * 100,
      targetX: 60 + Math.random() * 80,
      targetY: 30 + Math.random() * 100,
      color: '#00e676',
      label: `H${i + 1}`
    }));

    const awayPlayers = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 180 + Math.random() * 80,
      y: 30 + Math.random() * 100,
      targetX: 180 + Math.random() * 80,
      targetY: 30 + Math.random() * 100,
      color: '#00f0ff',
      label: `A${i + 1}`
    }));

    const ball = {
      x: 160,
      y: 80,
      targetX: 160,
      targetY: 80
    };

    const drawField = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Pitch border lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Center line
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 10);
      ctx.lineTo(canvas.width / 2, canvas.height - 10);
      ctx.stroke();

      // Center Circle
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Penalty box home
      ctx.strokeRect(10, canvas.height / 2 - 35, 30, 70);
      
      // Penalty box away
      ctx.strokeRect(canvas.width - 40, canvas.height / 2 - 35, 30, 70);
      
      // Draw home players
      homePlayers.forEach(p => {
        // Move towards target
        p.x += (p.targetX - p.x) * 0.02;
        p.y += (p.targetY - p.y) * 0.02;
        
        // Randomize target occasionally
        if (Math.hypot(p.targetX - p.x, p.targetY - p.y) < 5) {
          p.targetX = 30 + Math.random() * 110;
          p.targetY = 20 + Math.random() * 120;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#06090e';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, p.y + 3);
      });

      // Draw away players
      awayPlayers.forEach(p => {
        p.x += (p.targetX - p.x) * 0.02;
        p.y += (p.targetY - p.y) * 0.02;
        
        if (Math.hypot(p.targetX - p.x, p.targetY - p.y) < 5) {
          p.targetX = 160 + Math.random() * 110;
          p.targetY = 20 + Math.random() * 120;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#06090e';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, p.y + 3);
      });

      // Move and draw Ball
      ball.x += (ball.targetX - ball.x) * 0.03;
      ball.y += (ball.targetY - ball.y) * 0.03;

      if (Math.hypot(ball.targetX - ball.x, ball.targetY - ball.y) < 8) {
        // Target ball near random player
        const allPlayers = [...homePlayers, ...awayPlayers];
        const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
        ball.targetX = randomPlayer.x + (Math.random() - 0.5) * 10;
        ball.targetY = randomPlayer.y + (Math.random() - 0.5) * 10;
      }

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(drawField);
    };

    drawField();
    return () => cancelAnimationFrame(animId);
  }, [activeTab, selectedMatchId]);

  if (!activeMatch) {
    return <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>Connecting to Live Feeds...</div>;
  }

  return (
    <div className="dashboard-grid animate-slide-up">
      {/* LEFT COLUMN: LIVE STREAM PLAYER */}
      <div className="stream-section">
        <div className="section-title">
          <Play size={20} className="logo-icon" />
          Live Matches Streaming
        </div>
        
        {/* Toggle between live fixtures */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {matches.map(match => (
            <button
              key={match.id}
              onClick={() => setSelectedMatchId(match.id)}
              className={`glass-button ${selectedMatchId === match.id ? 'active' : ''}`}
            >
              <span className="pulse-live" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', marginRight: '6px', display: 'inline-block' }}></span>
              {match.homeTeam} vs {match.awayTeam} ({match.homeScore}-{match.awayScore})
            </button>
          ))}
        </div>

        <div className="glass-panel stream-panel">
          {/* Custom stream player container */}
          <div className="stream-player-container">
            <video
              ref={videoRef}
              src={activeMatch.videoUrl}
              className="stream-video"
              loop
              muted={isMuted}
              autoPlay
              playsInline
            />
            
            {/* Custom Overlay GUI */}
            <div className="stream-overlay">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="stream-badge-live">
                  <span className="pulse-live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></span>
                  Live
                </span>
                
                <span className="stream-viewers">
                  <Users size={12} />
                  {viewers.toLocaleString()} watching
                </span>
              </div>

              {/* Controls */}
              <div className="stream-controls">
                <div className="stream-controls-left">
                  <button className="stream-control-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button className="stream-control-btn" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                  
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                    {activeMatch.league} • Match Min: {activeMatch.minute}'
                  </span>
                </div>

                <div className="stream-controls-right">
                  <button className="stream-control-btn" onClick={triggerFullScreen}>
                    <Maximize2 size={18} />
                  </button>
                </div>
              </div>

              {/* simulated timeline */}
              <div className="stream-timeline">
                <div className="stream-timeline-fill" style={{ width: `${(activeMatch.minute / 90) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* Stats / Timeline Tabs */}
          <div className="stream-tabs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`stream-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            >
              <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Live Events Timeline
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`stream-tab ${activeTab === 'stats' ? 'active' : ''}`}
            >
              <BarChart3 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Match Stats
            </button>
            <button
              onClick={() => setActiveTab('tactical')}
              className={`stream-tab ${activeTab === 'tactical' ? 'active' : ''}`}
            >
              <Eye size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Tactical Camera
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="tab-pane">
            {activeTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Chronological Feed</h4>
                {activeMatch.events.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting kickoff events...</p>
                ) : (
                  [...activeMatch.events].reverse().map((event, index) => (
                    <div key={index} className="event-item" style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <span className="match-minute">{event.minute}'</span>
                      <span className="event-icon-badge">
                        {event.type === 'goal' ? '⚽' : event.type === 'yellow_card' ? '🟨' : event.type === 'red_card' ? '🟥' : event.type === 'corner' ? '🚩' : '⚡'}
                      </span>
                      <span className="event-text" style={{ fontWeight: event.type === 'goal' ? '700' : '400', color: event.type === 'goal' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                        {event.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Stats split bars */}
                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{activeMatch.stats.possession[0]}%</span>
                    <span>Ball Possession</span>
                    <span>{activeMatch.stats.possession[1]}%</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${activeMatch.stats.possession[0]}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${activeMatch.stats.possession[1]}%` }}></div>
                  </div>
                </div>

                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{activeMatch.stats.shots[0]}</span>
                    <span>Total Shots</span>
                    <span>{activeMatch.stats.shots[1]}</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${(activeMatch.stats.shots[0] / (activeMatch.stats.shots[0] + activeMatch.stats.shots[1] || 1)) * 100}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${(activeMatch.stats.shots[1] / (activeMatch.stats.shots[0] + activeMatch.stats.shots[1] || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{activeMatch.stats.shotsOnTarget[0]}</span>
                    <span>Shots on Target</span>
                    <span>{activeMatch.stats.shotsOnTarget[1]}</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${(activeMatch.stats.shotsOnTarget[0] / (activeMatch.stats.shotsOnTarget[0] + activeMatch.stats.shotsOnTarget[1] || 1)) * 100}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${(activeMatch.stats.shotsOnTarget[1] / (activeMatch.stats.shotsOnTarget[0] + activeMatch.stats.shotsOnTarget[1] || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{activeMatch.stats.corners[0]}</span>
                    <span>Corners</span>
                    <span>{activeMatch.stats.corners[1]}</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${(activeMatch.stats.corners[0] / (activeMatch.stats.corners[0] + activeMatch.stats.corners[1] || 1)) * 100}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${(activeMatch.stats.corners[1] / (activeMatch.stats.corners[0] + activeMatch.stats.corners[1] || 1)) * 100}%` }}></div>
                  </div>
                </div>

                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{activeMatch.stats.yellowCards[0]} 🟨</span>
                    <span>Cards (Yellow / Red)</span>
                    <span>🟨 {activeMatch.stats.yellowCards[1]}</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${(activeMatch.stats.yellowCards[0] / (activeMatch.stats.yellowCards[0] + activeMatch.stats.yellowCards[1] || 1)) * 100}%`, background: 'var(--accent-gold)' }}></div>
                    <div className="stat-bar-away" style={{ width: `${(activeMatch.stats.yellowCards[1] / (activeMatch.stats.yellowCards[0] + activeMatch.stats.yellowCards[1] || 1)) * 100}%`, background: 'var(--accent-cyan)' }}></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tactical' && (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Simulated Field Nodes Tracker</h4>
                <canvas ref={tacticalCanvasRef} className="glow-cyan" width={320} height={160} style={{ width: '100%', maxWidth: '480px', background: '#091f13', borderRadius: '8px', border: '1.5px solid rgba(0, 230, 118, 0.2)', display: 'block', margin: '0 auto' }} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Tracking dynamic coordinates of home nodes (green) vs away nodes (cyan).</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE CHAT */}
      <div className="chat-section">
        <div className="section-title">
          <MessageSquare size={20} className="logo-icon" />
          Match Live Chat
        </div>
        
        <p className="section-subtitle">Connect with other fans around the globe</p>

        <div className="glass-panel chat-panel">
          <div className="chat-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>#{activeMatch.homeTeam.replace(/\s+/g, '')}V{activeMatch.awayTeam.replace(/\s+/g, '')}</span>
            <span className="stream-badge-live" style={{ fontSize: '0.65rem' }}>FEED SYNCED</span>
          </div>

          <div className="chat-messages">
            {comments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 'auto' }}>Welcome to the Chat Room! Share your reactions.</p>
            ) : (
              comments.map((msg, index) => (
                <div key={index} className={`chat-message-bubble ${msg.isSelf ? 'self' : ''}`}>
                  <span className="chat-msg-user">{msg.isSelf ? 'You (Striker)' : msg.user}</span>
                  <span className="chat-msg-text">{msg.text}</span>
                  <span className="chat-msg-time">{msg.timestamp}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder={user ? "Shoot a message..." : "Please log in to chat..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!user}
            />
            <button type="submit" className="glass-button active" style={{ padding: '10px' }} disabled={!user}>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
