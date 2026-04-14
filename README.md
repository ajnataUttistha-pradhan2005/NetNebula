# EtherMind - Cyberpunk Intelligence System

A real-time cyberpunk intelligence system visualizing global digital activity as a living neural network. Monitors Reddit and crypto topics for spikes and correlations in real-time.

## Tech Stack
* **Frontend**: React (Vite), TailwindCSS 3+ (Glassmorphism & Neon design), Framer Motion, Three.js (@react-three/fiber), Recharts.
* **Backend**: Node.js + Express, Axios for data polling.
* **Deployment**: Docker & Docker Compose.

## How to Run
Ensure Docker Desktop is running on your machine.

1. Open a terminal in this directory.
2. Run the following command:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to `http://localhost`.

## Architecture & Features
* **Neural Field (3D)**: Interactive full-screen neural visualization representing intelligence nodes and correlation links.
* **Data Ingestion**: Polling `reddit.com/r/all/new.json` and CoinGecko simple price API every 8 seconds.
* **Anomaly Engine**: Detects spikes in attention or volatility compared to moving historical averages.
* **Correlation Intelligence Engine**: Detects synchronized patterns across disparate streams (e.g., Crypto spikes aligned with AI discussions) and highlights them in the Insight Panel.
* **Live Feed**: A real-time, glitchy terminal feed displaying intelligence signals as they enter the stream.

## System Reset
The memory buffers retain up to 100 historical signals to keep performance ultra-fast. To clear system memory, simply restart the backend container.
