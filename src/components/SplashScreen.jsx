import { useState, useEffect } from "react";

const ACCENT = "#0D9488";

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Faster at start, slower near end for realistic feel
        const increment = prev < 70 ? Math.random() * 15 + 5 : Math.random() * 5 + 1;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    // Complete after minimum display time
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500); // Wait for fade animation
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.5s ease-out",
    }}>
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 0.1,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 300 + i * 100,
            height: 300 + i * 100,
            borderRadius: "50%",
            border: `1px solid ${ACCENT}`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animation: `pulse-ring ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>

      {/* Logo container */}
      <div style={{
        position: "relative",
        marginBottom: 32,
        animation: "float 3s ease-in-out infinite",
      }}>
        {/* Glow effect */}
        <div style={{
          position: "absolute",
          inset: -20,
          background: `radial-gradient(circle, ${ACCENT}40 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(20px)",
          animation: "glow-pulse 2s ease-in-out infinite",
        }} />
        
        {/* Logo box */}
        <div style={{
          width: 100,
          height: 100,
          background: `linear-gradient(135deg, ${ACCENT} 0%, #0F766E 100%)`,
          borderRadius: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 20px 60px ${ACCENT}50`,
          position: "relative",
          overflow: "hidden",
        }}>
          <img 
            src="/logo.png" 
            alt="MedOS" 
            style={{ 
              width: 64, 
              height: 64, 
              objectFit: "contain",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }} 
          />
          {/* Shine effect */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
            borderRadius: 24,
          }} />
        </div>
      </div>

      {/* Brand name */}
      <h1 style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 42,
        fontWeight: 800,
        margin: "0 0 8px",
        background: `linear-gradient(135deg, #fff 0%, ${ACCENT} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.03em",
        textShadow: "0 0 40px rgba(13, 148, 136, 0.3)",
      }}>
        MedOS
      </h1>

      <p style={{
        color: "#64748B",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        margin: "0 0 48px",
      }}>
        Enterprise Pharmacy Management
      </p>

      {/* Progress bar container */}
      <div style={{
        width: 280,
        height: 4,
        background: "rgba(255,255,255,0.1)",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Progress fill */}
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${ACCENT} 0%, #14B8A6 100%)`,
          borderRadius: 2,
          transition: "width 0.3s ease-out",
          boxShadow: `0 0 20px ${ACCENT}`,
        }} />
        
        {/* Shimmer effect */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          animation: "shimmer 1.5s infinite",
        }} />
      </div>

      {/* Loading text */}
      <p style={{
        color: "#475569",
        fontSize: 12,
        marginTop: 16,
        fontWeight: 500,
      }}>
        {progress < 30 ? "Initializing system..." : 
         progress < 60 ? "Loading modules..." : 
         progress < 90 ? "Preparing dashboard..." : 
         "Almost ready..."}
      </p>

      {/* Version info */}
      <div style={{
        position: "absolute",
        bottom: 32,
        color: "#334155",
        fontSize: 11,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span>MedOS v2.0</span>
        <span style={{ color: "#1E293B" }}>|</span>
        <span>Enterprise Edition</span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
