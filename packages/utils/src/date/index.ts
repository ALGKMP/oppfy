import { differenceInYears } from "date-fns";

type DateFormat = "MMDDYYYY" | "DDMMYYYY" | "YYYYMMDD";
type DatePositions = {
  [K in DateFormat]: {
    year: [number, number];
    month: [number, number];
    day: [number, number];
  };
};

export const convertToDateObject = (
  dateString: string,
  format: DateFormat,
): Date => {
  if (!dateString || dateString.length !== 8) {
    throw new Error("Invalid date string length");
  }

  const formatPositions: DatePositions = {
    MMDDYYYY: { month: [0, 2], day: [2, 4], year: [4, 8] },
    DDMMYYYY: { day: [0, 2], month: [2, 4], year: [4, 8] },
    YYYYMMDD: { year: [0, 4], month: [4, 6], day: [6, 8] },
  };

  const positions = formatPositions[format];

  const year = parseInt(
    dateString.substring(positions.year[0], positions.year[1]),
    10,
  );
  const month =
    parseInt(dateString.substring(positions.month[0], positions.month[1]), 10) -
    1;
  const day = parseInt(
    dateString.substring(positions.day[0], positions.day[1]),
    10,
  );

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
};

export class AgeChecker {
  private birthDate: Date;
  private isValid: boolean;

  constructor(birthDate: Date) {
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
