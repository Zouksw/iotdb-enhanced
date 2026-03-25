"use client";

import { RefineThemes } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import React, {
  type PropsWithChildren,
  createContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import { lightTheme, darkTheme } from "@/lib/theme";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType,
);

type ColorModeContextProviderProps = {
  defaultMode?: string;
};

export const ColorModeContextProvider: React.FC<
  PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState(defaultMode || "dark");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (isMounted) {
      // Read from localStorage (syncs with ThemeToggle component)
      const savedTheme = localStorage.getItem("theme") || "dark";
      setMode(savedTheme);
      // Apply Tailwind dark mode class
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, [isMounted]);

  const setColorMode = (newMode: string) => {
    setMode(newMode);
    // Update localStorage (syncs with ThemeToggle component)
    localStorage.setItem("theme", newMode);
    // Apply Tailwind dark mode class
    document.documentElement.classList.toggle("dark", newMode === "dark");
  };

  const { darkAlgorithm, defaultAlgorithm } = theme;

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ConfigProvider
        theme={{
          ...(mode === "light" ? lightTheme : darkTheme),
          algorithm: mode === "light" ? defaultAlgorithm : darkAlgorithm,
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
