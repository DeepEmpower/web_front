import { reactive, ref } from 'vue';

// 配置选题思路助手API
const TOPIC_PLANNING_API_CONFIG = {
  url: '/aliyuncs/api/v3/bots/chat/completions',
  apiKey: '8ba2922b-c4bc-4e56-8c49-3ae92107d7d7',
  model: 'bot-20250307165814-cr8cd',
};

// 选题思路助手的系统提示词
const TOPIC_PLANNING_SYSTEM_PROMPT = `你是一个主题图书选题策划助手，按照我给你的选题，在选题策划环节，查找、收集和分析与选题相关的信息，为选题做好信息储备，生成市场调研报告、竞品分析等，从而构建选题报告的具体内容，不需要实施方案。`;

// 定义类型
interface ApiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// 创建 AbortController
const abortController = ref<AbortController | null>(null);

/**
 * 调用选题思路API
 * @param {string} message - 用户消息/选题内容
 * @returns {Promise<string>} - 分析结果
 */
const callTopicPlanningApi = async (message: string): Promise<string> => {
  abortController.value = new AbortController(); // 创建新的 AbortController

  const requestBody = {
    model: TOPIC_PLANNING_API_CONFIG.model,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      {
        role: 'system',
        content: TOPIC_PLANNING_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: message,
      },
    ],
  };

  const response = await fetch('/aliyuncs/api/v3/bots/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOPIC_PLANNING_API_CONFIG.apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: abortController.value.signal, // 传递 signal
  });

  if (!response.ok) {
    throw new Error(`选题思路分析 API 请求失败: ${response.statusText}`);
  }

  const data: ApiResponse = await response.json();
  return data.choices[0].message.content;
};

/**
 * 封装选题思路分析逻辑
 * @returns {Object} - 返回方法
 */
export const useTopicPlanning = () => {
  const loading = ref(false);
  let result = reactive({
    role: '',
    reasoningContent: '',
    content: '',
  });

  // 中止请求
  const stopTopicPlanning = () => {
    if (abortController.value) {
      abortController.value.abort(); // 中止请求
      abortController.value = null; // 重置 AbortController
    }
  };

  const analyzeTopicIdea = async (message: string) => {
    try {
      loading.value = true;
      // 清空结果
      result.role = '';
      result.reasoningContent = '';
      result.content = '';

      // 调用选题思路API
      const analysisResult = await callTopicPlanningApi(message);
      console.log('选题思路分析结果:', analysisResult);

      // 更新结果
      result.role = 'assistant';
      result.content = analysisResult.replace(/\n/g, "<br>");
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已中止');
      } else {
        console.error('处理错误:', error);
        throw error;
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    result,
    analyzeTopicIdea,
    stopTopicPlanning, // 暴露 stop 方法
  };
};

// 提供判断是否为选题思路助手的函数
export const isTopicPlanningMessage = (content: string): boolean => {
  return content.includes('选题思路助手') && content.includes('分析市场需求');
}; 