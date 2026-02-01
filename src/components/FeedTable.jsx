import React, { useState } from 'react';
import { formatDate, extractTags, truncateText } from '../utils/helpers';
import { analyzeWithAI } from '../utils/openaiService';
import './FeedTable.css';

const FeedTable = ({ items, language, translations }) => {
  const [analyzingId, setAnalyzingId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({});

  const handleAnalyze = async (item) => {
    const itemId = item.guid || item.link;
    setAnalyzingId(itemId);
    try {
      console.log('Analyzing item from table:', item.title);
      const analysis = await analyzeWithAI(item, language);
      console.log('Analysis received:', analysis);
      setAiAnalysis(prev => ({ ...prev, [itemId]: analysis }));
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error.message || (language === 'ar' ? 'خطأ في التحليل' : 'Error analyzing');
      alert(errorMessage);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="table-container">
      <table className="feed-table">
        <thead>
          <tr>
            <th>{translations.title}</th>
            <th>{translations.description}</th>
            <th>{translations.date}</th>
            <th>{translations.tags}</th>
            <th>{translations.category}</th>
            <th>{translations.actions}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const tags = extractTags(item, language, translations);
            const itemId = item.guid || item.link;
            return (
              <React.Fragment key={itemId || index}>
                <tr>
                  <td className="title-cell">
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  </td>
                  <td className="description-cell">
                    {truncateText(item.contentSnippet || item.description || '', 100)}
                  </td>
                  <td>{formatDate(item.pubDate)}</td>
                  <td>
                    <div className="tags-container">
                      {tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={`tag ${tag.highlight ? 'highlight' : ''}`}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {item.category || translations.general}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleAnalyze(item)}
                      disabled={analyzingId === itemId}
                      className="analyze-btn-small"
                    >
                      {analyzingId === itemId ? translations.analyzing : translations.analyze}
                    </button>
                  </td>
                </tr>
                {aiAnalysis[itemId] && (
                  <tr className="analysis-row">
                    <td colSpan="6">
                      <div className="ai-analysis">
                        <div className="ai-analysis-header">
                          <strong>{language === 'ar' ? 'التحليل:' : 'Analysis:'}</strong>
                          <button 
                            className="close-analysis-btn"
                            onClick={() => setAiAnalysis(prev => {
                              const newAnalysis = { ...prev };
                              delete newAnalysis[itemId];
                              return newAnalysis;
                            })}
                            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <p>{aiAnalysis[itemId]}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FeedTable;

