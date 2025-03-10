"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { MotionValue } from "framer-motion";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

// Premium animated particle component
const Particle = ({ delay = 0 }: { delay?: number }) => {
  const size = Math.random() * 5 + 2;
  const xOffset = Math.random() * 100;
  const yOffset = Math.random() * 100;
  const duration = Math.random() * 10 + 15;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${xOffset}%`,
        top: `${yOffset}%`,
        background: `radial-gradient(circle at center, rgba(242, 20, 255, 0.8), rgba(242, 20, 255, 0))`,
        boxShadow: "0 0 10px 2px rgba(242, 20, 255, 0.3)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1, 0.5],
        y: [-50, 50],
        x: [0, Math.random() * 50 - 25],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

// Animated blurred light gradient
const LightSource = ({
  color1,
  color2,
  size,
  position,
  animate = true,
  delay = 0,
}: {
  color1: string;
  color2: string;
  size: number;
  position: { x: number | string; y: number | string };
  animate?: boolean;
  delay?: number;
}) => {
  const animation = animate
    ? {
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.2, 1],
      }
    : {};

  return (
    <motion.div
      className="absolute rounded-full blur-[80px]"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${color1}, ${color2})`,
        zIndex: -1,
      }}
      initial={{ opacity: 0.3, scale: 1 }}
      animate={animation}
      transition={{
        duration: 8,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay,
      }}
    />
  );
};

// Dynamic 3D spotlight effect
const SpotlightEffect = ({
  mouseX,
  mouseY,
}: {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) => {
  // Guard for server-side rendering
  const isBrowser = typeof window !== "undefined";

  const spotlightX = useTransform(mouseX, (value) => {
    if (!isBrowser) return "50%"; // Safe fallback for SSR
    return `${(value / window.innerWidth) * 100}%`;
  });

  const spotlightY = useTransform(mouseY, (value) => {
    if (!isBrowser) return "50%"; // Safe fallback for SSR
    return `${(value / window.innerHeight) * 100}%`;
  });

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
      style={{
        background: `radial-gradient(circle at ${spotlightX} ${spotlightY}, rgba(255, 255, 255, 0.15), transparent 50%)`,
      }}
    />
  );
};

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerControls = useAnimation();
  const buttonControls = useAnimation();

  // Enhanced mouse interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smoother phone movement - balanced for better feel
  const springConfig = { damping: 30, stiffness: 120 }; // More responsive physics
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const phoneScale = useSpring(0.95, springConfig);

  // Animated gradient background angle
  const gradientAngle = useMotionValue(135);

  useEffect(() => {
    // Ensure we're in browser environment before using window
    if (typeof window === "undefined") return;

    // Animate gradient background
    const interval = setInterval(() => {
      gradientAngle.set(135 + Math.sin(Date.now() / 10000) * 30);
    }, 50);

    const sequence = async () => {
      await containerControls.start({ opacity: 1 });
      setIsLoaded(true);
      phoneScale.set(1);

      // Auto-play video after staggered animation sequence
      setTimeout(() => {
        if (videoRef.current) {
          try {
            videoRef.current.muted = false;
            videoRef.current.volume = 0.2;
            const playPromise = videoRef.current.play();

            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsVideoPlaying(true);
                })
                .catch((error) => {
                  console.error("Video autoplay failed:", error);
                });
            }
          } catch (err) {
            console.error("Error playing video:", err);
          }
        }
      }, 1500);
    };

    sequence();

    const handleMouseMove = (e: MouseEvent) => {
      // Update mouse position for effects
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Subtler, more intuitive 3D phone effect
      if (phoneRef.current) {
        const rect = phoneRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate normalized direction vector with reduced movement
        const maxRotation = 6; // Balanced rotation

        // Safe access to window properties
        const viewportWidth = window.innerWidth || 1024;
        const viewportHeight = window.innerHeight || 768;

        // Calculate distance from center, with balanced divisor
        const distanceX = (e.clientX - centerX) / (viewportWidth / 3);
        const distanceY = (e.clientY - centerY) / (viewportHeight / 3);

        // Apply spring physics for smooth animation - follows cursor
        rotateY.set(distanceX * maxRotation); // Follow cursor horizontally
        rotateX.set(-distanceY * maxRotation); // Follow cursor vertically
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [
    containerControls,
    mouseX,
    mouseY,
    phoneScale,
    rotateX,
    rotateY,
    gradientAngle,
  ]);

  // Advanced hover states for CTA button
  useEffect(() => {
    if (hoverButton) {
      buttonControls.start({
        scale: 1.05,
        boxShadow: "0 20px 30px -10px rgba(242, 20, 255, 0.5)",
        transition: { duration: 0.2 },
      });
    } else {
      buttonControls.start({
        scale: 1,
        boxShadow: "0 10px 20px -5px rgba(242, 20, 255, 0.3)",
        transition: { duration: 0.2 },
      });
    }
  }, [hoverButton, buttonControls]);

  // Restart video
  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;

    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .catch((err) => console.error("Error playing video:", err));
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  // Premium animation variants
  const phoneVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 100,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 100,
        duration: 1.2,
        delay: 0.5,
      },
    },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.6,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 200,
      },
    },
  };

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* Premium animated background - brightened and more pink */}
      <motion.div
        className="absolute inset-0 -z-10"
        style={{
          background: useTransform(
            gradientAngle,
            (angle) => `linear-gradient(${angle}deg, #150025 0%, #3F0053 100%)`,
          ),
        }}
      >
        {/* Animated spotlight that follows cursor */}
        <SpotlightEffect mouseX={mouseX} mouseY={mouseY} />

        {/* Dynamic light sources */}
        <LightSource
          color1="rgba(255, 41, 255, 0.6)"
          color2="rgba(128, 0, 255, 0)"
          size={800}
          position={{ x: "10%", y: "0%" }}
          delay={0}
        />
        <LightSource
          color1="rgba(255, 0, 247, 0.5)"
          color2="rgba(156, 0, 255, 0)"
          size={700}
          position={{ x: "80%", y: "20%" }}
          delay={2}
        />
        <LightSource
          color1="rgba(255, 83, 178, 0.5)"
          color2="rgba(242, 20, 255, 0)"
          size={600}
          position={{ x: "40%", y: "80%" }}
          delay={4}
        />

        {/* Premium animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <Particle key={i} delay={i * 0.5} />
          ))}
        </div>

        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
      </motion.div>

      {/* Main content container with enhanced layout - now truly centered and responsive */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col-reverse items-center justify-center px-4 sm:px-6 md:flex-row md:items-center md:gap-8 lg:gap-12"
        initial={{ opacity: 0 }}
        animate={containerControls}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* LEFT SIDE - Enhanced 3D iPhone with video - hidden on mobile */}
        <motion.div
          className="relative mb-8 hidden w-full max-w-[500px] justify-center md:mb-0 md:flex md:w-1/2"
          variants={phoneVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            ref={phoneRef}
            className="relative"
            style={{
              rotateX: rotateX,
              rotateY: rotateY,
              transformStyle: "preserve-3d",
              transformPerspective: 1000,
              scale: phoneScale,
            }}
          >
            {/* Premium light effects around phone */}
            <motion.div
              className="absolute -right-[15%] -top-[15%] -z-10 h-[130%] w-[130%] rounded-full opacity-60 blur-[80px]"
              animate={{
                background: [
                  "radial-gradient(circle at center, rgba(242, 20, 255, 0.4), rgba(242, 20, 255, 0))",
                  "radial-gradient(circle at center, rgba(98, 0, 234, 0.4), rgba(98, 0, 234, 0))",
                  "radial-gradient(circle at center, rgba(242, 20, 255, 0.4), rgba(242, 20, 255, 0))",
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Ultra-realistic 3D iPhone Pro - modern proportions */}
            <div className="relative h-[620px] w-[300px]">
              {/* 3D phone structure with premium shadow */}
              <div className="absolute -bottom-6 -left-2 -right-6 -top-2 -z-10 translate-x-2 rotate-[-5deg] scale-[0.95] transform-gpu rounded-[50px] bg-black/20 blur-lg"></div>

              {/* Phone outer frame with realistic metallic finish */}
              <div className="absolute inset-0 transform-gpu rounded-[50px] bg-[#0a0a0a] shadow-lg">
                {/* Subtle curved edge highlight */}
                <div className="absolute inset-0 rounded-[50px] bg-gradient-to-tr from-[#2a2a2f] via-transparent to-[#2a2a2f]/80 opacity-50"></div>

                {/* Metallic rim with subtle reflection */}
                <div
                  className="absolute inset-1 transform-gpu rounded-[46px] bg-[#0a0a0a]"
                  style={{
                    boxShadow: "inset 0 0 0 1.5px rgba(60, 60, 70, 0.4)",
                  }}
                >
                  {/* Side buttons with realistic rendering */}
                  <div className="absolute -left-[1px] top-[120px] h-[12px] w-[2px] rounded-l-full bg-[#2a2a2c]"></div>
                  <div className="absolute -left-[1px] top-[140px] h-[12px] w-[2px] rounded-l-full bg-[#2a2a2c]"></div>
                  <div className="absolute -left-[1px] top-[160px] h-[40px] w-[2px] rounded-l-full bg-[#2a2a2c]"></div>
                  <div className="absolute -right-[1px] top-[140px] h-[30px] w-[2px] rounded-r-full bg-[#2a2a2c]"></div>

                  {/* Ultra-realistic screen with minimal bezel */}
                  <div className="absolute inset-[3px] transform-gpu overflow-hidden rounded-[44px] bg-black">
                    {/* Dynamic Island - minimal pill */}
                    <div className="absolute left-1/2 top-[10px] z-10 -translate-x-1/2">
                      <div className="h-[8px] w-[60px] rounded-full bg-black">
                        {/* Tiny camera dot */}
                        <div className="absolute right-[15px] top-[2px] h-[4px] w-[4px] rounded-full bg-[#0c0c0c]"></div>
                      </div>
                    </div>

                    {/* Premium video content with letterboxing */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                      <video
                        ref={videoRef}
                        className="h-full w-full object-contain"
                        playsInline
                        muted
                        onClick={toggleVideoPlayback}
                      >
                        <source src="/vid.mp4" type="video/mp4" />
                      </video>
                    </div>

                    {/* Premium glass reflections */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 opacity-70"></div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 opacity-30"></div>
                    <div className="pointer-events-none absolute inset-0 rounded-[44px] shadow-inner"></div>

                    {/* Glass glare effect */}
                    <motion.div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30"
                      animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />

                    {/* Play/pause overlay */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isVideoPlaying ? 0 : 0.5 }}
                      transition={{ duration: 0.3 }}
                      onClick={toggleVideoPlayback}
                    >
                      {!isVideoPlaying && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.1,
                          }}
                          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/20 backdrop-blur-md"
                        >
                          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-[#F214FF] to-[#FF14F0] shadow-lg">
                            <svg
                              viewBox="0 0 24 24"
                              width="26"
                              height="26"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6.5 4.5L18.5 12L6.5 19.5V4.5Z"
                                fill="white"
                                stroke="white"
                                strokeWidth="1"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE - Content with premium design */}
        <div className="w-full max-w-[600px] md:w-1/2 md:pl-4 lg:pl-8">
          <motion.div
            className="max-w-lg"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Simplified premium logo */}
            <motion.div variants={itemVariants}>
              <div className="mb-6 flex items-center gap-4 sm:mb-8">
                <motion.div
                  className="relative overflow-hidden rounded-xl"
                  whileHover={{
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 },
                  }}
                >
                  <Image
                    src="/icon.png"
                    alt="Oppfy Logo"
                    className="h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14"
                    width={56}
                    height={56}
                  />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-transparent">
                      oppfy
                    </span>
                  </h2>
                  <p className="text-xs text-white/60 sm:text-sm">BETA • iOS</p>
                </div>
              </div>
            </motion.div>

            {/* Premium headline with fixed typography spacing - responsive */}
            <motion.h1
              variants={itemVariants}
              className="mb-6 pb-1 text-4xl font-extrabold leading-tight tracking-tight text-white sm:mb-8 sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl"
            >
              Friends <br className="hidden md:block" /> capture{" "}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text pb-1 text-transparent">
                your moments
              </span>
            </motion.h1>

            {/* Premium description - responsive */}
            <motion.p
              variants={itemVariants}
              className="mb-6 text-base leading-relaxed text-white/80 sm:mb-8 sm:text-lg md:text-xl"
            >
              A revolutionary social experience where{" "}
              <span className="font-bold text-white">
                friends become your photographers
              </span>
              , creating your authentic social timeline. No selfies, no
              posing—just real life.
            </motion.p>

            {/* Enhanced feature highlights - responsive grid */}
            <motion.div
              variants={itemVariants}
              className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2"
            >
              {[
                {
                  icon: "👁️",
                  text: "See yourself through their eyes",
                  color: "from-pink-500/40 to-purple-500/40",
                },
                {
                  icon: "✨",
                  text: "Pure authenticity",
                  color: "from-violet-500/40 to-indigo-500/40",
                },
                {
                  icon: "🔄",
                  text: "Return the favor",
                  color: "from-fuchsia-500/40 to-pink-500/40",
                },
                {
                  icon: "🎭",
                  text: "The real you",
                  color: "from-purple-500/40 to-violet-500/40",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${feature.color} p-0.5 backdrop-blur-sm`}
                  whileHover={{
                    y: -5,
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex h-full w-full items-center gap-3 rounded-[0.7rem] bg-[#0e0024]/90 py-2.5 pl-3 pr-4 backdrop-blur-md">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg shadow-inner">
                      {feature.icon}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {feature.text}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Improved premium CTA button with Apple icon - responsive */}
            <motion.div variants={itemVariants} className="w-full">
              <motion.a
                href="https://testflight.apple.com/join/EHMR7AxB"
                className="group relative flex w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Elegant button with primary color */}
                <div className="w-full overflow-hidden rounded-full bg-[#F214FF] px-4 py-3 shadow-lg shadow-[#F214FF]/30 sm:px-6 sm:py-4">
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {/* Apple icon */}
                    <svg
                      viewBox="0 0 384 512"
                      className="h-4 w-4 text-white sm:h-5 sm:w-5"
                      fill="currentColor"
                    >
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                    <span className="text-base font-semibold text-white sm:text-lg">
                      Download for iOS
                    </span>
                  </div>
                </div>

                {/* Elegant glow effect */}
                <motion.div
                  className="absolute -inset-4 -z-10 rounded-full opacity-0 blur-xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(242, 20, 255, 0.8) 0%, rgba(242, 20, 255, 0) 70%)",
                  }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              </motion.a>

              {/* Android Coming Soon indicator */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-white/70"
                  fill="currentColor"
                >
                  <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.05-0.69-0.26-0.85c-0.31-0.16-0.69-0.05-0.85,0.26l-1.86,3.22 c-1.56-0.65-3.28-1.01-5.07-1.01c-1.79,0-3.51,0.36-5.07,1.01L4.47,5.72c-0.16-0.31-0.55-0.42-0.85-0.26 c-0.31,0.16-0.42,0.55-0.26,0.85l1.84,3.18C1.74,11.13,0,14.08,0,17.5h24C24,14.08,22.26,11.13,17.6,9.48z M6,13.5 c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S6.83,13.5,6,13.5z M18,13.5c-0.83,0-1.5-0.67-1.5-1.5 s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S18.83,13.5,18,13.5z" />
                </svg>
                <span className="text-xs text-white/70 sm:text-sm">
                  Android Coming Soon
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
