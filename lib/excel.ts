import ExcelJS from 'exceljs';

import {
  CURRENCY_SYMBOLS,
  getExcelCurrencyNumberFormat
} from '@/lib/currency';
import { PRODUCT_TYPE_LABELS } from '@/lib/constants';
import { buildSummary, detectYearFromDate } from '@/lib/summary';
import type { ExportRequest, ExtractedLine } from '@/types/extractor';

function pickEffectiveYear(items: ExtractedLine[], yearMode: ExportRequest['yearMode']) {
  if (yearMode !== 'auto') {
    return yearMode;
  }

  for (const item of items) {
    const year = detectYearFromDate(item.fecha);
    if (year) {
      return year;
    }
  }

  return new Date().getFullYear().toString();
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F3864' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}

function setCurrencyColumn(column: ExcelJS.Column, currency: ExportRequest['currency']) {
  column.numFmt = getExcelCurrencyNumberFormat(currency);
}

export async function buildWorkbookBuffer({
  items,
  productType,
  yearMode,
  currency
}: ExportRequest) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Extractor.app';
  workbook.created = new Date();

  const detailSheet = workbook.addWorksheet('Detalle');
  detailSheet.columns = [
    { header: 'Factura', key: 'factura', width: 28 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Destino', key: 'destino', width: 14 },
    { header: 'Ref. interna', key: 'ref_interna', width: 16 },
    { header: 'Tipo de producto', key: 'tipo', width: 24 },
    { header: 'Modelo', key: 'modelo', width: 18 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: `Precio unit. (${CURRENCY_SYMBOLS[currency]})`, key: 'precio_unitario', width: 18 },
    { header: `Total (${CURRENCY_SYMBOLS[currency]})`, key: 'total', width: 18 },
    { header: 'Archivo origen', key: 'source_file', width: 28 }
  ];
  styleHeaderRow(detailSheet.getRow(1));
  items.forEach((item) => detailSheet.addRow(item));
  setCurrencyColumn(detailSheet.getColumn('precio_unitario'), currency);
  setCurrencyColumn(detailSheet.getColumn('total'), currency);

  const summaryByInvoiceSheet = workbook.addWorksheet('Resumen por factura');
  summaryByInvoiceSheet.columns = [
    { header: 'Factura', key: 'factura', width: 28 },
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Destino', key: 'destino', width: 14 },
    { header: 'Nº líneas', key: 'lineas', width: 12 },
    { header: 'Uds.', key: 'unidades', width: 12 },
    { header: `Total (${CURRENCY_SYMBOLS[currency]})`, key: 'total', width: 18 }
  ];
  styleHeaderRow(summaryByInvoiceSheet.getRow(1));

  const invoices = [...new Set(items.map((item) => item.factura))];
  invoices.forEach((invoice) => {
    const rows = items.filter((item) => item.factura === invoice);
    summaryByInvoiceSheet.addRow({
      factura: invoice,
      fecha: rows[0]?.fecha || '',
      destino: rows[0]?.destino || '',
      lineas: rows.length,
      unidades: rows.reduce((sum, row) => sum + row.cantidad, 0),
      total: rows.reduce((sum, row) => sum + row.total, 0)
    });
  });

  const totalSummary = buildSummary(items);
  summaryByInvoiceSheet.addRow({
    factura: 'TOTAL GENERAL',
    fecha: '',
    destino: '',
    lineas: totalSummary.lineas,
    unidades: totalSummary.unidades,
    total: totalSummary.total
  });
  setCurrencyColumn(summaryByInvoiceSheet.getColumn('total'), currency);

  const summaryByTypeSheet = workbook.addWorksheet('Resumen por tipo');
  summaryByTypeSheet.columns = [
    { header: 'Tipo de producto', key: 'tipo', width: 28 },
    { header: 'Nº líneas', key: 'lineas', width: 12 },
    { header: 'Uds.', key: 'unidades', width: 12 },
    { header: `Importe total (${CURRENCY_SYMBOLS[currency]})`, key: 'total', width: 18 }
  ];
  styleHeaderRow(summaryByTypeSheet.getRow(1));

  const types = [...new Set(items.map((item) => item.tipo || 'Sin tipo'))].sort();
  types.forEach((type) => {
    const rows = items.filter((item) => (item.tipo || 'Sin tipo') === type);
    summaryByTypeSheet.addRow({
      tipo: type,
      lineas: rows.length,
      unidades: rows.reduce((sum, row) => sum + row.cantidad, 0),
      total: rows.reduce((sum, row) => sum + row.total, 0)
    });
  });
  setCurrencyColumn(summaryByTypeSheet.getColumn('total'), currency);

  const year = pickEffectiveYear(items, yearMode);
  const label = PRODUCT_TYPE_LABELS[productType];

  return {
    filename: `${label}_MartinezHermanos_${year}_${currency}.xlsx`,
    buffer: await workbook.xlsx.writeBuffer()
  };
}
