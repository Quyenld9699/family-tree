import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { SpouseService } from './spouse.service';
import { CreateSpouseDto } from './dto/create-spouse.dto';
import { UpdateSpouseDto } from './dto/update-spouse.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Spouse } from './schemas/spouse.schema';

@ApiTags('Spouse Relationships')
@Controller('spouse')
export class SpouseController {
    constructor(private readonly spouseService: SpouseService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new spouse relationship' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Spouse relationship successfully created',
        type: Spouse,
    })
    create(@Body() createSpouseDto: CreateSpouseDto) {
        return this.spouseService.create(createSpouseDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all spouse relationships' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all spouse relationships',
        type: [Spouse],
    })
    findAll() {
        return this.spouseService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a spouse relationship by id' })
    @ApiParam({ name: 'id', description: 'Spouse relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return a spouse relationship by id',
        type: Spouse,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Spouse relationship not found',
    })
    findOne(@Param('id') id: string) {
        return this.spouseService.findOne(id);
    }

    @Get('person/:personId')
    @ApiOperation({ summary: 'Get all spouse relationships for a specific person' })
    @ApiParam({ name: 'personId', description: 'Person ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all spouse relationships for a person',
        type: [Spouse],
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Person not found',
    })
    findByPerson(@Param('personId') personId: string) {
        return this.spouseService.findByPerson(personId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a spouse relationship' })
    @ApiParam({ name: 'id', description: 'Spouse relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Spouse relationship successfully updated',
        type: Spouse,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Spouse relationship not found',
    })
    update(@Param('id') id: string, @Body() updateSpouseDto: UpdateSpouseDto) {
        return this.spouseService.update(id, updateSpouseDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a spouse relationship' })
    @ApiParam({ name: 'id', description: 'Spouse relationship ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Spouse relationship successfully deleted',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Spouse relationship not found',
    })
    remove(@Param('id') id: string) {
        return this.spouseService.remove(id);
    }
}
