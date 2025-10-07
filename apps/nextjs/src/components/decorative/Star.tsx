import { motion } from "framer-motion";

export const Star = () => {
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
