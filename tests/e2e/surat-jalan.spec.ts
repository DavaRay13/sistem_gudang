import { test, expect } from '@playwright/test';

test.describe('Surat Jalan & Dispatch Feature', () => {
  test('should dispatch and generate Surat Jalan PDF without oklch color error', async ({ page }) => {
    let dialogError = '';
    page.on('dialog', async dialog => {
      const msg = dialog.message();
      // If it's the confirm dialog for dispatch, accept it
      if (msg.includes('Kirim barang dan terbitkan Surat Jalan') || msg.includes('Setujui')) {
        await dialog.accept();
        return;
      }
      // If it's an alert dialog, record any error message
      if (msg.includes('oklch') || msg.includes('Gagal')) {
        dialogError = msg;
      }
      await dialog.dismiss();
    });

    // 1. Buka aplikasi
    await page.goto('/');

    // 2. Login sebagai Admin Gudang (jika di halaman login)
    const loginButton = page.locator('button:has-text("Admin Pusat")');
    if (await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginButton.click();
    }

    // 3. Pastikan sudah masuk ke dashboard
    await expect(page.locator('text=Distribusi Stok & Logistik')).toBeVisible({ timeout: 15000 });

    // 4. Buka menu Pengiriman / Pipeline
    const pipelineLink = page.locator('button:has-text("Proses Permintaan"), a:has-text("Proses Permintaan")').first();
    await pipelineLink.click();
    await page.waitForTimeout(1000);

    // 5. Cari tombol untuk membuka Surat Jalan
    // Bisa dari tombol "Lihat / Cetak Surat Jalan" (jika sudah ada in-transit) atau klik "Kirim Truk"
    const cetakSuratJalanBtn = page.locator('button:has-text("Lihat / Cetak Surat Jalan"), button:has-text("Cetak Surat Jalan")').first();
    const kirimTrukBtn = page.locator('button:has-text("Kirim Truk"), button:has-text("Kirim Barang & Terbitkan DO")').first();

    if (await cetakSuratJalanBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cetakSuratJalanBtn.click();
    } else if (await kirimTrukBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await kirimTrukBtn.click();
    } else {
      // Fallback: ke tab Pengiriman (DO)
      const dispatchTab = page.locator('button:has-text("Pengiriman (DO)"), a:has-text("Pengiriman (DO)")').first();
      if (await dispatchTab.isVisible()) {
        await dispatchTab.click();
        await page.waitForTimeout(1000);
        const btn = page.locator('button:has-text("Lihat / Cetak Surat Jalan"), button:has-text("Kirim Barang & Terbitkan DO")').first();
        await btn.click();
      }
    }

    // 6. Pastikan Modal Surat Jalan terbuka
    const modalTitle = page.locator('text=/Surat Jalan \\/ Delivery Order/i').first();
    await expect(modalTitle).toBeVisible({ timeout: 8000 });

    // 7. Klik tombol "Unduh PDF"
    const unduhPdfBtn = page.locator('button:has-text("Unduh PDF")');
    await expect(unduhPdfBtn).toBeVisible();
    await unduhPdfBtn.click();

    // Tunggu proses rendering canvas dan generate PDF selesai
    await page.waitForTimeout(4000);

    // 8. Pastikan tidak ada alert dialog error oklch
    expect(dialogError).toBe('');

    // 9. Klik tombol "Kirim ke WhatsApp"
    const shareWaBtn = page.locator('button:has-text("Kirim ke WhatsApp")');
    await expect(shareWaBtn).toBeVisible();
    await shareWaBtn.click();

    await page.waitForTimeout(2000);

    // Pastikan tetap tidak ada dialog error oklch
    expect(dialogError).toBe('');
  });
});
