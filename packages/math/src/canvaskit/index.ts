import CanvasKitInit from 'canvaskit-wasm'
import CanvasKitInitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'

export let CanvasKit: any = null
export const initializeCanvasKit = async () => {
    if (CanvasKit) return CanvasKit
    CanvasKit= await CanvasKitInit({
        locateFile: (file) => {
            if (file === 'canvaskit.wasm') return CanvasKitInitWasmUrl
            else return file
        },
    })
    return CanvasKit
}
