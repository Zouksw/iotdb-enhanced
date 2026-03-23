"use client";

import { Card, CardProps } from "antd";
import React from "react";

interface GlassCardProps extends CardProps {
  /**
   * The intensity of the glassmorphism effect
   * @default "medium"
   */
  intensity?: "light" | "medium" | "heavy";
}

const intensityStyles = {
  light: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  medium: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  heavy: {
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
};

const darkIntensityStyles = {
  light: {
    background: "rgba(30, 41, 59, 0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  medium: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  heavy: {
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
};

/**
 * GlassCard - A card component with subtle glassmorphism effect
 *
 * NOTE: Use sparingly. For most cases, use Ant Design Card with
 * variant="borderless" instead. GlassCard is best for hero sections
 * or special emphasis areas where visual distinction is needed.
 *
 * @example
 * ```tsx
 * <GlassCard intensity="medium">
 *   <p>Your content here</p>
 * </GlassCard>
 * ```
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = "medium",
  children,
  className = "",
  style,
  ...props
}) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const cardStyle: React.CSSProperties = {
    background: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: isDark
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(0, 0, 0, 0.06)",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
    overflow: "hidden",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    ...style,
  };

  const cardClassName = `glass-card glass-card--${intensity} ${className}`.trim();

  return (
    <Card className={cardClassName} style={cardStyle} {...props}>
      {children}
    </Card>
  );
};

export default GlassCard;
