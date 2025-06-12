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
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-16"
      style={{ background: "#F214FF" }}
    >
      {/* Centered content */}
      <section className="flex w-full max-w-5xl flex-col items-center justify-center gap-12 md:flex-row md:gap-16">
        {/* Phone visual */}
        <div className="relative mb-8 flex justify-center md:mb-0">
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
        <div className="flex flex-col items-center gap-8 text-center md:items-start md:text-left">
          <div>
            {/* Logo */}
            <Image
              src="/icon.png"
              alt="Oppfy logo"
              width={56}
              height={56}
              className="mx-auto mb-3 md:mx-0"
            />
            <span
              className="mb-2 inline-block text-3xl font-black tracking-tight text-white"
              style={{ letterSpacing: "-0.04em" }}
            >
              Oppfy
            </span>
            <h1
              className="mb-4 text-5xl font-extrabold leading-tight text-white md:text-6xl"
              style={{ letterSpacing: "-0.04em" }}
            >
              Real moments,
              <br />
              <span className="text-white/80">captured by friends</span>
            </h1>
          </div>
          {/* Pre-Order on the App Store Button */}
          <a
            href="#" // Replace with your App Store pre-order link
            className="mx-auto mt-4 flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-lg font-semibold text-black shadow-md transition hover:bg-gray-100 md:w-auto"
            style={{ textDecoration: "none" }}
          >
            <svg
              fill="#ffffff"
              width="24"
              height="24"
              viewBox="0 0 22.773 22.773"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#ffffff"
            >
              <g>
                <g>
                  <path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573 c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z"></path>
                  <path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334 c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0 c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019 c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464 c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648 c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z"></path>
                </g>
              </g>
            </svg>
            Pre-Order on the App Store
          </a>
          {/* Join our Discord Community Button */}
          <a
            href="#" // Replace with your Discord invite link
            className="mx-auto mt-3 flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-[#5865F2] px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-[#4752c4] md:w-auto"
            style={{ textDecoration: "none" }}
          >
            <svg
              viewBox="0 -28.5 256 256"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <g>
                <path
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill="#FFFF"
                  fill-rule="nonzero"
                ></path>
              </g>
            </svg>
            Join our Discord community
          </a>
        </div>
      </section>
      {/* Modal (unchanged) */}
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
      {/* Transparent Footer */}
      <footer className="mt-12 flex w-full flex-col items-center justify-center bg-transparent py-8">
        <div className="mb-2 flex items-center justify-center gap-6">
          {/* Instagram Icon */}
          <a
            href="#"
            aria-label="Instagram"
            className="opacity-70 transition hover:opacity-100"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="6"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="5"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="17" cy="7" r="1.2" fill="white" />
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
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L20 20M20 4L4 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </div>
        <div className="mb-2 text-center text-sm text-white opacity-70">
          © {new Date().getFullYear()} Oppfy Inc.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white opacity-70">
          <a href="#" className="transition hover:opacity-100">
            Privacy Policy
          </a>
          <span className="mx-1">•</span>
          <a href="#" className="transition hover:opacity-100">
            Terms of Service
          </a>
          <span className="mx-1">•</span>
          <a href="#" className="transition hover:opacity-100">
            Support
          </a>
          <span className="mx-1">•</span>
          <a href="#" className="transition hover:opacity-100">
            Data Deletion
          </a>
        </div>
      </footer>
    </main>
  );
}
