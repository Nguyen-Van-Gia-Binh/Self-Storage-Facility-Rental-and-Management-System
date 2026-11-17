import type {
  OverdueReportResponse,
  SystemOccupancyReport,
  SystemRevenueReport,
} from '@/types';

type CellKind = 'text' | 'number' | 'percent';

interface SheetCell {
  value: string | number | null | undefined;
  kind?: CellKind;
}

interface SheetDefinition {
  name: string;
  headers: string[];
  rows: SheetCell[][];
}

export interface MultiSheetExportInput {
  revenue?: SystemRevenueReport;
  occupancy?: SystemOccupancyReport;
  overdue?: OverdueReportResponse;
  from: string;
  to: string;
  scopeName: string;
}

export function buildExportFilename(
  ext: 'xlsx' | 'csv',
  dateIso: string,
  facilityId?: number
): string {
  const cleanDate = dateIso.slice(0, 10);
  const scopePart = facilityId ? `_CoSo${facilityId}` : '';
  return `SmartStorage_BaoCaoDoanhThu${scopePart}_${cleanDate}.${ext}`;
}

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function cleanNumber(value: number | null | undefined): number {
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function cleanRatio(value: number | null | undefined): number | '' {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(4)) : '';
}

/**
 * Raw Data Hygiene CSV (UTF-8 with BOM, Row 1 = Headers, pure numbers & decimal ratios).
 */
export function buildRevenueCsv(
  revenue?: SystemRevenueReport,
  occupancy?: SystemOccupancyReport
): string {
  const facilities = revenue?.byFacility ?? [];
  const occMap = new Map(
    (occupancy?.data ?? []).map((item) => [item.facilityId, item])
  );

  const headers = [
    'Mã cơ sở',
    'Tên cơ sở',
    'Tiền thuê (VND)',
    'Phụ phí (VND)',
    'Gia hạn (VND)',
    'Phạt quá hạn (VND)',
    'Cọc đang giữ (VND)',
    'Đã hoàn (VND)',
    'Tổng doanh thu (VND)',
    'Tổng ô kho',
    'Đang thuê',
    'Còn trống',
    'Tỷ lệ lấp đầy',
  ];

  const lines: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const row of facilities) {
    const occ = occMap.get(row.facilityId);
    const values = [
      row.facilityId,
      row.facilityName,
      cleanNumber(row.rentalRevenue),
      cleanNumber(row.surchargeRevenue),
      cleanNumber(row.renewalRevenue),
      cleanNumber(row.overdueFeeRevenue),
      cleanNumber(row.depositBalance),
      cleanNumber(row.refundAmount),
      cleanNumber(row.totalRevenue),
      occ ? cleanNumber(occ.totalUnits) : 0,
      occ ? cleanNumber(occ.occupiedUnits) : 0,
      occ ? cleanNumber(occ.availableUnits) : 0,
      occ ? cleanRatio(occ.occupancyRate) : '',
    ];
    lines.push(values.map(escapeCsvCell).join(','));
  }

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

// =============================================================================
// Pure-TS RFC-Compliant OOXML (.xlsx) Builder (Zero dependencies, 4 Raw Sheets)
// =============================================================================

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnLetter(colIndexZeroBased: number): string {
  let n = colIndexZeroBased + 1;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function buildWorksheetXml(sheet: SheetDefinition): string {
  const rowXmls: string[] = [];

  // Row 1: Column Headers (bold plain text, no background color, no merged cells)
  const headerCells = sheet.headers
    .map((header, colIdx) => {
      const ref = `${columnLetter(colIdx)}1`;
      return `<c r="${ref}" t="inlineStr" s="1"><is><t>${escapeXml(header)}</t></is></c>`;
    })
    .join('');
  rowXmls.push(`<row r="1">${headerCells}</row>`);

  // Data Rows starting at Row 2
  sheet.rows.forEach((row, rowIdx) => {
    const excelRow = rowIdx + 2;
    const cellsXml = row
      .map((cell, colIdx) => {
        const ref = `${columnLetter(colIdx)}${excelRow}`;
        if (cell.value === null || cell.value === undefined || cell.value === '') {
          return '';
        }
        if (cell.kind === 'number' || cell.kind === 'percent') {
          const num = Number(cell.value);
          if (!Number.isFinite(num)) return '';
          const styleId = cell.kind === 'percent' ? 3 : 2;
          return `<c r="${ref}" t="n" s="${styleId}"><v>${num}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr" s="0"><is><t>${escapeXml(String(cell.value))}</t></is></c>`;
      })
      .filter(Boolean)
      .join('');
    rowXmls.push(`<row r="${excelRow}">${cellsXml}</row>`);
  });

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rowXmls.join('')}</sheetData>` +
    '</worksheet>'
  );
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZipArchive(entries: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = encoder.encode(entry.content);
    const checksum = crc32(dataBytes);

    // Local File Header (30 bytes + filename + data)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // method 0 = STORE
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, checksum, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, checksum, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;
  for (const part of [...localParts, ...centralParts, eocd]) {
    output.set(part, cursor);
    cursor += part.length;
  }
  return output;
}

/**
 * Generates a valid multi-sheet .xlsx (Office Open XML) workbook following strict Enterprise Data Hygiene:
 * - Sheet 1: Tong_Quan (Key metrics)
 * - Sheet 2: Chi_Tiet_Doanh_Thu (Raw numeric revenue per facility)
 * - Sheet 3: Hieu_Suat_Co_So (Raw integer unit counts & decimal occupancy ratios)
 * - Sheet 4: No_Qua_Han (Overdue contracts with ISO dates & raw amounts)
 */
export function buildMultiSheetXlsx(input: MultiSheetExportInput): Uint8Array {
  const { revenue, occupancy, overdue, from, to, scopeName } = input;
  const facilities = revenue?.byFacility ?? [];
  const occRows = occupancy?.data ?? [];
  const overdueRows = overdue?.content ?? [];
  const totalAccruedFee =
    overdue?.totalAccruedFee ??
    overdueRows.reduce((sum, item) => sum + cleanNumber(item.accruedOverdueFee), 0);

  const sheets: SheetDefinition[] = [
    {
      name: 'Tong_Quan',
      headers: ['Chỉ số', 'Giá trị'],
      rows: [
        [{ value: 'Từ ngày', kind: 'text' }, { value: from.slice(0, 10), kind: 'text' }],
        [{ value: 'Đến ngày', kind: 'text' }, { value: to.slice(0, 10), kind: 'text' }],
        [{ value: 'Phạm vi báo cáo', kind: 'text' }, { value: scopeName, kind: 'text' }],
        [{ value: 'Tổng doanh thu thực thu (VND)', kind: 'text' }, { value: cleanNumber(revenue?.totalRevenue), kind: 'number' }],
        [{ value: 'Tiền thuê kho (VND)', kind: 'text' }, { value: cleanNumber(revenue?.rentalRevenue), kind: 'number' }],
        [{ value: 'Phụ phí dịch vụ (VND)', kind: 'text' }, { value: cleanNumber(revenue?.surchargeRevenue), kind: 'number' }],
        [{ value: 'Phí gia hạn (VND)', kind: 'text' }, { value: cleanNumber(revenue?.renewalRevenue), kind: 'number' }],
        [{ value: 'Phạt quá hạn (VND)', kind: 'text' }, { value: cleanNumber(revenue?.overdueFeeRevenue), kind: 'number' }],
        [{ value: 'Doanh thu định kỳ MRR (VND)', kind: 'text' }, { value: cleanNumber(revenue?.mrr), kind: 'number' }],
        [{ value: 'Số hợp đồng đang hoạt động', kind: 'text' }, { value: cleanNumber(revenue?.activeContractCount), kind: 'number' }],
        [{ value: 'Tiền cọc đang giữ (VND)', kind: 'text' }, { value: cleanNumber(revenue?.totalDepositLiability ?? revenue?.depositBalance), kind: 'number' }],
        [{ value: 'Tiền đã hoàn trả (VND)', kind: 'text' }, { value: cleanNumber(revenue?.totalRefundAmount), kind: 'number' }],
        [{ value: 'Nợ quá hạn tích lũy (VND)', kind: 'text' }, { value: cleanNumber(totalAccruedFee), kind: 'number' }],
        [{ value: 'Tổng số ô kho hệ thống', kind: 'text' }, { value: cleanNumber(occupancy?.totalUnitsSystem), kind: 'number' }],
        [{ value: 'Số ô đang thuê', kind: 'text' }, { value: cleanNumber(occupancy?.occupiedUnitsSystem), kind: 'number' }],
        [{ value: 'Số ô còn trống', kind: 'text' }, { value: cleanNumber(occupancy?.availableUnitsSystem), kind: 'number' }],
        [{ value: 'Tỷ lệ lấp đầy toàn hệ thống', kind: 'text' }, { value: cleanRatio(occupancy?.averageOccupancyRate), kind: 'percent' }],
      ],
    },
    {
      name: 'Chi_Tiet_Doanh_Thu',
      headers: [
        'Mã cơ sở',
        'Tên cơ sở',
        'Tiền thuê (VND)',
        'Phụ phí (VND)',
        'Gia hạn (VND)',
        'Phạt quá hạn (VND)',
        'Cọc đang giữ (VND)',
        'Đã hoàn (VND)',
        'Tổng doanh thu (VND)',
      ],
      rows: facilities.map((f) => [
        { value: f.facilityId, kind: 'number' },
        { value: f.facilityName, kind: 'text' },
        { value: cleanNumber(f.rentalRevenue), kind: 'number' },
        { value: cleanNumber(f.surchargeRevenue), kind: 'number' },
        { value: cleanNumber(f.renewalRevenue), kind: 'number' },
        { value: cleanNumber(f.overdueFeeRevenue), kind: 'number' },
        { value: cleanNumber(f.depositBalance), kind: 'number' },
        { value: cleanNumber(f.refundAmount), kind: 'number' },
        { value: cleanNumber(f.totalRevenue), kind: 'number' },
      ]),
    },
    {
      name: 'Hieu_Suat_Co_So',
      headers: [
        'Mã cơ sở',
        'Tên cơ sở',
        'Tổng ô kho',
        'Đang thuê',
        'Còn trống',
        'Đặt chỗ',
        'Vệ sinh',
        'Bảo trì',
        'Ngừng khai thác',
        'HĐ quá hạn',
        'Tỷ lệ lấp đầy',
      ],
      rows: occRows.map((o) => [
        { value: o.facilityId, kind: 'number' },
        { value: o.facilityName, kind: 'text' },
        { value: cleanNumber(o.totalUnits), kind: 'number' },
        { value: cleanNumber(o.occupiedUnits), kind: 'number' },
        { value: cleanNumber(o.availableUnits), kind: 'number' },
        { value: cleanNumber(o.reservedUnits), kind: 'number' },
        { value: cleanNumber(o.cleaningUnits), kind: 'number' },
        { value: cleanNumber(o.maintenanceUnits), kind: 'number' },
        { value: cleanNumber(o.outOfServiceUnits), kind: 'number' },
        { value: cleanNumber(o.overdueContractsCount), kind: 'number' },
        { value: cleanRatio(o.occupancyRate), kind: 'percent' },
      ]),
    },
    {
      name: 'No_Qua_Han',
      headers: [
        'Mã hợp đồng',
        'Khách hàng',
        'Số điện thoại',
        'Cơ sở',
        'Ô kho',
        'Ngày hết hạn',
        'Số ngày trễ',
        'Giá thuê/tháng (VND)',
        'Phạt tích lũy (VND)',
        'Trạng thái',
      ],
      rows: overdueRows.map((c) => [
        { value: c.contractCode, kind: 'text' },
        { value: c.customerName, kind: 'text' },
        { value: c.customerPhone, kind: 'text' },
        { value: c.facilityName, kind: 'text' },
        { value: c.unitCode, kind: 'text' },
        { value: c.endDateExclusive ? c.endDateExclusive.slice(0, 10) : '', kind: 'text' },
        { value: cleanNumber(c.overdueDays), kind: 'number' },
        { value: cleanNumber(c.monthlyRentalPrice), kind: 'number' },
        { value: cleanNumber(c.accruedOverdueFee), kind: 'number' },
        { value: c.status, kind: 'text' },
      ]),
    },
  ];

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
      )
      .join('') +
    '</Types>';

  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    sheets
      .map(
        (sheet, i) =>
          `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`
      )
      .join('') +
    '</sheets>' +
    '</workbook>';

  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
      )
      .join('') +
    `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    '</Relationships>';

  // Plain monochrome styles: 0 = General, 1 = Bold Header, 2 = Integer (#,##0), 3 = Percent (0.0%)
  const stylesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="2">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs>' +
    '</styleSheet>';

  const zipEntries = [
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: stylesXml },
    ...sheets.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      content: buildWorksheetXml(sheet),
    })),
  ];

  return buildZipArchive(zipEntries);
}
