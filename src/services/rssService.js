// Parse RSS XML using DOMParser (works in browser)
const parseRSS = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse XML: ' + parseError.textContent);
  }

  const channel = xmlDoc.querySelector('channel');
  if (!channel) {
    throw new Error('Invalid RSS feed: no channel found');
  }

  const title = channel.querySelector('title')?.textContent || '';
  const description = channel.querySelector('description')?.textContent || '';
  const link = channel.querySelector('link')?.textContent || '';

  const items = Array.from(channel.querySelectorAll('item')).map(item => {
    const itemTitle = item.querySelector('title')?.textContent || '';
    const itemDescription = item.querySelector('description')?.textContent || '';
    const itemLink = item.querySelector('link')?.textContent || '';
    const itemPubDate = item.querySelector('pubDate')?.textContent || '';
    const itemGuid = item.querySelector('guid')?.textContent || itemLink;
    const itemContent = item.querySelector('content\\:encoded')?.textContent || itemDescription;

    return {
      title: itemTitle,
      description: itemDescription,
      contentSnippet: itemDescription,
      link: itemLink,
      pubDate: itemPubDate,
      guid: itemGuid,
      content: itemContent
    };
  });

  return {
    title,
    description,
    link,
    items
  };
};

// Helper function to add timeout to fetch
const fetchWithTimeout = (url, timeout = 8000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const fetchRSSFeed = async (url) => {
  try {
    // Try multiple methods to fetch RSS (prioritize faster ones)
    const methods = [
      // Method 1: rss2json API (fastest, converts RSS to JSON)
      async () => {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
        const response = await fetchWithTimeout(apiUrl, 6000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('API returned error');
        
        // Convert JSON response to RSS-like format
        return {
          title: data.feed?.title || '',
          description: data.feed?.description || '',
          link: data.feed?.link || '',
          items: (data.items || []).map(item => ({
            title: item.title || '',
            description: item.description || item.content || '',
            contentSnippet: item.description || item.content || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            guid: item.guid || item.link || '',
            content: item.content || item.description || ''
          }))
        };
      },
      // Method 2: corsproxy.io (returns XML directly)
      async () => {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const response = await fetchWithTimeout(proxyUrl, 6000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (!text.includes('<?xml') && !text.includes('<rss')) {
          throw new Error('Not valid XML');
        }
        return text;
      },
      // Method 3: allorigins.win (returns JSON with contents)
      async () => {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetchWithTimeout(proxyUrl, 6000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (!text.trim().startsWith('{')) throw new Error('Not JSON');
        const data = JSON.parse(text);
        if (!data.contents) throw new Error('No contents in response');
        return data.contents;
      }
    ];

    let lastError = null;
    
    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`Trying method ${i + 1}...`);
        const result = await methods[i]();
        
        // If result is already parsed (from rss2json), return it
        if (result.items && Array.isArray(result.items)) {
          console.log('Successfully fetched feed via API:', result.title, 'Items:', result.items.length);
          return result;
        }
        
        // Otherwise, parse XML
        if (typeof result === 'string') {
          if (!result.includes('<?xml') && !result.includes('<rss')) {
            throw new Error('Response does not contain valid XML');
          }
          console.log('Parsing RSS feed from:', url);
          const feed = parseRSS(result);
          console.log('Successfully parsed feed:', feed.title, 'Items:', feed.items?.length);
          return feed;
        }
        
        throw new Error('Unexpected result format');
      } catch (error) {
        console.warn(`Method ${i + 1} failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error('All methods failed');
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    throw error;
  }
};

export const fetchAllFeeds = async () => {
  const feeds = {
    data: null,
    attacks: null
  };

  console.log('Starting to fetch all feeds...');

  try {
    const [dataFeed, attacksFeed] = await Promise.allSettled([
      fetchRSSFeed('https://www.cshub.com/rss/categories/data'),
      fetchRSSFeed('https://www.cshub.com/rss/categories/attacks')
    ]);

    if (dataFeed.status === 'fulfilled') {
      feeds.data = dataFeed.value;
      console.log('Data feed loaded successfully:', feeds.data?.items?.length, 'items');
    } else {
      console.error('Failed to fetch data feed:', dataFeed.reason);
      console.error('Error details:', dataFeed.reason?.message || dataFeed.reason);
    }

    if (attacksFeed.status === 'fulfilled') {
      feeds.attacks = attacksFeed.value;
      console.log('Attacks feed loaded successfully:', feeds.attacks?.items?.length, 'items');
    } else {
      console.error('Failed to fetch attacks feed:', attacksFeed.reason);
      console.error('Error details:', attacksFeed.reason?.message || attacksFeed.reason);
    }
  } catch (error) {
    console.error('Error fetching feeds:', error);
    console.error('Error stack:', error.stack);
  }

  console.log('Final feeds state:', {
    dataItems: feeds.data?.items?.length || 0,
    attacksItems: feeds.attacks?.items?.length || 0
  });

  return feeds;
};

