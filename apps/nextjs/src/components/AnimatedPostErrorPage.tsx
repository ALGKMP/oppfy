"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AnimatedPostErrorPage() {
  return (
    <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
      <motion.img
        src="/icon.png"
        alt="Oppfy Logo"
        className="h-40 w-40 rounded-xl shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      <motion.h1
        className="text-center text-4xl font-extrabold tracking-tight text-white md:text-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Oops! Post Not Found
      </motion.h1>

      <motion.p
        className="max-w-md text-center text-xl text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        We couldn't find the post you're looking for. But don't worry - there
        are plenty more amazing moments waiting to be captured on Oppfy!
      </motion.p>

      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.a
          href="https://testflight.apple.com/join/EHMR7AxB"
          className="rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-opacity hover:opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Join Our Beta on TestFlight
        </motion.a>

        <p className="text-center text-sm text-gray-500">
          Currently available for iOS users
        </p>
      </motion.div>

      <motion.div
        className="mt-12 grid max-w-2xl grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-center">
          <span className="mb-2 block text-3xl">🤝</span>
          <h3 className="mb-1 font-bold text-[#F214FF]">Friend-Powered</h3>
          <p className="text-sm text-gray-400">
            Let your friends be your photographers
          </p>
        </div>
        <div className="text-center">
          <span className="mb-2 block text-3xl">📸</span>
          <h3 className="mb-1 font-bold text-[#F214FF]">Real Moments</h3>
          <p className="text-sm text-gray-400">Capture life as it happens</p>
        </div>
        <div className="text-center">
          <span className="mb-2 block text-3xl">✨</span>
          <h3 className="mb-1 font-bold text-[#F214FF]">Be Yourself</h3>
          <p className="text-sm text-gray-400">No filters, just fun</p>
        </div>
      </motion.div>
    </div>
  );
}
