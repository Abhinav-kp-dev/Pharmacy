import { useState } from "react";
import { makeStyles, getTheme, stockStatus, ACCENT, WARNING, DANGER, SUCCESS } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { downloadCSV } from "../utils/csvExporter.js";
import { API_URL } from "../config.js";

const EMPTY_MED = { name: "", category: "", manufacturer: "", qty: "", price: "", expiry: "", supplier: "" };

export default function Inventory({ darkMode, medicines, isAdmin, onRefresh }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);
    const dm = darkMode;

    const [medSearch, setMedSearch] = useState("");
    const [filterCat, setFilterCat] = useState("All");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showRestock, setShowRestock] = useState(null);
    const [showConfirmDel, setShowConfirmDel] = useState(null);
    const [form, setForm] = useState(EMPTY_MED);
    const [restockQty, setRestockQty] = useState("");
    const [saving, setSaving] = useState(false);

    const categories = ["All", ...new Set(medicines.map(m => m.category).filter(Boolean))];
    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(medSearch.toLowerCase()) &&
        (filterCat === "All" || m.category === filterCat)
    );

    async function addMedicine() {
        if (!form.name || !form.price) { toast("Name and price are required", "warning"); return; }
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/medicines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (r.ok) { toast("Medicine added successfully!"); onRefresh(); setShowAdd(false); setForm(EMPTY_MED); }
            else { const d = await r.json(); toast(d.error || "Failed to add", "error"); }
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function updateMedicine() {
        if (!showEdit) return;
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/medicines/${showEdit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: showEdit.name, qty: showEdit.qty, price: showEdit.price, expiry: showEdit.expiry, category: showEdit.category, manufacturer: showEdit.manufacturer }) });
            if (r.ok) { toast("Medicine updated!"); onRefresh(); setShowEdit(null); }
            else toast("Update failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function deleteMedicine(id) {
        try {
            const r = await fetch(`${API_URL}/medicines/${id}`, { method: "DELETE" });
            if (r.ok) { toast("Medicine deleted", "warning"); onRefresh(); }
            else toast("Delete failed", "error");
        } catch { toast("Network error", "error"); }
        setShowConfirmDel(null);
    }

    async function restock() {
        if (!showRestock || !restockQty) { toast("Enter quantity", "warning"); return; }
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/medicines/${showRestock.id}/stock`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: parseInt(restockQty), type: "IN", notes: "Manual restock" }) });
            if (r.ok) { toast(`Restocked +${restockQty} units`); onRefresh(); setShowRestock(null); setRestockQty(""); }
            else toast("Restock failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    const MED_FIELDS = [
        ["Medicine Name *", "name", "text"], ["Category", "category", "text"],
        ["Manufacturer", "manufacturer", "text"], ["Quantity", "qty", "number"],
        ["Price (₹) *", "price", "number"], ["Expiry Date", "expiry", "date"], ["Supplier", "supplier", "text"],
    ];

    return (
        <div className="fade-in">
            <style>{`
                .enterprise-table tr { transition: all 0.15s ease; }
                .enterprise-table tbody tr:hover { background: ${theme.tableRowHover} !important; }
                .enterprise-table tbody tr:hover td { background: transparent !important; }
            `}</style>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                        Medicine Inventory
                    </h2>
                    <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                        {filtered.length} of {medicines.length} medicines • Manage your pharmacy stock
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-hover" style={cs.btn("secondary")} onClick={() => downloadCSV(filtered, "inventory_export.csv")}>
                        Export
                    </button>
                    {isAdmin && (
                        <button className="btn-hover" style={cs.btn()} onClick={() => { setForm(EMPTY_MED); setShowAdd(true); }}>
                            + Add Medicine
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{ 
                display: "flex", gap: 16, marginBottom: 20, padding: "16px 20px",
                background: theme.card, borderRadius: 14, border: `1px solid ${theme.border}`,
                boxShadow: theme.shadow
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: SUCCESS }} />
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
                        In Stock: <span style={{ color: SUCCESS }}>{medicines.filter(m => m.qty >= 15).length}</span>
                    </span>
                </div>
                <div style={{ width: 1, background: theme.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: WARNING }} />
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
                        Low Stock: <span style={{ color: WARNING }}>{medicines.filter(m => m.qty > 0 && m.qty < 15).length}</span>
                    </span>
                </div>
                <div style={{ width: 1, background: theme.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: DANGER }} />
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
                        Out of Stock: <span style={{ color: DANGER }}>{medicines.filter(m => m.qty === 0).length}</span>
                    </span>
                </div>
                <div style={{ width: 1, background: theme.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>
                        Expiring Soon: <span style={{ color: WARNING }}>{medicines.filter(m => { const d = Math.ceil((new Date(m.expiry) - new Date()) / 864e5); return d >= 0 && d < 60; }).length}</span>
                    </span>
                </div>
            </div>

            {/* Search + filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: "0 0 280px" }}>
                    <input 
                        placeholder="Search medicines..." 
                        style={{ ...cs.input, paddingLeft: 42 }} 
                        value={medSearch} 
                        onChange={e => setMedSearch(e.target.value)} 
                    />
                </div>
                <select style={{ ...cs.input, width: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                    {categories.map(c => <option key={c}>{c === "All" ? "All Categories" : c}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={cs.tableCard}>
                <div style={{ overflowX: "auto" }}>
                    <table className="enterprise-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: theme.tableHead }}>
                            <tr>{["Medicine ID", "Medicine Name", "Category", "Manufacturer", "Stock", "Price", "Expiry", "Status", "Actions"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => {
                                const st = stockStatus(m.qty, m.expiry);
                                return (
                                    <tr key={m.id} className="table-row-hover">
                                        <td style={{ ...cs.td, color: theme.muted, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{m.medicine_id}</td>
                                        <td style={{ ...cs.td, fontWeight: 600 }}>{m.name}</td>
                                        <td style={cs.td}><span style={cs.badge("#6366F1", dm ? "#1e1b4b" : "#EEF2FF")}>{m.category || "—"}</span></td>
                                        <td style={{ ...cs.td, color: theme.muted, fontSize: 13 }}>{m.manufacturer || "—"}</td>
                                        <td style={{ ...cs.td, fontWeight: 700, color: m.qty < 15 ? (m.qty === 0 ? DANGER : WARNING) : theme.text }}>{m.qty}</td>
                                        <td style={{ ...cs.td, fontWeight: 600, color: ACCENT }}>₹{Number(m.price).toFixed(2)}</td>
                                        <td style={{ ...cs.td, color: theme.muted, fontSize: 13 }}>{m.expiry || "—"}</td>
                                        <td style={cs.td}><span style={cs.badge(st.color, dm ? `${st.color}20` : st.bg)}>{st.label}</span></td>
                                        <td style={{ ...cs.td, whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="btn-hover" onClick={() => setShowRestock(m)} style={{ ...cs.btn(), padding: "5px 10px", fontSize: 11, borderRadius: 8 }} title="Restock">+Stock</button>
                                                {isAdmin && <>
                                                    <button className="btn-hover" onClick={() => setShowEdit({ ...m })} style={{ ...cs.btn("secondary"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Edit</button>
                                                    <button className="btn-hover" onClick={() => setShowConfirmDel(m)} style={{ ...cs.btn("danger"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Del</button>
                                                </>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 60 }}>
                                        No medicines found
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
                    <div style={cs.modalBox(540)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Add New Medicine</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Add a new medicine to the inventory</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {MED_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={key === "name" ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={addMedicine} disabled={saving}>{saving ? "Saving..." : "Save Medicine"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {showEdit && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(540)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Edit Medicine</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Update medicine information</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {MED_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={key === "name" ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={showEdit[key] || ""} onChange={e => setShowEdit(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowEdit(null)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={updateMedicine} disabled={saving}>{saving ? "Saving..." : "Save Medicine"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock modal */}
            {showRestock && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(420)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Restock Medicine</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>{showRestock.name}</p>
                            </div>
                        </div>
                        <div style={{ 
                            padding: 16, background: theme.bgSubtle, borderRadius: 12, marginBottom: 20,
                            display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}>
                            <span style={{ fontSize: 13, color: theme.muted }}>Current Stock</span>
                            <span style={{ fontSize: 20, fontWeight: 700, color: showRestock.qty < 15 ? (showRestock.qty === 0 ? DANGER : WARNING) : SUCCESS }}>{showRestock.qty}</span>
                        </div>
                        <label style={cs.label}>Quantity to Add</label>
                        <input type="number" min="1" style={{ ...cs.input, fontSize: 16 }} value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Enter quantity" />
                        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => { setShowRestock(null); setRestockQty(""); }}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={restock} disabled={saving}>{saving ? "..." : "Restock"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {showConfirmDel && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(400)}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <h3 style={{ margin: "0 0 8px", fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Delete Medicine?</h3>
                            <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>
                                Are you sure you want to delete <strong style={{ color: theme.text }}>{showConfirmDel.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button className="btn-hover" style={{ ...cs.btn("secondary"), minWidth: 100 }} onClick={() => setShowConfirmDel(null)}>Cancel</button>
                            <button className="btn-hover" style={{ ...cs.btn("danger"), minWidth: 100 }} onClick={() => deleteMedicine(showConfirmDel.id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
