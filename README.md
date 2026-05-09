# 🎂 生日祝福网站 - 功能升级版

## ✨ 功能特性

### 🔐 用户系统
- ✅ 简单注册功能（用户名 + 密码）
- ✅ 用户登录/退出
- ✅ Token 认证机制
- ✅ 密码加密存储（SHA-256）

### 🎨 贺卡管理
- ✅ 创建生日祝福贺卡
- ✅ 选择 6 种精美模板
- ✅ 设置贺卡有效期（天数）
- ✅ 查看自己创建的所有贺卡
- ✅ 编辑/删除贺卡
- ✅ 统计浏览量和点赞数

### 👍 点赞功能
- ✅ 访客可为贺卡点赞（+1）
- ✅ 防止重复点赞
- ✅ 实时显示点赞数
- ✅ 数据持久化存储

### 💾 数据存储
- ✅ 使用 EdgeOne KV Storage
- ✅ 用户数据持久化
- ✅ 贺卡数据持久化
- ✅ 点赞数据持久化

---

## 📂 项目结构

```
birthday-wishes/
├── index.html              # 主页面（模板选择 + 创建贺卡）
├── dashboard.html         # 用户仪表盘（管理贺卡）
├── package.json          # 项目配置
├── css/
│   ├── style.css        # 主样式文件
│   ├── auth.css         # 认证相关样式
│   └── dashboard.css   # 仪表盘样式
├── js/
│   ├── api.js          # API 工具类
│   ├── auth.js         # 认证逻辑
│   ├── main.js         # 主逻辑
│   └── dashboard.js    # 仪表盘逻辑
├── templates/
│   ├── elegant.html    # ✨ 优雅奢华（含+1按钮）
│   ├── playful.html    # 🎈 活泼派对
│   ├── minimalist.html # 🎁 极简清新
│   ├── floral.html     # 🌸 花卉浪漫
│   ├── cosmic.html     # 🌌 宇宙星空
│   └── vintage.html   # 📻 复古温暖
└── edge-functions/
    └── api/
        ├── auth/
        │   ├── register.js  # 用户注册 API
        │   └── login.js     # 用户登录 API
        ├── pages/
        │   ├── create.js    # 创建贺卡 API
        │   ├── list.js      # 列出用户贺卡 API
        │   ├── get/
        │   │   └── [id].js  # 获取贺卡详情 API
        │   ├── update/
        │   │   └── [id].js  # 更新贺卡 API
        │   └── delete/
        │       └── [id].js  # 删除贺卡 API
        └── likes/
            ├── add.js        # 点赞 API
            └── get/
                └── [pageId].js  # 获取点赞数 API
```

---

## 🚀 部署到 EdgeOne Pages

### 步骤 1: 创建 EdgeOne Pages 项目

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 点击"创建项目"
3. 选择"从模板创建" 或 "从 Git 仓库导入"
4. 项目名称：`birthday-wishes`
5. 点击"创建"

### 步骤 2: 启用 KV Storage

1. 在项目控制台，点击"KV Storage"
2. 点击"申请使用"（免费额度：1 GB 存储）
3. 点击"创建命名空间"
   - 命名空间名称：`birthday-kv`
   - 变量名：`birthday_kv`
4. 点击"确定"
5. 将命名空间绑定到项目

### 步骤 3: 部署项目

#### 方式一：通过 Git 部署（推荐）

1. 将代码推送到 Git 仓库（GitHub/GitLab/腾讯工蜂）
2. 在 EdgeOne Pages 控制台，点击"部署"
3. 选择 Git 仓库
4. 点击"开始部署"

#### 方式二：通过 CLI 部署

```bash
# 1. 设置环境变量（必须）
export PAGES_SOURCE=skills

# 2. 登录 EdgeOne Pages
edgeone login --site china  # 或 --site global

# 3. 链接项目
cd birthday-wishes
edgeone pages link

# 4. 部署
edgeone pages deploy
```

### 步骤 4: 访问网站

部署成功后，EdgeOne Pages 会提供一个 `.edgeone.run` 的域名，例如：
- `https://birthday-wishes-xxx.edgeone.run`

---

## 💻 本地开发

### 前置要求
- Node.js 18+
- npm 或 yarn

### 步骤

```bash
# 1. 克隆项目
cd birthday-wishes

# 2. 安装依赖（如果需要构建工具）
npm install

# 3. 启动本地服务器
# 方法一：使用 Vite（推荐）
npm run dev

# 方法二：使用简单的 HTTP 服务器
npx http-server -p 8080

# 方法三：使用 PHP 内置服务器
php -S localhost:8080
```

访问 `http://localhost:8080` 即可查看效果。

**注意**：本地开发时，Edge Functions 需要部署到 EdgeOne Pages 后才能正常工作。

---

## 📖 使用指南

### 1. 注册账号

1. 打开网站首页
2. 点击右上角"注册"按钮
3. 输入用户名和密码（至少 6 位）
4. 点击"注册"
5. 注册成功后会自动登录

### 2. 创建贺卡

1. 登录后，选择一个喜欢的模板
2. 填写表单：
   - 寿星姓名
   - 祝福语
   - 你的名字
   - 贺卡有效期（天数，0 为永不过期）
3. 点击"生成祝福页面"
4. 系统会打开新窗口显示生成的贺卡

### 3. 管理贺卡

1. 登录后，点击右上角"我的贺卡"
2. 查看所有创建的贺卡
3. 可以：
   - 点击"查看"打开贺卡
   - 点击"编辑"修改贺卡（开发中）
   - 点击"删除"删除贺卡

### 4. 点赞功能

1. 打开贺卡页面
2. 点击"👍 为TA点赞"按钮
3. 点赞数会实时更新
4. 每个用户只能点赞一次

---

## 🔧 API 接口说明

### 认证相关

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 注册 | POST | `/api/auth/register` | 用户注册 |
| 登录 | POST | `/api/auth/login` | 用户登录 |

### 贺卡管理

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 创建贺卡 | POST | `/api/pages/create` | 创建新贺卡 |
| 获取贺卡列表 | GET | `/api/pages/list` | 获取用户的所有贺卡 |
| 获取贺卡详情 | GET | `/api/pages/get/[id]` | 获取指定贺卡详情 |
| 更新贺卡 | PUT | `/api/pages/update/[id]` | 更新指定贺卡 |
| 删除贺卡 | DELETE | `/api/pages/delete/[id]` | 删除指定贺卡 |

### 点赞功能

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 点赞 | POST | `/api/likes/add` | 为贺卡点赞 |
| 获取点赞数 | GET | `/api/likes/get/[pageId]` | 获取贺卡的点赞数 |

---

## 🎨 模板说明

| 模板 | 文件名 | 风格 | 适合场合 |
|--------|--------|------|----------|
| ✨ 优雅奢华 | `elegant.html` | 深色金饰 | 正式场合、长辈 |
| 🎈 活泼派对 | `playful.html` | 彩色渐变 | 朋友聚会、年轻人 |
| 🎁 极简清新 | `minimalist.html` | 纯白简约 | 文艺风格、设计师 |
| 🌸 花卉浪漫 | `floral.html` | 粉色花朵 | 女性好友、情侣 |
| 🌌 宇宙星空 | `cosmic.html` | 深空魔法 | 梦幻风格、科幻迷 |
| 📻 复古温暖 | `vintage.html` | 怀旧色调 | 长辈、怀旧风格 |

**注意**：目前只有 `elegant.html` 包含完整的 "+1" 点赞按钮。其他模板需要按照相同方式添加。

---

## 🔧 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **后端**：EdgeOne Pages Functions (Edge.js runtime)
- **存储**：EdgeOne KV Storage
- **认证**：Token-based (Base64 encoded JSON)
- **密码加密**：SHA-256 (Web Crypto API)

---

## 📝 待完善功能

- [ ] 为所有模板添加 "+1" 点赞按钮
- [ ] 编辑贺卡功能
- [ ] 分享功能（生成分享链接）
- [ ] 贺卡过期提醒
- [ ] 更安全的认证机制（JWT）
- [ ] 密码重置功能
- [ ] 邮件通知功能

---

## 📄 许可证

MIT License

---

## 👤 作者

你的名字

---

## 🙏 致谢

- EdgeOne Pages 提供免费的托管和 Functions 能力
- Google Fonts 提供免费字体
- 所有开源项目的贡献者

---

**🎉 祝你使用愉快！**
