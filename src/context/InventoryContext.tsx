import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Item, Inventory, TransferRequest, InventoryMutation, Notification, TransactionType, ParsedImportItem, BulkImportSummary } from '../types';
import { StorageRepository } from '../db/storageRepository';
import { SupabaseService } from '../services/supabaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface InventoryContextType {
  items: Item[];
  inventories: Inventory[];
  requests: TransferRequest[];
  mutations: InventoryMutation[];
  notifications: Notification[];
  toasts: ToastMessage[];
  isLoading: boolean;
  isOfflineMode: boolean;
  refreshData: () => Promise<void>;
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;
  
  // Actions
  addNewItem: (data: Omit<Item, 'id' | 'created_at'>) => Promise<Item>;
  updateItem: (itemId: number, data: Partial<Omit<Item, 'id' | 'created_at'>>) => Promise<Item>;
  deleteItem: (itemId: number) => Promise<void>;
  bulkImportItems: (parsedItems: ParsedImportItem[], userId: string, onProgress?: (current: number, total: number) => void) => Promise<BulkImportSummary>;
  inboundStock: (itemId: number, qty: number, notes: string, userId: string, supplierName?: string) => Promise<void>;
  outboundStock: (itemId: number, qty: number, reasonType: TransactionType, notes: string, userId: string) => Promise<void>;
  createRequest: (toLocationId: number, requestedByUserId: string, itemsData: Array<{ itemId: number; qtyRequested: number }>, notes?: string) => Promise<TransferRequest>;
  authorizeRequest: (requestId: number, adminUserId: string, decision: 'APPROVE_FULL' | 'APPROVE_PARTIAL' | 'REJECT', options?: { approvedItems?: Array<{ itemId: number; qtyApproved: number }>; rejectionNotes?: string }) => Promise<void>;
  dispatchRequest: (requestId: number, adminUserId: string, dispatchInfo?: { driverName?: string; vehiclePlate?: string }) => Promise<void>;
  receiveTransfer: (requestId: number, storeUserId: string, receivedItems: Array<{ itemId: number; qtyReceived: number; discrepancyReason?: string }>) => Promise<void>;
  deleteRequest: (requestId: number) => Promise<void>;
  markNotificationRead: (id: string) => void;
  loadSampleDataPreset: () => Promise<void>;
  resetToClean: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [mutations, setMutations] = useState<InventoryMutation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!isSupabaseConfigured);

  const refreshData = useCallback(async () => {
    try {
      const [itms, invs, reqs, muts] = await Promise.all([
        SupabaseService.getItems(),
        SupabaseService.getInventories(),
        SupabaseService.getRequests(),
        SupabaseService.getMutations(),
      ]);

      setItems(itms);
      setInventories(invs);
      setRequests(reqs);
      setMutations(muts);
      setNotifications(StorageRepository.getNotifications());
      setIsOfflineMode(!isSupabaseConfigured);
    } catch (err) {
      console.warn('Fallback to local storage data:', err);
      setIsOfflineMode(true);
      setItems(StorageRepository.getItems());
      setInventories(StorageRepository.getInventories());
      setRequests(StorageRepository.getRequests());
      setMutations(StorageRepository.getMutations());
      setNotifications(StorageRepository.getNotifications());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and Realtime Subscription
  useEffect(() => {
    refreshData();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('schema-inventory-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'items' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventories' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transfer_requests' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transfer_request_items' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inventory_mutations' },
          () => {
            refreshData();
          }
        )
        .subscribe();

      return () => {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [refreshData]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNewItem = async (data: Omit<Item, 'id' | 'created_at'>): Promise<Item> => {
    try {
      const created = await SupabaseService.createItem(data);
      await refreshData();
      showToast('success', 'Master Barang Ditambahkan', `SKU ${created.sku} (${created.name}) berhasil disimpan.`);
      return created;
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Barang', err.message);
      throw err;
    }
  };

  const updateItem = async (itemId: number, data: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<Item> => {
    try {
      const updated = await SupabaseService.updateItem(itemId, data);
      await refreshData();
      showToast('success', 'Data Barang Diperbarui', `[${updated.sku}] ${updated.name} berhasil disimpan.`);
      return updated;
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Barang', err.message);
      throw err;
    }
  };

  const deleteItem = async (itemId: number): Promise<void> => {
    try {
      await SupabaseService.deleteItem(itemId);
      await refreshData();
      showToast('success', 'Barang Dihapus', 'Data barang dan saldo stok berhasil dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Barang', err.message);
      throw err;
    }
  };

  const bulkImportItems = async (
    parsedItems: ParsedImportItem[],
    userId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<BulkImportSummary> => {
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; name: string; error: string }> = [];
    const total = parsedItems.length;

    for (let i = 0; i < total; i++) {
      const item = parsedItems[i];
      if (onProgress) {
        onProgress(i + 1, total);
      }

      try {
        if (item.action === 'UPDATE' && item.existingItemId) {
          await SupabaseService.updateItem(item.existingItemId, {
            sku: item.sku,
            name: item.name,
            category: item.category,
            unit: item.unit,
            price: item.price,
          });

          if (item.initial_stock > 0) {
            await SupabaseService.inboundStock(
              item.existingItemId,
              item.initial_stock,
              'Saldo stok awal via import Excel/CSV',
              userId,
              'Import Excel/CSV'
            );
          }
          updatedCount++;
        } else {
          const created = await SupabaseService.createItem({
            sku: item.sku,
            name: item.name,
            category: item.category,
            unit: item.unit,
            price: item.price,
            safety_stock: 10,
          });

          if (item.initial_stock > 0) {
            await SupabaseService.inboundStock(
              created.id,
              item.initial_stock,
              'Saldo stok awal via import Excel/CSV',
              userId,
              'Import Excel/CSV'
            );
          }
          createdCount++;
        }
      } catch (err: any) {
        failedCount++;
        errors.push({
          row: item.rowNumber,
          name: item.name,
          error: err?.message || 'Gagal memproses baris',
        });
      }
    }

    await refreshData();

    if (failedCount === 0) {
      showToast(
        'success',
        'Import Selesai',
        `Berhasil import ${createdCount} barang baru dan update ${updatedCount} barang.`
      );
    } else {
      showToast(
        'warning',
        'Import Selesai Sebagian',
        `${createdCount} barang baru, ${updatedCount} di-update, ${failedCount} gagal.`
      );
    }

    return {
      total,
      createdCount,
      updatedCount,
      failedCount,
      errors,
    };
  };

  const inboundStock = async (itemId: number, qty: number, notes: string, userId: string, supplierName?: string): Promise<void> => {
    try {
      await SupabaseService.inboundStock(itemId, qty, notes, userId, supplierName);
      const targetItem = items.find(i => i.id === itemId);
      StorageRepository.addNotification({
        title: 'Inbound Stok Berhasil',
        message: `Stok masuk sebanyak ${qty} ${targetItem?.unit || 'unit'} untuk SKU ${targetItem?.sku || itemId}.`,
        type: 'info',
        targetRole: 'ADMIN_GUDANG',
      });
      await refreshData();
      showToast('success', 'Stock Inbound Berhasil', `Berhasil menambah ${qty} unit ke Gudang Pusat.`);
    } catch (err: any) {
      showToast('error', 'Gagal Inbound Stok', err.message);
      throw err;
    }
  };

  const outboundStock = async (itemId: number, qty: number, reasonType: TransactionType, notes: string, userId: string): Promise<void> => {
    try {
      await SupabaseService.outboundStock(itemId, qty, reasonType, notes, userId);
      const targetItem = items.find(i => i.id === itemId);
      StorageRepository.addNotification({
        title: 'Pengeluaran Stok Berhasil',
        message: `Stok keluar sebanyak ${qty} ${targetItem?.unit || 'unit'} untuk SKU ${targetItem?.sku || itemId} (${reasonType}).`,
        type: 'warning',
        targetRole: 'ADMIN_GUDANG',
      });
      await refreshData();
      showToast('success', 'Stok Berhasil Dikeluarkan', `Berhasil memotong ${qty} unit dari Gudang Pusat.`);
    } catch (err: any) {
      showToast('error', 'Gagal Mengeluarkan Stok', err.message);
      throw err;
    }
  };

  const createRequest = async (
    toLocationId: number,
    requestedByUserId: string,
    itemsData: Array<{ itemId: number; qtyRequested: number }>,
    notes?: string
  ): Promise<TransferRequest> => {
    try {
      const newReq = await SupabaseService.createTransferRequest(toLocationId, requestedByUserId, itemsData, notes);
      StorageRepository.addNotification({
        title: 'Permintaan Transfer Baru',
        message: `Dokumen ${newReq.request_number} dibuat (${itemsData.length} jenis barang). Menunggu persetujuan admin.`,
        type: 'info',
        targetRole: 'ADMIN_GUDANG',
      });
      await refreshData();
      showToast('success', 'Transfer Request Terkirim', `Dokumen ${newReq.request_number} berhasil diajukan.`);
      return newReq;
    } catch (err: any) {
      showToast('error', 'Gagal Membuat Request', err.message);
      throw err;
    }
  };

  const authorizeRequest = async (
    requestId: number,
    adminUserId: string,
    decision: 'APPROVE_FULL' | 'APPROVE_PARTIAL' | 'REJECT',
    options?: { approvedItems?: Array<{ itemId: number; qtyApproved: number }>; rejectionNotes?: string }
  ): Promise<void> => {
    try {
      await SupabaseService.authorizeTransferRequest(requestId, adminUserId, decision, options);
      const req = requests.find(r => r.id === requestId);
      StorageRepository.addNotification({
        title: decision === 'REJECT' ? 'Permintaan Ditolak' : 'Permintaan Disetujui',
        message: `Dokumen ${req?.request_number || '#' + requestId} telah ${decision === 'REJECT' ? 'ditolak' : 'disetujui'} oleh Admin Gudang.`,
        type: decision === 'REJECT' ? 'warning' : 'success',
        targetRole: 'ORANG_TOKO',
        targetLocationId: req?.to_location_id,
      });
      await refreshData();
      if (decision === 'REJECT') {
        showToast('warning', 'Request Ditolak', `Permintaan #${requestId} telah ditolak.`);
      } else {
        showToast('success', 'Otorisasi Berhasil', `Stok berhasil direservasi.`);
      }
    } catch (err: any) {
      showToast('error', 'Gagal Otorisasi Request', err.message);
      throw err;
    }
  };

  const dispatchRequest = async (
    requestId: number, 
    adminUserId: string,
    dispatchInfo?: { driverName?: string; vehiclePlate?: string }
  ): Promise<void> => {
    try {
      await SupabaseService.dispatchTransferRequest(requestId, adminUserId, dispatchInfo);
      const req = requests.find(r => r.id === requestId);
      StorageRepository.addNotification({
        title: 'Pesanan Telah Dikirim (Dispatch)',
        message: `Surat Jalan ${req?.request_number || '#' + requestId} dalam perjalanan menuju toko.`,
        type: 'info',
        targetRole: 'ORANG_TOKO',
        targetLocationId: req?.to_location_id,
      });
      await refreshData();
      showToast('success', 'Barang Telah Di-Dispatch', `Surat Jalan (DO) diterbitkan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Dispatch Barang', err.message);
      throw err;
    }
  };

  const receiveTransfer = async (
    requestId: number,
    storeUserId: string,
    receivedItems: Array<{ itemId: number; qtyReceived: number; discrepancyReason?: string }>
  ): Promise<void> => {
    try {
      await SupabaseService.receiveTransferRequest(requestId, storeUserId, receivedItems);
      const req = requests.find(r => r.id === requestId);
      StorageRepository.addNotification({
        title: 'Penerimaan Selesai',
        message: `Toko telah mengonfirmasi penerimaan barang untuk ${req?.request_number || '#' + requestId}.`,
        type: 'success',
        targetRole: 'ADMIN_GUDANG',
      });
      await refreshData();
      showToast('success', 'Serah Terima Selesai', `Stok toko berhasil diperbarui.`);
    } catch (err: any) {
      showToast('error', 'Gagal Mengonfirmasi Penerimaan', err.message);
      throw err;
    }
  };

  const deleteRequest = async (requestId: number): Promise<void> => {
    try {
      await SupabaseService.deleteTransferRequest(requestId);
      await refreshData();
      showToast('success', 'Riwayat Dihapus', 'Riwayat pengiriman/permintaan berhasil dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus data.');
      throw err;
    }
  };

  const markNotificationRead = (id: string) => {
    StorageRepository.markNotificationAsRead(id);
    refreshData();
  };

  const loadSampleDataPreset = async (): Promise<void> => {
    const res = await SupabaseService.seedSampleData();
    await refreshData();
    if (res.success) {
      showToast('info', 'Preset Sampel Dimuat', res.message);
    } else {
      showToast('warning', 'Info Sampel', res.message);
    }
  };

  const resetToClean = async () => {
    setIsLoading(true);
    try {
      await SupabaseService.cleanAllDataForDemo();
      await refreshData();
      showToast('info', 'Database Direset', 'Semua data barang, stok, dan transaksi telah dibersihkan untuk demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        inventories,
        requests,
        mutations,
        notifications,
        toasts,
        isLoading,
        isOfflineMode,
        refreshData,
        showToast,
        removeToast,
        addNewItem,
        updateItem,
        deleteItem,
        bulkImportItems,
        inboundStock,
        outboundStock,
        createRequest,
        authorizeRequest,
        dispatchRequest,
        receiveTransfer,
        deleteRequest,
        markNotificationRead,
        loadSampleDataPreset,
        resetToClean,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within InventoryProvider');
  return context;
};
