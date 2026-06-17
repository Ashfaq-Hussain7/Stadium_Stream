import React, { useEffect, useState } from 'react';
import { Newspaper, Clock, Calendar, X } from 'lucide-react';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  tag: string;
  readTime: string;
  date: string;
  image: string;
}

export const NewsUpdates: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/news')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching news articles", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="animate-slide-up">
      <div className="section-title">
        <Newspaper size={20} className="logo-icon" />
        Latest Football News
      </div>
      <p className="section-subtitle">Stay updated on transfers, tactical insights, and league updates</p>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading football headlines...</p>
        </div>
      ) : (
        <div className="news-grid">
          {articles.map(article => (
            <div 
              key={article.id} 
              className="glass-panel news-card"
              onClick={() => setSelectedArticle(article)}
              style={{ cursor: 'pointer' }}
            >
              <div className="news-img-container">
                <img src={article.image} alt={article.title} className="news-img" />
              </div>
              
              <div className="news-body">
                <div>
                  <span className="news-tag">{article.tag}</span>
                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-summary">{article.summary}</p>
                </div>

                <div className="news-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {article.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {article.readTime}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL ARTICLE MODAL READOUT */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedArticle(null)}>
              <X size={16} />
            </button>
            
            <img 
              src={selectedArticle.image} 
              alt={selectedArticle.title} 
              style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }}
            />
            
            <div className="modal-body" style={{ padding: '28px' }}>
              <span className="news-tag">{selectedArticle.tag}</span>
              <h2 className="modal-title" style={{ fontSize: '1.4rem', marginTop: '10px' }}>{selectedArticle.title}</h2>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '12px 0 20px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {selectedArticle.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {selectedArticle.readTime}
                </span>
              </div>
              
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.65', whiteSpace: 'pre-line' }}>
                {selectedArticle.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
