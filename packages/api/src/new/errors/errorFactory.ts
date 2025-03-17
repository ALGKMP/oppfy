type ErrorDomain = "User" | "Profile" | "Comment" | "Social" | "Post";
type ErrorLayer = "Repository" | "Service";

// Type to ensure error names follow the pattern
type ErrorClassName<
  D extends ErrorDomain,
  L extends ErrorLayer,
> = `${D}${L}Error`;

// Factory function to create base error classes
export function createBaseErrorClass<
  D extends ErrorDomain,
  L extends ErrorLayer,
>(domain: D, layer: L) {
  const className = `${domain}${layer}Error` as ErrorClassName<D, L>;

  return class extends Error {
    constructor(message: string) {
      super(message);
      this.name = className;
    }
  };
}

// Create a namespace factory for specific errors
export function createErrorNamespace<
  D extends ErrorDomain,
  L extends ErrorLayer,
>(BaseError: new (message: string) => Error) {
  return {
    BaseError,
    /*
    Can do more BaseErrors like this

    ValidationError: class extends BaseError {
      constructor(message: string) {
        super(`Validation error: ${message}`);
        this.name = "ValidationError";
      }
    },
    DatabaseError: class extends BaseError {
      constructor(originalError: unknown) {
        super(
          originalError instanceof Error
            ? originalError.message
            : "Unknown database error",
        );
        this.name = "DatabaseError";
      }
    },*/
  };
}
