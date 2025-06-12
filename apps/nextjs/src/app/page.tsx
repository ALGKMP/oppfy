/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

import "react-phone-number-input/style.css";

import {
  AnimatePresence,
  motion,
  useAnimation,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { api } from "~/trpc/react";

/** ===============================================================
 *  Oppfy Landing v7 – Complete Redesign
 *  ===============================================================
 *  ✦ Multi-section layout showcasing app features
 *  ✦ Mobile-responsive video and interactions
 *  ✦ Dynamic friend posting examples
 *  ✦ Interactive how-it-works section
 *  ✦ Social proof and testimonials
 * ----------------------------------------------------------------*/

/* ---------------- helper hooks ---------------- */
function useIsMobile() {
  const [state, setState] = useState(true);
  useEffect(() => {
    const fn = () => setState(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return state;
}

function useMousePosition() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return { mouseX, mouseY };
}

/* ---------------- decorative elements ---------------- */
const Dot = () => {
  const size = Math.random() * 4 + 2;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const drift = Math.random() * 60 - 30;
  const duration = Math.random() * 12 + 18;
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: "#F214FF",
        opacity: 0.5,
        boxShadow: "0 0 10px 3px rgba(242,20,255,.4)",
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.2, 0.7],
        y: [-40, 40],
        x: [0, drift],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 5,
      }}
    />
  );
};

const Star = () => {
  const size = Math.random() * 8 + 8;
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  const delay = Math.random() * 6;
  const rotate = Math.random() * 360;
  return (
    <motion.svg
      className="absolute text-fuchsia-500"
      style={{ left: `${x}%`, top: `${y}%` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      initial={{ scale: 0, opacity: 0, rotate: 0 }}
      animate={{
        scale: [0, 1.3, 0],
        opacity: [0, 1, 0],
        rotate: [rotate, rotate + 180],
      }}
      transition={{ duration: 2.5, repeat: Infinity, delay }}
    >
      <path d="M12 2l1.9 5.9H20l-4.9 3.6 1.9 5.9L12 13.8 7 17.4l1.9-5.9L4 7.9h6.1z" />
    </motion.svg>
  );
};

/* ---------------- mock data ---------------- */
const mockPosts = [
  {
    id: 1,
    author: "Sarah M.",
    target: "Alex",
    image: "🎂",
    caption: "Caught Alex being the birthday hero we all needed! 🎉",
    time: "2m ago",
    likes: 24,
  },
  {
    id: 2,
    author: "Mike J.",
    target: "Emma",
    image: "☕",
    caption: "Emma's coffee addiction is real and we're here for it ☕✨",
    time: "5m ago",
    likes: 18,
  },
  {
    id: 3,
    author: "Lisa K.",
    target: "David",
    image: "🎸",
    caption: "David absolutely crushing it at open mic night! 🔥",
    time: "12m ago",
    likes: 41,
  },
];

const testimonials = [
  {
    name: "Emma Chen",
    username: "@emmac",
    text: "Finally, an app that captures the real me through my friends' eyes! Love seeing myself from their perspective.",
    avatar: "👩🏻‍💻",
  },
  {
    name: "Marcus Johnson",
    username: "@mjohnson",
    text: "Oppfy brings back that authentic social media feeling. No more posed selfies - just genuine moments.",
    avatar: "👨🏾‍🎨",
  },
  {
    name: "Sophie Miller",
    username: "@sophiem",
    text: "My friends capture the best parts of me that I'd never think to share. It's like having personal paparazzi!",
    avatar: "👩🏼‍🎨",
  },
];

export default function WaitlistPage() {
  const isMobile = useIsMobile();
  const { mouseX, mouseY } = useMousePosition();

  /* ---------------- state ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [isValid, setIsValid] = useState(false);
  useEffect(() => {
    setIsValid(!!phoneNumber && isValidPhoneNumber(phoneNumber));
  }, [phoneNumber]);

  /* ---------------- hero entrance ---------------- */
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  /* ---------------- dynamic gradient ---------------- */
  const angle = useMotionValue(135);
  const gradientX = useTransform(
    mouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 0],
    [-30, 30],
  );
  const gradientY = useTransform(
    mouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 0],
    [-30, 30],
  );

  useEffect(() => {
    let id: number;
    if (typeof window !== "undefined") {
      id = requestAnimationFrame(function loop() {
        angle.set(135 + Math.sin(performance.now() / 5000) * 50);
        id = requestAnimationFrame(loop);
      });
    }
    return () => {
      if (id) cancelAnimationFrame(id);
    };
  }, []);

  /* ---------------- phone tilt (desktop) ---------------- */
  const rotX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotY = useSpring(0, { stiffness: 150, damping: 20 });
  const scale = useSpring(1, { stiffness: 200, damping: 22 });

  useEffect(() => {
    if (isMobile) return;
    const fn = (e: MouseEvent) => {
      if (typeof window !== "undefined") {
        rotY.set(
          ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 5,
        );
        rotX.set(
          (-(e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) *
            5,
        );
      }
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [isMobile]);

  const joinWaitlist = api.waitlist.joinWaitlist.useMutation();

  /* ---------------- submit ---------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneNumber || !isValid) return;
    setSubmitting(true);
    try {
      await joinWaitlist.mutateAsync({ phone: phoneNumber });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to join waitlist:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-white">
      {/* Dynamic gradient backdrop */}
      <motion.div
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background: useTransform(
            angle,
            (a) =>
              `linear-gradient(${a}deg, #1a0533 0%, #2d0a5a 30%, #4a1580 60%, #6a20a0 100%)`,
          ),
          transform: `translate(${gradientX}px, ${gradientY}px)`,
        }}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Dynamic gradient blobs */}
        <motion.div
          className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/20 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-purple-600/20 blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Interactive particles */}
        {[...Array(25)].map((_, i) => (
          <Dot key={`d${i}`} />
        ))}
        {[...Array(15)].map((_, i) => (
          <Star key={`s${i}`} />
        ))}
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-8"
      style={{ background: "#F214FF" }}
    >
      {/* Mobile background video */}
      <div className="absolute inset-0 md:hidden">
        <video
          className="h-full w-full object-cover"
          src="/vid.mp4"
          playsInline
          muted
          autoPlay
          loop
        />
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F214FF]/80 via-[#F214FF]/85 to-[#F214FF]/90" />
      </div>

      {/* Hero section - Mobile optimized */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen flex-col justify-center px-4 py-8 md:py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto flex w-full max-w-7xl flex-col items-center text-center"
        >
          {/* Logo */}
          <motion.div
            className="mb-8 flex items-center gap-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={heroInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="relative">
              <Image
                src="/icon.png"
                alt="logo"
                width={48}
                height={48}
                className="rounded-xl md:h-14 md:w-14"
              />
              <motion.div
                className="absolute -inset-1 -z-10 rounded-xl blur-md"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  background:
                    "radial-gradient(circle, #F214FF77 0%, #F214FF00 70%)",
                }}
              />
            </div>
            <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              oppfy
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mb-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Your friends become your{" "}
            <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-transparent">
              opps
      {/* Centered content */}
      <section className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
        {/* Phone visual - hidden on mobile, visible on desktop */}
        <div className="relative hidden justify-center md:flex">
          <div className="relative aspect-[9/16] w-full max-w-[340px] rounded-[48px] shadow-2xl">
            <video
              className="h-full w-full rounded-[48px] border-8 border-white object-cover"
              src="/vid.mp4"
              playsInline
              muted
              autoPlay
              loop
            />
          </div>
        </div>
        {/* Text and QR section */}
        <div className="flex flex-col items-center gap-6 text-center md:items-start md:gap-8 md:text-left">
          <div>
            {/* Logo */}
            <Image
              src="/icon.png"
              alt="Oppfy logo"
              width={56}
              height={56}
              className="mx-auto mb-3 md:mx-0"
            />
            <h1
              className="mb-4 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
              style={{ letterSpacing: "-0.04em" }}
            >
              Real moments,
              <br />
              <span className="text-white">captured by friends</span>
            </h1>
          </div>
          {/* Pre-Order on the App Store Button */}
          <a
            href="#" // Replace with your App Store pre-order link
            className="flex w-full max-w-sm items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-base font-semibold text-black shadow-md transition hover:bg-gray-100 md:max-w-xs md:py-2 md:text-lg"
            style={{ textDecoration: "none" }}
          >
            <svg
              fill="#000000"
              width="20"
              height="20"
              viewBox="0 0 22.773 22.773"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#000000"
              className="flex-shrink-0"
            >
              <g>
                <g>
                  <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"></path>
                  <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"></path>
                </g>
              </g>
            </svg>
            <span className="whitespace-nowrap">
              Pre-Order on the App Store
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="mb-12 max-w-2xl px-4 text-lg text-white/90 md:text-xl lg:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            The social app where friends capture your best moments. No more
            awkward selfies - just authentic posts from the people who know you
            best.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.9, duration: 0.8 }}
            whileTap={{ scale: 0.98 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 40px rgba(255, 0, 204, 0.4)",
            }}
            onClick={() => setModalOpen(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#FF00CC] to-[#FF66FF] px-8 py-4 text-lg font-bold tracking-wide text-white shadow-2xl shadow-[#FF00CC]/30 md:px-12 md:py-5 md:text-xl"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Join the Waitlist
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:translate-x-1 md:h-6 md:w-6"
              >
          </a>
          {/* Join our Discord Community Button */}
          <a
            href="#" // Replace with your Discord invite link
            className="flex w-full max-w-sm items-center justify-center gap-3 rounded-full border border-white/20 bg-gray-500/20 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-gray-600/40 md:max-w-xs md:py-2 md:text-lg"
            style={{ textDecoration: "none" }}
          >
            <svg
              viewBox="0 -28.5 256 256"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              className="flex-shrink-0"
            >
              <g>
                <path
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill="#FFFF"
                  fill-rule="nonzero"
                ></path>
              </g>
            </svg>
            <span className="whitespace-nowrap">
              Join our Discord community
            </span>
          </motion.button>
        </motion.div>
      </section>

      {/* Video showcase section - Separate section that appears on scroll */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">
              See{" "}
              <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-transparent">
                Oppfy
              </span>{" "}
              in action
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/80">
              Experience authentic social sharing through your friends' eyes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            className="flex justify-center"
          >
            <motion.div
              style={
                !isMobile
                  ? {
                      rotateX: rotX,
                      rotateY: rotY,
                      scale,
                      transformStyle: "preserve-3d",
                      transformPerspective: 1200,
                    }
                  : {}
              }
              whileHover={!isMobile ? { scale: 1.05 } : {}}
              className="relative"
            >
              <div
                className={`relative ${isMobile ? "aspect-[9/16] w-[320px]" : "aspect-[9/16] w-[400px]"} p-3`}
              >
                {/* Glassy phone frame */}
                <div className="absolute inset-0 rounded-[52px] bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-sm" />
                <div className="absolute inset-[1px] rounded-[50px] bg-black/20 backdrop-blur-md" />

                {/* Video container */}
                <div className="relative h-full w-full overflow-hidden rounded-[48px] ring-[0.5px] ring-inset ring-white/30">
                  <video
                    src="/vid.mp4"
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                    loop
                    controls={false}
                    preload="auto"
                  />
                </div>
              </div>

              {/* Animated glow effect */}
              <motion.div
                className="absolute -inset-6 -z-10 rounded-[60px] blur-2xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{
                  background:
                    "radial-gradient(circle, #F214FF66 0%, #F214FF00 70%)",
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA section */}
      <section className="relative px-4 py-24">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-6 text-5xl font-bold md:text-6xl">
            Ready to see yourself through{" "}
            <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-transparent">
              friends' eyes?
            </span>
          </h2>
          <p className="mb-12 text-xl text-white/80">
            Be among the first to experience authentic social sharing
          </p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 50px rgba(255, 0, 204, 0.5)",
            }}
            onClick={() => setModalOpen(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#FF00CC] to-[#FF66FF] px-16 py-6 text-2xl font-bold tracking-wide text-white shadow-2xl shadow-[#FF00CC]/40"
          >
            <span className="relative z-10 flex items-center justify-center gap-4">
              {submitted ? "Success!" : "Join the Waitlist"}
              <motion.svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:translate-x-2"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </span>
          </motion.button>
        </motion.div>
      </section>

      {/* Modal */}
          </a>
        </div>
      </section>
      {/* Modal (unchanged) */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setModalOpen(false);
              setSubmitted(false);
            }}
          >
            <motion.div
              className="absolute inset-0 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative mx-4 w-full max-w-md rounded-2xl bg-gradient-to-br from-[#2A004D] to-[#4A0080] p-8 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="absolute right-6 top-6 text-white/70 hover:text-white"
                onClick={() => {
                  setModalOpen(false);
                  setSubmitted(false);
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.1 }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
              <h2 className="mb-6 text-center text-3xl font-bold">
                {submitted ? "Success!" : "Join the Waitlist"}
              </h2>
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="[&_.PhoneInputCountryIcon]:!border-0 [&_.PhoneInputCountrySelectArrow]:!border-t-white [&_.PhoneInputCountrySelect]:!rounded-lg [&_.PhoneInputCountrySelect]:!border [&_.PhoneInputCountrySelect]:!border-white/10 [&_.PhoneInputCountrySelect]:!bg-[#2A004D] [&_.PhoneInputCountrySelect]:!bg-transparent [&_.PhoneInputCountrySelect]:!text-lg [&_.PhoneInputCountrySelect]:!text-white [&_.PhoneInputCountrySelect]:!shadow-lg [&_.PhoneInputCountrySelect]:!shadow-black/20 [&_.PhoneInputCountrySelect]:!backdrop-blur-md [&_.PhoneInputCountrySelect]:focus:!outline-none [&_.PhoneInputCountrySelect]:focus:!ring-0 [&_.PhoneInputCountrySelect_arrow]:!border-t-white [&_.PhoneInputCountrySelect_option]:!bg-[#2A004D] [&_.PhoneInputCountrySelect_option]:!text-white [&_.PhoneInputCountry]:ml-4 [&_.PhoneInputCountry]:mr-2 [&_.PhoneInputInput]:!border-0 [&_.PhoneInputInput]:!bg-transparent [&_.PhoneInputInput]:!px-0 [&_.PhoneInputInput]:!py-4 [&_.PhoneInputInput]:!text-lg [&_.PhoneInputInput]:!text-white [&_.PhoneInputInput]:!placeholder-white/50 [&_.PhoneInputInput]:!outline-none [&_.PhoneInput]:rounded-xl [&_.PhoneInput]:bg-white/15 [&_.PhoneInput]:backdrop-blur-md [&_.PhoneInput]:transition-all [&_.PhoneInput]:duration-300 [&_.PhoneInput]:focus-within:ring-2 [&_.PhoneInput]:focus-within:ring-[#FF66FF]">
                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="US"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="Your phone number"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={submitting || !isValid}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF00CC] to-[#FF66FF] py-4 text-lg font-bold shadow-lg shadow-[#FF00CC]/30 disabled:opacity-60"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                        />
                        <span>Joining...</span>
                      </div>
                    ) : (
                      "Join Now"
                    )}
                  </motion.button>
                </form>
              ) : (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF00CC] to-[#FF66FF]"
                  >
                    <motion.svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.path
                        d="M20 6L9 17L4 12"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className="text-lg text-white/80"
                  >
                    We'll text you when we launch! 🎉
                  </motion.p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Transparent Footer */}
      <footer className="mt-8 flex w-full flex-col items-center justify-center bg-transparent px-4 py-6 md:mt-12 md:py-8">
        <div className="mb-3 flex items-center justify-center gap-6 md:mb-2">
          {/* Instagram Icon */}
          <a
            href="#"
            aria-label="Instagram"
            className="opacity-70 transition hover:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                fill="#fff"
              ></path>
              <path
                d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"
                fill="#fff"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z"
                fill="#fff"
              ></path>
            </svg>
          </a>
          {/* X (Twitter) Icon */}
          <a
            href="#"
            aria-label="X"
            className="opacity-70 transition hover:opacity-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 1200 1227"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
                fill="white"
              />
            </svg>
          </a>
        </div>
        <div className="mb-2 text-center text-sm font-light text-white opacity-70">
          © {new Date().getFullYear()} Oppfy Inc.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-light text-white opacity-70 md:gap-4 md:text-sm">
          <a href="/privacy" className="transition hover:opacity-100">
            Privacy Policy
          </a>
          <span className="mx-1">•</span>
          <a href="/terms" className="transition hover:opacity-100">
            Terms of Service
          </a>
        </div>
      </footer>
    </main>
  );
}
