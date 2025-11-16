# TranscriptX - YouTube Downloader Requirements

## Project Overview
**Project Name:** TranscriptX YouTube Downloader  
**Repository:** sasetia19/transcriptx-youtube-downloader  
**Branch:** main  
**Created:** November 16, 2025  
**Platform:** Web Application (React + Vite)

## Purpose
A modern web application that allows users to fetch YouTube video transcripts by pasting a URL and download them in multiple formats (TXT, JSON, Markdown). The app emphasizes a futuristic, neon-themed UI with glassmorphism effects.

---

## Tech Stack

### Core Framework
- **Frontend Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.19
- **Language:** TypeScript 5.8.3
- **Routing:** React Router DOM 6.30.1

### UI/Styling
- **UI Library:** shadcn/ui (Radix UI components)
- **Styling:** Tailwind CSS 3.4.17
- **Theme System:** next-themes 0.3.0
- **Design System:** Custom futuristic dark theme with neon accents
- **Color Palette:**
  - Primary: Cyan/Blue (190 100% 50%)
  - Accent: Purple (280 80% 60%)
  - Background: Dark (220 20% 6%)
  - Neon effects: Cyan, Blue, Purple, Magenta

### State Management & Data Fetching
- **Query Management:** TanStack Query (React Query) 5.83.0
- **Form Handling:** React Hook Form 7.61.1
- **Validation:** Zod 3.25.76
- **Form Resolvers:** @hookform/resolvers 3.10.0

### UI Components (shadcn/ui)
Full suite of Radix UI components including:
- Accordion, Alert Dialog, Avatar, Badge, Breadcrumb
- Button, Calendar, Card, Carousel, Chart
- Checkbox, Collapsible, Command, Context Menu
- Dialog, Drawer, Dropdown Menu, Form
- Hover Card, Input, Label, Menubar, Navigation Menu
- Pagination, Popover, Progress, Radio Group
- Resizable, Scroll Area, Select, Separator
- Sheet, Sidebar, Skeleton, Slider, Switch
- Table, Tabs, Textarea, Toast, Toggle, Tooltip

### Additional Libraries
- **Icons:** Lucide React 0.462.0
- **Date Utilities:** date-fns 3.6.0
- **Command Palette:** cmdk 1.1.1
- **Carousel:** embla-carousel-react 8.6.0
- **OTP Input:** input-otp 1.4.2
- **Charts:** Recharts 2.15.4
- **Drawer:** Vaul 0.9.9
- **Toast Notifications:** Sonner 1.7.4
- **Utility Functions:** clsx 2.1.1, tailwind-merge 2.6.0, class-variance-authority 0.7.1

### Development Tools
- **Package Manager:** Bun (based on bun.lockb)
- **Linting:** ESLint 9.32.0 with TypeScript support
- **Dev Tagging:** lovable-tagger 1.1.11 (Lovable.dev integration)
- **Typography:** @tailwindcss/typography 0.5.16

---

## Project Structure

```
transcriptx-youtube-downloader/
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (40+ components)
│   │   └── NavLink.tsx       # Custom navigation component
│   ├── hooks/
│   │   ├── use-mobile.tsx    # Mobile detection hook
│   │   └── use-toast.ts      # Toast notifications hook
│   ├── lib/
│   │   └── utils.ts          # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Index.tsx         # Main landing/transcript page
│   │   └── NotFound.tsx      # 404 page
│   ├── App.tsx               # Root app component with providers
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global styles & design tokens
│   └── vite-env.d.ts         # Vite type definitions
├── public/
│   └── robots.txt            # SEO configuration
├── Configuration files
└── Documentation
```

---

## Key Features

### 1. YouTube URL Processing
- **URL Validation:** Regex-based validation for YouTube URLs
  - Supported formats: `youtube.com/watch?v=*` and `youtu.be/*`
  - Validation regex: `/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/`
- **Input:** Single text input for YouTube URL
- **Error Handling:** User-friendly error messages for invalid URLs

### 2. Transcript Fetching
- **API Integration:** POST request to external API endpoint
  - Current placeholder: `https://api.example.com/transcript`
  - Request body: `{ url: string }`
  - Expected response: `{ title?: string, transcript: string }`
- **Loading States:** Animated loading indicator during fetch
- **Error Handling:** Toast notifications for success/failure

### 3. Transcript Display
- **Preview:** First 15 lines of transcript with scroll
- **Formatting:** Monospace font with proper line breaks
- **Container:** Glass-card effect with border and dark background
- **Truncation Indicator:** Shows remaining line count

### 4. Download Functionality
Three export formats available:
- **TXT:** Plain text format
- **JSON:** Structured JSON with title and transcript
- **Markdown:** Formatted with title as H1 header

Download implementation:
- Blob-based download (client-side)
- Automatic filename generation based on video title
- Toast notifications on successful download

### 5. UI/UX Design

#### Design System
- **Theme:** Futuristic dark theme with neon accents
- **Effects:**
  - Glassmorphism (glass-card class)
  - Neon borders and glows
  - Animated floating blobs in background
  - Smooth transitions and hover effects
  - Scale animations on interaction

#### Animations
- **fade-in-up:** Vertical fade-in with upward motion
- **scale-in:** Scale from 0 to full size
- **float:** Continuous floating motion for background elements
- **Staggered delays:** Sequential animation timing

#### Typography
- **Headings:** Large, bold with text-glow effect
- **Body:** Clean, readable with proper hierarchy
- **Monospace:** Code/transcript display

#### Color Scheme
```css
Primary (Cyan): hsl(190 100% 50%)
Secondary: hsl(220 15% 15%)
Accent (Purple): hsl(280 80% 60%)
Background: hsl(220 20% 6%)
Foreground: hsl(0 0% 95%)
Border: hsl(220 15% 20%)
```

---

## API Integration

### Current State
- **Status:** Placeholder API (not functional)
- **Endpoint:** `https://api.example.com/transcript`
- **Method:** POST
- **Content-Type:** application/json

### Expected Implementation
```typescript
interface TranscriptRequest {
  url: string;
}

interface TranscriptResponse {
  title?: string;
  transcript: string;
}
```

### TODO
- Replace placeholder API with actual YouTube transcript service
- Implement proper authentication if required
- Add rate limiting handling
- Improve error messages based on API error codes

---

## Development Setup

### Prerequisites
- Node.js (recommended via nvm)
- Bun package manager
- Git

### Installation
```bash
git clone <repository-url>
cd transcriptx-youtube-downloader
bun install
```

### Development
```bash
bun run dev        # Start dev server on localhost:8080
bun run build      # Production build
bun run build:dev  # Development build
bun run lint       # Run ESLint
bun run preview    # Preview production build
```

### Configuration
- **Dev Server:** Port 8080, IPv6 enabled
- **Path Alias:** `@` → `./src`
- **Component Tagger:** Enabled in development mode (Lovable integration)

---

## Deployment

### Lovable.dev Integration
- **Platform:** Hosted on Lovable.dev
- **Project URL:** https://lovable.dev/projects/052b2541-ed0c-43fc-8de9-c0cefff59094
- **Auto-commit:** Changes via Lovable are automatically committed
- **Publishing:** Project > Share > Publish
- **Custom Domain:** Supported via Project > Settings > Domains

### Alternative Deployment
- Compatible with any static hosting (Vercel, Netlify, etc.)
- Build output: `dist/` directory
- No server-side rendering required

---

## Component Architecture

### App.tsx
- Root component with provider setup
- QueryClientProvider for data fetching
- TooltipProvider for tooltips
- Toast system (dual: shadcn toast + Sonner)
- React Router with catch-all 404

### Index.tsx (Main Page)
- Form handling with controlled input
- URL validation
- API fetch logic
- Transcript display and preview
- Download handlers for 3 formats
- Responsive design (mobile-first)

### Component Library
All shadcn/ui components follow:
- Radix UI primitives
- Tailwind CSS styling
- Class variance authority patterns
- Accessible by default
- Dark theme optimized

---

## Styling Guidelines

### Custom CSS Classes
```css
.glass-card          # Glassmorphism effect
.neon-border         # Neon border glow
.hover-glow          # Hover glow effect
.text-glow           # Text glow/shadow
.animate-float       # Floating animation
.animate-fade-in     # Fade in animation
.animate-fade-in-up  # Fade in with upward motion
.animate-scale-in    # Scale in animation
```

### Utility Usage
- Use `cn()` utility (from lib/utils.ts) for conditional classes
- Leverage Tailwind's `group-*` and `peer-*` variants
- Prefer composition over custom CSS

---

## Future Enhancement Ideas

### Features
- [ ] Support for playlist transcription
- [ ] Timestamp preservation in transcript
- [ ] Multi-language subtitle support
- [ ] Search/highlight within transcript
- [ ] Copy to clipboard functionality
- [ ] History of downloaded transcripts
- [ ] User accounts and saved transcripts
- [ ] Batch URL processing
- [ ] Export to PDF
- [ ] Audio/video preview

### Technical
- [ ] Progressive Web App (PWA) support
- [ ] Offline caching of transcripts
- [ ] Backend API implementation
- [ ] Database integration
- [ ] Authentication system
- [ ] Rate limiting on client side
- [ ] Analytics integration
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] SEO optimization

### UX
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop URL input
- [ ] Browser extension
- [ ] Mobile app version
- [ ] Dark/light theme toggle
- [ ] Custom color themes
- [ ] Accessibility improvements (WCAG AAA)
- [ ] Internationalization (i18n)

---

## Known Issues & Limitations

### Current Limitations
1. **API Integration:** Using placeholder API - not functional
2. **No Backend:** All processing happens client-side (after API call)
3. **No Authentication:** Anyone can use the service
4. **No Rate Limiting:** Potential for abuse
5. **No Data Persistence:** Transcripts lost on page refresh
6. **Single URL Only:** Cannot process multiple videos at once
7. **No Error Details:** Generic error messages
8. **No Transcript Formatting:** Raw text only (no timestamps)

### Browser Compatibility
- Modern browsers only (ES2020+)
- Requires JavaScript enabled
- Blob API required for downloads

---

## Code Conventions

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interface over type for object shapes
- Proper null/undefined handling

### React
- Functional components only
- Hooks for state management
- Controlled components for forms
- Prop destructuring

### Styling
- Tailwind utility-first approach
- Custom classes only when necessary
- Consistent spacing scale
- Responsive breakpoints: sm, md, lg, xl, 2xl

### File Naming
- PascalCase for components (Index.tsx)
- kebab-case for utility files (use-toast.ts)
- lowercase for CSS/config files

---

## Dependencies Management

### Core Dependencies (Must Keep)
- React, React DOM, React Router
- TanStack Query
- Radix UI components
- Tailwind CSS
- Lucide React (icons)

### Optional Dependencies (Can Remove if Unused)
- Recharts (if no charts needed)
- date-fns (if no date formatting)
- react-day-picker (if no calendar)
- vaul (if no drawers)
- embla-carousel (if no carousels)

### Dev Dependencies
- Keep all TypeScript and ESLint packages
- Lovable-tagger can be removed if not using Lovable platform

---

## Environment Variables
Currently none used. For production:
- `VITE_API_URL` - Backend API endpoint
- `VITE_API_KEY` - API authentication key (if needed)
- `VITE_ANALYTICS_ID` - Analytics tracking ID
- `VITE_SENTRY_DSN` - Error tracking DSN

---

## Testing Strategy (Not Implemented)
Recommended testing setup:
- **Unit Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright or Cypress
- **Component Tests:** Storybook
- **Type Checking:** TypeScript strict mode
- **Linting:** ESLint with recommended rules

---

## Performance Considerations

### Current Optimizations
- Vite with SWC for fast builds
- Code splitting via React.lazy (not implemented yet)
- Tree-shaking via ES modules
- Minification in production

### Recommendations
- Lazy load shadcn/ui components not used immediately
- Implement virtual scrolling for long transcripts
- Add service worker for caching
- Optimize font loading
- Compress images/assets
- Implement CDN for static assets

---

## Accessibility (a11y)

### Current Support
- Semantic HTML via Radix UI
- Keyboard navigation (built into Radix)
- Focus management
- ARIA attributes (Radix default)

### Improvements Needed
- Screen reader testing
- Color contrast validation (WCAG AA minimum)
- Skip to content link
- Form error announcements
- Loading state announcements

---

## Security Considerations

### Current State
- No authentication
- No data storage
- Client-side only
- CORS-dependent on API

### Recommendations
- Implement HTTPS only
- Add CSP headers
- Sanitize transcript data
- Rate limiting (if backend added)
- Input validation (already has URL validation)
- XSS prevention (React default)

---

## Documentation
- **README.md:** Project overview and setup
- **copilot-requirements.md:** This file (comprehensive requirements)
- **Code Comments:** Minimal - code should be self-documenting
- **Type Definitions:** TypeScript interfaces provide inline documentation

---

## Version Control
- **Branching:** main branch only
- **Commits:** Auto-committed via Lovable (if used)
- **No CI/CD:** Manual or Lovable-managed deployment

---

## Contact & Support
- **Repository Owner:** sasetia19
- **Platform:** GitHub
- **Project Management:** Lovable.dev

---

## Glossary

### Key Terms
- **Glassmorphism:** UI style with frosted glass effect
- **Neon Border:** Glowing border effect inspired by neon lights
- **shadcn/ui:** Component library built on Radix UI and Tailwind
- **Radix UI:** Unstyled, accessible component primitives
- **TanStack Query:** Data fetching and caching library (formerly React Query)
- **Lovable:** Low-code platform for React apps
- **Bun:** Fast JavaScript runtime and package manager

---

## Copilot Instructions

When working on this project:

1. **Styling:** Always use Tailwind classes, leverage existing design tokens
2. **Components:** Use shadcn/ui components from `@/components/ui/`
3. **Icons:** Use Lucide React icons
4. **Paths:** Use `@/` alias for imports from src/
5. **Type Safety:** Always type props and state
6. **Accessibility:** Ensure keyboard and screen reader support
7. **Responsive:** Mobile-first approach, test all breakpoints
8. **Animations:** Use existing animation classes or add to index.css
9. **Theme:** Maintain futuristic/neon aesthetic
10. **API:** Remember the API is placeholder - may need updating

### Common Commands
```bash
bun run dev       # Start development
bun add <pkg>     # Add dependency
bun run lint      # Check code quality
bun run build     # Production build
```

---

*Last Updated: November 16, 2025*
