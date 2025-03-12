import { fetchStreamData } from './fetch';

/**
 * 会议音频转写服务
 * @param audioFile 音频文件
 * @param onData 数据回调
 * @param onError 错误回调
 * @param onComplete 完成回调
 * @param signal AbortController 信号
 */
export const transcribeAudio = async (
  audioFile: File,
  onData?: (data: any) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void,
  signal?: AbortSignal
) => {
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    await fetchStreamData({
      url: '/meeting-api/transcribe',
      method: 'POST',
      body: formData,
      onData,
      onError,
      onComplete,
      signal,
      isMeetingAssistant: true
    });
  } catch (error) {
    console.error('音频转写失败:', error);
    onError?.(error as Error);
  }
}; 