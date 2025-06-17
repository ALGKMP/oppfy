"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("https://formspree.io/f/xpwqoyeq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setStatus("sent");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-black pt-16">
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

      <div className="container flex flex-col items-center px-4">
        <Link href="/" className="mb-8">
          <motion.img
            src="/icon.png"
            alt="Oppfy Logo"
            className="h-20 w-20 rounded-xl shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </Link>

        <motion.h1
          className="mb-8 text-center text-4xl font-extrabold tracking-tight text-white"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Contact Us
        </motion.h1>

        <motion.div
          className="w-full max-w-md space-y-6 pb-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-center text-gray-400">
            Have a question or want to get in touch? Send us a message and we'll
            get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-400"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-[#F214FF] focus:outline-none focus:ring-2 focus:ring-[#F214FF]/50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-[#F214FF] focus:outline-none focus:ring-2 focus:ring-[#F214FF]/50"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-400"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                className="mt-1 block w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:border-[#F214FF] focus:outline-none focus:ring-2 focus:ring-[#F214FF]/50"
                placeholder="Your message..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>

            {status === "sent" && (
              <p className="text-center text-green-500">
                Thank you for your message! We'll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="text-center text-red-500">
                Something went wrong. Please try again later.
              </p>
            )}
          </form>
        </motion.div>
      </div>

      {/* Optional: Add a subtle gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black to-[#F214FF]/10" />
    </main>
  );
}
