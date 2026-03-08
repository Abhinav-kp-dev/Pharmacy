import { useState, useEffect, useRef } from "react";
import { ACCENT, ACCENT_HOVER, globalStyles } from "../theme.js";
import { API_URL } from "../config.js";

// Interactive Grid Background Component
function InteractiveGrid({ darkMode }) {
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const gridRef = useRef(null);
    
    const gridSize = 50; // Size of each grid tile
    const cols = Math.ceil(window.innerWidth / gridSize) + 1;
    const rows = Math.ceil(window.innerHeight / gridSize) + 1;

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const getInteraction = (col, row) => {
        // Calculate center of this tile
        const tileCenterX = col * gridSize + gridSize / 2;
        const tileCenterY = row * gridSize + gridSize / 2;
        const distance = Math.sqrt(
            Math.pow(mousePos.x - tileCenterX, 2) + 
            Math.pow(mousePos.y - tileCenterY, 2)
        );
        const maxDistance = 150;
        const intensity = Math.max(0, 1 - distance / maxDistance);
        
        // Calculate follow direction
        const angle = Math.atan2(mousePos.y - tileCenterY, mousePos.x - tileCenterX);
        const followStrength = intensity * 6;
        const offsetX = Math.cos(angle) * followStrength;
        const offsetY = Math.sin(angle) * followStrength;
        
        return {
            intensity,
            lift: intensity * -8, // Lift up (negative Y)
            offsetX,
            offsetY,
        };
    };

    const borderColor = darkMode ? "rgba(71, 85, 105, 0.25)" : "rgba(148, 163, 184, 0.2)";
    const tileBase = darkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.4)";

    return (
        <div ref={gridRef} style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
        }}>
            {/* Interactive tiles */}
            {Array.from({ length: rows }).map((_, row) => (
                Array.from({ length: cols }).map((_, col) => {
                    const { intensity, lift, offsetX, offsetY } = getInteraction(col, row);
                    const isActive = intensity > 0.05;
                    
                    return (
                        <div
                            key={`${row}-${col}`}
                            style={{
                                position: "absolute",
                                left: col * gridSize,
                                top: row * gridSize,
                                width: gridSize - 2,
                                height: gridSize - 2,
                                margin: 1,
                                background: isActive 
                                    ? `linear-gradient(135deg, ${ACCENT}${Math.round(intensity * 55).toString(16).padStart(2, '0')}, ${ACCENT}${Math.round(intensity * 35).toString(16).padStart(2, '0')})`
                                    : tileBase,
                                border: `1px solid ${isActive ? `${ACCENT}${Math.round(intensity * 80).toString(16).padStart(2, '0')}` : borderColor}`,
                                borderRadius: 4,
                                transform: `translate(${offsetX}px, ${lift + offsetY}px)`,
                                boxShadow: isActive 
                                    ? `0 ${-lift}px ${intensity * 30}px ${ACCENT}50, 0 0 ${intensity * 25}px ${ACCENT}40, inset 0 0 ${intensity * 20}px ${ACCENT}25`
                                    : "none",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        />
                    );
                })
            ))}
        </div>
    );
}

export default function Login({ onLogin, darkMode, onDark }) {
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const card = darkMode ? "#1E293B" : "#fff";
    const border = darkMode ? "#334155" : "#E2E8F0";
    const text = darkMode ? "#F1F5F9" : "#0F172A";
    const muted = darkMode ? "#94A3B8" : "#64748B";
    const inputBg = darkMode ? "#0F172A" : "#F8FAFC";

    async function submit(e) {
        e.preventDefault();
        setError(""); setLoading(true);
        try {
            const r = await fetch(`${API_URL}/auth/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const d = await r.json();
            if (!r.ok) { setError(d.error || "Login failed"); return; }
            onLogin(d.user);
        } catch { setError("Connection error. Is the backend running?"); }
        finally { setLoading(false); }
    }

    const fill = (u, p) => setForm({ username: u, password: p });

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif", position: "relative", overflow: "hidden",
            background: darkMode
                ? "linear-gradient(145deg, #0B1120 0%, #1E293B 50%, #0F172A 100%)"
                : "linear-gradient(145deg, #F1F5F9 0%, #FFFFFF 50%, #E8F4F0 100%)"
        }}>
            <style>{globalStyles}</style>
            <style>{`
                @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
                @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
                .login-input:focus { border-color: ${ACCENT} !important; box-shadow: 0 0 0 4px ${ACCENT}20 !important; }
                .demo-btn:hover { border-color: ${ACCENT} !important; background: ${darkMode ? '#0F172A' : '#F0FDFA'} !important; }
            `}</style>

            {/* Interactive Grid Background */}
            <InteractiveGrid darkMode={darkMode} />

            {/* Decorative elements */}
            <div style={{
                position: "absolute", top: -100, right: -100, width: 400, height: 400,
                background: `radial-gradient(circle, ${ACCENT}15 0%, transparent 70%)`,
                animation: "glow 4s ease-in-out infinite"
            }} />
            <div style={{
                position: "absolute", bottom: -150, left: -150, width: 500, height: 500,
                background: `radial-gradient(circle, #7C3AED15 0%, transparent 70%)`,
                animation: "glow 5s ease-in-out infinite 1s"
            }} />

            {/* Floating shapes */}
            {[
                { s: 80, top: "15%", left: "10%", col: ACCENT, delay: "0s" },
                { s: 50, top: "70%", left: "8%", col: "#7C3AED", delay: "1s" },
                { s: 100, top: "20%", right: "8%", col: "#F59E0B", delay: "0.5s" },
                { s: 60, bottom: "15%", right: "12%", col: ACCENT, delay: "1.5s" },
            ].map((p, i) => (
                <div key={i} style={{
                    position: "absolute", top: p.top, left: p.left, right: p.right, bottom: p.bottom,
                    width: p.s, height: p.s * 0.4, borderRadius: 100,
                    background: `${p.col}12`, border: `2px solid ${p.col}20`,
                    animation: `float 6s ease-in-out infinite ${p.delay}`,
                    backdropFilter: "blur(4px)"
                }} />
            ))}

            <div style={{
                background: card, border: `1px solid ${border}`, borderRadius: 24,
                padding: "44px 48px", width: 440, maxWidth: "92%",
                boxShadow: darkMode 
                    ? "0 40px 100px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.4)" 
                    : "0 20px 60px rgba(0,0,0,0.08), 0 8px 20px rgba(0,0,0,0.04)",
                position: "relative", zIndex: 1,
                animation: "fadeIn 0.5s ease-out"
            }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ 
                        width: 72, height: 72, margin: "0 auto 16px",
                        background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                        borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 12px 32px ${ACCENT}40`,
                        overflow: "hidden"
                    }}>
                        <img src="/logo.png" alt="MedOS" style={{ width: 48, height: 48, objectFit: "contain" }} />
                    </div>
                    <h1 style={{ 
                        fontFamily: "'Inter', sans-serif", fontSize: 28, margin: "0 0 8px", 
                        background: `linear-gradient(135deg, ${ACCENT} 0%, #0F766E 100%)`,
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        fontWeight: 800, letterSpacing: "-0.03em"
                    }}>MedOS</h1>
                    <p style={{ color: muted, fontSize: 14, margin: 0, fontWeight: 500 }}>
                        Enterprise Pharmacy Management
                    </p>
                </div>

                <form onSubmit={submit}>
                    {["username", "password"].map(field => (
                        <div key={field} style={{ marginBottom: 20 }}>
                            <label style={{ 
                                display: "block", fontSize: 12, fontWeight: 600, 
                                color: focusedField === field ? ACCENT : muted, 
                                letterSpacing: "0.02em", marginBottom: 8,
                                transition: "color 0.2s"
                            }}>
                                {field === "username" ? "Username" : "Password"}
                            </label>
                            <input
                                type={field === "password" ? "password" : "text"}
                                placeholder={field === "username" ? "Enter your username" : "Enter your password"}
                                autoComplete={field}
                                className="login-input"
                                value={form[field]}
                                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                                onFocus={() => setFocusedField(field)}
                                onBlur={() => setFocusedField(null)}
                                style={{ 
                                    width: "100%", padding: "14px 16px", borderRadius: 12, 
                                    border: `2px solid ${focusedField === field ? ACCENT : border}`, 
                                    background: inputBg, color: text, 
                                    fontFamily: "'Inter', sans-serif", fontSize: 14, 
                                    outline: "none", boxSizing: "border-box", 
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    fontWeight: 500
                                }}
                            />
                        </div>
                    ))}

                    {error && (
                        <div style={{ 
                            background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", 
                            padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 13,
                            display: "flex", alignItems: "center", gap: 10, fontWeight: 500
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>!</span>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        width: "100%", padding: 16, 
                        background: loading ? `${ACCENT}80` : `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_HOVER} 100%)`,
                        color: "white", border: "none", borderRadius: 12, 
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)", 
                        letterSpacing: "0.01em",
                        boxShadow: loading ? "none" : `0 8px 24px ${ACCENT}40`,
                        transform: loading ? "none" : "translateY(0)",
                    }} 
                    onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
                    >
                        {loading ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                <span style={{ animation: "pulse 1s infinite" }}>●</span>
                                Signing in...
                            </span>
                        ) : "Sign In"}
                    </button>
                </form>

                {/* Demo credentials */}
                <div style={{ 
                    marginTop: 28, padding: 20, 
                    background: darkMode ? "#0F172A" : "#F8FAFC", 
                    borderRadius: 16, border: `1px solid ${border}` 
                }}>
                    <div style={{ 
                        fontSize: 10, color: muted, fontWeight: 700, 
                        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
                        display: "flex", alignItems: "center", gap: 8
                    }}>
                        <span style={{ width: 16, height: 1, background: border }} />
                        Demo Credentials
                        <span style={{ width: 16, height: 1, background: border }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                            { label: "ADMIN", u: "admin", p: "admin123", col: ACCENT },
                            { label: "STAFF", u: "staff1", p: "staff123", col: "#7C3AED" },
                        ].map(d => (
                            <button key={d.label} onClick={() => fill(d.u, d.p)} className="demo-btn" style={{
                                padding: "14px 16px", background: card, border: `1.5px solid ${border}`,
                                borderRadius: 12, cursor: "pointer", textAlign: "left", 
                                fontFamily: "'Inter', sans-serif",
                                transition: "all 0.2s"
                            }}>
                                <div style={{ fontSize: 11, color: d.col, fontWeight: 700, marginBottom: 4 }}>{d.label}</div>
                                <div style={{ fontSize: 12, color: text, fontWeight: 500 }}>{d.u} / {d.p}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme toggle */}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                    <button onClick={onDark} style={{ 
                        background: darkMode ? "#334155" : "#F1F5F9", 
                        border: `1px solid ${border}`,
                        borderRadius: 10, padding: "10px 20px",
                        color: muted, cursor: "pointer", fontSize: 13,
                        fontWeight: 600, fontFamily: "'Inter', sans-serif",
                        display: "inline-flex", alignItems: "center", gap: 8,
                        transition: "all 0.2s"
                    }}>
                        {darkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                </div>
            </div>

            {/* Version tag */}
            <div style={{ 
                position: "absolute", bottom: 20, 
                color: muted, fontSize: 11, fontWeight: 500, letterSpacing: "0.05em"
            }}>
                MedOS v2.0 — Enterprise Edition
            </div>
        </div>
    );
}
