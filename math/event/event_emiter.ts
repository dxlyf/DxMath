type EventData={
    [Key:string]:any
}
type ListenerFunc<D extends EventData>=(e:EmitterEvent<D>)=>void
type ListenerObject<D extends EventData>={
    handleEvent(e:EmitterEvent<D>):void
}
type ListenerFuncOrObject<D extends EventData>=ListenerFunc<D>|ListenerObject<D>
type ListenerData<D extends EventData>={
    once:boolean
    listener:ListenerFuncOrObject<D>
}


export class  EmitterEvent<Data extends EventData>{
    static NONE=0
    static AT_TARGET=1
    static BUBBLING_PHASE=2
    static new(type:string,data:any){
        return new this(type,data)
    }
    type:string
    eventPhase:number=EmitterEvent.NONE
    data:Data
    target:EventEmitter<any>|null=null
    currentTarget:EventEmitter<any>|null=null
    composedPath:EventEmitter<any>[]=[]
    bubbles:boolean=true // 是否可以冒泡
    propagationStopped:boolean=false
    immediatePropagationStopped:boolean=false
    constructor(type:string,data:Data){
        this.type=type
        this.data=data
    }
    reset(){
        this.target=null
        this.currentTarget=null
        this.bubbles=true
        this.propagationStopped=false
        this.immediatePropagationStopped=false
        this.composedPath=[]
    }
    stopPropagation(){
        this.propagationStopped=true;
    }
    stopImmediatePropagation(){
        this.propagationStopped=true
        this.immediatePropagationStopped=true
    }
}

type NamespacedType<T extends string> = `${T}.${string}`; // 支持命名空间
type RemoveNamespacedType= `.${string}`; // 支持命名空间

const normalizeType=(typeOrNamespace:string)=>{
    const nsType=typeOrNamespace.split('.')
    const type=nsType.shift()
    const ns=nsType.shift()
    return {
        type,
        ns
    }
}

const isEventEmitter_Property=Symbol('isEventEmitter')
export class EventEmitter<EventListeners extends Record<string,EventData>={}>{
    static createEvent(type:string,data:any){
        return new EmitterEvent(type,data)
    }
    [isEventEmitter_Property]:boolean=true
    parent?:EventEmitter
    listeners:Map<string,ListenerData<EventData>[]>=new Map()
    hasEvent(type:string){
        return this.listeners.has(type)&&this.listeners.get(type)!.length>0
    }
    on<Type extends Extract<keyof EventListeners, string>>(type:Type, listener: ListenerFuncOrObject<EventListeners[Type]>, once: boolean=false): boolean {
        const listeners=this.listeners.get(type)
        const listenerData={
            once,
            listener
        } as ListenerData<EventData>
        if(!listeners){
            this.listeners.set(type,[listenerData])
        }else{
            listeners.push(listenerData)
        }
        return true
    }
    off<Type extends Extract<keyof EventListeners, string>>(type?:Type, listener?: ListenerFuncOrObject<EventListeners[Type]>):boolean{
        if(!type){
            this.listeners.clear()
        }   
        else if(!listener){
            this.listeners.delete(type)
        }else{
            const listeners=this.listeners.get(type)
            if(listeners){
                this.listeners.set(type,listeners.filter(d=>d.listener!==listener))
            }
        }
        return true
    }
    emit(event: EmitterEvent<EventListeners[keyof EventListeners]>): void {
    
        if(event.eventPhase===EmitterEvent.NONE){
            let current=this.parent
            const composedPath:EventEmitter[]=[]
            while(current&&current[isEventEmitter_Property]){
                composedPath.push(current)
                current=current.parent
            }  
            event.eventPhase=EmitterEvent.AT_TARGET
            event.target=this
            event.composedPath=composedPath
        }else{
            event.eventPhase=EmitterEvent.BUBBLING_PHASE
        }
        event.currentTarget=this
        const listeners=this.listeners.get(event.type)
        if(listeners){
            for(let i=0,len=listeners.length;i<len;i++){
                const current=listeners[i]
                if(current.once){
                    this.off(event.type as any,current.listener)
                }
                if((current.listener as ListenerObject<EventData>).handleEvent){
                    (current.listener as ListenerObject<EventData>).handleEvent(event)
                }else{
                    (current.listener as ListenerFunc<EventData>)(event)
                }
                if(event.immediatePropagationStopped){
                    break
                }
            }
        }
        if(event.bubbles&&event.eventPhase===EmitterEvent.AT_TARGET&&!event.propagationStopped){
            const composedPath=event.composedPath
            for(let i=0,len=composedPath.length;i<len;i++){
                composedPath[i].emit(event)
                if(event.propagationStopped){
                    break
                }
            }
        }
        
    }

}
