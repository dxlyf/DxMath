

import {computed,reactive,effect,effectScope,getCurrentScope,onScopeDispose} from '../data/reactivity'


export * from './useResize'
export const use=(fn:()=>()=>void)=>{

    const scope=effectScope()
    scope.run(()=>{
        console.log('fffff')
        const render=fn()
        effect(()=>{
            console.log('ffffffffffffffff')
            render()
        })
    })
    return ()=>{
        scope.stop()
    }
}