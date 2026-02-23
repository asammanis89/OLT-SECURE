const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const PDFDocument = require('pdfkit');
const os = require('os');
const { promisify } = require('util');
const crypto = require('crypto');

const execPromise = promisify(exec);
const app = express();
const PORT = 3000;

// Database Riwayat (File JSON)
const HISTORY_FILE = path.join(__dirname, 'riwayat.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));

// --- FUNGSI BANTUAN ---

const generateBBSKey = (length, seedInput) => {
    const p = 30000000091n;
    const q = 40000000003n;
    const M = p * q; 
    const hash = crypto.createHash('sha256').update(seedInput).digest('hex');
    let s = BigInt('0x' + hash.substring(0, 16)); 
    let x = (s * s) % M;
    let resultKey = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    for (let i = 0; i < length; i++) {
        x = (x * x) % M;
        const index = Number(x % BigInt(chars.length));
        resultKey += chars[index];
    }
    return resultKey;
};

const simpanRiwayat = (logData) => {
    let riwayat = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            const fileContent = fs.readFileSync(HISTORY_FILE, 'utf-8');
            riwayat = JSON.parse(fileContent);
        } catch (e) { riwayat = []; }
    }
    riwayat.push(logData);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(riwayat, null, 2));
};

// --- PDF HELPER ---
function generateHeader(doc, judul, operator) {
  // Garis Kop Hijau
  doc.strokeColor("#059669").lineWidth(3).moveTo(50, 40).lineTo(545, 40).stroke();
  
  // Judul Laporan
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14)
     .text(judul.toUpperCase(), 50, 55, { align: 'center', width: 495 });
  
  // Info Operator & Waktu
  doc.font('Helvetica').fontSize(9).fillColor('#64748b')
     .text(`Operator: ${operator} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 50, doc.y + 5, { align: 'center' });
  doc.moveDown(2);
}

function drawTableHeader(doc, y) {
  // Header Tabel (Hijau Tua Formal)
  doc.rect(50, y, 495, 20).fill('#064e3b'); 
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
  doc.text('ID ONU', 55, y + 6, { width: 80 });
  doc.text('NAMA PERANGKAT', 140, y + 6, { width: 160 });
  doc.text('USER PPPOE', 310, y + 6, { width: 140 });
  doc.text('STATUS', 460, y + 6, { width: 80 });
}

// --- API ROUTES ---

app.post('/api/generate-pdf', async (req, res) => {
  const { dataSet, password, judul, operator, filename } = req.body;

  if (!Array.isArray(dataSet) || !password || password.length < 3 || !operator) {
    return res.status(400).json({ error: "Data invalid atau Password kurang dari 3 karakter." });
  }

  const bbsSignature = generateBBSKey(24, password);
  
  // Sanitasi Data
  const data = dataSet.filter(item => item.id).map(item => ({
    id: String(item.id || '-'),
    name: String(item.name || '-'),
    username: String(item.username || '-'),
    status: String(item.status || 'UNKNOWN')
  }));

  const tempDir = os.tmpdir();
  const tempPdf = path.join(tempDir, `raw_${Date.now()}.pdf`);
  const securePdf = path.join(tempDir, `secure_${Date.now()}.pdf`);

  try {
    const stream = fs.createWriteStream(tempPdf);
    
    // FIX BUG HALAMAN KOSONG: Matikan autoFirstPage
    const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4', 
        bufferPages: true,
        autoFirstPage: false 
    });
    
    doc.pipe(stream);

    // Tambah halaman pertama manual
    doc.addPage();
    generateHeader(doc, judul || "LAPORAN OLT", operator);
    
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b')
       .text(`Digital Signature (BBS): ${bbsSignature}`, 50, doc.y - 10, { align: 'center' });
    doc.moveDown(1);

    let y = doc.y;
    drawTableHeader(doc, y);
    y += 25;
    
    // Batas bawah aman konten
    const pageBottom = doc.page.height - 80; 

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const nameHeight = doc.heightOfString(item.name, { width: 160 });
      const rowHeight = Math.max(nameHeight, 20) + 10; 
      
      // Cek apakah perlu halaman baru
      if (y + rowHeight > pageBottom) {
        doc.addPage(); 
        y = 50;        
        drawTableHeader(doc, y);
        y += 25;
      }
      
      // Zebra Striping
      if (i % 2 === 0) doc.rect(50, y - 5, 495, rowHeight).fill('#f1f5f9'); 
      
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      doc.text(item.id, 55, y, { width: 80 });
      doc.text(item.name, 140, y, { width: 160, align: 'left' }); 
      doc.text(item.username, 310, y, { width: 140, ellipsis: true });
      
      if (item.status === 'NONAKTIF') doc.fillColor("#b91c1c").font('Helvetica-Bold');
      else if (item.status === 'AKTIF') doc.fillColor("#15803d").font('Helvetica-Bold');
      
      doc.text(item.status, 460, y, { width: 80 });
      
      // Garis baris
      doc.strokeColor("#e2e8f0").lineWidth(0.5)
         .moveTo(50, y + rowHeight - 5).lineTo(545, y + rowHeight - 5).stroke();
      
      y += rowHeight;
    }
    
    // FIX UTAMA: Penomoran Halaman tanpa memicu halaman baru
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Trik: Matikan margin bawah sementara agar footer bisa ditulis di paling bawah
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; 
      
      doc.fontSize(8).fillColor('#94a3b8')
         .text(`Halaman ${i + 1} dari ${range.count} | Encrypted with AES-256`, 
         50, 
         doc.page.height - 40, // Posisi Footer
         { align: 'center', width: 495 } 
         );
         
      // Kembalikan margin (Best practice)
      doc.page.margins.bottom = oldBottomMargin;
    }
    
    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    // Enkripsi QPDF
    const qpdfPath = "qpdf"; 
    const cmd = `${qpdfPath} --encrypt "${password}" "${password}" 256 -- "${tempPdf}" "${securePdf}"`;
    await execPromise(cmd);

    // Simpan Log
    simpanRiwayat({
        tanggal: new Date().toLocaleString('id-ID'),
        operator: operator,
        namaFileAsli: filename || "Manual Input",
        jumlahData: data.length,
        status: "Sukses (AES-256)"
    });

    await new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(securePdf);
      res.setHeader('Content-Type', 'application/pdf');
      const safeFilename = judul.replace(/[^a-zA-Z0-9]/g, '_');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
      fileStream.pipe(res);
      fileStream.on('end', resolve);
      fileStream.on('error', reject);
    });

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  } finally {
    try {
        if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf);
        if (fs.existsSync(securePdf)) fs.unlinkSync(securePdf);
    } catch (e) {}
  }
});

app.get('/api/history', (req, res) => {
    if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
  console.log(`✅ Server Tools NOC siap di http://localhost:${PORT}`);
});