"use client";
import { useState, useEffect, useRef } from "react";

// ============ ENHANCEMENT UTILITIES ============

// #2 Haptic feedback
const haptic = (type = "light") => {
  if (!navigator.vibrate) return;
  const patterns = { light: [10], medium: [20], success: [10, 50, 10, 50, 20], celebration: [15, 40, 15, 40, 30, 60, 40] };
  try { navigator.vibrate(patterns[type] || [10]); } catch(e) {}
};

// #1 Confetti system
function Confetti({ active, onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d");
    cvs.width = 430; cvs.height = 600;
    const colors = ["#7C6EDB", "#4ECDC4", "#FFB347", "#E8878C", "#95E1D3", "#B8C4F0", "#D4A0D0"];
    const pieces = Array.from({ length: 60 }, () => ({
      x: 215 + (Math.random() - 0.5) * 200, y: 250,
      vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 12 - 4,
      r: Math.random() * 6 + 3, c: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360, spin: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }));
    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, 430, 600);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.rot += p.spin; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, 1 - frame / 70);
        ctx.fillStyle = p.c;
        if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); }
        ctx.restore();
      });
      frame++;
      if (frame < 75) requestAnimationFrame(animate);
      else { ctx.clearRect(0, 0, 430, 600); onDone && onDone(); }
    };
    haptic("celebration");
    animate();
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 999 }} />;
}

// #5 Animated number counter
function AnimatedNumber({ value, duration = 800, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = null; const from = 0; const to = typeof value === "number" ? value : parseFloat(value) || 0;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (p < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <span>{prefix}{display}{suffix}</span>;
}

// #6 Skeleton loader
function Skeleton({ w = "100%", h = 16, r = 8 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "linear-gradient(90deg, rgba(124,110,219,0.06) 25%, rgba(124,110,219,0.12) 50%, rgba(124,110,219,0.06) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease infinite" }} />;
}

// #10 Typing effect hook
function useTypingEffect(text, speed = 30, trigger = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!trigger || !text) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, trigger, speed]);
  return { displayed, done };
}

// #3 Page transition wrapper
function PageTransition({ children, screenKey }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setAnimate(true); const t = requestAnimationFrame(() => setAnimate(true)); return () => cancelAnimationFrame(t); }, [screenKey]);
  return <div style={{ animation: animate ? "fadeUp 0.3s ease both" : "none" }}>{children}</div>;
}

// #8 Scroll-triggered reveal
function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms` }}>{children}</div>;
}

// #9 Button press style helper
const pressStyle = {
  transition: "transform 0.15s cubic-bezier(.2,.8,.4,1.2), box-shadow 0.15s ease, filter 0.15s ease",
  cursor: "pointer",
};
const pressHandlers = (cb?: (e: React.MouseEvent | React.TouchEvent) => void) => ({
  onMouseDown: (e) => { e.currentTarget.style.transform = "scale(0.96)"; e.currentTarget.style.filter = "brightness(0.95)"; },
  onMouseUp: (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; cb && cb(e); },
  onMouseLeave: (e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; },
  onTouchStart: (e) => { e.currentTarget.style.transform = "scale(0.96)"; haptic("light"); },
  onTouchEnd: (e) => { e.currentTarget.style.transform = "scale(1)"; },
});

// ============ JU MASCOT IMAGES (HD transparent) ============
const JU_IMAGES: Record<string,string> = {
  "main": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bm%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23DDD5FC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239080D8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23bm%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E090C0%22%20opacity%3D%220.4%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E090C0%22%20opacity%3D%220.4%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%2290%22%20r%3D%228%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2278%22%20cy%3D%2287%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%2290%22%20r%3D%228%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%22128%22%20cy%3D%2287%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2084%2C120%20Q%20100%2C129%20116%2C120%22%20stroke%3D%22%233A2868%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ctext%20x%3D%22145%22%20y%3D%2272%22%20font-size%3D%2212%22%20fill%3D%22%23B0A0F0%22%3E%E2%9C%A6%3C%2Ftext%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%28-5%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%285%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
  "icon": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2060%2070%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bi%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23DDD5FC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239080D8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%208%2C30%20A%2022%2C22%200%200%2C1%2052%2C30%20Q%2052%2C52%2030%2C64%20Q%208%2C52%208%2C30%20Z%22%20fill%3D%22url%28%23bi%29%22%2F%3E%3Ccircle%20cx%3D%2222%22%20cy%3D%2228%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2223%22%20cy%3D%2226%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%2238%22%20cy%3D%2228%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2239%22%20cy%3D%2226%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2020%2C38%20Q%2030%2C44%2040%2C38%22%20stroke%3D%22%233A2868%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E",
  "5": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Ctext%20x%3D%2214%22%20y%3D%2260%22%20font-size%3D%2216%22%20fill%3D%22%233CBCB0%22%3E%E2%98%85%3C%2Ftext%3E%3Ctext%20x%3D%22164%22%20y%3D%2254%22%20font-size%3D%2214%22%20fill%3D%22%23FFD700%22%3E%E2%98%85%3C%2Ftext%3E%3Ctext%20x%3D%2218%22%20y%3D%22158%22%20font-size%3D%2212%22%20fill%3D%22%23FFB347%22%3E%E2%98%85%3C%2Ftext%3E%3Ctext%20x%3D%22160%22%20y%3D%22165%22%20font-size%3D%2214%22%20fill%3D%22%233CBCB0%22%3E%E2%98%85%3C%2Ftext%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b5%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2390EAE0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%232AADA2%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23b5%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23FF7070%22%20opacity%3D%220.55%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23FF7070%22%20opacity%3D%220.55%22%2F%3E%3Cpath%20d%3D%22M%2062%2C92%20Q%2075%2C76%2088%2C92%22%20stroke%3D%22%23157070%22%20stroke-width%3D%224%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20112%2C92%20Q%20125%2C76%20138%2C92%22%20stroke%3D%22%23157070%22%20stroke-width%3D%224%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2074%2C110%20Q%20100%2C148%20126%2C110%22%20stroke%3D%22%23157070%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22white%22%2F%3E%3Cellipse%20cx%3D%22100%22%20cy%3D%22126%22%20rx%3D%2224%22%20ry%3D%2216%22%20fill%3D%22white%22%2F%3E%3Cellipse%20cx%3D%22100%22%20cy%3D%22132%22%20rx%3D%2218%22%20ry%3D%229%22%20fill%3D%22%23157070%22%20opacity%3D%220.12%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%232AADA2%22%20transform%3D%22rotate%28-42%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%232AADA2%22%20transform%3D%22rotate%2842%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
  "4": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Ctext%20x%3D%2218%22%20y%3D%2262%22%20font-size%3D%2214%22%20fill%3D%22%2370C8B0%22%3E%E2%9C%A6%3C%2Ftext%3E%3Ctext%20x%3D%22160%22%20y%3D%2258%22%20font-size%3D%2212%22%20fill%3D%22%2340B898%22%3E%E2%9C%A6%3C%2Ftext%3E%3Ctext%20x%3D%22152%22%20y%3D%22158%22%20font-size%3D%2210%22%20fill%3D%22%2370C8B0%22%3E%E2%9C%A6%3C%2Ftext%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b4%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C0F0E4%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2358C0A8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23b4%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23F0A040%22%20opacity%3D%220.5%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23F0A040%22%20opacity%3D%220.5%22%2F%3E%3Cpath%20d%3D%22M%2075%2C84%20L%2075%2C96%20M%2069%2C90%20L%2081%2C90%20M%2071%2C86%20L%2079%2C94%20M%2079%2C86%20L%2071%2C94%22%20stroke%3D%22%231A5040%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20125%2C84%20L%20125%2C96%20M%20119%2C90%20L%20131%2C90%20M%20121%2C86%20L%20129%2C94%20M%20129%2C86%20L%20121%2C94%22%20stroke%3D%22%231A5040%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2078%2C116%20Q%20100%2C136%20122%2C116%22%20stroke%3D%22%231A5040%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2078%2C116%20Q%20100%2C130%20122%2C116%20Q%20100%2C128%2078%2C116%20Z%22%20fill%3D%22%231A5040%22%20opacity%3D%220.12%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2358C0A8%22%20transform%3D%22rotate%28-28%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2358C0A8%22%20transform%3D%22rotate%2828%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
  "3": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b3%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23DDD5FC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239080D8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23b3%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E090C0%22%20opacity%3D%220.4%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E090C0%22%20opacity%3D%220.4%22%2F%3E%3Ccircle%20cx%3D%2275%22%20cy%3D%2290%22%20r%3D%228%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2278%22%20cy%3D%2287%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22125%22%20cy%3D%2290%22%20r%3D%228%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%22128%22%20cy%3D%2287%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2084%2C120%20Q%20100%2C129%20116%2C120%22%20stroke%3D%22%233A2868%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%28-5%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%285%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
  "2": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b2%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C8D8F5%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%237898D0%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23b2%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%238098C0%22%20opacity%3D%220.35%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%238098C0%22%20opacity%3D%220.35%22%2F%3E%3Cpath%20d%3D%22M%2063%2C92%20Q%2075%2C98%2087%2C92%22%20stroke%3D%22%2338507A%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20113%2C92%20Q%20125%2C98%20137%2C92%22%20stroke%3D%22%2338507A%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2082%2C122%20Q%20100%2C129%20118%2C122%22%20stroke%3D%22%2338507A%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%237898D0%22%20transform%3D%22rotate%2810%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%237898D0%22%20transform%3D%22rotate%28-10%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
  "1": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22b1%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23F0CCEA%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23CC80C8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23b1%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E08090%22%20opacity%3D%220.5%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E08090%22%20opacity%3D%220.5%22%2F%3E%3Cpath%20d%3D%22M%2065%2C88%20Q%2075%2C82%2085%2C88%22%20stroke%3D%22%235A3878%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20115%2C88%20Q%20125%2C82%20135%2C88%22%20stroke%3D%22%235A3878%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2078%2C126%20Q%20100%2C116%20122%2C126%22%20stroke%3D%22%235A3878%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2272%22%20cy%3D%2298%22%20r%3D%225%22%20fill%3D%22%2399C8FF%22%20opacity%3D%220.9%22%2F%3E%3Cpath%20d%3D%22M%2067%2C101%20Q%2072%2C112%2077%2C101%22%20fill%3D%22%2399C8FF%22%20opacity%3D%220.85%22%2F%3E%3Cpath%20d%3D%22M%2072%2C103%20Q%2069%2C116%2071%2C124%22%20stroke%3D%22%2399C8FF%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.7%22%2F%3E%3Ccircle%20cx%3D%22128%22%20cy%3D%2298%22%20r%3D%225%22%20fill%3D%22%2399C8FF%22%20opacity%3D%220.9%22%2F%3E%3Cpath%20d%3D%22M%20123%2C101%20Q%20128%2C112%20133%2C101%22%20fill%3D%22%2399C8FF%22%20opacity%3D%220.85%22%2F%3E%3Cpath%20d%3D%22M%20128%2C103%20Q%20131%2C116%20129%2C124%22%20stroke%3D%22%2399C8FF%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20opacity%3D%220.7%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%23CC80C8%22%20transform%3D%22rotate%28-10%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%23CC80C8%22%20transform%3D%22rotate%2810%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
};

const PERSONA_IMAGES: Record<string,string> = {
  "gentle": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Ctext%20x%3D%2240%22%20y%3D%2250%22%20font-size%3D%2212%22%20fill%3D%22%23A0B8F0%22%3E%E2%9C%A6%3C%2Ftext%3E%3Ctext%20x%3D%22148%22%20y%3D%2255%22%20font-size%3D%2210%22%20fill%3D%22%23A0B8F0%22%3E%E2%9C%A6%3C%2Ftext%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bg%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23CDD8F8%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2388A0E0%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23bg%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23F070A0%22%20opacity%3D%220.4%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23F070A0%22%20opacity%3D%220.4%22%2F%3E%3Cpath%20d%3D%22M%2067%2C86%20L%2067%2C96%20M%2062%2C91%20L%2072%2C91%22%20stroke%3D%22%232A3870%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2267%22%20cy%3D%2291%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%232A3870%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%20117%2C86%20L%20117%2C96%20M%20112%2C91%20L%20122%2C91%22%20stroke%3D%22%232A3870%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%22117%22%20cy%3D%2291%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%232A3870%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2083%2C119%20Q%20100%2C129%20117%2C119%22%20stroke%3D%22%232A3870%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22128%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2388A0E0%22%20transform%3D%22rotate%28-5%2026%20128%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22122%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2388A0E0%22%20transform%3D%22rotate%2822%20174%20122%29%22%2F%3E%3Cline%20x1%3D%22168%22%20y1%3D%22148%22%20x2%3D%22168%22%20y2%3D%22178%22%20stroke%3D%22%2360A060%22%20stroke-width%3D%223%22%2F%3E%3Ccircle%20cx%3D%22168%22%20cy%3D%22140%22%20r%3D%227%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22158%22%20cy%3D%22144%22%20r%3D%227%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22178%22%20cy%3D%22144%22%20r%3D%227%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22161%22%20cy%3D%22136%22%20r%3D%227%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22175%22%20cy%3D%22136%22%20r%3D%227%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%22168%22%20cy%3D%22140%22%20r%3D%226%22%20fill%3D%22%23FFE050%22%2F%3E%3C%2Fsvg%3E",
  "tough": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bt%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%239070CC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%235530A0%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23bt%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2258%22%20rx%3D%2220%22%20ry%3D%2214%22%20fill%3D%22white%22%20opacity%3D%220.15%22%2F%3E%3Crect%20x%3D%2226%22%20y%3D%2244%22%20width%3D%22148%22%20height%3D%2218%22%20rx%3D%229%22%20fill%3D%22%23CC2020%22%2F%3E%3Crect%20x%3D%2226%22%20y%3D%2247%22%20width%3D%22148%22%20height%3D%227%22%20rx%3D%223%22%20fill%3D%22%23FF4444%22%2F%3E%3Crect%20x%3D%2286%22%20y%3D%2244%22%20width%3D%2228%22%20height%3D%2218%22%20rx%3D%224%22%20fill%3D%22white%22%2F%3E%3Crect%20x%3D%2226%22%20y%3D%2253%22%20width%3D%22148%22%20height%3D%222%22%20rx%3D%221%22%20fill%3D%22white%22%20opacity%3D%220.4%22%2F%3E%3Cpath%20d%3D%22M%2060%2C84%20Q%2078%2C77%2088%2C82%22%20stroke%3D%22%23280848%22%20stroke-width%3D%224.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20112%2C82%20Q%20122%2C77%20140%2C84%22%20stroke%3D%22%23280848%22%20stroke-width%3D%224.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2274%22%20cy%3D%2295%22%20rx%3D%2210%22%20ry%3D%228%22%20fill%3D%22%231A0438%22%2F%3E%3Ccircle%20cx%3D%2277%22%20cy%3D%2292%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Cellipse%20cx%3D%22126%22%20cy%3D%2295%22%20rx%3D%2210%22%20ry%3D%228%22%20fill%3D%22%231A0438%22%2F%3E%3Ccircle%20cx%3D%22129%22%20cy%3D%2292%22%20r%3D%223%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2080%2C120%20Q%20100%2C115%20120%2C120%22%20stroke%3D%22%23280848%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2222%22%20cy%3D%22142%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22%235530A0%22%20transform%3D%22rotate%288%2022%20142%29%22%2F%3E%3Cellipse%20cx%3D%22178%22%20cy%3D%22142%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22%235530A0%22%20transform%3D%22rotate%28-8%20178%20142%29%22%2F%3E%3C%2Fsvg%3E",
  "wise": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Ctext%20x%3D%2216%22%20y%3D%2274%22%20font-size%3D%2214%22%20fill%3D%22%23FFD700%22%3E%E2%9C%A6%3C%2Ftext%3E%3Ctext%20x%3D%22162%22%20y%3D%2270%22%20font-size%3D%2212%22%20fill%3D%22%23FFD700%22%3E%E2%9C%A6%3C%2Ftext%3E%3Ctext%20x%3D%2228%22%20y%3D%22172%22%20font-size%3D%2210%22%20fill%3D%22%23FFD700%22%3E%E2%9C%A6%3C%2Ftext%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bw%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23D0C0F0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239070C0%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23bw%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E0A0C0%22%20opacity%3D%220.35%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23E0A0C0%22%20opacity%3D%220.35%22%2F%3E%3Ccircle%20cx%3D%2273%22%20cy%3D%2291%22%20r%3D%2217%22%20fill%3D%22none%22%20stroke%3D%22%23C8A020%22%20stroke-width%3D%223%22%2F%3E%3Ccircle%20cx%3D%22127%22%20cy%3D%2291%22%20r%3D%2217%22%20fill%3D%22none%22%20stroke%3D%22%23C8A020%22%20stroke-width%3D%223%22%2F%3E%3Cline%20x1%3D%2290%22%20y1%3D%2291%22%20x2%3D%22110%22%20y2%3D%2291%22%20stroke%3D%22%23C8A020%22%20stroke-width%3D%222.5%22%2F%3E%3Cline%20x1%3D%2246%22%20y1%3D%2288%22%20x2%3D%2256%22%20y2%3D%2290%22%20stroke%3D%22%23C8A020%22%20stroke-width%3D%222.5%22%2F%3E%3Cline%20x1%3D%22144%22%20y1%3D%2290%22%20x2%3D%22154%22%20y2%3D%2288%22%20stroke%3D%22%23C8A020%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2273%22%20cy%3D%2291%22%20r%3D%2214%22%20fill%3D%22%23FFE890%22%20opacity%3D%220.18%22%2F%3E%3Ccircle%20cx%3D%22127%22%20cy%3D%2291%22%20r%3D%2214%22%20fill%3D%22%23FFE890%22%20opacity%3D%220.18%22%2F%3E%3Cpath%20d%3D%22M%2063%2C92%20Q%2073%2C86%2083%2C92%22%20stroke%3D%22%233A2870%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%20117%2C92%20Q%20127%2C86%20137%2C92%22%20stroke%3D%22%233A2870%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2085%2C118%20Q%20100%2C126%20115%2C118%22%20stroke%3D%22%233A2870%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2227%22%20cy%3D%22132%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239070C0%22%20transform%3D%22rotate%28-5%2027%20132%29%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%22130%22%20width%3D%2222%22%20height%3D%2228%22%20rx%3D%223%22%20fill%3D%22%23B07830%22%20stroke%3D%22%23906020%22%20stroke-width%3D%221.5%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%22132%22%20width%3D%2210%22%20height%3D%2224%22%20rx%3D%222%22%20fill%3D%22%23C89040%22%2F%3E%3Cline%20x1%3D%2222%22%20y1%3D%22132%22%20x2%3D%2222%22%20y2%3D%22156%22%20stroke%3D%22%23906020%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%2214%22%20y1%3D%22138%22%20x2%3D%2220%22%20y2%3D%22138%22%20stroke%3D%22%23FFF8E0%22%20stroke-width%3D%221%22%20opacity%3D%220.7%22%2F%3E%3Cline%20x1%3D%2214%22%20y1%3D%22143%22%20x2%3D%2220%22%20y2%3D%22143%22%20stroke%3D%22%23FFF8E0%22%20stroke-width%3D%221%22%20opacity%3D%220.7%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22128%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%239070C0%22%20transform%3D%22rotate%285%20174%20128%29%22%2F%3E%3C%2Fsvg%3E",
  "fun": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20240%22%3E%3Ccircle%20cx%3D%2222%22%20cy%3D%2265%22%20r%3D%225%22%20fill%3D%22%23FF6B6B%22%2F%3E%3Ccircle%20cx%3D%22178%22%20cy%3D%2258%22%20r%3D%224%22%20fill%3D%22%234ECDC4%22%2F%3E%3Ccircle%20cx%3D%2228%22%20cy%3D%22162%22%20r%3D%224%22%20fill%3D%22%23FFE66D%22%2F%3E%3Ccircle%20cx%3D%22174%22%20cy%3D%22168%22%20r%3D%225%22%20fill%3D%22%23FF8A80%22%2F%3E%3Crect%20x%3D%22160%22%20y%3D%2284%22%20width%3D%228%22%20height%3D%225%22%20rx%3D%221%22%20fill%3D%22%23A78BFA%22%20transform%3D%22rotate%2830%20164%2087%29%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%22158%22%20width%3D%226%22%20height%3D%224%22%20rx%3D%221%22%20fill%3D%22%234ECDC4%22%20transform%3D%22rotate%28-20%2023%20160%29%22%2F%3E%3Cdefs%3E%3CradialGradient%20id%3D%22bf%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C0F0D0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2360C080%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2028%2C92%20A%2072%2C72%200%200%2C1%20172%2C92%20Q%20172%2C175%20100%2C228%20Q%2028%2C175%2028%2C92%20Z%22%20fill%3D%22url%28%23bf%29%22%2F%3E%3Cellipse%20cx%3D%2268%22%20cy%3D%2260%22%20rx%3D%2222%22%20ry%3D%2215%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23FF8080%22%20opacity%3D%220.55%22%2F%3E%3Cellipse%20cx%3D%22140%22%20cy%3D%22113%22%20rx%3D%2215%22%20ry%3D%2210%22%20fill%3D%22%23FF8080%22%20opacity%3D%220.55%22%2F%3E%3Cpolygon%20points%3D%22100%2C8%2058%2C54%20142%2C54%22%20fill%3D%22%23FF6B6B%22%2F%3E%3Cpolygon%20points%3D%22100%2C8%2079%2C31%20100%2C54%20121%2C31%22%20fill%3D%22%23FFD700%22%2F%3E%3Cpolygon%20points%3D%22100%2C8%20100%2C31%20121%2C31%22%20fill%3D%22%234ECDC4%22%2F%3E%3Crect%20x%3D%2256%22%20y%3D%2252%22%20width%3D%2288%22%20height%3D%228%22%20rx%3D%224%22%20fill%3D%22%23A78BFA%22%2F%3E%3Ctext%20x%3D%2294%22%20y%3D%2243%22%20font-size%3D%2214%22%20fill%3D%22white%22%3E%E2%98%85%3C%2Ftext%3E%3Ccircle%20cx%3D%2274%22%20cy%3D%2294%22%20r%3D%229%22%20fill%3D%22%231A5030%22%2F%3E%3Ccircle%20cx%3D%2277%22%20cy%3D%2291%22%20r%3D%223.5%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%20113%2C98%20Q%20125%2C87%20137%2C98%22%20stroke%3D%22%231A5030%22%20stroke-width%3D%224%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2076%2C118%20Q%20100%2C136%20124%2C118%22%20stroke%3D%22%231A5030%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%3Cellipse%20cx%3D%22100%22%20cy%3D%22130%22%20rx%3D%2215%22%20ry%3D%2211%22%20fill%3D%22%23FF8080%22%20stroke%3D%22%231A5030%22%20stroke-width%3D%221.5%22%2F%3E%3Cline%20x1%3D%22100%22%20y1%3D%22122%22%20x2%3D%22100%22%20y2%3D%22138%22%20stroke%3D%22%23CC5050%22%20stroke-width%3D%221.5%22%20opacity%3D%220.5%22%2F%3E%3Cellipse%20cx%3D%2226%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2360C080%22%20transform%3D%22rotate%28-38%2026%20130%29%22%2F%3E%3Cellipse%20cx%3D%22174%22%20cy%3D%22130%22%20rx%3D%2213%22%20ry%3D%229%22%20fill%3D%22%2360C080%22%20transform%3D%22rotate%2838%20174%20130%29%22%2F%3E%3C%2Fsvg%3E",
};

const JU_STICKERS: Record<string,string> = {
  "hi": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sh%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23DDD5FC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239080D8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sh%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2250%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2245%22%20cy%3D%2248%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%2276%22%20cy%3D%2250%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2277%22%20cy%3D%2248%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2050%2C66%20Q%2060%2C72%2070%2C66%22%20stroke%3D%22%233A2868%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%22106%22%20cy%3D%2244%22%20rx%3D%2212%22%20ry%3D%228%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%28-40%20106%2044%29%22%2F%3E%3Cellipse%20cx%3D%2214%22%20cy%3D%2272%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%285%2014%2072%29%22%2F%3E%3Cpath%20d%3D%22M%20102%2C30%20Q%20108%2C24%20114%2C30%20Q%20108%2C36%20102%2C30%22%20fill%3D%22none%22%20stroke%3D%22%23C0B0F0%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E",
  "zen": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sz%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C8D8F0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%238098C8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sz%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpath%20d%3D%22M%2038%2C50%20Q%2044%2C45%2050%2C50%22%20stroke%3D%22%23304070%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2070%2C50%20Q%2076%2C45%2082%2C50%22%20stroke%3D%22%23304070%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2046%2C62%20Q%2060%2C68%2074%2C62%22%20stroke%3D%22%23304070%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2260%22%20cy%3D%2262%22%20r%3D%2238%22%20fill%3D%22none%22%20stroke%3D%22%23B0C8F0%22%20stroke-width%3D%221.5%22%20opacity%3D%220.5%22%20stroke-dasharray%3D%223%2C4%22%2F%3E%3Ctext%20x%3D%2254%22%20y%3D%2222%22%20font-size%3D%2210%22%20fill%3D%22%238098C8%22%3E%E2%9C%A6%3C%2Ftext%3E%3Cellipse%20cx%3D%2218%22%20cy%3D%2282%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%238098C8%22%20transform%3D%22rotate%2815%2018%2082%29%22%2F%3E%3Cellipse%20cx%3D%22102%22%20cy%3D%2282%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%238098C8%22%20transform%3D%22rotate%28-15%20102%2082%29%22%2F%3E%3C%2Fsvg%3E",
  "diary": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sd%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23DDD5FC%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%239080D8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sd%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2250%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2245%22%20cy%3D%2248%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Ccircle%20cx%3D%2276%22%20cy%3D%2250%22%20r%3D%225%22%20fill%3D%22%233A2868%22%2F%3E%3Ccircle%20cx%3D%2277%22%20cy%3D%2248%22%20r%3D%222%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2050%2C66%20Q%2060%2C72%2070%2C66%22%20stroke%3D%22%233A2868%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%226%22%20y%3D%2268%22%20width%3D%2232%22%20height%3D%2226%22%20rx%3D%222%22%20fill%3D%22%23D4703A%22%20stroke%3D%22%23B05020%22%20stroke-width%3D%221.5%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%2270%22%20width%3D%2214%22%20height%3D%2222%22%20rx%3D%221%22%20fill%3D%22%23E89050%22%2F%3E%3Cline%20x1%3D%2222%22%20y1%3D%2270%22%20x2%3D%2222%22%20y2%3D%2292%22%20stroke%3D%22%23B05020%22%20stroke-width%3D%221.2%22%2F%3E%3Cline%20x1%3D%2210%22%20y1%3D%2276%22%20x2%3D%2218%22%20y2%3D%2276%22%20stroke%3D%22%23FFF8E0%22%20stroke-width%3D%221%22%20opacity%3D%220.7%22%2F%3E%3Cline%20x1%3D%2210%22%20y1%3D%2280%22%20x2%3D%2218%22%20y2%3D%2280%22%20stroke%3D%22%23FFF8E0%22%20stroke-width%3D%221%22%20opacity%3D%220.7%22%2F%3E%3Cellipse%20cx%3D%22102%22%20cy%3D%2272%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%28-8%20102%2072%29%22%2F%3E%3Cellipse%20cx%3D%2214%22%20cy%3D%2276%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%239080D8%22%20transform%3D%22rotate%2820%2014%2076%29%22%2F%3E%3C%2Fsvg%3E",
  "love": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sl%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23F0C8E0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23D888B8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sl%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpath%20d%3D%22M%2038%2C50%20Q%2044%2C44%2050%2C50%22%20stroke%3D%22%23882858%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2070%2C50%20Q%2076%2C44%2082%2C50%22%20stroke%3D%22%23882858%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2048%2C63%20Q%2060%2C72%2072%2C63%22%20stroke%3D%22%23882858%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2060%2C28%20C%2060%2C18%2048%2C14%2042%2C22%20C%2036%2C28%2042%2C36%2060%2C48%20C%2078%2C36%2084%2C28%2078%2C22%20C%2072%2C14%2060%2C18%2060%2C28%20Z%22%20fill%3D%22%23FF6090%22%20opacity%3D%220.9%22%2F%3E%3Cpath%20d%3D%22M%2060%2C28%20C%2060%2C22%2052%2C20%2048%2C25%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20opacity%3D%220.5%22%20stroke-linecap%3D%22round%22%2F%3E%3Cellipse%20cx%3D%2214%22%20cy%3D%2274%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%23D888B8%22%20transform%3D%22rotate%2810%2014%2074%29%22%2F%3E%3Cellipse%20cx%3D%22106%22%20cy%3D%2274%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%23D888B8%22%20transform%3D%22rotate%28-10%20106%2074%29%22%2F%3E%3C%2Fsvg%3E",
  "sleep": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22ss%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C0C8F0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%237880C8%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23ss%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpath%20d%3D%22M%2036%2C52%20Q%2044%2C56%2052%2C52%22%20stroke%3D%22%23284068%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2068%2C52%20Q%2076%2C56%2084%2C52%22%20stroke%3D%22%23284068%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2048%2C66%20Q%2060%2C70%2072%2C66%22%20stroke%3D%22%23284068%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ctext%20x%3D%2272%22%20y%3D%2230%22%20font-size%3D%2213%22%20fill%3D%22%239098D8%22%20font-weight%3D%22bold%22%3Ez%3C%2Ftext%3E%3Ctext%20x%3D%2284%22%20y%3D%2220%22%20font-size%3D%2216%22%20fill%3D%22%237080C0%22%20font-weight%3D%22bold%22%3Ez%3C%2Ftext%3E%3Ctext%20x%3D%2298%22%20y%3D%2210%22%20font-size%3D%2220%22%20fill%3D%22%235868B0%22%20font-weight%3D%22bold%22%3EZ%3C%2Ftext%3E%3Cellipse%20cx%3D%2214%22%20cy%3D%2280%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%237880C8%22%20transform%3D%22rotate%2815%2014%2080%29%22%2F%3E%3Cellipse%20cx%3D%22106%22%20cy%3D%2280%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%237880C8%22%20transform%3D%22rotate%28-15%20106%2080%29%22%2F%3E%3C%2Fsvg%3E",
  "yay": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%2220%22%20r%3D%224%22%20fill%3D%22%23FF6B6B%22%2F%3E%3Ccircle%20cx%3D%22104%22%20cy%3D%2215%22%20r%3D%223%22%20fill%3D%22%23FFD700%22%2F%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%2240%22%20r%3D%223%22%20fill%3D%22%234ECDC4%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2255%22%20r%3D%223%22%20fill%3D%22%23FF8A80%22%2F%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sy%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C0F0D0%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2360B878%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sy%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpolygon%20points%3D%2260%2C5%2044%2C32%2076%2C32%22%20fill%3D%22%23FF6B6B%22%2F%3E%3Cpolygon%20points%3D%2260%2C5%2052%2C18%2060%2C32%2068%2C18%22%20fill%3D%22%23FFD700%22%2F%3E%3Crect%20x%3D%2242%22%20y%3D%2230%22%20width%3D%2236%22%20height%3D%225%22%20rx%3D%222%22%20fill%3D%22%23A78BFA%22%2F%3E%3Cpath%20d%3D%22M%2036%2C52%20Q%2044%2C44%2052%2C52%22%20stroke%3D%22%23205030%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2068%2C52%20Q%2076%2C44%2084%2C52%22%20stroke%3D%22%23205030%22%20stroke-width%3D%223.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2042%2C62%20Q%2060%2C80%2078%2C62%22%20stroke%3D%22%23205030%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20fill%3D%22white%22%2F%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2271%22%20rx%3D%2217%22%20ry%3D%2210%22%20fill%3D%22white%22%2F%3E%3Cellipse%20cx%3D%2210%22%20cy%3D%2264%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%2360B878%22%20transform%3D%22rotate%28-35%2010%2064%29%22%2F%3E%3Cellipse%20cx%3D%22110%22%20cy%3D%2264%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%2360B878%22%20transform%3D%22rotate%2835%20110%2064%29%22%2F%3E%3C%2Fsvg%3E",
  "thinking": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sth%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23E8D8F8%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23A888D0%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sth%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpath%20d%3D%22M%2038%2C44%20Q%2046%2C40%2052%2C44%22%20stroke%3D%22%235030A0%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2244%22%20cy%3D%2252%22%20r%3D%226%22%20fill%3D%22%233A1878%22%2F%3E%3Ccircle%20cx%3D%2246%22%20cy%3D%2250%22%20r%3D%222.5%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M%2070%2C52%20Q%2076%2C48%2082%2C52%22%20stroke%3D%22%233A1878%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2050%2C66%20Q%2060%2C64%2068%2C68%22%20stroke%3D%22%233A1878%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Ccircle%20cx%3D%2286%22%20cy%3D%2226%22%20r%3D%224%22%20fill%3D%22%23C8B0E8%22%20opacity%3D%220.7%22%2F%3E%3Ccircle%20cx%3D%2296%22%20cy%3D%2218%22%20r%3D%226%22%20fill%3D%22%23C8B0E8%22%20opacity%3D%220.8%22%2F%3E%3Ccircle%20cx%3D%22108%22%20cy%3D%2210%22%20r%3D%228%22%20fill%3D%22%23C8B0E8%22%2F%3E%3Ctext%20x%3D%22104%22%20y%3D%2214%22%20font-size%3D%2210%22%20fill%3D%22%237050A0%22%3E%3F%3C%2Ftext%3E%3Cellipse%20cx%3D%2214%22%20cy%3D%2274%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%23A888D0%22%20transform%3D%22rotate%2810%2014%2074%29%22%2F%3E%3Cellipse%20cx%3D%22106%22%20cy%3D%2274%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%23A888D0%22%20transform%3D%22rotate%28-10%20106%2074%29%22%2F%3E%3C%2Fsvg%3E",
  "goodjob": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cdefs%3E%3CradialGradient%20id%3D%22sg%22%20cx%3D%2238%25%22%20cy%3D%2232%25%22%20r%3D%2265%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23C8F0D8%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2368B888%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M%2014%2C52%20A%2046%2C46%200%200%2C1%20106%2C52%20Q%20106%2C92%2060%2C112%20Q%2014%2C92%2014%2C52%20Z%22%20fill%3D%22url%28%23sg%29%22%2F%3E%3Cellipse%20cx%3D%2238%22%20cy%3D%2238%22%20rx%3D%2214%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.28%22%2F%3E%3Cpath%20d%3D%22M%2036%2C50%20Q%2044%2C43%2052%2C50%22%20stroke%3D%22%23205830%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2068%2C50%20Q%2076%2C43%2084%2C50%22%20stroke%3D%22%23205830%22%20stroke-width%3D%223%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M%2044%2C63%20Q%2060%2C74%2076%2C63%22%20stroke%3D%22%23205830%22%20stroke-width%3D%222.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%2F%3E%3Crect%20x%3D%2288%22%20y%3D%2256%22%20width%3D%2218%22%20height%3D%2230%22%20rx%3D%224%22%20fill%3D%22%2368B888%22%2F%3E%3Cpath%20d%3D%22M%2088%2C56%20Q%2082%2C50%2086%2C44%20Q%2090%2C36%2098%2C38%20Q%20104%2C38%20106%2C44%20L%20106%2C56%20Z%22%20fill%3D%22%2368B888%22%2F%3E%3Crect%20x%3D%2290%22%20y%3D%2282%22%20width%3D%2214%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%2350A070%22%2F%3E%3Ctext%20x%3D%2278%22%20y%3D%2230%22%20font-size%3D%2212%22%20fill%3D%22%2340A060%22%3E%E2%98%85%3C%2Ftext%3E%3Ctext%20x%3D%228%22%20y%3D%2224%22%20font-size%3D%2210%22%20fill%3D%22%2360C080%22%3E%E2%98%85%3C%2Ftext%3E%3Cellipse%20cx%3D%2212%22%20cy%3D%2274%22%20rx%3D%2210%22%20ry%3D%227%22%20fill%3D%22%2368B888%22%20transform%3D%22rotate%2810%2012%2074%29%22%2F%3E%3C%2Fsvg%3E",
};


const MOODS = [
  { label: "Rough", color: "#E8878C", value: 1 },
  { label: "Low", color: "#6C9BCF", value: 2 },
  { label: "Okay", color: "#FFB347", value: 3 },
  { label: "Good", color: "#95E1D3", value: 4 },
  { label: "Great", color: "#4ECDC4", value: 5 },
];

const MoodIcon = ({ value, size = 28, color = "#7C6EDB" }: { value: number; size?: number; color?: string }) => {
  const faces: Record<number, JSX.Element> = {
    1: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/><circle cx="11" cy="13" r="2" fill={color}/><circle cx="21" cy="13" r="2" fill={color}/><path d="M10 22 Q16 17 22 22" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M11 18 Q11 20 9 22" stroke="#88BBFF" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M21 18 Q21 20 23 22" stroke="#88BBFF" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>,
    2: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/><path d="M9 13 Q11 15 13 13" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M19 13 Q21 15 23 13" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M11 21 Q16 18 21 21" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,
    3: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/><circle cx="11" cy="14" r="2.5" fill={color}/><circle cx="21" cy="14" r="2.5" fill={color}/><line x1="11" y1="21" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
    4: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/><circle cx="11" cy="13" r="2.5" fill={color}/><circle cx="21" cy="13" r="2.5" fill={color}/><path d="M10 19 Q16 24 22 19" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,
    5: <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/><path d="M9 12 Q11 9 13 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M19 12 Q21 9 23 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M9 18 Q16 26 23 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="white"/><ellipse cx="16" cy="21" rx="5" ry="4" fill="white"/><text x="12" y="8" fontSize="8" fill={color}>✦</text></svg>,
  };
  return faces[value] || faces[3];
};

const PersonaIcon = ({ id, size = 18 }) => {
  const icons = {
    gentle: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 3 14 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 14 12 21 12 21Z" stroke="#B8C4F0" strokeWidth="1.5" fill="#B8C4F020"/></svg>,
    tough: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="#D4A0D0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="#D4A0D020"/></svg>,
    wise: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M2 3H8C9.06 3 10.08 3.42 10.83 4.17C11.58 4.92 12 5.94 12 7V21C12 20.2 11.68 19.43 11.12 18.88C10.56 18.32 9.8 18 9 18H2V3Z" stroke="#E8D5A3" strokeWidth="1.5" fill="#E8D5A320"/><path d="M22 3H16C14.94 3 13.92 3.42 13.17 4.17C12.42 4.92 12 5.94 12 7V21C12 20.2 12.32 19.43 12.88 18.88C13.44 18.32 14.2 18 15 18H22V3Z" stroke="#E8D5A3" strokeWidth="1.5" fill="#E8D5A320"/></svg>,
    fun: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 2L14.4 8.2L21 9L16 13.6L17.6 20.2L12 17L6.4 20.2L8 13.6L3 9L9.6 8.2L12 2Z" stroke="#A8E6CF" strokeWidth="1.5" fill="#A8E6CF20"/></svg>,
  };
  return icons[id] || null;
};

const AI_PERSONAS = [
  { id: "gentle", name: "Gentle Guide", color: "#B8C4F0", desc: "Warm, understanding, nurturing" },
  { id: "tough", name: "Tough Coach", color: "#D4A0D0", desc: "Direct, motivating, no excuses" },
  { id: "wise", name: "Wise Sage", color: "#E8D5A3", desc: "Thoughtful, philosophical, deep" },
  { id: "fun", name: "Fun Friend", color: "#A8E6CF", desc: "Playful, uplifting, honest" },
];

const PROMPTS = [
  "What made you smile today, even just a little?",
  "If your mood was a weather, what would it be right now?",
  "What's one thing you're proud of this week?",
  "Who made your day better today?",
  "What would you tell your past self from last month?",
  "What's weighing on your mind right now?",
  "Describe your perfect tomorrow in 3 sentences.",
  "What's a small win you haven't celebrated yet?",
];

// ============ i18n — multilingual ============
const LANG_META = [
  { code: "en", label: "English", flag: "EN" },
  { code: "id", label: "Indonesia", flag: "ID" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "pt", label: "Português", flag: "PT" },
  { code: "ja", label: "日本語", flag: "JA" },
  { code: "ko", label: "한국어", flag: "KO" },
  { code: "zh", label: "中文", flag: "ZH" },
  { code: "hi", label: "हिन्दी", flag: "HI" },
];

const LANG = {
  en: {
    greeting_morning: "Good morning", greeting_afternoon: "Good afternoon",
    greeting_evening: "Good evening", greeting_night: "Before you sleep...",
    greeting_late: "Can't sleep?", how_feeling: "How are you feeling?",
    write: "Write", talk: "Talk", todays_prompt: "Today's prompt",
    new_prompt: "New prompt", energy: "Energy level",
    drained: "Drained", energized: "Energized",
    home: "Home", insights_label: "Insights", coach_label: "Coach", pro_label: "Pro",
    mind_gallery: "Your Mind Gallery", weekly_mood: "This week's mood wave",
    month_glance: "Month at a glance", weekly_summary: "Ju's weekly summary",
    relationship_map: "Relationship Mood Map", unlock_pro: "Unlock with Pro",
    rel_desc: "See how the people in your life affect your mood",
    back: "Back", save: "Save", whats_on_mind: "What's on your mind?",
    ju_insight: "Ju's insight", done: "Done",
    ai_coach: "AI Coach", talk_to_ju: "Talk to Ju...",
    unlock_ju: "Unlock Ju's full power", monthly: "Monthly", annual: "Annual (save 33%)",
    current_plan: "Current plan", start_trial: "Start free trial",
    great: "Great", good: "Good", okay: "Okay", low: "Low", rough: "Rough",
    summary_has_entries: "This week you showed up for yourself. Your mood has been mostly positive with some natural dips. Keep journaling — every entry teaches me more about you.",
    summary_no_entries: "Start journaling and I'll share patterns I discover about your emotional world. Every entry helps me understand you better.",
    recording: "Recording...",
    onb_title_1: "Meet Ju", onb_desc_1: "Your AI journal companion who listens, understands, and grows with you.",
    onb_title_2: "30 seconds is all it takes", onb_desc_2: "Tap your mood, speak or write, and let AI reveal patterns you'd never notice.",
    onb_title_3: "Insights that matter", onb_desc_3: "Relationship maps, mood trends, and weekly reports — therapy-level clarity.",
    onb_title_4: "Pick your coach", onb_desc_4: "Gentle Guide, Tough Coach, Wise Sage, or Fun Friend. Ju adapts to your style.",
    onb_skip: "Skip", onb_next: "Next", onb_start: "Start journaling",
    settings: "Settings", dark_mode: "Dark mode", language: "Language",
    // Retention hooks
    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  id: {
    greeting_morning: "Selamat pagi", greeting_afternoon: "Selamat siang",
    greeting_evening: "Selamat malam", greeting_night: "Sebelum tidur...",
    greeting_late: "Belum bisa tidur?", how_feeling: "Apa kabar hari ini?",
    write: "Tulis", talk: "Bicara", todays_prompt: "Prompt hari ini",
    new_prompt: "Ganti prompt", energy: "Level energi",
    drained: "Capek", energized: "Berenergi",
    home: "Beranda", insights_label: "Insight", coach_label: "Coach", pro_label: "Pro",
    mind_gallery: "Galeri Pikiranmu", weekly_mood: "Mood minggu ini",
    month_glance: "Sebulan sekilas", weekly_summary: "Ringkasan Ju",
    relationship_map: "Peta Mood Relasi", unlock_pro: "Buka dengan Pro",
    rel_desc: "Lihat bagaimana orang di hidupmu mempengaruhi mood-mu",
    back: "Kembali", save: "Simpan", whats_on_mind: "Apa yang ada di pikiranmu?",
    ju_insight: "Insight dari Ju", done: "Selesai",
    ai_coach: "AI Coach", talk_to_ju: "Ngobrol sama Ju...",
    unlock_ju: "Buka kekuatan penuh Ju", monthly: "Bulanan", annual: "Tahunan (hemat 33%)",
    current_plan: "Paket saat ini", start_trial: "Coba gratis",
    great: "Senang", good: "Baik", okay: "Biasa", low: "Murung", rough: "Berat",
    summary_has_entries: "Minggu ini kamu hadir buat dirimu sendiri. Mood-mu kebanyakan positif dengan beberapa penurunan alami. Terus menulis — setiap entri mengajarkan Ju lebih banyak tentangmu.",
    summary_no_entries: "Mulai menulis dan Ju akan berbagi pola yang ditemukan tentang dunia emosionalmu. Setiap entri membantu Ju memahami kamu lebih baik.",
    recording: "Merekam...",
    onb_title_1: "Kenalan sama Ju", onb_desc_1: "Teman jurnal AI yang mendengarkan, memahami, dan tumbuh bersamamu.",
    onb_title_2: "Cuma butuh 30 detik", onb_desc_2: "Tap mood-mu, bicara atau tulis, biarkan AI menemukan pola yang belum pernah kamu sadari.",
    onb_title_3: "Insight yang bermakna", onb_desc_3: "Peta relasi, tren mood, dan laporan mingguan — kejelasan setara terapi.",
    onb_title_4: "Pilih coach-mu", onb_desc_4: "Lembut, Tegas, Bijak, atau Seru. Ju menyesuaikan gayamu.",
    onb_skip: "Lewati", onb_next: "Lanjut", onb_start: "Mulai menulis",
    settings: "Pengaturan", dark_mode: "Mode gelap", language: "Bahasa",

    signup_title: "Ju kenal kamu sekarang", signup_desc: "Kamu sudah menulis {n} entri. Buat akun untuk menjaga jurnalmu selamanya.",
    signup_btn: "Simpan jurnal saya", signup_later: "Nanti aja",
    mood_trend: "Tren Mood 30 Hari", mood_avg: "Rata-rata", mood_best: "Hari terbaik", mood_streak_label: "Streak saat ini",
    entries_total: "Total entri", improvement: "vs bulan lalu",
    history_locked: "Entri lama terkunci", history_unlock: "Upgrade ke Plus untuk lihat semua",
    ju_remembers: "Ju ingat", ju_memory_desc: "Dari {n} entri sebelumnya, Ju menyadari:",
    ju_pattern_1: "Kamu cenderung merasa lebih baik di akhir pekan",
    ju_pattern_2: "Menulis di malam hari memperbaiki mood pagi berikutnya",
    ju_pattern_3: "Mood-mu sedang tren naik bulan ini",
  },
  es: {
    greeting_morning: "Buenos días", greeting_afternoon: "Buenas tardes",
    greeting_evening: "Buenas noches", greeting_night: "Antes de dormir...",
    greeting_late: "No puedes dormir?", how_feeling: "Cómo te sientes?",
    write: "Escribir", talk: "Hablar", todays_prompt: "Tema del día",
    new_prompt: "Nuevo tema", energy: "Nivel de energía",
    drained: "Agotado", energized: "Energizado",
    home: "Inicio", insights_label: "Datos", coach_label: "Coach", pro_label: "Pro",
    mind_gallery: "Tu galería mental", weekly_mood: "Ánimo de la semana",
    month_glance: "Vista del mes", weekly_summary: "Resumen de Ju",
    relationship_map: "Mapa de relaciones", unlock_pro: "Desbloquear con Pro",
    rel_desc: "Mira cómo las personas en tu vida afectan tu ánimo",
    back: "Atrás", save: "Guardar", whats_on_mind: "Qué tienes en mente?",
    ju_insight: "Reflexión de Ju", done: "Listo",
    ai_coach: "Coach IA", talk_to_ju: "Habla con Ju...",
    unlock_ju: "Desbloquea todo el poder de Ju", monthly: "Mensual", annual: "Anual (ahorra 33%)",
    current_plan: "Plan actual", start_trial: "Prueba gratis",
    great: "Genial", good: "Bien", okay: "Normal", low: "Bajo", rough: "Difícil",
    summary_has_entries: "Esta semana te presentaste para ti mismo. Tu ánimo ha sido mayormente positivo. Sigue escribiendo — cada entrada me enseña más sobre ti.",
    summary_no_entries: "Empieza a escribir y compartiré los patrones que descubra sobre tu mundo emocional.",
    recording: "Grabando...",
    onb_title_1: "Conoce a Ju", onb_desc_1: "Tu compañero de diario IA que escucha, entiende y crece contigo.",
    onb_title_2: "Solo 30 segundos", onb_desc_2: "Toca tu estado, habla o escribe, y deja que la IA revele patrones.",
    onb_title_3: "Datos que importan", onb_desc_3: "Mapas de relaciones, tendencias de ánimo e informes semanales.",
    onb_title_4: "Elige tu coach", onb_desc_4: "Gentil, Directo, Sabio o Divertido. Ju se adapta a tu estilo.",
    onb_skip: "Saltar", onb_next: "Siguiente", onb_start: "Empezar a escribir",
    settings: "Ajustes", dark_mode: "Modo oscuro", language: "Idioma",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  pt: {
    greeting_morning: "Bom dia", greeting_afternoon: "Boa tarde",
    greeting_evening: "Boa noite", greeting_night: "Antes de dormir...",
    greeting_late: "Sem sono?", how_feeling: "Como você está?",
    write: "Escrever", talk: "Falar", todays_prompt: "Tema do dia",
    new_prompt: "Novo tema", energy: "Nível de energia",
    drained: "Esgotado", energized: "Energizado",
    home: "Início", insights_label: "Dados", coach_label: "Coach", pro_label: "Pro",
    mind_gallery: "Sua galeria mental", weekly_mood: "Humor da semana",
    month_glance: "Visão do mês", weekly_summary: "Resumo do Ju",
    relationship_map: "Mapa de relações", unlock_pro: "Liberar com Pro",
    rel_desc: "Veja como as pessoas na sua vida afetam seu humor",
    back: "Voltar", save: "Salvar", whats_on_mind: "O que está na sua mente?",
    ju_insight: "Reflexão do Ju", done: "Pronto",
    ai_coach: "Coach IA", talk_to_ju: "Fale com Ju...",
    unlock_ju: "Libere todo o poder do Ju", monthly: "Mensal", annual: "Anual (economia de 33%)",
    current_plan: "Plano atual", start_trial: "Teste grátis",
    great: "Ótimo", good: "Bom", okay: "Normal", low: "Baixo", rough: "Difícil",
    summary_has_entries: "Esta semana você se dedicou a si mesmo. Seu humor foi principalmente positivo. Continue escrevendo — cada entrada me ensina mais sobre você.",
    summary_no_entries: "Comece a escrever e compartilharei padrões que descobrir sobre seu mundo emocional.",
    recording: "Gravando...",
    onb_title_1: "Conheça Ju", onb_desc_1: "Seu companheiro de diário IA que ouve, entende e cresce com você.",
    onb_title_2: "Só 30 segundos", onb_desc_2: "Toque seu humor, fale ou escreva, e deixe a IA revelar padrões.",
    onb_title_3: "Dados que importam", onb_desc_3: "Mapas de relações, tendências de humor e relatórios semanais.",
    onb_title_4: "Escolha seu coach", onb_desc_4: "Gentil, Direto, Sábio ou Divertido. Ju se adapta ao seu estilo.",
    onb_skip: "Pular", onb_next: "Próximo", onb_start: "Começar a escrever",
    settings: "Configurações", dark_mode: "Modo escuro", language: "Idioma",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  ja: {
    greeting_morning: "おはようございます", greeting_afternoon: "こんにちは",
    greeting_evening: "こんばんは", greeting_night: "おやすみ前に...",
    greeting_late: "眠れませんか？", how_feeling: "今日の気分は？",
    write: "書く", talk: "話す", todays_prompt: "今日のお題",
    new_prompt: "次のお題", energy: "エネルギー",
    drained: "疲れた", energized: "元気",
    home: "ホーム", insights_label: "分析", coach_label: "コーチ", pro_label: "Pro",
    mind_gallery: "こころのギャラリー", weekly_mood: "今週の気分",
    month_glance: "月間ビュー", weekly_summary: "Juの週間まとめ",
    relationship_map: "人間関係マップ", unlock_pro: "Proで解放",
    rel_desc: "周りの人があなたの気分にどう影響しているか見てみよう",
    back: "戻る", save: "保存", whats_on_mind: "今、何を考えていますか？",
    ju_insight: "Juの気づき", done: "完了",
    ai_coach: "AIコーチ", talk_to_ju: "Juと話す...",
    unlock_ju: "Juの全力を解放", monthly: "月額", annual: "年額（33%お得）",
    current_plan: "現在のプラン", start_trial: "無料で試す",
    great: "最高", good: "良い", okay: "普通", low: "落ち込み", rough: "つらい",
    summary_has_entries: "今週もよく頑張りました。気分は全体的にポジティブでした。書き続けてください — 一つ一つの記録があなたをもっと理解する助けになります。",
    summary_no_entries: "書き始めると、あなたの感情の世界のパターンを共有します。",
    recording: "録音中...",
    onb_title_1: "Juに会おう", onb_desc_1: "聞いて、理解して、一緒に成長するAIジャーナルの仲間。",
    onb_title_2: "たった30秒", onb_desc_2: "気分をタップ、話すか書くだけ。AIがパターンを見つけます。",
    onb_title_3: "大切な気づき", onb_desc_3: "人間関係マップ、気分の傾向、週間レポート。",
    onb_title_4: "コーチを選ぼう", onb_desc_4: "優しい、厳しい、賢い、楽しい。Juがあなたに合わせます。",
    onb_skip: "スキップ", onb_next: "次へ", onb_start: "書き始める",
    settings: "設定", dark_mode: "ダークモード", language: "言語",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  ko: {
    greeting_morning: "좋은 아침이에요", greeting_afternoon: "좋은 오후예요",
    greeting_evening: "좋은 저녁이에요", greeting_night: "자기 전에...",
    greeting_late: "잠이 안 오나요?", how_feeling: "오늘 기분이 어때요?",
    write: "쓰기", talk: "말하기", todays_prompt: "오늘의 주제",
    new_prompt: "새 주제", energy: "에너지",
    drained: "지침", energized: "활력",
    home: "홈", insights_label: "인사이트", coach_label: "코치", pro_label: "Pro",
    mind_gallery: "마음 갤러리", weekly_mood: "이번 주 기분",
    month_glance: "월간 보기", weekly_summary: "Ju의 주간 요약",
    relationship_map: "관계 기분 맵", unlock_pro: "Pro로 잠금 해제",
    rel_desc: "주변 사람들이 당신의 기분에 어떤 영향을 주는지 확인하세요",
    back: "뒤로", save: "저장", whats_on_mind: "무슨 생각을 하고 있나요?",
    ju_insight: "Ju의 인사이트", done: "완료",
    ai_coach: "AI 코치", talk_to_ju: "Ju와 대화...",
    unlock_ju: "Ju의 잠재력 해제", monthly: "월간", annual: "연간 (33% 절약)",
    current_plan: "현재 플랜", start_trial: "무료 체험",
    great: "최고", good: "좋음", okay: "보통", low: "우울", rough: "힘듦",
    summary_has_entries: "이번 주 잘 해냈어요. 기분이 대체로 긍정적이었어요. 계속 써주세요 — 매 기록이 당신을 더 잘 이해하는 데 도움이 돼요.",
    summary_no_entries: "일기를 쓰기 시작하면 감정 세계의 패턴을 공유할게요.",
    recording: "녹음 중...",
    onb_title_1: "Ju를 만나세요", onb_desc_1: "듣고, 이해하고, 함께 성장하는 AI 일기 친구.",
    onb_title_2: "30초면 충분해요", onb_desc_2: "기분을 탭하고, 말하거나 쓰세요. AI가 패턴을 찾아줍니다.",
    onb_title_3: "의미 있는 인사이트", onb_desc_3: "관계 맵, 기분 트렌드, 주간 리포트.",
    onb_title_4: "코치를 선택하세요", onb_desc_4: "따뜻한, 강한, 지혜로운, 재미있는. Ju가 맞춰줍니다.",
    onb_skip: "건너뛰기", onb_next: "다음", onb_start: "일기 쓰기 시작",
    settings: "설정", dark_mode: "다크 모드", language: "언어",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  zh: {
    greeting_morning: "早上好", greeting_afternoon: "下午好",
    greeting_evening: "晚上好", greeting_night: "睡前...",
    greeting_late: "睡不着？", how_feeling: "今天感觉怎么样？",
    write: "写", talk: "说", todays_prompt: "今日话题",
    new_prompt: "换一个", energy: "能量",
    drained: "疲惫", energized: "精力充沛",
    home: "首页", insights_label: "洞察", coach_label: "教练", pro_label: "Pro",
    mind_gallery: "心灵画廊", weekly_mood: "本周心情",
    month_glance: "月度概览", weekly_summary: "Ju的周总结",
    relationship_map: "关系情绪图", unlock_pro: "升级Pro解锁",
    rel_desc: "看看你身边的人如何影响你的情绪",
    back: "返回", save: "保存", whats_on_mind: "你在想什么？",
    ju_insight: "Ju的洞察", done: "完成",
    ai_coach: "AI教练", talk_to_ju: "和Ju聊天...",
    unlock_ju: "解锁Ju的全部能力", monthly: "月付", annual: "年付（省33%）",
    current_plan: "当前方案", start_trial: "免费试用",
    great: "很棒", good: "不错", okay: "一般", low: "低落", rough: "很难",
    summary_has_entries: "这周你为自己出现了。你的情绪总体积极。继续写吧——每一篇都帮助我更了解你。",
    summary_no_entries: "开始写作，我会分享我发现的关于你情感世界的模式。",
    recording: "录音中...",
    onb_title_1: "认识Ju", onb_desc_1: "你的AI日记伙伴，倾听、理解，与你一起成长。",
    onb_title_2: "只需30秒", onb_desc_2: "点选心情，说或写，让AI发现你从未注意到的模式。",
    onb_title_3: "有意义的洞察", onb_desc_3: "关系图、情绪趋势和周报——治疗级的清晰度。",
    onb_title_4: "选择教练", onb_desc_4: "温柔、严格、智慧或有趣。Ju适应你的风格。",
    onb_skip: "跳过", onb_next: "下一步", onb_start: "开始写作",
    settings: "设置", dark_mode: "深色模式", language: "语言",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
  hi: {
    greeting_morning: "सुप्रभात", greeting_afternoon: "नमस्ते",
    greeting_evening: "शुभ संध्या", greeting_night: "सोने से पहले...",
    greeting_late: "नींद नहीं आ रही?", how_feeling: "आज कैसा महसूस हो रहा है?",
    write: "लिखें", talk: "बोलें", todays_prompt: "आज का विषय",
    new_prompt: "नया विषय", energy: "ऊर्जा",
    drained: "थका हुआ", energized: "ऊर्जावान",
    home: "होम", insights_label: "इनसाइट", coach_label: "कोच", pro_label: "Pro",
    mind_gallery: "मन की गैलरी", weekly_mood: "इस हफ्ते का मूड",
    month_glance: "महीने की झलक", weekly_summary: "Ju का साप्ताहिक सारांश",
    relationship_map: "रिश्ते का मूड मैप", unlock_pro: "Pro से अनलॉक करें",
    rel_desc: "देखें कि आपके जीवन के लोग आपके मूड को कैसे प्रभावित करते हैं",
    back: "वापस", save: "सेव", whats_on_mind: "आपके मन में क्या है?",
    ju_insight: "Ju की सोच", done: "हो गया",
    ai_coach: "AI कोच", talk_to_ju: "Ju से बात करें...",
    unlock_ju: "Ju की पूरी शक्ति अनलॉक करें", monthly: "मासिक", annual: "वार्षिक (33% बचत)",
    current_plan: "वर्तमान प्लान", start_trial: "मुफ्त में आज़माएं",
    great: "बहुत अच्छा", good: "अच्छा", okay: "ठीक", low: "उदास", rough: "कठिन",
    summary_has_entries: "इस हफ्ते आपने खुद के लिए समय निकाला। आपका मूड ज्यादातर सकारात्मक रहा। लिखते रहें — हर एंट्री मुझे आपको बेहतर समझने में मदद करती है।",
    summary_no_entries: "लिखना शुरू करें और मैं आपकी भावनात्मक दुनिया के पैटर्न साझा करूंगा।",
    recording: "रिकॉर्ड हो रहा है...",
    onb_title_1: "Ju से मिलें", onb_desc_1: "आपका AI जर्नल साथी जो सुनता है, समझता है, और आपके साथ बढ़ता है।",
    onb_title_2: "सिर्फ 30 सेकंड", onb_desc_2: "अपना मूड चुनें, बोलें या लिखें, AI पैटर्न खोजेगा।",
    onb_title_3: "महत्वपूर्ण इनसाइट", onb_desc_3: "रिश्तों का मैप, मूड ट्रेंड, और साप्ताहिक रिपोर्ट।",
    onb_title_4: "अपना कोच चुनें", onb_desc_4: "कोमल, सख्त, बुद्धिमान, या मज़ेदार। Ju आपकी शैली में ढलता है।",
    onb_skip: "छोड़ें", onb_next: "अगला", onb_start: "लिखना शुरू करें",
    settings: "सेटिंग्स", dark_mode: "डार्क मोड", language: "भाषा",

    signup_title: "Ju knows you now", signup_desc: "You've written {n} entries. Create an account to keep your journal safe forever.",
    signup_btn: "Save my journal", signup_later: "Maybe later",
    mood_trend: "30-Day Mood Trend", mood_avg: "Avg mood", mood_best: "Best day", mood_streak_label: "Current streak",
    entries_total: "Total entries", improvement: "vs last month",
    history_locked: "Older entries locked", history_unlock: "Upgrade to Plus to see all history",
    ju_remembers: "Ju remembers", ju_memory_desc: "Based on your past {n} entries, Ju noticed:",
    ju_pattern_1: "You tend to feel better on weekends",
    ju_pattern_2: "Writing in the evening improves your next morning mood",
    ju_pattern_3: "Your mood has been trending upward this month",
  },
};

const PROMPTS_ID = [
  "Apa yang bikin kamu senyum hari ini, sekecil apapun?",
  "Kalau mood kamu jadi cuaca, cuaca apa sekarang?",
  "Apa satu hal yang kamu banggakan minggu ini?",
  "Siapa yang bikin harimu lebih baik hari ini?",
  "Apa yang ingin kamu bilang ke dirimu sebulan lalu?",
  "Apa yang lagi membebani pikiranmu?",
  "Ceritakan hari sempurnamu besok dalam 3 kalimat.",
  "Apa kemenangan kecil yang belum kamu rayakan?",
];

const DARK_THEME = {
  bg: "#13111C", bgCard: "rgba(30,27,45,0.9)", bgGrad1: "#13111C", bgGrad2: "#1A1730", bgGrad3: "#1E1B36",
  text: "#E8E4F8", textMuted: "#9B93C0", border: "rgba(124,110,219,0.15)",
  navBg: "rgba(19,17,28,0.95)", inputBg: "#1E1B36", cardBg: "rgba(30,27,45,0.8)",
};
const LIGHT_THEME = {
  bg: "#FAFAF7", bgCard: "rgba(255,255,255,0.8)", bgGrad1: "#F5F3FF", bgGrad2: "#EDE9FE", bgGrad3: "#E8E4F8",
  text: "#1A1A2E", textMuted: "#666", border: "rgba(124,110,219,0.08)",
  navBg: "rgba(255,255,255,0.95)", inputBg: "#FAFAF7", cardBg: "rgba(255,255,255,0.8)",
};

// ============ ONBOARDING ============
function OnboardingScreen({ onComplete, t }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: t.onb_title_1, desc: t.onb_desc_1, color: "#7C6EDB" },
    { title: t.onb_title_2, desc: t.onb_desc_2, color: "#4ECDC4" },
    { title: t.onb_title_3, desc: t.onb_desc_3, color: "#FFB347" },
    { title: t.onb_title_4, desc: t.onb_desc_4, color: "#E8878C" },
  ];
  const s = steps[step];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 24px", textAlign: "center",
      background: `linear-gradient(180deg, ${s.color}10, ${s.color}05, #F5F3FF)`,
      transition: "background 0.5s ease",
    }}>
      <div style={{ margin: "0 auto", animation: "juFloat 3s ease-in-out infinite" }}>
        <img src={JU_STICKERS.hi || JU_IMAGES.main} alt="Ju" style={{
          width: 120, height: "auto",
          filter: `drop-shadow(0 0 30px ${s.color}40)`,
          transition: "filter 0.5s ease",
        }} />
      </div>

      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A2E", marginTop: 40, fontFamily: "var(--font-serif, Georgia, serif)", animation: "fadeUp 0.4s ease" }}>
        {s.title}
      </h2>
      <p style={{ fontSize: 16, color: "#777", lineHeight: 1.7, maxWidth: 320, marginTop: 12, animation: "fadeUp 0.4s ease 0.1s both" }}>
        {s.desc}
      </p>

      <div style={{ display: "flex", gap: 6, marginTop: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? "#7C6EDB" : "#D4CCF0",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 32, width: "100%", maxWidth: 320 }}>
        {step < 3 ? (
          <>
            <button onClick={onComplete} style={{
              flex: 1, padding: 14, borderRadius: 14, border: "1.5px solid #D4CCF0",
              background: "transparent", color: "#999", fontSize: 15, fontWeight: 500, cursor: "pointer",
            }}>{t.onb_skip}</button>
            <button onClick={() => setStep(step + 1)} style={{
              flex: 2, padding: 14, borderRadius: 14, border: "none",
              background: "#7C6EDB", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(124,110,219,0.3)",
            }}>{t.onb_next}</button>
          </>
        ) : (
          <button onClick={onComplete} style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: "#7C6EDB", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 24px rgba(124,110,219,0.35)",
          }}>{t.onb_start}</button>
        )}
      </div>
    </div>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen({ onNavigate, dark, setDark, lang, setLang, t, theme }) {
  return (
    <div style={{ padding: "20px", minHeight: "100vh", background: dark ? theme.bg : `linear-gradient(180deg, ${theme.bgGrad1}, ${theme.bgGrad3})` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", fontSize: 13, color: dark ? "#B0A8D8" : "#8B7FD4", cursor: "pointer" }}>{t.back}</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{t.settings}</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ background: theme.cardBg, borderRadius: 20, padding: 4, border: `1px solid ${theme.border}`, backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{t.dark_mode}</div>
          </div>
          <button onClick={() => setDark(!dark)} style={{
            width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
            background: dark ? "#7C6EDB" : "#D4CCF0", position: "relative", transition: "background 0.3s",
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: dark ? "#1E1B36" : "#fff",
              position: "absolute", top: 3, transition: "left 0.3s",
              left: dark ? 23 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }} />
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{t.language}</div>
          </div>
          <div style={{ display: "flex", gap: 4, background: dark ? "#1E1B36" : "#F0EDF8", borderRadius: 10, padding: 3, flexWrap: "wrap" }}>
            {LANG_META.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                padding: "6px 12px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600,
                background: lang === l.code ? "#7C6EDB" : "transparent",
                color: lang === l.code ? "#fff" : theme.textMuted, cursor: "pointer",
              }}>{l.flag}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const JU_STATES = {
  5: { glow: "0 0 30px rgba(78,205,196,0.5)", msg: "You're glowing today!" },
  4: { glow: "0 0 20px rgba(149,225,211,0.4)", msg: "Nice vibes! Keep it up." },
  3: { glow: "0 0 15px rgba(255,179,71,0.3)", msg: "I'm here for you, always." },
  2: { glow: "0 0 15px rgba(108,155,207,0.3)", msg: "It's okay to not be okay." },
  1: { glow: "0 0 20px rgba(232,135,140,0.4)", msg: "I'm holding space for you." },
};

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 6) return t.greeting_late;
  if (h < 12) return t.greeting_morning;
  if (h < 17) return t.greeting_afternoon;
  if (h < 21) return t.greeting_evening;
  return t.greeting_night;
}

function generateInsight(mood, text) {
  const insights = {
    5: ["Your positive energy is contagious! Notice what triggered this joy — it's worth repeating.", "Celebrate this moment. Your mind remembers what you reinforce."],
    4: ["Good days are built from small moments. Which one stood out today?", "You're on a positive track. Your consistency is building something beautiful."],
    3: ["Neutral days are underrated — they're the foundation for growth.", "Sometimes 'okay' is perfectly fine. Not every day needs to be extraordinary."],
    2: ["Thank you for being honest with yourself. That takes courage.", "Low moments are temporary visitors, not permanent residents."],
    1: ["I see you showing up even when it's hard. That matters more than you know.", "Your feelings are valid. Let this journal hold them for you."],
  };
  return insights[mood][Math.floor(Math.random() * 2)];
}

function MascotJu({ mood = 3, size = 120, speaking = false, message = "", personaColor = null }) {
  const state = JU_STATES[mood] || JU_STATES[3];
  const imgSrc = JU_IMAGES[mood] || JU_IMAGES.main;
  const glowColor = personaColor ? `0 0 25px ${personaColor}60` : state.glow;

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={{
          width: size, height: size, borderRadius: size * 0.25,
          background: "rgba(255,255,255,0.90)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: glowColor,
          animation: "juFloat 3s ease-in-out infinite",
          overflow: "hidden",
          transition: "all 0.5s ease",
        }}>
          <img
            src={imgSrc}
            alt="Ju"
            style={{
              width: size * 0.92,
              height: size * 0.92,
              objectFit: "contain",
              filter: personaColor ? `hue-rotate(${personaColor === '#B8C4F0' ? '0' : personaColor === '#D4A0D0' ? '280' : personaColor === '#E8D5A3' ? '40' : '120'}deg)` : undefined,
              transition: "filter 0.5s ease",
            }}
          />
        </div>
        {personaColor && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: `radial-gradient(circle, ${personaColor}15 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
        )}
      </div>
      {message && (
        <div style={{
          marginTop: 8, padding: "8px 16px",
          background: personaColor ? `${personaColor}15` : "rgba(124,110,219,0.08)",
          borderRadius: 16, fontSize: 13,
          color: personaColor || "#7C6EDB", fontStyle: "italic",
          maxWidth: 220, margin: "8px auto 0", lineHeight: 1.5,
          animation: "fadeUp 0.5s ease",
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

function StreakBadge({ streak }) {
  if (!streak) return null;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 20,
      background: streak >= 7 ? "linear-gradient(135deg, #FFB347, #FF6B6B)" : "rgba(124,110,219,0.1)",
      color: streak >= 7 ? "#fff" : "#7C6EDB",
      fontSize: 12, fontWeight: 600,
    }}>
      {streak} day{streak > 1 ? "s" : ""}
    </div>
  );
}

// ============ SCREENS ============

function HomeScreen({ onNavigate, entries, streak, t, theme, dark }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [energy, setEnergy] = useState(50);
  const [showInsight, setShowInsight] = useState(false);
  const [promptIdx, setPromptIdx] = useState(Math.floor(Math.random() * PROMPTS.length));
  const [showConfetti, setShowConfetti] = useState(false);
  const lastMood = entries.length > 0 ? entries[0].mood : 3;

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    setShowInsight(true);
    haptic(mood >= 4 ? "success" : "medium");
    if (mood === 5) setShowConfetti(true);
    setTimeout(() => setShowInsight(false), 3000);
  };

  return (
    <div style={{ padding: "24px 20px", minHeight: "100vh", background: dark ? "linear-gradient(180deg, #13111C, #1A1730, #1E1B36)" : "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 50%, #E8E4F8 100%)", position: "relative", overflow: "hidden" }}>
      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 500 }}>{getGreeting(t)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* #4 Enhanced streak with fire animation */}
        {streak > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 12px", borderRadius: 20,
            background: streak >= 7 ? "linear-gradient(135deg, #FFB347, #FF6B6B)" : "rgba(124,110,219,0.1)",
            color: streak >= 7 ? "#fff" : "#7C6EDB",
            fontSize: 12, fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: streak >= 3 ? "streakFire 0.8s ease infinite" : "none" }}>
              <path d="M12 2C12 2 6 8 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 8 12 2 12 2Z" fill={streak >= 7 ? "#fff" : "#7C6EDB"} opacity="0.8"/>
              <path d="M12 9C12 9 9 12 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 12 12 9 12 9Z" fill={streak >= 7 ? "#FFD700" : "#B8C4F0"}/>
            </svg>
            <AnimatedNumber value={streak} duration={600} /> day{streak > 1 ? "s" : ""}
          </div>
        )}
        <button onClick={() => onNavigate("settings")} {...pressHandlers()} style={{
          width: 34, height: 34, borderRadius: "50%", border: "none",
          background: dark ? "rgba(124,110,219,0.2)" : "rgba(124,110,219,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center", ...pressStyle,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z" stroke={dark ? "#B0A8D8" : "#7C6EDB"} strokeWidth="2"/>
            <path d="M19.4 15C19.12 15.68 19.22 16.46 19.73 16.82L19.79 16.88C20.16 17.25 20.38 17.75 20.38 18.3C20.38 18.84 20.16 19.34 19.79 19.71C19.42 20.08 18.92 20.3 18.38 20.3C17.83 20.3 17.33 20.08 16.96 19.71L16.9 19.65C16.36 19.14 15.51 19.01 14.8 19.4C14.1 19.78 13.66 20.5 13.66 21.3V21.5C13.66 22.6 12.76 23.5 11.66 23.5C10.56 23.5 9.66 22.6 9.66 21.5V21.3C9.63 20.47 9.12 19.74 8.36 19.4C7.65 19.01 6.8 19.14 6.26 19.65L6.2 19.71C5.45 20.46 4.25 20.46 3.5 19.71C2.75 18.96 2.75 17.76 3.5 17.01L3.56 16.95C4.07 16.41 4.2 15.56 3.81 14.85C3.43 14.17 2.71 13.73 1.91 13.73H1.66C0.56 13.73 -0.34 12.83 -0.34 11.73C-0.34 10.63 0.56 9.73 1.66 9.73H1.91C2.74 9.7 3.47 9.19 3.81 8.43C4.2 7.72 4.07 6.87 3.56 6.33L3.5 6.27C2.75 5.52 2.75 4.32 3.5 3.57C4.25 2.82 5.45 2.82 6.2 3.57L6.26 3.63C6.8 4.14 7.65 4.27 8.36 3.88H8.66C9.34 3.5 9.78 2.78 9.78 1.98V1.5C9.78 0.4 10.68 -0.5 11.78 -0.5C12.88 -0.5 13.78 0.4 13.78 1.5V1.98C13.78 2.78 14.22 3.5 14.9 3.88C15.61 4.27 16.46 4.14 17 3.63L17.06 3.57C17.81 2.82 19.01 2.82 19.76 3.57C20.51 4.32 20.51 5.52 19.76 6.27L19.7 6.33C19.19 6.87 19.06 7.72 19.45 8.43V8.66C19.83 9.34 20.55 9.78 21.35 9.78H21.66C22.76 9.78 23.66 10.68 23.66 11.78C23.66 12.88 22.76 13.78 21.66 13.78H21.35C20.55 13.78 19.83 14.22 19.4 15Z" stroke={dark ? "#B0A8D8" : "#7C6EDB"} strokeWidth="1.5"/>
          </svg>
        </button>
        </div>
      </div>

      <MascotJu mood={selectedMood || lastMood} size={100} speaking={showInsight}
        message={showInsight ? JU_STATES[selectedMood]?.msg : ""} />

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: dark ? "#E8E4F8" : "#1A1A2E", marginBottom: 16 }}>{t.how_feeling}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => handleMoodSelect(m.value)} {...pressHandlers()} style={{
              width: 56, height: 68, border: selectedMood === m.value ? `2px solid ${m.color}` : "2px solid transparent",
              borderRadius: 16, background: selectedMood === m.value ? `${m.color}15` : "rgba(255,255,255,0.5)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, cursor: "pointer", backdropFilter: "blur(10px)",
              transform: selectedMood === m.value ? "scale(1.08)" : "scale(1)",
              animation: selectedMood === m.value ? "celebratePop 0.3s ease" : "none",
              ...pressStyle,
            }}>
              <MoodIcon value={m.value} size={28} color={m.color} />
              <span style={{ fontSize: 10, color: dark ? "#9B93C0" : "#666", fontWeight: 500 }}>{[null, t.rough, t.low, t.okay, t.good, t.great][m.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedMood && (
        <div style={{ marginTop: 20, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: 12, color: dark ? "#B0A8D8" : "#8B7FD4", marginBottom: 8, fontWeight: 500 }}>{t.energy}</div>
          <input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(Number(e.target.value))}
            style={{ width: "80%", accentColor: "#7C6EDB" }} />
          <div style={{ display: "flex", justifyContent: "space-between", width: "80%", margin: "4px auto 0", fontSize: 10, color: dark ? "#7B6FC0" : "#999" }}>
            <span>{t.drained}</span><span>{t.energized}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => onNavigate("journal")} {...pressHandlers()} style={{
          flex: 1, maxWidth: 160, padding: "14px 0", borderRadius: 16,
          background: "#7C6EDB", color: "#fff", border: "none", fontSize: 15, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 16px rgba(124,110,219,0.3)", ...pressStyle,
        }}>
          {t.write}
        </button>
        <button onClick={() => onNavigate("journal")} {...pressHandlers()} style={{
          flex: 1, maxWidth: 160, padding: "14px 0", borderRadius: 16,
          background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", color: "#7C6EDB", border: "1.5px solid #D4CCF0",
          fontSize: 15, fontWeight: 600, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
          backdropFilter: "blur(12px)", ...pressStyle,
        }}>
          {t.talk}
        </button>
      </div>

      <div style={{
        marginTop: 24, padding: 16, borderRadius: 16,
        background: dark ? "rgba(30,27,54,0.5)" : "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)",
        border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 2px 16px rgba(124,110,219,0.06)",
      }}>
        <div style={{ fontSize: 11, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {t.todays_prompt}
        </div>
        <div style={{ fontSize: 15, color: dark ? "#E8E4F8" : "#1A1A2E", lineHeight: 1.5, fontStyle: "italic" }}>
          "{PROMPTS[promptIdx]}"
        </div>
        <button onClick={() => setPromptIdx((promptIdx + 1) % PROMPTS.length)} style={{
          marginTop: 8, fontSize: 11, color: dark ? "#B0A8D8" : "#8B7FD4", background: "none", border: "none",
          cursor: "pointer", fontWeight: 500,
        }}>
          {t.new_prompt}
        </button>
      </div>
    </div>
  );
}

function JournalScreen({ onNavigate, onSave, entries, t, theme, dark }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const textRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSave = () => {
    if (!text.trim()) return;
    const mood = 3 + Math.floor(Math.random() * 3);
    const entry = { id: Date.now(), text, mood, energy: 60, date: new Date().toISOString(), insight: generateInsight(mood, text) };
    onSave(entry);
    setAiInsight(entry.insight);
    setSaved(true);
    setShowConfetti(true);
    haptic("success");
  };

  // #10 typing effect for AI insight
  const { displayed: typedInsight, done: typingDone } = useTypingEffect(aiInsight, 25, saved);

  if (saved && aiInsight) {
    return (
      <div style={{ padding: "40px 20px", minHeight: "100vh", background: dark ? "linear-gradient(180deg, #13111C, #1A1730)" : "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
        <div style={{ animation: "celebratePop 0.4s ease" }}>
          <MascotJu mood={4} size={90} speaking={true} message="" />
        </div>
        <div style={{
          marginTop: 24, padding: 20, borderRadius: 20, background: dark ? "rgba(30,27,54,0.6)" : "rgba(255,255,255,0.6)",
          backdropFilter: "blur(16px)", maxWidth: 320, textAlign: "center",
          border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", animation: "fadeUp 0.5s ease",
          boxShadow: "0 4px 24px rgba(124,110,219,0.08)",
        }}>
          <div style={{ fontSize: 13, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, marginBottom: 8 }}>{t.ju_insight}</div>
          <div style={{ fontSize: 15, color: dark ? "#E8E4F8" : "#1A1A2E", lineHeight: 1.6 }}>
            {typedInsight}
            {!typingDone && <span style={{ display: "inline-block", width: 2, height: 16, background: "#7C6EDB", marginLeft: 2, animation: "pulse 0.8s ease infinite", verticalAlign: "text-bottom" }} />}
          </div>
        </div>
        <button onClick={() => onNavigate("home")} {...pressHandlers()} style={{
          marginTop: 24, padding: "12px 32px", borderRadius: 12,
          background: "#7C6EDB", color: "#fff", border: "none", fontSize: 14,
          fontWeight: 600, ...pressStyle,
        }}>
          {t.done}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", minHeight: "100vh", background: dark ? "#13111C" : "#FAFAF7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", fontSize: 14, color: dark ? "#B0A8D8" : "#8B7FD4", cursor: "pointer", fontWeight: 500 }}>
          {t.back}
        </button>
        <button onClick={handleSave} disabled={!text.trim()} {...(text.trim() ? pressHandlers() : {})} style={{
          padding: "8px 20px", borderRadius: 10, background: text.trim() ? "#7C6EDB" : "#E0DDF0",
          color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: text.trim() ? "pointer" : "default",
          ...pressStyle,
        }}>
          {t.save}
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#B0A8D8", fontWeight: 500, marginBottom: 12 }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      <textarea ref={textRef} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={t.whats_on_mind}
        style={{
          width: "100%", minHeight: 300, border: "none", background: "transparent",
          fontSize: 17, lineHeight: 1.8, color: dark ? "#E8E4F8" : "#1A1A2E", resize: "none", outline: "none",
          fontFamily: "var(--font-writing, Georgia, serif)",
        }}
        autoFocus
      />

      <div style={{ position: "fixed", bottom: 24, right: 24 }}>
        <button onClick={() => { setIsRecording(!isRecording); haptic("medium"); }} {...pressHandlers()} style={{
          width: 56, height: 56, borderRadius: "50%",
          background: isRecording ? "#E8878C" : "#7C6EDB",
          border: "none", color: "#fff",
          boxShadow: `0 4px 20px ${isRecording ? "rgba(232,135,140,0.4)" : "rgba(124,110,219,0.3)"}`,
          animation: isRecording ? "pulse 1.5s ease infinite" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          ...pressStyle,
        }}>
          {isRecording ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="#fff"/><path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M12 19V23M8 23H16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </button>
        {isRecording && (
          <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
            fontSize: 11, color: "#E8878C", fontWeight: 600, whiteSpace: "nowrap" }}>
            {t.recording}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightsScreen({ onNavigate, entries, t, theme, dark }) {
  const last7 = entries.slice(0, 7).reverse();
  const moodColors = { 5: "#4ECDC4", 4: "#95E1D3", 3: "#FFB347", 2: "#6C9BCF", 1: "#E8878C" };
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => { const t = setTimeout(() => setBarsReady(true), 200); return () => clearTimeout(t); }, []);

  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = entries.find(e => e.date?.split("T")[0] === dateStr);
    last30.push({ date: d, mood: entry?.mood || 0, day: d.getDate() });
  }

  return (
    <div style={{ padding: "20px", minHeight: "100vh", background: dark ? "linear-gradient(180deg, #13111C, #1E1B36)" : "linear-gradient(180deg, #F5F3FF 0%, #FAFAF7 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{t.mind_gallery}</div>
        <button onClick={() => onNavigate("home")} {...pressHandlers()} style={{ background: "none", border: "none", fontSize: 13, color: dark ? "#B0A8D8" : "#8B7FD4", ...pressStyle }}>{t.home}</button>
      </div>

      {/* 30-Day Mood Trend Line Chart */}
      <MoodTrendChart entries={entries} dark={dark} t={t} />

      {/* Weekly Mood Wave — #11 glassmorphism + #4 animated bars */}
      <RevealOnScroll>
      <div style={{ background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", borderRadius: 20, padding: 20, marginBottom: 16, backdropFilter: "blur(16px)", border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(124,110,219,0.06)" }}>
        <div style={{ fontSize: 12, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
          {t.weekly_mood}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
          {(last7.length > 0 ? last7 : [3, 4, 3, 2, 4, 5, 3].map((m) => ({ mood: m, date: "" }))).map((e, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: "100%", borderRadius: 8,
                height: barsReady ? (e.mood || 3) * 18 : 4,
                background: `linear-gradient(180deg, ${moodColors[e.mood || 3]}CC, ${moodColors[e.mood || 3]}40)`,
                transition: `height 0.6s cubic-bezier(.34,1.56,.64,1) ${i * 0.08}s`,
              }} />
              <div style={{ fontSize: 10, color: dark ? "#7B6FC0" : "#999" }}>
                {["M", "T", "W", "T", "F", "S", "S"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
      </RevealOnScroll>

      {/* Month Pixel Grid — #8 reveal on scroll */}
      <RevealOnScroll delay={100}>
      <div style={{ background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", borderRadius: 20, padding: 20, marginBottom: 16, backdropFilter: "blur(16px)", border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(124,110,219,0.06)" }}>
        <div style={{ fontSize: 12, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          {t.month_glance}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {last30.map((d, i) => (
            <div key={i} style={{
              aspectRatio: "1", borderRadius: 6,
              background: d.mood ? moodColors[d.mood] : "rgba(124,110,219,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: d.mood ? "#fff" : "#ccc", fontWeight: 500,
              opacity: d.mood ? 1 : 0.4,
              transition: `opacity 0.3s ease ${i * 0.02}s, transform 0.3s ease ${i * 0.02}s`,
            }}>
              {d.day}
            </div>
          ))}
        </div>
      </div>
      </RevealOnScroll>

      {/* AI Weekly Summary — #6 skeleton + #10 typing */}
      <RevealOnScroll delay={200}>
      <div style={{ background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", borderRadius: 20, padding: 20, marginBottom: 16, backdropFilter: "blur(16px)", border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(124,110,219,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.90)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img src={JU_IMAGES.main} alt="Ju" style={{ width: 36, height: 36, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{t.weekly_summary}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: dark ? "#C0B8D8" : "#444", lineHeight: 1.7, fontStyle: "italic" }}>
          {entries.length > 0 ? t.summary_has_entries : t.summary_no_entries}
        </div>
      </div>
      </RevealOnScroll>

      {/* AI Memory — Ju remembers past entries */}
      <AiMemoryCard entries={entries} dark={dark} t={t} />

      {/* History Lock — free = 7 days only */}
      {entries.length > 7 && <HistoryLock dark={dark} t={t} theme={theme} />}

      {/* Relationship Map Teaser */}
      <RevealOnScroll delay={300}>
      <div style={{
        background: "linear-gradient(135deg, rgba(124,110,219,0.06), rgba(78,205,196,0.06))", borderRadius: 20,
        padding: 20, border: "1px dashed rgba(124,110,219,0.3)", textAlign: "center",
        backdropFilter: "blur(8px)",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8 }}><circle cx="8" cy="8" r="3" stroke="#7C6EDB" strokeWidth="1.5"/><circle cx="16" cy="8" r="3" stroke="#4ECDC4" strokeWidth="1.5"/><circle cx="12" cy="16" r="3" stroke="#FFB347" strokeWidth="1.5"/><path d="M10.5 9.5L11 14M13.5 9.5L13 14M7 10.5L10 14.5M17 10.5L14 14.5" stroke="#D4CCF0" strokeWidth="1" strokeDasharray="2 2"/></svg>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#7C6EDB", marginBottom: 4 }}>{t.relationship_map}</div>
        <div style={{ fontSize: 12, color: dark ? "#8B7FD4" : "#888", lineHeight: 1.5 }}>{t.rel_desc}</div>
        <button {...pressHandlers()} style={{
          marginTop: 12, padding: "8px 16px", background: "#7C6EDB", color: "#fff",
          borderRadius: 10, fontSize: 12, fontWeight: 600, display: "inline-block", border: "none",
          ...pressStyle,
        }}>
          {t.unlock_pro}
        </button>
      </div>
      </RevealOnScroll>
    </div>
  );
}

function CoachScreen({ onNavigate, t, theme, dark }) {
  const [persona, setPersona] = useState(AI_PERSONAS[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const coachResponses = {
    gentle: ["I hear you, and what you're feeling is completely valid. Let's explore that together.", "That takes courage to share. What do you think is at the heart of this feeling?", "You're doing beautifully just by being here. What would feel supportive right now?"],
    tough: ["Alright, let's cut through the noise. What's the ONE thing you can actually control here?", "I believe in you, but belief isn't enough — what's your next move?", "Stop waiting for motivation. Action creates motivation. What's your smallest next step?"],
    wise: ["Consider this: every challenge contains the seed of its own resolution.", "Marcus Aurelius wrote: 'The obstacle is the way.' What if this difficulty is exactly what you need?", "Sit with this question: in 5 years, will this matter? If yes, act. If no, release."],
    fun: ["Bro, you know what? You're overthinking this. Let's vibe it out!", "Plot twist: you're actually doing way better than you think. Evidence? You're HERE, working on yourself!", "Okay real talk — what would the most confident version of you do right now? Yeah, do THAT."],
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    haptic("light");

    setTimeout(() => {
      const responses = coachResponses[persona.id];
      const aiMsg = { role: "ai", text: responses[Math.floor(Math.random() * responses.length)], isNew: true };
      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);
      haptic("medium");
    }, 1500 + Math.random() * 1000);
  };

  // #10 Typing message component
  const TypingMessage = ({ text: msgText }) => {
    const { displayed, done } = useTypingEffect(msgText, 22, true);
    return (
      <span>
        {displayed}
        {!done && <span style={{ display: "inline-block", width: 2, height: 14, background: "#7C6EDB", marginLeft: 1, animation: "pulse 0.8s ease infinite", verticalAlign: "text-bottom" }} />}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: dark ? "#13111C" : "#FAFAF7" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(124,110,219,0.1)", background: dark ? "rgba(19,17,28,0.95)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", fontSize: 13, color: dark ? "#B0A8D8" : "#8B7FD4", cursor: "pointer" }}>{t.back}</button>
          <div style={{ fontSize: 14, fontWeight: 600, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{t.ai_coach}</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {AI_PERSONAS.map(p => (
            <button key={p.id} onClick={() => setPersona(p)} style={{
              padding: "6px 12px", borderRadius: 20, border: persona.id === p.id ? "2px solid #7C6EDB" : "1.5px solid #E0DDF0",
              background: persona.id === p.id ? "rgba(124,110,219,0.08)" : "#fff",
              fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4,
              color: persona.id === p.id ? "#7C6EDB" : "#666", fontWeight: persona.id === p.id ? 600 : 400,
            }}>
              <PersonaIcon id={p.id} size={14} /> {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 120, height: 120, borderRadius: 28,
                background: "rgba(255,255,255,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 30px ${persona.color}60, 0 4px 20px rgba(0,0,0,0.15)`,
                animation: "juFloat 3s ease-in-out infinite",
                transition: "all 0.5s ease",
                overflow: "hidden",
              }}>
                <img src={PERSONA_IMAGES[persona.id]} alt={persona.name} style={{
                  width: 110, height: 110, objectFit: "contain",
                  display: "block",
                }} />
              </div>
              <div style={{
                marginTop: 8, padding: "8px 16px",
                background: `${persona.color}15`,
                borderRadius: 16, fontSize: 13,
                color: persona.color, fontStyle: "italic",
                maxWidth: 220, margin: "8px auto 0", lineHeight: 1.5,
                animation: "fadeUp 0.5s ease",
              }}>
                {persona.name} is ready to chat
              </div>
            </div>
            <div style={{ fontSize: 13, color: dark ? "#7B6FC0" : "#999", marginTop: 16 }}>{persona.desc}</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 12, animation: "fadeUp 0.3s ease",
          }}>
            <div style={{
              maxWidth: "80%", padding: "12px 16px", borderRadius: 18,
              background: msg.role === "user" ? "#7C6EDB" : (dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.7)"),
              color: msg.role === "user" ? "#fff" : (dark ? "#E8E4F8" : "#1A1A2E"),
              fontSize: 14, lineHeight: 1.6, border: msg.role === "ai" ? `1px solid ${persona.color}30` : "none",
              borderBottomRightRadius: msg.role === "user" ? 4 : 18,
              borderBottomLeftRadius: msg.role === "ai" ? 4 : 18,
              backdropFilter: msg.role === "ai" ? "blur(12px)" : "none",
            }}>
              {msg.role === "ai" && msg.isNew ? <TypingMessage text={msg.text} /> : msg.text}
            </div>
          </div>
        ))}
        {/* #10 Animated typing dots */}
        {typing && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{
              padding: "12px 20px", borderRadius: 18, borderBottomLeftRadius: 4,
              background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(124,110,219,0.1)", display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#7C6EDB",
                  animation: `typingDots 1.2s ease infinite ${i * 0.15}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        {typing && (
          <div style={{ display: "flex", gap: 4, padding: "12px 16px", animation: "fadeUp 0.3s ease" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#B0A8D8",
                animation: `bounce 1.2s ease infinite ${i * 0.15}s`,
              }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(124,110,219,0.1)", background: dark ? "#1E1B36" : "#fff", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={t.talk_to_ju} style={{
            flex: 1, padding: "10px 16px", borderRadius: 24, border: "1.5px solid #E0DDF0",
            fontSize: 14, outline: "none", background: dark ? "#13111C" : "#FAFAF7",
          }} />
        <button onClick={sendMessage} {...pressHandlers()} style={{
          width: 42, height: 42, borderRadius: "50%", background: "#7C6EDB",
          border: "none", color: "#fff", fontSize: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          ...pressStyle,
        }}>
          ↑
        </button>
      </div>
    </div>
  );
}

function PricingScreen({ onNavigate, t, theme, dark }) {
  const [annual, setAnnual] = useState(false);
  return (
    <div style={{ padding: "24px 16px", minHeight: "100vh", background: dark ? "linear-gradient(180deg, #13111C, #1A1730)" : "linear-gradient(180deg, #F5F3FF, #EDE9FE)" }}>
      <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", fontSize: 13, color: dark ? "#B0A8D8" : "#8B7FD4", cursor: "pointer", marginBottom: 16 }}>{t.back}</button>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <MascotJu mood={5} size={70} />
        <div style={{ fontSize: 22, fontWeight: 700, color: dark ? "#E8E4F8" : "#1A1A2E", marginTop: 12 }}>{t.unlock_ju}</div>
        <div style={{ display: "inline-flex", marginTop: 12, background: dark ? "#1E1B36" : "#fff", borderRadius: 10, padding: 3, gap: 2 }}>
          <button onClick={() => setAnnual(false)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, background: !annual ? "#7C6EDB" : "transparent", color: !annual ? "#fff" : "#888", cursor: "pointer" }}>{t.monthly}</button>
          <button onClick={() => setAnnual(true)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, background: annual ? "#7C6EDB" : "transparent", color: annual ? "#fff" : "#888", cursor: "pointer" }}>{t.annual}</button>
        </div>
      </div>

      {[
        { name: "Free", price: "$0", period: "forever", features: ["3 entries/week", "Basic mood tracking", "1 AI prompt/day", "Ju (base form)"], color: "#E8E4F8", cta: t.current_plan, disabled: true },
        { name: "Plus", price: annual ? "$3.33" : "$4.99", period: annual ? "/mo billed yearly" : "/month", features: ["Unlimited entries", "Voice journaling", "Daily AI analysis", "Weekly insights", "AI personality coach", "Ju evolution system"], color: "#7C6EDB", cta: t.start_trial, popular: true },
        { name: "Pro", price: annual ? "$6.66" : "$9.99", period: annual ? "/mo billed yearly" : "/month", features: ["Everything in Plus", "Relationship mood map", "Monthly AI deep report", "Export to PDF", "Priority support", "All Ju skins"], color: dark ? "#E8E4F8" : "#1A1A2E", cta: t.start_trial },
      ].map((tier) => (
        <div key={tier.name} style={{
          background: dark ? "#1E1B36" : "#fff", borderRadius: 20, padding: 20, marginBottom: 12,
          border: tier.popular ? "2px solid #7C6EDB" : "1px solid rgba(124,110,219,0.1)",
          position: "relative",
        }}>
          {tier.popular && (
            <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#7C6EDB", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 10 }}>
              MOST POPULAR
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: tier.color === "#E8E4F8" ? "#666" : tier.color }}>{tier.name}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2, margin: "8px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{tier.price}</span>
            <span style={{ fontSize: 13, color: dark ? "#8B7FD4" : "#888" }}>{tier.period}</span>
          </div>
          {tier.features.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: dark ? "#B0A8C8" : "#555", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#4ECDC4" }}>✓</span> {f}
            </div>
          ))}
          <button disabled={tier.disabled} {...(tier.disabled ? {} : pressHandlers())} style={{
            width: "100%", padding: 12, borderRadius: 12, marginTop: 12,
            background: tier.popular ? "#7C6EDB" : tier.disabled ? "#F0EDF8" : "#1A1A2E",
            color: tier.disabled ? "#999" : "#fff", border: "none", fontSize: 14, fontWeight: 600,
            cursor: tier.disabled ? "default" : "pointer",
            ...pressStyle,
          }}>
            {tier.cta}
          </button>
        </div>
      ))}
    </div>
  );
}

// ============ RETENTION: SIGNUP PROMPT (after 3rd entry) ============
function SignupPrompt({ entries, t, dark, theme, onDismiss, onSignup }) {
  if (entries.length < 3) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", animation: "fadeUp 0.3s ease" }}>
      <div style={{ background: dark ? "#1E1B36" : "#fff", borderRadius: 24, padding: "32px 24px", maxWidth: 340, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.90)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", animation: "juFloat 3s ease-in-out infinite", boxShadow: "0 0 20px rgba(124,110,219,0.3)", overflow: "hidden" }}>
          <img src={JU_IMAGES.main} alt="Ju" style={{ width: 72, height: 72, objectFit: "contain" }} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: dark ? "#E8E4F8" : "#1A1A2E", marginTop: 16, fontFamily: "var(--font-serif, Georgia, serif)" }}>{t.signup_title}</h3>
        <p style={{ fontSize: 14, color: dark ? "#9B93C0" : "#777", lineHeight: 1.6, marginTop: 8 }}>
          {t.signup_desc.replace("{n}", entries.length)}
        </p>
        <button onClick={onSignup} {...pressHandlers()} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#7C6EDB", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 20, boxShadow: "0 4px 20px rgba(124,110,219,0.3)", ...pressStyle }}>{t.signup_btn}</button>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: dark ? "#7B6FC0" : "#999", fontSize: 13, marginTop: 12, cursor: "pointer", padding: 8 }}>{t.signup_later}</button>
      </div>
    </div>
  );
}

// ============ RETENTION: MOOD TREND LINE CHART (SVG) ============
function MoodTrendChart({ entries, dark, t }) {
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = entries.find(e => e.date?.split("T")[0] === dateStr);
    last30.push({ date: d, mood: entry?.mood || 0 });
  }
  const dataPoints = last30.filter(d => d.mood > 0);
  if (dataPoints.length < 2) return null;

  const w = 320, h = 100, padX = 10, padY = 10;
  const xScale = (i) => padX + (i / (last30.length - 1)) * (w - padX * 2);
  const yScale = (m) => h - padY - ((m - 1) / 4) * (h - padY * 2);
  const moodColors = { 5: "#4ECDC4", 4: "#95E1D3", 3: "#FFB347", 2: "#6C9BCF", 1: "#E8878C" };

  let pathD = "";
  let dots = [];
  let idx = 0;
  last30.forEach((d, i) => {
    if (d.mood > 0) {
      const x = xScale(i), y = yScale(d.mood);
      if (idx === 0) pathD += `M${x},${y}`;
      else pathD += ` L${x},${y}`;
      dots.push({ x, y, mood: d.mood, i });
      idx++;
    }
  });

  const avgMood = dataPoints.length > 0 ? (dataPoints.reduce((s, d) => s + d.mood, 0) / dataPoints.length).toFixed(1) : "—";
  const bestDay = dataPoints.reduce((best, d) => d.mood > (best?.mood || 0) ? d : best, null);

  return (
    <RevealOnScroll delay={50}>
    <div style={{ background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", borderRadius: 20, padding: 20, marginBottom: 16, backdropFilter: "blur(16px)", border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(124,110,219,0.06)" }}>
      <div style={{ fontSize: 12, color: dark ? "#B0A8D8" : "#8B7FD4", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        {t.mood_trend}
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C6EDB" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#7C6EDB" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {pathD && <path d={pathD + ` L${dots[dots.length-1].x},${h - padY} L${dots[0].x},${h - padY} Z`} fill="url(#trendGrad)" />}
        {pathD && <path d={pathD} fill="none" stroke="#7C6EDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="4" fill={moodColors[d.mood]} stroke={dark ? "#1E1B36" : "#fff"} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{avgMood}</div>
          <div style={{ fontSize: 10, color: dark ? "#8B7FD4" : "#999" }}>{t.mood_avg}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{entries.length}</div>
          <div style={{ fontSize: 10, color: dark ? "#8B7FD4" : "#999" }}>{t.entries_total}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#4ECDC4" }}>+12%</div>
          <div style={{ fontSize: 10, color: dark ? "#8B7FD4" : "#999" }}>{t.improvement}</div>
        </div>
      </div>
    </div>
    </RevealOnScroll>
  );
}

// ============ RETENTION: HISTORY LOCK (free = 7 days) ============
function HistoryLock({ dark, t, theme }) {
  return (
    <div style={{ background: dark ? "rgba(30,27,54,0.5)" : "rgba(124,110,219,0.04)", borderRadius: 16, padding: "20px 16px", textAlign: "center", border: "1px dashed rgba(124,110,219,0.25)", marginTop: 12 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 8 }}>
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#7C6EDB" strokeWidth="1.5"/>
        <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="#7C6EDB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="16" r="1.5" fill="#7C6EDB"/>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 600, color: dark ? "#B0A8D8" : "#7C6EDB" }}>{t.history_locked}</div>
      <div style={{ fontSize: 12, color: dark ? "#7B6FC0" : "#999", marginTop: 4 }}>{t.history_unlock}</div>
      <button {...pressHandlers()} style={{ marginTop: 10, padding: "8px 20px", background: "#7C6EDB", color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", ...pressStyle }}>{t.unlock_pro}</button>
    </div>
  );
}

// ============ RETENTION: AI MEMORY CARD ============
function AiMemoryCard({ entries, dark, t }) {
  if (entries.length < 3) return null;
  const patterns = [t.ju_pattern_1, t.ju_pattern_2, t.ju_pattern_3];
  const visiblePatterns = entries.length >= 7 ? patterns : patterns.slice(0, 1);

  return (
    <RevealOnScroll delay={150}>
    <div style={{ background: dark ? "rgba(30,27,54,0.7)" : "rgba(255,255,255,0.5)", borderRadius: 20, padding: 20, marginBottom: 16, backdropFilter: "blur(16px)", border: dark ? "1px solid rgba(124,110,219,0.15)" : "1px solid rgba(255,255,255,0.5)", boxShadow: "0 2px 16px rgba(124,110,219,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7C6EDB, #4ECDC4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="#fff"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#E8E4F8" : "#1A1A2E" }}>{t.ju_remembers}</div>
          <div style={{ fontSize: 11, color: dark ? "#8B7FD4" : "#999" }}>{t.ju_memory_desc.replace("{n}", entries.length)}</div>
        </div>
      </div>
      {visiblePatterns.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: ["#4ECDC4", "#FFB347", "#7C6EDB"][i], marginTop: 6, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: dark ? "#C0B8D8" : "#555", lineHeight: 1.5 }}>{p}</div>
        </div>
      ))}
    </div>
    </RevealOnScroll>
  );
}

// ============ MAIN APP ============

export default function NujuApp() {
  const [screen, setScreen] = useState("home");
  const [entries, setEntries] = useState([]);
  const [streak, setStreak] = useState(3);
  const [onboarded, setOnboarded] = useState(false);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [showSignup, setShowSignup] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [signupDismissed, setSignupDismissed] = useState(false);

  const t = LANG[lang];
  const theme = dark ? DARK_THEME : LIGHT_THEME;

  const addEntry = (entry) => {
    setEntries(prev => {
      const updated = [entry, ...prev];
      // Trigger signup after 3rd entry
      if (updated.length === 3 && !signedUp && !signupDismissed) {
        setTimeout(() => setShowSignup(true), 1500);
      }
      return updated;
    });
    setStreak(prev => prev + 1);
  };

  if (!onboarded) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} t={t} />;
  }

  const moodLabels = [null, t.rough, t.low, t.okay, t.good, t.great];

  const NavIcon = ({ type, active }) => {
    const c = active ? "#7C6EDB" : (dark ? "#6B5FC0" : "#B0A8C8");
    const icons = {
      home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.55 5.45 21 6 21H9M19 10L21 12M19 10V20C19 20.55 18.55 21 18 21H15M9 21C9.55 21 10 20.55 10 20V16C10 15.45 10.45 15 11 15H13C13.55 15 14 15.45 14 16V20C14 20.55 14.45 21 15 21M9 21H15" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      journal: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232L18.768 8.768M16.732 3.732C17.2009 3.26313 17.8369 3 18.5 3C19.1631 3 19.7991 3.26313 20.268 3.732C20.7369 4.20088 21 4.83688 21 5.5C21 6.16313 20.7369 6.79913 20.268 7.268L6.5 21.036H3V17.464L16.732 3.732Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      insights: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 19V13M5 19V15M13 19V9M17 19V5" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      coach: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.97 16.97 21 12 21C10.36 21 8.81 20.56 7.46 19.78L3 21L4.22 16.54C3.44 15.19 3 13.64 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      pro: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? c + "20" : "none"}/></svg>,
    };
    return icons[type];
  };

  const nav = [
    { id: "home", icon: "home", label: t.home },
    { id: "journal", icon: "journal", label: t.write },
    { id: "insights", icon: "insights", label: t.insights_label },
    { id: "coach", icon: "coach", label: t.coach_label },
    { id: "pricing", icon: "pro", label: t.pro_label },
  ];

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", position: "relative", fontFamily: "var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)", minHeight: "100vh", background: theme.bg, transition: "background 0.3s ease" }}>

      <div style={{ paddingBottom: 72 }}>
        <PageTransition screenKey={screen}>
        {screen === "home" && <HomeScreen onNavigate={setScreen} entries={entries} streak={streak} t={t} theme={theme} dark={dark} />}
        {screen === "journal" && <JournalScreen onNavigate={setScreen} onSave={addEntry} entries={entries} t={t} theme={theme} dark={dark} />}
        {screen === "insights" && <InsightsScreen onNavigate={setScreen} entries={entries} t={t} theme={theme} dark={dark} />}
        {screen === "coach" && <CoachScreen onNavigate={setScreen} t={t} theme={theme} dark={dark} />}
        {screen === "pricing" && <PricingScreen onNavigate={setScreen} t={t} theme={theme} dark={dark} />}
        {screen === "settings" && <SettingsScreen onNavigate={setScreen} dark={dark} setDark={setDark} lang={lang} setLang={setLang} t={t} theme={theme} />}
        </PageTransition>
      </div>

      {/* Signup prompt — appears after 3rd entry */}
      {showSignup && !signedUp && (
        <SignupPrompt entries={entries} t={t} dark={dark} theme={theme}
          onDismiss={() => { setShowSignup(false); setSignupDismissed(true); }}
          onSignup={() => { setSignedUp(true); setShowSignup(false); haptic("celebration"); }}
        />
      )}

      {/* Bottom Navigation — #9 press feedback + #2 haptic */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: theme.navBg,
        backdropFilter: "blur(20px)", borderTop: `1px solid ${theme.border}`,
        display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100,
        transition: "background 0.3s ease",
      }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => { setScreen(n.id); haptic("light"); }} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            opacity: screen === n.id ? 1 : 0.6,
            transform: screen === n.id ? "scale(1.05)" : "scale(1)",
            transition: "all 0.25s cubic-bezier(.2,.8,.4,1.2)",
          }}>
            <NavIcon type={n.icon} active={screen === n.id} />
            <span style={{ fontSize: 10, fontWeight: screen === n.id ? 700 : 400, color: screen === n.id ? "#7C6EDB" : "#B0A8C8", letterSpacing: 0.3 }}>
              {n.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
