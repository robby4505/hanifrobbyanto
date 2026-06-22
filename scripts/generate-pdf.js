const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  console.log('🚀 Memulai proses generate PDF...');
  
  // Path ke Microsoft Edge di Windows
  const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new'
  });
  
  const page = await browser.newPage();
  
  // Resolusi layar untuk rendering (agar tampilan desktop rapi sebelum jadi PDF)
  await page.setViewport({ width: 1200, height: 800 });
  
  // URL file lokal
  const fileUrl = 'file:///D:/Personal/CV_Hanif_Robbyanto/asset/blog/Kodok/kodok.html';
  console.log('Membuka file:', fileUrl);
  
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  
  // Menambahkan sedikit CSS khusus untuk mode print
  await page.addStyleTag({
    content: `
      @media print {
        body { background: white !important; }
        .navbar, .btn-back, footer { display: none !important; } /* Sembunyikan elemen navigasi */
        .article-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
        .article-image { max-height: 400px; object-fit: cover; }
      }
    `
  });

  const outputPath = path.join(__dirname, '..', 'Makalah_Sindrom_Kodok_Rebus.pdf');
  
  console.log('Menyimpan ke:', outputPath);
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });

  await browser.close();
  console.log('✅ Berhasil! PDF tersimpan di:', outputPath);
})();
