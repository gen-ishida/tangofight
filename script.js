//camelCase
let viewCanvas, viewCtx, canvas, ctx, canvasSize = [0,0];
let QR;

window.addEventListener('DOMContentLoaded',async e=>{

  viewCanvas = document.getElementById('canvas');
  viewCtx = viewCanvas.getContext('2d');
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  canvasGlsl = document.createElement('canvas');

  loadGlsl(canvasSize);
  window.addEventListener('resize',()=>{
    resizeCanvas();
  });
  resizeCanvas();


  initDrawer();

  if (localStorage.getItem(location.href+'/history') === null) {
    clearHistory();
  }

  document.getElementById('clear-history')
    .addEventListener('click',()=>{
      clearHistory();
    });

  QR = new QRCode('QR', {
    text: localStorage.getItem(location.href+'/history'),
    width: 1024,
    height: 1024,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.L
  });
  for (;;) {
    main();
    await new Promise(r=>requestAnimationFrame(r));
  }
});

const colorPalette = {
  bg: '#222222',
  text: '#eeeeee',
  bg2: '#666666',
}

const choose = arr => arr[Math.floor(Math.random()*arr.length)];

const QTable = (function*() {
  for (;;) {
    const y = [choose(Qdata),choose(Qdata)];
    if (y[0] !== y[1]) {
      yield y;
    }
  }
})();

let QNow = QTable.next().value;

let t0 = Date.now()/1000;
let dt = 0;
let seed1 = Math.random(),
  seed2 = Math.random();
function main() {
  ctx.clearRect(0,0,...canvasSize);

  dt = Date.now()/1000 - t0;
  updateGlsl({
    dt,
    scale1:getGridSize(mulv(canvasSize,[1,0.45]),QNow[0]),
    scale2:getGridSize(mulv(canvasSize,[1,0.45]),QNow[1]),
    isbg:1,
    seed1,
    seed2,
  });

  ctx.fillRect(0,0,...canvasSize);
  ctx.drawImage(canvasGlsl, 0, 0);

  ctx.fillStyle = colorPalette.bg3;

  wordFrame(
    [0,0],
    mulv(canvasSize,[1,0.45]),
    QNow[0],
    0
  );

  wordFrame(
    [0,canvasSize[1]*(1-0.45)],
    mulv(canvasSize,[1,0.45]),
    QNow[1],
    0.01
  );
//  ctx.globalCompositeOperation = 'xor';
  gyobiFrame();
//  ctx.globalCompositeOperation = 'source-over';

  mouseLine();

  viewCtx.drawImage(canvas,0,0);
}


function addHistory(data) {
  const item = JSON.stringify([...JSON.parse(getHistory()),data]);
  localStorage.setItem(location.href+'/history', item);
  QR.makeCode(item);
}

function clearHistory() {
  localStorage.setItem(location.href+'/history', '[]');
  QR.makeCode(getHistory());
}

function getHistory() {
  return localStorage.getItem(location.href+'/history');
}

function getGridSize(frameSize,text) {
  return Math.sqrt(frameSize[0]*frameSize[1]/text.length/5);
}


function resizeCanvas() {
  viewCanvas.style.display = 'none';
  requestAnimationFrame(()=>{
    canvasSize
      = [canvas.width,canvas.height]
      = [viewCanvas.width,viewCanvas.height]
      = [canvasGlsl.width,canvasGlsl.height]
      = [window.innerWidth,window.innerHeight];
    gl.viewport(0, 0, ...canvasSize);
    viewCanvas.style.display = 'block';
  });
}
