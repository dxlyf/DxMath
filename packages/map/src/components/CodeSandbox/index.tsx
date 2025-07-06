
import { Sandpack, SandpackProps } from '@codesandbox/sandpack-react'
import { useMemo } from 'react'
// import mapbox_lib from '../../../../../node_modules/mapbox-gl/dist/mapbox-gl.js?raw'
import css from 'mapbox-gl/dist/mapbox-gl.css?raw'

const getCustomSetup = (map: string) => {
  let dependencies: any = {}
  switch (map) {
    case 'mapbox':
      dependencies['mapbox-gl'] = '1.13.0'
      break;
    case 'maplibre':
      dependencies['maplibre-gl'] = '5.6.0'
      break;
      case 'ol':
        dependencies['ol'] = '10.6.1'
        break;
  }
  return {
    dependencies: dependencies
  } as NonNullable<SandpackProps['customSetup']>

}
export default (props: { code: string, map?: 'mapbox' | 'maplibre' | 'ol' }) => {
  const { code, map='mapbox'} = props
  const customSetup = useMemo(() => getCustomSetup(map), [])
  const files = useMemo(() => {
    return {
      //'/node_modules/mapbox-gl/dist/mapbox-gl.css':css,

      // '/node_modules/mapbox-gl/index.js':{
      //   code:mapbox_lib
      // },
      // '/node_modules/mapbox-gl/package.json':JSON.stringify({
      //     name:'mapbox-gl',
      //     version:'1.13.0',
      //     'main':'index.js',
      // }),
      '/App.tsx': {
        code: code,
        active: true
      }
    } as NonNullable<SandpackProps['files']>
  }, [code])
  return <>
    <Sandpack template='react-ts' customSetup={customSetup} files={files} options={{
      classes: {
        "sp-wrapper": "app-map-wrapper",
        "sp-layout": "app-map-layout",
        "sp-tab-button": "app-map-tab",
        'sp-editor': 'app-map-editor'
      },
      //    layout: "console", // preview | tests | console,
      showTabs: true,
      showLineNumbers: true, // default - true
      showInlineErrors: true, // default - false
      wrapContent: true, // default - false
      editorHeight: window.innerHeight - 70, // default - 300
      editorWidthPercentage: 50, // default - 50
      //resizablePanels:true
    }}>
    </Sandpack>
  </>
}