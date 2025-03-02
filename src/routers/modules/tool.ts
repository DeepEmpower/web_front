/** When your routing table is too long, you can split it into small modules**/

import Layout from '@/layout/index.vue'

const toolRouter = [
  {
    path: '/tool',
    component: Layout,
    redirect: '/tool/translate',
    name: 'tool',
    meta: {
      title: '实用工具',
      icon: 'Tools',
    },
    children: [
      {
        path: '/tool/translate',
        component: () => import('@/views/utilities/translate.vue'),
        name: 'translate',
        meta: { title: '翻译助手', keepAlive: true, icon: 'Tickets' },
      },
      {
        path: '/tool/meeting',
        component: () => import('@/views/utilities/meeting.vue'),
        name: 'meeting',
        meta: { title: '会议编写助手', icon: 'Document' },
      },
      {
        path: '/tool/ppt',
        component: () => import('@/views/utilities/ppt.vue'),
        name: 'ppt',
        meta: { title: 'ppt生成助手', keepAlive: true, icon: 'Postcard' },
      },
      {
        path: '/tool/text',
        component: () => import('@/views/utilities/text.vue'),
        name: 'text',
        meta: { title: '文本润色助手', keepAlive: true, icon: 'Files' },
      }, 
      {
        path: '/tool/speak',
        component: () => import('@/views/utilities/speak.vue'),
        name: 'speak',
        meta: { title: '发言稿撰写助手', keepAlive: true, icon: 'FolderChecked' },
      }
    ],
  },
]

export default toolRouter
