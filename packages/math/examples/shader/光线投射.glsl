
#define PI 3.141592653589793
const  float SCALE =32.;
const float SUB_SCALE = SCALE/4.;
const int EVEN_ODD = 0;
const int NON_ZERO = 1;
uniform vec2   mouse;
vec2 projectCoord(vec2 uv,float scale) {
    // Convert from [0,1] to [-1,1]
    return scale*(uv-iResolution.xy*0.5)/min(iResolution.x,iResolution.xy.y) * 2.0;
}

float sdRect(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdRect(vec2 p,vec2 leftTop, vec2 size) {
    vec2 b=size*0.5;
    return sdRect(p-leftTop-b,b);
}
float sdCircle(vec2 p, float r) {
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
float atan2(float y,float x){
    vec2 v=normalize(vec2(x,y));
    float _cos=dot(v,vec2(1,0));
    float theta=acos(_cos);
    return y>0.?theta:-theta;
}
struct Edge{
    float y0,y1;
    float x;
    float dy;
    float invertSlope;
    float winding;
    bool  hasActive;
};

struct Map{
    int[10] cells;
};
vec2 player=vec2(85,175);
float angle=-90.;
float theta=0.;
Map[10] map;
float speed=2.;
 float rows=10.;float cols=10.;float size=20.;

void drawGrid(out vec4 fragColor,vec2 uv){
    vec2 coord=uv;
    vec4 viewport=vec4(iResolution.x-200.,iResolution.y-300.,200,200);
    vec2 origin=vec2(viewport.x,viewport.y);
    uv=uv-origin;
   
    float x=(1.-mouse.y)*iResolution.y-origin.y;
   
    vec2 vec_m=normalize((vec2(mouse.x,1.-mouse.y)*iResolution.xy-origin)-player);
     theta=atan(vec_m.y,vec_m.x);

    vec2 dir=vec2(cos(theta),sin(theta));
    if(iMouseButton.x==1.){
        player+=dir*float(iFrame%500)*0.2;

    }
  
    vec2 iuv=floor(uv);
    vec2 fmap=uv/size;
    vec2 imap=floor(fmap);
    vec2 omap=fract(fmap);

    if(sdRect(uv,vec2(0),viewport.zw)<0.){
        fragColor.rgb=vec3(1);

        if(mod(iuv.x,size)==0.){
            fragColor.rgb=vec3(0);
        }
        else if(mod(iuv.y,size)==0.){
            fragColor.rgb=vec3(0);
        }
        if(map[int(imap.y)].cells[int(imap.x)]==1){
            fragColor.rgb=vec3(0);
        }
        if(sdSegment(uv,player,player+dir*300.,1.)<0.){
             fragColor.rgb=vec3(0,0,1);

            
        }
        if(sdCircle(uv-player,5.)<0.){
             fragColor.rgb=vec3(0,0,0);
        }
        if(sdSegment(uv,player,player+dir*5.,1.)<0.){
             fragColor.rgb=vec3(1);
        }
            
            float count=rows*cols;
             int side=0;
             vec2 cur_coord=player/size;
             vec2 cur_map_coord=floor(cur_coord);
             vec2 player_offset=fract(cur_coord);
             float x_delta=abs(dir.x==0.?1000000.:1./dir.x);
             float y_delta=abs(dir.y==0.?1000000.:1./dir.y);
             float x_offset=dir.x>0.?1.-player_offset.x:player_offset.x;
             float y_offset=dir.y>0.?1.-player_offset.x:player_offset.y;
            float x_side_dist=x_delta*x_offset;
            float y_side_dist=y_delta*y_offset;
            float x_sign=dir.x>0.?1.:-1.;
            float y_sign=dir.y>0.?1.:-1.;
             while(count>0.){
                if(x_side_dist<y_side_dist){
                    side=1;
                    x_side_dist+=x_delta;
                    cur_map_coord.x+=x_sign;
                }else{
                    side=0;
                    y_side_dist+=y_delta;
                    cur_map_coord.y+=y_sign;
                }
                float dist=side==1?x_side_dist-x_delta:y_side_dist-y_delta;
                float x=player.x+dir.x*dist*size;
                float y=player.y+dir.y*dist*size;
                if(sdCircle(uv-vec2(x,y),2.)<0.){
                    fragColor.rgb=vec3(1,0,0);
                    break;
                }
                if(map[int(cur_map_coord.y)].cells[int(cur_map_coord.x)]==1){
                    break;
                }
                if(cur_map_coord.x>=cols||cur_map_coord.x<0.||cur_map_coord.y>=rows||cur_map_coord.y<0.){
                    break;
                }
                count--;
             }
         
    }

}
void drawRays3d(out vec4 fragColor,vec2 uv){
            float halfHeight=iResolution.y/2.;
            float width=iResolution.x;
             float height=iResolution.y;
            float x_scan=uv.x;
            float fovAngle=70.;
            float fovRad=fovAngle/180.*PI;
            float fov=tan(fovRad/2.);
            float x_cos=(x_scan/width)*2.-1.;
            float rotate=fov*x_cos+theta;
            vec2 dir;
            dir.x=cos(rotate);
            dir.y=sin(rotate);


            float count=rows*cols;
             int side=0;
             vec2 cur_coord=player/size;
             vec2 cur_map_coord=floor(cur_coord);
             vec2 player_offset=fract(cur_coord);
             float x_delta=abs(dir.x==0.?1000000.:1./dir.x);
             float y_delta=abs(dir.y==0.?1000000.:1./dir.y);
             float x_offset=dir.x>0.?1.-player_offset.x:player_offset.x;
             float y_offset=dir.y>0.?1.-player_offset.x:player_offset.y;
            float x_side_dist=x_delta*x_offset;
            float y_side_dist=y_delta*y_offset;
            float x_sign=dir.x>0.?1.:-1.;
            float y_sign=dir.y>0.?1.:-1.;
             while(count>0.){
                if(x_side_dist<y_side_dist){
                    side=1;
                    x_side_dist+=x_delta;
                    cur_map_coord.x+=x_sign;
                }else{
                    side=0;
                    y_side_dist+=y_delta;
                    cur_map_coord.y+=y_sign;
                }
        
                if(map[int(cur_map_coord.y)].cells[int(cur_map_coord.x)]==1){
                    break;
                }
                if(cur_map_coord.x>=cols||cur_map_coord.x<0.||cur_map_coord.y>=rows||cur_map_coord.y<0.){
                    break;
                }
                count--;
             }
            int mapValue=map[int(cur_map_coord.y)].cells[int(cur_map_coord.x)];
            float dist=side==1?x_side_dist-x_delta:y_side_dist-y_delta;
            float fishDist=dist*cos(rotate-theta);
            float lineHeight = height /dist;
            float x1=uv.x;
            float y1=halfHeight-lineHeight*0.5;
            float y2=halfHeight+lineHeight*0.5;
            if(uv.x==x1&&uv.y>=y1&&uv.y<=y2){
                if(mapValue==1){
                    fragColor.rgb=side==1?vec3(0.6,0.7,0):vec3(1,0,0);
                }else{
                    fragColor.rgb=side==1?vec3(0.2,0.2,0.2):vec3(0.3,0.3,0.3);
                }
            }
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    map[0].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[1].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[2].cells=int[](0,1,0,0,0,0,0,0,0,0);
    map[3].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[4].cells=int[](0,0,0,0,0,1,0,0,0,0);
    map[5].cells=int[](0,0,0,1,0,0,0,1,0,0);
    map[6].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[7].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[8].cells=int[](0,0,0,0,0,0,0,0,0,0);
    map[9].cells=int[](0,0,0,0,0,0,0,0,0,0);
    vec2 uv =vec2(fragCoord.x,iResolution.y-fragCoord.y)+0.5; //projectCoord(fragCoord,1.);

    drawGrid(fragColor,uv);
    drawRays3d(fragColor,uv);
}