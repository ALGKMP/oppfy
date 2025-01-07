"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      {/* Background floating elements */}
      <motion.div
        className="absolute left-[20%] top-20 h-4 w-4 rounded-full bg-[#F214FF]/20"
        animate={{
          y: [0, 20, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-40 right-[30%] h-6 w-6 rounded-full bg-[#F214FF]/10"
        animate={{
          y: [0, -30, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute right-[20%] top-[40%] h-3 w-3 rounded-full bg-[#F214FF]/15"
        animate={{
          y: [0, 15, 0],
          opacity: [0.15, 0.4, 0.15],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <motion.img
          src="/icon.png"
          alt="Oppfy Logo"
          className="h-40 w-40 rounded-xl shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <motion.h1
          className="text-center text-4xl font-extrabold tracking-tight text-white sm:text-[5rem]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          404 - Page Not Found
        </motion.h1>

        <motion.p
          className="max-w-md text-center text-xl text-gray-400"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Oops! The page you're looking for doesn't exist. But don't worry,
          there's plenty more to explore on Oppfy!
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link href="/">
            <motion.div
              className="rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-opacity hover:opacity-90"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Return Home
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          className="mt-12 grid max-w-2xl grid-cols-3 gap-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
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

      {/* Optional: Add a subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black to-[#F214FF]/10" />
    </main>
  );
}
