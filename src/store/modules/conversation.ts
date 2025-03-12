// 会话状态管理模块，用于保存不同助手的对话历史
import { defineStore } from 'pinia';

// 定义聊天消息的数据结构
export interface ChatMessage {
  role: string;
  content: string;
  reasoningContent?: string;
  id?: string;
  url?: string;
}

// 定义标签页的数据结构
export interface TabData {
  title: string;
  messages: ChatMessage[];
  input: string;
}

// 定义会话状态的数据结构
interface ConversationState {
  // 按助手类型存储会话列表
  conversations: Record<string, {
    // 每个助手存储多个tab的会话
    tabs: Record<string, TabData>;
    // 记录当前激活的标签页
    activeTab: string;
  }>;
  // 记录当前激活的助手
  activeAssistant: string;
}

export const useConversationStore = defineStore('conversation', {
  // 状态
  state: (): ConversationState => ({
    conversations: {},
    activeAssistant: '',
  }),
  
  // 操作
  actions: {
    // 初始化助手会话
    initAssistant(assistantType: string) {
      if (!assistantType) {
        console.warn('尝试初始化空助手类型');
        return;
      }
      
      if (!this.conversations[assistantType]) {
        this.conversations[assistantType] = {
          tabs: {},
          activeTab: '1'
        };
      }
      this.activeAssistant = assistantType;
    },
    
    // 初始化标签页
    initTab(assistantType: string, tabName: string, tabTitle: string) {
      if (!assistantType) {
        console.warn('尝试初始化空助手类型的标签页');
        return;
      }
      
      this.initAssistant(assistantType);
      
      if (!this.conversations[assistantType].tabs[tabName]) {
        this.conversations[assistantType].tabs[tabName] = {
          title: tabTitle,
          messages: [],
          input: ''
        };
      }
    },
    
    // 更新标签页标题
    updateTabTitle(assistantType: string, tabName: string, title: string) {
      if (this.conversations[assistantType]?.tabs[tabName]) {
        this.conversations[assistantType].tabs[tabName].title = title;
      }
    },
    
    // 保存消息
    saveMessages(assistantType: string, tabName: string, messages: ChatMessage[]) {
      if (!assistantType || !tabName) {
        console.warn('尝试保存消息到空助手或标签页', assistantType, tabName);
        return;
      }
      
      if (this.conversations[assistantType]?.tabs[tabName]) {
        this.conversations[assistantType].tabs[tabName].messages = [...messages];
      }
    },
    
    // 保存输入框内容
    saveInput(assistantType: string, tabName: string, input: string) {
      if (this.conversations[assistantType]?.tabs[tabName]) {
        this.conversations[assistantType].tabs[tabName].input = input;
      }
    },
    
    // 添加消息
    addMessage(assistantType: string, tabName: string, message: ChatMessage) {
      if (this.conversations[assistantType]?.tabs[tabName]) {
        this.conversations[assistantType].tabs[tabName].messages.push(message);
      }
    },
    
    // 设置当前激活的标签页
    setActiveTab(assistantType: string, tabName: string) {
      if (this.conversations[assistantType]) {
        this.conversations[assistantType].activeTab = tabName;
      }
    },
    
    // 删除标签页
    removeTab(assistantType: string, tabName: string) {
      if (this.conversations[assistantType]?.tabs[tabName]) {
        delete this.conversations[assistantType].tabs[tabName];
      }
    },
    
    // 获取当前助手的当前标签页的消息
    getMessages(assistantType: string, tabName: string): ChatMessage[] {
      return this.conversations[assistantType]?.tabs[tabName]?.messages || [];
    },
    
    // 获取当前助手的当前标签页的输入内容
    getInput(assistantType: string, tabName: string): string {
      return this.conversations[assistantType]?.tabs[tabName]?.input || '';
    },
    
    // 获取当前助手的所有标签页
    getTabs(assistantType: string): Record<string, TabData> {
      return this.conversations[assistantType]?.tabs || {};
    },
    
    // 获取当前助手的当前激活标签页
    getActiveTab(assistantType: string): string {
      return this.conversations[assistantType]?.activeTab || '1';
    },
    
    // 清空所有数据(用于调试)
    clearAll() {
      this.conversations = {};
      this.activeAssistant = '';
      console.log('会话数据已清空');
    }
  },
  
  // 持久化配置
  persist: {
    key: 'assistant-conversations',
    storage: window.localStorage,
  }
}); 