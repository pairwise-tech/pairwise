import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesController } from './challenges.controller';

describe('Challenges Controller', () => {
  let controller: ChallengesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengesController],
    }).compile();

    controller = module.get<ChallengesController>(ChallengesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
