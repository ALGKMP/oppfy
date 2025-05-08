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
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { api } from "~/trpc/react";

/** ===============================================================
 *  Oppfy Landing v6 – Next Level Experience
 *  ===============================================================
 *  ✦ Ultra-smooth animations with spring physics
 *  ✦ Dynamic gradient effects that respond to movement
 *  ✦ Sophisticated micro-interactions
 *  ✦ Enhanced visual hierarchy and flow
 *  ✦ Improved mobile experience
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

const FloatingShape = ({ index }: { index: number }) => {
  const shapes = [
    "M0 15L15 0L30 15L15 30Z", // diamond
    "M0 0H30V30H0Z", // square
    "M15 0L30 30H0Z", // triangle
    "M0 15C0 6.716 6.716 0 15 0C23.284 0 30 6.716 30 15C30 23.284 23.284 30 15 30C6.716 30 0 23.284 0 15Z", // circle
  ];
  const shape = shapes[index % shapes.length];
  const size = Math.random() * 30 + 20;
  const x = Math.random() * 80 + 10;
  const y = Math.random() * 80 + 10;

  return (
    <motion.svg
      className="absolute opacity-20"
      style={{ left: `${x}%`, top: `${y}%` }}
      width={size}
      height={size}
      viewBox="0 0 30 30"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0.8],
        y: [y - 50, y + 50],
        opacity: [0, 0.2, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 20 + Math.random() * 10,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 5,
      }}
    >
      <path d={shape} fill="url(#grad)" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF00CC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FF66FF" stopOpacity="0.6" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default function WaitlistPage() {
  const isMobile = useIsMobile();
  const { mouseX, mouseY } = useMousePosition();

  /* ---------------- state ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [isValid, setIsValid] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsValid(!!phoneNumber && isValidPhoneNumber(phoneNumber));
  }, [phoneNumber]);

  /* ---------------- hero entrance ---------------- */
  const controls = useAnimation();
  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, []);

  /* ---------------- dynamic gradient ---------------- */
  const angle = useMotionValue(135);
  const gradientX = useTransform(
    mouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 0],
    [-50, 50],
  );
  const gradientY = useTransform(
    mouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 0],
    [-50, 50],
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
          ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 7,
        );
        rotX.set(
          (-(e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) *
            7,
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
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-16 text-white">
      {/* Dynamic gradient backdrop */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: useTransform(
            angle,
            (a) =>
              `linear-gradient(${a}deg, #2a0b4a 0%, #5a1b8a 50%, #7a2bca 100%)`,
          ),
          transform: `translate(${gradientX}px, ${gradientY}px)`,
        }}
      />

      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Dynamic gradient blobs */}
        <motion.div
          className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/25 blur-[160px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-purple-600/25 blur-[160px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/10 blur-[200px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />

        {/* Interactive particles */}
        {[...Array(40)].map((_, i) => (
          <Dot key={`d${i}`} />
        ))}
        {[...Array(20)].map((_, i) => (
          <Star key={`s${i}`} />
        ))}
        {[...Array(8)].map((_, i) => (
          <FloatingShape key={`fs${i}`} index={i} />
        ))}
      </div>

      {/* Hero section */}
      <motion.section
        initial={{ opacity: 0, y: 80 }}
        animate={controls}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-[1200px] flex-col items-center justify-center gap-12 md:flex-row-reverse md:gap-16 lg:gap-24"
      >
        {/* Content section */}
        <div className="flex w-full max-w-md flex-col items-center text-center md:items-center lg:items-start lg:text-left">
          {/* Logo */}
          <motion.div
            className="mb-8 flex items-center gap-3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="relative">
              <Image
                src="/icon.png"
                alt="logo"
                width={48}
                height={48}
                className="rounded-xl"
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
            <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-3xl font-bold text-transparent">
              oppfy
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mb-8 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Real moments,{" "}
            <span className="bg-gradient-to-r from-[#F214FF] to-[#FF14F0] bg-clip-text text-transparent">
              captured by friends
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="mb-12 max-w-md text-lg text-white/80 md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Oppfy is almost here. Join our waitlist to secure early access.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            whileTap={{ scale: 0.98 }}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 0 30px rgba(255, 0, 204, 0.3)",
            }}
            onClick={() => setModalOpen(true)}
            className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#FF00CC] to-[#FF66FF] px-8 py-4 text-lg font-medium tracking-wide text-white"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Join Waitlist
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:translate-x-1"
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
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#FF66FF] to-[#FF00CC] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              initial={{ x: "100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.4 }}
            />
          </motion.button>
        </div>

        {/* Phone visual - hidden on mobile */}
        {!isMobile && (
          <motion.div
            style={{
              rotateX: rotX,
              rotateY: rotY,
              scale,
              transformStyle: "preserve-3d",
              transformPerspective: 1200,
            }}
            whileHover={{ scale: 1.05 }}
            className="relative flex justify-center"
          >
            <div className="relative aspect-[9/16] w-[360px] p-2">
              {/* Glassy phone frame */}
              <div className="absolute inset-0 rounded-[52px] bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm" />
              <div className="absolute inset-[1px] rounded-[50px] bg-black/10 backdrop-blur-md" />

              {/* Video container with outer border */}
              <div className="relative h-full w-full overflow-hidden rounded-[48px] ring-[0.5px] ring-inset ring-white/30">
                <video
                  src="/vid.mp4"
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                  loop
                />
              </div>
            </div>

            {/* Animated glow effect */}
            <motion.div
              className="absolute -inset-6 -z-10 rounded-[60px] blur-2xl"
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                background:
                  "radial-gradient(circle, #F214FF99 0%, #F214FF00 70%)",
              }}
            />
          </motion.div>
        )}
      </motion.section>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-sm"
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
                    We'll text you when we launch
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
