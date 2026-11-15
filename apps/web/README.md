# SokoLink Web (`@sokolink/web`)

Official student-commerce marketplace web application for **SokoLink** — built for **IFM (Institute of Finance Management)** students in Dar es Salaam, Tanzania.

## Architecture Overview

- **Framework**: React 19 + TypeScript + React Router 7 + Vite 7 + Tailwind CSS 4 (`@tailwindcss/vite`)
- **Design System**: Editorial-Commerce identity (`#0F533E` Deep Forest Green, `#FAF8F4` Warm Ivory, `#D95D24` Restrained Terracotta Accent, `#141413` Ink, **Manrope** display typography + **Inter** body typography)
- **Marketplace Data Layer**: `src/data/demo-marketplace.ts` (clearly labelled sample IFM student shops and products in `TZS` while backend Catalogue/Seller microservices are in scaffolding stage)
- **Bilingual Content (`EN` / `SW`)**: `src/content/site-content.ts` + `src/i18n/locale-context.tsx`
- **Phase One Identity Integration**: `src/auth/auth-context.tsx` + `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`, `/account`, `/seller`, and `/admin`

## Commands

Run from the monorepo root (`/Users/King/Uni_sokolink`):

```bash
# Start local development server (http://localhost:5173)
npm run dev --workspace=@sokolink/web

# Run unit & component tests
npm run test --workspace=@sokolink/web

# Lint TypeScript & React files
npm run lint --workspace=@sokolink/web

# Build production bundle
npm run build --workspace=@sokolink/web
```
