"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

import { api } from "~/trpc/react";

import "react-phone-number-input/style.css";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaitlistModal = ({ isOpen, onClose }: WaitlistModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>();
  const [isValid, setIsValid] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsValid(!!phoneNumber && isValidPhoneNumber(phoneNumber));
  }, [phoneNumber]);

  const joinWaitlist = api.waitlist.joinWaitlist.useMutation();

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

  const handleClose = () => {
    onClose();
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-30 flex items-center justify-center backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
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
              onClick={handleClose}
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
  );
};
