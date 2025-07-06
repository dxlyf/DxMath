
import {ProLayout,MenuDataItem,PageContainer,getMenuData,getPageTitle} from '@ant-design/pro-components'
import {useLocation,useOutlet,NavLink} from 'react-router-dom'
import {router} from '../router'
import { useLayoutEffect, useMemo } from 'react'
import {useTitle} from 'ahooks'

const BasicLayout=()=>{
    const location=useLocation()

    const outlet=useOutlet()


    //const route=useMemo(()=>{children:menus},[])
    return <ProLayout title='Map'
    location={location}
    token={{
        'pageContainer':{
            'paddingBlockPageContainerContent':6,
            'paddingInlinePageContainerContent':6
        }
    }}
    route={router}
    splitMenus={true}
    layout="mix"

    menuItemRender={(item,defaultDom)=>{
        return <NavLink to={item.path!}>{defaultDom}</NavLink>
    }}>
       {outlet}
    </ProLayout>
}

export default BasicLayout