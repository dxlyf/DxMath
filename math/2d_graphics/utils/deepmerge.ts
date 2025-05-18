

function isMergeableObject(value:any) {
	return isNonNullObject(value)
		&& !isSpecial(value)
}

function isNonNullObject(value:any) {
	return !!value && typeof value === 'object'
}

function isSpecial(value:any) {
	var stringValue = Object.prototype.toString.call(value)

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7

function isReactElement(value:any) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}
var defaultIsMergeableObject = isMergeableObject

function emptyTarget(val:any) {
	return Array.isArray(val) ? [] : {}
}



function cloneUnlessOtherwiseSpecified(value:any, options:any) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target:any, source:any, options:any) {
	return target.concat(source).map(function(element:any) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key:any, options:any) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key)
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target:any) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol)
		})
		: []
}

function getKeys(target:any) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target) as any)
}

function propertyIsOnObject(object:any, property:any) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target:any, key:any) {
	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target:any, source:any, options:any) {
	var destination:any= {}
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options)
		})
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options)
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options)
		}
	})
	return destination
}

export interface Options {
    arrayMerge?(target: any[], source: any[], options?: ArrayMergeOptions): any[];
    clone?: boolean;
    customMerge?: (key: string, options?: Options) => ((x: any, y: any) => any) | undefined;
    isMergeableObject?(value: object): boolean;
}
export interface ArrayMergeOptions {
    isMergeableObject(value: object): boolean;
    cloneUnlessOtherwiseSpecified(value: object, options?: Options): object;
}


function deepmerge<T>(target: Partial<T>, source: Partial<T>, options?: Options): T;
function deepmerge<T1, T2>(target: Partial<T1>, source: Partial<T2>, options?: Options&Partial<ArrayMergeOptions>): T1 & T2{
    options = options || {}
	options.arrayMerge = options.arrayMerge || defaultArrayMerge
	options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified

	var sourceIsArray = Array.isArray(source)
	var targetIsArray = Array.isArray(target)
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge?.(target as any, source as any, options as any) as any
	} else {
		return mergeObject(target, source, options)
	}
}



function deepmergeAll (objects: object[], options?: Options): object;
function deepmergeAll<T> (array: Partial<T>[], options?: Options): T{
    if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge<T>(prev, next, options)
	}, {}) as Required<T>
}
deepmerge.all=deepmergeAll;
export default deepmerge;
