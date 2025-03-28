import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
