import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { STALL_CATEGORIES, generateStallGrid } from "../../data/mockData.js";

export default function StallMapBuilder({
  eventName = "CSU Food Fest 2024",
  eventDates = "May 10 - 12, 2024 | CSUCC Grounds",
  editable = true,
  backLink = "/admin/events",
}) {
  const [stalls, setStalls] = useState(generateStallGrid);
  const [selected, setSelected] = useState(stalls[21]);
  const [dragStall, setDragStall] = useState(null);

  const handleSelect = (stall) => setSelected(stall);

  const handleDragStart = (stall) => {
    if (!editable) return;
    setDragStall(stall);
  };

  const handleDrop = (targetStall) => {
    if (!dragStall || dragStall.id === targetStall.id) return;
    setStalls((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((s) => s.id === dragStall.id);
      const toIdx = next.findIndex((s) => s.id === targetStall.id);
      const fromCat = next[fromIdx].category;
      next[fromIdx] = { ...next[fromIdx], category: next[toIdx].category };
      next[toIdx] = { ...next[toIdx], category: fromCat };
      return next;
    });
    setDragStall(null);
  };

  return (
    <div className="stall-map-page fade-in">
      <div className="stall-map-header">
        <Link to={backLink} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back to Events
        </Link>
        <div className="stall-map-header-info">
          <h2>Event: {eventName}</h2>
          <p>{eventDates}</p>
        </div>
        {editable && (
          <button type="button" className="btn btn-primary">Save Layout</button>
        )}
      </div>

      <div className="stall-map-layout">
        <div className="stall-legend">
          <h3>Stall Categories</h3>
          {Object.entries(STALL_CATEGORIES).map(([key, { label, class: cls }]) => (
            <div key={key} className="stall-legend-item">
              <span className={`stall-legend-swatch ${cls.replace("stall-cell", "stall-legend")}`}
                style={{
                  background: cls.includes("food") ? "#BBF7D0"
                    : cls.includes("merchandise") ? "#BFDBFE"
                    : cls.includes("mixed") ? "#FEF08A"
                    : cls.includes("reserved") ? "#FED7AA" : "#fff",
                  border: cls.includes("available") ? "1px solid var(--cm-border)" : "none",
                }}
              />
              {label}
            </div>
          ))}
        </div>

        <div className="stall-map-area">
          <div className="stall-map-marker">STAGE</div>
          <div className="stall-map-grid" role="grid" aria-label="Event stall map">
            {stalls.map((stall) => {
              const cat = STALL_CATEGORIES[stall.category] || STALL_CATEGORIES.available;
              return (
                <button
                  key={stall.id}
                  type="button"
                  className={`stall-cell ${cat.class} ${selected?.id === stall.id ? "selected" : ""}`}
                  onClick={() => handleSelect(stall)}
                  draggable={editable}
                  onDragStart={() => handleDragStart(stall)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stall)}
                  aria-label={`Stall ${stall.number}, ${cat.label}`}
                  aria-pressed={selected?.id === stall.id}
                >
                  {stall.number}
                </button>
              );
            })}
          </div>
          <div className="stall-map-marker">ENTRANCE</div>
        </div>

        {selected && (
          <div className="stall-details">
            <h3>Stall Details</h3>
            <div className="stall-detail-row"><span>Stall Number</span><span>{selected.number}</span></div>
            <div className="stall-detail-row">
              <span>Category</span>
              <span>{STALL_CATEGORIES[selected.category]?.label || "Available"}</span>
            </div>
            <div className="stall-detail-row"><span>Size</span><span>{selected.size}</span></div>
            <div className="stall-detail-row"><span>Price</span><span>₱{selected.price.toFixed(2)}</span></div>
            <div className="stall-detail-row">
              <span>Status</span>
              <span style={{ color: "var(--cm-success)", fontWeight: 700 }}>
                {selected.status === "reserved" ? "Reserved" : selected.status === "occupied" ? "Occupied" : "Available"}
              </span>
            </div>
            {editable ? (
              <button type="button" className="btn btn-primary w-full" style={{ marginTop: "1.5rem", width: "100%" }}>
                Edit Stall
              </button>
            ) : (
              <button type="button" className="btn btn-primary" style={{ marginTop: "1.5rem", width: "100%" }}>
                Reserve Stall
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .stall-map-page { display: flex; flex-direction: column; gap: var(--space-3); }
        .stall-map-header {
          display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); flex-wrap: wrap;
        }
        .stall-map-header-info { text-align: center; flex: 1; }
        .stall-map-header-info h2 { font-size: 1.125rem; font-weight: 700; color: var(--cm-text); }
        .stall-map-header-info p { font-size: 0.875rem; color: var(--cm-text-secondary); }
      `}</style>
    </div>
  );
}
