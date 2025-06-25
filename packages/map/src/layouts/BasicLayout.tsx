
import {ProLayout} from '@ant-design/pro-components'
import {useLocation,useOutlet,NavLink} from 'react-router-dom'
import {routes} from '../router'
import { useMemo } from 'react'

const menus={
    children:routes
}
const BasicLayout=()=>{
    const outlet=useOutlet()
    //const route=useMemo(()=>{children:menus},[])
    return <ProLayout title='Map'  route={menus} layout="mix" menuItemRender={(item,defaultDom)=>{
       
        return <NavLink to={item.path!}>{defaultDom}</NavLink>
    }}>
        {outlet}
    </ProLayout>
}

export default BasicLayout