import React, { useState } from "react"
import Canvas, { CanvasExpose } from "../../components/Canvas"

const width=640,height=640

// 64 x 64 = 4096. Each of the 4096 unsigned integers is an 8x8 grid
let CoverageTable=Array.from({
    length:64
},()=>{
    return new BigUint64Array(64);
}); 
 
function SetPixelInBitset(r:number,c:number,x:number, y:number) {
    let bit = y * 8 + x;
    CoverageTable[r][c] |= (1n << BigInt(bit));
}
 
function GetPixelInBitset(bitset:bigint, x:number, y:number) {
    let bit = y * 8 + x;
    return (bitset&(1n << BigInt(bit))) != 0n;
}
function InitCoverageTable() {
    // Draw lines
    for (let outer = 0; outer < 64; ++outer) {
        for (let inner = 0; inner < 64; ++inner) {
            CoverageTable[outer][inner] = 0n;
 
            let x0 = outer % 8;
            let y0 = (outer / 8)>>0;
            let x1 = inner % 8;
            let y1 = (inner / 8)>>0;
 
            let dx = Math.abs(x1 - x0);
            let dy = Math.abs(y1 - y0);
 
            let xStep = x0 < x1 ? 1 : -1;
            let yStep = y0 < y1 ? 1 : -1;
 
            let error = 0;
 
            if (dx > dy) {
                let m = 2 * dy;
                let scale = 2 * dx;
                for (let x = x0, y = y0; x != x1 + xStep; x += xStep) {
                    SetPixelInBitset(outer,inner, x, y);
 
                    error += m;
                    if (error >= dx) {
                        y += yStep;
                        error -= scale;
                    }
                }
            }
            else {
                let m = 2 * dx;
                let scale = 2 * dy;
                for (let y = y0, x = x0; y != y1 + yStep; y += yStep) {
                    SetPixelInBitset(outer,inner, x, y);
 
                    error += m;
                    if (error >= dy) {
                        x += xStep;
                        error -= scale;
                    }
                }
            }
        }
    }
 
    // Flood fill right
    for (let outer = 0; outer < 64; ++outer) {
        for (let inner = 0; inner < 64; ++inner) {
            for (let y = 0; y < 8; ++y) {
                let fill = false;
                for (let x = 0; x < 8; ++x) {
                    if (fill) {
                        SetPixelInBitset(outer,inner, x, y);
                    }
                    if (GetPixelInBitset(CoverageTable[outer][inner], x, y)) {
                        fill = true;
                    }
                }
            }
        }
    }
}
InitCoverageTable()

function Td(props:{value:bigint,r:number,c:number,onClick:(r:number,c:number)=>void}){
    const {r,c,onClick}=props

    return <td onClick={(e)=>{
        onClick(r,c)
        e.stopPropagation()
    }} key={c} className="coverageTable_cell" style={{
        width:10,
        height:10,
        position:'relative',
    }}>

    </td>
 
}
function toStr(value:bigint){
    let str:string[]=[]
    for(let i=0n;i<64n;i++){
        if(value&(1n<<i)){
            str.push('1')
        }else{
            str.push('0')
        }
    }
    return str.join('').replace(/(\d{1,8})(?=(\d{8})+$)/g,'$& ')
}
function Dialog({r,c,value}:{r:number,c:number,value:bigint}){
    let x0 = r % 8;
    let y0 = (r / 8)>>0;
    let x1 = c % 8;
    let y1 = (c / 8)>>0;

    const elements:React.ReactNode[]=[]
    for(let y=0;y<8;y++){
        const chilren:React.ReactNode[]=[]

        for(let x   =0;x<8;x++){
            let cover=GetPixelInBitset(CoverageTable[r][c],x,y)
            chilren.push(<td key={x} style={{width:50,height:50,background:cover?'red':'#fff'}}>({x},{y})</td>)
        }
        elements.push(<tr key={y} style={{display:'flex'}}>{chilren}</tr>)

    }
    return <div style={{position:'absolute',background:'#fff',top:'100px',left:'50%',transform:'translateX(-50%)',padding:10}}>
        <h3>({c},{r})</h3>
        <div>({x0},{y0}) to ({x1},{y1})</div>
        <div>value: {value.toString()}</div>
        <div>{toStr(value)}</div>
        <table className='coverage_subtable'>
            <tbody>
            {elements}
            </tbody>
        </table>
    </div>
}
export default () => {

     const [visible,setVisible]=useState(false)
     const [value,setValue]=useState(0n)
    const [state,setState]=useState({r:0,c:0,value:0n})
    return <div onClick={()=>{
        setVisible(false)
    }}>
        <table className="coverageTable" style={{width:width,height:height}}>
          <tbody>
        {
            CoverageTable.map((d,r)=>{
                return <tr key={r}>{Array.from(d).map((v,c)=>{
                   return <Td  key={c} c={c} r={r} value={v} onClick={(r,c)=>{
                    setVisible(true)
                    setState({
                        r,
                        c,
                        value:CoverageTable[r][c]
                    })
                   }}>
                    </Td>
                })}</tr>
            })
        }
        </tbody>
    </table>
    {visible&&<Dialog  value={state.value} r={state.r} c={state.c}></Dialog>}
    </div>
}