
export interface ElementProps{

}
export interface IElement<Props extends ElementProps,Data extends {}>{
    data:Data|null
}

export class Element<Props extends ElementProps,Data extends {}> implements IElement<Props,Data>{
    data=null
    constructor(props:ElementProps){
        
    }
}