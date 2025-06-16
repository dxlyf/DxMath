
const  float SCALE =32.;
const float SUB_SCALE = SCALE/4.;
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
    return round((uv)*SCALE);
}
vec2 screenToLogicCoord(vec2 uv) {
    return uv/SCALE;
}
float fillSubGrid(vec2 uv){
    return sdRect(uv,vec2(0.5));
}
float fillGrid(vec2 uv){
    return sdRect(uv,vec2(.5));
}
vec3 blend(vec3 src,vec3 dst,float a) {
    return src*a+(1.-a)*dst;
}
struct Edge{
    float y0,y1;
    float x;
    float dy;
    float invertSlope;
    float winding;
    bool  hasActive;
};



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv =vec2(fragCoord.x,iResolution.y-fragCoord.y)+0.5; //projectCoord(fragCoord,1.);

    float offset=0.;
    float zoom=1.0;
    float gap=float(SCALE);
    vec2 fuv=uv/SCALE;

    vec2 id=floor(uv/SCALE);
    vec2 fd=fract(uv/SCALE);
    vec2 rd=mod(floor(uv),SCALE);
    vec2 subIdx=floor(uv/SUB_SCALE);

    vec3 col=vec3(0,0,0);
    if(mod(uv.y,SUB_SCALE)==0.){
        col.rgb=vec3(0.5);
    }
    if(mod(uv.x,SUB_SCALE)==0.){
        col.rgb=vec3(0.5);
    }
    if(mod(uv.y,SCALE)==0.){
        col.rgb=vec3(1);
    }
    if(mod(uv.x,SCALE)==0.){
         col.rgb=vec3(1);
    }
    if(sdCirlce(fd-0.5,0.05)<=0.){
       // col.r=1.;
    }
 
    vec2 p0=(vec2(8,1));
    vec2 p1=(vec2(15,10));
    vec2 p2=(vec2(3,10));
  
    vec2 sp0=logicCoordToScreen(p0);
    vec2 sp1=logicCoordToScreen(p1);
    vec2 sp2=logicCoordToScreen(p2);


    

    vec2 pts[20];
    pts[0]=sp0;
    pts[1]=sp1;
    pts[2]=sp2;

 
   float ret=min(sdSegment(uv,sp0,sp1,2.),sdSegment(uv,sp1,sp2,2.));
    ret=min(ret,sdSegment(uv,sp2,sp0,2.));
    if(ret<=0.) {
        col.rgb=vec3(0.5,0.5,1);
    }

    Edge edges[3];
    
    for(int i=0,j=2;i<3;j=i++){
          vec2 sp0=pts[j];
          vec2 sp1=pts[i];
          edges[i].y0=min(sp0.y,sp1.y);
          edges[i].y1=max(sp0.y,sp1.y);
          edges[i].dy=sp1.y-sp0.y;
          edges[i].x=sp0.y<sp1.y?sp0.x:sp1.x;
          edges[i].invertSlope=(sp1.x-sp0.x)/(sp1.y-sp0.y);
          edges[i].hasActive=false; 

    }
    Edge activeEdge[3];
    // 扫描线填充
    for(int i=0;i<3;i++){
        Edge edge=edges[i];
        if(edge.dy!=0.){
            if(edge.y0<=uv.y&&edge.y1>=uv.y){
                activeEdge[i].hasActive=true;
                activeEdge[i].x=edge.invertSlope*(uv.y-edge.y0)+edge.x;
            }

        }
    }
    float coverage=0.;
    for(int i=1;i<2;i++){
        Edge edge=activeEdge[i-1];
        Edge edge2=activeEdge[i];
        if(edge.hasActive&&edge2.hasActive){
            
        }
    }


    // 超采样
//    float coverage=0.;
//    for(float y=0.;y<2.;y++){
//         for(float x=0.;x<2.;x++){
//             float tx=x/2.+0.25;
//             float ty=y/2.+0.25;
//             vec2 p=idx+vec2(tx,ty);
//             if(sdCirlce(fuv-p,0.05)<=0.){
//                 col.rgb=vec3(1,0,0);
//             }
//             if(pointInPolygon(p,pts,3,1,EVEN_ODD)){
//                 coverage++;
//             }
//         }
//     }

    // if(coverage>0.){
    //     col.rgb=blend(vec3(0,0,1),vec3(0,0,0),coverage/4.);
    // }   
 
    // if(pointInPolygon(idx+0.5,pts,3,1,EVEN_ODD)){
    //     col.b=1.;
    // }



    // // 棋盘
    // if(mod(idx.x+idx.y,2.)==0.) {
    //     col.rgb=vec3(1);
    // }
    // maximum thickness is 2m in alpha channel
    fragColor = vec4(col,1);
}