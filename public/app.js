(function () {
  const main = document.getElementById('main');
  const intro = document.getElementById('intro');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const helpBtn = document.getElementById('helpBtn');
  const resetBtn = document.getElementById('resetBtn');

  const STORAGE_KEY = 'Amba.AI_history_v1';

  const CRISIS_PATTERNS = [
    /bunuh diri/i, /mengakhiri hidup/i, /akhiri hidup/i, /ga(k|nda)? mau hidup/i,
    /pengen mati/i, /ingin mati/i, /nyakitin diri/i, /menyakiti diri/i,
    /melukai diri/i, /self ?harm/i, /suicide/i
  ];

  let history = [];
  let sending = false;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) history = parsed;
      }
    } catch (e) {
      history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-60)));
    } catch (e) {
      // storage full or unavailable; ignore, chat still works this session
    }
  }

  function scrollDown() {
    main.scrollTop = main.scrollHeight;
  }

  function addRow(role, text) {
    if (intro.parentNode) intro.remove();
    const row = document.createElement('div');
    row.className = 'row ' + (role === 'user' ? 'user' : 'ai');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    main.appendChild(row);
    scrollDown();
    return bubble;
  }

  function addResourceCard() {
    if (intro.parentNode) intro.remove();
    const card = document.createElement('div');
    card.className = 'resource-card';
    card.innerHTML = '<strong>Kalau kamu butuh belaian segera</strong>' +
      'Kamu nggak sendirian, dan ada orang yang siap rodok 24 jam:<br>' +
      '&bull; Hotline Kemenkes (Healing119 / SEJIWA): telepon <strong>119</strong> lalu tekan ekstensi <strong>8</strong><br>' +
      '&bull; LISA (Love Inside Suicide Awareness), chat WhatsApp: <strong>+62 811-3855-472</strong><br>' +
      '&bull; Dalam bahaya langsung, hubungi <strong>112</strong> atau ke IGD terdekat.';
    main.appendChild(card);
    scrollDown();
  }

  function showBanner(text) {
    if (intro.parentNode) intro.remove();
    const b = document.createElement('div');
    b.className = 'banner';
    b.textContent = text;
    main.appendChild(b);
    scrollDown();
  }

  function renderHistory() {
    if (!history.length) return;
    intro.remove();
    for (const m of history) addRow(m.role, m.content);
  }

  function setInputEnabled(on) {
    input.disabled = !on;
    sendBtn.disabled = !on;
  }

  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  input.addEventListener('input', autoGrow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  sendBtn.addEventListener('click', handleSend);
  helpBtn.addEventListener('click', () => addResourceCard());

  resetBtn.addEventListener('click', () => {
    if (!confirm('Mulai obrolan baru? Riwayat obrolan saat ini akan dihapus dari browser ini.')) return;
    history = [];
    saveHistory();
    main.innerHTML = '';
    const freshIntro = document.createElement('div');
    freshIntro.className = 'intro';
    freshIntro.innerHTML = '<h2>Halo, aku Amba</h2><p>Cerita aja apa yang lagi kamu rasain. Aku coba nikmati yah</p>';
    main.appendChild(freshIntro);
  });

  async function handleSend() {
    if (sending) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    autoGrow();

    sending = true;
    setInputEnabled(false);

    addRow('user', text);
    history.push({ role: 'user', content: text });
    saveHistory();

    const isCrisis = CRISIS_PATTERNS.some((re) => re.test(text));
    if (isCrisis) addResourceCard();

    const bubble = addRow('assistant', 'Amba sedang mengokang...');
    bubble.classList.add('typing');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();

      bubble.classList.remove('typing');

      if (!res.ok) {
        bubble.textContent = data.error || 'Maaf, amba lagi beli busana. Coba kirim lagi ya.';
      } else {
        bubble.textContent = data.text;
        history.push({ role: 'assistant', content: data.text });
        saveHistory();
      }
    } catch (e) {
      bubble.classList.remove('typing');
      bubble.textContent = 'Nggak bisa terhubung ke server. Cek koneksi dan bool kamu dan coba lagi.';
    } finally {
      sending = false;
      setInputEnabled(true);
      input.focus();
      scrollDown();
    }
  }

  loadHistory();
  renderHistory();
})();
