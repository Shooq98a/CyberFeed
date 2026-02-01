# CyberFeed - Cybersecurity News Aggregator

A modern React application that aggregates and displays cybersecurity feeds from Cybersecurity Hub with an intuitive, responsive interface.

## 🚀 Features

### Core Features
- **Dual Category Display**: Separate sections for News (Attacks) and Data feeds
- **Flexible View Modes**: Switch between Card and Table layouts
- **Pagination**: Navigate through feed items efficiently (10 items per page)
- **Advanced Search & Filters**: 
  - Search by title, description, or tags (supports both English and Arabic)
  - Date filter (2023, 2024, 2025, This Month, Last Month, etc.)
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Bilingual Support**: Complete UI translation (English/Arabic) with RTL support

### Bonus Features
- **Interactive Chart**: Visual distribution of items over time using ComposedChart (Bar + Area + Line)
- **Smart Tags**: Auto-generated tags based on keywords with highlight for critical terms
- **AI Analysis**: OpenAI-powered analysis for detailed insights on any feed item

## 🛠️ Tech Stack

- **React** + **Vite** - Fast development and optimized builds
- **Recharts** - Interactive data visualization
- **CSS Variables** - Dynamic theming (Light/Dark mode)
- **DOMParser** - Browser-native RSS parsing (no Node.js dependencies)


## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

```
src/
├── components/       # React components
│   ├── Chart.jsx    # Data visualization
│   ├── FeedCard.jsx # Card view component
│   └── FeedTable.jsx# Table view component
├── services/        # API services
│   └── rssService.js # RSS feed fetching
├── utils/           # Utilities
│   ├── helpers.js   # Helper functions
│   ├── openaiService.js # OpenAI integration
│   └── translations.js  # i18n translations
└── App.jsx          # Main application
```

## 🎨 Key Technical Decisions

1. **RSS Parsing**: Used DOMParser instead of Node.js libraries for browser compatibility
2. **CORS Handling**: Implemented multiple fallback proxies (rss2json, corsproxy.io, allorigins.win) with timeout handling
3. **Performance**: Optimized with useMemo for filtering, pagination for data management, and removed automatic translation for faster loading
4. **State Management**: React Hooks (useState, useEffect, useMemo) for efficient state handling
5. **Theming**: CSS Variables for seamless Light/Dark mode switching
6. **Error Handling**: Comprehensive error handling with user-friendly messages and proper loading states

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-optimized layouts
- Adaptive grid systems
- Touch-friendly interactions
- Optimized table display on small screens

## 🌐 Internationalization

- Complete UI translation (English/Arabic)
- Tag translation support
- RTL layout for Arabic
- Bilingual search functionality

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from: https://platform.openai.com/api-keys

## 🔒 Security Notes

- OpenAI API key should be set as an environment variable (see Configuration section)
- CORS proxies are used for RSS feed access

---

**Built with ❤️ using React By Shouq Adel**
