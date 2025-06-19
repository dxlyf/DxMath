
import {computed,reactive,effect,effectScope,getCurrentScope,onScopeDispose} from '../data/reactivity'


export const useElementResize=(owner=window)=>{
    const state=reactive({width:0,height:0})

    const resize=()=>{
        state.width=owner.innerWidth
        state.height=owner.innerHeight
    }
    window.addEventListener('resize',resize)
    onScopeDispose(()=>{
        window.removeEventListener('resize',resize)
    })
    return state
}

export const useResize=(owner=window)=>{
    const state=reactive({width:owner.innerWidth,height:owner.innerHeight})

    let time:any=null

    const resize=()=>{
        state.width=owner.innerWidth
        state.height=owner.innerHeight
        
    }
    const handleResize=()=>{
        if(time){
            clearTimeout(time)
        }
        time=setTimeout(resize,300)
      //  requestAnimationFrame(resize)
    }
    window.addEventListener('resize',handleResize)
   
    onScopeDispose(()=>{
        window.removeEventListener('resize',handleResize)
    })
    return state
}