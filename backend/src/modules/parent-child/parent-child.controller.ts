import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { ParentChildService } from './parent-child.service';
import { CreateParentChildDto } from './dto/create-parent-child.dto';
import { UpdateParentChildDto } from './dto/update-parent-child.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParentChild } from './schemas/parent-child.schema';

@ApiTags('Parent-Child Relationships')
@Controller('parent-child')
export class ParentChildController {
    constructor(private readonly parentChildService: ParentChildService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new parent-child relationship' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Parent-child relationship successfully created',
        type: ParentChild,
    })
    create(@Body() createParentChildDto: CreateParentChildDto) {
        return this.parentChildService.create(createParentChildDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all parent-child relationships' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all parent-child relationships',
        type: [ParentChild],
    })
    findAll() {
        return this.parentChildService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a parent-child relationship by id' })
    @ApiParam({ name: 'id', description: 'Parent-child relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return a parent-child relationship by id',
        type: ParentChild,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parent-child relationship not found',
    })
    findOne(@Param('id') id: string) {
        return this.parentChildService.findOne(id);
    }

    @Get('parent/:parentId')
    @ApiOperation({ summary: 'Get all children for a specific parent' })
    @ApiParam({ name: 'parentId', description: 'Parent ID (Spouse relationship ID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all children for a parent',
        type: [ParentChild],
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parent not found',
    })
    findByParent(@Param('parentId') parentId: string) {
        return this.parentChildService.findByParent(parentId);
    }

    @Get('child/:childId')
    @ApiOperation({ summary: 'Get parents for a specific child' })
    @ApiParam({ name: 'childId', description: 'Child ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all parent relationships for a child',
        type: [ParentChild],
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Child not found',
    })
    findByChild(@Param('childId') childId: string) {
        return this.parentChildService.findByChild(childId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a parent-child relationship' })
    @ApiParam({ name: 'id', description: 'Parent-child relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parent-child relationship successfully updated',
        type: ParentChild,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parent-child relationship not found',
    })
    update(@Param('id') id: string, @Body() updateParentChildDto: UpdateParentChildDto) {
        return this.parentChildService.update(id, updateParentChildDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a parent-child relationship' })
    @ApiParam({ name: 'id', description: 'Parent-child relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Parent-child relationship successfully deleted',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Parent-child relationship not found',
    })
    remove(@Param('id') id: string) {
        return this.parentChildService.remove(id);
    }
}
