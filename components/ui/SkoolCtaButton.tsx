"use client";

type SkoolCtaButtonProps = {
  label?: string;
  className?: string;
};

const SKOOL_ABOUT_URL = "https://www.skool.com/ai-hype-academy/about";

export default function SkoolCtaButton({
  label = "Udji u AI Hype Academy",
  className,
}: Readonly<SkoolCtaButtonProps>) {
  const resolvedClassName = className ? `hero-skool-cta ${className}` : "hero-skool-cta";

  return (
    <>
      <style>{`
        @keyframes heroCtaGlowPulse {
          0%, 100% {
            box-shadow:
              0 14px 34px rgba(0, 212, 255, 0.30),
              0 0 42px rgba(124, 58, 237, 0.26),
              0 0 0 0 rgba(0, 212, 255, 0.32);
          }
          50% {
            box-shadow:
              0 18px 44px rgba(0, 212, 255, 0.42),
              0 0 62px rgba(124, 58, 237, 0.34),
              0 0 0 10px rgba(0, 212, 255, 0);
          }
        }
        @keyframes heroCtaShimmer {
          0% { transform: translateX(-140%); }
          100% { transform: translateX(140%); }
        }
        .hero-skool-cta {
          position: relative;
          overflow: hidden;
          display: inline-block;
          padding: 15px 30px;
          border-radius: 999px;
          border: 1px solid rgba(125, 211, 252, 0.7);
          background: linear-gradient(135deg, #00bfe8 0%, #3b82f6 45%, #7c3aed 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-decoration: none;
          text-transform: uppercase;
          animation: heroCtaGlowPulse 2.2s ease-in-out infinite;
          transition: transform 0.22s ease, filter 0.22s ease, box-shadow 0.22s ease;
        }
        .hero-skool-cta::after {
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(105deg, transparent 24%, rgba(255, 255, 255, 0.38) 50%, transparent 76%);
          transform: translateX(-140%);
          animation: heroCtaShimmer 2.8s ease-in-out infinite;
          pointer-events: none;
        }
        .hero-skool-cta:hover {
          transform: translateY(-2px) scale(1.02);
          filter: saturate(1.08) brightness(1.04);
        }
      `}</style>
      <a
        href={SKOOL_ABOUT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={resolvedClassName}
      >
        {label}
      </a>
    </>
  );
}
