let canvasGlsl,gl;

const uniform = t => t.u([
  t.p('t',t.f()),
  t.p('resolution',t.f(2)),
  t.p('mouse',t.f(2)),
  t.p('scale1',t.f()),
  t.p('scale2',t.f()),
  t.p('isbg',t.f()),
]);

function jsData(time,resolution,mouse,scale1,scale2,isbg) {
  return {
    t:time,
    resolution,
    mouse,
    scale1,
    scale2,
    isbg,
  };
}


let program,uniformTypes,uniformLocation,tex;
function loadGlsl(canvasSize) {
  uniformTypes = execUniform(uniform(t));

  canvasGlsl = document.createElement('canvas');
  [canvasGlsl.width,canvasGlsl.height] = canvasSize;

  gl = canvasGlsl.getContext('webgl2',{preserveDrawingBuffer:true});
  gl.clearColor(0,0,0,1);

  program = createProgram(
    createVS('#version 300 es\nin vec3 p;void main(){gl_Position=vec4(p,1);}'),
    createFS(glslHeader(uniform(t))+fsCode)
  );

  createAttrib(program,'p',createVBO([[-1, 1, 0],[-1,-1, 0],[1,-1, 0],[1, 1, 0]].flat()),{size:3});

  uniformLocation = getUniformLocation(uniformTypes);


  ///////////////////////////////////
  //// ここ作業中！！！
  ///////////////////////////////////
  /*
  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  //        gl.bindTexture(gl.TEXTURE_2D, texture);
  //        gl.uniform1i(uniLocation[1], 0);*/
};

function updateGlsl({dt,scale1,scale2,isbg}) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  const uniformData = jsData(dt,canvasSize,[0,0],scale1,scale2,isbg);
  sendData(uniformTypes,uniformLocation,uniformData);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  gl.flush();

  //window.requestAnimationFrame(draw);
}

const sat = x => Math.max(0,Math.min(1,x));

const rgb = ([h,s,v]) => [0,2,1].map(w=>((sat(Math.abs((h+w/3.)%1*6-3)-1)-1)*s+1)*v);

const range = (n) => Array(n).keys().toArray();

const t = {
  PRIMITIVE:'prim',
  STRUCT:'str',
  ARRAY:'arr',
  PROPERTY:'prop',
  UNIFORM:'unif',
  f(dim=NaN){
    return isNaN(dim)
      ? {type:t.PRIMITIVE,val:{name:'float',method:'uniform1f'}}
      : {type:t.PRIMITIVE,val:{name:'vec'+dim,method:`uniform${dim}fv`}}
  },
  s(prop){return {type:t.STRUCT,prop}},
  u(prop){return {type:t.UNIFORM,prop}},
  a(len,elm){return {type:t.ARRAY,elm,len}},
  p(name,val){return {type:t.PROPERTY,name,val}},
}

//headerの自動生成 このレベルのサイトでは不要だと思う
function glslHeader(node) {
  const structs = [];

  function headerSub(node) {
    switch(node.type) {
      case t.PROPERTY:
        if (node.val.type===t.ARRAY) {
          return `${headerSub(node.val.elm)} ${node.name}[${node.val.len}];`;
        } else {
          return `${headerSub(node.val)} ${node.name};`;
        }
      case t.STRUCT:
        const id = structs.length;
        structs.push(`struct s${id}{${node.prop.map(v=>headerSub(v)).join('')}};`);
        return `s${id}`;
      case t.UNIFORM:
        return node.prop.map(v=>`uniform ${headerSub(v)}`).join('\n');
      case t.PRIMITIVE:
        return node.val.name;
      case t.ARRAY:
      default:throw new Error('! at glslHeader');
    }
  }

  const header = headerSub(node);
  return `#version 300 es\nprecision mediump float;\n#define sat(x) clamp(x,0.,1.)\n#define tau 6.28318530718\n${structs.join('\n')}\n${header}\nout vec4 o;\n`;
}

function execUniform(v) {
  function expand(v) {
    switch(v.type) {
      case t.PROPERTY:
        return expand(v.val).flatMap(w=>[[v.name,...w]]);
      case t.ARRAY:
        return [...Array(v.len).keys()].flatMap(i=>
          expand(v.elm).flatMap(j=>
            [[i,...j]]));
      case t.STRUCT:
        return v.prop.flatMap(i => expand(i));
      case t.UNIFORM:
        return v.prop.flatMap(i => expand(i));
      case t.PRIMITIVE:
        return [[v.val]];
      default:throw new Error('! at expand');
    }
  }
  return expand(v).map(exp=>({
      query:exp.slice(0,-1),
      valType:exp.at(-1),
    }));
}

function getUniformLocation(types) {
  return types.map(({query}) => {
    const path = query.map((v,i)=>typeof v === 'number'? `[${v}]` : i === 0 ? v : `.${v}`).join('');
    return gl.getUniformLocation(program,path);
  });
}

function sendData(uniformTypes,uniformLocation,uniformData) {
  uniformTypes.forEach(({query,valType},i) => {
    let data = uniformData;
    for (let q of query) {
      data = data[q];
    }
    gl[valType.method](uniformLocation[i],data);
  });
}



function createProgram(vs,fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);
  return program;
}

function createVS(code) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, code);
  gl.compileShader(vs);
  const info = gl.getShaderInfoLog(vs);
  if (info) throw new Error(info);
  return vs;
}

function createFS(code) {
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, code);
  gl.compileShader(fs);
  const info = gl.getShaderInfoLog(fs);
  if (info) throw new Error(info);
  return fs;
}

function createAttrib(program,name,vbo,param) {
  const location = gl.getAttribLocation(program, name);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, param.size ?? 1, param.type ?? gl.FLOAT, param.normalized ?? false, param.stride ?? 0, param.offset ?? 0);
  return location;
}

function createVBO(data) {
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return vbo;
}

function createIBO(data) {
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return ibo;
}
