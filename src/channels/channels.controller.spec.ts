import { Test, TestingModule } from '@nestjs/testing';
import { GuildChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

describe('ChannelsController', () => {
  let controller: GuildChannelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuildChannelsController],
      providers: [ChannelsService],
    }).compile();

    controller = module.get<GuildChannelsController>(GuildChannelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
