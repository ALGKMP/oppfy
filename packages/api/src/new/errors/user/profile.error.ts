/* import { createDomainErrors } from '../errorFactory';

const ProfileDomain = createDomainErrors('User');

export namespace ProfileError {
    const RepositoryError = ProfileDomain.Repository;
    const ServiceError = ProfileDomain.Service;

    export class ProfileNotFound extends RepositoryError {
        constructor() {
            super('Profile not found');
            this.name = 'ProfileNotFoundError';
        }
    }
} */