# TerminalX

TerminalX is a high-performance, real-time financial market monitoring dashboard built for traders who need a fast, clean interface to track both Equities (Stocks) and Cryptocurrencies.

## Features

- **Multi-Asset Monitoring:** Toggle between Stock and Crypto markets.
- **Real-Time Dashboards:**
  - **Market Monitor:** Live price updates and 24h change tracking.
  - **Live News Feed:** Latest market bulletins.
  - **Economic Calendar:** High-impact macro event scheduling.
  - **Order Depth Ladder:** Visualize order book liquidity (WebSocket-powered for Crypto).
- **Interactive Charts:** High-performance candlestick charts using `lightweight-charts`, supporting multiple timeframes and technical indicators.
- **Persistent Workspace:** Customize and save your preferred panel layout.

## Tech Stack

- **Framework:** Vue 3 (Composition API)
- **State Management:** Pinia (with persistent state)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Charts:** Lightweight Charts (TradingView) & Highcharts
- **Drag & Drop:** vuedraggable
- **Data APIs:** Finnhub, Polygon.io, Financial Modeling Prep (FMP), and Binance.

## Setup & Configuration

### Prerequisites
- Node.js (v18+)
- pnpm (Recommended)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   VITE_FINNHUB_API_KEY=your_key_here
   VITE_POLYGON_API_KEY=your_key_here
   VITE_FMP_API_KEY=your_key_here
   ```

### Running the App
```bash
pnpm dev
```

## API Dependencies

| Feature | Provider | Key Required |
| :--- | :--- | :--- |
| **Stock Historical Data** | [Polygon.io](https://polygon.io/) | Yes |
| **Stock Real-time Quotes/News** | [Finnhub](https://finnhub.io/) | Yes |
| **Economic Calendar** | [FMP](https://financialmodelingprep.com/) | Yes |
| **Crypto Data** | [Binance](https://binance.com/) | No |

*Note: Polygon.io data requests are managed by an internal queue to respect free-tier rate limits (5 requests/minute).*
