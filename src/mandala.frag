precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_mouse;

const float pi = 3.141592653589793;
const float tau = pi * 2.0;
const float hpi = pi * 0.5;
const float phi = (1.0+sqrt(5.0))/2.0;

// "ShaderToy Tutorial - Ray Marching Primitives"
// by Martijn Steinrucken aka BigWings/CountFrolic - 2019
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// This shader is part of a tutorial on YouTube
// https://youtu.be/Ff0jJyyiVyw

#define MAX_STEPS 100
#define MAX_DIST 1000.
#define SURF_DIST .001

float snoise(vec3 v);

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

float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdTorus(vec3 p, vec2 r) {
    float x = length(p.xz)-r.x;
    return length(vec2(x, p.y))-r.y;
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}


float dBox(vec3 p, vec3 s) {
    p = abs(p)-s;
    return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}

vec2 minId(vec2 curr, float d, float id)
{
    if (d < curr.x)
    {
        curr.x = d;
        curr.y = id;
    }

    return curr;
}

vec2 sminId(vec2 curr, float d, float id)
{
    if (d < curr.x)
    {
        curr.x = smin(curr.x, d, 0.5);
        curr.y = id;
    }

    return curr;
}

float displacement(vec3 p)
{
    return 1.0 + snoise(p);
}

float onion( in float d, in float h )
{
    return abs(d)-h;
}

vec2 GetDist(vec3 p) {

    float t = u_time;

    // ground plane
    float pd = p.y;

    vec2 result = vec2(1e6, 0);

    vec3 tBox = vec3(2,1,2);
    vec3 pBox = p - tBox;// translate

    vec3 c = vec3(3.0, 4.0, 3.0);
    vec3 q = mod(pBox+0.5*c,c)-0.5*c;
    float rotate = sdRoundBox(q, vec3(0.8), 0.25);

    result = minId(result, rotate, 2.0);

    float r = 6.5 + sin(u_time * 0.5) * 3.5;
    float sphere = sdSphere(p, r);

    float onion = onion(onion(onion(onion(sphere, 3.2), 1.6), 0.8), 0.4);

    result.y = 0.5 + snoise(floor((pBox + c * 0.5)/c)) * 0.5;

    if (-onion > result.x)
    {
        result.x = -onion;
        result.y = -result.y;
    }


    //result = minId(result, pd, 1.0);
    //result = minId(result, sphere, 3.0);



    return result;
}


vec2 RayMarch(vec3 ro, vec3 rd) {


    float dO=0.;
    float id = 0.0;

    for (int i=0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd*dO;
        vec2 result = GetDist(p);
        float dS = abs(result.x);
        dO += dS;
        id = result.y;
        if ( dO > MAX_DIST || dS < SURF_DIST)
            break;
    }

    return vec2(dO, id);
}

vec3 GetNormal(vec3 p) {
    float d = GetDist(p).x;
    vec2 e = vec2(.001, 0);

    vec3 n = d - vec3(
        GetDist(p-e.xyy).x,
        GetDist(p-e.yxy).x,
        GetDist(p-e.yyx).x
    );

    return normalize(n);
}

float GetLight(vec3 p) {
    vec3 lightPos = vec3(3, 5, 4);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);

    float dif = clamp(dot(n, l)*.5+.5, 0., 1.);
    float d = RayMarch(p+n*SURF_DIST*2., l).x;

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

    vec3 rd = R(uv, ro, vec3(0, 0, 0), 0.5);

    vec2 result = RayMarch(ro, rd);

    float d = result.x;

    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        float dif = GetLight(p) / (d*d);

        vec3 tone = hsl2rgb(
            fract(abs(result.y) + (result.y > 0.0 ? 0.5 : 0.0)),
            result.y > 0.0 ? 1.0 : 0.5,
            result.y > 0.0 ? 0.55 : 0.02
        );

        tone.x = clamp(tone.x * 2.0, 0.0, 1.0);

        col = vec3(dif)* tone;

    }

    col = pow(col, vec3(.25));// gamma correction



    gl_FragColor = vec4(
        col,
        1.0
    );
}
