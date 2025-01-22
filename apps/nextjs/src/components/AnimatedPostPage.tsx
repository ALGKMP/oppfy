"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { RouterOutputs } from "@oppfy/api";

type Post = RouterOutputs["post"]["getPostForNextJs"];

interface PostPageProps {
  post: Post;
  aspectRatio: number;
}

export default function AnimatedPostPage({ post, aspectRatio }: PostPageProps) {
  return (
    <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center md:flex-row">
      {/* Left Side - Content */}
      <div className="flex w-full max-w-xl flex-1 flex-col items-center justify-center p-4 md:p-8 lg:p-12">
        <motion.div
          className="flex w-full flex-col items-center gap-6 md:gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="relative h-24 w-24 md:h-32 md:w-32">
            <Image
              src="/icon.png"
              alt="Oppfy Logo"
              className="rounded-xl shadow-lg"
              fill
              priority
              unoptimized
            />
          </motion.div>

          <motion.h1
            className="text-center text-2xl font-extrabold tracking-tight text-white md:text-3xl lg:text-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Join the <span className="text-[#F214FF]">Oppfy</span> Beta
          </motion.h1>

          {/* Image Section - Above profiles on mobile */}
          <motion.div
            className="flex w-full justify-center md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="glow-border relative w-[70%] overflow-hidden rounded-xl border-4 border-[#F214FF]">
              <div
                className="relative w-full"
                style={{
                  paddingBottom: `${aspectRatio * 100}%`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-30 blur-xl"
                  style={{
                    backgroundImage: `url(${post.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={post.imageUrl}
                    alt="Post preview"
                    className="h-full w-full object-contain"
                    fill
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center justify-center gap-3 md:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex w-[100px] flex-col items-center md:w-[120px]">
              <div className="relative h-14 w-14 md:h-16 md:w-16">
                <Image
                  src={
                    post.authorProfilePicture ?? "/default-profile-picture.jpg"
                  }
                  alt={`${post.authorUsername}'s profile`}
                  className="rounded-full border-2 border-[#F214FF]"
                  fill
                  unoptimized
                />
              </div>
              <p
                className="mt-2 w-full truncate text-center text-sm text-white"
                title={`@${post.authorUsername}`}
              >
                @{post.authorUsername}
              </p>
            </div>

            <div className="flex flex-col items-center px-1">
              <span className="mb-1 text-xl md:text-2xl">📸</span>
              <span className="whitespace-nowrap text-xs font-medium text-[#F214FF] md:text-sm">
                took a pic of
              </span>
            </div>

            <div className="flex w-[100px] flex-col items-center md:w-[120px]">
              <div className="relative h-14 w-14 md:h-16 md:w-16">
                <Image
                  src={
                    post.recipientProfilePicture ??
                    "/default-profile-picture.jpg"
                  }
                  alt={`${post.recipientUsername}'s profile`}
                  className="rounded-full border-2 border-[#F214FF]"
                  fill
                  unoptimized
                />
              </div>
              <p
                className="mt-2 w-full truncate text-center text-sm text-white"
                title={`@${post.recipientUsername}`}
              >
                @{post.recipientUsername}
              </p>
            </div>
          </motion.div>

          <motion.p
            className="text-center text-base text-gray-400 md:text-lg"
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
              className="rounded-xl bg-[#F214FF] px-6 py-3 font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#F214FF]/20 md:px-8 md:py-4"
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
            className="grid w-full grid-cols-3 gap-2 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="text-center">
              <span className="mb-2 block text-xl md:text-2xl">🤝</span>
              <h3 className="mb-1 text-sm font-bold text-[#F214FF] md:text-base">
                Friend-Powered
              </h3>
              <p className="text-xs text-gray-400">
                Let your friends be your photographers
              </p>
            </div>
            <div className="text-center">
              <span className="mb-2 block text-xl md:text-2xl">📸</span>
              <h3 className="mb-1 text-sm font-bold text-[#F214FF] md:text-base">
                Real Moments
              </h3>
              <p className="text-xs text-gray-400">
                Capture life as it happens
              </p>
            </div>
            <div className="text-center">
              <span className="mb-2 block text-xl md:text-2xl">✨</span>
              <h3 className="mb-1 text-sm font-bold text-[#F214FF] md:text-base">
                Be Yourself
              </h3>
              <p className="text-xs text-gray-400">No filters, just fun</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Image (Desktop only) */}
      <motion.div
        className="hidden w-full max-w-md flex-1 items-center justify-center p-4 md:flex md:p-8 lg:p-12"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="glow-border relative w-full overflow-hidden rounded-xl border-4 border-[#F214FF]">
          <div
            className="relative w-full"
            style={{
              paddingBottom: `${aspectRatio * 100}%`,
              maxHeight: "80vh",
            }}
          >
            <div
              className="absolute inset-0 opacity-30 blur-xl"
              style={{
                backgroundImage: `url(${post.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={post.imageUrl}
                alt="Post preview"
                className="h-full w-full object-contain"
                fill
                unoptimized
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
