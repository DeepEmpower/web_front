/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout/index.vue'

const tenderingRouter = [
  {
    path: '/tendering',
    component: Layout,
    redirect: '/tendering/integration',
    name: 'integration',
    meta: {
      title: '招投标助手',
      icon: 'Notebook',
    },
    children: [
      {
        path: '/tendering/integration',
        component: () => import('@/views/tendering/integration.vue'),
        name: 'integration',
        meta: { title: '招标信息整理', keepAlive: true, icon: 'MessageBox' },
      },
      {
        path: '/tendering/document',
        component: () => import('@/views/tendering/document.vue'),
        name: 'document',
        meta: { title: '标书辅助撰写', icon: 'document' },
      }
    ],
  },
]

export default tenderingRouter
