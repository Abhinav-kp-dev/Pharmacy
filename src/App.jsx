import { useState, useEffect, useCallback } from "react";
import { ToastProvider } from "./components/Toast.jsx";
import { NotificationProvider } from "./components/NotificationSystem.jsx";
import SplashScreen from "./components/SplashScreen.jsx";
import Login from "./components/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Billing from "./pages/Billing.jsx";
import Patients from "./pages/Patients.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";
import DBSchema from "./pages/DBSchema.jsx";
import { getTheme, globalStyles } from "./theme.js";
import { API_URL } from "./config.js";

const SALES_FALLBACK = [
  { month: "Oct", revenue: 42000, sales: 210 },
  { month: "Nov", revenue: 51000, sales: 255 },
  { month: "Dec", revenue: 63000, sales: 315 },
  { month: "Jan", revenue: 58000, sales: 290 },
  { month: "Feb", revenue: 71000, sales: 355 },
  { month: "Mar", revenue: 48000, sales: 240 },
];
const CATEGORY_FALLBACK = [
  { name: "Antibiotic", value: 28, color: "#0D9488" },
  { name: "Analgesic", value: 22, color: "#F59E0B" },
  { name: "Cardiac", value: 18, color: "#EF4444" },
  { name: "Antidiabetic", value: 15, color: "#8B5CF6" },
  { name: "Supplement", value: 17, color: "#64748B" },
];

export default function PharmacyApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pharma_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => localStorage.getItem("pharma_dark") !== "false");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data stores
  const [medicines, setMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [salesData, setSalesData] = useState(SALES_FALLBACK);
  const [catData, setCatData] = useState(CATEGORY_FALLBACK);
  const [activity, setActivity] = useState([]);
  const [dashStats, setDashStats] = useState({});
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  // Load all core data
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [meds, pats, sups, dash, sales, cats, act] = await Promise.allSettled([
        fetch(`${API_URL}/medicines`).then(r => r.json()),
        fetch(`${API_URL}/patients`).then(r => r.json()),
        fetch(`${API_URL}/suppliers`).then(r => r.json()),
        fetch(`${API_URL}/dashboard/stats`).then(r => r.json()),
        fetch(`${API_URL}/dashboard/sales-chart`).then(r => r.json()),
        fetch(`${API_URL}/dashboard/category-chart`).then(r => r.json()),
        fetch(`${API_URL}/dashboard/recent-activity`).then(r => r.json()),
      ]);
      if (meds.status === "fulfilled") setMedicines(meds.value);
      if (pats.status === "fulfilled") setPatients(pats.value);
      if (sups.status === "fulfilled") setSuppliers(sups.value);
      if (dash.status === "fulfilled") setDashStats(dash.value);
      if (sales.status === "fulfilled" && sales.value?.length) setSalesData(sales.value);
      if (cats.status === "fulfilled" && cats.value?.length) setCatData(cats.value);
      if (act.status === "fulfilled") setActivity(act.value);
      if (isAdmin) {
        const uRes = await fetch(`${API_URL}/users`);
        if (uRes.ok) setUsers(await uRes.json());
      }
    } finally { setLoading(false); }
  }, [user, isAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function toggleDark() {
    setDark(d => {
      localStorage.setItem("pharma_dark", String(!d));
      return !d;
    });
  }

  function handleLogin(u) {
    localStorage.setItem("pharma_user", JSON.stringify(u));
    setUser(u);
    setPage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("pharma_user");
    setUser(null);
    setPage("dashboard");
    setMedicines([]); setPatients([]); setSuppliers([]); setUsers([]);
  }

  const theme = getTheme(dark);

  // Show splash screen on initial load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} darkMode={dark} onDark={toggleDark} />
      </ToastProvider>
    );
  }

  // Guard admin-only pages
  const adminPages = ["users", "settings", "schema"];
  const safePage = adminPages.includes(page) && !isAdmin ? "dashboard" : page;

  const pageProps = { darkMode: dark, isAdmin };

  return (
    <ToastProvider>
      <NotificationProvider darkMode={dark}>
        <style>{globalStyles}</style>
        <div style={{ 
          display: "flex", height: "100vh", 
          fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", 
          background: theme.bg, color: theme.text, overflow: "hidden" 
        }}>
          <Sidebar
            page={safePage}
            setPage={setPage}
            user={user}
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(p => !p)}
            darkMode={dark}
            onDark={toggleDark}
            onLogout={handleLogout}
          />

          <main style={{ 
            flex: 1, overflowY: "auto", padding: "32px 32px",
            background: dark 
              ? "linear-gradient(180deg, #0B1120 0%, #111827 100%)"
              : "linear-gradient(180deg, #F1F5F9 0%, #F8FAFC 100%)"
          }}>
            {loading && safePage === "dashboard" && (
              <div style={{ 
                textAlign: "center", padding: "60px 0", color: theme.muted, fontSize: 14,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 16
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12,
                  background: theme.card, border: `1px solid ${theme.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "pulse 1.5s infinite", overflow: "hidden"
                }}>
                  <img src="/logo.png" alt="MedOS" style={{ width: 32, height: 32, objectFit: "contain" }} />
                </div>
                <span>Loading your dashboard...</span>
              </div>
            )}

            {safePage === "dashboard" && !loading && (
              <Dashboard
                {...pageProps}
                medicines={medicines}
                salesData={salesData}
                categoryData={catData}
                recentActivity={activity}
                dashboardStats={dashStats}
              />
            )}

            {safePage === "inventory" && (
              <Inventory
                {...pageProps}
                medicines={medicines}
                onRefresh={fetchAll}
              />
            )}

            {safePage === "billing" && (
              <Billing
                {...pageProps}
                medicines={medicines}
                patients={patients}
                onRefresh={fetchAll}
              />
            )}

            {safePage === "patients" && (
              <Patients
                {...pageProps}
                patients={patients}
                onRefresh={fetchAll}
              />
            )}

            {safePage === "suppliers" && (
              <Suppliers
                {...pageProps}
                suppliers={suppliers}
                onRefresh={fetchAll}
              />
            )}

            {safePage === "reports" && (
              <Reports
                {...pageProps}
                medicines={medicines}
                salesData={salesData}
                categoryData={catData}
              />
            )}

            {safePage === "users" && isAdmin && (
              <Users
                {...pageProps}
                users={users}
                currentUserId={user.id}
                onRefresh={fetchAll}
              />
            )}

            {safePage === "settings" && isAdmin && (
              <Settings {...pageProps} />
            )}

            {safePage === "schema" && isAdmin && (
              <DBSchema {...pageProps} />
            )}
          </main>
        </div>
      </NotificationProvider>
    </ToastProvider>
  );
}
