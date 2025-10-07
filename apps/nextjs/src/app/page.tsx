"use client";

import { useState } from "react";

import { BackgroundVideo } from "~/components/landing/BackgroundVideo";
import { CTAButtons } from "~/components/landing/CTAButtons";
import { Footer } from "~/components/landing/Footer";
import { PhoneVisual } from "~/components/landing/PhoneVisual";
import { WaitlistModal } from "~/components/landing/WaitlistModal";

/** ===============================================================
 *  Oppfy Landing v6 – Next Level Experience
 *  ===============================================================
 *  ✦ Ultra-smooth animations with spring physics
 *  ✦ Dynamic gradient effects that respond to movement
 *  ✦ Sophisticated micro-interactions
 *  ✦ Enhanced visual hierarchy and flow
 *  ✦ Improved mobile experience
 * ----------------------------------------------------------------*/

export default function WaitlistPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-16"
      style={{ background: "#F214FF" }}
    >
      {/* Mobile background video */}
      <BackgroundVideo />

      {/* Centered content */}
      <section className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
        {/* Phone visual - hidden on mobile, visible on desktop */}
        <PhoneVisual />

        {/* Text and CTA buttons */}
        <CTAButtons />
      </section>

      {/* Waitlist Modal */}
      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Footer */}
      <Footer />
    </main>
  );
}
