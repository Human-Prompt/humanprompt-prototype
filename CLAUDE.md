# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build static site to /out directory
npm run start        # Start production server (for testing build)
npm run lint         # Run ESLint
npx prettier --write .  # Format all files with Prettier
```

### Component Management (shadcn/ui)
```bash
npx shadcn@latest add [component-name]   # Add new shadcn/ui component
npx shadcn@latest add --all              # Add all available components
```

## Architecture Overview

### Static Site Generation

**CRITICAL:** This project uses `output: 'export'` in next.config.mjs for **static site generation**.

Constraints:
- No server-side rendering at runtime
- No API routes or server actions
- All API calls must go to external services
- Image optimization is disabled (`unoptimized: true`)
- Builds to `/out` directory for static hosting

### Layout Hierarchy

Two-tier layout separating server and client concerns:
```
app/layout.tsx (Server Component)
  └─> app/ClientLayout.tsx (Client Component)
       └─> Global header/navigation + page content
```

**app/layout.tsx:**
- Server component handling metadata and SEO
- Minimal, focused on static concerns

**app/ClientLayout.tsx:**
- Client component with all interactive elements
- Font loading (Inter for logo, Heebo Light for body)
- Global navigation header
- Consistent max-width container (max-w-7xl)

### Routing Structure

File-based routing using Next.js 15 App Router:
- `/` - Main generator interface (app/page.tsx)
- `/contact` - Contact page
- `/subscriptions` - Pricing page
- `/legal` - Legal notices

All routes are simple flat structure with no dynamic routes.

### Component Library (shadcn/ui)

This project uses **shadcn/ui** with 58 pre-installed components based on Radix UI primitives.

**Configuration:** `components.json`
- Style: default
- RSC: enabled
- Base color: neutral
- CSS variables for theming
- Icon library: Lucide React

**Path aliases:**
```typescript
@/components → components
@/utils → lib/utils
@/ui → components/ui
@/lib → lib
@/hooks → hooks
```

**Component Pattern:**
All shadcn/ui components follow this structure:
- Use `class-variance-authority` for variants
- Use `cn()` utility from `lib/utils.ts` for className composition
- Compose with Radix UI primitives
- Export both component and prop types

### State Management

**No external state library** - uses React hooks only:
- `useState` for local component state
- Complex state objects for generation tracking
- No Context API or Zustand currently in use

Main page (app/page.tsx) manages state for:
- Generation history with images/videos
- Processing states for video generation
- Modal states for fullscreen media
- Debug mode and debug info
- Model selection

### Styling System

**Tailwind CSS with extensive customization:**

Custom theme extensions (tailwind.config.ts):
- Dark theme background: `#101218`
- Semantic color tokens (input, button, toggle, nav, prompt, sidebar)
- CSS variable-based colors for theming (`hsl(var(--color-name))`)
- Custom border radius via `--radius` variable

**Animation system:**
- Custom keyframes in `app/globals.css`
- Shimmer, fade-in-up, chat-message animations
- Accordion animations via tailwindcss-animate

**Font loading:**
```typescript
Inter (logo) → --font-inter
Heebo Light 300 (body) → --font-heebo
```
Using `display: 'swap'` to prevent FOIT.

### Key Utilities

**lib/utils.ts:**
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
Use this for all className composition to properly merge Tailwind classes.

**hooks/use-toast.ts:**
Custom toast implementation with reducer pattern. Limits to 1 toast at a time.

**hooks/use-mobile.tsx:**
Detects mobile breakpoint (768px) using matchMedia API.

## Code Patterns & Conventions

### Imports
Always use absolute imports with `@/` prefix:
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### Component Files
- Use `'use client'` directive for interactive components
- Server components by default in app directory
- TypeScript with strict mode enabled

### Styling
- Use `cn()` utility for all className composition
- Prefer CSS variables over hardcoded colors
- Follow Prettier config: single quotes, 100 char width, trailing commas

### Forms
Stack: react-hook-form + zod + @hookform/resolvers
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
```

## Data Flow Patterns

### Generation Workflow
The main app follows a multi-stage generation process:
1. User enters prompt
2. Prompt enhancement (AI processing)
3. Image generation (multiple images)
4. Video generation (draft/advanced modes)
5. Track processing states per generation

### API Response Handling
Code uses multiple fallback property names for API flexibility:
```typescript
// Image URLs: imageURLs, imageUrls, urls, images
// Prompts: enhancedPrompt, enhanced_prompt, prompt, output
```
Always include robust error handling with try-catch blocks.

### Modal Pattern
State-based modals (no library):
- Fullscreen media viewer
- Video generation modal
- Enhanced prompt display
- Debug info panel
All controlled via local useState hooks.

## Tech Stack

### Core
- Next.js 15.2.4 (App Router)
- React 19
- TypeScript 5

### Styling
- Tailwind CSS 3.4.18
- tailwindcss-animate
- class-variance-authority
- tailwind-merge + clsx

### UI
- Radix UI (20+ primitives)
- shadcn/ui (58 components)
- Lucide React (icons)
- next-themes (theming)

### Forms & Validation
- react-hook-form
- zod 3.25.76
- @hookform/resolvers

### Additional
- date-fns (date utilities)
- embla-carousel-react (carousels)
- recharts (charts)
- sonner (toasts)
- @vercel/analytics

## Configuration Files

- **next.config.mjs** - Static export config, image optimization disabled
- **tailwind.config.ts** - Custom theme, colors, animations
- **tsconfig.json** - Strict mode, absolute imports via `@/*`
- **components.json** - shadcn/ui configuration
- **.prettierrc** - Code formatting (single quotes, 100 width)

## Current Architecture Notes

### Known Issues
- Build ignores TypeScript and ESLint errors (`ignoreBuildErrors: true`)
- Main page (app/page.tsx) is 2727 lines - should be componentized
- No testing infrastructure present
- No error boundary components

### Recommended Patterns for Future Work
1. Extract components from monolithic page.tsx
2. Consider Context API or Zustand for shared state
3. Create dedicated API client/service layer
4. Add error boundaries for better error handling
5. Centralize TypeScript interfaces (currently inline)
6. Add testing framework (Jest, Vitest, or Playwright)

### Anti-Patterns to Avoid
- Don't suppress build errors in production code
- Avoid creating new monolithic components (>500 lines)
- Don't hardcode API endpoints - use environment variables
- Don't use server-side features (this is a static export)
- Don't skip the cn() utility for className composition
