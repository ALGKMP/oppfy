type ErrorDomain =
  | "User"
  | "Profile"
  | "Comment"
  | "Social"
  | "Post"
  | "Aws"
  | "Friend"
  | "Block"
  | "Follow"
  | "PostInteraction";

// Type to ensure error names follow the pattern
type ErrorClassName<D extends ErrorDomain> = `${D}Error`;

// Factory function to create base error classes
export function createBaseErrorClass<D extends ErrorDomain>(domain: D) {
  const className = `${domain}Error`;
  return class extends Error {
    constructor(message: string) {
      super(message);
      this.name = className;
    }
  };
}
