import { useEffect, useRef, useState } from "react";
import { useNotifications } from "./NotificationSystem.jsx";
import { ACCENT, DANGER, WARNING, PURPLE } from "../theme.js";

const SEV_COLORS = {
    critical: DANGER,
    warning: WARNING,
    info: ACCENT,
    activity: PURPLE,
};

export default function ActivityTicker({ darkMode }) {
    const { notifications } = useNotifications();
    const containerRef = useRef(null);
    const [paused, setPaused] = useState(false);

    const dm = darkMode;
    const border = dm ? "#1F2937" : "#E2E8F0";
    const muted = dm ? "#94A3B8" : "#64748B";

    // take the 20 most recent
    const items = notifications.slice(0, 20);

    if (items.length === 0) return null;

    return (
        <div style={{
            background: dm ? "rgba(13,27,42,0.7)" : "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${border}`,
            borderRadius: 10, overflow: "hidden", marginBottom: 16,
            position: "relative"
        }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* label */}
            <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 90,
                background: dm
                    ? "linear-gradient(90deg, #0D1B2A 60%, transparent)"
                    : "linear-gradient(90deg, #EEF2F7 60%, transparent)",
                zIndex: 2, display: "flex", alignItems: "center", paddingLeft: 12,
                fontSize: 10, fontWeight: 800, color: ACCENT,
                textTransform: "uppercase", letterSpacing: "0.08em"
            }}>
                LIVE
            </div>

            <div ref={containerRef} style={{
                display: "flex", alignItems: "center",
                padding: "10px 12px 10px 95px",
                overflow: "hidden", whiteSpace: "nowrap",
            }}>
                <div style={{
                    display: "inline-flex", gap: 28,
                    animation: `tickerScroll ${Math.max(items.length * 4, 20)}s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                }}>
                    {/* duplicate for seamless loop */}
                    {[...items, ...items].map((n, i) => {
                        const col = SEV_COLORS[n.severity] || ACCENT;
                        return (
                            <span key={i} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                fontSize: 12, color: dm ? "#E2E8F0" : "#1E293B",
                                flexShrink: 0
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: "50%",
                                    background: col, display: "inline-block",
                                    boxShadow: n.severity === "critical" ? `0 0 8px ${col}80` : "none",
                                    animation: n.severity === "critical" ? "tickerPulse 1.2s ease-in-out infinite" : "none"
                                }} />
                                <span style={{ fontWeight: n.severity === "critical" ? 700 : 400 }}>{n.msg}</span>
                                <span style={{ fontSize: 10, color: muted, fontWeight: 600 }}>
                                    {new Date(n.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span style={{ color: border }}>│</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* right fade */}
            <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
                background: dm
                    ? "linear-gradient(270deg, #0D1B2A 30%, transparent)"
                    : "linear-gradient(270deg, #EEF2F7 30%, transparent)",
                zIndex: 2, pointerEvents: "none"
            }} />

            <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes tickerPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
        </div>
    );
}
