export interface EventListener<T=any> {
    (evt: Event<T>): void;
}

interface EventListenerObject<T=any> {
    handleEvent(object: Event<T>): void;
}
interface EventInit {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

interface EventListenerOptions {
    capture?: boolean;
}
type EventListenerOrEventListenerObject<T=any> = EventListener<T> | EventListenerObject<T>;
type EventHandleItem = {
    handle: EventListenerOrEventListenerObject;

} & AddEventListenerOptions

interface AddEventListenerOptions extends EventListenerOptions {
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
}
Element.prototype.dispatchEvent
export class Event<T=any> {
    readonly NONE = 0; // 无事件阶段

    readonly CAPTURING_PHASE = 1; // 捕获阶段
    readonly AT_TARGET = 2;// 目标阶段
    readonly BUBBLING_PHASE = 3;// 冒泡阶段

    public data:T|null=null
    /** 事件类型 */
    public type: string;

    /** 事件是否冒泡 */
    public bubbles: boolean;

    /** 阻止事件冒泡的标志 */
    public cancelBubble: boolean = false;

    /** 事件是否可以取消 */
    public cancelable: boolean;

    /** 事件是否支持跨文档冒泡 */
    public composed: boolean;

    /** 事件是否被默认行为阻止 */
    public defaultPrevented: boolean;

    /** 事件是否由用户操作生成 */
    public isTrusted: boolean;

    /** 事件的目标对象 */
    public target: EventTarget | null;

    /** 当前正在处理事件的对象 */
    public currentTarget: EventTarget | null;

    /** 事件阶段 */
    public eventPhase: number;

    /** 事件的时间戳 */
    public timeStamp: number;
    /**
     * 标记事件是否应该立即停止传播
     */
    public stopImmediatePropagationInternal = false;
    /**
     * 构造函数
     * @param type 事件类型
     * @param eventInitDict 可选的事件初始化字典
     */
    constructor(type: string, eventInitDict?: EventInit) {
        this.type = type;
        this.bubbles = eventInitDict?.bubbles ?? false;
        this.cancelable = eventInitDict?.cancelable ?? false;
        this.composed = eventInitDict?.composed ?? false;
        this.defaultPrevented = false;
        this.isTrusted = false;
        this.target = null;
        this.currentTarget = null;
        this.eventPhase = 0;
        this.timeStamp = Date.now();
    }
    setData(data:T){
        this.data=data;
        return this
    }

    /**
      * 初始化事件对象的属性
      * @param type 事件类型
      * @param bubbles 是否冒泡
      * @param cancelable 是否可以取消
      */
    initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
        this.type = type;
        this.bubbles = bubbles ?? false;
        this.cancelable = cancelable ?? false;
        this.defaultPrevented = false;
    }
    /**
     * 阻止事件冒泡
     */
    stopPropagation(): void {
        this.cancelBubble = true;
    }

    /**
     * 阻止事件的默认行为
     */
    preventDefault(): void {
        if (this.cancelable) {
            this.defaultPrevented = true;
        }
    }

    /**
     * 阻止事件冒泡并停止调用事件监听器
     */
    stopImmediatePropagation(): void {
        this.stopPropagation();
        this.stopImmediatePropagationInternal = true;
    }

    /**
     * 返回事件的目标对象及其祖先对象的路径
     * @returns 事件路径的数组
     */
    composedPath(): EventTarget[] {
        const path: EventTarget[] = [];
        let current = this.target;
        while (current) {
            path.push(current);
            current = current.parentNode; // 假设存在 parentNode 属性
        }
        return path;
    }


}
export class EventTarget<Events extends Record<string,any>=any> {
    private listeners: Map<keyof Events, { capture: EventHandleItem[], bubble: EventHandleItem[] }> = new Map();
    public parentNode: EventTarget | null = null;

    constructor() {

    }
    addEventListener<E extends keyof Events>(type: E, callback: EventListenerOrEventListenerObject<Events[E]>, options?: AddEventListenerOptions | boolean): void {

        const newOptions: AddEventListenerOptions = {
            once: false,
            passive: false,
            capture: false,

        }
        if (typeof options !== 'object' && options !== null) {
            newOptions.capture = !!options
        } else {
            Object.assign(newOptions, options)
        }
        if (!this.listeners.has(type)) {
            this.listeners.set(type, { capture: [], bubble: [] });
        }

        const listenersSet = this.listeners.get(type)!;
        const handleItem: EventHandleItem = {
            ...newOptions,
            handle: callback,
        };
        if (newOptions.capture) {
            listenersSet.capture.push(handleItem);
        } else {
            listenersSet.bubble.push(handleItem);
        }
    }

    dispatchEvent<E extends keyof Events>(event: Event<Events[E]>): boolean {

        event.currentTarget=this
        event.target = this // 设置当前目标为事件分发者
        const path = event.composedPath();
        const captureListeners: EventHandleItem[][] = [];
        const bubbleListeners: EventHandleItem[][] = [];
        const eventPathTarget: EventTarget[] = [];
        for (const target of path) {
            const targetListeners = (target as EventTarget).listeners?.get(event.type);
            if (targetListeners) {
                eventPathTarget.push(target)
                captureListeners.unshift(targetListeners.capture);
                bubbleListeners.push(targetListeners.bubble);
            }
        }
      
   
        let index = eventPathTarget.length - 1
        CaptureAllEvent:
        for (const listeners of captureListeners) {
            const target = eventPathTarget[index--]
            // 设置事件目标为当前捕获阶段的目标元素
            event.target = target
            // 设置事件阶段为捕获阶段
            event.eventPhase = target === this ? event.AT_TARGET : event.CAPTURING_PHASE
            CaptureCurrentEvent:
            for (const listener of listeners) {
                if (typeof listener.handle === "function") {
                    listener.handle.call(this, event);
                } else if (listener.handle && typeof listener.handle.handleEvent === "function") {
                    listener.handle.handleEvent(event);
                }
                if (listener.once) {
                    target.removeEventListener(event.type, listener.handle)
                }
                // 如果事件取消冒泡，则不再继续向上传播
                if (event.stopImmediatePropagationInternal) {
                    break
                }
            }
            // 如果事件取消冒泡，则不再继续向下传播
            if (event.cancelBubble) {
                break CaptureAllEvent;
            }
        }

        // Bubble phase
        if (!event.cancelBubble) {
            let index = 0
            BubbleAllEvent:
            for (const listeners of bubbleListeners) {
                const target = eventPathTarget[index++]
                event.target = target
                event.eventPhase = target === this ? event.AT_TARGET : event.BUBBLING_PHASE
                BubbleCurrentEvent:
                for (const listener of listeners) {
                    if (typeof listener.handle === "function") {
                        listener.handle.call(this, event);
                    } else if (listener.handle && typeof listener.handle.handleEvent === "function") {
                        listener.handle.handleEvent(event);
                    }
                    if (listener.once) {
                        target.removeEventListener(event.type, listener.handle)
                    }
                    if (event.stopImmediatePropagationInternal) {
                        break
                    }
                }
                if (event.cancelBubble||!event.bubbles) {
                    break;
                }
            }
        }

        event.eventPhase = event.NONE; // NONE
        return !event.defaultPrevented;
    }

    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
        if (!callback || !this.listeners.has(type)) return;

        const capture = typeof options === "boolean" ? options : options?.capture ?? false;
        const listenersSet = this.listeners.get(type)!;

        if (capture) {
            listenersSet.capture = listenersSet.capture.filter(listener => listener.handle !== callback);
        } else {
            listenersSet.bubble = listenersSet.bubble.filter(listener => listener.handle !== callback);
        }

        if (listenersSet.capture.length === 0 && listenersSet.bubble.length === 0) {
            this.listeners.delete(type);
        }
    }
}