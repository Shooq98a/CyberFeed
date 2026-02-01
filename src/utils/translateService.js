// Optimized translation service - translates only visible items
// Uses cache to avoid re-translating the same content

// API key should be set as environment variable
// For local development, create a .env file with: VITE_OPENAI_API_KEY=your_key_here
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Cache for translations
const translationCache = new Map();

// Generate cache key from text
const getCacheKey = (text, language) => `${text}_${language}`;

// Translate single text with cache
export const translateText = async (text, language = 'ar') => {
  if (!text || text.trim() === '' || language === 'en') {
    return text;
  }

  // Check if API key is available
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
    console.warn('OpenAI API key is not set. Translation disabled. Please set VITE_OPENAI_API_KEY in .env file');
    return text;
  }

  const cacheKey = getCacheKey(text, language);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `Translate the following text to Arabic. Return only the translation, no explanations: "${text}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.warn('Translation failed, using original text');
      return text;
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim() || text;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.warn('Translation error:', error);
    return text;
  }
};

// Translate a single feed item (optimized - only title and description)
export const translateFeedItem = async (item, language = 'ar') => {
  if (language === 'en' || !item) {
    return item;
  }

  try {
    // Translate title and description in parallel
    const [translatedTitle, translatedDescription] = await Promise.all([
      translateText(item.title || '', language),
      translateText(item.contentSnippet || item.description || '', language)
    ]);

    return {
      ...item,
      title: translatedTitle,
      contentSnippet: translatedDescription,
      description: translatedDescription,
      // Keep original text for tag extraction
      originalTitle: item.title,
      originalContentSnippet: item.contentSnippet || item.description || '',
      originalDescription: item.description
    };
  } catch (error) {
    console.error('Error translating feed item:', error);
    return item;
  }
};

// Translate only visible items (pagination-aware)
export const translateVisibleItems = async (items, language = 'ar', startIndex = 0, endIndex = 10) => {
  if (language === 'en' || !items || items.length === 0) {
    return items;
  }

  // Only translate visible items (current page)
  const visibleItems = items.slice(startIndex, endIndex);
  const translatedVisible = await Promise.all(
    visibleItems.map(item => translateFeedItem(item, language))
  );

  // Return all items with translated visible ones
  return [
    ...items.slice(0, startIndex),
    ...translatedVisible,
    ...items.slice(endIndex)
  ];
};

