# TerminalX Project Instructions

TerminalX is a high-performance, real-time financial market monitoring dashboard built with Vue 3 (Composition API) and TypeScript. It is designed to provide traders with a fast, clean interface for tracking Equities and Cryptocurrencies.

## Tech Stack
- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **Build Tool:** Vite
- **State Management:** Pinia (with `pinia-plugin-persistedstate`)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Charts:** Lightweight Charts (TradingView) & Highcharts
- **Icons:** `lucide-vue-next`
- **Drag & Drop:** `vuedraggable`

## Development

### Prerequisites
- Node.js (v18+)
- pnpm

### Commands
- **Start Development Server:** `pnpm dev`
- **Build for Production:** `pnpm build`
- **Preview Production Build:** `pnpm preview`

### Environment Configuration
Ensure you have created a `.env` file in the root directory based on `.env.example` with valid API keys for:
- `VITE_FINNHUB_API_KEY`
- `VITE_POLYGON_API_KEY`
- `VITE_FMP_API_KEY`

## Project Structure & Conventions
- `src/components/`: Modular UI components organized by domain (`charts`, `dashboard`, `layout`).
- `src/composables/`: Reusable logic using the Composition API (e.g., API wrappers, WebSockets).
- `src/stores/`: Pinia stores for global state management.
- `src/types/`: TypeScript interface definitions.
- `src/utils/`: Utility functions and shared helpers.

### Style Guidelines
- Use the Vue Composition API with `<script setup lang="ts">`.
- Leverage Tailwind CSS for utility-based styling, supplemented by Vanilla CSS in `src/assets/index.css`.
- Keep components small and focused.
- Ensure all new data fetching follows the established patterns in `src/composables/`.
