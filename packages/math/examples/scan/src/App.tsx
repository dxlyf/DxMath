import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, ComponentType, Suspense } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import {useRoutes,BrowserRouter, useNavigate, RouteObject,useLocation,useMatch} from 'react-router-dom'
import SvgCmd from './pages/svgcmd'
const loadLazyComponent = (p: () => Promise<{ default: ComponentType }>) => {
  const LazyComponent = React.lazy(p);
  return <Suspense fallback={<div>加载中...</div>}>
     <LazyComponent></LazyComponent>
  </Suspense>
}

function App() {
  const local=useLocation()
 
   const nav=useNavigate()
   const routes=useMemo(()=>[
    {
      path: '/svg',
      title:'svg命令',
      element: <SvgCmd></SvgCmd>,
    },   {
      path: '/raster3d',
      title:'raster3d',

      element:loadLazyComponent(()=>import('./pages/raster_3d')),
    },
    {
      path: '/raster',
      title:'raster',

      element:loadLazyComponent(()=>import('./pages/raster')),
    },
    {
      path: '/path',
      title:'path',
      element:loadLazyComponent(()=>import('./pages/path')),
    },
    {
      path: '/scan/ddaline',
      title:'ddaline',
      element:loadLazyComponent(()=>import('./pages/scan/ddaline')),
    },
    {
      path: '/scan/BresenhamLine',
      title:'BresenhamLine',
      element:loadLazyComponent(()=>import('./pages/scan/BresenhamLine')),
    },
    {
      path: '/scan/ellipse',
      title:'ellipse',
      element:loadLazyComponent(()=>import('./pages/scan/ellipse')),
    },  {
      path: '/scan/polygon',
      title:'polygon',
      element:loadLazyComponent(()=>import('./pages/scan/polygon')),
    },  {
      path: '/scan/polygon4',
      title:'polygon4',
      element:loadLazyComponent(()=>import('./pages/scan/polygon4')),
    },
    {
      path: '/scan/canvaskit',
      title:'canvaskit',
      element:loadLazyComponent(()=>import('./pages/canvaskit')),
    }
  ] as RouteObject[],[])

  const element = useRoutes(routes);
  return (
    <div className='app'>
   
      <select defaultValue={local.pathname} onChange={(e)=>{
          nav(e.target.value)
      }}>{routes.map((d,i)=><option key={i} value={d.path}>{d.title}</option>)}</select>
      {element}
    </div>
  )
}

export default App
