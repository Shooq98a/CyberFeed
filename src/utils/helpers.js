export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

export const extractTags = (item, language = 'en', translations = null) => {
  // Use original text if available (for translated items), otherwise use current text
  const originalTitle = item.originalTitle || item.title || '';
  const originalContent = item.originalContentSnippet || item.originalDescription || item.contentSnippet || item.description || '';
  const text = `${originalTitle} ${originalContent}`.toLowerCase();
  const highlightKeywords = ['vulnerability', 'breach', 'ransomware', 'attack'];
  const normalKeywords = ['malware', 'phishing', 'data', 'security', 'cyber', 'threat'];
  const tags = [];
  
  // Translation mapping
  const tagTranslations = {
    'attack': language === 'ar' ? (translations?.tagAttack || 'هجوم') : 'Attack',
    'breach': language === 'ar' ? (translations?.tagBreach || 'خرق') : 'Breach',
    'vulnerability': language === 'ar' ? (translations?.tagVulnerability || 'ثغرة') : 'Vulnerability',
    'ransomware': language === 'ar' ? (translations?.tagRansomware || 'برمجية فدية') : 'Ransomware',
    'malware': language === 'ar' ? (translations?.tagMalware || 'برمجية خبيثة') : 'Malware',
    'phishing': language === 'ar' ? (translations?.tagPhishing || 'تصيد') : 'Phishing',
    'data': language === 'ar' ? (translations?.tagData || 'بيانات') : 'Data',
    'security': language === 'ar' ? (translations?.tagSecurity || 'أمن') : 'Security',
    'cyber': language === 'ar' ? (translations?.tagCyber || 'سيبراني') : 'Cyber',
    'threat': language === 'ar' ? (translations?.tagThreat || 'تهديد') : 'Threat'
  };
  
  // Add highlight tags first
  highlightKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push({ name: tagTranslations[keyword] || keyword, highlight: true, original: keyword });
    }
  });
  
  // Add normal tags
  normalKeywords.forEach(keyword => {
    if (text.includes(keyword) && tags.length < 3) {
      tags.push({ name: tagTranslations[keyword] || keyword, highlight: false, original: keyword });
    }
  });
  
  return tags.slice(0, 3); // Return max 3 tags
};

export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

