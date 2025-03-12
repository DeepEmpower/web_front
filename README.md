# 会话历史持久化功能

本项目实现了会话历史持久化功能，使用户从当前助手切换到其他助手窗口再回到当前窗口时，历史会话不会消失。

## 实现方式

1. 使用Pinia状态管理库和pinia-plugin-persistedstate持久化插件
2. 创建了专门的会话状态管理模块(conversation.ts)
3. 将会话数据按照助手类型和标签页进行分类存储
4. 使用localStorage而非sessionStorage来确保数据持久化

## 核心功能

- 保存每个助手的每个标签页的聊天历史
- 保存用户输入框内容
- 在助手间切换时自动恢复历史状态
- 支持多标签页的会话管理

## 最新更新 - 会话混淆问题修复

在初始版本中，不同助手之间的会话可能会出现混淆。现已修复此问题：

1. **使用路由路径作为助手唯一标识**：从之前使用`route.meta.title`改为使用`route.path`作为唯一标识
2. **增强数据隔离**：确保不同助手的会话数据完全隔离
3. **调试辅助功能**：添加了清除会话功能，可以在浏览器控制台使用`window.clearConversations()`清除所有会话数据
4. **修复路由监听**：使用路径监听代替标题监听，确保路由变化时正确保存和恢复会话数据

## 文件结构

- `src/store/modules/conversation.ts` - 会话状态管理模块
- `src/views/components/tabs/tab.vue` - 集成了会话持久化的标签页组件

## 使用方法

系统会自动保存和恢复会话历史，用户无需进行任何额外操作。当用户：

1. 在不同助手间切换
2. 关闭并重新打开浏览器
3. 添加或删除会话标签页

时，系统都能保持会话历史的完整性。

## 故障排除

如果遇到会话历史问题，可以尝试：

1. 在浏览器控制台执行`window.clearConversations()`清除所有会话数据
2. 刷新页面，重新开始会话

## 下载依赖
```
 npm install
 cnpm install
 yarn 
 # npm install 安装失败，请升级 nodejs 到 16 以上，或尝试使用以下命令：
  npm install --registry=https://registry.npm.taobao.org
  #安装python环境
```
## 运行打包
```
 调用语音生成api需要先运行voice_service的app.py文件
 cd voice_server
 python app.py
 运行脚手架 
 npm run dev
 npm run build 
```
## eslint+prettier
```
# eslint 检测代码
npm run lint

#prettier 格式化代码
npm run lint:prettier
```

## 文件目录结构
```
vue-admin-perfect
├─ public                 # 静态资源文件（忽略打包）
├─ src
│  ├─ api                 # API 接口管理
│  ├─ assets              # 静态资源文件
│  ├─ components          # 全局组件
│  ├─ config              # 全局配置项
│  ├─ hooks               # 常用 Hooks
│  ├─ language            # 语言国际化
│  ├─ layout              # 框架布局
│  ├─ routers             # 路由管理
│  ├─ store               # pinia store
│  ├─ styles              # 全局样式
│  ├─ utils               # 工具库
│  ├─ views               # 项目所有页面
│  ├─ App.vue             # 入口页面
│  └─ main.ts             # 入口文件
├─ .voice_service         # 语音生成大模型通过python请求
├─ .env                   # vite 常用配置
├─ .env.development       # 开发环境配置
├─ .env.production        # 生产环境配置
├─ .env.test              # 测试环境配置
├─ .eslintignore          # 忽略 Eslint 校验
├─ .eslintrc.cjs           # Eslint 校验配置
├─ .gitignore             # git 提交忽略
├─ .prettierignore        # 忽略 prettier 格式化
├─ .prettierrc.config.js         # prettier 配置
├─ index.html             # 入口 html
├─ yarn.lock      # 依赖包包版本锁
├─ package.json           # 依赖包管理
├─ README.md              # README 介绍
├─ tsconfig.json          # typescript 全局配置
└─ vite.config.ts         # vite 配置
```




