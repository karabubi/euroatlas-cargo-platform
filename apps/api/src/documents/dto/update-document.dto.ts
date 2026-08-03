import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from '../document-categories';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(DOCUMENT_CATEGORIES)
  category?: DocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
