"use client";

import { Card, CardProps } from "antd";
import React from "react";

interface GlassCardProps extends CardProps {
  /**
   * The intensity of the glassmorphism effect
   * @default "medium"
   */
  intensity?: "light" | "medium" | "heavy";

  /**
   * Whether to show a gradient border
   * @default false
   */
  gradientBorder?: boolean;

  /**
   * Gradient to use for border (when gradientBorder is true)
   * @default "purple"
   */
  gradient?: "purple" | "blue" | "sunset" | "success";
}

const gradients = {
  purple: "linear-gradient(135deg, #0066cc 0%, #0077e6 50%, #0088ff 100%)",
  blue: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
  sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  success: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
};

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
 * GlassCard - A modern glassmorphism card component
 *
 * This component provides a frosted glass effect with blur, transparency,
 * and subtle borders. Perfect for modern SaaS interfaces.
 *
 * @example
 * ```tsx
 * <GlassCard intensity="medium" gradientBorder gradient="purple">
 *   <p>Your content here</p>
 * </GlassCard>
 * ```
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = "medium",
  gradientBorder = false,
  gradient = "purple",
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

  const glassStyle = isDark ? darkIntensityStyles[intensity] : intensityStyles[intensity];

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
    transition: "all 0.2s ease",
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
