import { PartialType } from '@nestjs/swagger';
import { CreateWellnessLogDto } from './create-wellness-log.dto';

export class UpdateWellnessLogDto extends PartialType(CreateWellnessLogDto) {}
