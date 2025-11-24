import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GuestCode, GuestCodeDocument } from './schemas/guest-code.schema';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserRoles } from 'src/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(GuestCode.name) private guestCodeModel: Model<GuestCodeDocument>,
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        // Check for Admin via Environment Variable
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
        if (username === 'admin' && pass === adminPassword) {
            return {
                _id: 'admin_static_id',
                name: 'Admin',
                role: UserRoles.ADMIN,
                email: 'admin@local',
            };
        }

        const user = await this.userService.findByUsername(username);
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { username: user.name, sub: user._id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }

    async loginGuest(code: string) {
        const guestCode = await this.guestCodeModel.findOne({ code, isActive: true });
        if (!guestCode) {
            throw new UnauthorizedException('Invalid or expired code');
        }

        if (new Date() > guestCode.expiredAt) {
            throw new UnauthorizedException('Code expired');
        }

        const payload = { username: 'Guest', sub: guestCode._id, role: UserRoles.GUEST };
        return {
            access_token: this.jwtService.sign(payload),
            role: UserRoles.GUEST,
        };
    }

    async generateGuestCode(durationInDays: number, note: string) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase(); // Simple random code
        const expiredAt = new Date();
        expiredAt.setDate(expiredAt.getDate() + durationInDays);

        const newCode = new this.guestCodeModel({
            code,
            expiredAt,
            note,
        });
        return newCode.save();
    }

    async revokeGuestCode(id: string) {
        return this.guestCodeModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }

    async listGuestCodes() {
        return this.guestCodeModel.find().sort({ createdAt: -1 }).exec();
    }
}
