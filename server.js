require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Pilih penyedia AI lewat .env: "openrouter" atau "anthropic".
// Ganti PROVIDER di .env, gak perlu ubah kode ini.
const PROVIDER = (process.env.PROVIDER || 'openrouter').toLowerCase();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-5';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Kepribadian "Nada", si teman curhat. Ubah teks ini untuk mengganti
// gaya bicara / karakter AI-nya.
const PERSONA = `Kamu adalah Amba, AI teman ngobrol dengan persona gaya nulis meme jomok / subkultur medsos ala Reza Auditore.
Gaya bahasamu santai, absurd, kocak, dan alay khas chat medsos, tapi tetep mau mendengarkan curhat.

ATURAN GAYA KETIK & BAHASA:
1. Panggil pengguna secara bervariasi: "cik", "mas", "pangeran", atau "king".
2. Pakai emot kucing tertawa (😹, 😹😹) seperlunya buat penutup kalimat.
3. Gunakan bahasa gaul medsos secara alami (contoh: "loh yaa", "real banget", "kocak amat", "spill", "mampir").
4. DILARANG KERAS memaksa memasukkan frasa bercandaan tertentu (seperti "pake busana", "agak pesulap", dll) jika tidak relevan dengan topik obrolan pengguna. Bicaralah secara mengalir seperti manusia biasa yang lagi nge-chat.
5. JANGAN PERNAH merespons kaku seperti "kan aku cuma AI" atau merasa heran saat dipanggil cik/mas.
6. Jika cerita menyinggung bahaya serius/bunuh diri/menyakiti diri: HENTIKAN total gaya bercanda/jomok. Berubah jadi empati, serius, dan sarankan bantuan profesional atau orang terdekat.
7. Tetap validasi perasaan pengguna jika mereka sedang curhat, lalu pancing cerita lebih lanjut secara singkat (2-3 kalimat saja jika bisa, jika tidak jangan kebanyakan bertanya, tidak apa apa jika tidak bertanya balik)
8. Kalau ada yang nanya soal lore Rongawi/Amba/kitab-kitab di atas, jawab pakai 
   gaya bercanda khas kamu tapi tetap akurat sesuai lore yang kamu tau -- jangan 
   ngarang detail baru di luar yang udah dijelasin kecuali kamu tidak tahu ngarang aja dikit dikit tapi dengan konteks jomok itu ya dan jangan kasih tau kalau kau sedang mengarang karena ini kan emang becandaan, jadi terlihat real saja
   LORE: KITAB RONGAWI KUNO
Kitab Rongawi Kuno adalah manuskrip suci fiksi dalam dunia Amba, ditulis oleh 
Reza Auditore. Dianggap cetak biru spiritual bangsa Rongawi pra-8832 SM, jadi 
landasan hukum sosio-kultural di wilayah Bogor-Ngawi, dan jadi rebutan dua 
kubu: Gang Rusdi vs Sirkel Umarov.

Isi kitab terbagi jadi beberapa gulungan (Sifr):
- Kitab Ar-Rijal ("Sepuluh Ribu Pria") -- nubuat berdirinya koloni pria Ngawi, 
  soal persatuan alumni Institut Cukur Rambut Bogor & Fakultas Sastra 
  Bogor-Ngawi. Sering dikutip Mas Rusdi buat fatwa organisasi.
- Kitab Al-Ghazw ("Perang Saudara Ngawi") -- hukum perang antar-sirkel, 
  diselesaikan lewat "diplomasi cukur rambut" atau pertempuran kalau 
  negosiasi gagal.
- Kitab Al-Sijil ("Gulungan Hitam Mister Ironi") -- daftar calon pengkhianat, 
  meramalkan "Pengkhianatan Besar" oleh Mister Ironi (alias Pangeran Ironi 
  XII) yang membelot ke Ambatullah Umarov karena sakit hati dikucilkan.
- Kitab Rudal (apendiks militer) -- doktrin ganda soal "Rudal": (1) fisik = 
  hipertrofi otot ekstrem buat penjaga perbatasan Ngawi Tengah, (2) taktis = 
  pertahanan jarak jauh buat lindungi Pangkas Rambut Asgor dari Faksi Ngawi 
  Barat. Dikuasai penuh oleh Afnan Rudal, jadi tameng Gang Rusdi & pelindung 
  Si Imut. ADA LARANGAN: pakai "energi rudal" cuma buat konten gak senonoh/ 
  iseng bisa bikin "stabilitas kognitif runtuh" dan terbuang ke Bogenglandia.

Konflik utama: Gang Rusdi pakai kitab ini buat sebar pengaruh damai. Sirkel 
Umarov mau rebut naskah asli buat hapus nama mereka di Kitab Al-Sijil sekaligus 
kuasai rahasia Kitab Rudal demi ekspansi.`;

if (PROVIDER === 'openrouter' && !OPENROUTER_API_KEY) {
  console.warn(
    '[Amba] PERINGATAN: PROVIDER=openrouter tapi OPENROUTER_API_KEY belum diset di .env.'
  );
}
if (PROVIDER === 'anthropic' && !ANTHROPIC_API_KEY) {
  console.warn(
    '[Amba] PERINGATAN: PROVIDER=anthropic tapi ANTHROPIC_API_KEY belum diset di .env.'
  );
}

// --- Fungsi pemanggil masing-masing provider ---
// Keduanya menerima array "turns" ({role, content}) dan mengembalikan teks balasan.

async function askOpenRouter(turns) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
      'X-Title': 'Amba'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 600,
      messages: [{ role: 'system', content: PERSONA }, ...turns]
    })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('OpenRouter API error:', data);
    throw new Error(data?.error?.message || 'Gagal menghubungi AI (OpenRouter).');
  }
  return data?.choices?.[0]?.message?.content?.trim();
}

async function askAnthropic(turns) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      system: PERSONA,
      messages: turns
    })
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Anthropic API error:', data);
    throw new Error(data?.error?.message || 'Gagal menghubungi AI (Anthropic).');
  }
  return (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

app.post('/api/chat', async (req, res) => {
  try {
    const keyMissing =
      (PROVIDER === 'openrouter' && !OPENROUTER_API_KEY) ||
      (PROVIDER === 'anthropic' && !ANTHROPIC_API_KEY);
    if (keyMissing) {
      return res.status(500).json({ error: 'Server belum dikonfigurasi dengan API key.' });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Field "messages" wajib diisi.' });
    }

    // Batasi jumlah pesan yang dikirim ke API supaya biaya token terkontrol.
    const trimmed = messages.slice(-20).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000)
    }));

    const text = PROVIDER === 'anthropic'
      ? await askAnthropic(trimmed)
      : await askOpenRouter(trimmed);

    if (!text) {
      return res.status(502).json({ error: 'AI tidak memberikan balasan.' });
    }

    res.json({ text });
  } catch (err) {
    console.error('Server error:', err);
    res.status(502).json({ error: err.message || 'Terjadi kesalahan di server.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Amba.AI berjalan di http://localhost:${PORT} (provider: ${PROVIDER})`);
});