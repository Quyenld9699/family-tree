import { Test, TestingModule } from '@nestjs/testing';
import { ParentChildController } from './parent-child.controller';
import { ParentChildService } from './parent-child.service';

describe('ParentChildController', () => {
  let controller: ParentChildController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentChildController],
      providers: [ParentChildService],
    }).compile();

    controller = module.get<ParentChildController>(ParentChildController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
