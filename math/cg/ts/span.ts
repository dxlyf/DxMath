export class Span{
    x:int=0
    len:int=0
    y:int=0
    coverage:uchar=0

    clone(){
        return new Span().copy(this)
    }
    copy(source:Span){
        this.x=source.x
        this.len=source.len
        this.y=source.y
        this.coverage=source.coverage
        return this
    }
}