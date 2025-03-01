// api.js
const API_CONFIG = {
    url: 'https://api.deepseek.com/v1/ocr', // 替换为实际的 DeepSeek OCR API 地址
    apiKey: 'your-api-key', // 替换为你的 API Key
  };
  
  /**
   * 调用 DeepSeek OCR API 识别图片中的文字
   * @param {string} base64Image - 图片的 Base64 编码
   * @returns {Promise<string>} - 识别出的文字内容
   */
  export const callOcrApi = async (base64Image) => {
    const response = await fetch(API_CONFIG.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        image: base64Image, // 发送 Base64 编码的图片
      }),
    });
  
    if (!response.ok) {
      throw new Error(`OCR API 请求失败: ${response.statusText}`);
    }
  
    const data = await response.json();
    return data.text; // 假设 API 返回的文字内容在 `text` 字段中
  };