"use client";

import { useEffect, useState } from "react";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface UseTelegramWebAppReturn {
  isInsideTelegram: boolean;
  user: TelegramWebAppUser | null;
  colorScheme: "light" | "dark";
  triggerHaptic: (style?: "light" | "medium" | "heavy") => void;
  closeApp: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme?: "light" | "dark";
        initDataUnsafe?: {
          user?: TelegramWebAppUser;
        };
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy") => void;
        };
      };
    };
  }
}

/**
 * Hook to interface with Telegram WebApp SDK.
 * Enables the web dashboard to function seamlessly as a Telegram Mini App.
 */
export function useTelegramWebApp(): UseTelegramWebAppReturn {
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window.Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      setIsInsideTelegram(true);
      setUser(tg.initDataUnsafe.user);
      if (tg.colorScheme) {
        setColorScheme(tg.colorScheme);
      }
      tg.ready();
      tg.expand();
    }
  }, []);

  function triggerHaptic(style: "light" | "medium" | "heavy" = "light") {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      } catch {
        // Silently ignore if not supported on client
      }
    }
  }

  function closeApp() {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    }
  }

  return {
    isInsideTelegram,
    user,
    colorScheme,
    triggerHaptic,
    closeApp,
  };
}
