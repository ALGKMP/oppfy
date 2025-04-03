import { differenceInYears } from "date-fns";

export class AgeChecker {
  private birthDate: Date;
  private isValid: boolean;

  constructor(birthDate: Date) {
    if (isNaN(birthDate.getTime())) {
      throw new Error("Invalid date provided");
    }

    this.birthDate = birthDate;
    this.isValid = true; // Assume valid until proven otherwise
  }

  private calculateAge(): number {
    const today = new Date();
    return differenceInYears(today, this.birthDate);
  }

  isAtLeast(age: number): AgeChecker {
    if (this.isValid && this.calculateAge() < age) {
      this.isValid = false;
    }
    return this;
  }

  isAtMost(age: number): AgeChecker {
    if (this.isValid && this.calculateAge() > age) {
      this.isValid = false;
    }
    return this;
  }

  checkValid(): boolean {
    return this.isValid;
  }
}

export const abbreviatedTimeAgo = (
  timestamp: string | number | Date,
): string => {
  const currentTime = Date.now();
  const pastTime = new Date(timestamp).getTime();
  const elapsed = currentTime - pastTime;

  const units = [
    { name: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { name: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { name: "week", ms: 7 * 24 * 60 * 60 * 1000 },
    { name: "day", ms: 24 * 60 * 60 * 1000 },
    { name: "hour", ms: 60 * 60 * 1000 },
    { name: "minute", ms: 60 * 1000 },
    { name: "second", ms: 1000 },
  ];

  for (const unit of units) {
    const value = Math.floor(elapsed / unit.ms);
    if (value >= 1) {
      return `${value}${unit.name.charAt(0)}`;
    }
  }

  return "now";
};
