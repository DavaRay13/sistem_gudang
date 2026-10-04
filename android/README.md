# Panduan Menjalankan Android WebView - Sistem Gudang

Aplikasi wrapper Android native untuk Sistem Gudang sudah siap di folder `android/`.

## Fitur yang Disertakan
- **WebView Modern:** JavaScript, DOM Storage (localStorage Supabase), cookies terisolasi, hardware acceleration.
- **Handling Navigasi Back:** Tombol back ponsel akan mundur di riwayat halaman web, bukan langsung menutup aplikasi.
- **Swipe-to-Refresh:** Tarik layar ke bawah untuk memuat ulang halaman.
- **File Chooser:** Mendukung dialog unggah file dari web.
- **Download Handling:** Menangani unduhan file (termasuk ekspor Excel `.xlsx` dari buku besar mutasi).
- **External URL Intent:** Link WhatsApp (`wa.me`), telpon (`tel:`), dan email (`mailto:`) otomatis dialihkan ke aplikasi native ponsel.
- **App Icon:** Menggunakan vektor ikon gudang dengan tema dark Slate/Indigo.

---

## Cara Konfigurasi URL Web

Buka file:
`android/app/build.gradle.kts`

Ubah baris ini dengan URL web aplikasi Anda yang sudah ter-deploy:
```kotlin
buildConfigField("String", "WEB_URL", "\"https://domain-anda.com\"")
```

*Catatan: Jika masih kosong / `about:blank`, aplikasi akan menampilkan halaman panduan default.*

---

## Cara Buka & Build di Android Studio

1. Buka aplikasi **Android Studio**.
2. Pilih menu **File** -> **Open...**
3. Arahkan ke folder:
   `D:\Web-Client\sistem_gudang\android`
4. Android Studio akan otomatis mengunduh Gradle wrapper dan melakukan sinkronisasi project.
5. Untuk menjalankan di HP / Emulator:
   - Hubungkan HP Android lewat kabel USB (aktifkan USB Debugging) atau jalankan Emulator.
   - Klik tombol hijau **Run ('app')** (Shift + F10).
6. Untuk menghasilkan APK:
   - Pilih menu **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - File APK akan ada di: `android/app/build/outputs/apk/debug/app-debug.apk`.
