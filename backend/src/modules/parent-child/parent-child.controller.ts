import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParentChildService } from './parent-child.service';
import { CreateParentChildDto } from './dto/create-parent-child.dto';
import { UpdateParentChildDto } from './dto/update-parent-child.dto';

@Controller('parent-child')
export class ParentChildController {
  constructor(private readonly parentChildService: ParentChildService) {}

  @Post()
  create(@Body() createParentChildDto: CreateParentChildDto) {
    return this.parentChildService.create(createParentChildDto);
  }

  @Get()
  findAll() {
    return this.parentChildService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parentChildService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParentChildDto: UpdateParentChildDto) {
    return this.parentChildService.update(+id, updateParentChildDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parentChildService.remove(+id);
  }
}
