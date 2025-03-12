import dashscope
from dashscope.audio.tts_v2 import SpeechSynthesizer
import os
import time
import uuid
from config import DASHSCOPE_API_KEY, TEMP_AUDIO_DIR

# 配置API密钥
dashscope.api_key = DASHSCOPE_API_KEY

def synthesize_speech(text, voice="longxiaochun", model="cosyvoice-v1"):
    """
    合成语音并保存到文件
    
    Args:
        text (str): 要合成的文本
        voice (str): 声音ID
        model (str): 模型ID
        
    Returns:
        dict: 包含音频文件路径和元数据的字典
    """
    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    output_path = os.path.join(TEMP_AUDIO_DIR, f"{file_id}.mp3")
    
    try:
        print(f"创建语音合成器: model={model}, voice={voice}")
        # 创建合成器
        synthesizer = SpeechSynthesizer(model=model, voice=voice)
        
        # 调用API
        print(f"调用语音合成API: text='{text[:30]}...'")
        audio = synthesizer.call(text)
        print(f"API调用成功: 返回类型={type(audio)}, 大小={len(audio) if isinstance(audio, bytes) else 'unknown'}")
        
        # 保存音频文件
        print(f"保存音频文件: {output_path}")
        with open(output_path, 'wb') as f:
            f.write(audio)
        
        # 获取请求ID和延迟信息
        request_id = "unknown"
        delay_ms = 0
        try:
            request_id = synthesizer.get_last_request_id()
            delay_ms = synthesizer.get_first_package_delay()
            print(f"请求信息: id={request_id}, delay={delay_ms}ms")
        except Exception as e:
            print(f"获取请求信息失败: {e}")
        
        # 返回结果
        result = {
            "file_id": file_id,
            "file_path": output_path,
            "request_id": request_id,
            "delay_ms": delay_ms,
            "text": text,
            "voice": voice,
            "model": model,
            "timestamp": int(time.time())
        }
        print(f"语音合成完成: {result}")
        return result
    except Exception as e:
        print(f"语音合成失败: {e}")
        if os.path.exists(output_path):
            os.remove(output_path)
        raise

def clean_old_files(max_age=3600):
    """
    清理旧的音频文件
    
    Args:
        max_age (int): 最大保留时间（秒）
    """
    now = time.time()
    for filename in os.listdir(TEMP_AUDIO_DIR):
        file_path = os.path.join(TEMP_AUDIO_DIR, filename)
        if os.path.isfile(file_path):
            # 检查文件修改时间
            if now - os.path.getmtime(file_path) > max_age:
                try:
                    os.remove(file_path)
                    print(f"已删除过期文件: {filename}")
                except Exception as e:
                    print(f"删除文件失败 {filename}: {str(e)}") 