export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return handleHome(env);
    }

    if (url.pathname === "/upload" && request.method === "POST") {
      return handleUpload(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

function handleHome(env) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spic - 公益图床</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .upload-area {
      border: 3px dashed #667eea;
      border-radius: 12px;
      padding: 60px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: #f8f9ff;
    }
    .upload-area:hover, .upload-area.dragover {
      border-color: #764ba2;
      background: #f0f2ff;
    }
    .upload-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    input[type="file"] {
      display: none;
    }
    .preview {
      margin-top: 20px;
      display: none;
    }
    .preview img {
      max-width: 100%;
      border-radius: 8px;
      max-height: 300px;
    }
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      width: 100%;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .result {
      margin-top: 20px;
      display: none;
    }
    .result input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 10px;
    }
    .copy-btn {
      background: #10b981;
      margin-top: 10px;
    }
    .error {
      color: #ef4444;
      margin-top: 10px;
      text-align: center;
      display: none;
    }
    .loading {
      display: none;
      text-align: center;
      margin-top: 20px;
    }
    .setup-note {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .setup-note code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖼️ Spic</h1>
    <p class="subtitle">公益图床 - GitHub + jsDelivr CDN</p>
    
    <div class="setup-note">
      <strong>📝 首次使用：</strong>请先在 Cloudflare Workers 设置中添加环境变量 <code>GITHUB_TOKEN</code>、<code>GITHUB_REPO</code>（格式：用户名/仓库名）和 <code>GITHUB_BRANCH</code>
    </div>
    
    <div class="upload-area" id="uploadArea">
      <div class="upload-icon">📤</div>
      <p>点击或拖拽上传图片</p>
      <p style="font-size: 12px; color: #999; margin-top: 10px;">支持 JPG, PNG, GIF, WebP, SVG，最大 10MB</p>
    </div>
    <input type="file" id="fileInput" accept="image/*">
    
    <div class="preview" id="preview">
      <img id="previewImg">
    </div>
    
    <button class="btn" id="uploadBtn" disabled>上传图片</button>
    
    <div class="loading" id="loading">
      <p>⏳ 上传中...</p>
    </div>
    
    <div class="error" id="error"></div>
    
    <div class="result" id="result">
      <p>✅ 上传成功！</p>
      <input type="text" id="imageUrl" readonly>
      <button class="btn copy-btn" id="copyBtn">复制链接</button>
    </div>
  </div>

  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const previewImg = document.getElementById('previewImg');
    const uploadBtn = document.getElementById('uploadBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const result = document.getElementById('result');
    const imageUrl = document.getElementById('imageUrl');
    const copyBtn = document.getElementById('copyBtn');
    
    let selectedFile = null;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
    
    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        showError('请选择图片文件');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError('图片大小不能超过 10MB');
        return;
      }
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
        uploadBtn.disabled = false;
      };
      reader.readAsDataURL(file);
    }
    
    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile) return;
      
      loading.style.display = 'block';
      error.style.display = 'none';
      result.style.display = 'none';
      uploadBtn.disabled = true;
      
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      try {
        const res = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          imageUrl.value = data.url;
          result.style.display = 'block';
        } else {
          showError(data.message);
        }
      } catch (err) {
        showError('上传失败，请重试');
      } finally {
        loading.style.display = 'none';
        uploadBtn.disabled = false;
      }
    });
    
    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(imageUrl.value);
      copyBtn.textContent = '已复制！';
      setTimeout(() => {
        copyBtn.textContent = '复制链接';
      }, 2000);
    });
    
    function showError(msg) {
      error.textContent = msg;
      error.style.display = 'block';
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return json({ success: false, message: "没有文件" }, 400);
    }

    const allowedTypes = (
      env.ALLOWED_TYPES ||
      "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
    ).split(",");
    if (!allowedTypes.includes(file.type)) {
      return json({ success: false, message: "不支持的文件类型" }, 400);
    }

    const maxSize = parseInt(env.MAX_FILE_SIZE || "10485760");
    if (file.size > maxSize) {
      return json({ success: false, message: "文件太大" }, 400);
    }

    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      return json(
        {
          success: false,
          message: "请先配置 GITHUB_TOKEN 和 GITHUB_REPO 环境变量",
        },
        500,
      );
    }

    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const key = generateKey(file.type);
    const branch = env.GITHUB_BRANCH || "main";

    const githubResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/contents/images/${key}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "Spic-Image-Hosting",
        },
        body: JSON.stringify({
          message: `Upload image: ${key}`,
          content: base64,
          branch: branch,
        }),
      },
    );

    if (!githubResponse.ok) {
      const error = await githubResponse.text();
      console.error("GitHub API error:", error);
      return json(
        { success: false, message: "GitHub 上传失败，请检查配置" },
        500,
      );
    }

    const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${env.GITHUB_REPO}@${branch}/images/${key}`;
    return json({ success: true, url: jsdelivrUrl });
  } catch (e) {
    console.error(e);
    return json({ success: false, message: "服务器错误" }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function generateKey(mimeType) {
  const ext = mimeType.split("/")[1];
  const random =
    Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15);
  const now = Date.now();
  return `${now}-${random}.${ext}`;
}
