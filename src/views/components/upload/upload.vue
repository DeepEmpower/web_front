<template>
    <div class="chat-input">
      <!-- 上传按钮 -->
      <button v-if="showUploadButton" class="upload-btn" @click="toggleUploadArea">
        <i>📎</i>
      </button>
  
      <!-- 上传区域 -->
      <div v-if="showUploadArea" class="upload-area">
        <div class="upload-zone" @click="triggerFileInput" @dragover.prevent="handleDragOver" @dragleave="handleDragLeave" @drop.prevent="handleDrop">
          <input type="file" ref="fileInput" multiple accept=".png,.jpg,.jpeg"  @change="handleFileSelect">
          <div class="upload-prompt">
            <i>📸</i>
            <span>点击或拖拽上传图片</span>
            <small>支持 PNG、JPG、JPEG 格式，最大 5MB</small>
          </div>
        </div>
  
        <!-- 图片预览 -->
        <div class="image-preview">
          <div v-for="(image, index) in uploadedImages" :key="index" class="image-container">
            <img :src="image.url" alt="预览图片" />
            <button class="delete-image" @click="removeImage(index)">×</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { login } from '@/api/user';
import { ref } from 'vue';
  
  // 允许的文件类型
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
  // 最大文件大小（5MB）
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  // 上传的图片列表
  const uploadedImages = ref<{ file: File; url: string }[]>([]);
  
  // 是否显示上传按钮
  const showUploadButton = ref(true);
  // 是否显示上传区域
  const showUploadArea = ref(true);
  
  // 文件输入框的引用
  const fileInput = ref<HTMLInputElement | null>(null);
  
  // 切换上传区域的显示状态
  const toggleUploadArea = () => {
    showUploadArea.value = !showUploadArea.value;
  };
  
  // 触发文件选择
  const triggerFileInput = () => {
    e.preventDefault()
    console.log(3333)
    if (fileInput.value) {
        console.log(333333)
      fileInput.value.click();
    }
  };
  
  // 处理文件选择
  const handleFileSelect = (event: Event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      handleFiles(files);
    }
  };
  
  // 处理拖放
  const handleDragOver = () => {
    // 添加拖放样式
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone?.classList.add('dragover');
  };
  
  const handleDragLeave = () => {
    // 移除拖放样式
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone?.classList.remove('dragover');
  };
  
  const handleDrop = (event: DragEvent) => {
    // 移除拖放样式
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone?.classList.remove('dragover');
  
    if (event.dataTransfer?.files) {
      handleFiles(event.dataTransfer.files);
    }
  };
  
  // 处理文件
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        addImagePreview(file);
      }
    });
  };
  
  // 验证文件
  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('只支持 PNG、JPG、JPEG 格式的图片');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('图片大小不能超过 5MB');
      return false;
    }
    return true;
  };
  
  // 添加图片预览
  const addImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        uploadedImages.value.push({
          file,
          url: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };
  
  // 删除图片
  const removeImage = (index: number) => {
    uploadedImages.value.splice(index, 1);
  };
  
  // 暴露方法给父组件
  defineExpose({
    uploadedImages,
    toggleUploadArea,
  });
  </script>
  
  <style scoped lang="scss">
  .chat-input {
    position: relative;
  }
  
  .upload-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    color: #666;
    transition: color 0.3s ease;
  
    &:hover {
      color: #2196f3;
    }
  }
  
  .upload-area {
    margin-top: 10px;
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    background-color: #f9f9f9;
  }
  
  .upload-zone {
    text-align: center;
    cursor: pointer;
  
    &.dragover {
      border-color: #2196f3;
      background-color: #e3f2fd;
    }
  }
  
  .upload-prompt {
    i {
      font-size: 24px;
    }
    span {
      display: block;
      margin: 10px 0;
      font-size: 16px;
    }
    small {
      color: #999;
    }
  }
  
  .image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
  }
  
  .image-container {
    position: relative;
    width: 100px;
    height: 100px;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  
    .delete-image {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255, 0, 0, 0.8);
      border: none;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
  
      &:hover {
        background: rgba(255, 0, 0, 1);
      }
    }
  }
  </style>