import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from '../document-categories';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsIn(DOCUMENT_CATEGORIES)
  category!: DocumentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
