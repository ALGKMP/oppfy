class UserRepositoryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserRepositoryError";
    }
}

class UserNotFoundError extends UserRepositoryError {
    constructor() {
        super("User not found");
        this.name = "UserNotFoundError";
    }
}
