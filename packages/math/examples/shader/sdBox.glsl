
#define MAX_RAY_DEPTH 100.
#define MAX_RAY_STEP 100

vec2 projectCoord(vec2 uv,float scale) {
    // Convert from [0,1] to [-1,1]
    return scale*(uv-iResolution.xy*0.5)/min(iResolution.x,iResolution.xy.y) * 2.0;
}
struct Box{
    vec3 center;
    vec3 size;
};
float sdBox(vec3 p,vec3 size){
    vec3 d = abs(p) - size;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}
mat3 lookAt(vec3 eye, vec3 center, vec3 up) {
    vec3 z = normalize(eye - center);
    vec3 x = normalize(cross(up,z));
    vec3 y = cross(z,x);
    return mat3(x,y,z);
}

// 计算球体的法线
vec3 SDFNormal(vec3 p,Box box) {
  const float h = 0.0001;
  const vec2 k = vec2(1, -1);
  return normalize(k.xyy * sdBox(p + k.xyy * h,box.size) +
    k.yyx * sdBox(p + k.yyx * h,box.size) +
    k.yxy * sdBox(p + k.yxy * h,box.size) +
    k.xxx * sdBox(p + k.xxx * h,box.size));
}

// 打光
// vec3 AddLight(vec3 lightPos,vec3 positon) {
 
//   // 当前着色点的法线
//   vec3 n = SDFNormal(positon);
//   // 当前着色点到光源的方向
//   vec3 lightDir = normalize(lightPos - positon);
//   // 漫反射
//   vec3 coefficient=vec3(1);// 漫反射系数
//   vec3 diffuse = coefficient * max(dot(lightDir, n), 0.);
//   // 环境光
//   float amb = 0.15 + dot(-lightDir, n) * 0.2;
//   // 最终颜色
//   return diffuse + amb;
// }
vec3 rayMatrch(vec2 uv){
     vec3 col=vec3(0.0);
     vec3 rayOrigin=vec3(0,2,4);
  
     mat3 cameraMatrix=lookAt(rayOrigin, vec3(0,0,0), vec3(0,1,0));
     mat3 viewMatrix=inverse(cameraMatrix);
     vec3 rayDirection=cameraMatrix*normalize(vec3(uv,-1));
     Box box;
     box.center=vec3(0,0,0);
     box.size=vec3(1,1,1);
     float rayNear=0.01;

     vec3 potLightPos=vec3(0,4,3); // Light position

     for(int i=0;i<MAX_RAY_STEP;i++){
         vec3 p=rayOrigin+rayDirection*rayNear;
         float d=sdBox(p-box.center,box.size);
         if(d<0.001){
             vec3 norm=SDFNormal(p,box);
             float d=dot(norm,normalize(potLightPos-p));
             d=clamp(d,0.0,1.0); // Clamp to [0,1]
             // Hit the box
             // Do something like shading or color calculation
             col=vec3(1,0,0)*d; // Set color to red
             break;
         }
         if(rayNear>MAX_RAY_DEPTH){ // Far away, stop
             break;
         }
         rayNear+=d;
     }
     return col;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv=projectCoord(fragCoord,1.0); // Convert to [-1,1] range
    fragColor = vec4(rayMatrch(uv), 1.0); // Call ray march function
}   