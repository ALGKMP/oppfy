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
