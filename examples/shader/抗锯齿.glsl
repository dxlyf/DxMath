
const  float SCALE =64.;
const int EVEN_ODD = 0;
const int NON_ZERO = 1;
vec2 projectCoord(vec2 uv,float scale) {
    // Convert from [0,1] to [-1,1]
    return scale*(uv-iResolution.xy*0.5)/min(iResolution.x,iResolution.xy.y) * 2.0;
}

float sdRect(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdCirlce(vec2 p, float r) {
    return length(p) - r;
}
float sdSegment(vec2 p, vec2 a, vec2 b,float width) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h)-width*0.5;
}
int modInt(int a, int b) {
    return a - b * (a / b);
}
bool pointInPolygon(vec2 p, vec2[20] pts,int n,int contour,int fillRule) {
    int inside = 0;
    for(int c=0;c<contour;c++){
          int start=c*n;
          for (int i = start,j=start+n-1; i < (start+n);j=i++) {
            vec2 a = pts[j];
            vec2 b = pts[i];
            if(a.y>p.y!=b.y>p.y&&p.x>=(a.x+(b.x-a.x)*(p.y-a.y)/(b.y-a.y))){
                if(fillRule==NON_ZERO){
                    if(a.y<b.y){
                            inside++;
                    }else{
                            inside--;
                    }
                }else{
                    inside=1-inside;
                }
            }
        }
    }
    if(fillRule==NON_ZERO){
        return inside!=0;
    }else{
        return modInt(inside,2)!=0;
    }

}
vec2 toFixedCoord(vec2 uv) {
    return round(vec2(uv)*SCALE);
}
vec2 toFloat(ivec2 uv) {
     return vec2(uv)/SCALE;
}

vec2 logicCoordToScreen(vec2 uv) {
    return round((uv+0.5)*SCALE);
}
vec2 screenToLogicCoord(vec2 uv) {
    return uv/SCALE;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv =vec2(fragCoord.x,iResolution.y-fragCoord.y)+0.5; //projectCoord(fragCoord,1.);

    float offset=0.;
    float zoom=1.0;
    float gap=float(SCALE);
    vec2 idx=floor(uv/SCALE);

    vec3 col=vec3(0);
    if(mod(uv.y,SCALE/4.)==0.){
        col.rgb=vec3(0.5);
    }
    if(mod(uv.x,SCALE/4.)==0.){
        col.rgb=vec3(0.5);
    }
    if(mod(uv.y,SCALE)==0.){
        col.rgb=vec3(1);
    }
    if(mod(uv.x,SCALE)==0.){
         col.rgb=vec3(1);
    }
    vec2 p0=logicCoordToScreen(vec2(1,5));
    vec2 p1=logicCoordToScreen(vec2(6,5));
    vec2 p2=logicCoordToScreen(vec2(6,1));
    
    float ret=min(sdSegment(uv,p0,p1,2.),sdSegment(uv,p1,p2,2.));
    ret=min(ret,sdSegment(uv,p2,p0,2.));
    if(ret<=0.) {
        col.rgb=vec3(0.5,0.5,1);
    }
    if(sdRect(uv-logicCoordToScreen(vec2(1,5)),vec2(SCALE/2.))<=0.){
            col.r=1.;
    }
    // // 棋盘
    // if(mod(idx.x+idx.y,2.)==0.) {
    //     col.rgb=vec3(1);
    // }
    // maximum thickness is 2m in alpha channel
    fragColor = vec4(col,1);
}