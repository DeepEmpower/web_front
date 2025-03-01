import { ElMessage } from 'element-plus'; // 假设使用 Element Plus 的提示组件

interface FetchStreamOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  onData?: (data: { role: string; id: string; reasoningContent: string; content: string }) => void; // 实时数据回调
  onError?: (error: Error) => void; // 错误回调
  onComplete?: () => void; // 完成回调
  signal:any;
}

interface StreamData {
  role: string;
  id: string;
  reasoningContent: string;
  content: string;
}

let reasoningContent: string = '';
let aiResponse: string = '';

/**
 * 封装流数据 Fetch 请求
 * @param options 请求配置
 */
const fetchStreamData = async (options: FetchStreamOptions): Promise<void> => {
  const {
    url,
    method = 'POST',
    headers = {},
    body,
    onData,
    onError,
    onComplete,
    signal, // 接收 AbortSignal
  } = options;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`网络请求失败，状态码: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取流数据');
    }

    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码数据并逐行处理
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n'); // 假设数据以换行符分隔
      lines.forEach((line) => {
        console.log(line, 312321312321);
        if (line.trim()) {
          try {
            // if (line.includes('[DONE]')) break;
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0].delta) {
              // 处理reasoning_content
              if (data.choices[0].delta.reasoning_content) {
                const reasoning = data.choices[0].delta.reasoning_content;
                reasoningContent += reasoning;

                // reasoningElement.textContent = `推理过程: ${reasoningContent}`;
              }

              // 处理content
              if (data.choices[0].delta.content) {
                const content = data.choices[0].delta.content;
                aiResponse += content;

                // contentElement.textContent = aiResponse;
              }
              console.log(reasoningContent);
              onData?.({
                role: 'assistant',
                id: data.id,
                reasoningContent: reasoningContent.replace(/\n/g, "<br>"),
                content: aiResponse.replace(/\n/g, "<br>"),
              });
              // streamData.value=[]
              // streamData.value.push({reasoningContent:reasoningContent,content:aiResponse});
              // 平滑滚动到底部
              // currentStreamingMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          } catch (e) {
            console.error('解析响应数据失败:', e);
          }
          // 调用回调函数返回实时数据
        }
      });
    }

    onComplete?.(); // 调用完成回调
  } catch (error) {
    console.error('请求失败:', error);
    onError?.(error); // 调用错误回调
    // ElMessage.error('请求失败，请检查网络或 API');
  }
};

export { fetchStreamData };