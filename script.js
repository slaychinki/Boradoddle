// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
}

// 1. Live KST Clock
function updateKST() {
  try {
    const kst = new Intl.DateTimeFormat([], {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
    document.getElementById('kstClock').textContent = `KST ${kst}`;
  } catch (e) {
    document.getElementById('kstClock').textContent = 'KST Live';
  }
}
setInterval(updateKST, 1000);
updateKST();

// 2. Authentication & Admin Security
// Your private passkey (not shown anywhere in the UI)
const PRIVATE_ADMIN_KEY = "BORA_LEADER_77";

let userSession = JSON.parse(localStorage.getItem('kb_session')) || {
  name: "Guest",
  isAdmin: false
};

function refreshAuthUI() {
  const label = document.getElementById('userStatusLabel');
  const btn = document.getElementById('authActionBtn');
  const adminTab = document.getElementById('adminBarBtn');

  if (userSession.isAdmin) {
    label.textContent = `Leader: ${userSession.name}`;
    btn.textContent = 'Logout';
    adminTab.style.display = 'flex';
  } else if (userSession.name !== "Guest") {
    label.textContent = `Member: ${userSession.name}`;
    btn.textContent = 'Logout';
    adminTab.style.display = 'none';
  } else {
    label.textContent = 'Guest Member';
    btn.textContent = 'Login';
    adminTab.style.display = 'none';
  }
}

function openLoginModal() {
  if (userSession.name !== "Guest") {
    if (confirm("Do you want to log out?")) {
      userSession = { name: "Guest", isAdmin: false };
      localStorage.setItem('kb_session', JSON.stringify(userSession));
      refreshAuthUI();
      switchTab('korean', document.querySelectorAll('.nav-btn')[0]);
    }
    return;
  }
  document.getElementById('authModal').classList.add('open');
}

function closeLoginModal() {
  document.getElementById('authModal').classList.remove('open');
}

function closeModalOnBg(e) {
  if (e.target.id === 'authModal') closeLoginModal();
}

function processLogin() {
  const name = document.getElementById('authNameInput').value.trim();
  const key = document.getElementById('authKeyInput').value.trim();

  if (!name) {
    alert("Please enter a name to continue.");
    return;
  }

  const isAdmin = (key === PRIVATE_ADMIN_KEY);
  userSession = { name, isAdmin };
  localStorage.setItem('kb_session', JSON.stringify(userSession));
  closeLoginModal();
  refreshAuthUI();

  if (isAdmin) {
    alert("Leader verified. Admin tools enabled.");
  }
}

// 3. Kira Korean Learning Deck
const baseDeck = [
  { type: "vowel", cat: "Vowel", kr: "ㅏ", rom: "[ a ]", en: "Like 'a' in father", hi: "आ ध्वनि", ctx: "Vertical stroke down, short right tick." },
  { type: "vowel", cat: "Vowel", kr: "ㅑ", rom: "[ ya ]", en: "Like 'ya' in yard", hi: "या ध्वनि", ctx: "Vertical stroke down, two right ticks." },
  { type: "vowel", cat: "Vowel", kr: "ㅓ", rom: "[ eo ]", en: "Like 'u' in cup", hi: "अ ध्वनि (खुले गले से)", ctx: "Short tick pointing left into vertical line." },
  { type: "vowel", cat: "Vowel", kr: "ㅕ", rom: "[ yeo ]", en: "Like 'yeo' in yawn", hi: "य (अ के साथ)", ctx: "Two left ticks into vertical line." },
  { type: "vowel", cat: "Vowel", kr: "ㅗ", rom: "[ o ]", en: "Like 'o' in open", hi: "ओ ध्वनि (गोल होंठ)", ctx: "Upright tick with a flat baseline." },
  { type: "vowel", cat: "Vowel", kr: "ㅜ", rom: "[ u ]", en: "Like 'oo' in moon", hi: "ऊ ध्वनि", ctx: "Horizontal baseline, stroke down." },
  { type: "vowel", cat: "Vowel", kr: "ㅡ", rom: "[ eu ]", en: "Flat lips 'u' sound", hi: "उ (सपाट होंठ)", ctx: "Single horizontal stroke representing earth." },
  { type: "vowel", cat: "Vowel", kr: "ㅣ", rom: "[ i ]", en: "Like 'ee' in see", hi: "ई ध्वनि", ctx: "Single upright vertical stroke." },
  { type: "consonant", cat: "Consonant", kr: "ㄱ", rom: "[ g / k ]", en: "G/K Gun shape", hi: "ग / क", ctx: "Drawn across then down." },
  { type: "consonant", cat: "Consonant", kr: "ㄴ", rom: "[ n ]", en: "N sound", hi: "न ध्वनि", ctx: "Down then across." },
  { type: "consonant", cat: "Consonant", kr: "ㄷ", rom: "[ d / t ]", en: "D/T Door shape", hi: "द / त", ctx: "Top bar, then down and across." },
  { type: "consonant", cat: "Consonant", kr: "ㅁ", rom: "[ m ]", en: "M Mouth shape", hi: "म ध्वनि", ctx: "Four-stroke square." },
  { type: "consonant", cat: "Consonant", kr: "ㅂ", rom: "[ b / p ]", en: "B/P Bucket shape", hi: "ब / प", ctx: "Two vertical lines, bottom bar, middle bar." },
  { type: "consonant", cat: "Consonant", kr: "ㅅ", rom: "[ s ]", en: "S sound", hi: "स ध्वनि", ctx: "Left slant, then right slant." },
  { type: "consonant", cat: "Consonant", kr: "ㅇ", rom: "[ ng / silent ]", en: "Circle (Silent start)", hi: "अंग (शुरुआत में मौन)", ctx: "Drawn as a clean counter-clockwise circle." },
  { type: "words", cat: "BTS Slang", kr: "보라해", rom: "[ Borahae ]", en: "I purple you", hi: "हमेशा प्यार और भरोसा", ctx: "Coined by Kim Taehyung (V)." },
  { type: "words", cat: "BTS Slang", kr: "아포방포", rom: "[ Apobangpo ]", en: "ARMY Forever, BTS Forever", hi: "आर्मी फॉरएवर, बैंगटन फॉरएवर", ctx: "Coined by Jungkook." },
  { type: "words", cat: "Lyric Core", kr: "보고싶다", rom: "[ Bogo sipda ]", en: "I miss you", hi: "मुझे आपकी याद आती है", ctx: "Opening line of Spring Day." }
];

let customWords = JSON.parse(localStorage.getItem('kb_custom_words')) || [];
let activeCategory = 'all';
let currentDeck = [...baseDeck, ...customWords];
let deckIdx = 0;

function setCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.filter-strip .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');

  const full = [...baseDeck, ...customWords];
  currentDeck = (cat === 'all') ? full : full.filter(item => item.type === cat);
  deckIdx = 0;
  loadCurrentCard(true);
}

function loadCurrentCard(shouldAutoSpeak = false) {
  if (!currentDeck.length) return;
  const item = currentDeck[deckIdx];

  document.getElementById('cardCat').textContent = item.cat;
  document.getElementById('cardProgress').textContent = `${deckIdx + 1} / ${currentDeck.length}`;
  document.getElementById('canvasLetter').textContent = item.kr;
  document.getElementById('cardRom').textContent = item.rom;
  document.getElementById('cardEn').textContent = item.en;
  document.getElementById('cardHi').textContent = item.hi;
  document.getElementById('cardContext').textContent = item.ctx;
  document.getElementById('speechStatus').textContent = "Tap the mic and speak clearly";
  document.getElementById('strokeGrade').textContent = "Draw the letter above with your finger";
  document.getElementById('strokeGrade').style.color = "var(--text-muted)";
  
  resetCanvas();

  // Kira Feature: Auto-pronounce when a new card loads
  if (shouldAutoSpeak) {
    speakCurrent();
  }
}

function nextCard() {
  deckIdx = (deckIdx + 1) % currentDeck.length;
  loadCurrentCard(true);
}

function prevCard() {
  deckIdx = (deckIdx - 1 + currentDeck.length) % currentDeck.length;
  loadCurrentCard(true);
}

function speakCurrent(force = false) {
  if (!currentDeck.length) return;
  const text = currentDeck[deckIdx].kr;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.82;
    window.speechSynthesis.speak(u);
  }
}

// Kira Touch Canvas & Accuracy Verification
const canvas = document.getElementById('writeCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let drawnPixels = 0;

function startTouch(e) {
  drawing = true;
  drawTouch(e);
}

function endTouch() {
  if (!drawing) return;
  drawing = false;
  ctx.beginPath();
  
  // Kira Validation: Check if the user traced enough of the letter
  evaluateStroke();
}

function drawTouch(e) {
  if (!drawing) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);

  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7C3AED';

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  drawnPixels++;
}

canvas.addEventListener('mousedown', startTouch);
canvas.addEventListener('mouseup', endTouch);
canvas.addEventListener('mousemove', drawTouch);
canvas.addEventListener('touchstart', startTouch, { passive: false });
canvas.addEventListener('touchend', endTouch);
canvas.addEventListener('touchmove', drawTouch, { passive: false });

function resetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawnPixels = 0;
}

function evaluateStroke() {
  const gradeLabel = document.getElementById('strokeGrade');
  if (drawnPixels > 35) {
    gradeLabel.textContent = "✨ Great stroke! Accurate tracing.";
    gradeLabel.style.color = "var(--primary)";
  } else if (drawnPixels > 10) {
    gradeLabel.textContent = "👍 Good start, make sure to finish the full stroke.";
    gradeLabel.style.color = "var(--text-main)";
  } else {
    gradeLabel.textContent = "✍️ Keep drawing across the guide.";
    gradeLabel.style.color = "var(--text-muted)";
  }
}

// Native Speech Recognition Pronunciation Check
function runSpeechTest() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Speech recognition works best in Chrome on Android.");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'ko-KR';
  rec.interimResults = false;

  const btn = document.getElementById('micTriggerBtn');
  const status = document.getElementById('speechStatus');

  btn.classList.add('active');
  status.textContent = "Listening... Speak the Korean word now.";

  rec.onresult = (evt) => {
    btn.classList.remove('active');
    const heard = evt.results[0][0].transcript.trim();
    const target = currentDeck[deckIdx].kr;

    if (heard.includes(target) || target.includes(heard)) {
      status.innerHTML = `✅ <b>Correct!</b> Heard: "${heard}"`;
      status.style.color = "var(--accent-green)";
    } else {
      status.innerHTML = `⚠️ Heard "${heard}". Target was "${target}". Try again.`;
      status.style.color = "var(--text-main)";
    }
  };

  rec.onerror = () => {
    btn.classList.remove('active');
    status.textContent = "Didn't catch that clearly. Tap to retry.";
  };

  rec.start();
}

// 4. Voting Logic
let defaultVotes = [
  {
    title: "MAMA Awards: Worldwide Fans' Choice",
    platform: "Mnet Plus",
    deadline: "Daily reset at 00:00 KST",
    urgent: true,
    url: "https://www.mnetplus.world"
  },
  {
    title: "Idol Champ: Monthly Global Artist Vote",
    platform: "Idol Champ App",
    deadline: "Collect free daily hearts",
    urgent: false,
    url: "https://play.google.com/store/apps/details?id=com.nwz.ichamp"
  },
  {
    title: "Choeaedol: Member Charity Banner",
    platform: "Choeaedol",
    deadline: "Drop daily hearts before reset",
    urgent: true,
    url: "https://play.google.com/store/apps/details?id=net.ib.mn"
  }
];

let votesData = JSON.parse(localStorage.getItem('kb_votes')) || defaultVotes;

function renderVotes() {
  const c = document.getElementById('votingList');
  c.innerHTML = votesData.map(v => `
    <div class="vote-item">
      <div class="vote-meta-line">
        <span class="platform-tag">${v.platform}</span>
        ${v.urgent ? '<span class="urgent-badge">URGENT</span>' : ''}
      </div>
      <div class="vote-title">${v.title}</div>
      <div class="vote-sub">⏳ ${v.deadline}</div>
      <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="vote-link-btn">
        Open & Cast Vote ↗
      </a>
    </div>
  `).join('');
}

// 5. Admin Actions (Only available to leader)
function adminAddVote() {
  const title = document.getElementById('admTitle').value.trim();
  const platform = document.getElementById('admPlatform').value.trim();
  const deadline = document.getElementById('admDeadline').value.trim();
  const url = document.getElementById('admUrl').value.trim();
  const urgent = document.getElementById('admUrgent').checked;

  if (!title || !platform || !url) {
    alert("Please fill in the title, platform, and link.");
    return;
  }

  votesData.unshift({ title, platform, deadline: deadline || "Active", urgent, url });
  localStorage.setItem('kb_votes', JSON.stringify(votesData));
  renderVotes();
  alert("Voting item published.");

  document.getElementById('admTitle').value = '';
  document.getElementById('admPlatform').value = '';
  document.getElementById('admDeadline').value = '';
  document.getElementById('admUrl').value = '';
  document.getElementById('admUrgent').checked = false;
}

function adminAddWord() {
  const kr = document.getElementById('admHangul').value.trim();
  const rom = document.getElementById('admRom').value.trim();
  const en = document.getElementById('admEn').value.trim();
  const hi = document.getElementById('admHi').value.trim();
  const ctx = document.getElementById('admContext').value.trim();

  if (!kr || !rom || !en) {
    alert("Please provide Hangul, Romanization, and English.");
    return;
  }

  customWords.push({ type: "words", cat: "Custom Word", kr, rom, en, hi: hi || "", ctx: ctx || "Added by leader" });
  localStorage.setItem('kb_custom_words', JSON.stringify(customWords));
  setCategory(activeCategory, document.querySelector('.filter-strip .chip.active'));
  alert("Word added to deck.");

  document.getElementById('admHangul').value = '';
  document.getElementById('admRom').value = '';
  document.getElementById('admEn').value = '';
  document.getElementById('admHi').value = '';
  document.getElementById('admContext').value = '';
}

// 6. Calendar
let calYear = 2026;
let calMonth = 8; // September (0-indexed)

const eventsMap = {
  "2026-08-01": { title: "Jungkook Birthday", desc: "Golden Maknae celebration." },
  "2026-08-12": { title: "RM Birthday", desc: "Kim Namjoon celebration." },
  "2026-09-13": { title: "Jimin Birthday", desc: "Park Jimin charity stream." },
  "2026-11-04": { title: "Jin Birthday", desc: "Worldwide Handsome celebration." },
  "2026-11-30": { title: "V Birthday", desc: "Kim Taehyung birthday." },
  "2026-05-13": { title: "BTS Anniversary", desc: "Happy 13th Debut Anniversary." }
};

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCalendar() {
  document.getElementById('calendarMonthTitle').textContent = `${monthNames[calMonth]} ${calYear}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    grid.appendChild(blank);
  }

  for (let d = 1; d <= totalDays; d++) {
    const day = document.createElement('div');
    day.className = 'cal-day';
    day.textContent = d;

    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (eventsMap[key]) day.classList.add('has-event');

    const today = new Date();
    if (today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d) {
      day.classList.add('today');
    }

    day.onclick = () => selectDate(key, d);
    grid.appendChild(day);
  }
}

function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

function selectDate(key, d) {
  const ev = eventsMap[key];
  const tag = document.getElementById('eventTag');
  const title = document.getElementById('eventTitle');
  const desc = document.getElementById('eventDescription');

  if (ev) {
    tag.textContent = "Milestone Event";
    title.textContent = ev.title;
    desc.textContent = ev.desc;
  } else {
    tag.textContent = "Daily Log";
    title.textContent = `${monthNames[calMonth]} ${d}, ${calYear}`;
    desc.textContent = "No special events scheduled for this day.";
  }
}

// 7. Tasks
let tasks = JSON.parse(localStorage.getItem('kb_tasks')) || [
  { text: "Cast MAMA daily vote", done: false },
  { text: "Trace 3 Hangul characters", done: false },
  { text: "Complete daily pronunciation check", done: false }
];

function renderTasks() {
  localStorage.setItem('kb_tasks', JSON.stringify(tasks));
  const list = document.getElementById('taskList');
  list.innerHTML = tasks.map((t, i) => `
    <li class="task-item ${t.done ? 'done' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${i})">
      <span>${t.text}</span>
    </li>
  `).join('');
}

function toggleTask(i) {
  tasks[i].done = !tasks[i].done;
  renderTasks();
}

function addTask() {
  const input = document.getElementById('taskInput');
  const val = input.value.trim();
  if (!val) return;
  tasks.push({ text: val, done: false });
  input.value = '';
  renderTasks();
}

// 8. Navigation
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (btn) btn.classList.add('active');
}

// Initialize
refreshAuthUI();
loadCurrentCard(false);
renderVotes();
renderCalendar();
renderTasks();
    
