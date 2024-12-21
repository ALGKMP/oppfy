import type { Metadata, Viewport } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://opp.oppfy.app"
      : "http://localhost:3000",
  ),
  title: "Oppfy",
  description:
    "Experience a new kind of social media where your friends capture your most authentic moments",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Oppfy",
    description:
      "Experience a new kind of social media where your friends capture your most authentic moments",
    url: "https://opp.oppfy.app",
    siteName: "Oppfy",
    images: [
      {
        url: "/icon.png",
        width: 1200,
        height: 630,
        alt: "Oppfy App",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oppfy",
    description:
      "Experience a new kind of social media where your friends capture your most authentic moments",
    images: "/icon.png",
  },
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-black">
        <TRPCReactProvider>
          <main className="flex-grow">{props.children}</main>
          <footer className="mt-auto border-t border-gray-800 py-4">
            <div className="container mx-auto flex justify-center gap-8">
              <a
                href="/privacy"
                className="text-sm text-gray-400 transition-colors hover:text-[#F214FF]"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-sm text-gray-400 transition-colors hover:text-[#F214FF]"
              >
                Terms of Service
              </a>
            </div>
          </footer>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
