
# ChapterWave — Phase 1: Core MVP

**Tagline:** "Write Smarter. Publish Faster."

## Design System
- Dark-mode-first with Deep Indigo (#4F46E5) primary, Electric Violet (#7C3AED) accent, Emerald (#10B981) success
- Background: #0F0F1A, Surface cards: #1A1A2E with glassmorphism
- Inter for UI, Lora for book content/preview
- Framer Motion page transitions, hover lifts, shimmer loading states, gradient animated buttons
- Light/dark mode toggle persisted in localStorage

## Backend Setup (Supabase/Lovable Cloud)
- **Database tables:** profiles, books, chapters, writing_sessions, notifications
- **Auth:** Supabase Auth with email/password + Google OAuth
- **Storage:** Supabase Storage buckets for cover images and avatars
- **Edge Functions:** AI writing (Gemini 3 Flash via Lovable AI gateway)
- **RLS policies** on all tables scoped to authenticated user

## Pages & Features

### 1. Landing Page (`/`)
- Sticky navbar with logo, nav links, Login/Sign Up CTA
- Hero with animated headline, dual CTAs, social proof
- Features grid (10 cards with icons), How It Works (3 steps)
- Testimonials carousel, Pricing table (Free vs Pro), FAQ accordion, Footer

### 2. Auth (`/login`, `/signup`, `/reset-password`)
- Animated form transitions between login/signup
- Google OAuth button + email/password
- Email verification flow, forgot/reset password
- Protected route wrapper redirecting to `/login`

### 3. User Profile (`/profile`)
- Edit display name, bio, avatar upload
- Change password, daily word count goal
- Notification preferences, delete account

### 4. Dashboard (`/dashboard`)
- Stats banner (total books, words, chapters, streak) with animated count-up
- Responsive book card grid (2→3→4 cols) with cover, title, word count, status pill, progress bar, last edited
- Search, sort (date/title/words), filter by status
- "New Book" CTA with gradient animation
- Empty state with illustration

### 5. Book Creation Wizard (`/books/new`)
- **Step 1:** Title, subtitle, author, genre dropdown, target audience, description, language, cover image upload (or auto-gradient placeholder)
- **Step 2:** AI Outline Generator — topic, chapter count slider, tone selector, special instructions → Gemini generates JSON outline → draggable/editable chapter list with reorder, add, delete, regenerate
- **Step 3:** Confirmation summary → create book → redirect to editor

### 6. Book Editor (`/books/:id/edit`)
- **Left sidebar:** Collapsible chapter list with drag-and-drop reorder, status dots, word counts, context menu (rename/duplicate/delete)
- **Center:** CodeMirror 6 markdown editor with custom dark theme, floating toolbar (bold/italic/headings/lists/etc), top toolbar (save/preview/focus/export/AI actions)
- **AI Features:** "Write This Chapter" (streams from Gemini), "Continue Writing", "Improve Selection" (clearer/engaging/formal/shorter/expand/grammar), AI chat assistant panel
- **Right panel:** Live markdown preview with Lora font, book-like styling. Toggle split/editor/preview modes
- **Auto-save** every 30s + debounced 2s after keystroke
- **Focus Mode:** hides everything except editor, soft vignette, Escape to exit
- Keyboard shortcuts: Ctrl+S save, Ctrl+P preview, Ctrl+B bold, Ctrl+I italic, Ctrl+Shift+F focus mode

### 7. Book Settings (`/books/:id/settings`)
- Edit metadata (title, subtitle, genre, tone, description, language)
- Replace cover image, set book status
- Word count goal with progress ring
- Duplicate book, AI cover prompt generator
- Delete book (type title to confirm)

### 8. Export (Modal)
- **PDF:** Cover page + TOC + styled chapters with Lora font, page numbers — generated client-side
- **Markdown:** Single .md file with chapter separators

### 9. Polish
- Confetti on book completion, streak flame icon
- Skeleton shimmer loading states everywhere
- Custom 404 page
- Mobile bottom tab bar (Dashboard/New Book/Profile)
- Collapsible sidebar layout for dashboard
