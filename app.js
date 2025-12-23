/* Sylvia GuessMe - Static Edition (GitHub Pages friendly)
   - Packs in /data/*.json
   - Scores + current pack saved in localStorage
   - No backend required
*/
(function(){
  const $ = (id) => document.getElementById(id);

  const clueInput = $("clueInput");
  const btnGuess = $("btnGuess");
  const btnYes = $("btnYes");
  const btnNo = $("btnNo");
  const btnPlayAgain = $("btnPlayAgain");
  const btnNewRound = $("btnNewRound");

  const message = $("message");
  const clueList = $("clueList");
  const guessName = $("guessName");
  const guessMeta = $("guessMeta");
  const guessCountEl = $("guessCount");
  const feedbackRow = $("feedbackRow");

  const scoreWon = $("scoreWon");
  const scorePlayed = $("scorePlayed");
  const scoreBest = $("scoreBest");

  const botBubble = $("botBubble");
  const typingRow = $("typingRow");

  const winOverlay = $("winOverlay");
  const winText = $("winText");
  const starRow = $("starRow");
  const btnOverlayPlayAgain = $("btnOverlayPlayAgain");
  const btnOverlayClose = $("btnOverlayClose");

  const confettiCanvas = $("confetti");
  const ctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;

  const PACK_KEY = "sylvia_guessme_pack_v1";
  const SCORE_KEY = "sylvia_guessme_score_v1";
  const ROUND_KEY = "sylvia_guessme_round_v1";

  const PACKS = {
    "Minecraft": "./data/minecraft.json",
    "Disney": "./data/disney.json",
    "Mario": "./data/mario.json"
  };

  const COMPLIMENTS = [
    "Nice clue! 😄",
    "That was tricky!",
    "You’re really good at this!",
    "Ooo good hint!",
    "That one made me think!"
  ];

  function setBubble(text){ if(botBubble) botBubble.textContent = text || ""; }
  function showTyping(on){ if(!typingRow) return; typingRow.classList.toggle("hidden", !on); }
  function setMessage(text){ if(message) message.textContent = text || ""; }

  function safeJSONParse(s, fallback){
    try { return JSON.parse(s); } catch { return fallback; }
  }

  function normalizePack(pack){
    const p = String(pack||"").toLowerCase();
    if(p.includes("minecraft")) return "Minecraft";
    if(p.includes("disney")) return "Disney";
    if(p.includes("mario")) return "Mario";
    return "Minecraft";
  }

  function applyPackTheme(pack){
    const p = normalizePack(pack).toLowerCase();
    document.body.classList.remove("pack-minecraft","pack-disney","pack-mario");
    document.body.classList.add("pack-" + p);
  }

  function setCurrentPackLabel(pack){
    const el = $("packLabel");
    if(el) el.textContent = "Current Pack: " + normalizePack(pack);
  }

  function setActivePackButton(pack){
    const chosen = normalizePack(pack);
    document.querySelectorAll(".pack-buttons button[data-pack]").forEach(btn => {
      btn.classList.toggle("active", normalizePack(btn.dataset.pack) === chosen);
    });
  }

  function loadScore(){
    return safeJSONParse(localStorage.getItem(SCORE_KEY) || "{}", {});
  }
  function saveScore(s){
    localStorage.setItem(SCORE_KEY, JSON.stringify(s));
  }
  function renderScore(){
    const s = loadScore();
    if(scoreWon) scoreWon.textContent = String(s.won || 0);
    if(scorePlayed) scorePlayed.textContent = String(s.played || 0);
    if(scoreBest) scoreBest.textContent = s.best != null ? String(s.best) : "—";
  }
  function updateScoreOnWin(guessCount){
    const s = loadScore();
    s.played = (s.played || 0) + 1;
    s.won = (s.won || 0) + 1;
    if(s.best == null || guessCount < s.best) s.best = guessCount;
    saveScore(s);
    renderScore();
  }

  function loadRound(){
    return safeJSONParse(localStorage.getItem(ROUND_KEY) || "{}", {
      clues: [],
      guessCount: 0,
      lastGuess: null,
      solved: false
    });
  }
  function saveRound(r){
    localStorage.setItem(ROUND_KEY, JSON.stringify(r));
  }

  function closeWinOverlay(){ winOverlay?.classList.add("hidden"); }

  function resetRound(){
    const r = { clues: [], guessCount: 0, lastGuess: null, solved: false };
    saveRound(r);
    renderRound(r);
    closeWinOverlay();
    setBubble("Give me a clue!");
    setMessage("");
    if(clueInput){ clueInput.disabled = false; clueInput.value = ""; clueInput.focus(); }
    if(btnGuess) btnGuess.disabled = false;
  }

  function renderClues(clues){
    if(!clueList) return;
    clueList.innerHTML = "";
    (clues || []).forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      clueList.appendChild(li);
    });
  }

  function showGuess(guess, guesses){
    if(!guessName || !guessMeta || !guessCountEl) return;
    if(!guess){
      guessName.textContent = "—";
      guessMeta.textContent = "";
      feedbackRow?.classList.add("hidden");
    }else{
      guessName.textContent = guess.name;
      guessMeta.textContent = `${guess.game} • ${guess.character_type} • ${guess.sex}`;
      feedbackRow?.classList.remove("hidden");
    }
    guessCountEl.textContent = `Guesses: ${guesses || 0}`;
  }

  function renderRound(r){
    renderClues(r.clues || []);
    showGuess(r.lastGuess, r.guessCount || 0);
  }

  const STOP = new Set(["a","an","and","the","to","of","in","on","with","for","who","is","are","was","were","it","its","his","her","their","they","them","this","that","these","those","from","as","at","by","be","been","or"]);
  function tokenize(text){
    return String(text||"")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g," ")
      .split(/\s+/)
      .filter(Boolean)
      .filter(t => t.length > 1 && !STOP.has(t));
  }

  function scoreCharacter(char, tokens){
    const app = tokenize(char.appearance);
    const desc = tokenize(char.description);
    const clues = tokenize(char.guessing_clues);

    const setApp = new Set(app);
    const setDesc = new Set(desc);
    const setClues = new Set(clues);

    let score = 0;
    for(const t of tokens){
      if(setApp.has(t)) score += 5;
      if(setClues.has(t)) score += 3;
      if(setDesc.has(t)) score += 2;
      if(String(char.name||"").toLowerCase().includes(t)) score += 2;
    }
    score += Math.min(4, Math.floor(tokens.length / 3));
    return score;
  }

  async function loadPackData(pack){
    const url = PACKS[normalizePack(pack)];
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("Could not load pack data.");
    return await res.json();
  }

  async function makeGuess(allClues){
    const pack = normalizePack(localStorage.getItem(PACK_KEY) || "Minecraft");
    const data = await loadPackData(pack);

    const tokens = tokenize(allClues.join(" "));
    if(tokens.length === 0) return { guess: null, reason: "Need more clues." };

    let best = null;
    let bestScore = -1;
    for(const c of data){
      const s = scoreCharacter(c, tokens);
      if(s > bestScore){
        bestScore = s;
        best = c;
      }
    }
    if(bestScore < 4) return { guess: null, reason: "Tell me another clue!" };
    return { guess: best, reason: `I think it's ${best.name}!` };
  }

  function setStars(guessCount){
    if(!starRow) return;
    const n = Number(guessCount || 0);
    const stars = n <= 1 ? 3 : n <= 3 ? 2 : 1;
    starRow.textContent = "⭐ ".repeat(stars).trim();
  }

  function sayCompliment(){
    const msg = COMPLIMENTS[Math.floor(Math.random()*COMPLIMENTS.length)];
    setTimeout(() => setBubble(msg), 700);
  }

  let confettiPieces = [];
  let confettiAnim = null;

  function resizeConfetti(){
    if(!confettiCanvas || !ctx) return;
    confettiCanvas.width = window.innerWidth * devicePixelRatio;
    confettiCanvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  window.addEventListener("resize", resizeConfetti);
  resizeConfetti();

  function burstConfetti(){
    if(!confettiCanvas || !ctx) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const colors = ["#6ae4ff", "#4ef08a", "#ffdf6a", "#ff5b5b", "#ffffff"];
    const count = 140;

    confettiPieces = [];
    for(let i=0;i<count;i++){
      confettiPieces.push({
        x: w/2 + (Math.random()*80-40),
        y: h/3 + (Math.random()*40-20),
        vx: Math.random()*8-4,
        vy: -(Math.random()*10+6),
        g: Math.random()*0.18+0.10,
        r: Math.random()*360,
        vr: Math.random()*12-6,
        size: Math.random()*6+3,
        color: colors[Math.floor(Math.random()*colors.length)],
        life: Math.random()*50+70
      });
    }
    if(confettiAnim) cancelAnimationFrame(confettiAnim);
    animateConfetti();
  }

  function animateConfetti(){
    if(!confettiCanvas || !ctx) return;
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

    confettiPieces.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g*10;
      p.r += p.vr;
      p.life -= 1;

      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate((p.r*Math.PI)/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*1.6);
      ctx.restore();
    });

    confettiPieces = confettiPieces.filter(p=>p.life>0 && p.y < window.innerHeight+40);
    if(confettiPieces.length){
      confettiAnim = requestAnimationFrame(animateConfetti);
    }else{
      ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
      confettiAnim = null;
    }
  }

  const soundToggle = $("soundToggle");
  let audioCtx = null;
  function beep(type){
    if(!soundToggle || !soundToggle.checked) return;
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      const now = audioCtx.currentTime;
      const freq = type==="win" ? 880 : type==="no" ? 220 : 520;
      o.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now+0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now+0.20);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now+0.22);
    }catch{}
  }

  function openWinules(answer){ // open win overlay
    if(winText) winText.textContent = answer ? `Sylvia guessed: ${answer}!` : "Sylvia guessed it!";
    winOverlay?.classList.remove("hidden");
  }

  async function doGuess(){
    const clue = (clueInput?.value || "").trim();
    if(!clue){
      setMessage("Please type a clue first.");
      return;
    }
    const r = loadRound();
    if(r.solved){
      setMessage("Round is already solved. Tap Play Again.");
      return;
    }

    r.clues = (r.clues || []);
    r.clues.push(clue);
    r.guessCount = (r.guessCount || 0) + 1;

    saveRound(r);
    renderClues(r.clues);
    setMessage("Thinking…");
    showTyping(true);
    if(btnGuess) btnGuess.disabled = true;
    setBubble("Thinking…");

    try{
      const { guess, reason } = await makeGuess(r.clues);
      r.lastGuess = guess;
      saveRound(r);
      showGuess(guess, r.guessCount);
      setMessage(reason || "");
      setBubble(guess ? `I think it's ${guess.name}!` : (reason || "Tell me another clue!"));
      beep("guess");
      clueInput.value = "";
      clueInput.focus();
    }catch(e){
      setMessage(e.message || "Something went wrong.");
      setBubble("Oops—try another clue!");
    }finally{
      showTyping(false);
      if(btnGuess) btnGuess.disabled = false;
    }
  }

  function onYes(){
    const r = loadRound();
    if(!r.lastGuess){
      setMessage("No guess yet — type a clue first.");
      return;
    }
    r.solved = true;
    saveRound(r);

    setStars(r.guessCount || 0);
    sayCompliment();
    burstConfetti();
    beep("win");

    updateScoreOnWin(r.guessCount || 0);
    openWin(r.lastGuess.name);

    setBubble("🎉 Yay!! I got it right!! 🎉");
    setMessage(`Yay! I guessed it: ${r.lastGuess.name}`);
    feedbackRow?.classList.add("hidden");
    if(clueInput) clueInput.disabled = true;
    if(btnGuess) btnGuess.disabled = true;
  }

  function openWin(name){
    if(winText) winText.textContent = `Sylvia guessed: ${name}!`;
    winOverlay?.classList.remove("hidden");
  }

  function onNo(){
    const r = loadRound();
    if(!r.lastGuess){
      setMessage("No guess yet — type a clue first.");
      return;
    }
    beep("no");
    setBubble("Okay! Give me another clue 🙂");
    setMessage("No problem — add another clue!");
    clueInput?.focus();
  }

  async function onPackSelected(pack){
    const chosen = normalizePack(pack);
    localStorage.setItem(PACK_KEY, chosen);
    applyPackTheme(chosen);
    setCurrentPackLabel(chosen);
    setActivePackButton(chosen);
    resetRound();
    setBubble(`Let’s play ${chosen}! 🎮`);
  }

  function initPackUI(){
    const saved = localStorage.getItem(PACK_KEY) || "Minecraft";
    localStorage.setItem(PACK_KEY, normalizePack(saved));
    applyPackTheme(saved);
    setCurrentPackLabel(saved);
    setActivePackButton(saved);

    document.querySelectorAll(".pack-buttons button[data-pack]").forEach(btn=>{
      btn.addEventListener("click", ()=>onPackSelected(btn.dataset.pack));
    });
  }

  btnOverlayClose?.addEventListener("click", closeWinOverlay);
  btnOverlayPlayAgain?.addEventListener("click", resetRound);
  winOverlay?.addEventListener("click", (e)=>{ if(e.target === winOverlay) closeWinOverlay(); });
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeWinOverlay(); });

  btnPlayAgain?.addEventListener("click", resetRound);
  btnNewRound?.addEventListener("click", resetRound);

  btnGuess?.addEventListener("click", doGuess);
  clueInput?.addEventListener("keydown", (e)=>{ if(e.key === "Enter") doGuess(); });
  btnYes?.addEventListener("click", onYes);
  btnNo?.addEventListener("click", onNo);

  renderScore();
  initPackUI();

  const round = loadRound();
  renderRound(round);
  feedbackRow?.classList.toggle("hidden", !round.lastGuess || round.solved);

  if(round.solved && round.lastGuess){
    setStars(round.guessCount || 0);
    setBubble("🎉 Yay!! I got it right!! 🎉");
    setMessage(`Yay! I guessed it: ${round.lastGuess.name}`);
    openWin(round.lastGuess.name);
    if(clueInput) clueInput.disabled = true;
    if(btnGuess) btnGuess.disabled = true;
  }else{
    setBubble("Give me a clue!");
  }
})();