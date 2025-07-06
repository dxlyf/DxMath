import {createHashRouter, RouteObject,RouterProvider,Navigate} from 'react-router-dom'
import React from 'react'
import {getMenuData} from '@ant-design/pro-components' 
import type {  Route,MenuDataItem} from '@ant-design/pro-layout/lib/typing';
import CodeSandbox from 'src/components/CodeSandbox'

/**********mapbox examples************ */
import mapbox_sources_geojson from 'src/pages/mapbox/examples/sources/geojson?raw'

// maplibre_sources_geojson
import maplibre_sources_geojson from 'src/pages/maplibre/examples/sources/geojson?raw'

type RouteMenuItem=Omit<RouteObject,'children'>&Omit<Route,'children'>&{
    children?:RouteMenuItem[]
}
const routes: RouteMenuItem[] = [
    {
        path:'/',
        Component:React.lazy(()=>import('src/layouts/BasicLayout')),
        flatMenu:true,
        children:[{
            key:'ol',
             name:'OpenLayer',
             path:'ol',
             children:[
                {index:true,element:<Navigate to={'/ol/index'}></Navigate>},
                {
                    path:'index',
                    name:'入门',
                    Component:React.lazy(()=>import('src/pages/ol'))
                },
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
            children:[
               {index:true,element:<Navigate to={'/mapbox/index'}></Navigate>},
               {
                name:'入门',
                path:'index',
                Component:React.lazy(()=>import('src/pages/mapbox/index'))
               },
               {
                name:'文档',
                path:'docs',
                children:[
                  {
                    path:'map',
                    name:'map',
                    Component:React.lazy(()=>import('src/pages/mapbox/docs/Map/index.md'))
                  }
                ]
               },
               {
                name:'示列',
                path:'examples',
                children:[
                   {
                    name:'数据源',
                    path:'sources',
                    children:[
                      {
                        path:'canvas',
                        name:'canvas',
                        element:<CodeSandbox code={mapbox_sources_geojson}></CodeSandbox>
                      },  {
                        path:'geojson',
                        name:'geojson',
                        element:<CodeSandbox code={mapbox_sources_geojson}></CodeSandbox>
                      }
                    ]
                   }
                ],
               }
            ]
       },{
        name:'Maplibre',
        path:'maplibre',
        children:[
          {
            name:'示列',
            path:'examples',
            children:[
               {
                name:'数据源',
                path:'sources',
                children:[
                  {
                    path:'canvas',
                    name:'canvas',
                    element:<CodeSandbox map='maplibre' code={maplibre_sources_geojson}></CodeSandbox>
                  },  {
                    path:'geojson',
                    name:'geojson',
                    element:<CodeSandbox map='maplibre' code={maplibre_sources_geojson}></CodeSandbox>
                  }
                ]
               }
            ]
          }
        ]

       },{
        name:'Leaflet',
        path:'leaflet',
        children:[
        
        ]
         }]  
    }
]

// export const {menuData,breadcrumb,breadcrumbMap}=getMenuData(routes,{locale:false})

export const router=createHashRouter(routes as RouteObject[])

export const AppRouter=()=>{

    return <RouterProvider router={router} ></RouterProvider>
}
