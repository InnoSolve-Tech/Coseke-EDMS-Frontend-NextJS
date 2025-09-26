"use client";

import { getSettings } from "@/core/settings";
import { hexToHsl } from "@/lib/utils";
import { Settings } from "@/types/settings";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

const DEFAULT_SETTINGS: Settings = {
  companyName: "Default Company",
  logoUrl: "/default-logo.png",
  currency: "USD",
  colors: {
    primaryColor: "142 76% 36%",
    primaryForeground: "355.7 100% 97.3%",
    secondaryColor: "210 40% 96%",
    accent: "210 40% 96%",
    ring: "142 76% 36%",
    card: "210 40% 96%",
    background: "210 40% 96%",
    foreground: "222.2 84% 4.9%",
  },
};

const fetchColorTheme = async (): Promise<Settings> => {
  try {
    console.log("Fetching settings from API...");
    const settings: Settings = await getSettings();
    console.log("API response:", settings);

    if (!settings?.colors) {
      console.warn("Settings missing colors, using defaults");
      return DEFAULT_SETTINGS;
    }

    // Convert hex colors to HSL format
    const convertedColors = {
      primaryColor: hexToHsl(settings.colors.primaryColor),
      primaryForeground: hexToHsl(settings.colors.primaryForeground),
      secondaryColor: hexToHsl(settings.colors.secondaryColor),
      accent: hexToHsl(settings.colors.accent),
      ring: hexToHsl(settings.colors.ring),
      card: hexToHsl(settings.colors.card),
      background: hexToHsl(settings.colors.background || "#ffffff"),
      foreground: hexToHsl(settings.colors.foreground || "#000000"),
    };

    return {
      ...settings,
      colors: convertedColors,
    };
  } catch (error) {
    console.error("API call failed:", error);
    return DEFAULT_SETTINGS;
  }
};

// Context
const ColorThemeContext = createContext<{
  colorTheme: Settings | null;
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
  error: string | null;
}>({
  colorTheme: null,
  isLoading: true,
  refreshTheme: async () => {},
  error: null,
});

export const useColorTheme = () => useContext(ColorThemeContext);

// Simplified theme application
const applyThemeColors = (colors: Settings["colors"], mode: string) => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const isDark = mode === "dark";

  // Remove existing dynamic styles to prevent conflicts
  const existingStyle = document.getElementById("dynamic-theme-vars");
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const styleElement = document.createElement("style");
  styleElement.id = "dynamic-theme-vars";

  const cssVars = `
    :root {
      --primary: ${colors.primaryColor} !important;
      --primary-foreground: ${colors.primaryForeground} !important;
      --ring: ${colors.ring} !important;
      ${
        !isDark
          ? `
        --background: ${colors.background} !important;
        --foreground: ${colors.foreground} !important;
        --card: ${colors.card} !important;
        --secondary: ${colors.secondaryColor} !important;
        --accent: ${colors.accent} !important;
      `
          : ""
      }
    }
  `;

  styleElement.textContent = cssVars;
  document.head.appendChild(styleElement);

  console.log(`Applied ${mode} theme colors:`, colors);
};

// Wrapper around `next-themes` provider
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      <CustomColorThemeProvider>{children}</CustomColorThemeProvider>
    </NextThemesProvider>
  );
}

// Main theme provider component
function CustomColorThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load theme with retry logic
  const loadTheme = useCallback(async (): Promise<void> => {
    if (!mounted) return;

    setIsLoading(true);
    setError(null);

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const theme = await fetchColorTheme();
        setColorTheme(theme);
        setError(null);
        break;
      } catch (err) {
        retryCount++;
        console.error(`Theme load attempt ${retryCount} failed:`, err);

        if (retryCount >= maxRetries) {
          console.error("Max retries reached, using default theme");
          setColorTheme(DEFAULT_SETTINGS);
          setError("Using default theme due to connection issues");
        } else {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        }
      }
    }

    setIsLoading(false);
  }, [mounted]);

  // Apply theme colors when theme or colors change
  useEffect(() => {
    if (!mounted || !colorTheme || !resolvedTheme) return;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      applyThemeColors(colorTheme.colors, resolvedTheme);
    });
  }, [mounted, colorTheme, resolvedTheme]);

  // Initial theme load
  useEffect(() => {
    if (mounted) {
      loadTheme();
    }
  }, [mounted, loadTheme]);

  const refreshTheme = useCallback(async () => {
    await loadTheme();
  }, [loadTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ColorThemeContext.Provider
      value={{
        colorTheme,
        isLoading,
        refreshTheme,
        error,
      }}
    >
      {error && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "#fee",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 9999,
            border: "1px solid #fcc",
            color: "#c33",
          }}
        >
          {error}
        </div>
      )}
      {children}
    </ColorThemeContext.Provider>
  );
}
