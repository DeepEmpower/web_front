import request from './request'

interface LegalChatRequest {
  question: string;
  stream: boolean;
  session_id: string;
}

interface LegalChatResponse {
  answer: string;
}

// 法律知识助手API
export const getLegalAssistantResponse = (data: LegalChatRequest) => {
  return request({
    url: '/legal/api/v1/chats/21ce1968f6b011ef81330242ac120006/completions',
    method: 'post',
    headers: {
      'Authorization': 'Bearer ragflow-IzNTVmYjFjZjZhMDExZWZiYjU3MDI0Mm'
    },
    data
  })
}

// 创建新的会话
export const createLegalSession = () => {
  // 这里可以添加创建新会话的逻辑，如果需要的话
  return '21c7edbaf6b311efa5110242ac120006' // 暂时返回固定的session_id
} 