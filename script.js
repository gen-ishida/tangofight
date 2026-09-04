//camelCase
let canvas, ctx, canvasSize;
let QR;

const Qdata = ["星室庁","リズム0","赤の女王仮説","紫外破綻","琥珀の道","黒甜郷","國華","海洋無酸素事変","破局噴火","ソディの6球連鎖","漁火光柱","天網恢々疎にして漏らさず","死喩","ストックホルムの血浴","銃・病原菌・鉄","バッサ・モデネーゼの悪魔たち","冬至の生贄","恐怖の報酬","繧繝","反閇","鋒鋩","恐惶","騏驥驊驑","補陀落渡海","華燭の典","侵食輪廻"];

window.addEventListener('DOMContentLoaded',async e=>{

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  window.addEventListener('resize',()=>{
    resizeCanvas();
  });
  resizeCanvas();

  initDrawer();

  loadGlsl(canvasSize);

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

  for (let i = 0;i < 100000;i++) {
    main();
    await new Promise(r=>requestAnimationFrame(r));
  }
});

const colorPalette = {
  bg: '#222222',
  line: '#888888',
  text: '#eeeeee',
  bg2: '#666666',
  bg3: '#222222',
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

  console.log(seed1,seed2);
  dt = Date.now()/1000 - t0;
  updateGlsl({
    dt,
    scale1:getGridSize(mulv(canvasSize,[1,0.45]),QNow[0]),
    scale2:getGridSize(mulv(canvasSize,[1,0.45]),QNow[1]),
    isbg:0,
    seed1,
    seed2,
  });

  colorPalette.bg2 = colorPalette.line = ctx.createPattern(canvasGlsl,'');

  updateGlsl({
    dt,
    scale1:getGridSize(mulv(canvasSize,[1,0.45]),QNow[0]),
    scale2:getGridSize(mulv(canvasSize,[1,0.45]),QNow[1]),
    isbg:1,
    seed1,
    seed2,
  });

  colorPalette.bg3 = ctx.createPattern(canvasGlsl,'');

  ctx.fillStyle = colorPalette.bg3;
  ctx.fillRect(0,0,...canvasSize);

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

  gyobiFrame();

  mouseLine();
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
  canvasSize = [canvas.width,canvas.height] = [window.innerWidth,window.innerHeight];
}