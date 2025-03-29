import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query } from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Person } from './schemas/person.schema';

@ApiTags('Person')
@Controller('person')
export class PersonController {
    constructor(private readonly personService: PersonService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new person' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Person successfully created',
        type: Person,
    })
    create(@Body() createPersonDto: CreatePersonDto) {
        // console.log(createPersonDto);
        return this.personService.create(createPersonDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all persons' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return all persons',
        type: [Person],
    })
    findAll() {
        return this.personService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a person by id' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return a person by id',
        type: Person,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Person not found',
    })
    findOne(@Param('id') id: string) {
        return this.personService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a person' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Person successfully updated',
        type: Person,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Person not found',
    })
    update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
        return this.personService.update(id, updatePersonDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a person' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Person successfully deleted',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Person not found',
    })
    remove(@Param('id') id: string) {
        return this.personService.remove(id);
    }

    @Get(':id/generations/:generations')
    @ApiOperation({ summary: 'Get N generations of a person including spouse relationships and children' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiParam({ name: 'generations', required: true, type: Number, description: 'Number of generations to get' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Return N generations of the person',
        schema: {
            type: 'object',
            properties: {
                person: { type: 'object', $ref: '#/components/schemas/Person' },
                spouseRelationships: { type: 'array', items: { $ref: '#/components/schemas/Spouse' } },
                children: { type: 'array', items: { $ref: '#/components/schemas/ParentChild' } },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Person not found',
    })
    getNGenerations(@Param('id') id: string, @Param('generations') generations: number) {
        console.log(id, generations);
        return this.personService.getNGenerations(id, generations);
    }
}
