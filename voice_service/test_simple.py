#!/usr/bin/env python3
"""
简单的语音合成测试脚本
"""
import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
import os

# 设置API密钥
dashscope.api_key = "sk-19542f7359d34415b821f256884a706e"

def main():
    """主函数"""
    print("开始测试语音合成...")
    
    # 创建合成器
    print("创建语音合成器...")
    synthesizer = SpeechSynthesizer(model="cosyvoice-v1", voice="longxiaochun")
    
    # 调用API
    text = "这是一个测试。今天天气怎么样？"
    print(f"调用API，文本: '{text}'")
    audio = synthesizer.call(text)
    print(f"API调用成功，返回类型: {type(audio)}")
    print(f"音频数据大小: {len(audio) if isinstance(audio, bytes) else 'unknown'}")
    
    # 打印对象属性
    print(f"音频对象属性: {dir(audio)}")
    
    # 尝试保存音频
    output_path = "test_audio.mp3"
    try:
        with open(output_path, "wb") as f:
            f.write(audio)
        print(f"音频已保存到: {output_path}")
        
        # 检查文件大小
        file_size = os.path.getsize(output_path)
        print(f"文件大小: {file_size} 字节")
    except Exception as e:
        print(f"保存音频失败: {e}")
    
    print("测试完成")

if __name__ == "__main__":
    main() 