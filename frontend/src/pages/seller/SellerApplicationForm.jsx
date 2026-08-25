import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import toast from "react-hot-toast";
import { FiSend } from "react-icons/fi";

const STALL_CATEGORIES = ["food", "merchandise", "mixed-use"];
const CATEGORY_LABELS = {
  food: "Food Stall",
  merchandise: "Merchandise",
  "mixed-use": "Mixed-Use",
};

const EMPTY_FORM = {
  eventId: "",
  stallName: "",
  businessName: "",
  productCategory: "food",
  productList: "",
  preferredStallSize: "",
  duration: "",
  contactInfo: "",
};

const SellerApplicationForm = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // TODO: consider moving into an eventService.js like your other services
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => setEvents(data || []))
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to submit");
      await response.json();
      toast.success("Application submitted successfully!");
      navigate("/seller/stall");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="page-header">
          <h1>Apply for a Stall</h1>
          <p>Submit your details to request a stall at an upcoming event.</p>
        </div>

        <div style={{ padding: "0 2rem 3rem" }}>
          <form className="card application-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Event *</label>
              <select
                className="form-input form-select"
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                required
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">Stall Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="stallName"
                  value={formData.stallName}
                  onChange={handleChange}
                  placeholder="e.g. Sweet Finds PH"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  className="form-input"
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Your registered business name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Category *</label>
              <select
                className="form-input form-select"
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                required
              >
                {STALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Product List *</label>
              <textarea
                className="form-input"
                name="productList"
                value={formData.productList}
                onChange={handleChange}
                placeholder="List the products you plan to sell, separated by commas"
                rows={3}
                style={{ resize: "vertical" }}
                required
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">
                  Preferred Stall Size (sqm) *
                </label>
                <input
                  className="form-input"
                  type="number"
                  name="preferredStallSize"
                  value={formData.preferredStallSize}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 9"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (days) *</label>
                <input
                  className="form-input"
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  placeholder="e.g. 3"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Info *</label>
              <input
                className="form-input"
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleChange}
                placeholder="Phone number or email"
                required
              />
            </div>

            <div style={{ paddingTop: "0.5rem" }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <FiSend size={15} /> Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      <style>{`
        .application-form {
          max-width: 640px; padding: 1.75rem;
          display: flex; flex-direction: column; gap: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default SellerApplicationForm;
