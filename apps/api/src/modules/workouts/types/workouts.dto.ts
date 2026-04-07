import {
  IsString, IsOptional, IsInt, IsEnum,
  IsArray, IsObject, Min, MinLength,
} from 'class-validator';

export enum WorkoutStatusEnum {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateWorkoutDto {
  @IsString()
  programId: string;

  @IsString()
  clientId: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  dayLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  blocks?: any[];
}

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  dayLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(WorkoutStatusEnum)
  status?: WorkoutStatusEnum;

  @IsOptional()
  @IsArray()
  blocks?: any[];
}

export class CreateWorkoutLogDto {
  @IsString()
  workoutId: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsArray()
  entries: any[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  rpe?: number;
}
