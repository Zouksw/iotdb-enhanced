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
  purple: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
    ...glassStyle,
    border: gradientBorder
      ? "1px solid transparent"
      : isDark
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "16px",
    boxShadow: isDark
      ? "0 8px 32px rgba(0, 0, 0, 0.3)"
      : "0 8px 32px rgba(31, 38, 135, 0.1)",
    overflow: "hidden",
    transition: "all 0.3s ease",
    ...style,
  };

  if (gradientBorder) {
    cardStyle.backgroundImage = gradients[gradient];
    cardStyle.backgroundOrigin = "border-box";
    cardStyle.backgroundClip = "padding-box, border-box";
  }

  const cardClassName = `glass-card glass-card--${intensity} ${className}`.trim();

  return (
    <Card className={cardClassName} style={cardStyle} {...props}>
      {children}
    </Card>
  );
};

export default GlassCard;
