import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import api from "../../services/api.js";
import eventService from "../../services/eventService.js";
import toast from "react-hot-toast";
import { CalendarDays, MapPin, ArrowUpRight, Plus, Search, Store, CalendarCheck, LayoutGrid, ArrowRight } from "lucide-react";
import "./AdminWorkspace.css";

const categories = { food: "Food stall", merchandise: "Merchandise", mixed: "Mixed-use" };
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
const eventStatus = (event) => {
  const start = String(event.start_date || event.date || "").slice(0, 10);
  const end = String(event.end_date || event.date || "").slice(0, 10);
  return end < today() ? "Past" : start > today() ? "Upcoming" : "Today";
};
const prettyDate = (value, options = { month: "short", day: "numeric", year: "numeric" }) => {
  const date = new Date(String(value).slice(0, 10) + "T12:00:00");
  return Number.isNaN(date.getTime()) ? "Date to be announced" : date.toLocaleDateString("en-PH", options);
};
export default function AdminEvents() {
  const { eventId } = useParams();
  const [events, setEvents] = useState([]);
  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All events");
  const [sort, setSort] = useState("newest");
  const load = async () => {
    setLoading(true); setError("");
    try {
      if (eventId) {
        const [e, s] = await Promise.all([eventService.getOne(eventId), eventService.getStalls(eventId)]);
        setEvent(e.data); setStalls(s.data.map((item, index) => ({ ...item, stall_number: item.stall_number || index + 1, size: item.size || "3m x 3m", price: Number(item.price || 0) }))); setSelectedId(null);
      } else { setEvents((await eventService.getAll()).data); }
      setDirty(false);
    } catch (err) { setError(err.response?.data?.error || "Unable to load events. Please retry."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [eventId]);
  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const selected = stalls.find((item) => item.id === selectedId);
  const update = (key, value) => { setStalls((items) => items.map((item) => item.id === selectedId ? { ...item, [key]: value } : item)); setDirty(true); };
  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/events/${eventId}/layout`, { version: event.layout_version || 0, stalls });
      setEvent(data.event); setStalls(data.stalls); setSelectedId(null); setDirty(false); toast.success("Layout saved");
    } catch (err) { toast.error(err.response?.data?.error || "Unable to save layout"); }
    finally { setSaving(false); }
  };
  const create = async (e) => {
    e.preventDefault(); const payload = Object.fromEntries(new FormData(e.currentTarget)); setSaving(true);
    try { await api.post("/admin/events", payload); setCreating(false); toast.success("Event created"); await load(); }
    catch (err) { toast.error(err.response?.data?.error || "Unable to create event"); }
    finally { setSaving(false); }
  };
  const visibleEvents = events.filter((e) => 
    (filter === "All events" || eventStatus(e) === filter) &&
    (e.name + " " + e.location).toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? String(a.date).localeCompare(String(b.date)) : String(b.date).localeCompare(String(a.date)));
  return <div className="dashboard-layout admin-shell"><Sidebar /><main className="dashboard-main admin-workspace">
    <div className="topbar admin-topbar"><div className="admin-breadcrumb">Workspace <span>/</span> <strong>{eventId ? "Stall map" : "Events"}</strong></div><span className="admin-workspace-label"><span /> Administrator workspace</span></div>
    <div className="dashboard-content">
      <header className="admin-page-heading"><div><p className="admin-eyebrow">CAMPUS OPERATIONS</p><h1>{eventId ? "Design your event space" : "Bring campus together."}</h1><p>{eventId ? "Every stall in the right place. Select a space to get started." : "Plan events, organize stalls, and make room for student enterprise."}</p></div>{!eventId && <button className="btn btn-primary admin-create-button" onClick={() => setCreating(!creating)} disabled={loading || !!error}><Plus size={17} />{creating ? "Close form" : "Create event"}</button>}</header>
      {loading ? <p role="status">Loading events…</p> : error ? <div role="alert" className="card admin-panel"><p>{error}</p><button className="btn btn-outline" onClick={load}>Retry</button></div> : eventId ? <>
        <div className="admin-toolbar"><Link className="btn btn-ghost" to="/admin/events" onClick={(e) => { if (dirty && !window.confirm("Discard unsaved layout changes?")) e.preventDefault(); }}>← Back to events</Link><div><h2>{event.name}</h2><p>{event.date} · {event.location}</p></div><button className="btn btn-primary" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save layout"}</button></div>
        <p className="admin-save-status" role="status">{dirty ? "Unsaved changes" : "Layout is up to date"} · {stalls.length} spaces · {stalls.filter((s) => s.status === "available").length} available</p>
        <div className="admin-map-layout">
          <aside className="card admin-panel"><h3>Stall categories</h3>{Object.entries(categories).map(([key, label]) => <p className="admin-legend" key={key}><i className={`space-${key}`} />{label}</p>)}<hr /><h3>Availability</h3><p>Status is labeled on each space independently of its category.</p><p>Assigned sellers are preserved when saving.</p><button className="btn btn-outline" disabled={saving || stalls.length >= 200} onClick={() => { const item = { id: `new-${crypto.randomUUID()}`, stall_number: Math.max(0, ...stalls.map((s) => s.stall_number)) + 1, category: "food", status: "available", size: "3m x 3m", price: 0 }; setStalls([...stalls, item]); setSelectedId(item.id); setDirty(true); }}>+ Add space</button></aside>
          <section className="card admin-map"><div className="admin-map-marker">STAGE</div>{stalls.length === 0 ? <div className="empty-state"><h3>No spaces yet</h3><p>Add spaces to start this event’s layout.</p></div> : <div className="admin-space-grid" aria-label="Event spaces">{stalls.map((item) => <button key={item.id} className={`admin-space space-${item.category} ${selectedId === item.id ? "is-selected" : ""}`} aria-pressed={selectedId === item.id} aria-label={`Space ${item.stall_number}, ${categories[item.category] || item.category}, ${item.status}`} onClick={() => setSelectedId(item.id)}><strong>{item.stall_number}</strong><small>{item.status}</small></button>)}</div>}<div className="admin-map-marker">ENTRANCE</div></section>
          <aside className="card admin-panel"><h3>{selected ? `Space ${selected.stall_number}` : "Space details"}</h3>{selected ? <fieldset disabled={saving}><label>Category<select value={selected.category} onChange={(e) => update("category", e.target.value)}>{!categories[selected.category] && <option>{selected.category}</option>}{Object.entries(categories).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label>Size<input maxLength={40} value={selected.size} onChange={(e) => update("size", e.target.value)} /></label><label>Price (PHP)<input type="number" min="0" max="1000000" step="0.01" value={selected.price} onChange={(e) => update("price", e.target.value === "" ? "" : Number(e.target.value))} /></label><label>Status<select disabled={!!selected.seller_id} value={selected.status} onChange={(e) => update("status", e.target.value)}>{!["available", "reserved", "occupied"].includes(selected.status) && <option>{selected.status}</option>}<option value="available">Available</option><option value="reserved">Reserved</option><option value="occupied">Occupied</option></select></label>{selected.seller_id && <p>Assigned to {selected.sellerName || selected.name || "a seller"}. Availability is protected.</p>}<p>Changes apply when you save the layout.</p></fieldset> : <p>Select a space to edit its category, size, price and status.</p>}</aside>
        </div>
      </> : <>
        <section className="admin-event-summary" aria-label="Event overview">
          {[
            { label: "Total events", value: events.length, icon: CalendarDays, note: "Across your campus" },
            { label: "Upcoming", value: events.filter((e) => eventStatus(e) === "Upcoming").length, icon: CalendarCheck, note: "Next on the calendar" },
            { label: "Stall spaces", value: events.reduce((sum, e) => sum + Number(e.stall_count || 0), 0), icon: Store, note: "Across all event layouts" },
          ].map(({ label, value, icon: Icon, note }) => <div className="admin-summary-item" key={label}><span className="admin-summary-icon"><Icon size={21} /></span><div><span>{label}</span><strong>{value.toLocaleString()}</strong><small>{note}</small></div></div>)}
        </section>
        {creating && <form className="card admin-panel admin-event-form" onSubmit={create}><div className="admin-form-heading"><span className="admin-summary-icon"><CalendarDays size={22} /></span><div><h2>Create a campus event</h2><p>Start with the details. You can plan the stall layout next.</p></div></div><div className="admin-form-fields"><label>Event name<input name="name" placeholder="e.g. Student Enterprise Fair" required maxLength={120} autoFocus /></label><label>Date<input name="date" type="date" required /></label><label className="admin-field-wide">Location<input name="location" placeholder="Where will the event take place?" required maxLength={200} /></label><label className="admin-field-wide">Description <span className="admin-optional">Optional</span><textarea name="description" placeholder="Tell students what to expect..." rows={3} maxLength={2000} /></label></div><div className="admin-form-actions"><button type="button" className="btn btn-ghost" onClick={() => setCreating(false)} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create event"}<ArrowRight size={16} /></button></div></form>}
        <section className="admin-event-collection" aria-label="Campus events">
          <div className="admin-collection-heading"><div><h2>Event directory <span>{events.length}</span></h2><p>A little planning. A thriving campus marketplace.</p></div></div>
          <div className="admin-event-controls"><div className="admin-event-tabs" aria-label="Filter events">{["All events", "Upcoming", "Today", "Past"].map((item) => <button key={item} aria-pressed={filter === item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="admin-event-search"><Search size={17} /><input aria-label="Search events" placeholder="Search events or locations" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select className="admin-event-sort" aria-label="Sort events" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Latest first</option><option value="oldest">Earliest first</option><option value="name">Name A-Z</option></select></div>
          <div className="admin-event-grid">{visibleEvents.map((e) => <article className="admin-event-card" key={e.id}>
            <div className="admin-event-cover"><div className="admin-cover-fallback"><CalendarDays size={46} strokeWidth={1} /><span>CAMPUS MARKET EVENTS</span></div>{e.image_url && <img src={e.image_url} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}<span className={"admin-event-status status-" + eventStatus(e).toLowerCase()}><i />{eventStatus(e)}</span><div className="admin-date-tile"><span>{prettyDate(e.date, { month: "short" })}</span><strong>{prettyDate(e.date, { day: "numeric" })}</strong></div></div>
            <div className="admin-event-body"><p className="admin-event-date"><CalendarDays size={14} />{prettyDate(e.date)}</p><h3>{e.name}</h3><p className="admin-event-location"><MapPin size={15} />{e.location}</p><p className="admin-event-description">{e.description || "A new opportunity to connect your campus community."}</p><div className="admin-event-footer"><span><LayoutGrid size={16} /><strong>{e.stall_count || 0}</strong> {e.stall_count === 1 ? "space" : "spaces"}</span><Link to={"/admin/events/" + e.id + "/map"}>Manage layout <ArrowUpRight size={17} /><span className="sr-only"> for {e.name}</span></Link></div></div>
          </article>)}</div>
          {!visibleEvents.length && <div className="admin-events-empty"><CalendarDays size={36} /><h3>{events.length ? "No events found" : "Your next campus event starts here"}</h3><p>{events.length ? "Try a different search or filter to find your event." : "Create an event, then organize its spaces with the stall map."}</p>{events.length > 0 && <button className="btn btn-outline" onClick={() => { setQuery(""); setFilter("All events"); }}>Clear filters</button>}</div>}
          <p className="admin-directory-count" role="status">Showing {visibleEvents.length} of {events.length} events</p>
        </section>
      </>}
    </div></main></div>;
}
