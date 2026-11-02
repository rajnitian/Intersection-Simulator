# Intersection Traffic Simulator

A modular educational intersection simulator built with **React + TypeScript + Three.js** and a **Python FastAPI** calculation service.

## Features
- Interactive 3D four-leg intersection with distinct cars, motorcycles, buses and trucks.
- Animated approach queues and vehicle movement through the junction.
- Two-phase NS/EW signal sequence: green → amber → all-red → green.
- Webster cycle-length estimate from entered critical flow ratios.
- Configurable demand, simulation speed and duration.
- Live generated/exited/queued counters and CSV export.
- Python API for timing calculations and service health.

> Engineering scope: this is an educational prototype, not a traffic-control product or standards-certified design tool. PCU factors, saturation flows, lost times, geometry, turning paths, and conflict rules require local calibration and professional validation before engineering use. The 3D animation is a visualization model; it does not establish safe real-world signal timings.

## Requirements
- Node.js 20+
- Python 3.10+

## Start the Python API
From the repository root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Start the React + Three.js frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).

The frontend attempts to call the API at `http://127.0.0.1:8000`. If the API is unavailable, it uses the same timing calculation locally so the visual simulator remains usable.

## Build frontend
```bash
cd frontend
npm run build
```

## Repository layout
```text
intersection-traffic-simulator-react-three-python/
├── frontend/       # React, TypeScript, Three.js, Vite
├── backend/        # Python FastAPI timing/analytics service
└── docs/           # model notes
```

## GitHub upload
Create a repository named `intersection-traffic-simulator-react-three-python`, extract/copy this folder, then commit the complete folder structure. Do not upload `node_modules`, `.venv`, or build caches.
