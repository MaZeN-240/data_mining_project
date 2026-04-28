// ─── Floating Math / Data-Mining Symbols Background ───

(function () {
  const canvas = document.getElementById('math-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const symbols = [];
  const SYMBOL_POOL = [
    // Greek & math
    'Σ', 'Δ', 'π', '∞', '∫', '√', 'θ', 'μ', 'σ', 'λ', 'α', 'β', 'ε',
    // Operators & relations
    '≈', '≠', '≤', '≥', '∈', '∉', '⊂', '∪', '∩', '→', '⇒', '∀', '∃',
    // Data mining / stats
    'k=3', 'sup', 'conf', 'n!', 'P(A|B)', 'x̄', 'Σxᵢ', 'μ±σ',
    'd(x,y)', 'argmin', 'log₂',
    // Formulas
    '∑f(x)', '∂/∂x', '∇', '⊗',
    // Brackets & matrix
    '[ ]', '{ }', '⟨ ⟩',
    // Numbers
    '0', '1', '01', '10',
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createSymbol() {
    const text = SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
    const size = 12 + Math.random() * 22;
    return {
      text,
      x: Math.random() * W,
      y: Math.random() * H,
      size,
      opacity: 0.03 + Math.random() * 0.08,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.004,
      life: 0,
      maxLife: 600 + Math.random() * 800,
    };
  }

  function init() {
    resize();
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      const s = createSymbol();
      s.life = Math.random() * s.maxLife; // stagger
      symbols.push(s);
    }
  }

  function update() {
    for (let i = symbols.length - 1; i >= 0; i--) {
      const s = symbols[i];
      s.x += s.vx;
      s.y += s.vy;
      s.rotation += s.rotSpeed;
      s.life++;

      // Fade in / out
      const fadeIn = Math.min(s.life / 80, 1);
      const fadeOut = Math.max((s.maxLife - s.life) / 80, 0);
      s.currentOpacity = s.opacity * fadeIn * fadeOut;

      if (s.life >= s.maxLife || s.y < -50 || s.x < -50 || s.x > W + 50) {
        symbols[i] = createSymbol();
        symbols[i].y = H + 20;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const s of symbols) {
      if (s.currentOpacity <= 0) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.font = `${s.size}px "Inter", "SF Pro", monospace`;
      ctx.fillStyle = `rgba(119, 141, 169, ${s.currentOpacity})`;
      ctx.fillText(s.text, 0, 0);
      ctx.restore();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => {
    resize();
  });

  init();
  loop();
})();
