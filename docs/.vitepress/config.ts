import { defineConfig } from 'vitepress'

export default defineConfig({
    themeConfig: {
        nav: [
            {   text: 'ThreeJS', 
                items:[
                    {
                        text:'快捷操作',
                        link:'/blender/shortcut_keys'
                    }
                ]
             },{   text: 'Blender', 
                items:[
                    {
                        text:'快捷操作',
                        link:'/blender/shortcut_keys'
                    }
                ]
             },{   text: 'GIS', 
                items:[
                    {
                        text:'ol',
                        link:'/gis/ol'
                    },{
                        text:'mapbox',
                        link:'/gis/mapbox'
                    }
                ]
             },
            { text: '2D图形', 
                items:[
                    {
                        text:'面积计算',
                        link:'/graphics/area'
                    },{
                        text:'光栅化',
                        link:'/graphics/rasterization'
                    }
                ]
             },
            { text: 'Guide', link: '/guide/' },
            { text: 'API Reference', link: '/api/' }
        ],
        sidebar:{
            'blender':[
                {
                    text:'快捷操作',
                    link:'/blender/shortcut_keys'

                }
            ]
        }
        // sidebar: [
        //     {
        //         text: 'Introduction',
        //         items: [
        //         { text: 'Overview', link: '/guide/overview' },
        //         { text: 'Getting Started', link: '/guide/getting-started' }
        //         ]
        //     },
        //     {
        //         text: 'Mathematical Concepts',
        //         items: [
        //         { text: 'Vectors', link: '/guide/vectors' },
        //         { text: 'Matrices', link: '/guide/matrices' },
        //         { text: 'Transformations', link: '/guide/transformations' }
        //         ]
        //     }
        // ]
    }
})