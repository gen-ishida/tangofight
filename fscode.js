const fsCode = `
#define repeatNum 3.
float max2(vec2 v) {return max(v.x,v.y);}
float min2(vec2 v) {return min(v.x,v.y);}
vec4 blend(vec4 base, vec4 blend) {return mix(base, blend, blend.a);}


mat2 R(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}

float tanh01(float x) {return (1.+tanh(x))/2.;}

//from https://iquilezles.org/articles/functions/
float gain( float x, float k ) {
    float a = 0.5*pow(2.0*((x<0.5)?x:1.0-x), k);
    return (x<0.5)?a:1.0-a;
}

//from https://mini.gmshaders.com/p/dot-noise
float dot_noise(vec3 p) {
    //The golden ratio:
    //https://mini.gmshaders.com/p/phi
    const float PHI = 1.618033988;

    //Rotating the golden angle on the vec3(1, phi, phi*phi) axis
    const mat3 GOLD = mat3(
    -0.571464913, +0.814921382, +0.096597072,
    -0.278044873, -0.303026659, +0.911518454,
    +0.772087367, +0.494042493, +0.399753815);

    //Gyroid with irrational orientations and scales
    return dot(cos(GOLD * p), sin(PHI * p * GOLD));
    //Ranges from [-3 to +3]
}

vec3 colorPalette(float x) {
    return 1.-vec3(cos(3.*x),cos(1.5*x),cos(5.*x));
}

//from https://thebookofshaders.com/13/
#define OCTAVES 4
float fbm(in vec3 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * dot_noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

float hash31(vec3 p3) {
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

//適当に解析的AA px:1pxのこっちから見た長さ
float white(vec2 p,float px) {
    float width = 0.03;
    return min(
        min(1.,width/px),
        max(0.,(max2(abs(fract(p)-.5))-.5+(width+px)*.5)/px)
    );
}

float black(vec2 p,float px) {
    return 1.;
}

float normal(vec2 p,float px) {
    return max(
        white(p,px),
        min(
            white(p+.5,px),
            min(
                min(1.,.25/px),
                max(0.,(max2(abs(fract(p*8.+.5)-.5))-.25+px*.5)/px)
            )
        ));
}

float planeAlpha0(vec2 p,float i,float px,vec2 q) {
    return sat((-max2(abs(fract(p)-q-0.5))+.5)/px+.5)*
        step(1.-pow(2.,-i), hash31(vec3(floor(p+q),i)));
}

float planeAlpha(vec2 p,float i,float px) {
    return planeAlpha0(p,i,px,vec2(0,0))
        +planeAlpha0(p,i,px,vec2(1,0))
        +planeAlpha0(p,i,px,vec2(-1,0))
        +planeAlpha0(p,i,px,vec2(0,1))
        +planeAlpha0(p,i,px,vec2(0,-1));
}

float noise(vec2 uv,float t) {
    return tanh01(
        fbm(
            4.*vec3(uv*.1+t*.1,0.)
            +4.*vec3(fbm(4.*vec3(uv*.1,t*.01)),fbm(4.*vec3(uv*.1,2)),t*.01)));
}

vec4 plane(vec2 uv,float i,float px) {
    float a = hash31(vec3(floor(uv),0));
	float b = (
        a<.1
            ? black(uv,px)
        : a<.7
            ? normal(uv,px)
            : white(uv,px)
        );
    vec4 c = vec4(
        mix(vec3(0.13),colorPalette(noise(uv,t)),b),
        planeAlpha(uv,i,px)
    );
    return c;
}



vec4 bg(vec2 uv,float px0) {
    vec4 o = vec4(0);

    vec2 uv0 = uv*px0;
    vec2 m0 = (mouse*2.-resolution)*px0;
    o = vec4(0);

    vec2 center = vec2(10.*(floor(t)+gain(fract(t),3.)),0);

    vec2 uv1 = vec2(0);
    float px1 = 1.;
    for (float i=0.;i<repeatNum;i++) {
        px1 = px0*pow(2.,repeatNum-i);
        uv1 = center+uv*px1;
        o = blend(o,plane(uv1,i,px1));
    }
    o.a = 1.;
    return o;
}

void main() {
    vec2 uv = gl_FragCoord.xy;

    if(isbg > .5) {
        vec2 uv0 = 
            uv.y > 0.55*resolution.y
            ? uv-resolution*vec2(.5,(0.55+1.0)*.5)
            : uv.y < 0.45*resolution.y
            ? uv-resolution*vec2(.5,(0.45)*.5)
            : vec2(0);
        float px0 = 
            uv.y > 0.55*resolution.y
            ? 1./scale1
            : uv.y < 0.45*resolution.y
            ? 1./scale2
            : 1.;

        o = bg(uv0,px0);

    } else {
        o = vec4(colorPalette(noise(uv*4./min(resolution.x,resolution.y),t)),1.);
    }
}
`
