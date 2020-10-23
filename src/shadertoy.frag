#version 300 es
#ifdef GL_ES
precision highp float;
precision highp int;
precision mediump sampler3D;
#endif
#define HW_PERFORMANCE 1
uniform vec3      iResolution;
uniform float     iTime;
uniform float     iChannelTime[4];
uniform vec4      iMouse;
uniform vec4      iDate;
uniform float     iSampleRate;
uniform vec3      iChannelResolution[4];
uniform int       iFrame;
uniform float     iTimeDelta;
uniform float     iFrameRate;
uniform sampler2D iChannel0;
uniform struct {
    sampler2D sampler;
    vec3  size;
    float time;
    int   loaded;
}iCh0;
uniform sampler2D iChannel1;
uniform struct {
    sampler2D sampler;
    vec3  size;
    float time;
    int   loaded;
}iCh1;
uniform sampler2D iChannel2;
uniform struct {
    sampler2D sampler;
    vec3  size;
    float time;
    int   loaded;
}iCh2;
uniform sampler2D iChannel3;
uniform struct {
    sampler2D sampler;
    vec3  size;
    float time;
    int   loaded;
}iCh3;
void mainImage( out vec4 c,  in vec2 f );
void st_assert( bool cond );
void st_assert( bool cond, int v );
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 col = vec3(0.);

    //Draw a red cross where the mouse button was last down.
    if(abs(iMouse.x-fragCoord.x) < 4.) {
        col = vec3(1.,0.,0.);
    }
    if(abs(iMouse.y-fragCoord.y) < 4.) {
        col = vec3(1.,0.,0.);
    }

    //If the button is currently up, (iMouse.z, iMouse.w) is where the mouse
    //was when the button last went down.
    if(abs(iMouse.z-fragCoord.x) < 2.) {
        col = vec3(0.,0.,1.);
    }
    if(abs(iMouse.w-fragCoord.y) < 2.) {
        col = vec3(0.,0.,1.);
    }

    //If the button is currently down, (-iMouse.z, -iMouse.w) is where
    //the button was when the click occurred.
    if(abs(-iMouse.z-fragCoord.x) < 2.) {
        col = vec3(0.,1.,0.);
    }
    if(abs(-iMouse.w-fragCoord.y) < 2.) {
        col = vec3(0.,1.,0.);
    }

    fragColor = vec4(col, 1.0);
}
out vec4 shadertoy_out_color;

void st_assert(bool cond, int v) { if (!cond){ if (v==0)shadertoy_out_color.x=-1.0;
else if (v==1)shadertoy_out_color.y=-1.0;
else if (v==2)shadertoy_out_color.z=-1.0;
else shadertoy_out_color.w=-1.0;
} }
void st_assert(bool cond) { if (!cond)shadertoy_out_color.x=-1.0;
}
void main(void){ shadertoy_out_color = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
    mainImage(color, gl_FragCoord.xy);
    if (shadertoy_out_color.x<0.0) color=vec4(1.0, 0.0, 0.0, 1.0);
    if (shadertoy_out_color.y<0.0) color=vec4(0.0, 1.0, 0.0, 1.0);
    if (shadertoy_out_color.z<0.0) color=vec4(0.0, 0.0, 1.0, 1.0);
    if (shadertoy_out_color.w<0.0) color=vec4(1.0, 1.0, 0.0, 1.0);
    shadertoy_out_color = vec4(color.xyz, 1.0);
}
