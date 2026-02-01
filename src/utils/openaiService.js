// API key should be set as environment variable
// For local development, create a .env file with: VITE_OPENAI_API_KEY=your_key_here
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const analyzeWithAI = async (item, language = 'en') => {
  try {
    console.log('Starting AI analysis for:', item.title);
    
    const title = item.title || 'No title';
    const description = item.contentSnippet || item.description || 'No description available';
    
    const prompt = language === 'ar' 
      ? `قم بتحليل هذا الخبر الأمني السيبراني وقدم ملخصاً مفصلاً بالعربية:\n\nالعنوان: ${title}\n\nالوصف: ${description}\n\nقدم تحليلاً شاملاً يتضمن: المخاطر المحتملة، التأثير، والتوصيات.`
      : `Analyze this cybersecurity news item and provide a detailed summary:\n\nTitle: ${title}\n\nDescription: ${description}\n\nProvide a comprehensive analysis including: potential risks, impact, and recommendations.`;

    console.log('Sending request to OpenAI API...');
    
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
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return a user-friendly error message
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      throw new Error(language === 'ar' ? 'خطأ في مفتاح API. يرجى التحقق من المفتاح.' : 'API key error. Please check the API key.');
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      throw new Error(language === 'ar' ? 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً.' : 'Rate limit exceeded. Please try again later.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error(language === 'ar' ? 'خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت.' : 'Network error. Please check your internet connection.');
    } else {
      throw new Error(language === 'ar' ? `خطأ في التحليل: ${error.message}` : `Analysis error: ${error.message}`);
    }
  }
};

