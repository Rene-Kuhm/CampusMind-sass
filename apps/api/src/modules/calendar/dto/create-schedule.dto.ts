import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
  Matches,
} from "class-validator";

export enum ClassType {
  THEORY = "THEORY",
  PRACTICE = "PRACTICE",
  LAB = "LAB",
  SEMINAR = "SEMINAR",
  TUTORING = "TUTORING",
}

export class CreateClassScheduleDto {
  @ApiProperty({ example: 1, description: "0=Domingo, 1=Lunes, etc." })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: "08:00" })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato de hora inválido. Usar HH:mm",
  })
  startTime!: string;

  @ApiProperty({ example: "10:00" })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Formato de hora inválido. Usar HH:mm",
  })
  endTime!: string;

  @ApiPropertyOptional({ example: "Aula 302" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  classroom?: string;

  @ApiPropertyOptional({ example: "Edificio Central" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  building?: string;

  @ApiPropertyOptional({ enum: ClassType, example: ClassType.THEORY })
  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

  @ApiPropertyOptional({ example: "professor-id-123" })
  @IsOptional()
  @IsString()
  professorId?: string;

  @ApiPropertyOptional({ example: "2024-03-01" })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: "2024-07-15" })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class CreateProfessorDto {
  @ApiProperty({ example: "Dr. Juan Pérez" })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "jperez@universidad.edu" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: "Oficina 205, Edificio B" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  office?: string;

  @ApiPropertyOptional({ example: "Lunes y Miércoles 14:00-16:00" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  officeHours?: string;
}
