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
