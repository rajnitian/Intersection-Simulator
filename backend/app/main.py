from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Intersection Traffic Simulator API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class TimingRequest(BaseModel):
    north: float = Field(default=450, ge=0, le=20000)
    south: float = Field(default=520, ge=0, le=20000)
    east: float = Field(default=380, ge=0, le=20000)
    west: float = Field(default=420, ge=0, le=20000)
    saturation_flow: float = Field(default=1900, ge=500, le=5000)
    lost_time: float = Field(default=4, ge=1, le=10)


def webster(data: TimingRequest) -> dict:
    """Return a simplified two-phase Webster cycle estimate."""
    sat = max(500.0, data.saturation_flow)
    lost = min(10.0, max(1.0, data.lost_time))
    y_ns = max(data.north, data.south) / sat
    y_ew = max(data.east, data.west) / sat
    y = y_ns + y_ew
    raw_cycle = (1.5 * (2 * lost) + 5) / (1 - y) if y < 0.95 else 180.0
    cycle = min(180.0, max(40.0, raw_cycle))
    effective_green = max(14.0, cycle - 2 * lost)
    extra = max(0.0, effective_green - 14.0)
    ns_share = y_ns / y if y > 0 else 0.5
    amber = min(3.0, lost)
    all_red = max(0.0, lost - amber)
    return {
        "cycle": round(cycle, 2),
        "ns_green": round(7 + extra * ns_share, 2),
        "ew_green": round(7 + extra * (1 - ns_share), 2),
        "amber": round(amber, 2),
        "all_red": round(all_red, 2),
        "y_ns": round(y_ns, 4),
        "y_ew": round(y_ew, 4),
        "Y": round(y, 4),
        "oversaturated": y >= 0.95,
        "method": "simplified two-phase Webster estimate",
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": "intersection-traffic-simulator-api"}

@app.post("/timing")
def calculate_timing(data: TimingRequest):
    return webster(data)

@app.post("/analytics")
def analytics(payload: dict):
    """Summarize counters posted by the frontend; no real traffic data is implied."""
    generated = max(0, int(payload.get("generated", 0)))
    exited = max(0, int(payload.get("exited", 0)))
    queued = max(0, int(payload.get("queued", 0)))
    return {"generated": generated, "exited": min(exited, generated), "queued": queued,
            "in_network_estimate": max(0, generated - exited)}
