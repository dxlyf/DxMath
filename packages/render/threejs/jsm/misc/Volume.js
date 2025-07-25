import {
	Matrix3,
	Matrix4,
	Vector3
} from 'three';
import { VolumeSlice } from './VolumeSlice.js';

/**
 * This class had been written to handle the output of the {@link NRRDLoader}.
 * It contains a volume of data and information about it. For now it only handles 3 dimensional data.
 *
 * @three_import import { Volume } from 'three/addons/misc/Volume.js';
 */
class Volume {

	/**
	 * Constructs a new volume.
	 *
	 * @param {number} [xLength] - Width of the volume.
	 * @param {number} [yLength] - Length of the volume.
	 * @param {number} [zLength] - Depth of the volume.
	 * @param {string} [type] - The type of data (uint8, uint16, ...).
	 * @param {ArrayBuffer} [arrayBuffer] - The buffer with volume data.
	 */
	constructor( xLength, yLength, zLength, type, arrayBuffer ) {

		if ( xLength !== undefined ) {

			/**
			 * Width of the volume in the IJK coordinate system.
			 *
			 * @type {number}
			 * @default 1
			 */
			this.xLength = Number( xLength ) || 1;

			/**
			 * Height of the volume in the IJK coordinate system.
			 *
			 * @type {number}
			 * @default 1
			 */
			this.yLength = Number( yLength ) || 1;

			/**
			 * Depth of the volume in the IJK coordinate system.
			 *
			 * @type {number}
			 * @default 1
			 */
			this.zLength = Number( zLength ) || 1;

			/**
			 * The order of the Axis dictated by the NRRD header
			 *
			 * @type {Array<string>}
			 */
			this.axisOrder = [ 'x', 'y', 'z' ];

			/**
			 * The data of the volume.
			 *
			 * @type {TypedArray}
			 */
			this.data;

			switch ( type ) {

				case 'Uint8' :
				case 'uint8' :
				case 'uchar' :
				case 'unsigned char' :
				case 'uint8_t' :
					this.data = new Uint8Array( arrayBuffer );
					break;
				case 'Int8' :
				case 'int8' :
				case 'signed char' :
				case 'int8_t' :
					this.data = new Int8Array( arrayBuffer );
					break;
				case 'Int16' :
				case 'int16' :
				case 'short' :
				case 'short int' :
				case 'signed short' :
				case 'signed short int' :
				case 'int16_t' :
					this.data = new Int16Array( arrayBuffer );
					break;
				case 'Uint16' :
				case 'uint16' :
				case 'ushort' :
				case 'unsigned short' :
				case 'unsigned short int' :
				case 'uint16_t' :
					this.data = new Uint16Array( arrayBuffer );
					break;
				case 'Int32' :
				case 'int32' :
				case 'int' :
				case 'signed int' :
				case 'int32_t' :
					this.data = new Int32Array( arrayBuffer );
					break;
				case 'Uint32' :
				case 'uint32' :
				case 'uint' :
				case 'unsigned int' :
				case 'uint32_t' :
					this.data = new Uint32Array( arrayBuffer );
					break;
				case 'longlong' :
				case 'long long' :
				case 'long long int' :
				case 'signed long long' :
				case 'signed long long int' :
				case 'int64' :
				case 'int64_t' :
				case 'ulonglong' :
				case 'unsigned long long' :
				case 'unsigned long long int' :
				case 'uint64' :
				case 'uint64_t' :
					throw new Error( 'Error in Volume constructor : this type is not supported in JavaScript' );
					break;
				case 'Float32' :
				case 'float32' :
				case 'float' :
					this.data = new Float32Array( arrayBuffer );
					break;
				case 'Float64' :
				case 'float64' :
				case 'double' :
					this.data = new Float64Array( arrayBuffer );
					break;
				default :
					this.data = new Uint8Array( arrayBuffer );

			}

			if ( this.data.length !== this.xLength * this.yLength * this.zLength ) {

				throw new Error( 'Error in Volume constructor, lengths are not matching arrayBuffer size' );

			}

		}

		/**
		 * Spacing to apply to the volume from IJK to RAS coordinate system
		 *
		 * @type {Array<number>}
		 */
		this.spacing = [ 1, 1, 1 ];

		/**
		 * Offset of the volume in the RAS coordinate system
		 *
		 * @type {Array<number>}
		 */
		this.offset = [ 0, 0, 0 ];

		/**
		 * The IJK to RAS matrix.
		 *
		 * @type {Martrix3}
		 */
		this.matrix = new Matrix3();
		this.matrix.identity();

		/**
		 * The RAS to IJK matrix.
		 *
		 * @type {Martrix3}
		 */
		this.inverseMatrix = new Matrix3();

		let lowerThreshold = - Infinity;
		Object.defineProperty( this, 'lowerThreshold', {
			get: function () {

				return lowerThreshold;

			},
			/**
			 * The voxels with values under this threshold won't appear in the slices.
			 * If changed, geometryNeedsUpdate is automatically set to true on all the slices associated to this volume.
			 *
			 * @name Volume#lowerThreshold
			 * @type {number}
			 * @param {number} value
			 */
			set: function ( value ) {

				lowerThreshold = value;
				this.sliceList.forEach( function ( slice ) {

					slice.geometryNeedsUpdate = true;

				} );

			}
		} );

		let upperThreshold = Infinity;
		Object.defineProperty( this, 'upperThreshold', {
			get: function () {

				return upperThreshold;

			},
			/**
			 * The voxels with values over this threshold won't appear in the slices.
			 * If changed, geometryNeedsUpdate is automatically set to true on all the slices associated to this volume
			 *
			 * @name Volume#upperThreshold
			 * @type {number}
			 * @param {number} value
			 */
			set: function ( value ) {

				upperThreshold = value;
				this.sliceList.forEach( function ( slice ) {

					slice.geometryNeedsUpdate = true;

				} );

			}
		} );


		/**
		 * The list of all the slices associated to this volume
		 *
		 * @type {Array}
		 */
		this.sliceList = [];

		/**
		 * Whether to use segmentation mode or not.
		 * It can load 16-bits nrrds correctly.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this.segmentation = false;


		/**
		 * This array holds the dimensions of the volume in the RAS space
		 *
		 * @type {Array<number>}
		 */
		this.RASDimensions = [];

	}

	/**
	 * Shortcut for data[access(i,j,k)].
	 *
	 * @param {number} i - First coordinate.
	 * @param {number} j - Second coordinate.
	 * @param {number} k - Third coordinate.
	 * @returns {number} The value in the data array.
	 */
	getData( i, j, k ) {

		return this.data[ k * this.xLength * this.yLength + j * this.xLength + i ];

	}

	/**
	 * Compute the index in the data array corresponding to the given coordinates in IJK system.
	 *
	 * @param {number} i - First coordinate.
	 * @param {number} j - Second coordinate.
	 * @param {number} k - Third coordinate.
	 * @returns {number} The index.
	 */
	access( i, j, k ) {

		return k * this.xLength * this.yLength + j * this.xLength + i;

	}

	/**
	 * Retrieve the IJK coordinates of the voxel corresponding of the given index in the data.
	 *
	 * @param {number} index - Index of the voxel.
	 * @returns {Array<number>} The IJK coordinates as `[x,y,z]`.
	 */
	reverseAccess( index ) {

		const z = Math.floor( index / ( this.yLength * this.xLength ) );
		const y = Math.floor( ( index - z * this.yLength * this.xLength ) / this.xLength );
		const x = index - z * this.yLength * this.xLength - y * this.xLength;
		return [ x, y, z ];

	}

	/**
	 * Apply a function to all the voxels, be careful, the value will be replaced.
	 *
	 * @param {Function} functionToMap A function to apply to every voxel, will be called with the following parameters:
	 * value of the voxel, index of the voxel, the data (TypedArray).
	 * @param {Object} context - You can specify a context in which call the function, default if this Volume.
	 * @returns {Volume} A reference to this instance.
	 */
	map( functionToMap, context ) {

		const length = this.data.length;
		context = context || this;

		for ( let i = 0; i < length; i ++ ) {

			this.data[ i ] = functionToMap.call( context, this.data[ i ], i, this.data );

		}

		return this;

	}

	/**
	 * Compute the orientation of the slice and returns all the information relative to the geometry such as sliceAccess,
	 * the plane matrix (orientation and position in RAS coordinate) and the dimensions of the plane in both coordinate system.
	 *
	 * @param {('x'|'y'|'z')} axis - The normal axis to the slice.
	 * @param {number} RASIndex - The index of the slice.
	 * @returns {Object} An object containing all the useful information on the geometry of the slice.
	 */
	extractPerpendicularPlane( axis, RASIndex ) {

		let firstSpacing,
			secondSpacing,
			positionOffset,
			IJKIndex;

		const axisInIJK = new Vector3(),
			firstDirection = new Vector3(),
			secondDirection = new Vector3(),
			planeMatrix = ( new Matrix4() ).identity(),
			volume = this;

		const dimensions = new Vector3( this.xLength, this.yLength, this.zLength );


		switch ( axis ) {

			case 'x' :
				axisInIJK.set( 1, 0, 0 );
				firstDirection.set( 0, 0, - 1 );
				secondDirection.set( 0, - 1, 0 );
				firstSpacing = this.spacing[ this.axisOrder.indexOf( 'z' ) ];
				secondSpacing = this.spacing[ this.axisOrder.indexOf( 'y' ) ];
				IJKIndex = new Vector3( RASIndex, 0, 0 );

				planeMatrix.multiply( ( new Matrix4() ).makeRotationY( Math.PI / 2 ) );
				positionOffset = ( volume.RASDimensions[ 0 ] - 1 ) / 2;
				planeMatrix.setPosition( new Vector3( RASIndex - positionOffset, 0, 0 ) );
				break;
			case 'y' :
				axisInIJK.set( 0, 1, 0 );
				firstDirection.set( 1, 0, 0 );
				secondDirection.set( 0, 0, 1 );
				firstSpacing = this.spacing[ this.axisOrder.indexOf( 'x' ) ];
				secondSpacing = this.spacing[ this.axisOrder.indexOf( 'z' ) ];
				IJKIndex = new Vector3( 0, RASIndex, 0 );

				planeMatrix.multiply( ( new Matrix4() ).makeRotationX( - Math.PI / 2 ) );
				positionOffset = ( volume.RASDimensions[ 1 ] - 1 ) / 2;
				planeMatrix.setPosition( new Vector3( 0, RASIndex - positionOffset, 0 ) );
				break;
			case 'z' :
			default :
				axisInIJK.set( 0, 0, 1 );
				firstDirection.set( 1, 0, 0 );
				secondDirection.set( 0, - 1, 0 );
				firstSpacing = this.spacing[ this.axisOrder.indexOf( 'x' ) ];
				secondSpacing = this.spacing[ this.axisOrder.indexOf( 'y' ) ];
				IJKIndex = new Vector3( 0, 0, RASIndex );

				positionOffset = ( volume.RASDimensions[ 2 ] - 1 ) / 2;
				planeMatrix.setPosition( new Vector3( 0, 0, RASIndex - positionOffset ) );
				break;

		}

		if ( ! this.segmentation ) {

			firstDirection.applyMatrix4( volume.inverseMatrix ).normalize();
			secondDirection.applyMatrix4( volume.inverseMatrix ).normalize();
			axisInIJK.applyMatrix4( volume.inverseMatrix ).normalize();

		}

		firstDirection.arglet = 'i';
		secondDirection.arglet = 'j';
		const iLength = Math.floor( Math.abs( firstDirection.dot( dimensions ) ) );
		const jLength = Math.floor( Math.abs( secondDirection.dot( dimensions ) ) );
		const planeWidth = Math.abs( iLength * firstSpacing );
		const planeHeight = Math.abs( jLength * secondSpacing );

		IJKIndex = Math.abs( Math.round( IJKIndex.applyMatrix4( volume.inverseMatrix ).dot( axisInIJK ) ) );
		const base = [ new Vector3( 1, 0, 0 ), new Vector3( 0, 1, 0 ), new Vector3( 0, 0, 1 ) ];
		const iDirection = [ firstDirection, secondDirection, axisInIJK ].find( function ( x ) {

			return Math.abs( x.dot( base[ 0 ] ) ) > 0.9;

		} );
		const jDirection = [ firstDirection, secondDirection, axisInIJK ].find( function ( x ) {

			return Math.abs( x.dot( base[ 1 ] ) ) > 0.9;

		} );
		const kDirection = [ firstDirection, secondDirection, axisInIJK ].find( function ( x ) {

			return Math.abs( x.dot( base[ 2 ] ) ) > 0.9;

		} );

		function sliceAccess( i, j ) {

			const si = ( iDirection === axisInIJK ) ? IJKIndex : ( iDirection.arglet === 'i' ? i : j );
			const sj = ( jDirection === axisInIJK ) ? IJKIndex : ( jDirection.arglet === 'i' ? i : j );
			const sk = ( kDirection === axisInIJK ) ? IJKIndex : ( kDirection.arglet === 'i' ? i : j );

			// invert indices if necessary

			const accessI = ( iDirection.dot( base[ 0 ] ) > 0 ) ? si : ( volume.xLength - 1 ) - si;
			const accessJ = ( jDirection.dot( base[ 1 ] ) > 0 ) ? sj : ( volume.yLength - 1 ) - sj;
			const accessK = ( kDirection.dot( base[ 2 ] ) > 0 ) ? sk : ( volume.zLength - 1 ) - sk;

			return volume.access( accessI, accessJ, accessK );

		}

		return {
			iLength: iLength,
			jLength: jLength,
			sliceAccess: sliceAccess,
			matrix: planeMatrix,
			planeWidth: planeWidth,
			planeHeight: planeHeight
		};

	}

	/**
	 * Returns a slice corresponding to the given axis and index.
	 * The coordinate are given in the Right Anterior Superior coordinate format.
	 *
	 * @param {('x'|'y'|'z')} axis - The normal axis to the slice.
	 * @param {number} index - The index of the slice.
	 * @returns {VolumeSlice} The extracted slice.
	 */
	extractSlice( axis, index ) {

		const slice = new VolumeSlice( this, index, axis );
		this.sliceList.push( slice );
		return slice;

	}

	/**
	 * Call repaint on all the slices extracted from this volume.
	 *
	 * @see {@link VolumeSlice#repaint}
	 * @returns {Volume} A reference to this volume.
	 */
	repaintAllSlices() {

		this.sliceList.forEach( function ( slice ) {

			slice.repaint();

		} );

		return this;

	}

	/**
	 * Compute the minimum and the maximum of the data in the volume.
	 *
	 * @returns {Array<number>} The min/max data as `[min,max]`.
	 */
	computeMinMax() {

		let min = Infinity;
		let max = - Infinity;

		// buffer the length
		const datasize = this.data.length;

		let i = 0;

		for ( i = 0; i < datasize; i ++ ) {

			if ( ! isNaN( this.data[ i ] ) ) {

				const value = this.data[ i ];
				min = Math.min( min, value );
				max = Math.max( max, value );

			}

		}

		this.min = min;
		this.max = max;

		return [ min, max ];

	}

}

export { Volume };
