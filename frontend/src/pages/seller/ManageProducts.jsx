import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import { Modal, EmptyState } from "../../components/common/UI.jsx";
import { productService, stallService } from "../../services/api.js";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiEye,
  FiEyeOff,
  FiPackage,
} from "react-icons/fi";

const CATEGORIES = [
  "food",
  "clothing",
  "electronics",
  "accessories",
  "student-made",
  "other",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "food",
  image_url: "",
  stall_id: "",
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    Promise.all([stallService.getMy(), productService.getAll({ limit: 100 })])
      .then(([s, p]) => {
        setStall(s.data);
        const myStallId = s.data?.id;
        setProducts(
          (p.data?.data || []).filter((prod) => prod.stall_id === myStallId),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    if (!stall) return toast.error("You need an approved stall first");
    if (stall.status !== "approved")
      return toast.error("Your stall must be approved first");
    setForm({ ...EMPTY_FORM, stall_id: stall.id });
    setEditTarget(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category: product.category,
      image_url: product.image_url || "",
      stall_id: product.stall_id,
    });
    setEditTarget(product);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.length < 2) errs.name = "Name is required";
    if (!form.price || Number(form.price) <= 0)
      errs.price = "Valid price required";
    if (form.stock === "" || Number(form.stock) < 0)
      errs.stock = "Stock required (0 or more)";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      setSaving(true);
      if (editTarget) {
        const { data } = await productService.update(editTarget.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editTarget.id ? data : p)),
        );
        toast.success("Product updated!");
      } else {
        const { data } = await productService.create(payload);
        setProducts((prev) => [data, ...prev]);
        toast.success("Product created!");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product?")) return;
    try {
      setDeletingId(id);
      await productService.remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product removed");
    } catch {
      toast.error("Failed to remove product");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const { data } = await productService.update(product.id, {
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: data.is_active } : p,
        ),
      );
      toast.success(
        data.is_active ? "Product is now visible" : "Product hidden",
      );
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const fmt = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Manage Products</h1>
              <p>Add, edit, and manage your product listings.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Toolbar */}
          <div className="toolbar">
            <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
              <FiSearch
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--gray-400)",
                }}
              />
              <input
                className="form-input"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
            <button className="btn btn-primary" onClick={openCreate}>
              <FiPlus /> Add Product
            </button>
          </div>

          {/* Products table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 64, borderRadius: 10 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description={
                stall?.status === "approved"
                  ? "Add your first product to start selling"
                  : "Get your stall approved first"
              }
              action={
                stall?.status === "approved" && (
                  <button className="btn btn-primary" onClick={openCreate}>
                    <FiPlus /> Add Product
                  </button>
                )
              }
            />
          ) : (
            <div className="card">
              <div className="products-table-wrap">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th style={{ width: 56 }}>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-thumb">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <p
                            className="font-medium"
                            style={{
                              fontSize: "0.875rem",
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {product.name}
                          </p>
                          {product.description && (
                            <p
                              className="text-xs text-muted"
                              style={{
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {product.description}
                            </p>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge cat-badge cat-${product.category}`}
                            style={{ textTransform: "capitalize" }}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td
                          className="font-semibold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {fmt(product.price)}
                        </td>
                        <td>
                          <span
                            className={
                              product.stock === 0 ? "text-danger" : "text-muted"
                            }
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: product.stock <= 5 ? 600 : 400,
                            }}
                          >
                            {product.stock}{" "}
                            {product.stock <= 5 && product.stock > 0
                              ? "⚠️"
                              : ""}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${product.is_active ? "badge-success" : "badge-gray"}`}
                          >
                            {product.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td>
                          <div className="action-row">
                            <button
                              className="btn btn-ghost btn-icon"
                              onClick={() => handleToggleActive(product)}
                              title={
                                product.is_active
                                  ? "Hide product"
                                  : "Show product"
                              }
                              style={{
                                color: product.is_active
                                  ? "var(--color-warning)"
                                  : "var(--color-success)",
                              }}
                            >
                              {product.is_active ? (
                                <FiEyeOff size={15} />
                              ) : (
                                <FiEye size={15} />
                              )}
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              onClick={() => openEdit(product)}
                              title="Edit"
                              style={{ color: "var(--color-info)" }}
                            >
                              <FiEdit2 size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete"
                              style={{ color: "var(--color-danger)" }}
                            >
                              {deletingId === product.id ? (
                                <span
                                  className="spinner"
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderWidth: 2,
                                    borderTopColor: "var(--color-danger)",
                                  }}
                                />
                              ) : (
                                <FiTrash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  padding: "0.875rem 1.25rem",
                  borderTop: "1px solid var(--gray-100)",
                }}
              >
                <p className="text-sm text-muted">
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Product" : "Add New Product"}
        maxWidth={560}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <div className="form-group">
            <label className="form-label">Product name *</label>
            <input
              className={`form-input ${errors.name ? "error" : ""}`}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Pork Sinigang Meal"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows={3}
              style={{ resize: "vertical" }}
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
              <label className="form-label">Price (₱) *</label>
              <input
                className={`form-input ${errors.price ? "error" : ""}`}
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
              />
              {errors.price && <p className="form-error">{errors.price}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Stock *</label>
              <input
                className={`form-input ${errors.stock ? "error" : ""}`}
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
              />
              {errors.stock && <p className="form-error">{errors.stock}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-input form-select"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <option
                  key={c}
                  value={c}
                  style={{ textTransform: "capitalize" }}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              className="form-input"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://..."
            />
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                style={{
                  marginTop: 8,
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid var(--gray-200)",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}
          >
            <button
              className="btn btn-primary"
              type="submit"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner" /> Saving...
                </>
              ) : editTarget ? (
                "Save Changes"
              ) : (
                "Add Product"
              )}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
        .products-table-wrap { overflow-x: auto; }
        .products-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .products-table th {
          text-align: left; padding: 0.75rem 1rem;
          color: var(--gray-500); font-weight: 600; font-size: 0.75rem;
          text-transform: uppercase; letter-spacing: 0.04em;
          border-bottom: 1px solid var(--gray-200); background: var(--gray-50);
        }
        .products-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
        .products-table tr:last-child td { border-bottom: none; }
        .products-table tr:hover td { background: var(--gray-50); }
        .product-thumb {
          width: 44px; height: 44px; border-radius: var(--radius-md);
          overflow: hidden; background: var(--gray-100);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem;
        }
        .product-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .action-row { display: flex; align-items: center; gap: 0.25rem; justify-content: flex-end; }

        /* .btn-icon was used throughout but never defined — buttons were
           inheriting .btn's full padding instead of being compact squares */
        .btn-icon { padding: 0.4rem; width: 30px; height: 30px; border-radius: var(--radius-md); }

        /* form-input.error was applied on validation failure but had no
           visual effect — border stayed neutral gray even when invalid */
        .form-input.error { border-color: var(--color-danger); }
        .form-input.error:focus { box-shadow: 0 0 0 3px var(--color-danger-light); }

        .cat-badge { text-transform: capitalize; font-size: 0.7rem; }
        .cat-food        { background: #FEF9C3; color: #92400E; }
        .cat-clothing    { background: #EDE9FE; color: #5B21B6; }
        .cat-electronics { background: #DBEAFE; color: #1E40AF; }
        .cat-accessories { background: #FCE7F3; color: #9D174D; }
        .cat-student-made{ background: var(--cm-secondary-light); color: #15803D; }
        .cat-other       { background: var(--gray-100); color: var(--gray-700); }
        .text-danger { color: var(--color-danger); }
      `}</style>
    </div>
  );
}
