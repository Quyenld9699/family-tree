import {
    Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Headers, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoles } from '../../constants';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('Event')
@Controller('event')
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly config: ConfigService,
    ) {}

    // Cron — KHÔNG dùng JWT, xác thực bằng CRON_SECRET. Đặt TRƯỚC ':id' route.
    @Get('cron/daily-notify')
    @ApiOperation({ summary: 'Vercel Cron: gửi thông báo Telegram theo ngày' })
    async dailyNotify(@Headers('authorization') auth: string) {
        const secret = this.config.get<string>('CRON_SECRET');
        if (!secret || auth !== `Bearer ${secret}`) {
            throw new UnauthorizedException('Invalid cron secret');
        }
        return this.eventService.runDailyNotify();
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Danh sách event, sort theo ngày sắp tới' })
    findAll() {
        return this.eventService.findAll();
    }

    @Get('notifications')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Event có trigger hôm nay (cho chuông FE)' })
    notifications() {
        return this.eventService.getNotifications();
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    create(@Body() dto: CreateEventDto) {
        return this.eventService.create(dto);
    }

    @Post('sync-all')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN)
    @ApiOperation({ summary: 'Tính lại toàn bộ auto-event từ persons + dọn orphan' })
    syncAll() {
        return this.eventService.syncAll();
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
        return this.eventService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    remove(@Param('id') id: string) {
        return this.eventService.remove(id);
    }
}
