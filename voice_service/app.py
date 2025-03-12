from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import time
from typing import Optional, List

from tts_service import synthesize_speech, clean_old_files
from config import TEMP_AUDIO_DIR, AVAILABLE_VOICES, AVAILABLE_MODELS, AUDIO_FILE_TTL

# 创建FastAPI应用
app = FastAPI(
    title="语音合成服务",
    description="基于DashScope的语音合成API服务",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class TTSRequest(BaseModel):
    text: str = Field(..., description="要合成的文本", min_length=1, max_length=5000)
    voice: str = Field("longtong", description="声音ID")
    model: str = Field("cosyvoice-v1", description="模型ID")

# 响应模型
class TTSResponse(BaseModel):
    audio_url: str
    file_id: str
    request_id: str
    text: str
    voice: str
    model: str
    status: str

class VoiceInfo(BaseModel):
    id: str
    name: str
    gender: str

class ModelInfo(BaseModel):
    id: str
    name: str

# API路由
@app.post("/api/voice/synthesize", response_model=TTSResponse)
async def synthesize(request: TTSRequest, background_tasks: BackgroundTasks):
    """
    将文本合成为语音
    """
    print(f"收到语音合成请求: {request.dict()}")
    try:
        # 验证参数
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="文本不能为空")
        
        # 调用TTS服务
        try:
            print(f"开始调用TTS服务，文本: '{request.text[:30]}...'")
            result = synthesize_speech(
                text=request.text,
                voice=request.voice,
                model=request.model
            )
            print(f"TTS服务调用成功，结果: {result}")
        except Exception as e:
            # 记录详细错误信息
            import traceback
            error_details = traceback.format_exc()
            print(f"语音合成失败: {str(e)}\n{error_details}")
            raise HTTPException(
                status_code=500, 
                detail=f"语音合成失败: {str(e)}"
            )
        
        # 安排清理任务
        background_tasks.add_task(clean_old_files, AUDIO_FILE_TTL)
        
        # 构建响应
        response = {
            "audio_url": f"/api/voice/audio/{result['file_id']}",
            "file_id": result["file_id"],
            "request_id": result["request_id"],
            "text": request.text,
            "voice": request.voice,
            "model": request.model,
            "status": "success"
        }
        print(f"返回响应: {response}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"处理请求时出错: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/voice/audio/{file_id}")
async def get_audio(file_id: str):
    """
    获取音频文件
    """
    # 安全检查：确保file_id不包含路径操作符
    if ".." in file_id or "/" in file_id or "\\" in file_id:
        raise HTTPException(status_code=400, detail="无效的文件ID")
    
    file_path = os.path.join(TEMP_AUDIO_DIR, f"{file_id}.mp3")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="音频文件不存在")
    
    return FileResponse(
        file_path, 
        media_type="audio/mpeg",
        headers={"Content-Disposition": f"attachment; filename={file_id}.mp3"}
    )

@app.get("/api/voice/voices", response_model=List[VoiceInfo])
async def get_voices():
    """
    获取可用的声音列表
    """
    return AVAILABLE_VOICES

@app.get("/api/voice/models", response_model=List[ModelInfo])
async def get_models():
    """
    获取可用的模型列表
    """
    return AVAILABLE_MODELS

@app.get("/api/voice/health")
async def health_check():
    """
    健康检查
    """
    return {"status": "ok", "timestamp": int(time.time())}

# 启动应用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 