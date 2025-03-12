/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout/index.vue'

const tenderingRouter = [
  {
    path: '/tendering',
    component: Layout,
    redirect: '/tendering/strategy',
    name: 'projectManagement',
    meta: {
      title: '项目管理',
      icon: 'Notebook',
    },
    children: [
      {
        path: '/tendering/strategy',
        component: () => import('@/views/tendering/strategy.vue'),
        name: 'strategy',
        meta: { title: '战略分析', keepAlive: true, icon: 'Rank' },
      },
      {
        path: '/tendering/product',
        component: () => import('@/views/tendering/product.vue'),
        name: 'product',
        meta: { title: '产品管理', icon: 'Goods' },
      },
      {
        path: '/tendering/copyright',
        component: () => import('@/views/tendering/copyright.vue'),
        name: 'copyright',
        meta: { title: '版权合同', icon: 'Document' },
      }
    ],
  },
]

export default tenderingRouter
