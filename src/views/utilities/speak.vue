<template>
  <el-upload
    action="https://jsonplaceholder.typicode.com/posts/"
    :on-change="handleFileChange"
    :auto-upload="false" 
    :show-file-list="false"
  >
    <el-button type="primary">点击上传</el-button>
  </el-upload>
</template>

<script setup lang="ts">
const handleFileChange = (file: File, fileList: FileList) => {
  console.log('选择的文件:', file);
  // 在这里处理文件
};
</script>