import {GUI} from 'lil-gui'
import { useLayoutEffect, useState } from 'react'
export const useGui=()=>{
    const [gui,setGui]=useState<GUI>(()=>new GUI())
    useLayoutEffect(()=>{
        document.body.appendChild(gui.domElement)
        return ()=>{
            gui.destroy()
       
        }
    },[])
    return [gui]
}