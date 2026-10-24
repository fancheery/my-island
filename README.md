# 我的岛

一个只属于你的岛。你可以来待一会儿，写点什么，也可以什么都不做。

**v0.1**：邮箱登录 · 今天页（文字 / 天气 / 照片 / 自动保存）· 按月回看 · PWA · 一键导出。
安静极简，没有卡片、没有红点、没有打卡。

## 一、本地运行（不需要任何配置）

```bash
# 安装依赖（Node 18+）
pnpm install

# 启动
pnpm dev
```

打开 <http://localhost:3000>。

**演示模式**：没有配置 Supabase 时，数据保存在服务器本地的 `data/db.json`（已加入 .gitignore），适合先试用。配置 Supabase 后自动切换为云端，无需改代码。

## 二、接入云端（Supabase）

### 1. 创建项目

1. 打开 <https://supabase.com>，用邮箱注册登录。
2. 新建一个项目（区域选 **Singapore**，离国内最近），密码自己记住。
3. 进入 **SQL Editor → New query**，把 [`supabase/schema.sql`](supabase/schema.sql) 整段粘贴运行。
4. 进入 **Authentication → Providers → Email**：
   - **Enable Email provider 保持打开**；
   - **关掉 Confirm email**（本项目登录方式是邮箱 + 密码，不需要确认邮件）。

### 2. 填环境变量

1. **Project Settings → API** 里复制 `Project URL` 和 `anon public` key。
2. 在项目根目录新建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

3. 重启 `pnpm dev`。首页会先出现登录框：第一次来点「第一次来？创建我的岛」设密码，之后用邮箱 + 密码登录。

## 三、部署（Cloudflare Pages + GitHub）

构建在 Cloudflare 的 Linux 服务器上完成（Windows 本地无法直接产出 Cloudflare 构建包），所以走 Git 集成：

1. 把代码推到 GitHub 仓库（公开或私有均可）。
2. Cloudflare Pages 新建项目 → **Connect to Git** → 选择该仓库。
3. 构建设置：框架预设选 **Next.js**；如未自动识别，手动填：构建命令 `npx @opennextjs/cloudflare@latest build`，输出目录 `.open-next`。
4. 环境变量（必须设置，否则构建出的站点没有后端地址）：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Save and Deploy。完成后把免费子域（xxx.pages.dev）或自定义域名绑定即可。

> 部署后，访问 Supabase 的是 Cloudflare 的服务器，手机端**不需要代理**。

## 四、手机上安装

用手机浏览器打开网址 → 浏览器菜单 → **添加到主屏幕**。
安装后会全屏运行、支持离线打开；断网时写的字会留在本机，联网后自动补传。

## 五、数据

- 每篇日记自动保存，间隔 800ms。
- 照片上传前会压缩到 1600px，并清除 GPS 等 EXIF 信息。
- **设置 → 导出全部**：全部日记和照片打包成一个 zip（`日记.md` + `日记.json` + `images/`）。
- 云端模式下，数据库行级权限（RLS）保证只有你自己的账号能读写；图片桶私有，通过 5 分钟签名链接访问。

## 六、目录结构

```
app/
  page.tsx              今天
  archive/              回看（时间线 + 单篇）
  chat/                 聊聊（v0.2 回声，占位）
  settings/             设置
  api/                  数据接口（entries / images / image / export / auth）
components/             TodayApp、ArchiveApp、EntryDetail、TabBar、AuthGate 等
lib/                    types、backend（Supabase/演示双后端）、local-db、supabase-server
supabase/schema.sql     云端初始化 SQL（RLS + 私有存储桶）
public/                 manifest、sw.js、图标
```

## 七、路线图

| 版本 | 内容 |
|---|---|
| v0.1 ✅ | 登录、今天页、云同步、回看、PWA、导出 |
| v0.2 | 回声：单篇 AI 对话（页边批注形态） |
| v0.3 | 回声的记忆：向量检索、引用旧文、记忆管理 |
| v0.4 | 邮局、时间胶囊、漂流瓶、礁石与浪 |
| v0.5 | 语音输入、搜索、应用锁、深浅色打磨 |
