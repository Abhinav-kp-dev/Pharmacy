import { useState, useEffect } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { makeStyles, getTheme, ACCENT, WARNING, DANGER, PURPLE, BLUE, SUCCESS } from "../theme.js";
import { downloadCSV } from "../utils/csvExporter.js";
import { API_URL } from "../config.js";

export default function Reports({ darkMode, medicines, salesData, categoryData }) {
    const theme = getTheme(darkMode);
    const cs = makeStyles(theme, darkMode);

    const [topMeds, setTopMeds] = useState([]);
    const [reportSales, setReportSales] = useState({ sales: [], summary: {} });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [tab, setTab] = useState("revenue");

    useEffect(() => {
        fetch(`${API_URL}/reports/top-medicines`).then(r => r.ok ? r.json() : []).then(setTopMeds).catch(() => { });
    }, []);

    async function loadSalesReport() {
        const q = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
        const r = await fetch(`${API_URL}/reports/sales${q}`);
        if (r.ok) setReportSales(await r.json());
    }

    const today = new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const invValue = medicines.reduce((s, m) => s + m.qty * m.price, 0);
    const inStock = medicines.filter(m => m.qty > 0 && new Date(m.expiry) > new Date()).length;
    const expired = medicines.filter(m => new Date(m.expiry) < new Date()).length;

    const TABS = [
        { id: "revenue", label: "Revenue Trends" },
        { id: "inventory", label: "Inventory" },
        { id: "top", label: "Top Medicines" },
        { id: "sales", label: "Sales History" },
    ];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ ...cs.sectionTitle(24), display: "flex", alignItems: "center", gap: 12 }}>
                    Reports & Analytics
                </h2>
                <p style={{ color: theme.muted, margin: "8px 0 0", fontSize: 14, fontWeight: 500 }}>
                    {today} • Business Intelligence Dashboard
                </p>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                    { label: "Inventory Value", val: `₹${invValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: ACCENT },
                    { label: "In Stock Items", val: inStock, color: SUCCESS },
                    { label: "Expired Stock", val: expired, color: DANGER },
                    { label: "Total Sales", val: reportSales.summary.total_sales || "—", color: PURPLE },
                    { label: "Total Revenue", val: reportSales.summary.total_revenue ? `₹${Math.round(reportSales.summary.total_revenue).toLocaleString()}` : "—", color: BLUE },
                ].map((k, i) => (
                    <div key={i} style={{ ...cs.card, position: "relative", overflow: "hidden" }}>
                        <div style={{ fontSize: 11, color: theme.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>{k.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontFamily: "'Inter', sans-serif" }}>{k.val}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: `2px solid ${theme.border}`, paddingBottom: 14 }}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "sales") loadSalesReport(); }}
                        className="btn-hover"
                        style={{ 
                            ...cs.btn(tab === t.id ? "primary" : "secondary"), 
                            padding: "10px 20px", fontSize: 13, fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 8,
                            borderRadius: 10, position: "relative",
                            ...(tab === t.id ? { boxShadow: `0 2px 8px ${ACCENT}40` } : {})
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Revenue Trends */}
            {tab === "revenue" && (
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
                    <div style={cs.card}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Monthly Revenue
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.muted }} />
                                <YAxis tick={{ fontSize: 11, fill: theme.muted }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, "Revenue"]} contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, boxShadow: theme.shadowLg }} />
                                <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={3} fill="url(#revenueGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={cs.card}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Category Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, boxShadow: theme.shadowLg }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10, justifyContent: "center" }}>
                            {categoryData.map((c, i) => <span key={i} style={{ fontSize: 12, color: theme.muted, display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, display: "inline-block" }} />{c.name}
                            </span>)}
                        </div>
                    </div>
                    <div style={{ ...cs.card, gridColumn: "1/-1" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Sales Volume (6 months)
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.muted }} />
                                <YAxis tick={{ fontSize: 11, fill: theme.muted }} />
                                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, boxShadow: theme.shadowLg }} />
                                <Bar dataKey="sales" fill={PURPLE} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Inventory analysis */}
            {tab === "inventory" && (
                <div style={cs.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Inventory Status
                        </h3>
                        <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ padding: "6px 12px", background: `${SUCCESS}15`, borderRadius: 16, fontSize: 11, fontWeight: 600, color: SUCCESS }}>{inStock} In Stock</span>
                            <span style={{ padding: "6px 12px", background: `${DANGER}15`, borderRadius: 16, fontSize: 11, fontWeight: 600, color: DANGER }}>{expired} Expired</span>
                        </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: theme.tableHead }}>
                                <tr>{["Medicine", "Category", "Stock", "Price", "Expiry", "Value", "Status"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {medicines.map(m => {
                                    const exp = new Date(m.expiry);
                                    const today2 = new Date();
                                    let status = "In Stock", statusCol = SUCCESS, statusBg = `${SUCCESS}15`;
                                    if (m.qty === 0) { status = "Out of Stock"; statusCol = DANGER; statusBg = `${DANGER}15`; }
                                    else if (m.qty < 15) { status = "Low Stock"; statusCol = WARNING; statusBg = `${WARNING}15`; }
                                    else if (exp < today2) { status = "Expired"; statusCol = DANGER; statusBg = `${DANGER}15`; }
                                    return (
                                        <tr key={m.id} className="table-row-hover">
                                            <td style={{ ...cs.td, fontWeight: 600 }}>{m.name}</td>
                                            <td style={cs.td}><span style={cs.badge(BLUE, `${BLUE}15`)}>{m.category}</span></td>
                                            <td style={{ ...cs.td, fontWeight: 700 }}>{m.qty}</td>
                                            <td style={{ ...cs.td, color: ACCENT, fontWeight: 600 }}>₹{Number(m.price).toFixed(2)}</td>
                                            <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{m.expiry}</td>
                                            <td style={{ ...cs.td, fontWeight: 600 }}>₹{(m.qty * m.price).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                                            <td style={cs.td}><span style={cs.badge(statusCol, statusBg)}>{status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Medicines */}
            {tab === "top" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={cs.card}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Top Selling Medicines (Qty)
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={topMeds} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: theme.muted }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: theme.muted }} width={130} />
                                <Tooltip contentStyle={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12, boxShadow: theme.shadowLg }} />
                                <Bar dataKey="qty" fill={ACCENT} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={cs.card}>
                        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                            Sales Details
                        </h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead style={{ background: theme.tableHead }}><tr>{["Medicine", "Units Sold", "Revenue"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr></thead>
                                <tbody>
                                    {topMeds.map((m, i) => (
                                        <tr key={i} className="table-row-hover">
                                            <td style={{ ...cs.td, fontWeight: 600 }}>{m.name}</td>
                                            <td style={{ ...cs.td, fontWeight: 700, color: ACCENT }}>{m.qty}</td>
                                            <td style={{ ...cs.td, color: PURPLE, fontWeight: 600 }}>₹{Number(m.revenue || 0).toFixed(0)}</td>
                                        </tr>
                                    ))}
                                    {topMeds.length === 0 && (
                                        <tr>
                                            <td colSpan={3} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 40 }}>
                                                No sales data yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales History */}
            {tab === "sales" && (
                <div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                            <div>
                                <label style={cs.label}>From</label>
                                <input type="date" style={{ ...cs.input, width: 170 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label style={cs.label}>To</label>
                                <input type="date" style={{ ...cs.input, width: 170 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <button className="btn-hover" style={cs.btn()} onClick={loadSalesReport}>Apply Filter</button>
                        </div>
                        <button className="btn-hover" style={{ ...cs.btn("secondary"), display: "flex", alignItems: "center", gap: 6 }} onClick={() => downloadCSV(reportSales.sales || [], "sales_export.csv")}>
                            Export CSV
                        </button>
                    </div>
                    <div style={cs.tableCard}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: theme.tableHead }}><tr>{["Invoice", "Patient", "Date", "Items", "Total", "Payment", "Status"].map(h => <th key={h} style={cs.th}>{h}</th>)}</tr></thead>
                            <tbody>
                                {reportSales.sales?.map((s, i) => (
                                    <tr key={i} className="table-row-hover">
                                        <td style={{ ...cs.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{s.invoice_id}</td>
                                        <td style={{ ...cs.td, fontWeight: 600 }}>{s.patient_name || "Walk-in"}</td>
                                        <td style={{ ...cs.td, fontSize: 12, color: theme.muted }}>{new Date(s.created_at).toLocaleDateString()}</td>
                                        <td style={cs.td}><span style={{ fontWeight: 600 }}>{s.items?.length || 0}</span></td>
                                        <td style={{ ...cs.td, fontWeight: 700, color: ACCENT }}>₹{Number(s.net_amount).toFixed(2)}</td>
                                        <td style={cs.td}><span style={cs.badge(BLUE, `${BLUE}15`)}>{s.payment_method}</span></td>
                                        <td style={cs.td}><span style={cs.badge(SUCCESS, `${SUCCESS}15`)}>{s.status}</span></td>
                                    </tr>
                                ))}
                                {(!reportSales.sales || reportSales.sales.length === 0) && (
                                    <tr>
                                        <td colSpan={7} style={{ ...cs.td, textAlign: "center", color: theme.muted, padding: 50 }}>
                                            Click "Apply Filter" to load sales
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
