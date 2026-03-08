import { useState } from "react";
import { makeStyles, getTheme, ACCENT, SUCCESS, WARNING } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { API_URL } from "../config.js";
const EMPTY = { name: "", contact: "", phone: "", email: "", address: "", status: "Active" };

export default function Suppliers({ darkMode, suppliers, isAdmin, onRefresh }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showConfirmDel, setShowConfirmDel] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const activeCount = suppliers.filter(s => s.status === "Active").length;

    async function addSupplier() {
        if (!form.name) { toast("Supplier name is required", "warning"); return; }
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/suppliers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (r.ok) { toast("Supplier added!"); onRefresh(); setShowAdd(false); setForm(EMPTY); }
            else { const d = await r.json(); toast(d.error || "Failed", "error"); }
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function updateSupplier() {
        if (!showEdit) return;
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/suppliers/${showEdit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: showEdit.name, contact: showEdit.contact, phone: showEdit.phone, email: showEdit.email, status: showEdit.status }) });
            if (r.ok) { toast("Supplier updated!"); onRefresh(); setShowEdit(null); }
            else toast("Update failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function deleteSupplier(id) {
        try {
            const r = await fetch(`${API_URL}/suppliers/${id}`, { method: "DELETE" });
            if (r.ok) { toast("Supplier removed", "warning"); onRefresh(); }
            else toast("Delete failed", "error");
        } catch { toast("Network error", "error"); }
        setShowConfirmDel(null);
    }

    const SUPPLIER_FIELDS = [["Supplier Name *", "name", "text"], ["Contact Person", "contact", "text"], ["Phone", "phone", "tel"], ["Email", "email", "email"], ["Address", "address", "text"]];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                        Suppliers
                    </h2>
                    <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                        {suppliers.length} registered suppliers • {activeCount} active
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn-hover" style={{ ...cs.btn(), display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setForm(EMPTY); setShowAdd(true); }}>
                        <span>+</span> Add Supplier
                    </button>
                )}
            </div>

            {/* Search and Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                    <input placeholder="Search suppliers..." style={{ ...cs.input, paddingLeft: 14, width: "100%" }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ padding: "8px 14px", background: `${SUCCESS}15`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: SUCCESS }}>
                        {activeCount} Active
                    </span>
                    <span style={{ padding: "8px 14px", background: `${WARNING}15`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: WARNING }}>
                        {suppliers.length - activeCount} Inactive
                    </span>
                </div>
            </div>

            <div style={cs.tableCard}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: theme.tableHead }}>
                            <tr>{["Supplier ID", "Name", "Contact", "Phone", "Email", "Status", "Medicines", "Actions"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="table-row-hover">
                                    <td style={{ ...cs.td, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: theme.muted }}>{s.supplier_id}</td>
                                    <td style={{ ...cs.td, fontWeight: 600 }}>{s.name}</td>
                                    <td style={{ ...cs.td, fontSize: 12 }}>{s.contact || "—"}</td>
                                    <td style={{ ...cs.td, fontSize: 12 }}>{s.phone || "—"}</td>
                                    <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{s.email || "—"}</td>
                                    <td style={cs.td}><span style={cs.badge(s.status === "Active" ? SUCCESS : "#64748B", s.status === "Active" ? `${SUCCESS}15` : "#F1F5F9")}>{s.status}</span></td>
                                    <td style={{ ...cs.td, fontWeight: 700, color: ACCENT }}>{s.medicines || 0}</td>
                                    <td style={{ ...cs.td, whiteSpace: "nowrap" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {isAdmin && <>
                                                <button className="btn-hover" onClick={() => setShowEdit({ ...s })} style={{ ...cs.btn("secondary"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Edit</button>
                                                <button className="btn-hover" onClick={() => setShowConfirmDel(s)} style={{ ...cs.btn("danger"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Delete</button>
                                            </>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 60 }}>
                                        No suppliers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add modal */}
            {showAdd && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(520)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Add New Supplier</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Register a new supplier to the system</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {SUPPLIER_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={(key === "name" || key === "address") ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={cs.label}>Status</label>
                                <select style={cs.input} value={form.status || "Active"} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                                    <option>Active</option><option>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={addSupplier} disabled={saving}>{saving ? "Saving..." : "Save Supplier"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {showEdit && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(520)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Edit Supplier</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Update supplier information</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {SUPPLIER_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={(key === "name" || key === "address") ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={showEdit[key] || ""} onChange={e => setShowEdit(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={cs.label}>Status</label>
                                <select style={cs.input} value={showEdit.status || "Active"} onChange={e => setShowEdit(p => ({ ...p, status: e.target.value }))}>
                                    <option>Active</option><option>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowEdit(null)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={updateSupplier} disabled={saving}>{saving ? "Saving..." : "Save Supplier"}</button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDel && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(400)}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <h3 style={{ margin: "0 0 8px", fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Delete Supplier?</h3>
                            <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>
                                Are you sure you want to delete <strong style={{ color: theme.text }}>{showConfirmDel.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button className="btn-hover" style={{ ...cs.btn("secondary"), minWidth: 100 }} onClick={() => setShowConfirmDel(null)}>Cancel</button>
                            <button className="btn-hover" style={{ ...cs.btn("danger"), minWidth: 100 }} onClick={() => deleteSupplier(showConfirmDel.id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
