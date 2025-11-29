# 快速测试步骤

## 重新加载插件并测试

### 1. 构建插件

```bash
cd extension
npm run build
```

### 2. 重新加载插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 找到 "Prompt Optimizer" 插件
4. 点击 **刷新/Reload** 按钮（圆形箭头图标）

### 3. 测试按钮

1. **打开 ChatGPT**：访问 https://chatgpt.com
2. **打开开发者工具**：按 `F12`
3. **切换到 Console 标签**
4. **查看日志**：应该看到以下信息：

```
[Prompt Optimizer] Content script loaded on: https://chatgpt.com/...
[Prompt Optimizer] Content script initialized
[Prompt Optimizer] Document ready, mounting...
[Prompt Optimizer] mount() called
[Prompt Optimizer] ✅ Supported host: chatgpt.com
[Prompt Optimizer] Trying selectors: Array(3)
[Prompt Optimizer] ✅ Found input element: div[role="textbox"] ...
[Prompt Optimizer] Creating button...
[Prompt Optimizer] Trying insertion strategies...
[Prompt Optimizer] Strategy 1 - Plus button found: <button>
[Prompt Optimizer] Plus button container: <span>
[Prompt Optimizer] ✅ Button inserted via Strategy 1 (next to + button)
[Prompt Optimizer] Button styles applied via CSS
[Prompt Optimizer] Theme changed to: light
```

### 4. 查看按钮

在 ChatGPT 输入框的**左侧**，应该能看到一个黑色的圆角按钮，上面写着 "优化指令"。

### 5. 如果看不到按钮

**在 Console 中运行以下命令进行手动检查**：

```javascript
// 检查按钮是否存在
document.querySelector('.prompt-enhancer-btn')
```

- **如果返回 `null`**：按钮没有被创建，查看 Console 日志找原因
- **如果返回一个元素**：按钮存在，运行以下命令检查样式：

```javascript
const btn = document.querySelector('.prompt-enhancer-btn');
console.log('Button:', btn);
console.log('Visible:', btn.offsetParent !== null);
console.log('Position:', btn.getBoundingClientRect());
console.log('Styles:', getComputedStyle(btn));
```

### 6. 测试功能

1. 在 ChatGPT 输入框中输入：`写个 Python 脚本`
2. 点击 "优化指令" 按钮
3. 应该看到：
   - 按钮文字变为 "优化中…"
   - 按钮变灰色（disabled）
   - 1-3秒后，输入框的文字被替换为优化后的提示词

### 7. 测试键盘快捷键

1. 在输入框中输入：`帮我写个网页`
2. 按 `Ctrl+Shift+O` (Windows/Linux) 或 `Cmd+Shift+O` (Mac)
3. 应该触发优化（和点击按钮效果相同）

## 常见问题快速修复

### 问题：看不到任何日志

**解决方法**：
```bash
# 重新构建
npm run build

# 在 chrome://extensions/ 页面：
# 1. 点击 "Reload" 按钮
# 2. 刷新 ChatGPT 页面（Ctrl+R）
```

### 问题：日志显示 "Could not find input element"

**解决方法**：ChatGPT 的 DOM 可能已更新

在 Console 中运行：
```javascript
// 查找所有可能的输入框
document.querySelectorAll('div[role="textbox"]')
document.querySelectorAll('textarea')
document.querySelectorAll('[contenteditable="true"]')
```

然后查看 `DEBUGGING.md` 文件的详细步骤。

### 问题：按钮创建但看不见

**检查 CSS 是否加载**：
```javascript
[...document.styleSheets].find(s => s.href?.includes('content-script.css'))
```

如果返回 `undefined`：
1. 检查 `dist/content-script.css` 是否存在
2. 检查 `dist/manifest.json` 的 `content_scripts.css` 字段
3. 重新运行 `npm run build`

### 问题：按钮位置不对

**手动测试插入位置**：
```javascript
// 查找 + 按钮
const plusBtn = document.querySelector('[data-testid="composer-plus-btn"]');
console.log('+ button:', plusBtn);
console.log('Parent:', plusBtn?.parentElement);

// 查找按钮应该在的位置
const leadingArea = document.querySelector('[class*="grid-area:leading"]');
console.log('Leading area:', leadingArea);
```

## 获取帮助

如果问题仍未解决，请：

1. 在 Console 中运行完整的调试脚本（见 `DEBUGGING.md`）
2. 截图 Console 日志
3. 截图 ChatGPT 页面（如果按钮可见但位置不对）
4. 提供以下信息：
   - Chrome 版本
   - ChatGPT URL（是否是 chatgpt.com 或 chat.openai.com）
   - Console 日志的完整输出
