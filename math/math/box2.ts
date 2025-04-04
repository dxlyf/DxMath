import { Vector2 } from './vec2.js';

const _vector = /*@__PURE__*/ new Vector2();

class Box2 {
    static default(){
        return new Box2();
    }
	static create(min =  Vector2.create( + Infinity, + Infinity ), max =  Vector2.create( - Infinity, - Infinity ) ){
        return new this(min,max);
    }
    isBox2=true
    min:Vector2
    max:Vector2
	constructor( min =  Vector2.create( + Infinity, + Infinity ), max =  Vector2.create( - Infinity, - Infinity ) ) {

		this.min = min;
		this.max = max;

	}

	set( min:Vector2, max:Vector2 ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	}

	setFromPoints( points:Vector2[] ) {

		this.makeEmpty();

		for ( let i = 0, il = points.length; i < il; i ++ ) {

			this.expandByPoint( points[ i ] );

		}

		return this;

	}

	setFromCenterAndSize( center:Vector2, size:Vector2 ) {

		const halfSize = _vector.copy( size ).multiplyScalar( 0.5 );
		this.min.copy( center ).sub( halfSize );
		this.max.copy( center ).add( halfSize );

		return this;

	}

	clone() {

		return (new (this.constructor as typeof Box2)).copy( this );

	}

	copy( box:Box2 ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	}

	makeEmpty() {

		this.min.x = this.min.y = + Infinity;
		this.max.x = this.max.y = - Infinity;

		return this;

	}

	isEmpty() {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y );

	}

	getCenter( target:Vector2 ) {

		return this.isEmpty() ? target.set( 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	}

	getSize( target:Vector2 ) {

		return this.isEmpty() ? target.set( 0, 0 ) : target.subVectors( this.max, this.min );

	}

	expandByPoint( point:Vector2 ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	}

	expandByVector( vector:Vector2 ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	}

	expandByScalar( scalar:number ) {

		this.min.addScalar( - scalar );
		this.max.addScalar( scalar );

		return this;

	}

	containsPoint( point:Vector2 ) {

		return point.x >= this.min.x && point.x <= this.max.x &&
			point.y >= this.min.y && point.y <= this.max.y;

	}

	containsBox( box:Box2 ) {

		return this.min.x <= box.min.x && box.max.x <= this.max.x &&
			this.min.y <= box.min.y && box.max.y <= this.max.y;

	}

	getParameter( point:Vector2, target:Vector2 ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		return target.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y )
		);

	}

	intersectsBox( box:Box2 ) {

		// using 4 splitting planes to rule out intersections

		return box.max.x >= this.min.x && box.min.x <= this.max.x &&
			box.max.y >= this.min.y && box.min.y <= this.max.y;

	}

	clampPoint( point:Vector2, target:Vector2 ) {

		return target.copy( point ).clamp( this.min, this.max );

	}

	distanceToPoint( point:Vector2 ) {

		return this.clampPoint( point, _vector ).distanceTo( point );

	}

	intersect( box:Box2 ) {

		this.min.max( box.min );
		this.max.min( box.max );

		if ( this.isEmpty() ) this.makeEmpty();

		return this;

	}

	union( box:Box2) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	}

	translate( offset:Vector2 ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	}

	equals( box:Box2 ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	}

}

export { Box2 };
