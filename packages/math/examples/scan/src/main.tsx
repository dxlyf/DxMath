import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {useRoutes,HashRouter} from 'react-router-dom'


createRoot(document.getElementById('root')!).render(
    <HashRouter ><App /></HashRouter>
)
