-- ==============================================================================
-- Migration 06: Realtime Replication
-- Menambahkan tabel ke publication supabase_realtime agar fitur realtime
-- (sinkronisasi stok antar lokasi) berfungsi.
-- Tabel yang di-subscribe aplikasi: items, inventories, transfer_requests,
-- transfer_request_items, inventory_mutations.
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfer_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfer_request_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_mutations;
