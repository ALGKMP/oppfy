import { motion } from "framer-motion";

export const Dot = () => {
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
