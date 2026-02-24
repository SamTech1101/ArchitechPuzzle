(() => {
  const SIZE = 4;
  const board = document.getElementById('board');
  const timeEl = document.getElementById('time');
  const movesEl = document.getElementById('moves');

  const shuffleBtn = document.getElementById('shuffleBtn');
  const resetBtn = document.getElementById('resetBtn');
  const previewBtn = document.getElementById('previewBtn');
  const closePreviewBtn = document.getElementById('closePreview');
  const previewModal = document.getElementById('preview');

  const gridToggle = document.getElementById('gridToggle');
  const numbersToggle = document.getElementById('numbersToggle');

  const winOverlay = document.getElementById('win');
  const winTime = document.getElementById('winTime');
  const winMoves = document.getElementById('winMoves');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const shareBtn = document.getElementById('shareBtn');

  let tiles = [];
  let solved = [];
  let moves = 0;

  let timer = null;
  let startedAt = null;
  let elapsedMs = 0;

  function pad2(n){ return String(n).padStart(2,'0'); }
  function fmt(ms){
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${pad2(m)}:${pad2(r)}`;
  }
  function setTime(ms){ timeEl.textContent = fmt(ms); }
  function setMoves(n){ movesEl.textContent = String(n); }

  function startTimer(){
    if (timer) return;
    startedAt = performance.now() - elapsedMs;
    timer = setInterval(() => {
      elapsedMs = performance.now() - startedAt;
      setTime(elapsedMs);
    }, 250);
  }
  function stopTimer(){
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }
  function resetStats(){
    moves = 0;
    elapsedMs = 0;
    setMoves(moves);
    setTime(elapsedMs);
    stopTimer();
  }

  function makeSolved(){
    solved = Array.from({length: SIZE*SIZE}, (_, i) => i);
  }

  function render(){
    board.innerHTML = '';
    board.classList.toggle('grid', gridToggle.checked);

    tiles.forEach((tileIdx, pos) => {
      const el = document.createElement('div');
      el.className = 'tile';
      el.draggable = true;
      el.dataset.pos = String(pos);

      const x = (tileIdx % SIZE) * (100/(SIZE-1));
      const y = Math.floor(tileIdx / SIZE) * (100/(SIZE-1));
      el.style.backgroundPosition = `${x}% ${y}%`;

      if (numbersToggle.checked) {
        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = String(tileIdx + 1);
        el.appendChild(num);
      }

      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', () => dragSrcPos = null);

      el.addEventListener('click', onTileClick);

      board.appendChild(el);
    });
  }

  let dragSrcPos = null;
  function onDragStart(e){
    dragSrcPos = Number(e.currentTarget.dataset.pos);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragSrcPos));
    startTimer();
  }
  function onDragOver(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function onDrop(e){
    e.preventDefault();
    const src = Number(e.dataTransfer.getData('text/plain'));
    const dst = Number(e.currentTarget.dataset.pos);
    if (Number.isFinite(src) && Number.isFinite(dst) && src !== dst){
      swapPositions(src, dst);
    }
  }

  let selectedPos = null;
  function onTileClick(e){
    const pos = Number(e.currentTarget.dataset.pos);
    if (!timer) startTimer();

    if (selectedPos === null){
      selectedPos = pos;
      e.currentTarget.style.filter = 'brightness(1.15)';
      e.currentTarget.style.outline = '2px solid rgba(79,124,255,.65)';
      e.currentTarget.style.zIndex = '1';
      return;
    }

    const src = selectedPos;
    const dst = pos;
    selectedPos = null;

    if (src !== dst) swapPositions(src, dst);
    else render();
  }

  function swapPositions(a, b){
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    moves += 1;
    setMoves(moves);
    render();
    checkWin();
  }

  function shuffle(){
    for (let i = tiles.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    if (isSolved()) shuffle();
  }

  function isSolved(){
    for (let i=0;i<tiles.length;i++){
      if (tiles[i] !== solved[i]) return false;
    }
    return true;
  }

  function checkWin(){
    if (!isSolved()) return;
    stopTimer();
    winTime.textContent = `Time: ${fmt(elapsedMs)}`;
    winMoves.textContent = `Moves: ${moves}`;
    winOverlay.hidden = false;
  }

  function hideWin(){ winOverlay.hidden = true; }

  function resetToSolved(){
    tiles = [...solved];
    resetStats();
    hideWin();
    render();
  }

  function newGame(){
    resetToSolved();
    shuffle();
    render();
  }

  shuffleBtn.addEventListener('click', () => newGame());
  resetBtn.addEventListener('click', () => resetToSolved());

  previewBtn.addEventListener('click', () => previewModal.hidden = false);
  closePreviewBtn.addEventListener('click', () => previewModal.hidden = true);
  previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.hidden = true; });

  gridToggle.addEventListener('change', () => render());
  numbersToggle.addEventListener('change', () => render());

  playAgainBtn.addEventListener('click', () => { hideWin(); newGame(); });

  shareBtn.addEventListener('click', async () => {
    const text = `I solved the 4×4 photo puzzle in ${fmt(elapsedMs)} with ${moves} moves. Can you beat that?`;
    try{
      await navigator.clipboard.writeText(text);
      shareBtn.textContent = 'Copied!';
      setTimeout(() => shareBtn.textContent = 'Copy share text', 1200);
    }catch{
      alert(text);
    }
  });

makeSolved();

// Always start a fresh shuffled game on load
(function boot(){
  tiles = [...solved];

  // Shuffle multiple times to guarantee it's mixed
  for (let k = 0; k < 3; k++) shuffle();

  // If it somehow ends up solved, shuffle again
  if (isSolved()) shuffle();

  resetStats();
  winOverlay.hidden = true;
  render();
})();
})();
