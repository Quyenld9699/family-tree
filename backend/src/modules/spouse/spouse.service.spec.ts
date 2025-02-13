import { Test, TestingModule } from '@nestjs/testing';
import { SpouseService } from './spouse.service';

describe('SpouseService', () => {
  let service: SpouseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpouseService],
    }).compile();

    service = module.get<SpouseService>(SpouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
