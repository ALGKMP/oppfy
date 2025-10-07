"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import type { RouterOutputs } from "@oppfy/api";

import { CTAButtons } from "./landing/CTAButtons";
import { Footer } from "./landing/Footer";
import { MobilePostVisual } from "./landing/MobilePostVisual";
import { PostVisual } from "./landing/PostVisual";

type Post = RouterOutputs["post"]["getPostForSite"];

interface PostPageProps {
  post: Post;
}

export default function AnimatedPostPage({ post }: PostPageProps) {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Transition to home screen after 3 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {showIntro ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#F214FF" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="px-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.h1
              className="text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Captured in a candid moment,
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="text-white"
              >
                you made a new memory
              </motion.span>
            </motion.h1>
          </motion.div>
        </motion.div>
      ) : (
        <motion.main
          key="home"
          className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-16"
          style={{ background: "#F214FF" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Centered content */}
          <section className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
            {/* Post visual with actual media - hidden on mobile, visible on desktop */}
            <PostVisual
              mediaType={post.post.mediaType}
              assetUrl={post.post.assetUrl}
              width={post.post.width ?? undefined}
              height={post.post.height ?? undefined}
            />

            {/* Text and CTA buttons */}
            <div className="flex flex-col items-center gap-6 text-center md:items-start md:gap-8 md:text-left">
              {/* Logo - mobile only */}
              <Image
                src="/icon.png"
                alt="Oppfy logo"
                width={56}
                height={56}
                className="md:hidden"
              />

              {/* Mobile post visual - below logo on mobile */}
              <MobilePostVisual
                mediaType={post.post.mediaType}
                assetUrl={post.post.assetUrl}
                width={post.post.width ?? undefined}
                height={post.post.height ?? undefined}
              />

              <CTAButtons />
            </div>
          </section>

          {/* Footer */}
          <Footer />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
