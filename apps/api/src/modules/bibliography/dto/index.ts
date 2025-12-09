import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum CitationType {
  BOOK = 'BOOK',
  ARTICLE = 'ARTICLE',
  JOURNAL = 'JOURNAL',
  WEBSITE = 'WEBSITE',
  THESIS = 'THESIS',
  CONFERENCE = 'CONFERENCE',
  REPORT = 'REPORT',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST',
  OTHER = 'OTHER',
}

export enum CitationStyle {
  APA = 'APA',
  MLA = 'MLA',
  CHICAGO = 'CHICAGO',
  HARVARD = 'HARVARD',
  IEEE = 'IEEE',
  VANCOUVER = 'VANCOUVER',
}

export class CreateBibliographyDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;
}

export class CreateCitationDto {
  @IsEnum(CitationType)
  type: CitationType;

  @IsString()
  title: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsDateString()
  accessDate?: string;

  // Book fields
  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  edition?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  pages?: string;

  // Article fields
  @IsOptional()
  @IsString()
  journal?: string;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  issue?: string;

  @IsOptional()
  @IsString()
  doi?: string;

  // Website fields
  @IsOptional()
  @IsString()
  siteName?: string;

  // Notes
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateCitationDto {
  @IsOptional()
  @IsEnum(CitationType)
  type?: CitationType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  authors?: string[];

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsDateString()
  accessDate?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  edition?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  pages?: string;

  @IsOptional()
  @IsString()
  journal?: string;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  issue?: string;

  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
