
import {createRoot} from 'react-dom/client'
import App from './app'
import './global.css'
import 'virtual:uno.css'
import {MDXProvider} from '@mdx-js/react'
const root=createRoot(document.getElementById('root')!)
const components:Record<string,React.FunctionComponent<{children:React.ReactElement}>>={
    h1:({children})=>{
        console.log('h1')
        return <h1 className='text-2xl'>{children}</h1>
    }
}
root.render(<MDXProvider components={components} ><App></App></MDXProvider>)