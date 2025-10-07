import { motion } from "framer-motion";

export const FloatingShape = ({ index }: { index: number }) => {
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
