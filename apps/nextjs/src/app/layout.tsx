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
  description: "Experience a new kind of social media where your friends capture your most authentic moments",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
  },
  openGraph: {
    title: "Oppfy",
    description: "Experience a new kind of social media where your friends capture your most authentic moments",
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
    description: "Experience a new kind of social media where your friends capture your most authentic moments",
    images: "/icon.png",
  },
};


export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>{props.children}</TRPCReactProvider>
      </body>
    </html>
  );
}
