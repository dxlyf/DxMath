
export interface StateOptions{
    container:HTMLDivElement; // 根元素，监听事件的元素
}
/**
 * 舞台类，用于管理所有的元素的任务和调度
 */
export class Stage{
    domElement:HTMLDivElement 
    constructor(opts:StateOptions){
        const {container} = opts;
        this.domElement = container;
    }

}