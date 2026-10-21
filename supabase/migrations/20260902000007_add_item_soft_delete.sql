-- ==============================================================================
-- Migration 07: Add Soft Delete / Archive Flag to Items
-- Memungkinkan penghapusan barang dari katalog aktif tanpa merusak integritas riwayat
-- ==============================================================================

ALTER TABLE items ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Ganti unique constraint sku global dengan partial unique index hanya untuk barang aktif
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_sku_key;
CREATE UNIQUE INDEX IF NOT EXISTS items_sku_active_idx ON items(sku) WHERE is_archived = FALSE;
