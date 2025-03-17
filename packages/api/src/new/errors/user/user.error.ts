/* import { createBaseErrorClass, createErrorNamespace,  } from '../errorFactory';

const UserDomain = createBaseErrorClass('User');

export namespace UserErrors {
    const RepositoryError = UserDomain.Repository;
    const ServiceError = UserDomain.Service;

    export class UserNotFound extends RepositoryError {
        constructor() {
            super('User not found');
            this.name = 'UserNotFoundError';
        }
    } 

    export class UserAlreadyExists extends RepositoryError {
        constructor() {
            super('User already exists');
            this.name = 'UserAlreadyExistsError';
        }
    }
} */