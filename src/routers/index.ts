import { createRouter, createWebHistory, RouteRecordRaw, createWebHashHistory, Router } from 'vue-router'
import Layout from '@/layout/index.vue'
// 扩展继承属性
interface extendRoute {
  hidden?: boolean
}
//
import toolRouter from './modules/tool'
import knowledge from './modules/knowledge'
import managementRouter from './modules/management'
import tenderingRouter from './modules/tendering'


// 异步组件
export const asyncRoutes = [
  ...managementRouter,
  ...knowledge,
  ...tenderingRouter,
  ...toolRouter,
 
]

/**
 * path ==> 路由路径
 * name ==> 路由名称
 * component ==> 路由组件
 * redirect ==> 路由重定向
 * alwaysShow ==> 如果设置为true，将始终显示根菜单，无论其子路由长度如何
 * hidden ==> 如果“hidden:true”不会显示在侧边栏中（默认值为false）
 * keepAlive ==> 设为true 缓存
 * meta ==> 路由元信息
 * meta.title ==> 路由标题
 * meta.icon ==> 菜单icon
 * meta.affix ==> 如果设置为true将会出现在 标签栏中
 * meta.breadcrumb ==> 如果设置为false，该项将隐藏在breadcrumb中（默认值为true）
 * meta.activeMenu ==> 详情页的时候可以设置菜单高亮 ,高亮菜单的path
 */

export const constantRoutes: Array<RouteRecordRaw & extendRoute> = [
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/errorPages/404.vue'),
    hidden: true,
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/errorPages/403.vue'),
    hidden: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    hidden: true,
    meta: { title: '登录' },
  },
  {
    path: '/',
    name: 'layout',
    component: Layout,
    redirect: '/home/idear',
    meta: { title: '出版助手', icon: 'Calendar' },
    children: [
      {
        path: '/home/idear',
        component: () => import('@/views/home/idear.vue'),
        name: 'idear',
        meta: { title: '选题思路', keepAlive: true, icon: 'Notebook' },
      },
      {
        path: '/home/achieve',
        component: () => import('@/views/home/achieve.vue'),
        name: 'achieve',
        meta: { title: '选题实施', icon: 'MenuIcon' },
      },
      {
        path: '/home/examine',
        component: () => import('@/views/home/examine.vue'),
        name: 'examine',
        meta: { title: '审稿', keepAlive: true, icon: 'FolderChecked' },
      },
     
      {
        path: '/home/creativeDrawing',
        component: () => import('@/views/home/creativeDrawing.vue'),
        name: 'creativeDrawing',
        meta: { title: '创意绘图', keepAlive: true, icon: 'SetUp' },
      }, 
      {
        path: '/home/voice',
        component: () => import('@/views/home/voice.vue'),
        name: 'voice',
        meta: { title: '语音生成', keepAlive: true, icon: 'Collection' },
      }, 
    ],
  },
]

/**
 * notFoundRouter(找不到路由)
 */
export const notFoundRouter = {
  path: '/:pathMatch(.*)',
  name: 'notFound',
  redirect: '/404',
}

const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL), // history
  history: createWebHashHistory(), // hash
  routes: constantRoutes,
})

export default router
