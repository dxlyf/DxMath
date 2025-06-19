
export interface ApplicationOptions{
    container:HTMLDivElement; // 根元素，监听事件的元素
}
/**
 * 舞台类，用于管理所有的元素的任务和调度
 */
export class Application{
    domElement:HTMLDivElement 
    constructor(opts:ApplicationOptions){
        const {container} = opts;
        this.domElement = container;
    }
    async initialize(){
        // 初始化逻辑
    }
}