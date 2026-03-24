'use client';

import { useRef, useEffect, useMemo, HTMLAttributes } from 'react';

interface SpotlightConfig {
  radius?: number;
  brightness?: number;
  color?: string;
  smoothing?: number;
}

const useSpotlightEffect = (config: SpotlightConfig) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    // Target pozicija (update na mousemove) + current pozicija (lerp svaki frame)
    let targetX = -1000;
    let targetY = -1000;
    let curX = -1000;
    let curY = -1000;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const handleMouseLeave = () => {
      targetX = -1000;
      targetY = -1000;
    };

    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r},${g},${b}`;
    };

    let lastMouseTime = 0;
    const IDLE_STOP_MS = 150; // kad se cur približi targetu i nema pomeranja, zaustavi petlju

    const draw = () => {
      const smoothing = Math.max(0.04, Math.min(0.25, config.smoothing ?? 0.12));
      curX += (targetX - curX) * smoothing;
      curY += (targetY - curY) * smoothing;

      const nearTarget = Math.abs(curX - targetX) < 2 && Math.abs(curY - targetY) < 2;
      const idle = nearTarget && (Date.now() - lastMouseTime > IDLE_STOP_MS);

      if (targetX === -1000 && targetY === -1000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationFrameId = 0;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createRadialGradient(
        curX, curY, 0,
        curX, curY, config.radius ?? 200
      );
      const rgbColor = hexToRgb(config.color ?? '#ffffff');
      gradient.addColorStop(0, `rgba(${rgbColor}, ${config.brightness ?? 0.15})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (idle) animationFrameId = 0;
      else animationFrameId = requestAnimationFrame(draw);
    };

    const scheduleDraw = () => {
      lastMouseTime = Date.now();
      if (animationFrameId === 0) animationFrameId = requestAnimationFrame(draw);
    };

    const handleMousemove = (e: MouseEvent) => {
      handleMouseMove(e);
      scheduleDraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('mousemove', handleMousemove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = 0;
    scheduleDraw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMousemove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [config.radius, config.brightness, config.color]);

  return canvasRef;
};

interface SpotlightCursorProps extends HTMLAttributes<HTMLCanvasElement> {
  config?: SpotlightConfig;
}

export function SpotlightCursor({
  config = {},
  className = '',
  ...rest
}: SpotlightCursorProps) {
  const spotlightConfig = useMemo(() => ({
    radius: 220,
    brightness: 0.18,
    color: '#00d4ff',
    smoothing: 0.14,
    ...config,
  }), [config?.radius, config?.brightness, config?.color, config?.smoothing]);

  const canvasRef = useSpotlightEffect(spotlightConfig);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] w-full h-full ${className}`}
      style={{ mixBlendMode: 'screen' }}
      aria-hidden
      {...rest}
    />
  );
}
