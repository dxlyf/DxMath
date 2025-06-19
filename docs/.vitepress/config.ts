import { defineConfig } from 'vitepress'

export default defineConfig({
    themeConfig: {
        nav: [
            { text: '2d图形', 
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
        sidebar: [
            {
                text: 'Introduction',
                items: [
                { text: 'Overview', link: '/guide/overview' },
                { text: 'Getting Started', link: '/guide/getting-started' }
                ]
            },
            {
                text: 'Mathematical Concepts',
                items: [
                { text: 'Vectors', link: '/guide/vectors' },
                { text: 'Matrices', link: '/guide/matrices' },
                { text: 'Transformations', link: '/guide/transformations' }
                ]
            }
        ]
    }
})