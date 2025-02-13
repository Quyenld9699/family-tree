import { Injectable } from '@nestjs/common';
import { CreateSpouseDto } from './dto/create-spouse.dto';
import { UpdateSpouseDto } from './dto/update-spouse.dto';

@Injectable()
export class SpouseService {
  create(createSpouseDto: CreateSpouseDto) {
    return 'This action adds a new spouse';
  }

  findAll() {
    return `This action returns all spouse`;
  }

  findOne(id: number) {
    return `This action returns a #${id} spouse`;
  }

  update(id: number, updateSpouseDto: UpdateSpouseDto) {
    return `This action updates a #${id} spouse`;
  }

  remove(id: number) {
    return `This action removes a #${id} spouse`;
  }
}
