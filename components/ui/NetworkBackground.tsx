"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
}

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let nodes: Node[] = [];
    let W = 0;
    let H = 0;
    let scrollY = 0;

    const isMobile = window.innerWidth < 768;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DPR = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const NODE_COUNT = reduced ? 18 : isMobile ? 40 : 85;
    const CONNECT = isMobile ? 130 : 160;
    const CONNECT_SQ = CONNECT * CONNECT;
    const MOUSE_R = 180;
    const MOUSE_R_SQ = MOUSE_R * MOUSE_R;
    const CELL = CONNECT;

    let grid: Map<string, number[]> = new Map();

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const create = () => {
      const pageH = document.documentElement.scrollHeight;
      nodes = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        const x = Math.random() * W;
        const y = Math.random() * pageH;
        nodes.push({ x, y, ox: x, oy: y, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15 });
      }
    };

    const buildGrid = (visible: number[]) => {
      grid.clear();
      for (const i of visible) {
        const n = nodes[i];
        const cy = n.y - scrollY;
        const key = `${(n.x / CELL) | 0},${(cy / CELL) | 0}`;
        const arr = grid.get(key);
        if (arr) arr.push(i);
        else grid.set(key, [i]);
      }
    };

    const onMM = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onScroll = () => { scrollY = window.scrollY; };

    const onResize = () => { resize(); create(); };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const top = scrollY - CONNECT;
      const bot = scrollY + H + CONNECT;

      const visible: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].y > top && nodes[i].y < bot) visible.push(i);
      }

      for (const i of visible) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.vx += (n.ox - n.x) * 0.01;
        n.vy += (n.oy - n.y) * 0.01;
        n.vx *= 0.98;
        n.vy *= 0.98;

        const sy = n.y - scrollY;
        const mdx = mx - n.x;
        const mdy = my - sy;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < MOUSE_R_SQ) {
          const md = Math.sqrt(md2);
          const f = (1 - md / MOUSE_R) * 1.2;
          n.vx += (mdx / md) * f;
          n.vy += (mdy / md) * f;
        }
      }

      buildGrid(visible);

      ctx.lineCap = "round";
      ctx.beginPath();
      const checked = new Set<string>();

      for (const i of visible) {
        const a = nodes[i];
        const ay = a.y - scrollY;
        const cx = (a.x / CELL) | 0;
        const cy = (ay / CELL) | 0;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const cell = grid.get(`${cx + dx},${cy + dy}`);
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const pairKey = i < j ? `${i}-${j}` : `${j}-${i}`;
              if (checked.has(pairKey)) continue;
              checked.add(pairKey);

              const b = nodes[j];
              const ddx = a.x - b.x;
              const ddy = ay - (b.y - scrollY);
              const d2 = ddx * ddx + ddy * ddy;
              if (d2 > CONNECT_SQ) continue;

              ctx.moveTo(a.x, ay);
              ctx.lineTo(b.x, b.y - scrollY);
            }
          }
        }
      }

      ctx.strokeStyle = "rgba(0,180,230,0.1)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Mouse-proximity bright lines
      if (mx > 0) {
        ctx.beginPath();
        for (const i of visible) {
          const a = nodes[i];
          const ay = a.y - scrollY;
          const cx = (a.x / CELL) | 0;
          const cy = (ay / CELL) | 0;
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const cell = grid.get(`${cx + dx},${cy + dy}`);
              if (!cell) continue;
              for (const j of cell) {
                if (j <= i) continue;
                const b = nodes[j];
                const by = b.y - scrollY;
                const ddx2 = a.x - b.x;
                const ddy2 = ay - by;
                if (ddx2 * ddx2 + ddy2 * ddy2 > CONNECT_SQ) continue;
                const midX = (a.x + b.x) * 0.5;
                const midY = (ay + by) * 0.5;
                const mdd = (mx - midX) ** 2 + (my - midY) ** 2;
                if (mdd < MOUSE_R_SQ) {
                  ctx.moveTo(a.x, ay);
                  ctx.lineTo(b.x, by);
                }
              }
            }
          }
        }
        ctx.strokeStyle = "rgba(0,212,255,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nodes
      ctx.fillStyle = "rgba(0,212,255,0.25)";
      ctx.beginPath();
      for (const i of visible) {
        const n = nodes[i];
        const sy = n.y - scrollY;
        ctx.moveTo(n.x + 1.2, sy);
        ctx.arc(n.x, sy, 1.2, 0, Math.PI * 2);
      }
      ctx.fill();

      // Bright nodes near mouse
      if (mx > 0) {
        ctx.fillStyle = "rgba(0,212,255,0.6)";
        ctx.beginPath();
        for (const i of visible) {
          const n = nodes[i];
          const sy = n.y - scrollY;
          const dd = (mx - n.x) ** 2 + (my - sy) ** 2;
          if (dd < MOUSE_R_SQ) {
            const f = 1 - Math.sqrt(dd) / MOUSE_R;
            const r = 1.2 + f * 2;
            ctx.moveTo(n.x + r, sy);
            ctx.arc(n.x, sy, r, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    create();
    scrollY = window.scrollY;
    draw();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("mousemove", onMM, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
