import { reactive, ref } from 'vue';

// 语音合成请求参数接口
export interface VoiceSynthesisRequest {
  text: string;
  voice?: string;
  model?: string;
}

// 语音合成响应接口
export interface VoiceSynthesisResponse {
  audio_url: string;
  file_id: string;
  request_id: string;
  text: string;
  voice: string;
  model: string;
  status: string;
}

// 声音信息接口
export interface VoiceInfo {
  id: string;
  name: string;
  gender: string;
}

// 模型信息接口
export interface ModelInfo {
  id: string;
  name: string;
}

// 创建 AbortController
const abortController = ref<AbortController | null>(null);

/**
 * 调用语音合成API
 * @param {VoiceSynthesisRequest} params - 请求参数
 * @returns {Promise<VoiceSynthesisResponse>} - 响应结果
 */
const callVoiceSynthesisApi = async (params: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> => {
  abortController.value = new AbortController(); // 创建新的 AbortController

  try {
    console.log("发送语音合成请求:", params);
    
    const response = await fetch('/python/api/voice/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: abortController.value.signal, // 传递 signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API错误详情: ${errorText}`);
      throw new Error(`语音合成请求失败，状态码: ${response.status}, 详情: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("语音合成响应:", data);
    return data;
  } catch (error) {
    console.error("语音合成API调用失败:", error);
    throw error;
  }
};

/**
 * 获取可用的声音列表
 * @returns {Promise<VoiceInfo[]>} - 声音列表
 */
const getAvailableVoices = async (): Promise<VoiceInfo[]> => {
  const response = await fetch('/python/api/voice/voices');
  if (!response.ok) {
    throw new Error(`获取声音列表失败，状态码: ${response.status}`);
  }
  return await response.json();
};

/**
 * 获取可用的模型列表
 * @returns {Promise<ModelInfo[]>} - 模型列表
 */
const getAvailableModels = async (): Promise<ModelInfo[]> => {
  const response = await fetch('/python/api/voice/models');
  if (!response.ok) {
    throw new Error(`获取模型列表失败，状态码: ${response.status}`);
  }
  return await response.json();
};

/**
 * 封装语音合成逻辑
 * @returns {Object} - 返回方法
 */
export const useVoiceSynthesis = () => {
  const loading = ref(false);
  const voices = ref<VoiceInfo[]>([]);
  const models = ref<ModelInfo[]>([]);
  let result = reactive({
    role: '',
    content: '',
    audio_url: '',
  });

  // 中止请求
  const stopVoiceSynthesis = () => {
    if (abortController.value) {
      abortController.value.abort(); // 中止请求
      abortController.value = null; // 重置 AbortController
    }
  };

  // 加载声音和模型列表
  const loadVoicesAndModels = async () => {
    try {
      const [voicesData, modelsData] = await Promise.all([
        getAvailableVoices(),
        getAvailableModels(),
      ]);
      voices.value = voicesData;
      models.value = modelsData;
    } catch (error) {
      console.error('加载声音和模型列表失败:', error);
    }
  };

  // 合成语音
  const synthesizeVoice = async (params: VoiceSynthesisRequest) => {
    try {
      loading.value = true;
      // 清空结果
      result.role = '';
      result.content = '';
      result.audio_url = '';

      // 调用语音合成API
      const response = await callVoiceSynthesisApi(params);
      console.log('语音合成结果:', response);

      // 构建完整的音频URL
      const audioUrl = `/python${response.audio_url}`;

      // 更新结果
      result.role = 'assistant';
      result.content = `<div class="voice-message">
        <p>已为您生成语音：</p>
        <audio controls src="${audioUrl}" style="width:100%;max-width:300px;"></audio>
        <p>原文：${response.text}</p>
      </div>`;
      result.audio_url = audioUrl;

      return result;
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

  // 初始化时加载声音和模型列表
  loadVoicesAndModels();

  return {
    loading,
    voices,
    models,
    result,
    synthesizeVoice,
    stopVoiceSynthesis,
    loadVoicesAndModels,
  };
};

// 提供判断是否为语音合成助手的函数
export const isVoiceSynthesisMessage = (content: string): boolean => {
  return content.includes('语音生成助手') && content.includes('语音消息');
}; 