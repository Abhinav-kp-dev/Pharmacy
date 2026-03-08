import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ACCENT, DANGER, WARNING, PURPLE, BLUE } from "../theme.js";
import { API_URL } from "../config.js";

/* ─────────── severity palette ─────────── */
const SEV = {
    critical: { color: "#EF4444", bg: "#FEF2F2", glow: "0 0 16px #EF444460", icon: "🔴" },
    warning: { color: "#F59E0B", bg: "#FFFBEB", glow: "0 0 12px #F59E0B40", icon: "🟠" },
    info: { color: "#0D9488", bg: "#F0FDFA", glow: "none", icon: "🟢" },
    activity: { color: "#8B5CF6", bg: "#F5F3FF", glow: "none", icon: "🟣" },
};

let _notifId = 0;

/* ─────────── context ─────────── */
const NotifCtx = createContext(null);
export const useNotifications = () => useContext(NotifCtx);

/* ───────────────────────────────────────────
    PROVIDER — wraps the whole app
   ─────────────────────────────────────────── */
export function NotificationProvider({ children, darkMode }) {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState("all");
    const [bellWiggle, setBellWiggle] = useState(false);
    const intervalRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    /* push a new notification */
    const push = useCallback((msg, category = "activity", severity = "info") => {
        const id = ++_notifId;
        const n = { id, msg, category, severity, read: false, time: new Date() };
        setNotifications(prev => [n, ...prev].slice(0, 80));
        setBellWiggle(true);
        setTimeout(() => setBellWiggle(false), 800);

        /* toast only for critical / stock out */
        if (severity === "critical") {
            const tid = id;
            setToasts(prev => [...prev, { ...n, tid }]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.tid !== tid)), 6000);
        }
    }, []);

    const markRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => { setNotifications([]); }, []);

    /* ── Real Database Polling ── */
    const notifiedRef = useRef(new Set()); // prevent duplicate alerts

    const fetchAlerts = useCallback(async () => {
        try {
            const [medsRes, actRes] = await Promise.all([
                fetch(`${API_URL}/medicines`).then(r => r.json()),
                fetch(`${API_URL}/dashboard/recent-activity`).then(r => r.json()),
            ]);

            const newAlerts = [];

            // Check stock & expiry from medicines
            for (const m of medsRes) {
                // Stock out (CRITICAL)
                if (m.qty === 0) {
                    const id = `out-${m._id}`;
                    if (!notifiedRef.current.has(id)) {
                        newAlerts.push({ msg: `${m.name} is OUT OF STOCK!`, cat: "stock", sev: "critical", id });
                    }
                }
                // Low stock (WARNING)
                else if (m.qty < (m.reorder_level || 15)) {
                    const id = `low-${m._id}-${m.qty}`; // re-alert if qty drops further
                    if (!notifiedRef.current.has(id)) {
                        newAlerts.push({ msg: `${m.name} stock dropped to ${m.qty} units`, cat: "stock", sev: "warning", id });
                    }
                }

                // Check expiry
                const days = Math.ceil((new Date(m.expiry) - new Date()) / 864e5);
                if (days < 0) {
                    const id = `exp-${m._id}`;
                    if (!notifiedRef.current.has(id)) {
                        newAlerts.push({ msg: `${m.name} EXPIRED! Quarantine immediately.`, cat: "expiry", sev: "critical", id });
                    }
                } else if (days <= 30) {
                    const id = `exps-${m._id}`;
                    if (!notifiedRef.current.has(id)) {
                        newAlerts.push({ msg: `${m.name} expires in ${days} days`, cat: "expiry", sev: "warning", id });
                    }
                }
            }

            // Check recent activity (only new ones we haven't seen)
            for (const a of actRes) {
                const id = `act-${a.id}-${a.time}`; // use time and id
                if (!notifiedRef.current.has(id)) {
                    // determine severity based on type
                    const sev = a.type === "alert" ? "critical" : a.type === "sale" ? "info" : "activity";
                    newAlerts.push({ msg: a.text, cat: "activity", sev, id });
                }
            }

            // Push generated alerts
            if (newAlerts.length > 0) {
                newAlerts.forEach(a => {
                    notifiedRef.current.add(a.id);
                    push(a.msg, a.cat, a.sev);
                });
            }

        } catch (e) {
            console.error("Failed to poll alerts", e);
        }
    }, [push]);

    useEffect(() => {
        // Initial fetch
        fetchAlerts();

        // Poll every 15 seconds
        intervalRef.current = setInterval(fetchAlerts, 15000);
        return () => clearInterval(intervalRef.current);
    }, [fetchAlerts]);

    const ctx = {
        notifications, unreadCount, push, markRead, markAllRead, clearAll,
        drawerOpen, setDrawerOpen, drawerTab, setDrawerTab, bellWiggle
    };

    const dm = darkMode;
    const card = dm ? "#111827" : "#FFFFFF";
    const border = dm ? "#1F2937" : "#E2E8F0";
    const text = dm ? "#F1F5F9" : "#0F172A";
    const muted = dm ? "#94A3B8" : "#64748B";

    return (
        <NotifCtx.Provider value={ctx}>
            {children}



            {/* ═══════ NOTIFICATION DRAWER ═══════ */}
            {drawerOpen && (
                <>
                    <div onClick={() => setDrawerOpen(false)}
                        style={{
                            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(2px)", zIndex: 900
                        }} />
                    <div style={{
                        position: "fixed", top: 0, right: 0, bottom: 0, width: 400, maxWidth: "92vw",
                        background: dm ? "rgba(17,24,39,0.92)" : "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(20px) saturate(1.6)",
                        borderLeft: `1px solid ${border}`,
                        boxShadow: "0 0 60px rgba(0,0,0,0.3)",
                        zIndex: 901, display: "flex", flexDirection: "column",
                        animation: "slideInDrawer 0.3s ease",
                        fontFamily: "'DM Sans', sans-serif"
                    }}>
                        {/* header */}
                        <div style={{
                            padding: "18px 20px", borderBottom: `1px solid ${border}`,
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <h3 style={{
                                    margin: 0, fontFamily: "'Sora', sans-serif", fontSize: 16,
                                    fontWeight: 700, color: text
                                }}>
                                    🔔 Notifications
                                </h3>
                                <span style={{ fontSize: 11, color: muted }}>{unreadCount} unread</span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={markAllRead} title="Mark all read"
                                    style={{
                                        background: "none", border: `1px solid ${border}`, borderRadius: 6,
                                        color: ACCENT, fontSize: 11, padding: "4px 10px", cursor: "pointer",
                                        fontWeight: 600
                                    }}>All</button>
                                <button onClick={clearAll} title="Clear all"
                                    style={{
                                        background: "none", border: `1px solid ${border}`, borderRadius: 6,
                                        color: muted, fontSize: 11, padding: "4px 10px", cursor: "pointer"
                                    }}>Clear</button>
                                <button onClick={() => setDrawerOpen(false)}
                                    style={{
                                        background: "none", border: "none", color: muted,
                                        fontSize: 20, cursor: "pointer", padding: 0
                                    }}>X</button>
                            </div>
                        </div>

                        {/* tabs */}
                        <div style={{ display: "flex", borderBottom: `1px solid ${border}`, padding: "0 16px" }}>
                            {[
                                { id: "all", label: "All" },
                                { id: "stock", label: "Stock" },
                                { id: "expiry", label: "Expiry" },
                                { id: "activity", label: "Activity" },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setDrawerTab(tab.id)}
                                    style={{
                                        padding: "10px 14px", fontSize: 12, fontWeight: drawerTab === tab.id ? 700 : 500,
                                        color: drawerTab === tab.id ? ACCENT : muted,
                                        background: "none", border: "none", cursor: "pointer",
                                        borderBottom: drawerTab === tab.id ? `2px solid ${ACCENT}` : "2px solid transparent",
                                        transition: "all 0.18s"
                                    }}>{tab.label}</button>
                            ))}
                        </div>

                        {/* list */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                            {notifications
                                .filter(n => drawerTab === "all" || n.category === drawerTab)
                                .map(n => {
                                    const s = SEV[n.severity] || SEV.info;
                                    return (
                                        <div key={n.id} onClick={() => markRead(n.id)}
                                            style={{
                                                padding: "12px 20px", cursor: "pointer",
                                                display: "flex", gap: 12, alignItems: "flex-start",
                                                background: n.read ? "transparent" : (dm ? "#0D948808" : "#0D948808"),
                                                borderLeft: n.read ? "3px solid transparent" : `3px solid ${s.color}`,
                                                borderBottom: `1px solid ${border}08`,
                                                transition: "background 0.15s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = dm ? "#1F293740" : "#F1F5F920"}
                                            onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : (dm ? "#0D948808" : "#0D948808")}
                                        >
                                            <span style={{ fontSize: 14, marginTop: 2, flexShrink: 0 }}>{s.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 12, color: text, lineHeight: 1.4,
                                                    fontWeight: n.read ? 400 : 600
                                                }}>{n.msg}</div>
                                                <div style={{ fontSize: 10, color: muted, marginTop: 4, display: "flex", gap: 8 }}>
                                                    <span>{timeAgo(n.time)}</span>
                                                    <span style={{
                                                        color: s.color, fontWeight: 600, textTransform: "uppercase",
                                                        fontSize: 9
                                                    }}>{n.category}</span>
                                                </div>
                                            </div>
                                            {!n.read && (
                                                <div style={{
                                                    width: 7, height: 7, borderRadius: "50%",
                                                    background: s.color, flexShrink: 0, marginTop: 6
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            {notifications.filter(n => drawerTab === "all" || n.category === drawerTab).length === 0 && (
                                <div style={{ textAlign: "center", color: muted, padding: "40px 20px", fontSize: 13 }}>
                                    No notifications
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ═══════ GLOBAL ANIMATIONS ═══════ */}
            <style>{`
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 16px #EF444460, 0 12px 36px rgba(0,0,0,0.3); }
          50%      { box-shadow: 0 0 28px #EF444480, 0 12px 36px rgba(0,0,0,0.3); }
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes slideInDrawer {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes bellWiggle {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(14deg); }
          30%  { transform: rotate(-12deg); }
          45%  { transform: rotate(10deg); }
          60%  { transform: rotate(-6deg); }
          75%  { transform: rotate(3deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
        </NotifCtx.Provider>
    );
}

/* ─────────── BELL BUTTON ─────────── */
export function NotificationBell({ darkMode }) {
    const { unreadCount, setDrawerOpen, bellWiggle } = useNotifications();
    return (
        <button
            onClick={() => setDrawerOpen(true)}
            title={`${unreadCount} unread notifications`}
            style={{
                position: "relative", background: "none", border: "none",
                cursor: "pointer", padding: 4, fontSize: 22,
                animation: bellWiggle ? "bellWiggle 0.6s ease" : "none",
                filter: bellWiggle ? "drop-shadow(0 0 6px #F59E0B80)" : "none",
                transition: "filter 0.3s"
            }}
        >
            🔔
            {unreadCount > 0 && (
                <span style={{
                    position: "absolute", top: -2, right: -4,
                    background: DANGER, color: "white",
                    fontSize: 9, fontWeight: 800,
                    minWidth: 16, height: 16, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px",
                    boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
                    animation: unreadCount > 5 ? "pulseGlow 1.4s ease-in-out infinite" : "none"
                }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </button>
    );
}

/* ─────────── helper ─────────── */
function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 10) return "Just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
}
