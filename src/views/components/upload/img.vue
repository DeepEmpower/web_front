<template>
    <div class="upload-container">
      <!-- 图片预览 -->
      <div class="image-preview">
        <div v-for="(image, index) in uploadedImages" :key="index" class="image-container">
          <img :src="image.url" alt="预览图片" />
          <button class="delete-image" @click="removeImage(index)">×</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue';
  // 定义 props，接收 uploadedImages
  const props = defineProps({
    uploadedImages: {
      type: Array as () => { url: string }[], // 定义 uploadedImages 的类型
      required: true, // 必传
    },
  });
  
  // 定义 emits，用于通知父组件删除图片
  const emit = defineEmits(['remove-image']);
  
  // 删除图片
  const removeImage = (index: number) => {
    emit('remove-image', index); // 通知父组件删除图片
  };
  </script>
  
  <style scoped lang="scss">
  .upload-container {
    .image-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      background: #fff;
      padding: 5px 5px 0 5px;
  
      .image-container {
        position: relative;
        width: 73px;
        height: 30px;
        border: 1px solid #ddd;
        border-radius: 4px;
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