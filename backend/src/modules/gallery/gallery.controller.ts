import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, Body, Query, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRoles } from '../../constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Gallery')
@ApiBearerAuth()
@Controller('gallery')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}

    @Post('upload')
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: { personId?: string; spouseId?: string; description?: string; eventDate?: string; setAsAvatar?: boolean }) {
        return this.galleryService.uploadImage(file, body);
    }

    @Get('person/:id')
    async getByPerson(@Param('id') id: string) {
        return this.galleryService.getImagesByPerson(id);
    }

    @Get('spouse/:id')
    async getBySpouse(@Param('id') id: string) {
        return this.galleryService.getImagesBySpouse(id);
    }

    @Delete(':id')
    @Roles(UserRoles.ADMIN, UserRoles.EDITOR)
    async delete(@Param('id') id: string) {
        return this.galleryService.deleteImage(id);
    }
}
