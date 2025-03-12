import os

# DashScope API密钥
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "sk-19542f7359d34415b821f256884a706e")

# 临时文件存储路径
TEMP_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp")

# 确保临时目录存在
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

# 音频文件保留时间（秒）
AUDIO_FILE_TTL = 3600  # 1小时

# 支持的声音列表
AVAILABLE_VOICES = [
    {"id": "longxiaochun", "name": "龙小春", "gender": "女"},
    {"id": "qingxiaoyu", "name": "青小宇", "gender": "男"},
    {"id": "sijiyun", "name": "思佳芸", "gender": "女"},
    {"id": "xijunma", "name": "西俊马", "gender": "男"}
]

# 支持的模型
AVAILABLE_MODELS = [
    {"id": "cosyvoice-v1", "name": "标准音色模型"},
    {"id": "sambert-v1", "name": "高级音色模型"}
] 