import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ACCENT, WARNING, DANGER, PURPLE, SUCCESS, makeStyles, getTheme } from "../theme.js";
import ActivityTicker from "../components/ActivityTicker.jsx";

function AnimatedNumber({ target, prefix = "", suffix = "" }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let v = 0;
        const step = Math.max(1, target / 50);
        const t = setInterval(() => {
            v += step;
            if (v >= target) { setVal(target); clearInterval(t); }
            else setVal(Math.floor(v));
        }, 20);
        return () => clearInterval(t);
    }, [target]);
    return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function Dashboard({ darkMode, medicines, salesData, categoryData, recentActivity, dashboardStats }) {
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);
    const dm = darkMode;

    const lowStockCount = medicines.filter(m => m.qty > 0 && m.qty < 15).length;
    const expiredCount = medicines.filter(m => new Date(m.expiry) < new Date()).length;
    const expiringMeds = medicines.filter(m => {
        const d = Math.ceil((new Date(m.expiry) - new Date()) / 864e5);
        return d >= 0 && d < 60;
    }).slice(0, 5);
    const lowStockMeds = medicines.filter(m => m.qty > 0 && m.qty < m.reorder_level).slice(0, 5);

    const kpis = [
        { label: "Total Medicines", val: dashboardStats.totalMedicines || medicines.length, color: ACCENT, trend: "+12%" },
        { label: "Low Stock Alerts", val: dashboardStats.lowStock || lowStockCount, color: WARNING, trend: lowStockCount > 0 ? "Action needed" : "All good" },
        { label: "Today's Revenue", val: dashboardStats.todayRevenue || 0, color: SUCCESS, prefix: "₹", trend: "+8.5%" },
        { label: "Total Patients", val: dashboardStats.totalPatients || 0, color: PURPLE, trend: "+23 this week" },
    ];

    const now = new Date();
    const hours = now.getHours();
    const greeting = hours < 12 ? "Good Morning" : hours < 17 ? "Good Afternoon" : "Good Evening";
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fade-in">
            <style>{`
                .kpi-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .kpi-card:hover { transform: translateY(-4px); box-shadow: ${theme.shadowLg}; }
                .chart-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .chart-card:hover { box-shadow: ${theme.shadowLg}; }
                .alert-item { transition: all 0.2s ease; }
                .alert-item:hover { transform: translateX(4px); }
                .activity-row { transition: all 0.15s ease; }
                .activity-row:hover { background: ${theme.accentSoft} !important; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ ...cs.sectionTitle(26), marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        {greeting}
                    </h1>
                    <p style={{ color: theme.muted, margin: 0, fontSize: 14, fontWeight: 500 }}>
                        {dateStr} — MedOS Thrissur
                    </p>
                </div>
            </div>

            <ActivityTicker darkMode={darkMode} />

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
                {kpis.map((k, i) => (
                    <div key={i} className="kpi-card" style={{ 
                        ...cs.kpi(k.color), cursor: "default",
                        animation: `fadeIn 0.4s ease-out ${i * 0.1}s both`
                    }}>
                        <div style={{ 
                            fontSize: 11, color: theme.muted, textTransform: "uppercase", 
                            letterSpacing: "0.08em", fontWeight: 600, marginBottom: 12 
                        }}>{k.label}</div>
                        <div style={{ 
                            fontSize: 32, fontWeight: 800, fontFamily: "'Inter', sans-serif", 
                            color: theme.text, lineHeight: 1, marginBottom: 8,
                            letterSpacing: "-0.02em"
                        }}>
                            <AnimatedNumber target={k.val} prefix={k.prefix || ""} />
                        </div>
                        <div style={{ 
                            fontSize: 12, color: k.color, fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 4
                        }}>
                            <span style={{ fontSize: 14 }}>{k.trend?.includes("+") ? "↑" : k.trend?.includes("Action") ? "!" : "→"}</span>
                            {k.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                <div className="chart-card" style={cs.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>Revenue Analytics</h3>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.muted }}>Monthly performance overview</p>
                        </div>
                        <div style={{ 
                            padding: "6px 12px", background: `${SUCCESS}15`, borderRadius: 20,
                            fontSize: 11, fontWeight: 600, color: SUCCESS
                        }}>+12.5% vs last period</div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={salesData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.muted, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: theme.muted, fontWeight: 500 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                            <Tooltip 
                                formatter={v => [`₹${Number(v).toLocaleString()}`, "Revenue"]} 
                                contentStyle={{ 
                                    background: theme.card, border: `1px solid ${theme.border}`, 
                                    borderRadius: 12, fontSize: 12, boxShadow: theme.shadow 
                                }} 
                            />
                            <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={3} fill="url(#colorRevenue)" dot={{ fill: ACCENT, r: 4, strokeWidth: 2, stroke: theme.card }} activeDot={{ r: 7, strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card" style={cs.card}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: theme.text }}>Category Distribution</h3>
                    <ResponsiveContainer width="100%" height={170}>
                        <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                {categoryData.map((e, i) => <Cell key={i} fill={e.color} stroke={theme.card} strokeWidth={3} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, fontSize: 12, boxShadow: theme.shadow }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12 }}>
                        {categoryData.map((c, i) => (
                            <span key={i} style={{ fontSize: 11, color: theme.muted, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: "inline-block" }} />
                                {c.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sales bar + Alerts + Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 20 }}>
                {/* Sales bar chart */}
                <div className="chart-card" style={cs.card}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: theme.text }}>Sales Volume</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.muted, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: theme.muted, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, fontSize: 12, boxShadow: theme.shadow }} />
                            <Bar dataKey="sales" fill={ACCENT} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Alerts panel */}
                <div className="chart-card" style={cs.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 20 }}>!</span>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.text }}>Active Alerts</h3>
                        {(expiringMeds.length + lowStockMeds.length) > 0 && (
                            <span style={{ 
                                background: `${DANGER}15`, color: DANGER, padding: "4px 10px",
                                borderRadius: 20, fontSize: 11, fontWeight: 700, marginLeft: "auto"
                            }}>{expiringMeds.length + lowStockMeds.length}</span>
                        )}
                    </div>
                    {expiringMeds.length === 0 && lowStockMeds.length === 0 && (
                        <div style={{ 
                            color: theme.muted, fontSize: 13, padding: "24px 16px", textAlign: "center",
                            background: `${SUCCESS}08`, borderRadius: 12, border: `1px dashed ${SUCCESS}40`
                        }}>
                            <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}></span>
                            No active alerts. Everything looks good!
                        </div>
                    )}
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        {expiringMeds.map((m, i) => {
                            const d = Math.ceil((new Date(m.expiry) - new Date()) / 864e5);
                            return (
                                <div key={i} className="alert-item" style={{ 
                                    padding: "12px 14px", 
                                    background: d < 0 ? "#FEF2F2" : "#FFFBEB", 
                                    borderRadius: 10, marginBottom: 8, 
                                    borderLeft: `4px solid ${d < 0 ? DANGER : WARNING}` 
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: d < 0 ? DANGER : "#92400E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        {d < 0 ? "EXPIRED" : `EXPIRES IN ${d}d`}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{m.name}</div>
                                </div>
                            );
                        })}
                        {lowStockMeds.map((m, i) => (
                            <div key={`low-${i}`} className="alert-item" style={{ 
                                padding: "12px 14px", background: "#FFFBEB", borderRadius: 10, 
                                marginBottom: 8, borderLeft: `4px solid ${WARNING}` 
                            }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    LOW STOCK
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{m.name} — <span style={{ color: DANGER }}>{m.qty} left</span></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                <div className="chart-card" style={cs.card}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: theme.text }}>Recent Activity</h3>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {(recentActivity.length > 0 ? recentActivity : [
                            { time: "09:12 AM", text: "System initialized", type: "sale" },
                        ]).map((a, i) => (
                            <div key={i} className="activity-row" style={{ 
                                display: "flex", gap: 12, marginBottom: 4, alignItems: "flex-start", 
                                padding: "10px 12px", borderRadius: 10, transition: "background 0.15s" 
                            }}>
                                <div style={{ 
                                    width: 10, height: 10, borderRadius: "50%", 
                                    background: a.type === "alert" ? DANGER : a.type === "sale" ? ACCENT : PURPLE, 
                                    marginTop: 5, flexShrink: 0,
                                    boxShadow: `0 0 6px ${a.type === "alert" ? DANGER : a.type === "sale" ? ACCENT : PURPLE}40`
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.4, fontWeight: 500 }}>{a.text}</div>
                                    <div style={{ fontSize: 11, color: theme.muted, marginTop: 4, fontWeight: 500 }}>{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
