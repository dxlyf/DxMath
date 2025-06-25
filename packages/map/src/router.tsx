import {createHashRouter, RouteObject,RouterProvider} from 'react-router-dom'
import React from 'react'
import type {  Route,MenuDataItem} from '@ant-design/pro-layout/lib/typing';

type RouteMenuItem=Omit<RouteObject,'children'>&Omit<Route,'children'>&{
    children?:RouteMenuItem[]
}
export const routes: RouteMenuItem[] = [
    {
        path:'/',
        Component:React.lazy(()=>import('src/layouts/BasicLayout')),
        flatMenu:true,
        children:[{
             name:'OL',
             path:'ol',
             icon:<>🍎</>,

             children:[
                {index:true,Component:React.lazy(()=>import('src/pages/ol'))},
                {
                    name:'示例',
                    path:'examples',
                    
                    children:[{
                        path:'image-wsm',
                        name:'image-wms',
                        Component:React.lazy(()=>import('src/pages/ol/examples/image-wms'))
                    },{
                        path:'tile-wms',
                        name:'tile-wms',
                        Component:React.lazy(()=>import('src/pages/ol/examples/tile-wms'))
                    }]
                }
             ]
        },{
            name:'Mapbox',
            path:'mapbox',
            icon:<>🍎</>,
            children:[
               {index:true,Component:React.lazy(()=>import('src/pages/ol'))}
            ]
       },{
        name:'Leaflet',
        path:'leaflet',
        icon:<>🍎</>,
        children:[
           {index:true,Component:React.lazy(()=>import('src/pages/ol'))}
        ]
   }]  
    }
]


export const router=createHashRouter(routes as RouteObject[])

export const AppRouter=()=>{

    return <RouterProvider router={router} ></RouterProvider>
}
