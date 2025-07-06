import { Map, NavigationControl, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useLayoutEffect, useRef } from 'react'


export default () => {
    const containerRef = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
        const map = new Map({
            container: containerRef.current!,
            style: 'https://demotiles.maplibre.org/style.json', // style URL
            center: [116.4, 39.9], // 初始中心点（北京坐标）
            zoom: 1, // 缩放级别

        })
        // 添加标记点
        new Marker()
            .setLngLat([116.4, 39.9])
            .addTo(map);

        // 添加缩放和旋转控件
        map.addControl(new NavigationControl());

        // 点击地图时显示坐标
        map.on('click', (e) => {
            alert(`点击位置坐标: ${e.lngLat.lng}, ${e.lngLat.lat}`);
        });
    }, [])
    return <div ref={containerRef} style={{height:'100vh'}}></div>
}