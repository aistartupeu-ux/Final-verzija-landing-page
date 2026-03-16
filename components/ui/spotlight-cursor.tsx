'use client';

import { useRef, useEffect, HTMLAttributes } from 'react';

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

    let lastMove = 0;
    const THROTTLE_MS = 50;
    const handleMouseMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove < THROTTLE_MS) return;
      lastMove = now;
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

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smoothing: približi current poziciju targetu svaki frame.
      // Veći smoothing => brže prati (manje "lag"), manji => mekše.
      const smoothing = Math.max(0.04, Math.min(0.25, config.smoothing ?? 0.12));
      curX += (targetX - curX) * smoothing;
      curY += (targetY - curY) * smoothing;

      // Ako je "van ekrana" (mouseleave), nemoj crtati.
      if (targetX !== -1000 && targetY !== -1000) {
        const gradient = ctx.createRadialGradient(
          curX, curY, 0,
          curX, curY, config.radius ?? 200
        );
        const rgbColor = hexToRgb(config.color ?? '#ffffff');
        gradient.addColorStop(0, `rgba(${rgbColor}, ${config.brightness ?? 0.15})`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
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
  const spotlightConfig = {
    radius: 220,
    brightness: 0.18,
    color: '#00d4ff',
    smoothing: 0.1,
    ...config,
  };

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
