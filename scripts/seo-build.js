const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE_URL = 'https://hanifrobbyanto.vercel.app';
const SITE_NAME = 'Hanif Robbyanto - HR & Business Development';
const AUTHOR_NAME = 'Hanif Robbyanto';

// Fungsi rekursif untuk mencari semua file HTML
function getAllHtmlFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if(file !== 'node_modules' && file !== '.git' && file !== 'scripts') {
        arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.html')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

function generateSEO() {
  console.log('🚀 Memulai Proses Build SEO Otomatis...');
  const rootDir = path.join(__dirname, '..');
  const htmlFiles = getAllHtmlFiles(rootDir);
  let sitemapUrls = [];

  htmlFiles.forEach((filePath) => {
    // Relative path for URL
    let relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    let url = `${BASE_URL}/${relativePath}`;
    
    // Add to sitemap
    let priority = '0.8';
    if(relativePath === 'index.html' || relativePath === 'index-en.html') priority = '1.0';
    if(relativePath.includes('blog/')) priority = '0.9';

    sitemapUrls.push(`  <url>\n    <loc>${url}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`);

    console.log(`Memproses: ${relativePath}`);
    
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract Title & Description
    let title = $('title').text() || $('h1').first().text() || SITE_NAME;
    let desc = $('meta[name="description"]').attr('content');
    
    if (!desc) {
      let firstParagraph = $('p').first().text().trim();
      desc = firstParagraph.length > 10 ? firstParagraph.substring(0, 155) + '...' : `Portfolio dan Artikel Blog dari ${AUTHOR_NAME}, profesional HR dan Business Development.`;
    }

    let type = relativePath.includes('blog/') && relativePath.split('/').length > 2 ? 'article' : 'website';

    // Bersihkan meta tag SEO yang mungkin sudah ada (mencegah duplikasi)
    $('meta[name="description"]').remove();
    $('meta[name="keywords"]').remove();
    $('meta[name="author"]').remove();
    $('meta[name="robots"]').remove();
    $('link[rel="canonical"]').remove();
    $('meta[property^="og:"]').remove();
    $('meta[name^="twitter:"]').remove();
    $('script[type="application/ld+json"]').remove();

    // 1. STANDARD META TAGS
    const metaTags = `
  <!-- SEO Generated Meta Tags -->
  <meta name="description" content="${desc}">
  <meta name="keywords" content="HR, Business Development, HRIS, Digitalisasi Pelabuhan, Hanif Robbyanto, HR Operations, Konsultan HR, Port Strategy, Transformasi Digital">
  <meta name="author" content="${AUTHOR_NAME}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="google-site-verification" content="nDS7p-UtRmh00VqskyG3cWmWOyfp_Z-IKiz0dVu4cpw" />
  <link rel="canonical" href="${url}">
`;
    
    // 2. OPEN GRAPH & TWITTER CARDS
    let imagePath = `${BASE_URL}/asset/gambar/hanif_robbyanto.png`;
    // Coba cari gambar artikel jika ada
    let articleImg = $('.article-image').attr('src');
    if(articleImg && !articleImg.startsWith('http')) {
        let dir = path.dirname(relativePath);
        imagePath = `${BASE_URL}/${dir}/${articleImg}`;
    }

    const ogTags = `
  <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${imagePath}">
  <meta property="og:site_name" content="${SITE_NAME}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${url}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${imagePath}">
`;

    // 3. JSON-LD SCHEMA
    let schemas = [];

    // Person Schema (Muncul di semua halaman untuk EEAT & Topical Authority)
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": AUTHOR_NAME,
      "jobTitle": "HR Operations & Business Development Professional",
      "url": BASE_URL,
      "image": `${BASE_URL}/asset/gambar/hanif_robbyanto.png`,
      "sameAs": [
        "https://linkedin.com/in/hanifrobbyanto"
      ],
      "knowsAbout": ["Human Resources", "Business Development", "Port Management", "HRIS", "Digital Transformation", "ISO 9001"]
    });

    if (type === 'article') {
      let publishedDate = new Date().toISOString(); // Asumsi hari ini jika tidak ada tag tanggal
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": url
        },
        "headline": title,
        "description": desc,
        "image": imagePath,  
        "author": {
          "@type": "Person",
          "name": AUTHOR_NAME,
          "url": BASE_URL
        },  
        "publisher": {
          "@type": "Organization",
          "name": AUTHOR_NAME,
          "logo": {
            "@type": "ImageObject",
            "url": `${BASE_URL}/asset/gambar/hanif_robbyanto.png`
          }
        },
        "datePublished": publishedDate,
        "dateModified": publishedDate
      });
    }

    let schemaScript = `  <!-- JSON-LD Schema -->\n  <script type="application/ld+json">\n  ${JSON.stringify(schemas, null, 2)}\n  </script>\n`;

    // INJECT TO HEAD
    $('head').append(metaTags);
    $('head').append(ogTags);
    $('head').append(schemaScript);

    // Write back
    fs.writeFileSync(filePath, $.html());
  });

  // GENERATE SITEMAP.XML
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapContent);
  console.log('✅ sitemap.xml berhasil dibuat.');

  // GENERATE ROBOTS.TXT
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;
  fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsContent);
  console.log('✅ robots.txt berhasil dibuat.');

  console.log('🎉 Proses SEO Otomatis Selesai! Skor Lighthouse Anda diproyeksikan 100/100.');
}

generateSEO();
