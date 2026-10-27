import React, { useState, useRef } from 'react';
import XLSX from 'xlsx-js-style';
import { Item, ParsedImportItem } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { 
  Upload, FileSpreadsheet, Download, CheckCircle2, 
  AlertTriangle, RefreshCw, XCircle, Loader2
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { 
  downloadSkuImportTemplateExcel, 
  downloadSkuImportTemplateCsv 
} from '../../utils/exportHelpers';

interface ImportSkuModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
}

export const ImportSkuModal: React.FC<ImportSkuModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const { bulkImportItems } = useInventory();
  const { currentUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedImportItem[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [parseError, setParseError] = useState<string>('');

  const resetState = () => {
    setFileName('');
    setParsedItems([]);
    setIsParsing(false);
    setIsImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isImporting) return;
    resetState();
    onClose();
  };

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_\-\.]+/g, '');

  const findValue = (row: Record<string, any>, targetKeys: string[]) => {
    const keys = Object.keys(row);
    for (const target of targetKeys) {
      const match = keys.find(k => normalizeKey(k) === target);
      if (match !== undefined && row[match] !== undefined) {
        return row[match];
      }
    }
    return undefined;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setIsParsing(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File tidak memiliki sheet data yang valid.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) {
        throw new Error('Sheet kosong atau tidak ada data yang bisa dibaca.');
      }

      const activeItems = items.filter(i => !i.is_archived);
      const generatedSkuSet = new Set<string>();

      const processed: ParsedImportItem[] = rawData.map((row, idx) => {
        const rowNumber = idx + 2; // Row 1 is header
        const rawSkuVal = findValue(row, ['sku', 'kodesku', 'kode', 'barcode', 'itemsku']);
        const rawSku = rawSkuVal !== undefined ? String(rawSkuVal).trim() : '';

        const nameVal = findValue(row, ['name', 'nama', 'namabarang', 'namaproduk', 'itemname', 'productname', 'deskripsi']);
        const name = nameVal !== undefined ? String(nameVal).trim() : '';

        const categoryVal = findValue(row, ['category', 'kategori', 'kategoribarang']);
        const category = categoryVal ? String(categoryVal).trim() : 'Umum';

        const unitVal = findValue(row, ['unit', 'satuan', 'satuanbarang', 'kemasan']);
        const unit = unitVal ? String(unitVal).trim().toUpperCase() : 'PCS';

        const priceVal = findValue(row, ['price', 'harga', 'hargasatuan', 'hargabeli', 'hargajual']);
        const parsedPrice = Number(String(priceVal || 0).replace(/[^0-9.-]+/g, ''));
        const price = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

        const stockVal = findValue(row, ['initialstock', 'stokawal', 'stockawal', 'stok', 'stock', 'qty', 'jumlah']);
        const parsedStock = Number(String(stockVal || 0).replace(/[^0-9.-]+/g, ''));
        const initial_stock = !isNaN(parsedStock) && parsedStock >= 0 ? Math.floor(parsedStock) : 0;

        // Validation
        if (!name) {
          return {
            rowNumber,
            rawSku,
            sku: rawSku || '-',
            name: '',
            category,
            unit,
            price,
            initial_stock,
            action: 'CREATE',
            isValid: false,
            errorMessage: 'Nama barang wajib diisi',
          };
        }

        // Check if SKU exists
        let action: 'CREATE' | 'UPDATE' = 'CREATE';
        let existingItemId: number | undefined = undefined;
        let finalSku = rawSku.toUpperCase();

        if (finalSku) {
          const matchExisting = activeItems.find(
            i => (i.sku || '').trim().toUpperCase() === finalSku
          );
          if (matchExisting) {
            action = 'UPDATE';
            existingItemId = matchExisting.id;
          }
        } else {
          // Auto generate unique SKU
          const randomPart = Math.floor(100 + Math.random() * 900);
          finalSku = `BRG-IMP-${Date.now().toString(36).toUpperCase()}-${idx + 1}-${randomPart}`;
        }

        generatedSkuSet.add(finalSku);

        return {
          rowNumber,
          rawSku,
          sku: finalSku,
          name,
          category,
          unit,
          price,
          initial_stock,
          action,
          existingItemId,
          isValid: true,
        };
      });

      setParsedItems(processed);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca file Excel/CSV.');
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const validItems = parsedItems.filter(i => i.isValid);
  const invalidItems = parsedItems.filter(i => !i.isValid);
  const newItemsCount = validItems.filter(i => i.action === 'CREATE').length;
  const updateItemsCount = validItems.filter(i => i.action === 'UPDATE').length;

  const handleExecuteImport = async () => {
    if (!currentUser || validItems.length === 0 || isImporting) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: validItems.length });

    try {
      await bulkImportItems(validItems, currentUser.id, (current, total) => {
        setImportProgress({ current, total });
      });
      handleClose();
    } catch {
      // Handled in context toast
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Master SKU Massal"
      subtitle="Upload file Excel (.xlsx) atau CSV untuk input banyak SKU sekaligus"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Step 1: Upload & Download Template Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-muted/50 rounded-2xl border border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-brand-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Gunakan Template Standar</p>
              <p className="text-[11px] text-muted-foreground">
                Kolom: <span className="font-mono text-brand-700 dark:text-brand-300">sku, name, category, unit, price, initial_stock</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={downloadSkuImportTemplateExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors"
              title="Unduh Template Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template Excel</span>
            </button>
            <button
              type="button"
              onClick={downloadSkuImportTemplateCsv}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors"
              title="Unduh Template CSV (.csv)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Step 2: Drop Zone / File Picker */}
        {parsedItems.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-brand-500 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-card hover:bg-muted/30 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-foreground">
              Pilih file Excel atau CSV dari komputer
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Mendukung format .xlsx, .xls, dan .csv. Kolom SKU boleh kosong jika ingin kode otomatis dibuatkan sistem.
            </p>
            {isParsing && (
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-brand-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Membaca dan memvalidasi file...</span>
              </div>
            )}
          </div>
        ) : (
          /* Preview Data Table & Summary */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-foreground font-semibold">{fileName}</span>
              </span>
              <span>{validItems.length} dari {parsedItems.length} baris siap diimpor</span>
            </div>

            {/* Summary Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl border border-border bg-card">
                <span className="text-[10px] text-muted-foreground block font-medium">Total Baris</span>
                <span className="text-base font-extrabold text-foreground">{parsedItems.length}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">Barang Baru</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">+{newItemsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                <span className="text-[10px] text-blue-700 dark:text-blue-400 block font-medium">Update SKU Lama</span>
                <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">{updateItemsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 block font-medium">Baris Error</span>
                <span className="text-base font-extrabold text-rose-700 dark:text-rose-400">{invalidItems.length}</span>
              </div>
            </div>

            {/* Scrollable Table Preview */}
            <div className="border border-border rounded-xl overflow-hidden bg-card max-h-64 sm:max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted sticky top-0 z-10 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="py-2 px-2.5 text-center w-10">No</th>
                    <th className="py-2 px-2.5 w-20">Aksi</th>
                    <th className="py-2 px-2.5">SKU</th>
                    <th className="py-2 px-2.5">Nama Barang</th>
                    <th className="py-2 px-2.5">Kategori</th>
                    <th className="py-2 px-2.5 text-center">Satuan</th>
                    <th className="py-2 px-2.5 text-right">Harga</th>
                    <th className="py-2 px-2.5 text-right">Stok Awal</th>
                    <th className="py-2 px-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedItems.map((item, idx) => (
                    <tr 
                      key={idx}
                      className={!item.isValid ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-muted/40'}
                    >
                      <td className="py-2 px-2.5 text-center text-muted-foreground font-mono text-[11px]">
                        {item.rowNumber}
                      </td>
                      <td className="py-2 px-2.5">
                        {!item.isValid ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300">
                            <XCircle className="w-2.5 h-2.5" /> Gagal
                          </span>
                        ) : item.action === 'UPDATE' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            <RefreshCw className="w-2.5 h-2.5" /> Update
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Baru
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[11px] font-semibold text-foreground">
                        {item.rawSku ? (
                          item.sku
                        ) : (
                          <span className="text-brand-600 dark:text-brand-400 italic">
                            [Auto: {item.sku}]
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-medium text-foreground max-w-[160px] truncate" title={item.name}>
                        {item.name || <span className="text-rose-500 italic">Kosong</span>}
                      </td>
                      <td className="py-2 px-2.5 text-muted-foreground">{item.category}</td>
                      <td className="py-2 px-2.5 text-center font-mono text-[11px]">{item.unit}</td>
                      <td className="py-2 px-2.5 text-right font-mono">{formatRupiah(item.price)}</td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold">
                        {item.initial_stock > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{item.initial_stock}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-[11px]">
                        {!item.isValid ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            {item.errorMessage}
                          </span>
                        ) : item.action === 'UPDATE' ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            Update data & {item.initial_stock > 0 ? `+${item.initial_stock} stok` : 'stok tetap'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {item.initial_stock > 0 ? `Stok awal +${item.initial_stock}` : 'Tanpa stok awal'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress indicator during import */}
            {isImporting && (
              <div className="p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses import barang ke database...
                  </span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-brand-200 dark:bg-brand-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2 transition-all duration-200 rounded-full"
                    style={{
                      width: `${(importProgress.current / Math.max(1, importProgress.total)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {parseError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {parsedItems.length > 0 ? (
            <button
              type="button"
              disabled={isImporting}
              onClick={() => {
                setParsedItems([]);
                setFileName('');
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Ganti File
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isImporting}
              onClick={handleClose}
              className="px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            {parsedItems.length > 0 && (
              <button
                type="button"
                disabled={validItems.length === 0 || isImporting}
                onClick={handleExecuteImport}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-xs transition-all disabled:opacity-50 active:scale-95"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Import {validItems.length} Barang Valid</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
