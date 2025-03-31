import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ReturnStatusCode } from '.';

export class ErrorUnauthorized extends UnauthorizedException {
    constructor(message?: string) {
        super({ message: message || 'Unauthorized', statusCode: ReturnStatusCode.UNAUTHORIZED });
        this.name = 'ErrorUnAuthorized';
    }
}

export class ErrorAcountNotActive extends UnauthorizedException {
    constructor(message?: string) {
        super({ message: message || 'User is not active', statusCode: ReturnStatusCode.NOT_ACTIVATE_ACCOUNT });
        this.name = 'ErrorAcountNotActive';
    }
}

export class ErrorEmailRegisterExist extends BadRequestException {
    constructor(message?: string) {
        super({ message: message || 'Email already exists!', statusCode: ReturnStatusCode.EMAIL_REGISTER_EXIST });
        this.name = 'ErrorEmailRegisterExist';
    }
}

export class ErrorExpiredToken extends BadRequestException {
    constructor(message?: string) {
        super({ message: message || 'Token expired', statusCode: ReturnStatusCode.UNAUTHORIZED });
        this.name = 'ErrorExpiredToken';
    }
}
