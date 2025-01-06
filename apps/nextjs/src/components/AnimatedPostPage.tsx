"use client";

import { motion } from "framer-motion";

interface PostPageProps {
  post: any; // Replace with your post type
  aspectRatio: number;
}

export default function AnimatedPostPage({ post, aspectRatio }: PostPageProps) {
  return (
    <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center md:flex-row">
      {/* Left Side - Content */}
      <div className="flex max-w-xl flex-1 flex-col items-center justify-center p-8 md:p-12">
        <motion.div
          className="flex w-full flex-col items-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            src="/icon.png"
            alt="Oppfy Logo"
            className="h-32 w-32 rounded-xl shadow-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />

          <motion.h1
            className="text-center text-3xl font-extrabold tracking-tight text-white md:text-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Join the <span className="text-[#F214FF]">Oppfy</span> Beta
          </motion.h1>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex flex-col items-center">
              <img
                src={
                  post?.authorProfilePicture ?? "/default-profile-picture.jpg"
                }
                alt={`${post?.authorUsername}'s profile`}
                className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
              />
              <p className="mt-2 text-sm text-white">@{post?.authorUsername}</p>
            </div>

            <div className="mx-2 flex flex-col items-center">
              <span className="mb-1 text-2xl">📸</span>
              <span className="text-sm font-medium text-[#F214FF]">
                took a pic of
              </span>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={
                  post?.recipientProfilePicture ??
                  "/default-profile-picture.jpg"
                }
                alt={`${post?.recipientUsername}'s profile`}
                className="h-16 w-16 rounded-full border-2 border-[#F214FF]"
              />
              <p className="mt-2 text-sm text-white">
                @{post?.recipientUsername}
              </p>
            </div>
          </motion.div>

          <motion.p
            className="text-center text-lg text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Where your friends capture your most authentic moments. Join our
            exclusive beta and be part of something special.
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.a
              href="https://testflight.apple.com/join/EHMR7AxB"
              className="rounded-xl bg-[#F214FF] px-8 py-4 font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#F214FF]/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Early Access on TestFlight
            </motion.a>

            <p className="text-center text-sm text-gray-500">
              Currently available for iOS users
            </p>
          </motion.div>

          <motion.div
            className="grid w-full grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="text-center">
              <span className="mb-2 block text-2xl">🤝</span>
              <h3 className="mb-1 font-bold text-[#F214FF]">Friend-Powered</h3>
              <p className="text-xs text-gray-400">
                Let your friends be your photographers
              </p>
            </div>
            <div className="text-center">
              <span className="mb-2 block text-2xl">📸</span>
              <h3 className="mb-1 font-bold text-[#F214FF]">Real Moments</h3>
              <p className="text-xs text-gray-400">
                Capture life as it happens
              </p>
            </div>
            <div className="text-center">
              <span className="mb-2 block text-2xl">✨</span>
              <h3 className="mb-1 font-bold text-[#F214FF]">Be Yourself</h3>
              <p className="text-xs text-gray-400">No filters, just fun</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <motion.div
        className="hidden max-w-md flex-1 items-center justify-center p-8 md:flex md:p-12"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="glow-border relative w-full overflow-hidden rounded-xl border-4 border-[#F214FF]">
          <div
            className="relative w-full"
            style={{
              paddingBottom: `${aspectRatio * 100}%`,
              maxHeight: "70vh",
            }}
          >
            <div
              className="absolute inset-0 opacity-30 blur-xl"
              style={{
                backgroundImage: `url(${post?.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={post?.imageUrl}
                alt="Post preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
