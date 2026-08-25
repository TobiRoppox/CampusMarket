import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import { SkeletonGrid } from "../../components/common/UI.jsx";

const BuyerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // TODO: consider moving this into an eventService.js like your other services
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => setEvents(data || []))
      .catch((error) => console.error("Error fetching events:", error))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.date) > now);
  const ongoingEvents = events.filter((event) => new Date(event.date) <= now);

  const EventCard = ({ event }) => (
    <Link to={`/events/${event.id}/stalls`} className="ev-card">
      <div className="ev-card-thumb">
        <Calendar size={22} />
      </div>
      <div className="ev-card-body">
        <h3>{event.name}</h3>
        <p className="ev-card-date">{new Date(event.date).toLocaleString()}</p>
        {event.location && (
          <p className="ev-card-loc">
            <MapPin size={13} /> {event.location}
          </p>
        )}
        {event.description && (
          <p className="ev-card-desc">{event.description}</p>
        )}
        <span className="ev-card-link">View Stalls →</span>
      </div>
    </Link>
  );

  return (
    <div>
      <Navbar />
      <div className="buyer-events-page">
        <h1>Events</h1>
        <p className="buyer-events-sub">
          Campus fairs, pop-ups, and stalls happening around CSUCC
        </p>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : (
          <>
            <section className="ev-section">
              <h2>Upcoming Events</h2>
              {upcomingEvents.length === 0 ? (
                <div className="ev-empty">No upcoming events right now.</div>
              ) : (
                <div className="ev-grid">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            <section className="ev-section">
              <h2>Ongoing Events</h2>
              {ongoingEvents.length === 0 ? (
                <div className="ev-empty">No ongoing events at the moment.</div>
              ) : (
                <div className="ev-grid">
                  {ongoingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style>{`
        .buyer-events-page { max-width: 1400px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }
        .buyer-events-page h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); }
        .buyer-events-sub { color: var(--gray-500); font-size: 0.9rem; margin-bottom: 2rem; }

        .ev-section { margin-bottom: 2.25rem; }
        .ev-section h2 { font-size: 1.1rem; font-weight: 700; color: var(--gray-900); margin-bottom: 1rem; }

        .ev-empty {
          padding: 2rem; text-align: center; color: var(--gray-500); font-size: 0.9rem;
          border: 1px dashed var(--gray-200); border-radius: var(--radius-xl);
        }

        .ev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .ev-card {
          display: block; border: 1px solid var(--gray-200); border-radius: var(--radius-xl);
          overflow: hidden; text-decoration: none; color: inherit; background: #fff;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .ev-card:hover { box-shadow: var(--shadow-xl, 0 10px 24px rgba(0,0,0,0.08)); transform: translateY(-2px); }
        .ev-card-thumb {
          height: 100px; background: var(--color-secondary, var(--green-900, #0b3d1e)); color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .ev-card-body { padding: 1rem; }
        .ev-card-body h3 { font-size: 0.95rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.3rem; }
        .ev-card-date { font-size: 0.8rem; color: var(--gray-500); margin-bottom: 0.15rem; }
        .ev-card-loc { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: var(--gray-500); margin-bottom: 0.5rem; }
        .ev-card-desc {
          font-size: 0.82rem; color: var(--gray-600); margin-bottom: 0.6rem;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ev-card-link { font-size: 0.82rem; font-weight: 700; color: var(--color-primary); }

        @media (max-width: 1024px) { .ev-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .ev-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default BuyerEvents;
