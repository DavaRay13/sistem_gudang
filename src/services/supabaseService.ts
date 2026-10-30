import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { StorageRepository } from '../db/storageRepository';
import { User, Location, Item, Inventory, TransferRequest, InventoryMutation, TransactionType } from '../types';
import { SAMPLE_DATA_PRESET } from '../db/initialData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ADMIN_UUID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_STORE_UUID = 'a0000000-0000-0000-0000-000000000002';

function resolveUuid(userId?: string, fallback = DEFAULT_ADMIN_UUID): string {
  if (userId && UUID_REGEX.test(userId)) return userId;
  return fallback;
}

function isNetworkOrConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const name = err.name || '';
  return (
    name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('connection refused') ||
    msg.includes('timeout')
  );
}

export class SupabaseService {
  // --- AUTHENTICATION ---
  static async authenticateUser(username: string, password?: string): Promise<{ success: boolean; user?: User; location?: Location; message?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_authenticate_user', {
          p_username: username,
          p_password_hash: password || '',
        });

        if (error) throw error;
        if (!data.success) {
          return { success: false, message: data.message || 'Login gagal' };
        }

        return {
          success: true,
          user: data.user,
          location: data.location,
        };
      } catch (err: any) {
        console.warn('Supabase auth fallback to local repository:', err.message);
      }
    }

    // Local repository fallback
    const user = StorageRepository.authenticateUser(username, password);
    if (!user) {
      return { success: false, message: 'Username atau kata sandi tidak cocok.' };
    }

    const locations = StorageRepository.getLocations();
    const location = locations.find(l => l.id === user.location_id);

    return {
      success: true,
      user,
      location,
    };
  }

  // --- USER MANAGEMENT (ADMIN GUDANG) ---
  static async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const userList = data as User[];
          StorageRepository.setUsers(userList);
          return userList;
        }
      } catch (err) {
        console.warn('Supabase getUsers fallback to local:', err);
      }
    }
    return StorageRepository.getUsers();
  }

  static async createUser(
    adminId: string,
    userData: { username: string; password_hash: string; full_name: string; role: 'ADMIN_GUDANG' | 'ORANG_TOKO'; location_id: number }
  ): Promise<User> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_create_user', {
          p_admin_id: resolveUuid(adminId),
          p_username: userData.username,
          p_password_hash: userData.password_hash,
          p_full_name: userData.full_name,
          p_role: userData.role,
          p_location_id: userData.location_id,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal membuat user');
      } catch (err: any) {
        console.warn('Supabase createUser error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local user store');
          return StorageRepository.saveUser(userData);
        }
        throw err;
      }
    }

    return StorageRepository.saveUser(userData);
  }

  static async updateUser(
    adminId: string,
    targetUserId: string,
    updateData: { full_name?: string; role?: 'ADMIN_GUDANG' | 'ORANG_TOKO'; location_id?: number; is_active?: boolean; password_hash?: string }
  ): Promise<User> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('rpc_manage_user', {
          p_admin_id: resolveUuid(adminId),
          p_target_user_id: targetUserId,
          p_full_name: updateData.full_name || null,
          p_role: updateData.role || null,
          p_location_id: updateData.location_id ?? null,
          p_is_active: updateData.is_active ?? null,
          p_new_password_hash: updateData.password_hash || null,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal memperbarui user');
      } catch (err: any) {
        console.warn('Supabase manageUser error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local user store');
          return StorageRepository.updateUser(targetUserId, updateData);
        }
        throw err;
      }
    }

    return StorageRepository.updateUser(targetUserId, updateData);
  }

  // --- MASTER ITEMS & SKU ---
  static async getItems(): Promise<Item[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          const remoteItems = data as Item[];
          StorageRepository.setItems(remoteItems);
          return remoteItems;
        }
      } catch (err) {
        console.warn('Supabase getItems fallback to local:', err);
      }
    }
    return StorageRepository.getItems();
  }

  static async createItem(itemData: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    if (isSupabaseConfigured && supabase) {
      try {
        const safePrice = Number(itemData.price);
        const safeSafetyStock = Number(itemData.safety_stock);

        const { data, error } = await supabase
          .from('items')
          .insert({
            sku: (itemData.sku || '').trim().toUpperCase(),
            name: (itemData.name || '').trim(),
            category: itemData.category || 'Umum',
            unit: (itemData.unit || 'PCS').trim().toUpperCase(),
            price: Number.isFinite(safePrice) ? Math.max(0, safePrice) : 0,
            safety_stock: Number.isFinite(safeSafetyStock) ? Math.max(0, Math.floor(safeSafetyStock)) : 0,
            is_unlimited: Boolean(itemData.is_unlimited),
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error(`SKU "${itemData.sku}" sudah terdaftar di database! Gunakan SKU yang berbeda.`);
          }
          throw error;
        }

        // Inisialisasi saldo inventori 0 untuk semua lokasi (Hub & Cabang)
        if (data?.id) {
          const { data: locations } = await supabase.from('locations').select('id');
          if (locations && locations.length > 0) {
            const invRows = locations.map(loc => ({
              location_id: loc.id,
              item_id: data.id,
              stock_available: 0,
              stock_reserved: 0,
              stock_in_transit: 0,
            }));
            await supabase.from('inventories').upsert(invRows, { onConflict: 'location_id,item_id' });
          }
        }

        const createdItem = data as Item;
        try {
          // Keep local storage synchronized with real Supabase id
          StorageRepository.upsertItem(createdItem);
        } catch {
          // safe to ignore
        }
        return createdItem;
      } catch (err: any) {
        console.warn('Supabase createItem error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Supabase network unreachable, falling back to Local Storage');
          return StorageRepository.saveItem(itemData);
        }
        throw err;
      }
    }
    return StorageRepository.saveItem(itemData);
  }

  static async updateItem(itemId: number, itemData: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<Item> {
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {};
        if (itemData.sku !== undefined) updatePayload.sku = itemData.sku.trim().toUpperCase();
        if (itemData.name !== undefined) updatePayload.name = itemData.name.trim();
        if (itemData.category !== undefined) updatePayload.category = itemData.category.trim();
        if (itemData.unit !== undefined) updatePayload.unit = itemData.unit.trim().toUpperCase();
        if (itemData.price !== undefined) {
          const p = Number(itemData.price);
          updatePayload.price = Number.isFinite(p) ? Math.max(0, p) : 0;
        }
        if (itemData.safety_stock !== undefined) {
          const s = Number(itemData.safety_stock);
          updatePayload.safety_stock = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0;
        }
        if (itemData.is_unlimited !== undefined) {
          updatePayload.is_unlimited = Boolean(itemData.is_unlimited);
        }

        const { data, error } = await supabase
          .from('items')
          .update(updatePayload)
          .eq('id', itemId)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error(`SKU "${itemData.sku}" sudah terdaftar untuk barang lain! Gunakan SKU yang berbeda.`);
          }
          throw error;
        }

        const updatedItem = data as Item;
        try {
          StorageRepository.upsertItem(updatedItem);
        } catch {
          // ignore
        }
        return updatedItem;
      } catch (err: any) {
        console.warn('Supabase updateItem error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Supabase network unreachable, falling back to Local Storage');
          return StorageRepository.updateItem(itemId, itemData);
        }
        throw err;
      }
    }
    return StorageRepository.updateItem(itemId, itemData);
  }

  static async deleteItem(itemId: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Hapus saldo inventori terkait di seluruh lokasi
        await supabase.from('inventories').delete().eq('item_id', itemId);

        // Soft delete master item agar riwayat mutasi & dokumen masa lalu tetap utuh
        const { error } = await supabase
          .from('items')
          .update({ is_archived: true })
          .eq('id', itemId);

        if (error) {
          throw error;
        }

        // Sinkronisasi local storage
        try {
          StorageRepository.deleteItem(itemId);
        } catch {
          // ignore
        }
        return;
      } catch (err: any) {
        console.warn('Supabase deleteItem error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Supabase network unreachable, falling back to Local Storage');
          StorageRepository.deleteItem(itemId);
          return;
        }
        throw err;
      }
    }
    StorageRepository.deleteItem(itemId);
  }

  // --- INVENTORIES (SALDO STOK PER LOKASI) ---
  static async getInventories(): Promise<Inventory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inventories')
          .select('*');

        if (!error && data) {
          const invList = data as Inventory[];
          StorageRepository.setInventories(invList);
          return invList;
        }
      } catch (err) {
        console.warn('Supabase getInventories fallback to local:', err);
      }
    }
    return StorageRepository.getInventories();
  }

  // --- INBOUND STOCK (BARANG MASUK KE GUDANG PUSAT) ---
  static async inboundStock(itemId: number, qty: number, notes: string, userId: string, supplierName?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(userId, DEFAULT_ADMIN_UUID);
        const { data, error } = await supabase.rpc('rpc_add_stock_inbound', {
          p_item_id: itemId,
          p_qty: qty,
          p_notes: notes,
          p_user_id: validUserId,
          p_supplier_name: supplierName || null,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal inbound stok');
        
        // Sync local storage if present
        try {
          StorageRepository.addStockInbound(itemId, qty, notes, userId, supplierName);
        } catch {
          // safe to ignore
        }
        return;
      } catch (err: any) {
        console.warn('Supabase inboundStock error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Supabase network unreachable, falling back to Local Storage');
          StorageRepository.addStockInbound(itemId, qty, notes, userId, supplierName);
          return;
        }
        throw err;
      }
    }
    StorageRepository.addStockInbound(itemId, qty, notes, userId, supplierName);
  }

  // --- OUTBOUND STOCK (PENGELUARAN STOK LANGSUNG DARI GUDANG PUSAT) ---
  static async outboundStock(
    itemId: number,
    qty: number,
    reasonType: TransactionType,
    notes: string,
    userId: string
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(userId, DEFAULT_ADMIN_UUID);

        // Periksa saldo stok saat ini di Gudang Pusat (Location 0)
        const { data: inv, error: invError } = await supabase
          .from('inventories')
          .select('*')
          .eq('location_id', 0)
          .eq('item_id', itemId)
          .single();

        if (invError) throw invError;
        if (!inv || inv.stock_available < qty) {
          throw new Error(`Stok di Gudang Pusat tidak mencukupi (Tersedia: ${inv?.stock_available || 0}, Diminta keluar: ${qty})`);
        }

        // Potong stok gudang
        const { error: updateError } = await supabase
          .from('inventories')
          .update({
            stock_available: inv.stock_available - qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', inv.id);

        if (updateError) throw updateError;

        // Catat ke Buku Besar Mutasi
        const { error: mutError } = await supabase
          .from('inventory_mutations')
          .insert({
            item_id: itemId,
            from_location_id: 0,
            to_location_id: null,
            qty: qty,
            transaction_type: reasonType,
            notes: notes || `Pengeluaran stok (${reasonType})`,
            created_by: validUserId,
          });

        if (mutError) throw mutError;

        try {
          StorageRepository.addStockOutbound(itemId, qty, reasonType, notes, userId);
        } catch {
          // ignore
        }
        return;
      } catch (err: any) {
        console.warn('Supabase outboundStock error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, fallback to local storage');
          StorageRepository.addStockOutbound(itemId, qty, reasonType, notes, userId);
          return;
        }
        throw err;
      }
    }
    StorageRepository.addStockOutbound(itemId, qty, reasonType, notes, userId);
  }

  // --- TRANSFER REQUESTS (PERMINTAAN TRANSFER TOKO) ---
  static async getRequests(): Promise<TransferRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('transfer_requests')
          .select('*, items:transfer_request_items(*, item:items(*))')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const reqList = data.map((r: any) => ({
            ...r,
            items: r.items || [],
          })) as TransferRequest[];
          StorageRepository.setRequests(reqList);
          return reqList;
        }
      } catch (err) {
        console.warn('Supabase getRequests fallback to local:', err);
      }
    }
    return StorageRepository.getRequests();
  }

  static async createTransferRequest(
    toLocationId: number,
    requestedByUserId: string,
    itemsData: Array<{ itemId: number; qtyRequested: number }>,
    notes?: string
  ): Promise<TransferRequest> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(requestedByUserId, DEFAULT_STORE_UUID);
        const payloadItems = itemsData.map(i => ({
          item_id: i.itemId,
          qty_requested: i.qtyRequested,
        }));

        const { data, error } = await supabase.rpc('rpc_create_transfer_request', {
          p_to_location_id: toLocationId,
          p_requested_by: validUserId,
          p_items: payloadItems,
          p_request_notes: notes || null,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal membuat permintaan');

        // Ambil data transfer request yang baru dibuat
        const reqList = await this.getRequests();
        const created = reqList.find(r => r.id === data.request_id);
        if (created) return created;
      } catch (err: any) {
        console.warn('Supabase createTransferRequest error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local transfer request store');
          return StorageRepository.createTransferRequest(toLocationId, requestedByUserId, itemsData, notes);
        }
        throw err;
      }
    }
    return StorageRepository.createTransferRequest(toLocationId, requestedByUserId, itemsData, notes);
  }

  static async authorizeTransferRequest(
    requestId: number,
    adminUserId: string,
    decision: 'APPROVE_FULL' | 'APPROVE_PARTIAL' | 'REJECT',
    options?: { approvedItems?: Array<{ itemId: number; qtyApproved: number }>; rejectionNotes?: string }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(adminUserId, DEFAULT_ADMIN_UUID);
        const approvedPayload = options?.approvedItems?.map(i => ({
          item_id: i.itemId,
          qty_approved: i.qtyApproved,
        })) || [];

        const { data, error } = await supabase.rpc('rpc_authorize_transfer_request', {
          p_request_id: requestId,
          p_admin_id: validUserId,
          p_decision: decision,
          p_approved_items: approvedPayload,
          p_notes: options?.rejectionNotes || null,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal otorisasi transfer');
        return;
      } catch (err: any) {
        console.warn('Supabase authorizeTransferRequest error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local authorization');
          StorageRepository.authorizeRequest(requestId, adminUserId, decision, options);
          return;
        }
        throw err;
      }
    }
    StorageRepository.authorizeRequest(requestId, adminUserId, decision, options);
  }

  static async dispatchTransferRequest(
    requestId: number, 
    adminUserId: string,
    dispatchInfo?: { driverName?: string; vehiclePlate?: string }
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(adminUserId, DEFAULT_ADMIN_UUID);
        const { data, error } = await supabase.rpc('rpc_dispatch_transfer_request', {
          p_request_id: requestId,
          p_admin_id: validUserId,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal dispatch pengiriman');

        // Update courier info in request_notes if provided
        if (dispatchInfo?.driverName || dispatchInfo?.vehiclePlate) {
          const courierTag = `[Kurir: ${dispatchInfo.driverName || '-'} | Plat: ${dispatchInfo.vehiclePlate || '-'}]`;
          const { data: reqData } = await supabase.from('transfer_requests').select('request_notes').eq('id', requestId).single();
          const updatedNotes = (reqData?.request_notes ? reqData.request_notes + ' • ' : '') + courierTag;
          await supabase.from('transfer_requests').update({ request_notes: updatedNotes }).eq('id', requestId);
        }

        try {
          StorageRepository.dispatchRequest(requestId, adminUserId, dispatchInfo);
        } catch {
          // ignore
        }
        return;
      } catch (err: any) {
        console.warn('Supabase dispatchTransferRequest error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local dispatch');
          StorageRepository.dispatchRequest(requestId, adminUserId, dispatchInfo);
          return;
        }
        throw err;
      }
    }
    StorageRepository.dispatchRequest(requestId, adminUserId, dispatchInfo);
  }

  static async receiveTransferRequest(
    requestId: number,
    storeUserId: string,
    receivedItems: Array<{ itemId: number; qtyReceived: number; discrepancyReason?: string }>
  ): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const validUserId = resolveUuid(storeUserId, DEFAULT_STORE_UUID);
        const receivedPayload = receivedItems.map(i => ({
          item_id: i.itemId,
          qty_received: i.qtyReceived,
          discrepancy_reason: i.discrepancyReason || null,
        }));

        const { data, error } = await supabase.rpc('rpc_receive_transfer_request', {
          p_request_id: requestId,
          p_store_user_id: validUserId,
          p_received_items: receivedPayload,
        });

        if (error) throw error;
        if (data && !data.success) throw new Error(data.message || 'Gagal konfirmasi serah terima');
        return;
      } catch (err: any) {
        console.warn('Supabase receiveTransferRequest error:', err.message);
        if (isNetworkOrConnectionError(err)) {
          console.warn('Network unreachable, falling back to local receiving confirmation');
          StorageRepository.receiveTransfer(requestId, storeUserId, receivedItems);
          return;
        }
        throw err;
      }
    }
    StorageRepository.receiveTransfer(requestId, storeUserId, receivedItems);
  }

  // --- INVENTORY MUTATIONS (BUKU BESAR MUTASI) ---
  static async getMutations(): Promise<InventoryMutation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inventory_mutations')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mutList = data as InventoryMutation[];
          StorageRepository.setMutations(mutList);
          return mutList;
        }
      } catch (err) {
        console.warn('Supabase getMutations fallback to local:', err);
      }
    }
    return StorageRepository.getMutations();
  }

  // --- SEED SAMPLE DATA KE SUPABASE ---
  static async seedSampleData(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      StorageRepository.loadSampleData();
      return { success: true, message: 'Sample data dimuat ke local storage' };
    }

    try {
      // 1. Ambil data items yang sudah ada
      const { data: existingItems } = await supabase.from('items').select('id, sku');
      const existingSkus = new Set((existingItems || []).map((i: any) => (i.sku || '').toUpperCase()));

      const itemsToInsert = SAMPLE_DATA_PRESET.items.filter(i => !existingSkus.has(i.sku.toUpperCase()));

      let allItems = existingItems || [];

      // 2. Insert items yang belum ada
      if (itemsToInsert.length > 0) {
        const { data: newlyCreated, error: itmErr } = await supabase
          .from('items')
          .insert(
            itemsToInsert.map(i => ({
              sku: i.sku.toUpperCase(),
              name: i.name,
              category: i.category,
              unit: i.unit,
              price: i.price,
              safety_stock: i.safety_stock,
            }))
          )
          .select();

        if (itmErr) throw itmErr;
        allItems = [...allItems, ...(newlyCreated || [])];
      }

      // Map SKU ke item_id baru
      const skuToIdMap = new Map(allItems.map((ci: any) => [ci.sku.toUpperCase(), ci.id]));

      // 3. Insert saldo inventori
      const invPayload = SAMPLE_DATA_PRESET.inventories.map(inv => {
        const sampleItem = SAMPLE_DATA_PRESET.items.find(si => si.id === inv.item_id);
        const actualItemId = sampleItem ? (skuToIdMap.get(sampleItem.sku) || inv.item_id) : inv.item_id;
        return {
          location_id: inv.location_id,
          item_id: actualItemId,
          stock_available: inv.stock_available,
          stock_reserved: inv.stock_reserved,
          stock_in_transit: inv.stock_in_transit,
        };
      });

      const { error: invErr } = await supabase
        .from('inventories')
        .upsert(invPayload, { onConflict: 'location_id,item_id' });

      if (invErr) throw invErr;

      return { success: true, message: `Berhasil memuat ${allItems?.length || 0} SKU sampel ke Supabase.` };
    } catch (err: any) {
      console.error('Error seeding sample data to Supabase:', err);
      StorageRepository.loadSampleData();
      return { success: false, message: 'Gagal seed ke Supabase: ' + err.message };
    }
  }

  // --- BERSIHKAN SEMUA DATA UNTUK DEMO ---
  static async cleanAllDataForDemo(): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('inventory_mutations').delete().neq('id', 0);
        await supabase.from('transfer_request_items').delete().neq('id', 0);
        await supabase.from('transfer_requests').delete().neq('id', 0);
        await supabase.from('inventories').delete().neq('id', 0);
        await supabase.from('items').delete().neq('id', 0);
      } catch (err: any) {
        console.warn('Error cleaning Supabase data:', err.message);
      }
    }
    StorageRepository.resetToInitial();
    return { success: true, message: 'Seluruh data transaksi dan stok berhasil dibersihkan.' };
  }
}
