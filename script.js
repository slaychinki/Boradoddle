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

// 2. User & Admin Logic
const ADMIN_PASSKEY = "tnb2026";
let currentUser = JSON.parse(localStorage.getItem('bd_user')) || { name: "Guest Doodler", isAdmin: false };

function checkUser() {
  const greeting = document.getElementById('userGreeting');
  const authBtn = document.getElementById('authHeaderBtn');
  const adminNav = document.getElementById('adminNavTab');

  if (currentUser.isAdmin) {
    greeting.textContent = `Leader: ${currentUser.name} 👑`;
    authBtn.textContent = '👑 Admin';
    adminNav.style.display = 'flex';
  } else if (currentUser.name !== "Guest Doodler") {
    greeting.textContent = `Doodler: ${currentUser.name} ⭐`;
    authBtn.textContent = 'Logout';
    adminNav.style.display = 'none';
  } else {
    greeting.textContent = 'Guest Doodler';
    authBtn.textContent = '👤 Login';
    adminNav.style.display = 'none';
  }
}

function openAuthModal() {
  if (currentUser.name !== "Guest Doodler") {
    if (confirm("Do you want to log out?")) {
      currentUser = { name: "Guest Doodler", isAdmin: false };
      localStorage.setItem('bd_user', JSON.stringify(currentUser));
      checkUser();
      switchTab('voting', document.querySelectorAll('.nav-item')[0]);
    }
    return;
  }
  document.getElementById('authModal').classList.add('open');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function closeOnBackdrop(e) {
  if (e.target.id === 'authModal') closeAuthModal();
}

function performLogin() {
  const name = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPasscode').value.trim();

  if (!name) {
    alert("Please enter a nickname!");
    return;
  }

  const isAdmin = (pass === ADMIN_PASSKEY);
  currentUser = { name, isAdmin };
  localStorage.setItem('bd_user', JSON.stringify(currentUser));
  closeAuthModal();
  checkUser();

  if (isAdmin) {
    alert("👑 Welcome Leader! BoraDoodle Admin Panel unlocked!");
  } else {
    alert(`🎉 Welcome to BoraDoodle, ${name}!`);
  }
}

// 3. Live Voting Feed
let defaultVotes = [
  {
    title: "MAMA Awards: Worldwide Fans' Choice",
    platform: "Mnet Plus",
    deadline: "Daily Reset 00:00 KST",
    isUrgent: true,
    url: "https://www.mnetplus.world"
  },
  {
    title: "Idol Champ: Monthly Global K-Pop Group",
    platform: "Idol Champ App",
    deadline: "Collect Chamsims Daily",
    isUrgent: false,
    url: "https://play.google.com/store/apps/details?id=com.nwz.ichamp"
  },
  {
    title: "Choeaedol: Member Charity & Birthday Polls",
    platform: "Choeaedol",
    deadline: "Drop Daily Hearts Before Reset",
    isUrgent: true,
    url: "https://play.google.com/store/apps/details?id=net.ib.mn"
  }
];

let votingFeed = JSON.parse(localStorage.getItem('bd_votes')) || defaultVotes;

function renderVotes() {
  const c = document.getElementById('votingList');
  c.innerHTML = votingFeed.map(v => `
    <div class="vote-card">
      <div class="vote-top">
        <span class="bubble-tag mint">${v.platform}</span>
        ${v.isUrgent ? '<span class="bubble-tag pink">🚨 URGENT</span>' : ''}
      </div>
      <div class="vote-title">${v.title}</div>
      <div class="vote-deadline">⏳ ${v.deadline}</div>
      <a href="${v.url}" target="_blank" rel="noopener noreferrer" class="vote-action">
        Open & Cast Vote ↗
      </a>
    </div>
  `).join('');
}

function submitAdminVote() {
  const title = document.getElementById('adminVoteTitle').value.trim();
  const platform = document.getElementById('adminVotePlatform').value.trim();
  const deadline = document.getElementById('adminVoteDeadline').value.trim();
  const url = document.getElementById('adminVoteUrl').value.trim();
  const isUrgent = document.getElementById('adminVoteUrgent').checked;

  if (!title || !platform || !url) {
    alert("Please fill in title, platform, and link!");
    return;
  }

  votingFeed.unshift({ title, platform, deadline: deadline || "Active", isUrgent, url });
  localStorage.setItem('bd_votes', JSON.stringify(votingFeed));
  renderVotes();
  alert("✅ Vote card posted!");

  document.getElementById('adminVoteTitle').value = '';
  document.getElementById('adminVotePlatform').value = '';
  document.getElementById('adminVoteDeadline').value = '';
  document.getElementById('adminVoteUrl').value = '';
  document.getElementById('adminVoteUrgent').checked = false;
}

// 4. Kira Korean Hub (Deck, Canvas & Voice Match)
const baseDeck = [
  // Vowels
  { type: "vowel", cat: "Basic Vowel", kr: "ㅏ", rom: "[ a ]", en: "Like 'a' in father", hi: "आ (जैसे आम में)", ctx: "Vertical stroke down, short stroke right." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅑ", rom: "[ ya ]", en: "Like 'ya' in yard", hi: "या", ctx: "Double horizontal stroke." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅓ", rom: "[ eo ]", en: "Like 'u' in cup", hi: "अ (खुले गले से)", ctx: "Stroke points left into the vertical line." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅗ", rom: "[ o ]", en: "Like 'o' in open", hi: "ओ", ctx: "Vertical stroke up, horizontal baseline." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅜ", rom: "[ u ]", en: "Like 'oo' in moon", hi: "ऊ", ctx: "Horizontal baseline, stroke down." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅡ", rom: "[ eu ]", en: "Flat lips 'u' sound", hi: "उ (सपाट होंठ)", ctx: "Single flat horizontal stroke." },
  { type: "vowel", cat: "Basic Vowel", kr: "ㅣ", rom: "[ i ]", en: "Like 'ee' in see", hi: "ई", ctx: "Single vertical standing stroke." },
  // Consonants
  { type: "consonant", cat: "Consonant", kr: "ㄱ", rom: "[ g / k ]", en: "G/K Gun shape", hi: "ग / क", ctx: "Tongue base touches palate." },
  { type: "consonant", cat: "Consonant", kr: "ㄴ", rom: "[ n ]", en: "N Nose shape", hi: "न", ctx: "Tongue touches upper gums." },
  { type: "consonant", cat: "Consonant", kr: "ㄷ", rom: "[ d / t ]", en: "D/T Door shape", hi: "द / त", ctx: "Like an open door." },
  { type: "consonant", cat: "Consonant", kr: "ㅁ", rom: "[ m ]", en: "M Mouth shape", hi: "म", ctx: "Closed square lips." },
  { type: "consonant", cat: "Consonant", kr: "ㅂ", rom: "[ b / p ]", en: "B/P Bucket shape", hi: "ब / प", ctx: "Looks like a bucket of water." },
  { type: "consonant", cat: "Consonant", kr: "ㅅ", rom: "[ s ]", en: "S Person shape", hi: "स / श", ctx: "Looks like a roof or person." },
  { type: "consonant", cat: "Consonant", kr: "ㅇ", rom: "[ ng / silent ]", en: "Silent start; 'NG' at end", hi: "अंग (मौन शुरुआत)", ctx: "A smooth circle." },
  // BTS Words
  { type: "words", cat: "BTS Slang", kr: "보라해", rom: "[ Borahae ]", en: "I purple you (Love & Trust)", hi: "हमेशा प्यार और भरोसा निभाना", ctx: "Coined by V (Kim Taehyung) at 3rd Muster." },
  { type: "words", cat: "BTS Slang", kr: "아포방포", rom: "[ Apobangpo ]", en: "ARMY Forever, Bangtan Forever", hi: "आर्मी फॉरएवर, बैंगटन फॉरएवर", ctx: "Coined by Jungkook." },
  { type: "words", cat: "Lyric Core", kr: "보고싶다", rom: "[ Bogo sipda ]", en: "I miss you", hi: "मुझे आपकी याद आती है", ctx: "Iconic opening of Spring Day (봄날)." },
  { type: "words", cat: "Speech Essential", kr: "감사합니다", rom: "[ Gamsahamnida ]", en: "Thank you (Formal)", hi: "धन्यवाद / शुक्रिया", ctx: "Used in every acceptance speech." }
];

let customDeck = JSON.parse(localStorage.getItem('bd_custom_words')) || [];
let activeCat = 'all';
let currentDeck = [...baseDeck, ...customDeck];
let deckIdx = 0;

function filterCategory(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const full = [...baseDeck, ...customDeck];
  currentDeck = (cat === 'all') ? full : full.filter(i => i.type === cat);
  deckIdx = 0;
  updateCard();
}

function updateCard() {
  if (!currentDeck.length) return;
  const item = currentDeck[deckIdx];
  document.getElementById('cardCategory').textContent = item.cat;
  document.getElementById('cardCounter').textContent = `${deckIdx + 1} / ${currentDeck.length}`;
  document.getElementById('canvasHint').textContent = item.kr;
  document.getElementById('cardRom').textContent = item.rom;
  document.getElementById('cardEn').textContent = item.en;
  document.getElementById('cardHi').textContent = item.hi;
  document.getElementById('cardContext').textContent = item.ctx;
  document.getElementById('speechFeedback').textContent = "Tap 'Speak' to test pronunciation";
  clearCanvas();
}

function nextCard() {
  deckIdx = (deckIdx + 1) % currentDeck.length;
  updateCard();
}

function prevCard() {
  deckIdx = (deckIdx - 1 + currentDeck.length) % currentDeck.length;
  updateCard();
}

function listenAudio() {
  const text = currentDeck[deckIdx].kr;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } else {
    alert("Audio speech not supported on this browser.");
  }
}

// Kira Touch Canvas Tracing Logic
const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

function startDraw(e) {
  drawing = true;
  draw(e);
}
function endDraw() {
  drawing = false;
  ctx.beginPath();
}
function draw(e) {
  if (!drawing) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);

  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#7C3AED';

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchmove', draw, { passive: false });

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Voice Speech Matcher (Web Speech API)
let recognizing = false;
function toggleVoiceSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice recognition requires Google Chrome on Android.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.interimResults = false;

  const feedback = document.getElementById('speechFeedback');
  const micBtn = document.getElementById('micBtn');

  feedback.textContent = "🎙️ Listening... Speak the Korean word now!";
  micBtn.classList.add('purple');

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript.trim();
    const target = currentDeck[deckIdx].kr;
    if (spoken.includes(target) || target.includes(spoken)) {
      feedback.innerHTML = `🎉 <b>Daebak!</b> You said "${spoken}" (Match!)`;
    } else {
      feedback.innerHTML = `🤔 You said "${spoken}". Target is "${target}". Try again!`;
    }
    micBtn.classList.remove('purple');
  };

  recognition.onerror = () => {
    feedback.textContent = "Could not hear clearly. Try again!";
    micBtn.classList.remove('purple');
  };

  recognition.start();
}

function submitAdminWord() {
  const kr = document.getElementById('adminKrHangul').value.trim();
  const rom = document.getElementById('adminKrRom').value.trim();
  const en = document.getElementById('adminKrEn').value.trim();
  const hi = document.getElementById('adminKrHi').value.trim();
  const ctx = document.getElementById('adminKrContext').value.trim();

  if (!kr || !rom || !en) {
    alert("Please fill in Hangul, Romanization, and English meaning!");
    return;
  }

  customDeck.push({ type: "words", cat: "Custom Word", kr, rom, en, hi: hi || "", ctx: ctx || "Custom Army word" });
  localStorage.setItem('bd_custom_words', JSON.stringify(customDeck));
  filterCategory(activeCat, document.querySelector('.filter-chip.active'));
  alert("✅ Word added to Korean Deck!");

  document.getElementById('adminKrHangul').value = '';
  document.getElementById('adminKrRom').value = '';
  document.getElementById('adminKrEn').value = '';
  document.getElementById('adminKrHi').value = '';
  document.getElementById('adminKrContext').value = '';
}

// 5. Interactive Orbit Calendar
let calYear = 2026;
let calMonth = 8; // September (0-indexed)

const fEvents = {
  "2026-08-01": { title: "Jungkook Birthday 🎂", desc: "Golden Maknae Birthday! Stream Seven & Standing Next to You." },
  "2026-08-12": { title: "RM Birthday 🐨", desc: "Kim Namjoon Birthday celebration!" },
  "2026-09-13": { title: "Jimin Birthday 🐥", desc: "Park Jimin Birthday! Global charity streaming day." },
  "2026-11-04": { title: "Jin Birthday 🐹", desc: "Worldwide Handsome Jin's Birthday!" },
  "2026-11-30": { title: "V Birthday 🐻", desc: "Kim Taehyung Birthday celebration!" },
  "2026-05-13": { title: "BTS Debut Anniversary 💜", desc: "Festa celebration! Happy 13th Anniversary!" }
};

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCalendar() {
  document.getElementById('currentMonthLabel').textContent = `${monthNames[calMonth]} ${calYear}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    cell.textContent = d;

    const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (fEvents[dateKey]) cell.classList.add('has-event');

    const today = new Date();
    if (today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d) {
      cell.classList.add('today');
    }

    cell.onclick = () => selectDate(dateKey, d);
    grid.appendChild(cell);
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

function selectDate(key, day) {
  const ev = fEvents[key];
  const tag = document.getElementById('eventTag');
  const title = document.getElementById('eventTitle');
  const desc = document.getElementById('eventDesc');

  if (ev) {
    tag.textContent = "Milestone Event ⭐";
    title.textContent = ev.title;
    desc.textContent = ev.desc;
  } else {
    tag.textContent = "Daily Streak 💜";
    title.textContent = `${monthNames[calMonth]} ${day}, ${calYear}`;
    desc.textContent = "No global events scheduled for this day. Complete your daily voting quests to earn streak stars!";
  }
}

// 6. Quests (To-Do List)
let userTasks = JSON.parse(localStorage.getItem('bd_tasks')) || [
  { text: "Cast MAMA daily vote on Mnet Plus", done: false },
  { text: "Trace 3 Hangul letters on Kira canvas", done: false },
  { text: "Drop daily hearts on Choeaedol", done: false },
  { text: "Speak 1 Korean word into microphone", done: false }
];

function renderTasks() {
  localStorage.setItem('bd_tasks', JSON.stringify(userTasks));
  const list = document.getElementById('taskList');
  list.innerHTML = userTasks.map((t, idx) => `
    <li class="quest-item ${t.done ? 'done' : ''}">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${idx})">
      <span>${t.text}</span>
    </li>
  `).join('');
}

function toggleTask(i) {
  userTasks[i].done = !userTasks[i].done;
  renderTasks();
}

function addTask() {
  const input = document.getElementById('taskInput');
  const txt = input.value.trim();
  if (!txt) return;
  userTasks.push({ text: txt, done: false });
  input.value = '';
  renderTasks();
}

// 7. Navigation Tabs
function switchTab(tabKey, btnElement) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabKey}`).classList.add('active');
  if (btnElement) btnElement.classList.add('active');
}

// Boot
checkUser();
renderVotes();
updateCard();
renderCalendar();
renderTasks();
