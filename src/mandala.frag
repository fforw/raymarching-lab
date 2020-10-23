precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_mouse;

const float pi = 3.141592653589793;
const float tau = pi * 2.0;
const float hpi = pi * 0.5;

// "ShaderToy Tutorial - Ray Marching Primitives"
// by Martijn Steinrucken aka BigWings/CountFrolic - 2019
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// This shader is part of a tutorial on YouTube
// https://youtu.be/Ff0jJyyiVyw

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5+0.5*(b-a)/k, 0., 1.);
    return mix(b, a, h) - k*h*(1.0-h);
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 ab = b-a;
    vec3 ap = p-a;

    float t = dot(ab, ap) / dot(ab, ab);
    t = clamp(t, 0., 1.);

    vec3 c = a + t*ab;

    return length(p-c)-r;
}

float sdCylinder(vec3 p, vec3 a, vec3 b, float r) {
    vec3 ab = b-a;
    vec3 ap = p-a;

    float t = dot(ab, ap) / dot(ab, ab);
    //t = clamp(t, 0., 1.);

    vec3 c = a + t*ab;

    float x = length(p-c)-r;
    float y = (abs(t-.5)-.5)*length(ab);
    float e = length(max(vec2(x, y), 0.));
    float i = min(max(x, y), 0.);

    return e+i;
}

float sdTorus(vec3 p, vec2 r) {
    float x = length(p.xz)-r.x;
    return length(vec2(x, p.y))-r.y;
}

float dBox(vec3 p, vec3 s) {
    p = abs(p)-s;
    return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}


float GetDist(vec3 p) {

    float t = u_time;

    // ground plane
    float pd = p.y;

    // rotating box
    vec3 bp = p;
    bp -= vec3(0, .75, 3);// translation
    bp.xz *= Rot(u_time);// rotation
    float rotate = dBox(bp, vec3(.75));

    // jumping torus
    float y = -fract(t)*(fract(t)-1.);// repeating parabola
    vec3 tp = p;
    tp -= vec3(-2, .8+3.*y, -4);// translate
    float squash = 1.+smoothstep(.15, .0, y)*.5;// scale
    tp.y *= squash;
    tp = tp.xzy;// flip torus on its side
    float scale = sdTorus(tp, vec2(1, .25))/squash;

    float morph = mix(
    length(p-vec3(4, 1, 2))-1.,
    dBox(p-vec3(4, 1, 2), vec3(1, 1, 1)),
    sin(t)*.5+.5
    );

    float subtract = max(
    -dBox(p-vec3(1.+sin(t)*.5, 1, 0), vec3(1, .5, 2)),
    length(p-vec3(0, 1, 0))-1.
    );

    float intersect = max(
    dBox(p-vec3(sin(u_time)*.5-3., 1, 0), vec3(1, .5, 2)),
    length(p-vec3(-4, 1, 0))-1.
    );

    float blend = smin(
    length(p-vec3(3, 1, -3))-.75,
    length(p-vec3(3.+sin(t), 1.5, -3))-1.,
    0.05
    );

    float d = min(morph, pd);
    d = min(d, subtract);
    d = min(d, intersect);
    d = min(d, rotate);
    d = min(d, scale);
    d = min(d, blend);

    return d;
}

float RayMarch(vec3 ro, vec3 rd) {
    float dO=0.;

    for (int i=0; i<MAX_STEPS; i++) {
        vec3 p = ro + rd*dO;
        float dS = abs(GetDist(p));
        dO += dS;
        if (dO>MAX_DIST || dS<SURF_DIST) break;
    }

    return dO;
}

vec3 GetNormal(vec3 p) {
    float d = GetDist(p);
    vec2 e = vec2(.001, 0);

    vec3 n = d - vec3(
    GetDist(p-e.xyy),
    GetDist(p-e.yxy),
    GetDist(p-e.yyx));

    return normalize(n);
}

float GetLight(vec3 p) {
    vec3 lightPos = vec3(3, 5, 4);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);

    float dif = clamp(dot(n, l)*.5+.5, 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l);

    if (p.y<.01 && d<length(lightPos-p)) dif *= .2;

    return dif;
}

vec3 R(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
    r = normalize(cross(vec3(0, 1, 0), f)),
    u = cross(f, r),
    c = p+f*z,
    i = c + uv.x*r + uv.y*u,
    d = normalize(i-p);
    return d;
}

////////////////////// NOISE

//	Simplex 3D Noise
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}


//////// HSL ////////////////////

float hue2rgb(float f1, float f2, float hue) {
    if (hue < 0.0)
    hue += 1.0;
    else if (hue > 1.0)
    hue -= 1.0;
    float res;
    if ((6.0 * hue) < 1.0)
    res = f1 + (f2 - f1) * 6.0 * hue;
    else if ((2.0 * hue) < 1.0)
    res = f2;
    else if ((3.0 * hue) < 2.0)
    res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    else
    res = f1;
    return res;
}

vec3 hsl2rgb(vec3 hsl) {
    vec3 rgb;

    if (hsl.y == 0.0) {
        rgb = vec3(hsl.z); // Luminance
    } else {
        float f2;

        if (hsl.z < 0.5)
        f2 = hsl.z * (1.0 + hsl.y);
        else
        f2 = hsl.z + hsl.y - hsl.y * hsl.z;

        float f1 = 2.0 * hsl.z - f2;

        rgb.r = hue2rgb(f1, f2, hsl.x + (1.0/3.0));
        rgb.g = hue2rgb(f1, f2, hsl.x);
        rgb.b = hue2rgb(f1, f2, hsl.x - (1.0/3.0));
    }
    return rgb;
}

vec3 hsl2rgb(float h, float s, float l) {
    return hsl2rgb(vec3(h, s, l));
}

void main(void)
{
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 m = u_mouse.xy/u_resolution.xy;

    vec3 col = vec3(0);

    vec3 ro = vec3(0, 4, -5);
    ro.yz *= Rot(-m.y+.5);
    ro.xz *= Rot(u_time*.3-m.x*6.2831);

    vec3 rd = R(uv, ro, vec3(0, 0, 0), .7);

    float d = RayMarch(ro, rd);


    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;

        bool isGround = abs(p.y) < 0.02 || max(abs(p.x), abs(p.z)) > 10.0;

        float dif = GetLight(p) / (d*d);
        col = vec3(dif)* hsl2rgb(
            fract((0.5 + 0.5 * snoise(34.0 + p * 0.82)) * 0.333 + (0.5 + 0.5 * snoise(13.0 + p * 0.061 + (isGround ? 0.0 : u_time * 0.1 ))) + (isGround ? 0.0 : 0.5) ),
            isGround ? 0.4 : 0.9,
            0.5
        );

    }

    col = pow(col, vec3(.25));// gamma correction



    gl_FragColor = vec4(
        col,
        1.0
    );
}
