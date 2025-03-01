<template>
  <div v-if="themeConfig.fixedHeader" :style="{ height: `${themeConfig.showTag ? 50 : 50}px` }"> </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useSettingStore } from '@/store/modules/setting'
  const SettingStore = useSettingStore()
  const themeConfig = computed(() => SettingStore.themeConfig)
</script>
