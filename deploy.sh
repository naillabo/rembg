#!/bin/bash

echo "🚀 开始部署 Rembg 背景移除服务..."

# 检查系统要求
check_requirements() {
    echo "🔍 检查系统要求..."
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 未安装，请先安装 Python 3.10+"
        exit 1
    fi
    
    # 检查 Python 版本
    python_version=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    if [[ $(echo "$python_version < 3.10" | bc -l) -eq 1 ]]; then
        echo "❌ Python 版本过低 ($python_version)，需要 3.10+"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi
    
    echo "✅ 系统要求检查通过"
}

# 安装 Rembg
install_rembg() {
    echo "📦 安装 Rembg..."
    
    # 检查是否已安装
    if python3 -c "import rembg" 2>/dev/null; then
        echo "✅ Rembg 已安装"
        return
    fi
    
    # 检查是否有 GPU
    if command -v nvidia-smi &> /dev/null; then
        echo "🎮 检测到 NVIDIA GPU，安装 GPU 版本..."
        pip3 install "rembg[gpu,cli]" || {
            echo "⚠️  GPU 版本安装失败，回退到 CPU 版本..."
            pip3 install "rembg[cpu,cli]"
        }
    else
        echo "💻 安装 CPU 版本..."
        pip3 install "rembg[cpu,cli]"
    fi
    
    echo "✅ Rembg 安装完成"
}

# 安装前端依赖
install_frontend() {
    echo "📦 安装前端依赖..."
    
    if [ ! -f "package.json" ]; then
        echo "❌ 未找到 package.json 文件"
        exit 1
    fi
    
    npm install
    echo "✅ 前端依赖安装完成"
}

# 构建前端
build_frontend() {
    echo "🔨 构建前端..."
    npm run build
    echo "✅ 前端构建完成"
}

# 启动服务
start_services() {
    echo "🚀 启动服务..."
    
    # 检查端口是否被占用
    if lsof -Pi :7000 -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  端口 7000 已被占用，尝试停止现有服务..."
        pkill -f "rembg s"
    fi
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️  端口 3000 已被占用，尝试停止现有服务..."
        pkill -f "npm run dev"
    fi
    
    # 启动 Rembg API 服务
    echo "🔧 启动 Rembg API 服务..."
    nohup rembg s --host 0.0.0.0 --port 7000 > rembg.log 2>&1 &
    REMBG_PID=$!
    
    # 等待服务启动
    echo "⏳ 等待 API 服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:7000/api >/dev/null 2>&1; then
            echo "✅ API 服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ API 服务启动超时"
            exit 1
        fi
        sleep 1
    done
    
    # 启动前端服务
    echo "🌐 启动前端服务..."
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # 等待前端服务启动
    echo "⏳ 等待前端服务启动..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo "✅ 前端服务启动成功"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ 前端服务启动超时"
            exit 1
        fi
        sleep 1
    done
    
    # 保存 PID
    echo $REMBG_PID > rembg.pid
    echo $FRONTEND_PID > frontend.pid
}

# 显示服务信息
show_info() {
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "📋 服务信息："
    echo "  🌐 Web 界面: http://localhost:3000"
    echo "  🔧 API 文档: http://localhost:7000/api"
    echo "  📊 API 状态: http://localhost:7000/api/remove"
    echo ""
    echo "📝 日志文件："
    echo "  📄 API 日志: $(pwd)/rembg.log"
    echo "  📄 前端日志: $(pwd)/frontend.log"
    echo ""
    echo "🛠️  管理命令："
    echo "  查看 API 日志: tail -f rembg.log"
    echo "  查看前端日志: tail -f frontend.log"
    echo "  停止服务: ./stop.sh"
    echo "  重启服务: ./restart.sh"
    echo ""
    echo "💡 提示："
    echo "  - 首次使用会自动下载 AI 模型，请耐心等待"
    echo "  - 如需 GPU 加速，请确保已安装 CUDA 和 cuDNN"
    echo "  - 建议使用 Chrome 或 Firefox 浏览器"
    echo ""
}

# 创建管理脚本
create_management_scripts() {
    # 停止脚本
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 停止服务..."

if [ -f "rembg.pid" ]; then
    kill $(cat rembg.pid) 2>/dev/null
    rm rembg.pid
    echo "✅ API 服务已停止"
fi

if [ -f "frontend.pid" ]; then
    kill $(cat frontend.pid) 2>/dev/null
    rm frontend.pid
    echo "✅ 前端服务已停止"
fi

# 强制停止相关进程
pkill -f "rembg s" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

echo "🎉 所有服务已停止"
EOF

    # 重启脚本
    cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 重启服务..."
./stop.sh
sleep 2
./deploy.sh --skip-install
EOF

    # 状态检查脚本
    cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 服务状态检查..."

# 检查 API 服务
if curl -s http://localhost:7000/api >/dev/null 2>&1; then
    echo "✅ API 服务运行正常 (http://localhost:7000)"
else
    echo "❌ API 服务未运行"
fi

# 检查前端服务
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ 前端服务运行正常 (http://localhost:3000)"
else
    echo "❌ 前端服务未运行"
fi

# 检查进程
echo ""
echo "🔍 相关进程："
ps aux | grep -E "(rembg|npm)" | grep -v grep || echo "  无相关进程运行"
EOF

    chmod +x stop.sh restart.sh status.sh
    echo "✅ 管理脚本创建完成"
}

# 主函数
main() {
    # 检查参数
    SKIP_INSTALL=false
    if [[ "$1" == "--skip-install" ]]; then
        SKIP_INSTALL=true
    fi
    
    if [[ "$SKIP_INSTALL" == false ]]; then
        check_requirements
        install_rembg
        install_frontend
        build_frontend
    fi
    
    start_services
    create_management_scripts
    show_info
}

# 错误处理
set -e
trap 'echo "❌ 部署过程中出现错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@"