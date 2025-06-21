import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Sparkles, Zap, Image as ImageIcon, Settings, Github, Heart, AlertCircle, ExternalLink } from 'lucide-react';

interface ProcessingOptions {
  model: string;
  alphaMatting: boolean;
  onlyMask: boolean;
  postProcessMask: boolean;
  backgroundColor: string;
}

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [options, setOptions] = useState<ProcessingOptions>({
    model: 'birefnet-general',
    alphaMatting: false,
    onlyMask: false,
    postProcessMask: true,
    backgroundColor: 'transparent'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = [
    { value: 'birefnet-general', label: 'BiRefNet General (推荐)', description: '通用场景，高质量' },
    { value: 'birefnet-portrait', label: 'BiRefNet Portrait', description: '人像专用' },
    { value: 'u2net', label: 'U2Net', description: '经典模型，速度快' },
    { value: 'u2netp', label: 'U2Net Lite', description: '轻量版本' },
    { value: 'isnet-general-use', label: 'ISNet General', description: '高精度通用' },
    { value: 'isnet-anime', label: 'ISNet Anime', description: '动漫角色专用' },
    { value: 'silueta', label: 'Silueta', description: '小尺寸模型' }
  ];

  const backgroundColors = [
    { value: 'transparent', label: '透明背景', color: 'transparent' },
    { value: 'white', label: '白色', color: '#ffffff' },
    { value: 'black', label: '黑色', color: '#000000' },
    { value: 'red', label: '红色', color: '#ef4444' },
    { value: 'blue', label: '蓝色', color: '#3b82f6' },
    { value: 'green', label: '绿色', color: '#10b981' }
  ];

  // 检查 API 状态
  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/remove', {
          method: 'GET',
        });
        setApiStatus(response.ok ? 'available' : 'unavailable');
      } catch (error) {
        setApiStatus('unavailable');
      }
    };

    checkApiStatus();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedImage(file);
    setProcessedImage(null);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('model', options.model);
      formData.append('a', options.alphaMatting.toString());
      formData.append('om', options.onlyMask.toString());
      formData.append('ppm', options.postProcessMask.toString());
      
      if (options.backgroundColor !== 'transparent') {
        const bgColors = {
          white: '255,255,255,255',
          black: '0,0,0,255',
          red: '239,68,68,255',
          blue: '59,130,246,255',
          green: '16,185,129,255'
        };
        formData.append('bgc', bgColors[options.backgroundColor as keyof typeof bgColors] || '255,255,255,255');
      }

      const response = await fetch('/api/remove', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`处理失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setProcessedImage(imageUrl);
      
    } catch (error) {
      console.error('处理图片时出错:', error);
      setError(error instanceof Error ? error.message : '处理图片时出错，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `removed-bg-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openGithubRepo = () => {
    window.open('https://github.com/danielgatis/rembg', '_blank');
  };

  const openLocalSetupGuide = () => {
    window.open('https://github.com/danielgatis/rembg#installation', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Rembg
                </h1>
                <p className="text-sm text-gray-600">AI 智能背景移除</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* API 状态指示器 */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'available' ? 'bg-green-500' : 
                  apiStatus === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-gray-600">
                  {apiStatus === 'available' ? 'API 可用' : 
                   apiStatus === 'unavailable' ? 'API 不可用' : '检查中...'}
                </span>
              </div>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={openGithubRepo}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* WebContainer 环境提示 */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">在线演示环境说明</h3>
              <p className="text-blue-700 mb-4">
                您当前正在浏览器环境中查看此应用的前端界面。由于技术限制，无法在此环境中运行 Python 后端服务。
              </p>
              
              <div className="bg-blue-100 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">要体验完整功能，请选择以下方式之一：</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  <div className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800 mt-0.5">1.</span>
                    <div>
                      <strong>本地部署：</strong>
                      <div className="mt-1 space-y-1">
                        <div>• 安装 Python 和 Rembg: <code className="bg-blue-200 px-1 rounded text-xs">pip install "rembg[cpu,cli]"</code></div>
                        <div>• 启动后端服务: <code className="bg-blue-200 px-1 rounded text-xs">rembg s --host 0.0.0.0 --port 7000</code></div>
                        <div>• 下载此项目代码并运行前端</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800 mt-0.5">2.</span>
                    <div>
                      <strong>Docker 部署：</strong>
                      <div className="mt-1">
                        使用项目中的 <code className="bg-blue-200 px-1 rounded text-xs">docker-compose.yml</code> 一键启动完整服务
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <span className="font-semibold text-blue-800 mt-0.5">3.</span>
                    <div>
                      <strong>在线体验：</strong>
                      <div className="mt-1">
                        访问 <a href="https://huggingface.co/spaces/KenjieDec/RemBG" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Hugging Face 在线演示</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openLocalSetupGuide}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>查看安装指南</span>
                </button>
                <button
                  onClick={openGithubRepo}
                  className="inline-flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>获取源码</span>
                </button>
                <a
                  href="https://huggingface.co/spaces/KenjieDec/RemBG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>在线体验</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            一键移除图片背景
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            使用先进的 AI 技术，快速、精准地移除图片背景。支持多种模型，适用于人像、物品、动漫等各种场景。
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center space-x-2 text-gray-700">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>快速处理</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>高质量输出</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <Heart className="w-5 h-5 text-red-600" />
              <span>完全免费</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          {showSettings && (
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">处理设置</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI 模型
                    </label>
                    <select
                      value={options.model}
                      onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={apiStatus !== 'available'}
                    >
                      {models.map(model => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {models.find(m => m.value === options.model)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      背景颜色
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {backgroundColors.map(bg => (
                        <button
                          key={bg.value}
                          onClick={() => setOptions(prev => ({ ...prev, backgroundColor: bg.value }))}
                          disabled={apiStatus !== 'available'}
                          className={`p-3 rounded-lg border-2 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            options.backgroundColor === bg.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded mx-auto mb-1 border"
                            style={{
                              backgroundColor: bg.color === 'transparent' ? '#f3f4f6' : bg.color,
                              backgroundImage: bg.color === 'transparent' ? 
                                'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                              backgroundSize: bg.color === 'transparent' ? '8px 8px' : 'auto',
                              backgroundPosition: bg.color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                            }}
                          />
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={options.alphaMatting}
                        onChange={(e) => setOptions(prev => ({ ...prev, alphaMatting: e.target.checked }))}
                        disabled={apiStatus !== 'available'}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">Alpha 抠图</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={options.onlyMask}
                        onChange={(e) => setOptions(prev => ({ ...prev, onlyMask: e.target.checked }))}
                        disabled={apiStatus !== 'available'}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">仅输出蒙版</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={options.postProcessMask}
                        onChange={(e) => setOptions(prev => ({ ...prev, postProcessMask: e.target.checked }))}
                        disabled={apiStatus !== 'available'}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">后处理优化</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={showSettings ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">上传图片</h3>
                
                <div
                  className="upload-area"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="预览"
                        className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-sm text-gray-600">
                        {selectedImage?.name}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="btn-secondary"
                      >
                        更换图片
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          点击或拖拽上传图片
                        </p>
                        <p className="text-sm text-gray-500">
                          支持 JPG、PNG、WebP 格式
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedImage && (
                  <div className="mt-6">
                    <button
                      onClick={processImage}
                      disabled={isProcessing || apiStatus !== 'available'}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>处理中...</span>
                        </div>
                      ) : apiStatus !== 'available' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>需要启动后端服务</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Sparkles className="w-4 h-4" />
                          <span>移除背景</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Result Section */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">处理结果</h3>
                
                <div className="upload-area min-h-[200px] flex items-center justify-center">
                  {processedImage ? (
                    <div className="space-y-4 w-full">
                      <div 
                        className="relative mx-auto rounded-lg overflow-hidden shadow-md"
                        style={{
                          backgroundColor: options.backgroundColor === 'transparent' ? 'transparent' : 
                            backgroundColors.find(bg => bg.value === options.backgroundColor)?.color,
                          backgroundImage: options.backgroundColor === 'transparent' ? 
                            'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                          backgroundSize: options.backgroundColor === 'transparent' ? '20px 20px' : 'auto',
                          backgroundPosition: options.backgroundColor === 'transparent' ? '0 0, 0 10px, 10px -10px, -10px 0px' : 'auto'
                        }}
                      >
                        <img
                          src={processedImage}
                          alt="处理结果"
                          className="max-w-full max-h-64 mx-auto"
                        />
                      </div>
                      <button
                        onClick={downloadImage}
                        className="btn-primary w-full"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>下载图片</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {isProcessing ? '正在处理中...' : '处理后的图片将显示在这里'}
                      </p>
                      {apiStatus !== 'available' && (
                        <p className="text-sm text-gray-400 mt-2">
                          需要启动 Rembg 后端服务才能处理图片
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">功能特色</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">快速处理</h4>
              <p className="text-gray-600">
                采用最新的 AI 算法，几秒钟内完成背景移除，大幅提升工作效率。
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">多种模型</h4>
              <p className="text-gray-600">
                提供多种专业模型，包括通用、人像、动漫等，满足不同场景需求。
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">完全免费</h4>
              <p className="text-gray-600">
                开源免费，无需注册，保护隐私，所有处理都在本地完成。
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mt-16 card p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">快速开始</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">1. 安装 Rembg</h4>
              <div className="bg-gray-900 rounded-lg p-4 text-sm">
                <pre className="text-green-400">
{`# 安装 CPU 版本
pip install "rembg[cpu,cli]"

# 或安装 GPU 版本（需要 CUDA）
pip install "rembg[gpu,cli]"`}
                </pre>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">2. 启动 API 服务</h4>
              <div className="bg-gray-900 rounded-lg p-4 text-sm">
                <pre className="text-green-400">
{`# 启动 Web API 服务
rembg s --host 0.0.0.0 --port 7000

# 访问 API 文档
# http://localhost:7000/api`}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>提示：</strong> 启动服务后，刷新此页面即可使用完整的背景移除功能。首次使用时会自动下载所需的 AI 模型。
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            基于 <a href="https://github.com/danielgatis/rembg" className="text-blue-400 hover:text-blue-300">Rembg</a> 开源项目构建
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;