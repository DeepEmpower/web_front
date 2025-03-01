<template>
  <div class="chat-content" ref="chatContentRef">
    <div v-for="(item, index) in chatDatas" :key="index" class="chat-content-list">
      <!-- 助手消息 -->
      <div
        class="chat-receive message"
        v-if="item.role === 'assistant'"
        @mouseenter="showCopyButton(index)"
        @mouseleave="hideCopyButton(index)"
      >
        <div v-html="item.reasoningContent"></div>
        <div v-html="item.content"></div>
        <span
          v-show="hoverIndex === index"
          @click="copyMessage(item)"
          class="copy"
        >
          <el-icon><CopyDocument /></el-icon>
        </span>
      </div>
      <!-- 用户消息 -->
      <div
        class="chat-send message"
        v-if="item.role === 'user'"
        @mouseenter="showCopyButton(index)"
        @mouseleave="hideCopyButton(index)"
      >
      <span v-if="!!item.url && item.url" class="chat-img"><img :src="item.url" alt=""></span> 
      <span >{{ item.content }}</span> 
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus'; // 引入 Element Plus 的消息提示组件
import { CopyDocument } from '@element-plus/icons-vue'; // 引入复制图标

// 定义聊天消息的数据结构
interface ChatMessage {
  role: string;
  content: string;
  reasoningContent?: string;
  id?: string;
  url?:string
}

// 接收父组件传递的聊天数据
const props = defineProps<{
  chatData: ChatMessage[];
}>();

// 存储当前 Tab 的聊天数据
const chatDatas = ref<ChatMessage[]>(props.chatData);

// 获取聊天内容的容器
const chatContentRef = ref<HTMLElement | null>(null);

// 存储当前 hover 的索引
const hoverIndex = ref<number | null>(null);

// 增加消息
const addChat = (item: ChatMessage) => {
  chatDatas.value.push(item);
  scrollToBottom();
};

// 清除消息
const deleteChat = () => {
  chatDatas.value = [];
};

// 暴露方法给父组件
defineExpose({
  addChat,
  deleteChat,
  chatDatas,
});

// 监听父组件传递的 chatData 变化
watch(
  () => props.chatData,
  (newData) => {
    chatDatas.value = newData;
    scrollToBottom();
  },
  { deep: true }
);

// 平滑滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContentRef.value) {
      chatContentRef.value.scrollTo({
        top: chatContentRef.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  });
};

// 显示复制按钮
const showCopyButton = (index: number) => {
  hoverIndex.value = index;
};

// 隐藏复制按钮
const hideCopyButton = (index) => {
  hoverIndex.value = null;
};

// 复制消息内容
const copyMessage = (item: ChatMessage) => {
  let textToCopy = '';

  if (item.role === 'assistant') {
    // 复制助手消息的内容
    textToCopy = `${item.reasoningContent || ''}\n${item.content || ''}`;
  } else if (item.role === 'user') {
    // 复制用户消息的内容
    textToCopy = item.content;
  }

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      ElMessage.success('复制成功');
    })
    .catch(() => {
      ElMessage.error('复制失败');
    });
};
</script>

<style scoped lang="scss">
.chat-content {
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 允许垂直滚动 */
  height: 100%; /* 确保容器有高度 */

  .chat-content-list {
    .message {
      max-width: 100%;
      line-height: 25px;
      animation: fadeIn 0.3s ease-out;
      margin-bottom: 25px;
      padding: 15px 20px;
      border-radius: 15px;
      max-width: 70%;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      position: relative;

      .copy {
        position: absolute;
        right: 10px;
        bottom: 10px;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        transition: color 0.3s ease;

        &:hover {
          color: #2196f3;
        }
      }
    }

    .chat-send {
      float: right;
      text-align: right;
      overflow: hidden;
      color: white;
      margin-right:30px;
      background: #409eff;
      .chat-img{
        width:100px;
        height:100px;
        img{
          width:100%;
          height:100%;
        }
      }
    }

    .chat-receive {
      float: left;
      overflow: hidden;
      text-align: left;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>