

export class RefValue<T=any>{
	static from<T=any>(value:T){
		return new this<T>(value)
	}
	constructor(public value:T){

	}
}
export class PointerArray<T> {
	static from<T=any>(data:T[]):PointerArray<T>{
		const arr= new this(data)
		return arr as PointerArray<T>
	}	
	data:T[]=[]
	curIndex:number=0
	constructor(data:T[]){
		this.data=data
	}
	get length():number{
		return this.data.length
	}
	cur(){
		return this.data[this.curIndex]
	}
	get(index:number){
		return this.data[index+this.curIndex]
	}
	set value(v:T){
		this.data[this.curIndex]=v
	}
	get value(){
		return this.data[this.curIndex]
	}
	move(index:number){
		// if(this.length===0){
		// 	return this
		// }
		// while(index<0){
		// 	index+=this.length
		// }
		// while(index>=this.length){
		// 	index-=this.length
		// }
		this.curIndex=index
		return this
	}
	next(index:number=1){
		this.move(this.curIndex+index)
		return this
	}
	prev(index:number=1){
		this.move(this.curIndex-index)
		return this
	}
}

export class Init26_6{
    static shift=6
    static scalar=1<<6
    static fromRound(x:float):FT_Fixed{
        return Math.round(x*this.scalar)
    }
    static fromFloor(x:float):FT_Fixed{
        return Math.floor(x*this.scalar)
    }
    static toFloat(x:FT_Fixed):float{
        return x/this.scalar
    }
    static add(x:FT_Fixed,y:FT_Fixed):FT_Fixed{
        return x+y
    }
    static sub(x:FT_Fixed,y:FT_Fixed):FT_Fixed{
        return x-y
    }
    static mul(x:FT_Fixed,y:FT_Fixed):FT_Fixed{
        return (x*y)/this.scalar
    }
    static div(x:FT_Fixed,y:FT_Fixed):FT_Fixed{
        return Math.round((x*this.scalar)/y)
    }

}

export class FT_Vector{
    static default(){
        return new this()
    }
    static from(x:FT_Pos,y:FT_Pos){
        return new this(x,y)
    }
    x:FT_Pos=0
    y:FT_Pos=0
    constructor(x:FT_Pos=0,y:FT_Pos=0){
        this.x=x
        this.y=y
    }   
	set(x:FT_Pos,y:FT_Pos){
		this.x=x
		this.y=y
		return this
	}
	copy(v:FT_Vector){
		this.set(v.x,v.y)
		return this
	}
    clone(){
        return new FT_Vector(this.x,this.y)
    }
    add(v:FT_Vector){
        this.x+=v.x
        this.y+=v.y
        return this
    }
    sub(v:FT_Vector){
        this.x-=v.x
        this.y-=v.y
        return this
    }
}

export function FT_BOOL(x: boolean) {
    return x ? 1 : 0
}
export function FT_MIN(a: number, b: number) {
    return Math.min(a, b)
}
export function FT_MAX(a: number, b: number) {
    return Math.max(a, b)
}
export function FT_ABS(a: number) {
    return Math.abs(a)
}
export function FT_HYPOT(x: number, y: number) {
    //(x = XCG_FT_ABS(x), y = XCG_FT_ABS(y), x > y ? x + (3 * y >> 3) : y + (3 * x >> 3))
    // x = FT_ABS(x)
    // y = FT_ABS(y)
    // if (x > y) {
    //     return x + (3 * y >> 3)
    // } else {
    //     return y + (3 * x >> 3)
    // }
    return Math.hypot(x, y)
}
export const FT_ANGLE_PI=180<<16
export const FT_ANGLE_2PI=FT_ANGLE_PI*2
export const FT_ANGLE_PI2=FT_ANGLE_PI/2
export const FT_ANGLE_PI4=FT_ANGLE_PI/4

export function FT_MSB(x: number) {
    return 31-Math.clz32(x)
   // return 31 - Math.floor(Math.log2(x))
}
// FT_PAD_FLOOR(9,8)=8
export function FT_PAD_FLOOR(x: number, n: number) {
    return Number(BigInt(Math.trunc(x)) & ~BigInt((n - 1)))
}
// FT_PAD_ROUND(6,8)=8
export function FT_PAD_ROUND(x: number, n: number) {
    return FT_PAD_FLOOR(x + (n / 2), n)
}
// FT_PAD_ROUND(1,8)=8
export function FT_PAD_CEIL(x: number, n: number) {
    return FT_PAD_FLOOR(x + (n - 1), n)
}
export function FT_MOVE_SIGN(x: any, s: any) {
    if (x < 0) {
        x = -x
        s = -s
    }
    return [x, s]
}
// 0x8000=65536/2
export function FT_MulFix(a: FT_Long, b: FT_Long): FT_Long {
    let s: FT_Int = 1
    let c: BigInt
    [a, s] = FT_MOVE_SIGN(a, s);
    [b, s] = FT_MOVE_SIGN(b, s);
    // 先四舍五入,再/65536
    c = ((BigInt(Math.trunc(a)) * BigInt(Math.trunc(b)) + 0x8000n) >> 16n);

    return (s > 0) ? Number(c) :-Number(c);
}
export function FT_MulDiv(a: FT_Long, b: FT_Long, c: FT_Long):FT_Long {
    let s: FT_Int = 1
    let d: FT_Long
    [a, s] = FT_MOVE_SIGN(a, s);
    [b, s] = FT_MOVE_SIGN(b, s);
    [c, s] = FT_MOVE_SIGN(c, s);
    d = (c > 0 ? (a * b + (c /2)) / c : 0x7FFFFFFF);
	d=d>>0
    return (s > 0) ? d : -d;
}
export function FT_DivFix(a: FT_Long, b: FT_Long):FT_Long {
    let s: FT_Int = 1
    let q: BigInt
    [a, s] = FT_MOVE_SIGN(a, s);
    [b, s] = FT_MOVE_SIGN(b, s);
    // 0x7FFFFFFF=1<<31=Math.pow(2,31)
    //q = (b > 0 ? ((a << 16) + (b >> 1)) / b : 0x7FFFFFFF);
	if (b === 0) return 0x7FFFFFFF;
	 q = ((BigInt(a) << 16n) + BigInt(b >> 1)) / BigInt(b);
	return s > 0 ? Number(q) : -Number(q);
   // return (s < 0 ? -q : q);
}
 /* the Cordic shrink factor 0.858785336480436 * 2^32 */
 export const FT_TRIG_SCALE=0xDBD95B16
   /* the highest bit in overflow-safe vector components, */
  /* MSB of 0.858785336480436 * sqrt(0.5) * 2^30         */
export const  FT_TRIG_SAFE_MSB=29
export const  FT_TRIG_MAX_ITERS=23
 // Math.atan(2**-(i+1))/Math.PI*180*65536=1740967L
 // 反正切角度表,
 // 每个索引正切:Math.pow(2,-(i+1))=1/Math.pow(2,i)
 // tan=sin/cos sin=tan*cos
 // cos=1/Math.sqrt(1+Math.pow(tan(theta),2))=1/sqrt(1+tan^2)
export const  ft_trig_arctan_table:FT_Fixed[] = [
	1740967, 919879, 466945, 234379, 117304, 58666, 29335, 14668,
	7334,    3667,   1833,   917,    458,    229,   115,   57,
	29,      14,     7,      4,      2,      1
]

export function ft_trig_downscale(val:FT_Fixed):FT_Fixed
{
	let s:FT_Fixed;
	let v:FT_Int64;

	s = val;
	val = FT_ABS(val);
    // 0x100000000== Math.pow(2,32)
	v = (val * (FT_TRIG_SCALE as FT_Int64)) + 0x100000000;
	val = Math.floor(v/Math.pow(2, 32)) as FT_Fixed;
	return (s >= 0) ? val : -val;
}

export  function ft_trig_prenorm(vec:FT_Vector):FT_Int
{
	let x:FT_Pos, y:FT_Pos;
	let shift:FT_Int;

	x = vec.x;
	y = vec.y;
	// 两数的点字节位长度
	shift = FT_MSB(FT_ABS(x) | FT_ABS(y));

	if(shift <= FT_TRIG_SAFE_MSB)
	{
		shift = FT_TRIG_SAFE_MSB - shift;
		vec.x = Number(BigInt(x) << BigInt(shift));
		vec.y = Number(BigInt(y) << BigInt(shift));
	}
	else
	{
		shift -= FT_TRIG_SAFE_MSB;
		vec.x = Number(BigInt(x) >> BigInt(shift));
		vec.y = Number(BigInt(y) >> BigInt(shift));
		shift = -shift;
	}
	return shift;
}


// 向量旋转法,通过每个旋转一定角度迭代逼近,计算出cos和sin
// 倒数关系:tan=sin/cos sin=cos*tan
// 函数关系:cos=1/sqrt(1+tan^2)
// 旋转公式: r*cos(theta+alpha) = rcos(theta) * cos(alpha) - r*sin(theta) * sin(alpha)=x * cos(alpha) - y * sin(alpha)=cos(alpha)*(x-y*tan(alpha))
export function ft_trig_pseudo_rotate(vec:FT_Vector,theta:FT_Angle)
{
	let i:FT_Int;
	let x:FT_Fixed, y:FT_Fixed, xtemp:FT_Fixed, b:bigint;
	
	x = vec.x;
	y = vec.y;
	// 将角度转换到[-pi/4, pi/4]范围内
	while(theta < -FT_ANGLE_PI4)
	{
		xtemp = y;
		y = -x;
		x = xtemp;
		theta += FT_ANGLE_PI2;
	}
	while(theta > FT_ANGLE_PI4)
	{
		xtemp = -y;
		y = x;
		x = xtemp;
		theta -= FT_ANGLE_PI2;
	}
    let arctanptr=0
	for(i = 1, b = 1n; i < FT_TRIG_MAX_ITERS; b <<= 1n, i++)
	{
		let v1:FT_Fixed = Number((BigInt(y) + b) >> BigInt(i));
		let v2:FT_Fixed = Number((BigInt(x) + b) >> BigInt(i));
		if(theta < 0)
		{
			xtemp = x + v1;
			y = y - v2;
			x = xtemp;
			theta += ft_trig_arctan_table[arctanptr++];
		}
		else
		{
			xtemp = x - v1;
			y = y + v2;
			x = xtemp;
			theta -= ft_trig_arctan_table[arctanptr++];
		}
	}
	vec.x = x;
	vec.y = y;
}
// 计算r半径和theta角度
export function ft_trig_pseudo_polarize(vec:FT_Vector)
{
	let theta:FT_Angle;
	let i:FT_Int;
	let x:FT_Fixed, y:FT_Fixed, xtemp:FT_Fixed, b:bigint;
	let arctanptr=0

	x = vec.x;
	y = vec.y;
	if(y > x)
	{
		if(y > -x)
		{
			theta = FT_ANGLE_PI2;
			xtemp = y;
			y = -x;
			x = xtemp;
		}
		else
		{
			theta = y > 0 ? FT_ANGLE_PI : -FT_ANGLE_PI;
			x = -x;
			y = -y;
		}
	}
	else
	{
		if(y < -x)
		{
			theta = -FT_ANGLE_PI2;
			xtemp = -y;
			y = x;
			x = xtemp;
		}
		else
		{
			theta = 0;
		}
	}

	for(i = 1, b = 1n; i < FT_TRIG_MAX_ITERS; b <<= 1n, i++)
	{
		let v1:FT_Fixed = Number((BigInt(y) + b) >> BigInt(i));
		let v2:FT_Fixed = Number((BigInt(x) + b) >> BigInt(i));
		if(y > 0)
		{
			xtemp = x + v1;
			y = y - v2;
			x = xtemp;
			theta += ft_trig_arctan_table[arctanptr++];
		}
		else
		{
			xtemp = x - v1;
			y = y + v2;
			x = xtemp;
			theta -= ft_trig_arctan_table[arctanptr++];
		}
	}
	if(theta >= 0)
		theta = FT_PAD_ROUND(theta, 32);
	else
		theta = -FT_PAD_ROUND(-theta, 32);
	vec.x = x;
	vec.y = theta;
}

export function FT_Cos(angle: FT_Angle):FT_Fixed {
    let v:FT_Vector=FT_Vector.default();

    v.x = Number(BigInt(FT_TRIG_SCALE) >> 8n);
	v.y = 0;
	ft_trig_pseudo_rotate(v, angle);
	return Number((BigInt(v.x) + 0x80n) >> 8n);
   // return Math.cos(angle)
}
export function FT_Sin(angle: FT_Angle):FT_Fixed {
	return FT_Cos(FT_ANGLE_PI2 - angle);
}

export function FT_Tan(angle: FT_Angle):FT_Fixed {
    let v=FT_Vector.default();

	v.x = Number(BigInt(FT_TRIG_SCALE) >> 8n);
	v.y = 0;
	ft_trig_pseudo_rotate(v, angle);
	return FT_DivFix(v.y, v.x);
   // return Math.tan(angle)
}
export function FT_Atan2(dx: FT_Fixed,dy: FT_Fixed):FT_Angle {
    let v=FT_Vector.default();

	if(dx == 0 && dy == 0)
	{
        return 0;
    }
	v.x = dx;
	v.y = dy;
	ft_trig_prenorm(v);
	ft_trig_pseudo_polarize(v);
	return v.y;
   // return Math.atan2(a,b)
}
export function FT_Vector_Unit( vec:FT_Vector, angle:FT_Angle)
{
	vec.x = Number(BigInt(FT_TRIG_SCALE) >> 8n);
	vec.y = 0;
	ft_trig_pseudo_rotate(vec, angle);
	vec.x = (vec.x + 0x80) >> 8;
	vec.y = (vec.y + 0x80) >> 8;
}


export function FT_Vector_Rotate(vec:FT_Vector,  angle:FT_Angle)
{
	let shift:FT_Int;
	let v = vec.clone();

	if(v.x == 0 && v.y == 0)
		return;
	shift = ft_trig_prenorm(v);
	ft_trig_pseudo_rotate(v, angle);
	v.x = ft_trig_downscale(v.x);
	v.y = ft_trig_downscale(v.y);

	if(shift > 0)
	{
		let half:FT_Int32 = 1 << (shift - 1);

		vec.x = Number(BigInt(Math.trunc((v.x + half - Number(v.x < 0)))) >> BigInt(shift));
		vec.y =Number(BigInt(Math.trunc( (v.y + half - Number(v.y < 0)) ))>> BigInt(shift));
	}
	else
	{
		shift = -shift;
		vec.x = Number(BigInt(v.x) << BigInt(shift));
		vec.y = Number(BigInt(v.y) << BigInt(shift));
	}
}

export function FT_Vector_Length( vec:FT_Vector):FT_Fixed
{
	let shift:FT_Int;
	let v:FT_Vector;

	v = vec.clone();
	if(v.x == 0)
	{
		return FT_ABS(v.y);
	}
	else if(v.y == 0)
	{
		return FT_ABS(v.x);
	}

	shift = ft_trig_prenorm(v);
	ft_trig_pseudo_polarize(v);
	v.x = ft_trig_downscale(v.x);
	if(shift > 0)
	{
		return Number((BigInt(v.x) + (1n << BigInt((shift - 1)))) >> BigInt(shift));
	}

	return Number(BigInt(v.x) << BigInt(-shift));
}

export function FT_Vector_Polarize(vec:FT_Vector,length:FT_Fixed, angle:FT_Angle)
{
	let shift:FT_Int;
	let v:FT_Vector;

	v = vec.clone();
	if(v.x == 0 && v.y == 0)
		return;
	shift = ft_trig_prenorm(v);
	ft_trig_pseudo_polarize(v);
	v.x = ft_trig_downscale(v.x);

	length = (shift >= 0) ? (v.x >> shift) : v.x << -shift;
	angle = v.y;
}

export function FT_Vector_From_Polar(vec:FT_Vector,  length:FT_Fixed,angle:FT_Angle)
{
	vec.x = length;
	vec.y = 0;

	FT_Vector_Rotate(vec, angle);
}



export function FT_Angle_Diff(angle1: FT_Angle, angle2: FT_Angle):FT_Angle {
    let delta = angle2 - angle1;

    while(delta <= -FT_ANGLE_PI)
        delta += FT_ANGLE_2PI;

    while(delta > FT_ANGLE_PI)
        delta -= FT_ANGLE_2PI;

    return delta;
}
