<template>
  <div class="upload-container">
    <!-- 上传区域 -->
    <div class="upload-zone" @click="triggerFileInput" @dragover.prevent="handleDragOver" @dragleave="handleDragLeave" @drop.prevent="handleDrop">
      <input type="file" ref="fileInput" multiple accept=".png,.jpg,.jpeg" style="display: none;" @change="handleFileSelect">
      <el-icon>
        <Upload  />
      </el-icon>
    </div>
    <!-- 图片预览 -->
    <!-- <div class="image-preview">
      <div v-for="(image, index) in uploadedImages" :key="index" class="image-container">
        <img :src="image.url" alt="预览图片" />
        <button class="delete-image" @click="removeImage(index)">×</button>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';

const emit = defineEmits(['update-images']);
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadedImages = ref<{ file: File; url: string }[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (event: Event) => {
  const files = (event.target as HTMLInputElement).files;
  if (files) {
    handleFiles(files);
  }
};

const handleDragOver = () => {
  const uploadZone = document.querySelector('.upload-zone');
  uploadZone?.classList.add('dragover');
};

const handleDragLeave = () => {
  const uploadZone = document.querySelector('.upload-zone');
  uploadZone?.classList.remove('dragover');
};

const handleDrop = (event: DragEvent) => {
  const uploadZone = document.querySelector('.upload-zone');
  uploadZone?.classList.remove('dragover');

  if (event.dataTransfer?.files) {
    handleFiles(event.dataTransfer.files);
  }
};

const handleFiles = (files: FileList) => {
  Array.from(files).forEach((file) => {
    if (validateFile(file)) {
      addImagePreview(file);
    }
  });
};

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
  emit('update-images', uploadedImages.value);
  reader.readAsDataURL(file);
};

// 暴露 uploadedImages 给父组件
defineExpose({
  uploadedImages,
});
</script>

<style scoped lang="scss">
.upload-container {
  .upload-zone {

    &.dragover {
      border-color: #2196f3;
      background-color: #e3f2fd;
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
  }

  .image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;

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
  }
}
</style>