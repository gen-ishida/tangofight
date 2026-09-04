let mousePoints = [], isMouseDown = false;
function initDrawer() {
  viewCanvas.addEventListener('touchstart', e => {
    isMouseDown = true;
  });
  viewCanvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isMouseDown) {
      return;
    }
    mousePoints.push([e.touches[0].clientX, e.touches[0].clientY]);
  });
  viewCanvas.addEventListener('touchend', e => {
    isMouseDown = false;
    const circleSize = Math.abs(GaussGreen(mousePoints))/(canvasSize[0]*canvasSize[1]);
    if (circleSize > 0.02) {
      const center = divv(ave(mousePoints),canvasSize);
      if (center[1] < 0.4) {
        updateQ(QNow[0]);
      }
      if (center[1] > 0.6) {
        updateQ(QNow[1]);
      }
    }
    mousePoints = [];
  });
}

function updateQ(Q) {
  if (getHistory().length > 1000) {
    alert('遊びすぎ！スマホ見てる暇あったら文学部に来い');
    return;
  }
  addHistory(Q);
  t0 = Date.now()/1000;
  QNow = QTable.next().value;
  seed1 = Math.random();
  seed2 = Math.random();
}

function mouseLine() {

  if (mousePoints.length) {
    for (let i = 0; i < mousePoints.length-1; i++) {
      //!!!謎バグ
      if (i <= 1) {
        continue;
      }
      ctx.lineCap = 'round';
      const color = 0.96**(mousePoints.length-i);
      ctx.strokeStyle = `hsl(${mix(200,80,color)},${mix(45,75,color)}%,${mix(80,80,color)}%)`;
      ctx.lineWidth = canvasSize[1]*0.02*(0.4+0.6*color);
      ctx.beginPath();
      ctx.moveTo(...mousePoints[i]);
      ctx.lineTo(...mousePoints[i+1]);
      ctx.stroke();
    }
  }
}


function wordFrame(topLeft,frameSize,text,seed) {

  camera = [10*(Math.floor(dt)+gain(dt%1,3)),0];
  ctx.save();

  ctx.beginPath();
  ctx.rect(...topLeft,...frameSize);
  ctx.clip();

  ctx.translate(...add(topLeft,divs(frameSize,2)));

  //!text=""の際にバグ発生
  const gridSize = getGridSize(frameSize,text),
    rowLength = Math.min(text.length,Math.ceil(frameSize[0]/gridSize/1.5));
  ctx.scale(gridSize,gridSize);


  /*!!!後できれいに文字列おこす方法を模索する
    'ソディの6球連鎖';
  {
    const segmenterWord = new Intl.Segmenter("ja", { granularity: "word" }),
      segmenterGrapheme = new Intl.Segmenter("ja", { granularity: "grapheme" });
    console.log(
      [...segmenterWord.segment("バッサ・モデネーゼの悪魔たち")]
      .map(({segment})=>
        [...segmenterGrapheme.segment(segment)]
          .map(({segment})=>segment)));
  }*/

  blocktext(
    (text
      .slice(0,Math.floor(dt*text.length))
      .match(new RegExp(`.{1,${rowLength}}`,'g'))??[])
      .map(v=>v.split('')),
    rowLength,
    [0,0],
    1
  );
  ctx.restore();
}

function gyobiFrame() {
  ctx.fillStyle = colorPalette.bg;
  ctx.fillRect(...mulv(canvasSize,[0,0.45]),...mulv(canvasSize,[1,0.1]));
  ctx.strokeStyle = colorPalette.bg2;
  ctx.lineWidth = canvasSize[1]*0.003;
  const padding = muls([1,1],0.012*canvasSize[1]);
  ctx.strokeRect(...add(mulv(canvasSize,[0,0.45]),padding),...sub(mulv(canvasSize,[1,0.1]),muls(padding,2)));

  const gyobiVertex1 = [[0,1],[0.6,1],[0.2,0],[0.6,-1],[0,-1]],
    gyobiVertex2 = [[0.7,1],[0.3,0],[0.7,-1],[0.8,-1],[0.4,0],[0.8,1]];

  ctx.fillStyle = colorPalette.bg2;

  ctx.save();
  ctx.translate(...mulv(canvasSize,[0.2,0.5]))
  ctx.beginPath();
  for (let v of gyobiVertex1) {
    ctx.lineTo(...muls(v,canvasSize[1]*0.03));
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  for (let v of gyobiVertex2) {
    ctx.lineTo(...muls(v,canvasSize[1]*0.03));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(...mulv(canvasSize,[0.8,0.5]))
  ctx.beginPath();
  for (let v of gyobiVertex1) {
    ctx.lineTo(...muls(mulv(v,[-1,1]),canvasSize[1]*0.03));
  }
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  for (let v of gyobiVertex2) {
    ctx.lineTo(...muls(mulv(v,[-1,1]),canvasSize[1]*0.03));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = colorPalette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${canvasSize[1]*0.06}px serif`;
  ctx.fillText('VS',...muls(canvasSize,0.5));
}

function blocktext(text,rowLength,center,size) {
  for (let [row,rowText] of text.entries())
  for (let [col,character] of rowText.entries()) {
    const coord = add(center,muls([-rowLength/2+col, -text.length/2+row],size));

    grid(coord,size,'normal');

    ctx.fillStyle = colorPalette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${size*0.8}px serif`;
    ctx.fillText(character,...add(coord,[size/2,size/2]));
  }
}

function hash(p) {
  return ((Math.sin(dot(p, [12.9898, 78.233]))+1) * 43758.5453123)%1;
}

function grid(coord,size) {
  ctx.fillStyle = colorPalette.bg;
  ctx.fillRect(...coord,...[size,size]);

  ctx.strokeStyle = colorPalette.bg2;
  ctx.setLineDash([]);
  ctx.lineWidth = size*0.02;
  ctx.strokeRect(...coord,...[size,size]);

  ctx.strokeStyle = colorPalette.bg2;
  ctx.setLineDash([size*0.05]);
  ctx.lineWidth = size*0.015;

  ctx.beginPath();
  ctx.moveTo(...add(coord,[size/2,0]));
  ctx.lineTo(...add(coord,[size/2,size]));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(...add(coord,[0,size/2]));
  ctx.lineTo(...add(coord,[size,size/2]));
  ctx.stroke();
}

//from iq
function gain(x,k) {
    const a = 0.5*(2.0*((x<0.5)?x:1.0-x))**k;
    return (x<0.5)?a:1.0-a;
}

//別にあんまガウスグリーンではない。
const GaussGreen = arr => {
  let res = 0;
  for (let i = 0; i < arr.length-1; i++) {
    const p0 = sub(arr[i],arr[0]), p1 = sub(arr[i+1],arr[0]);
    res += p0[0]*p1[1]-p0[1]*p1[0];
  }
  return res/2;
}

const muls = ([x,y], c) => [x*c,y*c],
  divs = ([x,y], c) => [x/c,y/c],
  mulv = ([ax,ay], [bx,by]) => [ax*bx,ay*by],
  divv = ([ax,ay], [bx,by]) => [ax/bx,ay/by],
  add = ([ax,ay], [bx,by]) => [ax+bx,ay+by],
  sub = ([ax,ay], [bx,by]) => [ax-bx,ay-by],
  dot = ([ax,ay], [bx,by]) => ax*bx + ay*by,
  len = ([x,y]) => Math.sqrt(x*x+y*y),
  dist = (a,b) => len(sub(a,b)),
  sum = arr => arr.reduce((a,c)=>add(a,c),[0,0]),
  ave = arr => divs(sum(arr), arr.length);

const mix = (x,y,a) => (1-a)*x+a*y;