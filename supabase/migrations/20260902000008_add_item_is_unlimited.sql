-- Tambah kolom is_unlimited pada tabel items untuk stok tanpa batas
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;
