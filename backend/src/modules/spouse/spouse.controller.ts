import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SpouseService } from './spouse.service';
import { CreateSpouseDto } from './dto/create-spouse.dto';
import { UpdateSpouseDto } from './dto/update-spouse.dto';

@Controller('spouse')
export class SpouseController {
  constructor(private readonly spouseService: SpouseService) {}

  @Post()
  create(@Body() createSpouseDto: CreateSpouseDto) {
    return this.spouseService.create(createSpouseDto);
  }

  @Get()
  findAll() {
    return this.spouseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spouseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSpouseDto: UpdateSpouseDto) {
    return this.spouseService.update(+id, updateSpouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spouseService.remove(+id);
  }
}
