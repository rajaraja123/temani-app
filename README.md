# Temani — teman curhat AI

Aplikasi chat sederhana dengan karakter AI bernama **Nada**, dibuat untuk jadi teman ngobrol/curhat. Frontend polos (HTML/CSS/JS, tanpa framework) + backend kecil (Node.js/Express) yang meneruskan pesan ke Claude API pakai API key kamu sendiri.

## Struktur folder

```
temani-app/
├── server.js          # backend Express, endpoint POST /api/chat
├── package.json
├── .env.example        # contoh file environment variable
└── public/
    ├── index.html       # halaman chat
    ├── style.css
    └── app.js           # logika chat, panggil /api/chat, simpan riwayat di localStorage
```

## 1. Siapkan API key

1. Buat akun di [console.anthropic.com](https://console.anthropic.com).
2. Buka **Settings → API Keys**, buat key baru.
3. Isi saldo/billing (API dibayar per token, bukan langganan bulanan flat).

## 2. Jalankan di komputer sendiri

```bash
cd temani-app
npm install
cp .env.example .env
```

Buka file `.env`, isi `ANTHROPIC_API_KEY` dengan key kamu. Lalu:

```bash
npm start
```

Buka `http://localhost:3000` di browser.

## 3. Deploy supaya bisa diakses publik

Paling gampang pakai **Railway** atau **Render** (keduanya mendukung Node.js langsung, ada tier gratis/murah untuk mulai):

### Opsi A — Railway
1. Push folder ini ke repo GitHub.
2. Di [railway.app](https://railway.app), klik **New Project → Deploy from GitHub repo**, pilih repo-nya.
3. Di tab **Variables**, tambahkan `ANTHROPIC_API_KEY` dengan value API key kamu.
4. Railway otomatis jalanin `npm install` lalu `npm start`. Setelah selesai deploy, kamu dapat URL publik.

### Opsi B — Render
1. Push ke GitHub, lalu di [render.com](https://render.com) klik **New → Web Service**, hubungkan repo.
2. Build command: `npm install`. Start command: `npm start`.
3. Tambahkan environment variable `ANTHROPIC_API_KEY` di tab **Environment**.

### Opsi C — VPS sendiri (misal DigitalOcean, biznet, dsb)
1. Install Node.js 18+ di server.
2. Upload/`git clone` folder ini, jalankan `npm install`.
3. Buat file `.env` di server dengan API key kamu.
4. Jalankan dengan process manager biar tetap hidup: `npx pm2 start server.js --name temani`.
5. Pasang Nginx sebagai reverse proxy + SSL (Let's Encrypt / Certbot) kalau mau domain sendiri dengan HTTPS.

**Jangan pernah** commit file `.env` atau API key ke repo publik — file `.env` sudah semestinya diabaikan git (tambahkan `.env` ke `.gitignore`).

## Cara kerja singkat

- User ngetik pesan di `public/app.js` → dikirim ke `POST /api/chat` di server kamu sendiri.
- `server.js` menambahkan instruksi kepribadian ("system prompt") lalu meneruskan ke Claude API pakai API key kamu, yang disimpan aman di server (tidak pernah dikirim ke browser).
- Balasan AI dikirim balik ke browser dan ditampilkan.
- Riwayat obrolan disimpan di `localStorage` browser masing-masing user (jadi tiap orang cuma lihat obrolannya sendiri, tanpa perlu database/login) — kalau mau riwayat tersimpan di server (misalnya biar bisa diakses dari device lain), perlu ditambah sistem akun + database, itu di luar cakupan starter ini.

## Yang perlu disesuaikan sebelum dipakai serius

- **Kepribadian AI**: edit variabel `PERSONA` di `server.js` untuk ubah gaya bicara/karakter.
- **Kontrol biaya**: setiap pesan yang dikirim = biaya token API. `server.js` sudah membatasi riwayat yang dikirim ke 20 pesan terakhir dan `max_tokens: 600` per balasan; sesuaikan lagi kalau perlu, dan pertimbangkan batasi jumlah pesan gratis per user per hari kalau nanti banyak yang pakai.
- **Deteksi krisis**: filter kata kunci di `app.js` (`CRISIS_PATTERNS`) masih sangat dasar (deteksi kata kunci sederhana). Kalau aplikasi ini akan dipakai publik, sangat disarankan untuk memperkuat penanganan ini dan berkonsultasi dengan pihak yang paham kesehatan mental.
- **Keamanan**: kalau nanti trafik besar, tambahkan rate limiting per IP/user di `server.js` supaya API key tidak disalahgunakan orang lain lewat endpoint publikmu.
