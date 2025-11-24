import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}

    @Post('upload')
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
    async delete(@Param('id') id: string) {
        return this.galleryService.deleteImage(id);
    }
}
