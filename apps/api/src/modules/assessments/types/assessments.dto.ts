import { IsString, IsObject, IsArray, IsOptional } from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  clientId: string;

  @IsObject()
  data: Record<string, any>;
}

export class AssessmentFiltersDto {
  @IsOptional()
  @IsString()
  clientId?: string;
}
