import { Test, TestingModule } from '@nestjs/testing';
import { ParentChildService } from './parent-child.service';

describe('ParentChildService', () => {
  let service: ParentChildService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParentChildService],
    }).compile();

    service = module.get<ParentChildService>(ParentChildService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
