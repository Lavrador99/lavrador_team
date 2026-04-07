import {
  IsString, IsEnum, IsArray, IsOptional,
  IsBoolean, IsUrl, MinLength,
} from 'class-validator';
import { MovementPattern, Equipment, TrainingLevel } from '@prisma/client';

export class CreateExerciseDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEnum(MovementPattern)
  pattern: MovementPattern;

  @IsArray()
  @IsString({ each: true })
  primaryMuscles: string[];

  @IsArray()
  @IsString({ each: true })
  secondaryMuscles: string[];

  @IsArray()
  @IsEnum(Equipment, { each: true })
  equipment: Equipment[];

  @IsEnum(TrainingLevel)
  level: TrainingLevel;

  @IsOptional()
  @IsUrl()
  gifUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clinicalNotes?: string[];
}

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsEnum(MovementPattern)
  pattern?: MovementPattern;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryMuscles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryMuscles?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(Equipment, { each: true })
  equipment?: Equipment[];

  @IsOptional()
  @IsEnum(TrainingLevel)
  level?: TrainingLevel;

  @IsOptional()
  @IsUrl()
  gifUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clinicalNotes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ExerciseFiltersDto {
  @IsOptional()
  @IsEnum(MovementPattern)
  pattern?: MovementPattern;

  @IsOptional()
  @IsEnum(TrainingLevel)
  level?: TrainingLevel;

  // Comma-separated: 'BARRA,HALTERES'
  @IsOptional()
  @IsString()
  equipment?: string;

  // Filtro por músculo (texto livre)
  @IsOptional()
  @IsString()
  muscle?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
