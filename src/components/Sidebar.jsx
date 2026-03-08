import { ACCENT, ACCENT_HOVER } from "../theme.js";
import { NotificationBell } from "./NotificationSystem.jsx";

const NAV_ALL = [
    { id: "dashboard", label: "Dashboard" },
    { id: "inventory", label: "Inventory" },
    { id: "billing", label: "Sales & Billing" },
    { id: "patients", label: "Patients" },
    { id: "suppliers", label: "Suppliers" },
    { id: "reports", label: "Reports" },
];
const NAV_ADMIN = [
    { id: "users", label: "User Management" },
    { id: "settings", label: "Settings" },
    { id: "schema", label: "DB Schema" },
];

export default function Sidebar({ page, setPage, user, open, onToggle, darkMode, onDark, onLogout }) {
    const nav = [...NAV_ALL, ...(user?.role === "admin" ? NAV_ADMIN : [])];
    const w = open ? 260 : 72;
    
    const sidebarBg = darkMode ? "#0F172A" : "#1E293B";
    const hoverBg = darkMode ? "#1E293B" : "#334155";
    const borderColor = darkMode ? "#334155" : "#475569";

    return (
        <div style={{ 
            width: w, minWidth: w, 
            background: `linear-gradient(180deg, ${sidebarBg} 0%, ${darkMode ? '#0B1120' : '#0F172A'} 100%)`,
            display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", 
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
            height: "100vh",
            borderRight: `1px solid ${borderColor}`,
            boxShadow: "4px 0 24px rgba(0,0,0,0.15)"
        }}>
            {/* Logo Header */}
            <div style={{ 
                padding: open ? "24px 20px 20px" : "24px 12px 20px", 
                borderBottom: `1px solid ${borderColor}`, 
                display: "flex", alignItems: "center", justifyContent: open ? "flex-start" : "center",
                gap: open ? 14 : 0, overflow: "visible", flexWrap: "wrap"
            }}>
                <div style={{ 
                    width: 40, height: 40, 
                    background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                    borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${ACCENT}40`, flexShrink: 0,
                    overflow: "hidden"
                }}>
                    <img src="/logo.png" alt="MedOS" style={{ width: 28, height: 28, objectFit: "contain" }} />
                </div>
                {open && (
                    <div style={{ overflow: "hidden", flex: 1 }}>
                        <div style={{ 
                            fontFamily: "'Inter', sans-serif", fontWeight: 800, color: "#fff", 
                            fontSize: 17, lineHeight: 1.2, letterSpacing: "-0.02em" 
                        }}>MedOS</div>
                        <div style={{ 
                            fontSize: 10, color: "#64748B", fontWeight: 600, 
                            textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 
                        }}>Enterprise</div>
                    </div>
                )}
                {open && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <NotificationBell darkMode={darkMode} />
                        <button onClick={onToggle} style={{ 
                            background: hoverBg, border: `1px solid ${borderColor}`, 
                            color: "#94A3B8", cursor: "pointer", fontSize: 11, 
                            padding: "6px 8px", borderRadius: 8,
                            transition: "all 0.2s",
                            display: "flex", alignItems: "center"
                        }}>
                            ◀
                        </button>
                    </div>
                )}
            </div>
            
            {/* Expand button when collapsed - positioned below logo */}
            {!open && (
                <div style={{ 
                    padding: "12px", 
                    display: "flex", 
                    justifyContent: "center" 
                }}>
                    <button onClick={onToggle} style={{ 
                        background: hoverBg, border: `1px solid ${borderColor}`, 
                        color: "#94A3B8", cursor: "pointer", fontSize: 11, 
                        padding: "8px 12px", borderRadius: 8,
                        transition: "all 0.2s",
                        display: "flex", alignItems: "center"
                    }}>
                        ▶
                    </button>
                </div>
            )}

            {/* User Card */}
            {open && (
                <div style={{ 
                    margin: "16px 12px", padding: "16px", 
                    background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}08 100%)`,
                    borderRadius: 14, border: `1px solid ${ACCENT}30`,
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ 
                            width: 40, height: 40, borderRadius: 10, 
                            background: `linear-gradient(135deg, ${user?.role === "admin" ? ACCENT : '#7C3AED'} 0%, ${user?.role === "admin" ? ACCENT_HOVER : '#6D28D9'} 100%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: 16,
                            boxShadow: `0 4px 12px ${user?.role === "admin" ? ACCENT : '#7C3AED'}40`
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F5F9" }}>{user?.name}</div>
                            <div style={{ 
                                fontSize: 10, color: user?.role === "admin" ? ACCENT : "#A78BFA", 
                                fontWeight: 700, textTransform: "uppercase", marginTop: 2,
                                letterSpacing: "0.05em"
                            }}>
                                {user?.role === "admin" ? "Administrator" : "Staff Member"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section Label */}
            {open && (
                <div style={{ 
                    padding: "8px 20px", fontSize: 10, fontWeight: 700, 
                    color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" 
                }}>
                    Navigation
                </div>
            )}

            {/* Nav Items */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 8px" }}>
                {nav.map((n, idx) => {
                    const active = page === n.id;
                    const isAdminSection = ["users", "settings", "schema"].includes(n.id);
                    
                    return (
                        <div key={n.id}>
                            {isAdminSection && idx === nav.length - 3 && open && (
                                <div style={{ 
                                    padding: "16px 12px 8px", fontSize: 10, fontWeight: 700,
                                    color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em"
                                }}>
                                    Administration
                                </div>
                            )}
                            <div
                                onClick={() => setPage(n.id)}
                                title={!open ? n.label : ""}
                                style={{
                                    display: "flex", alignItems: "center", gap: 14,
                                    padding: open ? "12px 16px" : "12px 18px",
                                    margin: "3px 0", borderRadius: 12, cursor: "pointer",
                                    background: active 
                                        ? `linear-gradient(90deg, ${ACCENT}20 0%, ${ACCENT}08 100%)`
                                        : "transparent",
                                    borderLeft: active ? `3px solid ${ACCENT}` : "3px solid transparent",
                                    color: active ? "#F1F5F9" : "#94A3B8",
                                    whiteSpace: "nowrap", 
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    position: "relative",
                                }}
                                onMouseEnter={e => { 
                                    if (!active) {
                                        e.currentTarget.style.background = hoverBg;
                                        e.currentTarget.style.color = "#E2E8F0";
                                    }
                                }}
                                onMouseLeave={e => { 
                                    if (!active) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "#94A3B8";
                                    }
                                }}
                            >
                                {!open ? (
                                    <span style={{ 
                                        fontSize: 14, fontWeight: 700,
                                        width: 32, height: 32, borderRadius: 8,
                                        background: active ? `${ACCENT}20` : "transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}>{n.label.charAt(0)}</span>
                                ) : (
                                    <span style={{ 
                                        fontSize: 13.5, fontWeight: active ? 600 : 500,
                                        letterSpacing: "-0.01em"
                                    }}>{n.label}</span>
                                )}
                                {active && open && (
                                    <div style={{
                                        position: "absolute", right: 12, width: 6, height: 6,
                                        borderRadius: "50%", background: ACCENT,
                                        boxShadow: `0 0 8px ${ACCENT}`
                                    }} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Controls */}
            <div style={{ 
                padding: "16px 12px", borderTop: `1px solid ${borderColor}`, 
                display: "flex", flexDirection: open ? "row" : "column", gap: 8, 
                background: darkMode ? "#0B1120" : "#0F172A"
            }}>
                <button onClick={onDark} title="Toggle theme" style={{ 
                    flex: open ? 1 : "none", 
                    background: hoverBg, 
                    border: `1px solid ${borderColor}`, 
                    color: "#94A3B8", borderRadius: 10, 
                    padding: open ? "10px" : "10px", cursor: "pointer", 
                    fontSize: 14, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.2s",
                    fontFamily: "'Inter', sans-serif"
                }}>
                    {darkMode ? "Light" : "Dark"}
                    {open && <span style={{ fontSize: 12 }}>{darkMode ? "Light" : "Dark"}</span>}
                </button>
                <button onClick={onLogout} title="Logout" style={{ 
                    flex: open ? 1 : "none", 
                    background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)", 
                    border: "none",
                    color: "#FCA5A5", borderRadius: 10, 
                    padding: open ? "10px" : "10px", cursor: "pointer", 
                    fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(127, 29, 29, 0.3)",
                    transition: "all 0.2s",
                    fontFamily: "'Inter', sans-serif"
                }}>
                    {open ? "Sign Out" : "⏻"}
                </button>
            </div>
        </div>
    );
}
