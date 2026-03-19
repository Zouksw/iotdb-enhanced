---
title: "IoTDB Enhanced 文档规范"
en_title: "IoTDB Enhanced Documentation Specification"
version: "1.0.0"
last_updated: "2026-03-13"
status: "stable"
maintainer: "IoTDB Enhanced Team"
reviewers:
  - "Technical Writer"
  - "Project Maintainer"
tags:
  - "documentation"
  - "metadata"
  - "specification"
  - "guidelines"
target_audience: "开发者、技术写手、文档维护者"
related_docs:
  - "使用指南": "GUIDE.md"
  - "部署指南": "DEPLOYMENT.md"
  - "安全配置": "SECURITY.md"
  - "API 参考": "API.md"
changes:
  - version: "1.0.0"
    date: "2026-03-03"
    author: "IoTDB Enhanced Team"
    changes: "初始版本 - 建立文档元数据规范"
next_review: "2026-09-03"
approval:
  status: "approved"
  reviewed_by: "Project Maintainer"
  approved_date: "2026-03-03"
---

# IoTDB Enhanced 文档规范

本文档定义了 IoTDB Enhanced 项目的文档编写、维护和管理规范。遵循此规范可确保文档的一致性、可维护性和高质量。

---

## 目录

1. [核心文档结构](#核心文档结构)
2. [元数据规范](#元数据规范)
3. [文档编写指南](#文档编写指南)
4. [维护工作流](#维护工作流)
5. [自动化工具](#自动化工具)

---

## 核心文档结构

IoTDB Enhanced 项目维护 **5 个核心文档**：

| 文档 | 路径 | 用途 | 目标读者 |
|------|------|------|---------|
| README.md | `/README.md` | 项目入口，快速概览 | 所有用户 |
| 使用指南 | `/docs/GUIDE.md` | 完整功能使用说明 | 最终用户、开发者 |
| 部署指南 | `/docs/DEPLOYMENT.md` | 部署和运维指南 | 运维工程师 |
| 安全配置 | `/docs/SECURITY.md` | 安全配置和加固 | 安全工程师、运维 |
| API 参考 | `/docs/API.md` | API 接口文档 | 开发者 |

### 文档归档

历史或临时文档应归档到 `/docs/archive/` 目录：

```
docs/archive/
├── launch/       # 启动相关文档（检查清单、路线图等）
├── deployment/   # 旧版部署文档
├── security/     # 旧版安全文档
└── reference/    # 旧版参考文档
```

---

## 元数据规范

每个核心文档必须以 YAML 元数据块开头：

```yaml
---
title: "文档中文标题"
en_title: "Document English Title"
version: "1.0.0"
last_updated: "2026-03-13"
status: "stable"  # stable, draft, deprecated
maintainer: "维护者名称"
reviewers:
  - "审核人1"
  - "审核人2"
tags:
  - "tag1"
  - "tag2"
target_audience: "目标读者: 开发者/运维/最终用户"
related_docs:
  - "相关文档1": "路径1"
  - "相关文档2": "路径2"
changes:
  - version: "1.0.0"
    date: "2026-03-03"
    author: "作者"
    changes: "变更描述"
next_review: "2026-06-03"
approval:
  status: "approved"  # pending, approved, rejected
  reviewed_by: "审核人"
  approved_date: "2026-03-03"
---
```

### 元数据字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 中文文档标题 |
| `en_title` | string | ✅ | 英文文档标题 |
| `version` | string | ✅ | 文档版本（遵循语义化版本） |
| `last_updated` | date | ✅ | 最后更新日期 (YYYY-MM-DD) |
| `status` | enum | ✅ | 文档状态: `stable`, `draft`, `deprecated` |
| `maintainer` | string | ✅ | 文档维护者 |
| `reviewers` | array | ✅ | 审核人列表 |
| `tags` | array | ✅ | 文档标签 |
| `target_audience` | string | ✅ | 目标读者 |
| `related_docs` | object | ✅ | 相关文档映射 |
| `changes` | array | ✅ | 版本变更历史 |
| `next_review` | date | ✅ | 下次审查日期 (YYYY-MM-DD) |
| `approval` | object | ✅ | 审批状态信息 |

### 版本号规范

遵循语义化版本 (Semantic Versioning):

- **MAJOR.MINOR.PATCH** 格式
- MAJOR: 重大结构调整
- MINOR: 新增章节或内容
- PATCH: 小修复或改进

示例: `1.0.0`, `1.1.0`, `1.1.1`, `2.0.0`

### 状态定义

| 状态 | 说明 | 使用场景 |
|------|------|---------|
| `stable` | 稳定发布 | 经过审核的正式版本 |
| `draft` | 草稿 | 正在编写或审核中 |
| `deprecated` | 已废弃 | 不再维护，有替代文档 |

---

## 文档编写指南

### 文档结构

标准文档结构：

```markdown
---
[YAML 元数据]
---

# 文档标题

## 目录
[自动生成或手动维护]

## 章节一
### 子章节
#### 细节

## 章节二

## 附录
```

### 编写规范

1. **标题层级**
   - 标题层级不超过 4 级（h1-h4）
   - 每个一级标题 (`#`) 仅在文档开头使用一次
   - 文档元数据后紧跟主标题

2. **列表**
   - 列表项与上下文之间空一行
   - 嵌套列表缩进 2 个空格

3. **代码块**
   - 指定语言: ````bash`, ````javascript`, ````yaml` 等
   - 添加说明注释
   - 命令示例使用完整路径或上下文说明

4. **链接**
   - 使用相对路径链接项目内文档: `[文档名](docs/GUIDE.md)`
   - 外部链接使用描述性文本: [Apache IoTDB](https://iotdb.apache.org/)
   - 避免使用"点击这里"等无意义链接文本

5. **表格**
   - 表格前后空一行
   - 列宽根据内容调整，保持可读性

6. **图片**
   - 使用相对路径: `![描述](images/screenshot.png)`
   - 添加描述性 alt 文本

### 语言风格

1. **简洁清晰**
   - 使用主动语态
   - 避免冗余表达
   - 一句话表达一个意思

2. **术语一致性**
   - 使用项目统一术语
   - 首次出现时提供解释

3. **中英文混排**
   - 中英文之间添加空格
   - 专业术语首次出现时标注英文

### 代码示例规范

```bash
# 命令示例添加注释
# 必需参数使用 <>, 可选参数使用 []
command <required> [optional]

# 输出示例添加说明
# 输出: success message
```

```javascript
// 代码添加注释说明
function example() {
  // 实现说明
}
```

---

## 维护工作流

### 定期审查周期

| 文档类型 | 审查频率 | 触发条件 |
|---------|---------|---------|
| 核心文档 (5个) | 每季度 | 重大功能变更、安全问题 |
| 临时文档 | 按需 | 项目里程碑完成 |

### 变更触发条件

- 新功能发布
- 配置项变更
- 安全更新/漏洞修复
- 用户反馈问题
- 依赖项重大升级

### 变更流程

```
┌─────────────────────────────────────────────────────────────┐
│                      文档变更流程                            │
└─────────────────────────────────────────────────────────────┘

1. 识别变更需求
   │
   ├── 新功能/配置变更
   ├── 用户反馈
   ├── 安全问题
   └── 定期审查
   │
   ▼
2. 创建/更新文档
   │
   ├── 更新元数据 (version, last_updated, changes)
   ├── 修改内容
   └── 更新相关文档链接
   │
   ▼
3. 自我审查
   │
   ├── 检查格式规范
   ├── 验证链接有效性
   └── 确认内容准确性
   │
   ▼
4. 提交 Pull Request
   │
   ├── 填写 PR 模板
   └── @相关审核人
   │
   ▼
5. 审核与反馈
   │
   ├── 技术准确性审核
   ├── 文档规范审核
   └── 安全内容审核（如适用）
   │
   ▼
6. 批准与合并
   │
   ├── 更新 approval.status
   └── 设置 next_review
   │
   ▼
7. 归档（如需要）
   │
   └── 移动旧版本到 docs/archive/
```

### 责任分工

| 角色 | 职责 | 人员 |
|------|------|------|
| 文档所有者 | 对文档内容负最终责任 | Project Maintainer |
| 技术写手 | 负责文档编写和更新 | Developer + Contributor |
| 主题专家 | 提供技术内容并审核准确性 | Tech Lead |
| 安全审查员 | 审核安全相关文档 | Security Engineer |

---

## 自动化工具

### 必需工具

项目推荐使用以下工具进行文档质量检查：

#### 1. markdownlint - 格式检查

```bash
# 安装
npm install -g markdownlint-cli

# 使用
markdownlint README.md docs/*.md

# 配置文件: .markdownlint.json
```

#### 2. markdown-link-check - 链接检查

```bash
# 安装
npm install -g markdown-link-check

# 使用
markdown-link-check README.md
markdown-link-check docs/*.md
```

#### 3. cspell - 拼写检查

```bash
# 安装
npm install -g cspell

# 使用
cspell README.md docs/*.md

# 配置文件: .cspell.json
```

### 验证脚本

项目提供 `scripts/validate-docs.sh` 脚本进行批量验证：

```bash
#!/bin/bash
# 验证文档元数据完整性

docs=("README.md" "docs/GUIDE.md" "docs/DEPLOYMENT.md" "docs/SECURITY.md" "docs/API.md")

echo "🔍 检查文档元数据..."
for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✓ $doc"
    # 检查 YAML 头部
    if ! grep -q "^---$" "$doc"; then
      echo "  ⚠ 缺少 YAML 元数据头部"
    fi
  else
    echo "  ✗ $doc 不存在"
  fi
done

echo ""
echo "🔗 检查链接..."
markdown-link-check ${docs[*]}

echo ""
echo "📝 检查格式..."
markdownlint ${docs[*]}
```

### Pre-commit 钩子

配置 `.pre-commit-config.yaml` 自动运行检查：

```yaml
repos:
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.37.0
    hooks:
      - id: markdownlint
        args: [--fix]
```

---

## 文档模板

### 新文档模板

```markdown
---
title: "文档标题"
en_title: "Document Title"
version: "1.0.0"
last_updated: "2026-03-13"
status: "draft"
maintainer: "你的名字"
reviewers:
  - "审核人"
tags:
  - "tag1"
  - "tag2"
target_audience: "目标读者"
related_docs:
  - "相关文档": "路径"
changes:
  - version: "1.0.0"
    date: "2026-03-03"
    author: "作者"
    changes: "初始版本"
next_review: "2026-06-03"
approval:
  status: "pending"
  reviewed_by: ""
  approved_date: ""
---

# 文档标题

## 目录

## 章节一

内容...

## 章节二

内容...
```

---

## 附录

### 常用命令

```bash
# 检查所有文档的元数据
grep -A 30 "^---$" docs/*.md | less

# 统计文档行数
wc -l README.md docs/*.md

# 查找死链
find . -name "*.md" -exec grep -H "](.*\.md)" {} \;

# 批量更新日期
sed -i 's/last_updated: "[0-9]*-[0-9]*-[0-9]*"/last_updated: "'$(date +%Y-%m-%d)'"/' docs/*.md
```

### 相关资源

- [Markdown 指南](https://www.markdownguide.org/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [YAML 规范](https://yaml.org/spec/1.2/spec.html)

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-03
**下次审查**: 2026-09-03
