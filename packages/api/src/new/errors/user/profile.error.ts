class ProfileRepositoryError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ProfileRepositoryError";
    }
  }

  
class ProfileServiceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ProfileServiceError";
    }
}

// export in namespace
export namespace ProfileError {
    export class ProfileNotFound extends ProfileRepositoryError {
        constructor() {
            super("Profile not found");
            this.name = "ProfileNotFoundError";
        }
    }
}