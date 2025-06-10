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
    </main>
  );
}
