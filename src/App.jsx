import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllFeeds } from './services/rssService';
import { translations } from './utils/translations';
import { extractTags } from './utils/helpers';
import { translateVisibleItems } from './utils/translateService';
import FeedCard from './components/FeedCard';
import FeedTable from './components/FeedTable';
import Chart from './components/Chart';
import './App.css';

function App() {
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('news');
  const [viewMode, setViewMode] = useState('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', '3months', '6months', 'year'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [feeds, setFeeds] = useState({ data: null, attacks: null });
  const [translatedItems, setTranslatedItems] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const t = translations[language];
  const itemsPerPage = 10;

  useEffect(() => {
    const loadFeeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedFeeds = await fetchAllFeeds();
        console.log('Fetched feeds:', fetchedFeeds);
        
        const hasData = fetchedFeeds.data?.items?.length > 0 || fetchedFeeds.attacks?.items?.length > 0;
        
        if (!hasData) {
          setError('No data received from feeds. Please check your internet connection and try again.');
        }
        
        setFeeds(fetchedFeeds);
      } catch (err) {
        setError(err.message || 'Failed to load feeds');
        console.error('Error loading feeds:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeeds();
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  // Use original feeds (only UI is translated, not content)
  const displayFeeds = feeds;
  const dataItems = displayFeeds.data?.items || [];
  const attacksItems = displayFeeds.attacks?.items || [];
  
  const currentItems = activeTab === 'news' ? attacksItems : dataItems;

  const filteredItems = useMemo(() => {
    let filtered = currentItems;

    // Filter by search query (name/title/tags)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      
      // Create reverse mapping from Arabic to English keywords
      const arabicToEnglish = {
        'هجوم': 'attack',
        'خرق': 'breach',
        'ثغرة': 'vulnerability',
        'برمجية فدية': 'ransomware',
        'برمجية خبيثة': 'malware',
        'تصيد': 'phishing',
        'بيانات': 'data',
        'أمن': 'security',
        'سيبراني': 'cyber',
        'تهديد': 'threat'
      };
      
      // Get English keyword if search is in Arabic
      const englishKeyword = arabicToEnglish[query] || null;
      
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const description = (item.contentSnippet || item.description || '').toLowerCase();
        const fullText = `${title} ${description}`.toLowerCase();
        
        // Search in title and description
        let matches = title.includes(query) || description.includes(query);
        
        // Search in English keywords if Arabic search
        if (englishKeyword && fullText.includes(englishKeyword)) {
          matches = true;
        }
        
        // Search in translated tags
        const tags = extractTags(item, language, t);
        const tagNames = tags.map(tag => tag.name.toLowerCase());
        if (tagNames.some(tagName => tagName.includes(query))) {
          matches = true;
        }
        
        // Also search in original English keywords if Arabic search
        if (englishKeyword) {
          const allKeywords = ['attack', 'breach', 'vulnerability', 'ransomware', 'malware', 'phishing', 'data', 'security', 'cyber', 'threat'];
          if (allKeywords.includes(englishKeyword) && fullText.includes(englishKeyword)) {
            matches = true;
          }
        }
        
        return matches;
      });
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = null;
      let endDate = null;

      switch (dateFilter) {
        case 'year2023':
          startDate = new Date('2023-01-01');
          endDate = new Date('2023-12-31');
          break;
        case 'year2024':
          startDate = new Date('2024-01-01');
          endDate = new Date('2024-12-31');
          break;
        case 'year2025':
          startDate = new Date('2025-01-01');
          endDate = new Date('2025-12-31');
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case '6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(item => {
          if (!item.pubDate) return false;
          try {
            const itemDate = new Date(item.pubDate);
            // Set time to start of day for accurate comparison
            itemDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return itemDate >= startDate && itemDate <= endDate;
          } catch (error) {
            return false;
          }
        });
      }
    }

    return filtered;
  }, [currentItems, searchQuery, dateFilter]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Use translated items if available, otherwise use original
    const itemsToUse = translatedItems || filteredItems;
    return itemsToUse.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage, translatedItems]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Translate visible items when language changes or page changes
  useEffect(() => {
    const translateCurrentPage = async () => {
      if (language === 'en' || filteredItems.length === 0) {
        setTranslatedItems(null);
        setTranslating(false);
        return;
      }

      // Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        console.warn('Translation disabled: VITE_OPENAI_API_KEY not set in .env file');
        setTranslatedItems(null);
        setTranslating(false);
        return;
      }

      setTranslating(true);
      try {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        // Translate only current page items
        const translated = await translateVisibleItems(
          filteredItems,
          language,
          startIndex,
          endIndex
        );
        
        setTranslatedItems(translated);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedItems(null);
      } finally {
        setTranslating(false);
      }
    };

    translateCurrentPage();
  }, [language, filteredItems, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setDateFilter('all');
    setShowFilterMenu(false);
  }, [activeTab]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterMenu && !event.target.closest('.filter-container')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className={`app theme-${theme}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <img src="/logo-223.png" alt="CyberCube Logo" />
            </div>
            <div className="header-title-section">
              <h1>{t.appName}</h1>
            </div>
          </div>
          <div className="header-controls">
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              aria-label="Toggle theme"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {theme === 'light' ? (
                  <>
                    <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </>
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            </button>
            <div className="language-toggle">
              <button 
                onClick={() => setLanguage('ar')} 
                className={language === 'ar' ? 'active' : ''}
              >
                {language === 'ar' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="globe-icon">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" strokeWidth="2"/>
                  </svg>
                )}
                AR
              </button>
              <span>|</span>
              <button 
                onClick={() => setLanguage('en')} 
                className={language === 'en' ? 'active' : ''}
              >
                {language === 'en' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="globe-icon">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="white" strokeWidth="2"/>
                  </svg>
                )}
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading || translating ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{translating ? (language === 'ar' ? 'جاري الترجمة...' : 'Translating...') : t.loading}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{t.error}: {error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : (
          <div className="dashboard-content">
            {/* Tabs */}
            <div className="tabs-container">
              <button
                onClick={() => setActiveTab('news')}
                className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
              >
                {t.news}
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
              >
                {t.data}
              </button>
            </div>

            {/* Search and View Toggle */}
            <div className="controls-bar">
              <div className="search-container">
                <div className="search-input-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="search-icon">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="filter-container">
                <button
                  className={`filter-button ${dateFilter !== 'all' ? 'active' : ''}`}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter-icon">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t.filter}
                  {dateFilter !== 'all' && <span className="filter-badge">1</span>}
                </button>
                {showFilterMenu && (
                  <div className={`filter-menu ${language === 'en' ? 'filter-menu-en' : 'filter-menu-ar'}`}>
                    <div className="filter-menu-header">
                      <span>{t.filterByDate}</span>
                    </div>
                    <div className="filter-options">
                      <button
                        className={`filter-option ${dateFilter === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('all');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.all}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === 'year2023' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('year2023');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.year2023}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === 'year2024' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('year2024');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.year2024}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === 'year2025' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('year2025');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.year2025}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === 'thisMonth' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('thisMonth');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.thisMonth}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === 'lastMonth' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('lastMonth');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.lastMonth}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === '3months' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('3months');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.last3Months}
                      </button>
                      <button
                        className={`filter-option ${dateFilter === '6months' ? 'active' : ''}`}
                        onClick={() => {
                          setDateFilter('6months');
                          setShowFilterMenu(false);
                          setCurrentPage(1);
                        }}
                      >
                        {t.last6Months}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' ? 'active' : ''}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="view-icon">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {t.cardView}
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'active' : ''}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="view-icon">
                    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {t.tableView}
                </button>
              </div>
            </div>

            {/* Chart */}
            <Chart items={filteredItems} language={language} translations={t} theme={theme} />

            {/* Content */}
            {filteredItems.length === 0 ? (
              <div className="no-results">
                <p>{t.noResults}</p>
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <div className="cards-container">
                    {paginatedItems.map((item, index) => (
                      <FeedCard
                        key={item.guid || item.link || index}
                        item={item}
                        language={language}
                        translations={t}
                        theme={theme}
                      />
                    ))}
                  </div>
                ) : (
                  <FeedTable
                    items={paginatedItems}
                    language={language}
                    translations={t}
                    theme={theme}
                  />
                )}

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <span className="pagination-info">
                      {t.page} {currentPage} {t.of} {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>{'By Shouq'}</p>
      </footer>
    </div>
  );
}

export default App;

