import { IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementPattern, SelectionType } from '@prisma/client';

export class ExerciseSelectionItemDto {
  @IsString()
  exerciseId: string;

  @IsEnum(MovementPattern)
  pattern: MovementPattern;

  @IsEnum(SelectionType)
  type: SelectionType;
}

export class GenerateProgramDto {
  @IsString()
  assessmentId: string;

  @IsString()
  clientId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseSelectionItemDto)
  selectedExercises: ExerciseSelectionItemDto[];
}

export class UpdateSelectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseSelectionItemDto)
  selections: ExerciseSelectionItemDto[];
}
