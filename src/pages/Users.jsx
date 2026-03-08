import { useState } from "react";
import { makeStyles, getTheme, ACCENT, PURPLE, SUCCESS, DANGER } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { API_URL } from "../config.js";
const EMPTY_USER = { username: "", password: "", name: "", email: "", role: "staff" };

export default function Users({ darkMode, users, currentUserId, onRefresh }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showConfirmDel, setShowConfirmDel] = useState(null);
    const [form, setForm] = useState(EMPTY_USER);
    const [saving, setSaving] = useState(false);

    const adminCount = users.filter(u => u.role === "admin").length;
    const staffCount = users.filter(u => u.role === "staff").length;

    async function addUser() {
        if (!form.username || !form.password || !form.name) { toast("Username, password and name are required", "warning"); return; }
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (r.ok) { toast("User created!"); onRefresh(); setShowAdd(false); setForm(EMPTY_USER); }
            else { const d = await r.json(); toast(d.error || "Failed", "error"); }
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function updateUser() {
        if (!showEdit) return;
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/users/${showEdit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(showEdit) });
            if (r.ok) { toast("User updated!"); onRefresh(); setShowEdit(null); }
            else toast("Update failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    async function deleteUser(id) {
        try {
            const r = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
            if (r.ok) { toast("User deleted", "warning"); onRefresh(); }
            else { const d = await r.json(); toast(d.error || "Failed", "error"); }
        } catch { toast("Network error", "error"); }
        setShowConfirmDel(null);
    }

    const initials = (name) => name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                        User Management
                    </h2>
                    <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                        Manage staff and admin accounts • {users.length} total users
                    </p>
                </div>
                <button className="btn-hover" style={{ ...cs.btn(), display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setForm(EMPTY_USER); setShowAdd(true); }}>
                    <span>+</span> Add User
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <span style={{ padding: "8px 14px", background: `${ACCENT}15`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: ACCENT }}>
                    {adminCount} Admins
                </span>
                <span style={{ padding: "8px 14px", background: `${PURPLE}15`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: PURPLE }}>
                    {staffCount} Staff
                </span>
            </div>

            <div style={cs.tableCard}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: theme.tableHead }}>
                            <tr>{["", "Username", "Name", "Email", "Role", "Status", "Last Login", "Actions"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="table-row-hover">
                                    <td style={{ ...cs.td, width: 48 }}>
                                        <div style={{ 
                                            width: 36, height: 36, borderRadius: "50%", 
                                            background: u.role === "admin" ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT}dd)` : `linear-gradient(135deg, ${PURPLE}, ${PURPLE}dd)`, 
                                            color: "white", display: "flex", alignItems: "center", justifyContent: "center", 
                                            fontSize: 12, fontWeight: 700, boxShadow: `0 2px 6px ${u.role === "admin" ? ACCENT : PURPLE}40`
                                        }}>{initials(u.name)}</div>
                                    </td>
                                    <td style={{ ...cs.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{u.username}</td>
                                    <td style={{ ...cs.td, fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{u.email || "—"}</td>
                                    <td style={cs.td}><span style={cs.badge(u.role === "admin" ? ACCENT : PURPLE, u.role === "admin" ? `${ACCENT}15` : `${PURPLE}15`)}>{u.role.toUpperCase()}</span></td>
                                    <td style={cs.td}><span style={cs.badge(u.status === "Active" ? SUCCESS : "#64748B", u.status === "Active" ? `${SUCCESS}15` : "#F1F5F9")}>{u.status}</span></td>
                                    <td style={{ ...cs.td, fontSize: 11, color: theme.muted }}>{u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}</td>
                                    <td style={{ ...cs.td, whiteSpace: "nowrap" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <button className="btn-hover" onClick={() => setShowEdit({ ...u, password: "" })} style={{ ...cs.btn("secondary"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Edit</button>
                                            {u.id !== currentUserId && <button className="btn-hover" onClick={() => setShowConfirmDel(u)} style={{ ...cs.btn("danger"), padding: "5px 10px", fontSize: 11, borderRadius: 8 }}>Delete</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 60 }}>
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAdd && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(460)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Create New User</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Add a new staff member or admin</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gap: 14 }}>
                            {[["Username *", "username", "text"], ["Password *", "password", "password"], ["Full Name *", "name", "text"], ["Email", "email", "email"]].map(([lbl, key, type]) => (
                                <div key={key}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={cs.label}>Role</label>
                                <select style={cs.input} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                    <option value="staff">Staff</option><option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => { setShowAdd(false); setForm(EMPTY_USER); }}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={addUser} disabled={saving}>{saving ? "Creating..." : "Create User"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(460)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                            <div>
                                <h3 style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Edit User</h3>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Update user information</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gap: 14 }}>
                            {[["Full Name", "name", "text"], ["Email", "email", "email"], ["New Password", "password", "password"]].map(([lbl, key, type]) => (
                                <div key={key}>
                                    <label style={cs.label}>{lbl}</label>
                                    <input type={type} style={cs.input} value={showEdit[key] || ""} onChange={e => setShowEdit(p => ({ ...p, [key]: e.target.value }))} placeholder={key === "password" ? "Leave blank to keep current" : ""} />
                                </div>
                            ))}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={cs.label}>Role</label>
                                    <select style={cs.input} value={showEdit.role} onChange={e => setShowEdit(p => ({ ...p, role: e.target.value }))}>
                                        <option value="staff">Staff</option><option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={cs.label}>Status</label>
                                    <select style={cs.input} value={showEdit.status} onChange={e => setShowEdit(p => ({ ...p, status: e.target.value }))}>
                                        <option>Active</option><option>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                            <button className="btn-hover" style={cs.btn("secondary")} onClick={() => setShowEdit(null)}>Cancel</button>
                            <button className="btn-hover" style={cs.btn()} onClick={updateUser} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {showConfirmDel && (
                <div style={cs.modal}>
                    <div style={cs.modalBox(400)}>
                        <div style={{ textAlign: "center", marginBottom: 20 }}>
                            <h3 style={{ margin: "0 0 8px", fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: theme.text }}>Delete User?</h3>
                            <p style={{ color: theme.muted, fontSize: 14, margin: 0 }}>
                                Are you sure you want to delete <strong style={{ color: theme.text }}>{showConfirmDel.name}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button className="btn-hover" style={{ ...cs.btn("secondary"), minWidth: 100 }} onClick={() => setShowConfirmDel(null)}>Cancel</button>
                            <button className="btn-hover" style={{ ...cs.btn("danger"), minWidth: 100 }} onClick={() => deleteUser(showConfirmDel.id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
