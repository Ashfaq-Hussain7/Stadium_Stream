import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity } from 'lucide-react';

export const RealTimeScores: React.FC = () => {
  const { matches } = useSocket();

  return (
    <div className="animate-slide-up">
      <div className="section-title">
        <Activity size={20} className="logo-icon pulse-live" />
        Real-Time Live Scores
      </div>
      <p className="section-subtitle">Keep track of ongoing games and major details around the stadium</p>

      {matches.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Awaiting match synchronization feed...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {matches.map(match => (
            <div key={match.id} className="glass-panel score-card">
              
              {/* Card Header */}
              <div className="score-card-header">
                <span>{match.league}</span>
                <span className="stream-badge-live" style={{ background: 'var(--accent-green-glow)', color: 'var(--accent-green)', padding: '2px 8px', border: '1px solid var(--accent-green)' }}>
                  <span className="pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                  LIVE
                </span>
              </div>

              {/* Matchup Scores */}
              <div className="score-matchup">
                <div className="team-display">
                  <div className="team-logo">{match.homeTeam.charAt(0)}</div>
                  <span className="team-name">{match.homeTeam}</span>
                </div>

                <div className="score-display">
                  <div className="score-numbers">
                    <span>{match.homeScore}</span>
                    <span className="score-colon">:</span>
                    <span>{match.awayScore}</span>
                  </div>
                  <span className="match-minute">{match.minute}'</span>
                </div>

                <div className="team-display">
                  <div className="team-logo">{match.awayTeam.charAt(0)}</div>
                  <span className="team-name">{match.awayTeam}</span>
                </div>
              </div>

              {/* Stat breakdown split bars */}
              <div style={{ margin: '10px 0' }}>
                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{match.stats.possession[0]}%</span>
                    <span>Ball Possession</span>
                    <span>{match.stats.possession[1]}%</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${match.stats.possession[0]}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${match.stats.possession[1]}%` }}></div>
                  </div>
                </div>

                <div className="team-stat-row">
                  <div className="stat-label-container">
                    <span>{match.stats.shots[0]}</span>
                    <span>Shots (Target)</span>
                    <span>{match.stats.shots[1]}</span>
                  </div>
                  <div className="stat-split-bar">
                    <div className="stat-bar-home" style={{ width: `${(match.stats.shots[0] / (match.stats.shots[0] + match.stats.shots[1] || 1)) * 100}%` }}></div>
                    <div className="stat-bar-away" style={{ width: `${(match.stats.shots[1] / (match.stats.shots[0] + match.stats.shots[1] || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Event Logs Ticker (Shows last 3 events) */}
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Recent Events</h4>
                <div className="match-events-list">
                  {match.events.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Match kicked off. Awaiting highlights...</p>
                  ) : (
                    [...match.events].slice(-3).reverse().map((event, index) => (
                      <div key={index} className="event-item" style={{ background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>{event.minute}'</span>
                        <span>
                          {event.type === 'goal' ? '⚽' : event.type === 'yellow_card' ? '🟨' : event.type === 'red_card' ? '🟥' : '⚡'}
                        </span>
                        <span className="event-text" style={{ fontSize: '0.72rem', fontStyle: event.type === 'goal' ? 'normal' : 'italic', fontWeight: event.type === 'goal' ? 'bold' : 'normal' }}>
                          {event.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
