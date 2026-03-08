import { useState, useEffect } from "react";
import { makeStyles, getTheme, ACCENT, SUCCESS, BLUE, PURPLE } from "../theme.js";
import { useToast } from "../components/Toast.jsx";
import { API_URL } from "../config.js";

export default function Settings({ darkMode }) {
    const toast = useToast();
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [settings, setSettings] = useState({
        pharmacy_name: "MedOS",
        address: "MG Road, Thrissur, Kerala",
        phone: "0487-2220011",
        email: "info@medos.in",
        gstin: "32AABCP1234Z1ZV",
        license_no: "KL/TRS/PHY/2024/001",
        currency: "INR",
        low_stock_threshold: "15",
        expiry_alert_days: "60",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/settings`).then(r => r.ok ? r.json() : {}).then(d => {
            if (Object.keys(d).length) setSettings(p => ({ ...p, ...d }));
        }).catch(() => { });
    }, []);

    async function save() {
        setSaving(true);
        try {
            const r = await fetch(`${API_URL}/settings`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
            if (r.ok) toast("Settings saved!");
            else toast("Save failed", "error");
        } catch { toast("Network error", "error"); }
        setSaving(false);
    }

    const sections = [
        {
            title: "Pharmacy Information",
            fields: [
                ["Pharmacy Name", "pharmacy_name", "text"],
                ["Address", "address", "text"],
                ["Phone", "phone", "tel"],
                ["Email", "email", "email"],
                ["GSTIN", "gstin", "text"],
                ["License Number", "license_no", "text"],
            ]
        },
        {
            title: "System Preferences",
            fields: [
                ["Currency", "currency", "text"],
                ["Low Stock Threshold", "low_stock_threshold", "number"],
                ["Expiry Alert (Days)", "expiry_alert_days", "number"],
            ]
        }
    ];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                    <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                        Settings
                    </h2>
                    <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                        Configure pharmacy details and system preferences
                    </p>
                </div>
                <button className="btn-hover" style={{ ...cs.btn(), display: "flex", alignItems: "center", gap: 8, padding: "12px 24px" }} onClick={save} disabled={saving}>
                    {saving ? (
                        <>
                            <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></span>
                            Saving...
                        </>
                    ) : (
                        <>Save Settings</>
                    )}
                </button>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
                {sections.map((sec, si) => (
                    <div key={si} style={{ ...cs.card, position: "relative", overflow: "hidden" }}>
                        <div style={{ marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>{sec.title}</h3>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
                            {sec.fields.map(([label, key, type]) => (
                                <div key={key}>
                                    <label style={cs.label}>{label}</label>
                                    <input type={type} style={cs.input} value={settings[key] || ""} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                    <div style={{ ...cs.card, background: `linear-gradient(135deg, ${theme.card}, ${theme.bgSubtle})`, border: `1px solid ${theme.border}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>System Information</h3>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                        {[
                            ["Version", "1.0.0", ACCENT],
                            ["Database", "MongoDB Atlas", SUCCESS],
                            ["Backend", "Node.js + Express", BLUE],
                            ["Frontend", "React 18 + Vite", PURPLE]
                        ].map(([k, v, color], i) => (
                            <div key={i} style={{ 
                                padding: 16, background: theme.card, borderRadius: 12,
                                border: `1px solid ${theme.border}`
                            }}>
                                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{k}</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: color }}>{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
