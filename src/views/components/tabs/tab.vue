<template>
    <el-tabs v-model="editableTabsValue" type="card" tab-position="top"  editable class="chat-tabs" @edit="handleTabsEdit" >
      <el-tab-pane v-for="(item,index) in editableTabs" :key="item.name" :label="item.title" :name="item.name"   :closable="index>0">
        <div class="right" :style="{ height: contentHeight + 'px' }">
          <div class="right-top">
            <!-- 动态绑定 ref 并传递对应 Tab 的聊天数据 -->
            <Chat
              :ref="(el) => setChatRef(el, item.name)"
              :chatData="chatData[item.name] || []"
            ></Chat>
          </div>
          <div class="right-bottom">
            <el-input v-model="chatValue[item.name]" :rows="2" type="textarea" placeholder="请输入您的问题" />
            <el-button @click="stopFetch" class="upload" v-if="route.meta.title==='审稿'" ><el-icon><Upload /></el-icon></el-button>
            <el-button @click="stopFetch"  v-if="!showType">停止</el-button>
            <el-button @click="sendMessage(item.name)" v-if="showType">发送</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { useRoute } from 'vue-router'; // 引入 useRoute 钩子
  import Chat from '../chat/chat.vue';
  import { fetchStreamData } from '../../../api/fetch';
  import { chatList } from '../../../mock/chat'; // 引入 mock 数据
  
  // 定义 Tab 的数据结构
  interface Tab {
    title: any;
    name: string;
  }
  
  // 定义聊天消息的数据结构
  interface ChatMessage {
    role: string;
    content: string;
    reasoningContent?: string;
    id?: string;
  }
  
  // 定义流数据的回调函数类型
  interface StreamData {
    role: string;
    id: string;
    reasoningContent: string;
    content: string;
  }
  
  // 获取当前路由对象
  const route = useRoute();
  console.log(route,'21312321')
  // 响应式数据
  const contentHeight = ref<number>(300);
  const editableTabsValue = ref<string>('1');
  //终止流数据 
  const abortController = ref<AbortController | null>(null);
  //控制按钮显示发送还是终止
  const showType=ref<Boolean>(true)
  // 初始化 editableTabs，使用路由 meta 中的 title
  const editableTabs = ref<Tab[]>([
    {
      title: route.meta.title || 'Tab 1', // 使用路由 meta 中的 title
      name: '1',
    }
  ]);
  
  // 存储每个 Tab 的聊天数据
  const chatData = ref<Record<string, ChatMessage[]>>({});
  
  // 存储每个 Tab 的输入框内容
  const chatValue = ref<Record<string, string>>({});
  
  // 存储每个 Chat 组件的 ref
  const chatRefs = ref<Record<string, any>>({});
  
  // 动态设置 Chat 组件的 ref
  const setChatRef = (el: any, name: string) => {
    if (el) {
      chatRefs.value[name] = el;
      // 初始化时插入第一条对话数据
      initializeFirstMessage(name);
    }
  };
  
  // 初始化第一条对话数据
  const initializeFirstMessage = (tabName: string) => {
  
    const routeTitle = route.meta.title as string; // 获取当前路由的 title
    console.log(routeTitle)
    const firstMessage = chatList.find((item) => item.content.includes(routeTitle));
    console.log(firstMessage)
    if (firstMessage && !chatData.value[tabName]?.length) {
        chatData.value[tabName] = [firstMessage];
    //     console.log(firstMessage)
    //   const activeChatRef = chatRefs.value[tabName];
    //   activeChatRef.chatDatas.push(firstMessage);
    }
  };
  
  // 处理 Tab 的添加和删除
  const handleTabsEdit = (targetName: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      const newTabName = `${editableTabs.value.length + 1}`;
      editableTabs.value.push({
        title: route.meta.title || 'New Tab', // 使用路由 meta 中的 title
        name: newTabName,
      });
      editableTabsValue.value = newTabName;
    } else if (action === 'remove') {
      const tabs = editableTabs.value;
      let activeName = editableTabsValue.value;
      if (activeName === targetName) {
        tabs.forEach((tab, index) => {
          if (tab.name === targetName) {
            const nextTab = tabs[index + 1] || tabs[index - 1];
            if (nextTab) {
              activeName = nextTab.name;
            }
          }
        });
      }
  
      editableTabsValue.value = activeName;
      editableTabs.value = tabs.filter((tab) => tab.name !== targetName);
      delete chatRefs.value[targetName]; // 移除对应的 ref
      delete chatData.value[targetName]; // 移除对应的聊天数据
      delete chatValue.value[targetName]; // 移除对应的输入框内容
    }
  };
  
  // 发送消息
  const sendMessage = (tabName: string) => {
    const activeChatRef = chatRefs.value[tabName];
    const currentChatValue = chatValue.value[tabName];
  
    if (currentChatValue?.trim()) {
      const newMessage: ChatMessage = {
        role: 'user',
        content: currentChatValue,
      };
  
      // 更新当前 Tab 的聊天数据
      if (!chatData.value[tabName]) {
        chatData.value[tabName] = [];
      }
      chatData.value[tabName].push(newMessage);
  
      // 清空输入框
      chatValue.value[tabName] = '';
  
    //   // 调用 Chat 组件的发送逻辑
    //   if (activeChatRef) {
    //     activeChatRef.addChat(newMessage);
    //   }
  
      // 获取流数据
      getData(activeChatRef.chatDatas, activeChatRef, tabName);
    }
  };
  
  // 获取流数据
  const getData = async (
    item: ChatMessage,
    activeChatRef: any,
    tabName: string
  ) => {
    showType.value=false
    abortController.value = new AbortController();
    await fetchStreamData({
      url: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer sk-GCpb3GCjVSdg4DO185Ce7fEb84324bB486999738Ca6c04D9',
      },
      body: {
        model: 'xdeepseekr1',
        messages: item,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
        include_usage: true,
      },
      onData: (data: StreamData) => {
        console.log(data);
        const index = activeChatRef.chatDatas.findIndex(
          (chat: any) => chat.id === data.id
        );
        if (index !== -1) {
          activeChatRef.chatDatas.splice(index, 1);
        }
        activeChatRef.addChat(data);
      },
      onError: (error: Error) => {
        console.error('请求失败:', error);
      },
      onComplete: () => {
        // loading.value = false;
        showType.value=true
      },
      signal: abortController.value.signal
    });
  };
  
  // 初始化高度
  onMounted(() => {
    contentHeight.value = window.innerHeight - 92;
  });
  
  // 监听路由变化，更新 Tab 的 title
  watch(
    () => route.meta.title,
    (newTitle) => {
      editableTabs.value.forEach((tab) => {
        tab.title = newTitle || tab.name; // 更新 title
      });
    }
  );
  //停止操作
  const stopFetch = () => {
    if (abortController.value) {
        abortController.value.abort(); // 中止请求
        abortController.value = null; // 重置 AbortController
        showType.value=true
    }
  };
  </script>
  
  <style scoped lang="scss">
  .chat-tabs {
    flex: 1;
    display: flex;
    height: 100%;
    width: 100%;
  }
  :deep .el-tabs__new-tab{
    background:linear-gradient(135deg, #2196f3, #1a237e);
    color:#fff;
   margin-right:10px;
  }
  :deep .el-tabs__header {
    margin: 0;
  }
  
  .right {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .right-top {
    flex: 1;
    background: #f8f9fa;
    padding: 30px;
    overflow: auto;
  }
  
  .right-bottom {
    padding: 25px;
    height: 55px;
    background-color: #fff;
    display: flex;
    flex-direction: row;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
  
  .right-bottom .el-textarea__inner {
    padding: 15px;
    border: 2px solid #e3f2fd;
    border-radius: 15px;
    resize: none;
    height: 55px;
    font-size: 1em;
    margin-right: 15px;
  }
  
  .right-bottom  {
  
    .el-button{
    margin-left: 15px;
    padding: 15px 30px;
    height: 55px;
    line-height: 55px;
    background: linear-gradient(135deg, #2196f3, #1a237e);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s ease;
    }
    .upload{
      padding: 10px 20px;
    }
  }
  </style>