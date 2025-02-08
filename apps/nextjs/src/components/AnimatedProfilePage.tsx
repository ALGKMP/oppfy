"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface Profile {
  profilePictureUrl: string | null;
  id: string;
  name: string | null;
  username: string;
  dateOfBirth: Date | null;
  bio: string | null;
  profilePictureKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfilePageProps {
  profile: Profile;
}

export default function AnimatedProfilePage({ profile }: ProfilePageProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <motion.div
        className="flex max-w-sm flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Section */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="relative h-32 w-32 md:h-40 md:w-40">
            <Image
              src={profile.profilePictureUrl ?? "/default_profile_picture.jpg"}
              alt={`${profile.username}'s profile picture`}
              className="rounded-full border-4 border-[#F214FF] object-cover shadow-lg"
              fill
              unoptimized
            />
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {profile.name ?? profile.username}
            </h2>
            <p className="text-lg text-[#F214FF] md:text-xl">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="mt-1 max-w-md text-center text-gray-400 md:text-lg">
                {profile.bio}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.h1 className="text-center text-xl font-bold tracking-tight text-white md:text-2xl">
            Join <span className="text-[#F214FF]">@{profile.username}</span> on
            Oppfy
          </motion.h1>

          <motion.a
            href="https://testflight.apple.com/join/EHMR7AxB"
            className="mt-2 rounded-xl bg-[#F214FF] px-8 py-3 text-base font-bold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#F214FF]/20 md:text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Early Access on TestFlight
          </motion.a>

          <p className="text-center text-sm text-gray-500">
            Currently available for iOS users
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
