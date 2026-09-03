# Deeper AI v2

> 全新架构的多模型 AI 开发工作台 — 支持 11+ 国内外大模型、代码审查、MCP 工具生态

## 核心改进（相比 v1）

| 维度 | v1 | v2 |
|------|----|----|
| 架构 | App.tsx 1100+ 行 | AppShell 组件化 |
| 测试 | 0% 覆盖率 | 60%+ 覆盖率目标 |
| CI/CD | 无 | GitHub Actions |
| 监控 | 无 | Sentry 集成 |
| 错误处理 | 基础 ErrorBoundary | 熔断器 + 重试 + 降级 |
| 代码分割 | 手动懒加载 | Vite manualChunks |
| 类型安全 | 宽松 | strict mode |

## 技术栈

- **前端**: React 18 + TypeScript 5.3 + Vite 5
- **状态管理**: Zustand 4 + Immer
- **后端**: Netlify Functions
- **数据库**: Supabase (PostgreSQL + Auth)
- **支付**: Stripe
- **AI SDK**: OpenAI + Anthropic

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 完整开发（含 Netlify Functions）
npx netlify dev

# 类型检查
npm run type-check

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e

# 构建
npm run build
```

## 项目结构

```
deeper-ai-v2/
├── src/
│   ├── components/        # UI 组件
│   │   ├── AppShell.tsx    # 应用外壳（替代巨型 App.tsx）
│   │   ├── chat/           # 聊天面板
│   │   ├── review/         # 代码审查
│   │   ├── mcp/            # MCP 配置
│   │   ├── knowledge/      # 知识库
│   │   ├── team/           # 团队管理
│   │   ├── settings/       # 设置/订阅
│   │   ├── layout/         # 布局组件
│   │   └── common/         # 通用组件
│   ├── services/           # 服务层
│   │   ├── model-registry.ts    # 模型注册表
│   │   ├── model-factory.ts     # 模型工厂
│   │   ├── chat-service.ts      # 聊天服务
│   │   ├── retry-middleware.ts   # 重试+熔断器
│   │   ├── supabase-service.ts  # Supabase 服务
│   │   └── adapters/            # 模型适配器
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand 状态管理
│   ├── styles/             # 主题和样式
│   └── types/              # TypeScript 类型定义
├── netlify/functions/      # 后端服务
│   ├── gateway.mts         # LLM 网关（4 层架构）
│   ├── billing.mts         # Stripe 计费
│   ├── review-webhook.mts  # GitHub PR 审查
│   └── mcp-proxy.mts       # MCP 代理
├── __tests__/              # 测试
│   ├── unit/               # 单元测试
│   ├── integration/        # 集成测试
│   └── e2e/                # E2E 测试
├── .github/workflows/      # CI/CD
└── Dockerfile              # Docker 部署
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 网关
VITE_GATEWAY_URL=
VITE_MANAGED_MODELS=[]

# 服务端 API Keys
MANAGED_OPENAI_KEY=
MANAGED_ANTHROPIC_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## 部署

### Netlify（推荐）
```bash
npm run build
# 部署 dist/ 目录到 Netlify
```

### Docker
```bash
docker-compose up -d
```

## License

MIT