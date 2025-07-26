import { Vector2Like } from "../math/Vector2";

/**
 * 计算三角形的面积
 * @param a 
 * @param b 
 * @param c 
 * @returns 
 */
function getArea(a:Vector2Like,b:Vector2Like,c:Vector2Like):number{
    const ab_x=b[0]-a[0],ab_y=b[1]-a[1];
    const ac_x=c[0]-a[0],ac_y=c[1]-a[1];
    const area=ab_x*ac_y-ab_y*ac_x;
    return area*0.5;
}



/**
 * 重心坐标
 * α = Area(PBC) / Area(ABC)
    β = Area(PCA) / Area(ABC)
    γ = Area(PAB) / Area(ABC)
 * * */
function barycentric(p:Vector2Like,a:Vector2Like,b:Vector2Like,c:Vector2Like){
   //
   const area_abc=getArea(a,b,c);
   const area_pbc=getArea(p,b,c);
   const area_pca=getArea(p,c,a);
 //  const area_pab=getArea(p,a,b);
   const alpha=area_pbc/area_abc;
   const beta=area_pca/area_abc;
   const gamma=1-alpha-beta;//area_pab/area_abc;
   return [alpha,beta,gamma];
}
export class Triangle{
    static getArea=getArea;
    static barycentric=barycentric
    constructor(a:any){}
}