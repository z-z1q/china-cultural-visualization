function initInkBackground() {
  var canvas = document.getElementById("ink-canvas");
  if (!canvas) return;
  if (canvas.dataset && canvas.dataset.inkInit === "1") return;
  if (canvas.dataset) canvas.dataset.inkInit = "1";

  var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) return;

  var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  var w = 0;
  var h = 0;

  var off = document.createElement("canvas");
  var offCtx = off.getContext("2d", { alpha: true });

  var blobs = [];
  var last = 0;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.floor(rect.width));
    h = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    off.width = Math.floor(w * dpr);
    off.height = Math.floor(h * dpr);
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    offCtx.clearRect(0, 0, w, h);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBlob() {
    var edge = Math.floor(Math.random() * 4);
    var x = edge === 0 ? rand(0, w) : edge === 1 ? w + rand(0, w * 0.15) : edge === 2 ? rand(0, w) : -rand(0, w * 0.15);
    var y = edge === 0 ? -rand(0, h * 0.15) : edge === 1 ? rand(0, h) : edge === 2 ? h + rand(0, h * 0.15) : rand(0, h);
    var r = rand(22, 78);
    var vx = rand(-0.16, 0.16);
    var vy = rand(-0.16, 0.16);
    var life = rand(4200, 9800);
    var born = performance.now();

    var ink = Math.random() < 0.6 ? 16 : 28;
    blobs.push({ x: x, y: y, r: r, vx: vx, vy: vy, life: life, born: born, ink: ink, jitter: rand(0.3, 1.4) });
  }

  function drawBlob(b, t) {
    var age = t - b.born;
    var p = Math.min(1, age / b.life);
    var fade = 1 - p;

    var rr = b.r * (0.75 + p * 1.35);
    var alpha = 0.04 * fade;
    var ink = b.ink;

    var gx = b.x + Math.sin((t * 0.001 + b.x) * 0.7) * b.jitter;
    var gy = b.y + Math.cos((t * 0.0012 + b.y) * 0.7) * b.jitter;

    offCtx.save();
    offCtx.globalCompositeOperation = "source-over";
    offCtx.fillStyle = "rgba(" + ink + "," + ink + "," + ink + "," + alpha + ")";

    for (var i = 0; i < 6; i++) {
      var a = rand(0, Math.PI * 2);
      var pr = rr * rand(0.35, 1.1);
      var px = gx + Math.cos(a) * rr * rand(0.05, 0.38);
      var py = gy + Math.sin(a) * rr * rand(0.05, 0.38);
      offCtx.beginPath();
      offCtx.arc(px, py, pr, 0, Math.PI * 2);
      offCtx.fill();
    }
    offCtx.restore();
  }

  function composite() {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(15,18,20,0.16)";
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(18px) contrast(1.06)";
    ctx.drawImage(off, 0, 0, w, h);

    ctx.globalCompositeOperation = "multiply";
    ctx.filter = "blur(0px)";
    ctx.drawImage(off, 0, 0, w, h);

    ctx.restore();
  }

  function tick(t) {
    if (!document.body.contains(canvas)) return;
    if (!last) last = t;
    var dt = Math.min(64, t - last);
    last = t;

    if (blobs.length < 18 && Math.random() < 0.18) spawnBlob();
    if (Math.random() < 0.045) spawnBlob();

    offCtx.save();
    offCtx.globalCompositeOperation = "source-over";
    offCtx.fillStyle = "rgba(0,0,0,0.03)";
    offCtx.fillRect(0, 0, w, h);
    offCtx.restore();

    for (var i = blobs.length - 1; i >= 0; i--) {
      var b = blobs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      drawBlob(b, t);
      if (t - b.born > b.life) blobs.splice(i, 1);
    }

    composite();
    requestAnimationFrame(tick);
  }

  resize();
  for (var i = 0; i < 10; i++) spawnBlob();

  var ro = new ResizeObserver(function () {
    resize();
  });
  ro.observe(canvas);

  requestAnimationFrame(tick);
}

function bindInkWhenAvailable() {
  function tryInit() {
    initInkBackground();
  }
  tryInit();
  if (document.body) {
    var mo = new MutationObserver(function () {
      tryInit();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
}

document.addEventListener("DOMContentLoaded", bindInkWhenAvailable);
bindInkWhenAvailable();
