import { useState } from "react";
import { makeStyles, getTheme, ACCENT, WARNING, SUCCESS } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { downloadPDF } from "../utils/pdfGenerator.js";
import { downloadCSV } from "../utils/csvExporter.js";
import { API_URL, API_BASE } from "../config.js";
const EMPTY = { name: "", age: "", gender: "Male", phone: "", email: "", address: "" };

export default function Patients({ darkMode, patients, isAdmin, onRefresh }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showHistory, setShowHistory] = useState(null);
    const [history, setHistory] = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search));

    function handleDownloadReceipt(s) {
        if (!showHistory) return;
        const billData = {
            id: s.invoice_id,
            date: new Date(s.created_at).toLocaleString(),
            patient: showHistory.name,
            payMethod: s.payment_method,
            items: (s.items || []).map(item => ({
                name: item.medicine_name,
                cartQty: item.quantity,
                price: item.unit_price,
            })),
            subtotal: Number(s.total_amount || 0),
            discountAmt: Number(s.discount || 0),
            taxAmt: Number(s.tax || 0),
            total: Number(s.net_amount || 0)
        };
        downloadPDF(billData);
    }

    async function openHistory(p) {
        setShowHistory(p); setHistLoading(true);
        try {
            const r = await fetch(`${API_URL}/patients/${p.id}/history`);
            if (r.ok) setHistory(await r.json());
        } catch { setHistory([]); }
        setHistLoading(false);
    }

    async function addPatient() {
        if (!form.name) { toast("Name is required", "warning"); return; }
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/patients`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (r.ok) { toast("Patient registered!"); onRefresh(); setShowAdd(false); setForm(EMPTY); }
            else { const d = await r.json(); toast(d.error || "Failed", "error"); }
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function updatePatient() {
        if (!showEdit) return;
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/patients/${showEdit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(showEdit) });
            if (r.ok) { toast("Patient updated!"); onRefresh(); setShowEdit(null); }
            else toast("Update failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function deletePatient(id) {
        if (!window.confirm("Delete this patient?")) return;
        try {
            const r = await fetch(`${API_URL}/patients/${id}`, { method: "DELETE" });
            if (r.ok) { toast("Patient deleted", "warning"); onRefresh(); }
            else toast("Delete failed", "error");
        } catch { toast("Network error", "error"); }
    }

    const PATIENT_FIELDS = [
        ["Full Name *", "name", "text"], ["Age", "age", "number"],
        ["Phone", "phone", "tel"], ["Email", "email", "email"], ["Address", "address", "text"],
    ];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                        Patient Records
                    </h2>
                    <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                        {patients.length} registered patients • Manage patient information
                    </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn-hover" style={{ ...cs.btn("secondary"), display: "flex", alignItems: "center", gap: 6 }} onClick={() => downloadCSV(filtered, "patients_export.csv")}>
                        Export CSV
                    </button>
                    <button className="btn-hover" style={{ ...cs.btn(), display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setForm(EMPTY); setShowAdd(true); }}>
                        <span>+</span> New Patient
                    </button>
                </div>
            </div>

            {/* Search and Stats */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
                    <input placeholder="Search by name or phone..." style={{ ...cs.input, paddingLeft: 14, width: "100%" }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ padding: "8px 14px", background: `${SUCCESS}15`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: SUCCESS }}>
                        {filtered.length} Showing
                    </span>
                </div>
            </div>

            <div style={cs.tableCard}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: theme.tableHead }}>
                            <tr>{["Patient ID", "Name", "Age", "Gender", "Phone", "Email", "Last Visit", "Purchases", "Actions"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id} className="table-row-hover">
                                    <td style={{ ...cs.td, fontSize: 11, color: theme.muted, fontFamily: "'JetBrains Mono', monospace" }}>{p.patient_id}</td>
                                    <td style={{ ...cs.td, fontWeight: 600 }}>{p.name}</td>
                                    <td style={cs.td}>{p.age || "—"}</td>
                                    <td style={cs.td}><span style={cs.badge(p.gender === "Female" ? "#EC4899" : p.gender === "Other" ? "#8B5CF6" : "#3B82F6", p.gender === "Female" ? "#FDF2F8" : p.gender === "Other" ? "#F5F3FF" : "#EFF6FF")}>{p.gender || "—"}</span></td>
                                    <td style={{ ...cs.td, fontSize: 12 }}>{p.phone || "—"}</td>
                                    <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{p.email || "—"}</td>
                                    <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{p.lastVisit || "—"}</td>
                                    <td style={{ ...cs.td, fontWeight: 700, color: ACCENT }}>{p.purchases || 0}</td>
                                    <td style={{ ...cs.td, whiteSpace: "nowrap" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn-hover" onClick={() => openHistory(p)} style={{ ...cs.btn("secondary"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>History</button>
                                            <button className="btn-hover" onClick={() => setShowEdit({ ...p })} style={{ ...cs.btn("secondary"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Edit</button>
                                            {isAdmin && <button className="btn-hover" onClick={() => deletePatient(p.id)} style={{ ...cs.btn("danger"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Del</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 60 }}>
                                        No patients found
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
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Register New Patient</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Add a new patient to the system</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {PATIENT_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={(key === "name" || key === "address") ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={cs.label}>Gender</label>
                                <select style={cs.input} value={form.gender || "Male"} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                                    {["Male", "Female", "Other"].map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={addPatient} disabled={saving}>{saving ? "Saving..." : "Save Patient"}</button>
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
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Edit Patient</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Update patient information</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
                            {PATIENT_FIELDS.map(([lbl, key, type]) => (
                                <div key={key} style={(key === "name" || key === "address") ? { gridColumn: "1/-1" } : {}}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={showEdit[key] || ""} onChange={e => setShowEdit(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={cs.label}>Gender</label>
                                <select style={cs.input} value={showEdit.gender || "Male"} onChange={e => setShowEdit(p => ({ ...p, gender: e.target.value }))}>
                                    {["Male", "Female", "Other"].map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowEdit(null)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={updatePatient} disabled={saving}>{saving ? "Saving..." : "Save Patient"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(680)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${theme.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Purchase History</h3>
                                    <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>{showHistory.name} — <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{showHistory.patient_id}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setShowHistory(null)} style={{ background: theme.bgSubtle, border: `1px solid ${theme.border}`, width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", color: theme.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>X</button>
                        </div>
                        {histLoading ? (
                            <div style={{ textAlign: "center", color: theme.muted, padding: 40 }}>
                                <div style={{ width: 24, height: 24, border: `3px solid ${theme.border}`, borderTopColor: ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}></div>
                                Loading...
                            </div>
                        ) : history.length === 0 ? (
                            <div style={{ textAlign: "center", color: theme.muted, padding: 40 }}>
                                No purchase history found
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead style={{ background: theme.tableHead }}>
                                        <tr>{["Invoice", "Date", "Items", "Total", "Payment", "Status", ""].map((h, idx) => <th key={idx} style={cs.th}>{h}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {history.map((s, i) => (
                                            <tr key={i} className="table-row-hover">
                                                <td style={{ ...cs.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{s.invoice_id}</td>
                                                <td style={{ ...cs.td, fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                                <td style={{ ...cs.td }}>{s.items?.length || 0}</td>
                                                <td style={{ ...cs.td, fontWeight: 700, color: ACCENT }}>₹{Number(s.net_amount).toFixed(2)}</td>
                                                <td style={cs.td}><span style={cs.badge("#3B82F6", "#EFF6FF")}>{s.payment_method}</span></td>
                                                <td style={cs.td}><span style={cs.badge(SUCCESS, `${SUCCESS}15`)}>{s.status}</span></td>
                                                <td style={{ ...cs.td }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn-hover" onClick={() => handleDownloadReceipt(s)} style={{ ...cs.btn("secondary"), padding: "4px 10px", fontSize: 11, borderRadius: 6 }}>PDF</button>
                                                        {s.prescription_url && (
                                                            <a href={`${API_BASE}${s.prescription_url}`} target="_blank" rel="noreferrer" style={{ ...cs.btn(), padding: "4px 10px", fontSize: 11, textDecoration: "none", borderRadius: 6 }}>Rx</a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
