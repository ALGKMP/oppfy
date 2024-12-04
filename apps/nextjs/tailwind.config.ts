import type { Config } from "tailwindcss";

import baseConfig from "@oppfy/tailwind-config";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [baseConfig],
} satisfies Config;
