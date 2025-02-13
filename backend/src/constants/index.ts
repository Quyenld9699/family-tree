export enum UserRoles {
    ADMIN = 'admin',
    USER = 'user',
}

export enum AccountType {
    GOOGLE = 'google',
    GITHUB = 'github',
    NORMAL = 'normal',
}

export enum ReturnStatusCode {
    SUCCESS = 200,
    CREATED = 201,
    NOT_FOUND = 404,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_ACTIVATE_ACCOUNT = 402,
    EMAIL_REGISTER_EXIST = 405,
}

export enum Gender {
    MALE = 0,
    FEMALE = 1,
}
