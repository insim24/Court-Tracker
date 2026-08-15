import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsButton } from "@/components/settings-button";
import { THEMES, THEME_IDS } from "@/lib/themes";
import "./globals.css";

// Runs before hydration so the stored theme applies on first paint instead
// of flashing the default, then getting swapped client-side. Kept as a
// tiny inline script (not a module) since it must execute synchronously,
// before the browser paints the (server-rendered, default-themed) HTML.
const DARK_THEME_IDS = THEMES.filter((t) => t.isDark).map((t) => t.id);
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var ids=${JSON.stringify(THEME_IDS)};var dark=${JSON.stringify(DARK_THEME_IDS)};if(t&&ids.indexOf(t)!==-1){document.documentElement.dataset.theme=t;if(dark.indexOf(t)!==-1){document.documentElement.classList.add("dark");}}}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Court Case Tracker",
  description: "Track court cases and upcoming hearings.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Case Tracker",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
          <SettingsButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
