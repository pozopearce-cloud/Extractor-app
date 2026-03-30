export type ProductType =
  | 'filtros'
  | 'refrigeracion'
  | 'vehiculos'
  | 'todo'
  | 'custom';

export type AppLanguage = 'es' | 'en' | 'fr' | 'zh';
export type CurrencyCode = 'EUR' | 'XAF' | 'XOF';

export type YearMode = 'auto' | `${number}`;

export type FileProcessStatus =
  | 'pending'
  | 'reading'
  | 'extracting'
  | 'done'
  | 'error';

export interface ExtractedLine {
  factura: string;
  fecha: string;
  destino: string;
  ref_interna: string;
  tipo: string;
  modelo: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  source_file: string;
}

export interface ExtractRequest {
  productType: ProductType;
  customDescription?: string;
  yearMode: YearMode;
  currency: CurrencyCode;
  files: File[];
}

export interface ExtractResponseFile {
  name: string;
  status: ExtractedFileStatus;
  extractedCount: number;
  errorMessage?: string;
}

export type ExtractedFileStatus = 'done' | 'error';

export interface ExtractSummary {
  facturas: number;
  lineas: number;
  unidades: number;
  total: number;
}

export interface ExtractResponse {
  items: ExtractedLine[];
  files: ExtractResponseFile[];
  summary: ExtractSummary;
}

export interface ExportRequest {
  items: ExtractedLine[];
  productType: ProductType;
  yearMode: YearMode;
  currency: CurrencyCode;
}
