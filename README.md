OLT Secure Exporter
OLT Secure Exporter adalah aplikasi berbasis Node.js yang dirancang khusus untuk mengolah, mengonversi, dan mengamankan data konfigurasi OLT (Optical Line Terminal). Proyek ini dikembangkan sebagai bagian dari Tugas Akhir/Skripsi sekaligus solusi digital untuk tim NOC (Network Operations Center) PT. Sarana Media Cemerlang.

🚀 Status Proyek: Functional & Ready
Saat ini, fungsi inti aplikasi telah berjalan dengan baik (Core Functions are Operational), meliputi:

Parsing Data: Ekstraksi data konfigurasi OLT secara akurat.

Security Layer: Implementasi algoritma AES-256 untuk enkripsi data.

Randomness: Penggunaan algoritma Blum Blum Shub (BBS) untuk keamanan tambahan.

PDF Processing: Integrasi QPDF untuk penanganan dokumen output.

Deployment Ready: Aplikasi siap di-hosting (bukan hanya localhost).

✨ Fitur Utama
Automated Parsing: Mengubah file konfigurasi mentah menjadi format yang mudah dibaca.

High-Level Security: Mengamankan data sensitif jaringan menggunakan standar enkripsi industri.

NOC Tools: Dirancang spesifik untuk kebutuhan efisiensi kerja tim NOC Jagonet.

Web-Based Interface: Antarmuka yang responsif dan mudah digunakan.

🛠️ Tech Stack
Backend: Node.js

Encryption: AES-256 & Blum Blum Shub (BBS)

PDF Tools: QPDF

Deployment: Support via AAPanel / Docker / VPS

💻 Cara Menjalankan (Development)
Clone repositori ini.

Install dependensi:

Bash
npm install
Konfigurasi environment variable pada file .env.

Jalankan aplikasi:

Bash
npm start
👨‍💻 Kontributor
Ardha - Developer & Student at UNIPMA

PT. Sarana Media Cemerlang - Project Context & Implementation
