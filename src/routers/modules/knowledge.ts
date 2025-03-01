/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout/index.vue'

const knowledgeRouter = [
  {
    path: '/knowledge',
    component: Layout,
    redirect: '/knowledge/super',
    name: 'knowledge',
    meta: {
      title: '知识查询',
      icon: 'Reading',
    },
    children: [
      {
        path: '/knowledge/super',
        component: () => import('@/views/knowledge/super.vue'),
        name: 'super',
        meta: { title: '超级知识助手', keepAlive: true, icon: 'Star' },
      },
      {
        path: '/knowledge/industryStandard',
        component: () => import('@/views/knowledge/industryStandard.vue'),
        name: 'industryStandard',
        meta: { title: '行业规范助手', icon: 'ScaleToOriginal' },
      },
      {
        path: '/knowledge/fnancial',
        component: () => import('@/views/knowledge/fnancial.vue'),
        name: 'fnancial',
        meta: { title: '财务知识助手', keepAlive: true, icon: 'Finished' },
      },
      {
        path: '/knowledge/legal',
        component: () => import('@/views/knowledge/legal.vue'),
        name: 'legal',
        meta: { title: '法律知识助手', keepAlive: true, icon: 'UserFilled' },
      }, 
    ],
  },
]

export default knowledgeRouter
