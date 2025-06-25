
import Map from 'ol/Map'
import View from 'ol/View'
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import ImageWMS from 'ol/source/ImageWMS';
import TileSource from 'ol/source/Tile'
import OSM from 'ol/source/OSM'
import TileWMS from 'ol/source/TileWMS';
import {useSize} from 'ahooks'
import { useLayoutEffect, useRef } from 'react'
import 'ol/ol.css'
 const Basic=()=>{
    const container=useRef<HTMLDivElement>(null)
    useLayoutEffect(()=>{
            const map=new Map({
                target:container.current!,
                layers:[
                    new TileLayer({
                        source: new OSM(),
                    }),
    
                    new TileLayer({
                        extent: [-13884991, 2870341, -7455066, 6338219],
                        source: new TileWMS({
                          url: 'https://ahocevar.com/geoserver/wms',
                          params: {'LAYERS': 'topp:states', 'TILED': true},
                          serverType: 'geoserver',
                          // Countries have transparency, so do not fade tiles:
                          transition: 0,
                        }),
                      }),
                ],
                
                view:new View({
                    center: [-10997148, 4569099],
                    zoom:4
                })
            })
            return ()=>{
                map.dispose()
            }
    },[])
    return <div ref={container} className='w-full h-full map box-border'></div>
}
export default Basic