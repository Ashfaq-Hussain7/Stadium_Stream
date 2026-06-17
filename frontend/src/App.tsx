import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './components/Login';
import { LiveStream } from './components/LiveStream';
import { RealTimeScores } from './components/RealTimeScores';
import { Highlights } from './components/Highlights';
import { Schedule } from './components/Schedule';
import { NewsUpdates } from './components/NewsUpdates';
import { Trophy, LogOut, Radio, Activity, Film, Calendar, Newspaper } from 'lucide-react';
import './styles/App.css';

type Page = 'live' | 'scores' | 'highlights' | 'schedule' | 'news';

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState<Page>('live');

  return (
    <div className="app-container">
      {/* Premium Glass Navigation bar */}
      <nav className="navbar">
        <a href="/" className="logo-container" onClick={(e) => { e.preventDefault(); setActivePage('live'); }}>
          <Trophy className="logo-icon spin-slow" size={24} />
          <span>Stadium<span style={{ color: 'var(--accent-green)' }}>Stream</span></span>
        </a>

        {/* Tab switcher buttons */}
        <div className="nav-links">
          <button
            onClick={() => setActivePage('live')}
            className={`glass-button ${activePage === 'live' ? 'active' : ''}`}
          >
            <Radio size={14} />
            Live Stream
          </button>

          <button
            onClick={() => setActivePage('scores')}
            className={`glass-button ${activePage === 'scores' ? 'active' : ''}`}
          >
            <Activity size={14} />
            Scores
          </button>

          <button
            onClick={() => setActivePage('highlights')}
            className={`glass-button ${activePage === 'highlights' ? 'active' : ''}`}
          >
            <Film size={14} />
            Highlights
          </button>

          <button
            onClick={() => setActivePage('schedule')}
            className={`glass-button ${activePage === 'schedule' ? 'active' : ''}`}
          >
            <Calendar size={14} />
            Schedule
          </button>

          <button
            onClick={() => setActivePage('news')}
            className={`glass-button ${activePage === 'news' ? 'active' : ''}`}
          >
            <Newspaper size={14} />
            News
          </button>
        </div>

        {/* User profile controls */}
        {user && (
          <div className="nav-user">
            <div className="user-profile">
              <img src={user.avatar} alt={user.username} className="user-avatar" />
              <span className="user-name">{user.username}</span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '10px', color: 'var(--accent-cyan)' }}>
                {user.provider === 'google' ? 'Google' : 'Striker'}
              </span>
            </div>
            <button className="glass-button" onClick={logout} style={{ padding: '8px 12px', borderColor: 'rgba(255,51,102,0.2)' }} title="Sign Out">
              <LogOut size={14} style={{ color: 'var(--accent-red)' }} />
            </button>
          </div>
        )}
      </nav>

      {/* Main dashboard content view */}
      <main className="main-content">
        {activePage === 'live' && <LiveStream />}
        {activePage === 'scores' && <RealTimeScores />}
        {activePage === 'highlights' && <Highlights />}
        {activePage === 'schedule' && <Schedule />}
        {activePage === 'news' && <NewsUpdates />}
      </main>
    </div>
  );
};

const AuthWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <Trophy className="logo-icon spin-slow" size={48} />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Entering the Stadium...</p>
      </div>
    );
  }

  return isAuthenticated ? (
    <SocketProvider>
      <DashboardContent />
    </SocketProvider>
  ) : (
    <div className="app-container">
      <nav className="navbar" style={{ borderBottom: 'none', background: 'transparent' }}>
        <div className="logo-container">
          <Trophy className="logo-icon" size={24} />
          <span>Stadium<span style={{ color: 'var(--accent-green)' }}>Stream</span></span>
        </div>
      </nav>
      <Login />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
}

export default App;
