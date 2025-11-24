import { Controller, Post, Body, UseGuards, Get, Delete, Param, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('login-guest')
    async loginGuest(@Body('code') code: string) {
        return this.authService.loginGuest(code);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('guest-code')
    async generateGuestCode(@Body() body: { duration: number; note: string }) {
        return this.authService.generateGuestCode(body.duration, body.note);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('guest-code')
    async listGuestCodes() {
        return this.authService.listGuestCodes();
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('guest-code/:id')
    async revokeGuestCode(@Param('id') id: string) {
        return this.authService.revokeGuestCode(id);
    }
}
