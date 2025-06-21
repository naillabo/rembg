# Rembg Web Interface

这是一个基于 Rembg 的现代化 Web 界面，提供直观易用的图像背景移除功能。

## 🎯 功能特色

- **多种 AI 模型**：支持 BiRefNet、U2Net、ISNet 等多种专业模型
- **快速处理**：采用最新 AI 算法，秒级完成背景移除
- **自定义背景**：支持透明、纯色等多种背景选项
- **响应式设计**：完美适配桌面和移动设备
- **高级选项**：Alpha 抠图、后处理优化等专业功能
- **实时状态**：API 服务状态实时监控

## 🚀 快速开始

### 方式一：本地开发

1. **启动 Rembg 后端服务**：
```bash
# 安装 Rembg
pip install "rembg[cpu,cli]"

# 启动 API 服务
rembg s --host 0.0.0.0 --port 7000
```

2. **启动前端界面**：
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

3. **访问应用**：
   - Web 界面: http://localhost:3000
   - API 文档: http://localhost:7000/api

### 方式二：Docker 部署

1. **使用 Docker Compose**：
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

2. **访问应用**：
   - Web 界面: http://localhost:3000
   - API 服务: http://localhost:7000

### 方式三：生产部署

1. **构建前端**：
```bash
npm run build
```

2. **部署到 Nginx**：
```bash
# 复制构建文件到 Nginx 目录
cp -r dist/* /var/www/html/

# 配置 Nginx 代理（参考 nginx.conf）
```

## 📋 系统要求

### 最低要求
- Python 3.10+
- Node.js 18+
- 2GB RAM
- 1GB 磁盘空间

### 推荐配置
- Python 3.11+
- Node.js 20+
- 8GB RAM
- NVIDIA GPU（可选，用于加速）
- 5GB 磁盘空间

## 🔧 配置说明

### 环境变量

```bash
# Rembg 配置
MODEL_CHECKSUM_DISABLED=1  # 禁用模型校验（可选）
U2NET_HOME=/path/to/models # 模型存储路径（可选）

# 前端配置
VITE_API_URL=http://localhost:7000  # API 服务地址
```

### Nginx 配置

参考 `nginx.conf` 文件，主要配置：
- 前端静态文件服务
- API 请求代理
- 文件上传大小限制
- 超时时间设置

## 🎨 支持的模型

| 模型名称 | 适用场景 | 特点 |
|---------|---------|------|
| birefnet-general | 通用场景 | 高质量，推荐使用 |
| birefnet-portrait | 人像处理 | 专门优化人像效果 |
| birefnet-general-lite | 通用场景 | 轻量版，速度快 |
| u2net | 通用场景 | 经典模型，兼容性好 |
| u2netp | 通用场景 | 轻量版 U2Net |
| isnet-general-use | 通用场景 | 高精度处理 |
| isnet-anime | 动漫角色 | 专门处理动漫图像 |
| sam | 通用场景 | Segment Anything Model |
| silueta | 小文件 | 模型体积小 |

## 🔌 API 接口

### 移除背景
```http
POST /api/remove
Content-Type: multipart/form-data

参数：
- file: 图片文件
- model: 模型名称（可选，默认 u2net）
- a: 是否启用 Alpha 抠图（可选）
- om: 是否仅输出蒙版（可选）
- ppm: 是否后处理（可选）
- bgc: 背景颜色（可选，格式：R,G,B,A）
```

### 从 URL 移除背景
```http
GET /api/remove?url=图片URL&model=模型名称
```

## 🚀 GPU 加速

如果有 NVIDIA GPU，可以安装 GPU 版本以获得更快的处理速度：

```bash
# 安装 GPU 版本
pip install "rembg[gpu,cli]"

# 检查 CUDA 是否可用
python -c "import torch; print(torch.cuda.is_available())"
```

## 🛠️ 开发指南

### 项目结构
```
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── public/              # 静态资源
├── docker-compose.yml   # Docker 配置
├── nginx.conf          # Nginx 配置
└── deploy.sh           # 部署脚本
```

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 使用 Tailwind CSS 进行样式管理
- 遵循 React Hooks 最佳实践
- 使用 ESLint 进行代码检查

## 🐳 Docker 部署

### 单独部署前端
```bash
# 构建镜像
docker build -t rembg-web .

# 运行容器
docker run -p 3000:80 rembg-web
```

### 完整部署（前端+后端）
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🔍 故障排除

### 常见问题

1. **API 服务不可用**
   - 检查 Rembg 服务是否启动
   - 确认端口 7000 未被占用
   - 检查防火墙设置

2. **模型下载失败**
   - 检查网络连接
   - 设置 `MODEL_CHECKSUM_DISABLED=1`
   - 手动下载模型文件

3. **内存不足**
   - 使用轻量版模型（u2netp, birefnet-general-lite）
   - 增加系统内存
   - 调整图片尺寸

4. **处理速度慢**
   - 使用 GPU 版本
   - 选择更快的模型
   - 减小图片尺寸

### 日志查看
```bash
# Docker 日志
docker-compose logs rembg-api
docker-compose logs rembg-web

# 系统日志
journalctl -u rembg-service
```

## 📄 许可证

本项目基于 MIT 许可证开源。原始 Rembg 项目同样采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

### 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 🔗 相关链接

- [Rembg 原始项目](https://github.com/danielgatis/rembg)
- [在线演示](https://huggingface.co/spaces/KenjieDec/RemBG)
- [API 文档](http://localhost:7000/api)
- [问题反馈](https://github.com/danielgatis/rembg/issues)

## 📞 支持

如果您在使用过程中遇到问题，可以：
- 查看 [FAQ 文档](https://github.com/danielgatis/rembg#faq)
- 提交 [Issue](https://github.com/danielgatis/rembg/issues)
- 参考 [官方文档](https://github.com/danielgatis/rembg)