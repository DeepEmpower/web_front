import { ElMessage } from 'element-plus'; // 假设使用 Element Plus 的提示组件

/**
 * 清理文本中的特殊字符并格式化
 * @param text 要清理的文本
 * @returns 清理后的文本
 */
const cleanAndFormatText = (text: string): string => {
  return text
    .replace(/[*#_~`]/g, '') // 删除Markdown特殊字符
    .replace(/\n/g, '<br>'); // 将换行符替换为HTML换行标签
};

interface FetchStreamOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  onData?: (data: { role: string; id: string; reasoningContent: string; content: string }) => void; // 实时数据回调
  onError?: (error: Error) => void; // 错误回调
  onComplete?: () => void; // 完成回调
  signal:any;
  isLegalAssistant?: boolean; // 添加标识是否为法律助手的请求
  isTopicPlanningAssistant?: boolean; // 添加标识是否为选题思路助手的请求
  isVoiceSynthesisAssistant?: boolean; // 添加标识是否为语音合成助手的请求
  isMeetingAssistant?: boolean;
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
    isLegalAssistant = false, // 默认为false
    isTopicPlanningAssistant = false, // 默认为false
    isVoiceSynthesisAssistant = false, // 默认为false
    isMeetingAssistant = false
  } = options;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(!isMeetingAssistant && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: isMeetingAssistant ? body : JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error(`API错误详情: ${errorText}`);
        throw new Error(`网络请求失败，状态码: ${response.status}, 详情: ${errorText.substring(0, 200)}`);
      } catch (e) {
        throw new Error(`网络请求失败，状态码: ${response.status}`);
      }
    }

    // 如果是会议助手，直接处理响应
    if (isMeetingAssistant) {
      const data = await response.json();
      onData?.({
        role: 'assistant',
        id: new Date().getTime().toString(),
        reasoningContent: '',
        content: data.text || '音频转写失败'
      });
      onComplete?.();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取流数据');
    }

    const decoder = new TextDecoder('utf-8');
    reasoningContent = '';
    aiResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 解码数据并逐行处理
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n'); // 假设数据以换行符分隔
      lines.forEach((line) => {
        if (line.trim()) {
          try {
            if (isLegalAssistant) {
              // 处理法律助手的响应
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5); // 移除 'data:' 前缀
                try {
                  const jsonData = JSON.parse(jsonStr);
                  if (jsonData.code === 0 && jsonData.data && jsonData.data.answer) {
                    // 将回答内容格式化为 Markdown
                    aiResponse = jsonData.data.answer.trim();
                    
                    // 清理特殊符号并格式化文本
                    const formattedResponse = aiResponse
                      .replace(/^[\-]+|[\-]+$/gm, '') // 删除每行开头和结尾的连续破折号
                      .replace(/[*_#]/g, '') // 删除其他特殊符号
                      .split('\n')
                      .map(line => {
                        line = line.trim();
                        // 检测标题行（原来带有###的行）
                        if (line.includes('一、') || line.includes('二、') || 
                            line.includes('三、') || line.includes('四、')) {
                          return `<br><strong>${line}</strong>`;
                        }
                        return line;
                      })
                      .filter(line => line)
                      .join('<br>'); // 只使用单个换行标签
                    
                    onData?.({
                      role: 'assistant',
                      id: jsonData.data.id || new Date().getTime().toString(),
                      reasoningContent: '',
                      content: formattedResponse,
                    });
                  }
                } catch (e) {
                  console.error('解析JSON失败:', e);
                }
              }
            } else if (isTopicPlanningAssistant) {
              // 处理选题思路助手的响应
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim(); // 移除 'data:' 前缀并去除空格
                if (jsonStr === '[DONE]') {
                  // 流式响应结束
                  console.log('选题思路助手响应结束');
                  return;
                }
                
                try {
                  const jsonData = JSON.parse(jsonStr);
                  console.log('处理选题思路助手响应:', jsonData);
                  
                  // 兼容多种可能的响应格式
                  if (jsonData.choices) {
                    let content = '';
                    
                    // 处理流式增量delta格式
                    if (jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                      content = jsonData.choices[0].delta.content;
                      aiResponse += content;
                    } 
                    // 处理完整消息格式
                    else if (jsonData.choices[0].message && jsonData.choices[0].message.content) {
                      content = jsonData.choices[0].message.content;
                      aiResponse = content; // 替换而不是累加
                    }
                    
                    if (content) {
                      // 格式化文本，添加结构化显示
                      const formattedResponse = aiResponse
                        .split('\n')
                        .map(line => {
                          line = line.trim();
                          // 检测标题行
                          if (line.match(/^#+ /)) {
                            return `<br><strong>${line.replace(/^#+ /, '')}</strong>`;
                          }
                          // 检测列表项
                          if (line.match(/^[*-] /)) {
                            return `<br>• ${line.replace(/^[*-] /, '')}`;
                          }
                          // 检测数字列表
                          if (line.match(/^\d+\. /)) {
                            return `<br>${line}`;
                          }
                          // 检测小标题（如"市场需求："）
                          if (line.includes('：') && line.length < 20) {
                            return `<br><strong>${line}</strong>`;
                          }
                          return line;
                        })
                        .join('<br>');
                      
                      // 清理剩余的特殊字符
                      const cleanedResponse = formattedResponse.replace(/[*#]/g, '');
                      
                      onData?.({
                        role: 'assistant',
                        id: jsonData.id || new Date().getTime().toString(),
                        reasoningContent: '',
                        content: cleanedResponse,
                      });
                    }
                  }
                } catch (e) {
                  console.error('解析选题思路助手JSON失败:', e, 'JSON字符串:', jsonStr);
                }
              }
            } else if (isVoiceSynthesisAssistant) {
              // 处理语音合成助手的响应
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim(); // 移除 'data:' 前缀并去除空格
                if (jsonStr === '[DONE]') {
                  // 流式响应结束
                  console.log('语音合成助手响应结束');
                  return;
                }
                
                try {
                  const jsonData = JSON.parse(jsonStr);
                  console.log('处理语音合成助手响应:', jsonData);
                  
                  // 兼容多种可能的响应格式
                  if (jsonData.choices) {
                    let content = '';
                    
                    // 处理流式增量delta格式
                    if (jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
                      content = jsonData.choices[0].delta.content;
                      aiResponse += content;
                    } 
                    // 处理完整消息格式
                    else if (jsonData.choices[0].message && jsonData.choices[0].message.content) {
                      content = jsonData.choices[0].message.content;
                      aiResponse = content; // 替换而不是累加
                    }
                    
                    if (content) {
                      // 格式化文本，添加结构化显示
                      const formattedResponse = aiResponse
                        .split('\n')
                        .map(line => {
                          line = line.trim();
                          // 检测标题行
                          if (line.match(/^#+ /)) {
                            return `<br><strong>${line.replace(/^#+ /, '')}</strong>`;
                          }
                          // 检测列表项
                          if (line.match(/^[*-] /)) {
                            return `<br>• ${line.replace(/^[*-] /, '')}`;
                          }
                          // 检测数字列表
                          if (line.match(/^\d+\. /)) {
                            return `<br>${line}`;
                          }
                          // 检测小标题（如"市场需求："）
                          if (line.includes('：') && line.length < 20) {
                            return `<br><strong>${line}</strong>`;
                          }
                          return line;
                        })
                        .join('<br>');
                      
                      // 清理剩余的特殊字符
                      const cleanedResponse = formattedResponse.replace(/[*#]/g, '');
                      
                      onData?.({
                        role: 'assistant',
                        id: jsonData.id || new Date().getTime().toString(),
                        reasoningContent: '',
                        content: cleanedResponse,
                      });
                    }
                  }
                } catch (e) {
                  console.error('解析语音合成助手JSON失败:', e, 'JSON字符串:', jsonStr);
                }
              }
            } else {
              // 处理其他助手的响应
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
                
                // 使用通用函数清理特殊字符并格式化文本
                const formattedContent = cleanAndFormatText(aiResponse);
                const formattedReasoning = reasoningContent ? cleanAndFormatText(reasoningContent) : '';
                
                onData?.({
                  role: 'assistant',
                  id: data.id,
                  reasoningContent: formattedReasoning,
                  content: formattedContent,
                });
              }
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