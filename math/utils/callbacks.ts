
type Options={
   // 记忆内存
   memory?:boolean // 是否记忆上次结果

   once?:boolean // 是否只执行一次
   unique?:boolean // 添加唯一性
   stopOnFalse?:boolean // 执行到第一个返回false时停止


}
type Callback<P extends any[]>=(result:T)=>void
export class Callbacks<T,P extends any[]>{
    private options:Options
    private callbacks:Callback[]=[]
    private fired:boolean=false
    private locked:boolean=false // 不能add,可以fire
    private disabled:boolean=false // 不能fire,不能add
    private lastArgs:p|null=null
    constructor( options:Options={}){
        this.options={
            memory:false,
            once:false,
            ...options,
        }
    }
    remove(...callbacks:Callback[]){
        if(this.disabled||this.locked){
            return
        }
        this.callbacks=this.callbacks.filter(callback=>{
            return !callbacks.includes(callback)
        })
    }
    add(...callbacks:Callback[]){
        if(this.locked||this.disabled){
            return
        }
        if(this.options.memory&&this.lastArgs!==null){
            callbacks.forEach((cb)=>{
                 cb(...this.lastArgs)
            })
        }
        this.callbacks.push(...callbacks)
    }
    lock(){
        this.locked=true
    }
    disable(){
        this.disabled=true
    }
    private fire(...args:P){
        this.callbacks.forEach(callback=>{
            callback(...args)
        })
        if(this.options.memory){
            this.lastArgs=args
        }else{
            this.lastArgs=null
        }
        this.fired=true
    }
    emit(...args:P){
        if(this.options.once&&this.fired||this.disabled){
            return
        }
        this.fire(...args)
    }
}