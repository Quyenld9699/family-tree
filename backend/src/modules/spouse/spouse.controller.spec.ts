import { Test, TestingModule } from '@nestjs/testing';
import { SpouseController } from './spouse.controller';
import { SpouseService } from './spouse.service';

describe('SpouseController', () => {
  let controller: SpouseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpouseController],
      providers: [SpouseService],
    }).compile();

    controller = module.get<SpouseController>(SpouseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
