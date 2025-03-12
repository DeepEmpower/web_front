<template>
  <div>
    <el-tabs v-model="editableTabsValue" type="card" tab-position="top" editable class="chat-tabs" @edit="handleTabsEdit">
      <el-tab-pane v-for="(item, index) in editableTabs" :key="item.name" :label="item.title" :name="item.name"
        :closable="index > 0">
        <div class="right" :style="{ height: contentHeight + 'px' }">
          <div class="right-top">
            <!-- 动态绑定 ref 并传递对应 Tab 的聊天数据 -->
            <Chat :ref="(el) => setChatRef(el, item.name)" :chatData="chatData[item.name] || []"></Chat>
          </div>
          
          <div class="right-bottom">
            <!-- 将ImagePreview移动到输入框上方 -->
            <div class="image-preview-container" v-if="uploadedImagesMap[item.name] && uploadedImagesMap[item.name].length > 0">
              <ImagePreview
                :key="item.name" 
                :uploaded-images="uploadedImagesMap[item.name] || []"
                @remove-image="(index) => handleRemoveImage(item.name, index)"
              />
            </div>
            
            <el-input v-model="chatValue[item.name]" :rows="2" type="textarea" placeholder="请输入您的问题" />
            <el-button class="upload" v-if="route.meta.title === '审稿'">
              <UploadCom @update-images="(images) => handleUpdateImages(item.name, images)" />
            </el-button>
            <el-button class="upload" v-if="route.meta.title === '会议编写助手'">
              <el-upload
                class="audio-upload"
                accept="audio/*"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleAudioChange"
              >
                <el-icon><Upload /></el-icon>
                <span>上传音频</span>
              </el-upload>
            </el-button>
            <div v-if="route.meta.title === '审稿' && !!uploadedImagesMap[item.name]">
              <el-button @click="stopFetchExamine" v-if="!showTypeExamine">停止</el-button>
              <el-button @click="sendMessage(item.name)" v-if="showTypeExamine">发送</el-button>
            </div>
            <div v-else>
              <el-button @click="stopFetch" v-if="!showType">停止</el-button>
              <el-button @click="sendMessage(item.name)" v-if="showType">发送</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
  
<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 引入 useRoute 和 useRouter 钩子
import Chat from '../chat/chat.vue';
import { fetchStreamData } from '../../../api/fetch';
import { useReviewAnalysis } from '../../../api/examine';
const { loading, result, analyzeImage,stopFetchExamine } = useReviewAnalysis();
import { chatList } from '../../../mock/chat'; // 引入 mock 数据
import UploadCom from '../upload/upload.vue';
import ImagePreview from '../upload/img.vue';
import { ElMessage } from 'element-plus';
import { constantRoutes } from '@/routers';
import { Upload } from '@element-plus/icons-vue';
import { transcribeAudio } from '../../../api/meeting';
import { useVoiceSynthesis, isVoiceSynthesisMessage } from '../../../api/voiceSynthesis';
import { useConversationStore, ChatMessage as StoreChatMessage } from '../../../store/modules/conversation';

// 引入会话存储
const conversationStore = useConversationStore();
const router = useRouter();

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
  url?:string;
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
// 响应式数据
const contentHeight = ref<number>(300);
const editableTabsValue = ref<string>('1');
//终止流数据 
const abortController = ref<AbortController | null>(null);
//控制按钮显示发送还是终止
const showType = ref<Boolean>(true)
//稿件的终止
const showTypeExamine =ref<Boolean>(true)

// 获取当前助手类型
const currentAssistantType = ref<string>('');

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

// 存储每个 Tab 的上传图片
const uploadedImagesMap = ref<Record<string, { url: string }[]>>({});

// 音频文件
const audioFile = ref<File | null>(null);

// 处理窗口大小变化
const handleResize = () => {
  // 为了更准确地适应各种屏幕尺寸，减少一个更合理的值
  contentHeight.value = window.innerHeight - 80;
};

// 设置当前助手类型
const setCurrentAssistantType = () => {
  // 使用路由路径代替title作为唯一标识，确保不同助手有不同标识
  currentAssistantType.value = route.path || '默认助手';
  
  // 初始化当前助手的状态
  conversationStore.initAssistant(currentAssistantType.value);
  
  // 从存储中恢复当前助手的激活标签页
  const activeTab = conversationStore.getActiveTab(currentAssistantType.value);
  if (activeTab) {
    editableTabsValue.value = activeTab;
  }
  
  // 从存储中恢复当前助手的所有标签页
  const storedTabs = conversationStore.getTabs(currentAssistantType.value);
  
  if (Object.keys(storedTabs).length > 0) {
    // 如果有存储的标签页，则使用存储的数据
    editableTabs.value = Object.entries(storedTabs).map(([tabName, tabData]) => ({
      name: tabName,
      title: tabData.title || route.meta.title || tabName
    }));
    
    // 恢复聊天数据
    chatData.value = {}; // 清空当前聊天数据，避免混淆
    Object.entries(storedTabs).forEach(([tabName, tabData]) => {
      chatData.value[tabName] = tabData.messages;
      chatValue.value[tabName] = tabData.input;
    });
  } else {
    // 如果没有存储的标签页，则初始化第一个标签页
    editableTabs.value = [{
      title: route.meta.title || 'Tab 1',
      name: '1',
    }];
    chatData.value = {}; // 清空当前聊天数据
    chatValue.value = {}; // 清空当前输入框内容
    conversationStore.initTab(currentAssistantType.value, '1', route.meta.title as string || 'Tab 1');
  }
};

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
  // 检查是否已有存储的消息
  const storedMessages = conversationStore.getMessages(currentAssistantType.value, tabName);
  
  if (storedMessages.length > 0) {
    // 如果有存储的消息，使用存储的消息
    chatData.value[tabName] = storedMessages;
    if (chatRefs.value[tabName]) {
      chatRefs.value[tabName].chatDatas = storedMessages;
    }
  } else {
    // 否则插入默认欢迎消息
    const routeTitle = route.meta.title as string; // 获取当前路由的 title
    
    // 根据不同路径选择不同的欢迎消息
    let firstMessage;
    if (route.path === '/tendering/strategy') {
      firstMessage = chatList.find(item => item.content.includes('战略分析助手'));
    } else if (route.path === '/tendering/product') {
      firstMessage = chatList.find(item => item.content.includes('产品管理助手'));
    } else if (route.path === '/tendering/copyright') {
      firstMessage = chatList.find(item => item.content.includes('版权合同助手'));
    } else {
      // 兜底使用路由标题匹配
      firstMessage = chatList.find(item => item.content.includes(routeTitle));
    }
    
    if (firstMessage && !chatData.value[tabName]?.length) {
      chatData.value[tabName] = [firstMessage];
      // 保存到存储
      conversationStore.saveMessages(currentAssistantType.value, tabName, [firstMessage]);
    }
  }
};

// 保存当前标签页的状态
const saveCurrentTabState = (tabName: string) => {
  if (currentAssistantType.value && tabName) {
    // 保存消息
    if (chatData.value[tabName]) {
      conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);
    }
    
    // 保存输入框内容
    if (chatValue.value[tabName] !== undefined) {
      conversationStore.saveInput(currentAssistantType.value, tabName, chatValue.value[tabName]);
    }
    
    // 保存当前激活的标签页
    conversationStore.setActiveTab(currentAssistantType.value, editableTabsValue.value);
  }
};

// 处理 Tab 的添加和删除
const handleTabsEdit = (targetName: string, action: 'add' | 'remove') => {
  if (action === 'add') {
    const newTabName = `${editableTabs.value.length + 1}`;
    const newTabTitle = (route.meta.title as string) || 'New Tab';
    
    editableTabs.value.push({
      title: newTabTitle,
      name: newTabName,
    });
    
    // 在存储中初始化新标签页
    conversationStore.initTab(currentAssistantType.value, newTabName, newTabTitle);
    
    editableTabsValue.value = newTabName;
  } else if (action === 'remove') {
    const tabs = editableTabs.value;
    let activeName = editableTabsValue.value;
    
    // 保存当前标签页状态，然后再删除
    saveCurrentTabState(targetName);
    
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
    
    // 从内存中移除
    delete chatRefs.value[targetName];
    delete chatData.value[targetName];
    delete chatValue.value[targetName];
    
    // 从存储中移除
    conversationStore.removeTab(currentAssistantType.value, targetName);
  }
};

// 在标签页切换时保存当前标签页状态
watch(editableTabsValue, (newTabName, oldTabName) => {
  if (oldTabName) {
    saveCurrentTabState(oldTabName);
  }
  
  // 设置新的激活标签页
  if (newTabName) {
    conversationStore.setActiveTab(currentAssistantType.value, newTabName);
    
    // 恢复输入框内容
    const storedInput = conversationStore.getInput(currentAssistantType.value, newTabName);
    if (storedInput !== undefined && chatValue.value[newTabName] === undefined) {
      chatValue.value[newTabName] = storedInput;
    }
  }
});

// 监听路由变化
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    // 当助手类型改变时，保存当前所有标签页状态
    if (currentAssistantType.value) {
      editableTabs.value.forEach((tab) => {
        saveCurrentTabState(tab.name);
      });
    }
    
    // 设置新的助手类型并初始化/恢复状态
    setCurrentAssistantType();
  }
}, { immediate: true });

// 同时保留旧的监听，以防有些操作依赖于title变化
watch(() => route.meta.title, (newTitle, oldTitle) => {
  if (newTitle !== oldTitle) {
    // 更新标签页标题，但不改变当前助手类型
    editableTabs.value.forEach((tab) => {
      tab.title = newTitle || tab.name; // 更新 title
    });
  }
});

// 组件挂载时设置当前助手类型并初始化/恢复状态
onMounted(() => {
  setCurrentAssistantType();
  
  // 设置内容高度 - 使用与handleResize相同的逻辑
  contentHeight.value = window.innerHeight - 80;
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);
});

// 在组件卸载前保存当前状态
onBeforeUnmount(() => {
  // 保存当前所有标签页状态
  editableTabs.value.forEach((tab) => {
    saveCurrentTabState(tab.name);
  });
  
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
});

// 发送消息
const sendMessage = (tabName: string) => {
  const activeChatRef = chatRefs.value[tabName];
  const currentChatValue = chatValue.value[tabName];
  const routeTitle = route.meta.title as string;
  
  // 处理会议编写助手的音频上传
  if (routeTitle === '会议编写助手' && audioFile.value) {
    const newMessage: ChatMessage = {
      role: 'user',
      content: currentChatValue || '已上传音频文件',
    };

    if (!chatData.value[tabName]) {
      chatData.value[tabName] = [];
    }
    chatData.value[tabName].push(newMessage);
    // 保存用户消息到存储
    conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);
    chatValue.value[tabName] = '';
    // 保存输入框内容到存储
    conversationStore.saveInput(currentAssistantType.value, tabName, '');

    // 调用会议助手API
    showType.value = false;
    abortController.value = new AbortController();

    transcribeAudio(
      audioFile.value,
      (data) => {
        console.log('转写结果:', data);
        const index = activeChatRef.chatDatas.findIndex(
          (chat: any) => chat.id === data.id
        );
        if (index !== -1) {
          activeChatRef.chatDatas.splice(index, 1);
        }
        activeChatRef.addChat(data);
        // 保存助手回复到存储
        if (!chatData.value[tabName]) chatData.value[tabName] = [];
        chatData.value[tabName].push(data);
        conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);
      },
      (error) => {
        console.error('转写失败:', error);
        ElMessage.error('音频转写失败，请重试');
        showType.value = true;
      },
      () => {
        showType.value = true;
        audioFile.value = null; // 清空音频文件
      },
      abortController.value.signal
    );
    return;
  }

  // 处理审稿助手
  let isImg = !uploadedImagesMap.value[tabName];
  if (routeTitle !== '审稿' || isImg) {
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
      // 保存用户消息到存储
      conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);

      // 清空输入框
      chatValue.value[tabName] = '';
      // 保存输入框内容到存储
      conversationStore.saveInput(currentAssistantType.value, tabName, '');

      // 根据不同的助手类型调用不同的API
      if (routeTitle === '法律知识助手') {
        // 调用法律助手API
        getData(newMessage, activeChatRef, tabName, true);
      } else if (routeTitle === '语音生成助手' || 
                (chatData.value[tabName] && 
                 chatData.value[tabName][0] && 
                 chatData.value[tabName][0].content && 
                 chatData.value[tabName][0].content.includes('语音生成助手'))) {
        // 调用语音合成助手API
        getData(newMessage, activeChatRef, tabName, false, false, true);
      } else if (routeTitle === '选题思路助手' || 
                (chatData.value[tabName] && 
                 chatData.value[tabName][0] && 
                 chatData.value[tabName][0].content && 
                 chatData.value[tabName][0].content.includes('选题思路助手'))) {
        // 调用选题思路助手API
        getData(newMessage, activeChatRef, tabName, false, true);
      } else {
        // 调用其他助手API
        getData(newMessage, activeChatRef, tabName);
      }
    } else {
      ElMessage.error('请输入文字');
    }
  } else {
    if(uploadedImagesMap.value[tabName].length>0){
      const newMessage: ChatMessage = {
        role: 'user',
        content: currentChatValue || '',
        url: uploadedImagesMap.value[tabName][0].url
      };
      // 更新当前 Tab 的聊天数据
      if (!chatData.value[tabName]) {
        chatData.value[tabName] = [];
      }
      chatData.value[tabName].push(newMessage);
      // 保存用户消息到存储
      conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);
      
      uploadedImagesMap.value[tabName]=[]
      handleAnalyze(activeChatRef.chatDatas[activeChatRef.chatDatas.length-1],activeChatRef,currentChatValue)
    } 
  }
};

// 获取通用流数据
const getData = async (
  item: ChatMessage,
  activeChatRef: any,
  tabName: string,
  isLegalAssistant: boolean = false,
  isTopicPlanningAssistant: boolean = false,
  isVoiceSynthesisAssistant: boolean = false,
  formData?: FormData
) => {
  showType.value = false;
  abortController.value = new AbortController();

  let apiConfig;
  
  if (formData) {
    // 会议编写助手的 API 配置
    apiConfig = {
      url: 'http://your-meeting-assistant-api-endpoint',
      headers: {
        'Authorization': 'Bearer your-meeting-assistant-token'
      },
      body: formData
    };
  } else if (isVoiceSynthesisAssistant) {
    // 语音合成助手不使用流式API，而是直接调用synthesizeVoice函数
    showType.value = false;
    try {
      console.log("准备调用语音合成助手API，用户输入:", item.content);
      
      // 确保用户输入不为空
      const userContent = item.content || "您好，这是一条测试语音。";
      
      // 直接发送请求到后端，不使用synthesizeVoice函数
      const response = await fetch('/python/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userContent,
          voice: "longtong",
          model: "cosyvoice-v1"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`语音合成API错误: ${errorText}`);
        throw new Error(`语音合成失败: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log("语音合成结果:", result);
      
      // 构建音频URL
      const audioUrl = `/python${result.audio_url}`;
      
      // 添加到聊天记录
      activeChatRef.addChat({
        role: 'assistant',
        id: new Date().getTime().toString(),
        content: `<div class="voice-message">
          <p>已为您生成语音：</p>
          <audio controls src="${audioUrl}" style="width:100%;max-width:300px;"></audio>
          <p>原文：${result.text}</p>
        </div>`,
        reasoningContent: ''
      });
      
      showType.value = true;
    } catch (error) {
      console.error('语音合成失败:', error);
      ElMessage.error('语音合成失败，请重试');
      showType.value = true;
    }
    
    // 直接返回，不执行后续的fetchStreamData
    return;
  } else if (isTopicPlanningAssistant) {
    // 选题思路助手的 API 配置
    console.log("准备调用选题思路助手API，用户输入:", item.content);
    
    // 确保用户输入不为空
    const userContent = item.content || "请提供选题内容";
    
    apiConfig = {
      url: '/aliyuncs/api/v3/bots/chat/completions', // 使用代理路径而不是直接URL
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 8ba2922b-c4bc-4e56-8c49-3ae92107d7d7'
      },
      body: {
        model: 'bot-20250307165814-cr8cd',
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          {
            role: 'system',
            content: '你是一个主题图书选题策划助手，按照我给你的选题，在选题策划环节，查找、收集和分析与选题相关的信息，为选题做好信息储备，生成市场调研报告、竞品分析等，从而构建选题报告的具体内容，不需要实施方案。'
          },
          {
            role: 'user',
            content: userContent
          }
        ]
      }
    };
    console.log("选题思路助手API配置:", JSON.stringify(apiConfig));
  } else if (isLegalAssistant) {
    // 法律助手的 API 配置
    apiConfig = {
      url: '/legal/api/v1/chats/21ce1968f6b011ef81330242ac120006/completions', // 使用代理路径
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ragflow-IzNTVmYjFjZjZhMDExZWZiYjU3MDI0Mm'
      },
      body: {
        question: item.content,
        stream: true,
        session_id: '21c7edbaf6b311efa5110242ac120006'
      }
    };
  } else {
    // 其他助手的默认 API 配置
    apiConfig = {
      url: '/python/api/claude',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        prompt: item.content,
        max_tokens_to_sample: 300,
      },
    };
  }

  // 调用流式数据接口
  await fetchStreamData({
    ...apiConfig,
    onData: (data: StreamData) => {
      console.log('实时数据:', data);
      
      // 如果是初次响应，创建一个新的消息
      const index = activeChatRef.chatDatas.findIndex(
        (chat) => chat.id === data.id
      );
      
      if (index !== -1) {
        // 如果消息已经存在，则更新它
        activeChatRef.chatDatas.splice(index, 1);
      }
      
      activeChatRef.addChat(data);
      
      // 保存助手回复到存储
      if (!chatData.value[tabName]) chatData.value[tabName] = [];
      
      // 查找是否已有相同ID的消息
      const existingMsgIndex = chatData.value[tabName].findIndex(
        (chat: any) => chat.id === data.id
      );
      
      if (existingMsgIndex !== -1) {
        // 如果已有该消息，则更新
        chatData.value[tabName][existingMsgIndex] = data;
      } else {
        // 否则添加新消息
        chatData.value[tabName].push(data);
      }
      
      // 保存到存储
      conversationStore.saveMessages(currentAssistantType.value, tabName, chatData.value[tabName]);
    },
    onError: (error: Error) => {
      console.error('请求失败:', error);
      ElMessage.error('请求失败，请检查网络或 API');
    },
    onComplete: () => {
      showType.value = true;
    },
    signal: abortController.value.signal,
    isLegalAssistant,
    isTopicPlanningAssistant,
    isVoiceSynthesisAssistant
  });
};
//稿件
const handleAnalyze = async (
  item: ChatMessage,
  activeChatRef: any,
  message:string,
  ) => {
  showTypeExamine.value = false
  await analyzeImage(item, message);
  activeChatRef.addChat(result);
  showTypeExamine.value = true
};
// 停止操作
const stopFetch = () => {
  if (abortController.value) {
    abortController.value.abort(); // 中止请求
    abortController.value = null; // 重置 AbortController
    showType.value = true
  }
  
  // 如果是语音合成助手，也需要停止语音合成
  stopVoiceSynthesis();
};

// 更新图片数据
const handleUpdateImages = (tabName: string, images: { url: string }[]) => {
  uploadedImagesMap.value[tabName] = images;
};

// 删除图片
const handleRemoveImage = (tabName: string, index: number) => {
  if (uploadedImagesMap.value[tabName]) {
    uploadedImagesMap.value[tabName].splice(index, 1);
  }
};

// 处理音频文件选择
const handleAudioChange = (file: any) => {
  const isAudio = file.raw.type.startsWith('audio/');
  if (!isAudio) {
    ElMessage.error('请上传音频文件！');
    return false;
  }
  audioFile.value = file.raw;
  ElMessage.success('音频文件已选择，请点击发送按钮开始处理');
};

// 初始化语音合成服务
const { synthesizeVoice, stopVoiceSynthesis } = useVoiceSynthesis();

</script>
  
<style scoped lang="scss">
.chat-tabs {
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
}

:deep .el-tabs__new-tab {
  background: #409eff;
  color: #fff;
  margin-right: 10px;
}

:deep .el-tabs__header {
  margin: 0;
}

.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative; /* 添加相对定位以支持绝对定位子元素 */
  overflow: hidden; /* 防止内容溢出 */
}

.right-top {
  flex: 1;
  background: #f8f9fa;
  padding: 30px 0 30px 30px;
  overflow-y: auto; /* 仅垂直方向滚动 */
  margin-bottom: 105px; /* 为底部输入区域留出空间 */
}

.right-bottom {
  padding: 25px;
  min-height: 55px;
  background-color: #fff;
  display: flex;
  flex-direction: row;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  position: absolute; /* 绝对定位 */
  bottom: 0; /* 固定在底部 */
  left: 0;
  right: 0;
  z-index: 10; /* 确保在其他内容之上 */
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

.right-bottom {

  .el-button {
    margin-left: 15px;
    padding: 15px 30px;
    height: 55px;
    line-height: 55px;
    background: #409eff;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.3s ease;
  }

  .upload {
    padding: 10px 20px;
  }
}

.image-preview-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: white;
  padding: 10px;
  border-top: 1px solid #eee;
  max-height: 200px;
  overflow-y: auto;
}
</style>