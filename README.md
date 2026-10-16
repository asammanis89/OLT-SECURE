# OLT Secure Exporter

Aplikasi web berbasis **Node.js** untuk mengolah data konfigurasi OLT (Optical Line Terminal) mentah menjadi **laporan PDF yang dikunci dengan password (enkripsi AES-256)**, sehingga data jaringan yang sensitif tidak beredar dalam bentuk teks biasa.

> 📷 Screenshot: tambahkan `docs/upload.png` (halaman unggah) dan `docs/hasil.png` (PDF terkunci) lalu tampilkan di sini.

## Masalah yang dipecahkan

Data konfigurasi/pelanggan OLT biasanya dibagikan sebagai file teks mentah, sulit dibaca dan mudah bocor. Aplikasi ini mengubahnya menjadi laporan rapi dan langsung mengamankannya.

## Fitur

- **Parsing otomatis** file teks konfigurasi OLT memakai regex menjadi data terstruktur.
- **Generasi laporan PDF** (PDFKit) dengan judul dan nama operator.
- **Enkripsi PDF AES-256** dengan password dari pengguna (memakai `qpdf`).
- **Riwayat proses**: mencatat waktu, operator, nama file, jumlah data, dan status.
- Antarmuka web sederhana, bisa dijalankan di server sendiri.

## Alur kerja

```
Unggah file .txt → Parsing regex → Susun laporan PDF → Enkripsi AES-256 (qpdf) → Unduh PDF berpassword
```

## Tech stack

Node.js · Express · PDFKit · qpdf · HTML/CSS/JavaScript

## Cara menjalankan

Prasyarat: Node.js 18+ dan [qpdf](https://github.com/qpdf/qpdf) terpasang di sistem (`sudo apt install qpdf`).

```bash
git clone https://github.com/asammanis89/OLT-SECURE.git
cd OLT-SECURE
npm install
node server.js
```

Buka `http://localhost:3000`.

## Catatan keamanan

- Gunakan password PDF yang panjang; aplikasi hanya mewajibkan minimal 3 karakter sebagai batas teknis.
- File `riwayat.json` hanya menyimpan metadata proses, tanpa isi data dan tanpa password. Jangan di-commit jika berisi nama file internal.
- Untuk produksi, jalankan di belakang HTTPS (Nginx + SSL).

## Pengembang

**Ardha Febrian Muqorrobin** – WhatsApp 081217529861 · [LinkedIn](https://www.linkedin.com/in/ardha-febrian-342317289/)
