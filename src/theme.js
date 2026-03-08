// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE COLOR SYSTEM - Professional, accessible, and cohesive
// ═══════════════════════════════════════════════════════════════════════════════

export const ACCENT = "#0D9488";      // Teal - Primary brand
export const ACCENT_HOVER = "#0F766E";
export const DANGER = "#DC2626";      // Red - Errors, destructive
export const DANGER_HOVER = "#B91C1C";
export const WARNING = "#D97706";     // Amber - Warnings, alerts
export const SUCCESS = "#059669";     // Green - Success states
export const PURPLE = "#7C3AED";      // Purple - Highlights
export const BLUE = "#2563EB";        // Blue - Links, info

// Semantic colors for badges/status
export const STATUS = {
    active: { color: "#059669", bg: "#ECFDF5" },
    inactive: { color: "#6B7280", bg: "#F3F4F6" },
    warning: { color: "#D97706", bg: "#FFFBEB" },
    danger: { color: "#DC2626", bg: "#FEF2F2" },
    info: { color: "#2563EB", bg: "#EFF6FF" },
};

export function getTheme(dark) {
    return {
        accent: ACCENT,
        accentHover: ACCENT_HOVER,
        // Backgrounds
        bg: dark ? "#0B1120" : "#F1F5F9",
        bgSubtle: dark ? "#0F172A" : "#F8FAFC",
        card: dark ? "#1E293B" : "#FFFFFF",
        cardHover: dark ? "#243247" : "#FAFBFC",
        sidebar: dark ? "#0F172A" : "#1E293B",
        sidebarHov: dark ? "#1E293B" : "#334155",
        // Borders
        border: dark ? "#334155" : "#E2E8F0",
        borderHover: dark ? "#475569" : "#CBD5E1",
        borderFocus: ACCENT,
        // Text
        text: dark ? "#F1F5F9" : "#0F172A",
        textSecondary: dark ? "#CBD5E1" : "#334155",
        muted: dark ? "#94A3B8" : "#64748B",
        // Accents
        accentLight: dark ? "#134E4A" : "#F0FDFA",
        accentSoft: dark ? "rgba(13, 148, 136, 0.15)" : "rgba(13, 148, 136, 0.08)",
        // Inputs
        inputBg: dark ? "#1E293B" : "#FFFFFF",
        inputBorder: dark ? "#475569" : "#D1D5DB",
        inputFocus: dark ? "#0F766E" : "#0D9488",
        // Tables
        tableHead: dark ? "#1E293B" : "#F8FAFC",
        tableRowHover: dark ? "rgba(13, 148, 136, 0.08)" : "rgba(13, 148, 136, 0.04)",
        tableStripe: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
        // Shadows
        shadow: dark 
            ? "0 4px 24px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)",
        shadowLg: dark
            ? "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)",
        shadowXl: dark
            ? "0 20px 60px rgba(0,0,0,0.6)"
            : "0 12px 48px rgba(0,0,0,0.08)",
        // Modal overlay
        overlay: dark ? "rgba(0,0,0,0.75)" : "rgba(15,23,42,0.6)",
    };
}

export function makeStyles(t, dark) {
    return {
        // ─── CARDS ───────────────────────────────────────────────────────
        card: {
            background: t.card, 
            border: `1px solid ${t.border}`,
            borderRadius: 16, 
            padding: 24,
            boxShadow: t.shadow,
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        },
        cardHoverable: {
            background: t.card, 
            border: `1px solid ${t.border}`,
            borderRadius: 16, 
            padding: 24,
            boxShadow: t.shadow,
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
        },
        // ─── KPI CARDS ──────────────────────────────────────────────────
        kpi: (col) => ({
            background: t.card, 
            border: `1px solid ${t.border}`,
            borderLeft: `4px solid ${col}`,
            borderRadius: 16, 
            padding: "22px 24px", 
            flex: 1, 
            minWidth: 180,
            boxShadow: t.shadow,
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
        }),
        // ─── BUTTONS ────────────────────────────────────────────────────
        btn: (v = "primary") => ({
            padding: "10px 20px", 
            borderRadius: 10, 
            border: "none", 
            cursor: "pointer",
            fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", 
            fontWeight: 600, 
            fontSize: 13,
            letterSpacing: "-0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: v === "primary" ? "0 2px 8px rgba(13, 148, 136, 0.3)" :
                       v === "danger" ? "0 2px 8px rgba(220, 38, 38, 0.25)" : "none",
            background:
                v === "primary" ? `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)` :
                v === "danger" ? `linear-gradient(135deg, ${DANGER} 0%, ${DANGER_HOVER} 100%)` :
                v === "warning" ? WARNING :
                v === "secondary" ? (dark ? "#334155" : "#F1F5F9") :
                v === "ghost" ? "transparent" : "#6366F1",
            color: ["primary", "danger", "warning", "indigo"].includes(v) ? "white" : t.text,
        }),
        btnIcon: {
            padding: "8px",
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: t.card,
            cursor: "pointer",
            color: t.muted,
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        // ─── INPUTS ─────────────────────────────────────────────────────
        input: {
            padding: "11px 14px", 
            borderRadius: 10, 
            border: `1.5px solid ${t.inputBorder}`,
            background: t.inputBg, 
            color: t.text, 
            fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
            fontSize: 14, 
            outline: "none", 
            width: "100%", 
            boxSizing: "border-box",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            WebkitAppearance: "none",
        },
        inputGroup: {
            position: "relative",
            display: "flex",
            alignItems: "center",
        },
        // ─── TABLE ──────────────────────────────────────────────────────
        th: {
            textAlign: "left", 
            padding: "14px 18px", 
            fontSize: 11, 
            fontWeight: 700,
            color: t.muted, 
            textTransform: "uppercase", 
            letterSpacing: "0.08em",
            borderBottom: `2px solid ${t.border}`, 
            whiteSpace: "nowrap",
            background: t.tableHead,
        },
        td: { 
            padding: "14px 18px", 
            fontSize: 13.5, 
            borderBottom: `1px solid ${t.border}`, 
            color: t.text,
            lineHeight: 1.5,
        },
        tableCard: {
            background: t.card, 
            border: `1px solid ${t.border}`, 
            borderRadius: 16,
            overflow: "hidden", 
            boxShadow: t.shadow,
        },
        // ─── BADGES ─────────────────────────────────────────────────────
        badge: (c, b) => ({
            padding: "5px 12px", 
            borderRadius: 20, 
            fontSize: 11, 
            fontWeight: 600,
            color: c, 
            background: b, 
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
        }),
        statusBadge: (status) => ({
            padding: "5px 12px", 
            borderRadius: 20, 
            fontSize: 11, 
            fontWeight: 600,
            color: STATUS[status]?.color || t.muted, 
            background: dark ? `${STATUS[status]?.color}20` : STATUS[status]?.bg || "#F3F4F6", 
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
        }),
        // ─── MODAL ──────────────────────────────────────────────────────
        modal: {
            position: "fixed", 
            inset: 0, 
            background: t.overlay,
            backdropFilter: "blur(8px)", 
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 1000,
            padding: 20,
            animation: "modalFadeIn 0.2s ease-out",
        },
        modalBox: (w = 480) => ({
            background: t.card, 
            border: `1px solid ${t.border}`, 
            borderRadius: 20,
            padding: 32, 
            width: w, 
            maxWidth: "95vw", 
            maxHeight: "90vh",
            overflowY: "auto", 
            boxShadow: t.shadowXl,
            animation: "modalSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }),
        modalHeader: {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: `1px solid ${t.border}`,
        },
        modalTitle: {
            margin: 0, 
            fontFamily: "'Inter', 'Sora', sans-serif", 
            fontSize: 18, 
            fontWeight: 700, 
            color: t.text,
            letterSpacing: "-0.02em",
        },
        // ─── LABELS ─────────────────────────────────────────────────────
        label: {
            display: "block", 
            fontSize: 12, 
            fontWeight: 600, 
            marginBottom: 8,
            color: t.textSecondary, 
            letterSpacing: "0.01em",
        },
        // ─── TYPOGRAPHY ────────────────────────────────────────────────
        sectionTitle: (sz = 20) => ({
            fontFamily: "'Inter', 'Sora', sans-serif", 
            fontSize: sz, 
            fontWeight: 700, 
            margin: 0, 
            color: t.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
        }),
        subtitle: {
            color: t.muted, 
            fontSize: 13, 
            margin: "6px 0 0", 
            fontWeight: 400,
            lineHeight: 1.5,
        },
        // ─── DIVIDERS ──────────────────────────────────────────────────
        divider: {
            height: 1,
            background: t.border,
            margin: "16px 0",
            border: "none",
        },
        // ─── EMPTY STATE ────────────────────────────────────────────────
        emptyState: {
            textAlign: "center",
            padding: "48px 24px",
            color: t.muted,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STOCK STATUS HELPER
// ═══════════════════════════════════════════════════════════════════════════════

export function stockStatus(qty, expiry) {
    const exp = new Date(expiry);
    const now = new Date();
    const daysLeft = Math.ceil((exp - now) / 864e5);
    if (daysLeft < 0) return { label: "Expired", color: DANGER, bg: "#FEF2F2", status: "danger" };
    if (daysLeft < 60) return { label: `Exp ${daysLeft}d`, color: WARNING, bg: "#FFFBEB", status: "warning" };
    if (qty === 0) return { label: "Out of Stock", color: DANGER, bg: "#FEF2F2", status: "danger" };
    if (qty < 15) return { label: "Low Stock", color: WARNING, bg: "#FFFBEB", status: "warning" };
    return { label: "In Stock", color: SUCCESS, bg: "#ECFDF5", status: "active" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL CSS ANIMATIONS (inject once in App)
// ═══════════════════════════════════════════════════════════════════════════════

export const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
    box-sizing: border-box;
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
}

@keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes modalSlideIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}

.fade-in {
    animation: fadeIn 0.3s ease-out forwards;
}

.btn-hover:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
}

.btn-hover:active {
    transform: translateY(0);
}

.card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
}

input:focus, select:focus, textarea:focus {
    border-color: #0D9488 !important;
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15) !important;
}

::selection {
    background: rgba(13, 148, 136, 0.2);
}

.enterprise-table tr {
    transition: background 0.15s ease;
}

.enterprise-table tbody tr:hover {
    background: rgba(13, 148, 136, 0.04);
}
`;
