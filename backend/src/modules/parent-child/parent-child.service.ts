import { Injectable } from '@nestjs/common';
import { CreateParentChildDto } from './dto/create-parent-child.dto';
import { UpdateParentChildDto } from './dto/update-parent-child.dto';

@Injectable()
export class ParentChildService {
  create(createParentChildDto: CreateParentChildDto) {
    return 'This action adds a new parentChild';
  }

  findAll() {
    return `This action returns all parentChild`;
  }

  findOne(id: number) {
    return `This action returns a #${id} parentChild`;
  }

  update(id: number, updateParentChildDto: UpdateParentChildDto) {
    return `This action updates a #${id} parentChild`;
  }

  remove(id: number) {
    return `This action removes a #${id} parentChild`;
  }
}
