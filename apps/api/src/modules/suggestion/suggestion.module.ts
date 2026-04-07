import { Module } from '@nestjs/common';
import { SuggestionService } from './services/suggestion.service';
import { SuggestionController } from './controllers/suggestion.controller';
import { SuggestionRepository } from './repositories/suggestion.repository';

@Module({
  providers: [SuggestionService, SuggestionRepository],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
