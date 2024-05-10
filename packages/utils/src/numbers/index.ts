export const abbreviateNumber = (number: number): string => {
  const abbreviations = ["", "k", "M", "B", "T"];
  const tier = (Math.log10(Math.abs(number)) / 3) | 0;

  if (tier === 0) return number.toString();

  const suffix = abbreviations[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;

  return scaled.toFixed(1) + suffix;
};
