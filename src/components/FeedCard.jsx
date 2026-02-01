import React, { useState } from 'react';
import { formatDate, extractTags, truncateText } from '../utils/helpers';
import { analyzeWithAI } from '../utils/openaiService';
import './FeedCard.css';

const FeedCard = ({ item, language, translations }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const tags = extractTags(item, language, translations);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiAnalysis(null); // Clear previous analysis
    try {
      console.log('Analyzing item:', item.title);
      const analysis = await analyzeWithAI(item, language);
      console.log('Analysis received:', analysis);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.message || (language === 'ar' ? 'خطأ في التحليل' : 'Error analyzing');
      alert(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="feed-card">
      <div className="feed-card-header">
        <h3 className="feed-card-title">{item.title}</h3>
        <span className="feed-card-date">{formatDate(item.pubDate)}</span>
      </div>
      
      <div className="feed-card-content">
        <p className="feed-card-description">
          {truncateText(item.contentSnippet || item.description || '')}
        </p>
        
        {tags.length > 0 && (
          <div className="feed-card-tags">
            {tags.map((tag, index) => (
              <span key={index} className={`tag ${tag.highlight ? 'highlight' : ''}`}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="feed-card-footer">
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="feed-card-link"
        >
          {translations.readMore}
        </a>
        <button 
          onClick={handleAnalyze} 
          disabled={analyzing}
          className="analyze-btn"
        >
          {analyzing ? translations.analyzing : translations.analyze}
        </button>
      </div>

      {aiAnalysis && (
        <div className="ai-analysis">
          <div className="ai-analysis-header">
            <h4>{language === 'ar' ? 'التحليل بالذكاء الاصطناعي:' : 'AI Analysis:'}</h4>
            <button 
              className="close-analysis-btn"
              onClick={() => setAiAnalysis(null)}
              aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p>{aiAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default FeedCard;

