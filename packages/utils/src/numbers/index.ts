type Abbreviation = "K" | "M" | "B";

export const abbreviateNumber = (value: number): string => {
  let newValue = value;
  const suffixes: Abbreviation[] = ["K", "M", "B"];
  let suffixIndex = 0;
  let roundedValue: number;

  while (newValue >= 1000 && suffixIndex < suffixes.length) {
    suffixIndex++;
    newValue /= 1000;
  }

  if (suffixIndex === 0) {
    return value.toString(); // Return the original number if less than 1000
  }

  // Determine if decimal part is needed
  const isInt = newValue % 1 === 0;
  if (isInt) {
    roundedValue = Math.floor(newValue);
  } else {
    // Show one decimal place if needed, but remove trailing zeros
    roundedValue = Math.floor(newValue * 10) / 10;
  }

  return `${roundedValue}${suffixes[suffixIndex - 1]}`;
};
