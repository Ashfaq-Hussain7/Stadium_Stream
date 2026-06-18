import React, { useEffect, useState } from 'react';
import { Film, Play, X, Eye, Calendar } from 'lucide-react';

interface Highlight {
  id: number;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  embedHtml?: string; // Add this for ScoreBat iframe HTML widgets
  thumbnail: string;
  views: string;
  date: string;
}

export const Highlights: React.FC = () => {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Highlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/highlights')
      .then(res => res.json())
      .then(data => {
        setHighlights(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching highlights", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="animate-slide-up">
      <div className="section-title">
        <Film size={20} className="logo-icon" />
        Match Highlights Reels
      </div>
      <p className="section-subtitle">Catch up on fixtures you missed with cinematic recap clips</p>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading highlights gallery...</p>
        </div>
      ) : (
        <div className="highlights-grid">
          {highlights.map(item => (
            <div 
              key={item.id} 
              className="glass-panel highlight-card"
              onClick={() => setSelectedVideo(item)}
            >
              <div className="thumbnail-container">
                <img src={item.thumbnail} alt={item.title} className="thumbnail-img" />
                <span className="duration-badge">{item.duration}</span>
                <div className="play-icon-overlay">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
              
              <div className="highlight-info">
                <h3 className="highlight-title">{item.title}</h3>
                <div className="highlight-meta">
                  <span>{item.views}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* THEATRE SCREEN PLAY MODAL */}
      {selectedVideo && (
        <div className="modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedVideo(null)}>
              <X size={16} />
            </button>
            
            {/* Render ScoreBat iframe widget, or fall back to standard HTML5 video tag */}
            {selectedVideo.embedHtml ? (
              <div 
                dangerouslySetInnerHTML={{ __html: selectedVideo.embedHtml }}
                style={{ width: '100%', aspectRatio: '16/9', background: '#000', overflow: 'hidden' }}
              />
            ) : (
              <video 
                src={selectedVideo.videoUrl} 
                controls 
                autoPlay 
                style={{ width: '100%', display: 'block', aspectRatio: '16/9', background: '#000' }}
              />
            )}
            
            <div className="modal-body">
              <h2 className="modal-title">{selectedVideo.title}</h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={12} />
                  {selectedVideo.views}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {selectedVideo.date}
                </span>
              </div>
              <p className="modal-desc">{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
