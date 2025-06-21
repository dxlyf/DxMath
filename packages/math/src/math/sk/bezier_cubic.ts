import {lerp as interpolate} from './util'
export class SkBezierCubic{


    /**
     * Evaluates the cubic Bézier curve for a given t. It returns an X and Y coordinate
     * following the formula, which does the interpolation mentioned above.
     *     X(t) = X_0*(1-t)^3 + 3*X_1*t(1-t)^2 + 3*X_2*t^2(1-t) + X_3*t^3
     *     Y(t) = Y_0*(1-t)^3 + 3*Y_1*t(1-t)^2 + 3*Y_2*t^2(1-t) + Y_3*t^3
     *
     * t is typically in the range [0, 1], but this function will not assert that,
     * as Bézier curves are well-defined for any real number input.
     */
    static  EvalAt(curve:number[], t:number):[number,number]{
        const  in_X = (n:number)=> { return curve[2*n]; };
        const  in_Y =(n:number)=> { return curve[2*n + 1]; };
       
        // Two semi-common fast paths
        if (t == 0) {
            return [in_X(0), in_Y(0)];
        }
        if (t == 1) {
            return [in_X(3), in_Y(3)];
        }
        // X(t) = X_0*(1-t)^3 + 3*X_1*t(1-t)^2 + 3*X_2*t^2(1-t) + X_3*t^3
        // Y(t) = Y_0*(1-t)^3 + 3*Y_1*t(1-t)^2 + 3*Y_2*t^2(1-t) + Y_3*t^3
        // Some compilers are smart enough and have sufficient registers/intrinsics to write optimal
        // code from
        //    double one_minus_t = 1 - t;
        //    double a = one_minus_t * one_minus_t * one_minus_t;
        //    double b = 3 * one_minus_t * one_minus_t * t;
        //    double c = 3 * one_minus_t * t * t;
        //    double d = t * t * t;
        // However, some (e.g. when compiling for ARM) fail to do so, so we use this form
        // to help more compilers generate smaller/faster ASM. https://godbolt.org/z/M6jG9x45c
        let one_minus_t = 1 - t;
        let one_minus_t_squared = one_minus_t * one_minus_t;
        let a = (one_minus_t_squared * one_minus_t);
        let b = 3 * one_minus_t_squared * t;
        let t_squared = t * t;
        let c = 3 * one_minus_t * t_squared;
        let d = t_squared * t;
       
        return [a * in_X(0) + b * in_X(1) + c * in_X(2) + d * in_X(3),
                a * in_Y(0) + b * in_Y(1) + c * in_Y(2) + d * in_Y(3)];
    }

    /**
     * Splits the provided Bézier curve at the location t, resulting in two
     * Bézier curves that share a point (the end point from curve 1
     * and the start point from curve 2 are the same).
     *
     * t must be in the interval [0, 1].
     *
     * The provided twoCurves array will be filled such that indices
     * 0-7 are the first curve (representing the interval [0, t]), and
     * indices 6-13 are the second curve (representing [t, 1]).
     */
    static Subdivide(curve:number[],t:number,twoCurves:number[]){
       
        // We split the curve "in" into two curves "alpha" and "beta"
        const  in_X = (n:number)=> { return curve[2*n]; };
        const  in_Y = (n:number)=> { return curve[2*n + 1]; };
        const  set_in_X = (n:number,value:number)=> {  curve[2*n]=value; };
        const  set_in_Y = (n:number,value:number)=> {  curve[2*n + 1]=value; };

        const  alpha_X = (n:number)=> { return twoCurves[2*n]; };
        const  alpha_Y = (n:number)=>{ return twoCurves[2*n + 1]; };
        const  set_alpha_X = (n:number,value:number)=> {  twoCurves[2*n]=value; };
        const  set_alpha_Y = (n:number,value:number)=>{  twoCurves[2*n + 1]=value; };

        const  beta_X = (n:number)=>{ return twoCurves[2*n + 6]; };
        const  beta_Y = (n:number)=> { return twoCurves[2*n + 7]; };
        const  set_beta_X = (n:number,value:number)=>{  twoCurves[2*n + 6]=value; };
        const  set_beta_Y = (n:number,value:number)=> {  twoCurves[2*n + 7]=value; };
       
        set_alpha_X(0,in_X(0));
        set_alpha_Y(0,in_Y(0));
       
        set_beta_X(3,in_X(3));
        set_beta_Y(3,in_Y(3));
       
        let x01 = interpolate(in_X(0), in_X(1), t);
        let y01 = interpolate(in_Y(0), in_Y(1), t);
        let x12 = interpolate(in_X(1), in_X(2), t);
        let y12 = interpolate(in_Y(1), in_Y(2), t);
        let x23 = interpolate(in_X(2), in_X(3), t);
        let y23 = interpolate(in_Y(2), in_Y(3), t);
       
        set_alpha_X(1,x01);
        set_alpha_Y(1,y01);
       
        set_beta_X(2,x23);
        set_beta_Y(2,y23);
       
        set_alpha_X(2,interpolate(x01, x12, t));
        set_alpha_Y(2,interpolate(y01, y12, t));
       
        set_beta_X(1,interpolate(x12, x23, t));
        set_beta_Y(1,interpolate(y12, y23, t));
       
        set_alpha_X(3,interpolate(alpha_X(2), beta_X(1), t)) /*= beta_X(0) */ ;
        set_alpha_Y(3,interpolate(alpha_Y(2), beta_Y(1), t)) /*= beta_Y(0) */ ;
    }

    /**
     * Converts the provided Bézier curve into the the equivalent cubic
     *    f(t) = A*t^3 + B*t^2 + C*t + D
     * where f(t) will represent Y coordinates over time if yValues is
     * true and the X coordinates if yValues is false.
     *
     * In effect, this turns the control points into an actual line, representing
     * the x or y values.
     */
    static  ConvertToPolynomial(curve:number[],yValues:boolean){
        const  offset_curve = yValues ? curve.slice(1) : curve;
        const  P =(n:number)=> { return offset_curve[2*n]; };
        // [&offset_curve](size_t n) { return offset_curve[2*n]; };
        // A cubic Bézier curve is interpolated as follows:
        //  c(t) = (1 - t)^3 P_0 + 3t(1 - t)^2 P_1 + 3t^2 (1 - t) P_2 + t^3 P_3
        //       = (-P_0 + 3P_1 + -3P_2 + P_3) t^3 + (3P_0 - 6P_1 + 3P_2) t^2 +
        //         (-3P_0 + 3P_1) t + P_0
        // Where P_N is the Nth point. The second step expands the polynomial and groups
        // by powers of t. The desired output is a cubic formula, so we just need to
        // combine the appropriate points to make the coefficients.
        let results=new Array(4)
        results[0] = -P(0) + 3*P(1) - 3*P(2) + P(3);
        results[1] = 3*P(0) - 6*P(1) + 3*P(2);
        results[2] = -3*P(0) + 3*P(1);
        results[3] = P(0);
        return results;
    }
}