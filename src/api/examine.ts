import { reactive, ref } from 'vue';

// 配置
const API_CONFIG = {
  url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  apiKey: 'sk-209560e125c14ae89f02ae36cb3538a5',
};

const ANALYSIS_API_CONFIG = {
  url: 'https://ark.cn-beijing.volces.com/api/v3/bots',
  apiKey: '8ba2922b-c4bc-4e56-8c49-3ae92107d7d7',
  model: 'bot-20250222224150-fzfvl',
};

// 审稿分析的系统提示词
const REVIEW_SYSTEM_PROMPT = `你是一个专业的出版审稿专家，需要对提供的内容进行全面分析。请从以下几个方面进行评估：
1. 内容准确性：检查事实、数据、引用的准确性
2. 结构完整性：评估文章结构是否合理、完整
3. 语言表达：分析语言是否流畅、专业术语使用是否恰当
4. 排版规范：检查标点符号、段落划分、图文编排等是否规范
5. 改进建议：提供具体的修改意见和建议

请以结构化的方式呈现分析结果。`;

// 定义类型
interface ApiResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface FileWithUrl {
  url?: string;
  role?: string;
  content?:string;
}

// 创建 AbortController
const abortController = ref<AbortController | null>(null);

/**
 * 调用第一个API进行OCR识别
 * @param {FileWithUrl} file - 上传的图片文件
 * @param {string} message - 用户消息
 * @returns {Promise<string>} - 识别结果
 */
const callOcrApi = async (file: FileWithUrl, message: string): Promise<string> => {
  abortController.value = new AbortController(); // 创建新的 AbortController

  const requestBody = {
    model: "qwen-vl-max",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "You are a helpful assistant."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: file.url
            }
          },
          {
            type: "text",
            text: "识别图片中文字和图片编号,判断图片和文字是否匹配，图片排版有何错误"
          }
        ]
      }
    ]
  };

  const response = await fetch('/img/compatible-mode/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_CONFIG.apiKey}`,
    },
    signal: abortController.value.signal, // 传递 signal
  });

  if (!response.ok) {
    throw new Error(`OCR API 请求失败: ${response.statusText}`);
  }

  const data: ApiResponse = await response.json();
  return data.choices[0].message.content;
};

/**
 * 调用第二个API进行审稿分析
 * @param {string} text - 识别后的文本
 * @returns {Promise<string>} - 分析结果
 */
const callAnalysisApi = async (text: string): Promise<string> => {
  abortController.value = new AbortController(); // 创建新的 AbortController

  const requestBody = {
    model: ANALYSIS_API_CONFIG.model,
    messages: [
      {
        role: 'system',
        content: REVIEW_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: text,
      },
    ],
  };

  const response = await fetch('/aliyuncs/api/v3/bots/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANALYSIS_API_CONFIG.apiKey}`,
    },
    body: JSON.stringify(requestBody),
    signal: abortController.value.signal, // 传递 signal
  });

  if (!response.ok) {
    throw new Error(`审稿分析 API 请求失败: ${response.statusText}`);
  }

  const data: ApiResponse = await response.json();
  return data.choices[0].message.content;
};

/**
 * 封装图片上传和审稿分析逻辑
 * @returns {Object} - 返回方法
 */
export const useReviewAnalysis = () => {
  const loading = ref(false);
  let result = reactive({
    role: '',
    reasoningContent: '',
  });

  // 中止请求
  const stopFetchExamine = () => {
    if (abortController.value) {
      abortController.value.abort(); // 中止请求
      abortController.value = null; // 重置 AbortController
    }
  };
  const analyzeImage = async (file: FileWithUrl, message: string) => {
    console.log(file,"file11")
    try {
      loading.value = true;
      // 清空结果
      result.role = '';
      result.reasoningContent = '';

      // 调用第一个API进行OCR识别
      const recognizedText = await callOcrApi(file, message);
      console.log('OCR 识别结果:', recognizedText);

      // 调用第二个API进行审稿分析
      const analysisResult = await callAnalysisApi(recognizedText);
      console.log('审稿分析结果:', analysisResult);

      // 更新结果
      result.role = 'assistant';
      result.reasoningContent = analysisResult.replace(/\n/g, "<br>");
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
    analyzeImage,
    stopFetchExamine, // 暴露 stopFetch 方法
  };
};