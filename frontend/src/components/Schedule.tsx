import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Trophy } from 'lucide-react';

interface UpcomingMatch {
  id: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  time: string;
  countdownSeconds: number;
  venue: string;
}

export const Schedule: React.FC = () => {
  const [fixtures, setFixtures] = useState<UpcomingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Schedules
  useEffect(() => {
    fetch('http://localhost:5000/api/schedule')
      .then(res => res.json())
      .then(data => {
        setFixtures(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching schedules", err);
        setIsLoading(false);
      });
  }, []);

  // Countdown timer update loop
  useEffect(() => {
    if (fixtures.length === 0) return;

    const timer = setInterval(() => {
      setFixtures(prev => 
        prev.map(item => ({
          ...item,
          countdownSeconds: Math.max(0, item.countdownSeconds - 1)
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [fixtures.length]);

  // Format countdown seconds into DD:HH:MM:SS
  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "KICKOFF!";
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${hours.toString().padStart(2, '0')}h`);
    parts.push(`${minutes.toString().padStart(2, '0')}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);

    return parts.join(' ');
  };

  return (
    <div className="animate-slide-up">
      <div className="section-title">
        <Calendar size={20} className="logo-icon" />
        Upcoming Match Schedules
      </div>
      <p className="section-subtitle">Calendar and details of upcoming clashes with dynamic kickoff counters</p>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading schedule calendar...</p>
        </div>
      ) : (
        <div className="schedule-container">
          {fixtures.map(match => (
            <div key={match.id} className="glass-panel schedule-card">
              
              {/* League details */}
              <div className="schedule-league">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={14} className="logo-icon" style={{ color: 'var(--accent-cyan)' }} />
                  <span className="league-badge">{match.league}</span>
                </div>
                <span className="venue-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <MapPin size={11} />
                  {match.venue}
                </span>
              </div>

              {/* Matchup details */}
              <div className="schedule-matchup">
                <span style={{ textAlign: 'right', flex: 1 }}>{match.homeTeam}</span>
                <span className="schedule-logo">{match.homeLogo}</span>
                <span className="schedule-vs">vs</span>
                <span className="schedule-logo">{match.awayLogo}</span>
                <span style={{ textAlign: 'left', flex: 1 }}>{match.awayTeam}</span>
              </div>

              {/* Countdown counter */}
              <div className="schedule-countdown-box">
                <span className="countdown-timer">{formatCountdown(match.countdownSeconds)}</span>
                <span className="countdown-date">{match.date} • {match.time} Kickoff</span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
