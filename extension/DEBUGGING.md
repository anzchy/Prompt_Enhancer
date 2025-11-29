# 调试指南 - ChatGPT 按钮注入问题排查

## 问题：按钮没有出现在 ChatGPT 页面

### 第一步：检查插件是否加载成功

1. 打开 ChatGPT (https://chatgpt.com)
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 查找以下日志：

```
[Prompt Optimizer] Content script loaded on: https://chatgpt.com/...
[Prompt Optimizer] Content script initialized
[Prompt Optimizer] Document ready, mounting...
[Prompt Optimizer] mount() called
[Prompt Optimizer] ✅ Supported host: chatgpt.com
```

**如果看不到这些日志**：
- 检查插件是否已启用：`chrome://extensions/`
- 检查插件是否有错误标记
- 尝试点击 "Reload" 按钮重新加载插件
- 刷新 ChatGPT 页面

### 第二步：检查是否找到输入框

在 Console 中查找：

```
[Prompt Optimizer] Trying selectors: ["div[role=\"textbox\"]", "#prompt-textarea", "textarea[placeholder*=\"Message\"]"]
[Prompt Optimizer] ✅ Found input element: div[role="textbox"] <element>
```

**如果看到 "❌ Could not find input element"**：

在 Console 中手动测试选择器：

```javascript
// 测试选择器 1
document.querySelector('div[role="textbox"]')

// 测试选择器 2
document.querySelector('#prompt-textarea')

// 测试选择器 3
document.querySelector('textarea[placeholder*="Message"]')
```

如果以上都返回 `null`，说明 ChatGPT 的 DOM 结构已经改变。

**解决方法：找到新的选择器**

```javascript
// 查找所有 textarea
document.querySelectorAll('textarea')

// 查找所有 contenteditable 元素
document.querySelectorAll('[contenteditable="true"]')

// 查找所有 role="textbox"
document.querySelectorAll('[role="textbox"]')
```

找到正确的元素后，更新 `extension/src/content/index.ts` 中的 `selectorMap` 函数。

### 第三步：检查按钮是否被创建

在 Console 中查找：

```
[Prompt Optimizer] Creating button...
[Prompt Optimizer] Trying insertion strategies...
```

然后应该看到以下之一：

```
[Prompt Optimizer] ✅ Button inserted via Strategy 1 (next to + button)
[Prompt Optimizer] ✅ Button inserted via Strategy 2 (grid-area:leading)
[Prompt Optimizer] ✅ Button inserted via Strategy 3 (before target)
[Prompt Optimizer] ✅ Button inserted via Strategy 4 (insertAdjacentElement)
```

### 第四步：手动检查按钮是否存在于 DOM

在 Console 中运行：

```javascript
document.querySelector('.prompt-enhancer-btn')
```

**如果返回 `null`**：按钮没有被插入
**如果返回一个元素**：按钮存在，但可能被隐藏了

### 第五步：检查 CSS 是否加载

在 Console 中运行：

```javascript
// 检查 CSS 文件是否加载
[...document.styleSheets].find(sheet => sheet.href?.includes('content-script.css'))

// 检查按钮样式
const btn = document.querySelector('.prompt-enhancer-btn');
if (btn) {
  console.log('Button styles:', window.getComputedStyle(btn));
}
```

**如果 CSS 没有加载**：
- 检查 `dist/content-script.css` 是否存在
- 检查 `manifest.json` 中是否包含 CSS 文件

### 第六步：检查插入位置

在 Console 中测试各种插入策略：

```javascript
// Strategy 1: 查找 + 按钮
const plusBtn = document.querySelector('[data-testid="composer-plus-btn"]');
console.log('Plus button:', plusBtn);
console.log('Plus button parent:', plusBtn?.parentElement);

// Strategy 2: 查找 grid-area:leading
const leadingArea = document.querySelector('[class*="grid-area:leading"]');
console.log('Leading area:', leadingArea);
const plusSpan = leadingArea?.querySelector('span.flex');
console.log('Plus span:', plusSpan);

// 查找输入框
const input = document.querySelector('div[role="textbox"]');
console.log('Input:', input);
console.log('Input parent:', input?.parentElement);
```

### 第七步：手动创建按钮测试

在 Console 中运行：

```javascript
// 手动创建按钮
const btn = document.createElement('button');
btn.textContent = '优化指令';
btn.className = 'prompt-enhancer-btn';
btn.style.cssText = `
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  margin-left: 8px;
  border-radius: 9999px;
  border: none;
  background: #000000;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

// 尝试插入到 + 按钮旁边
const plusBtn = document.querySelector('[data-testid="composer-plus-btn"]');
if (plusBtn?.parentElement) {
  plusBtn.parentElement.appendChild(btn);
  console.log('✅ Button inserted next to + button');
} else {
  // 尝试插入到输入框之前
  const input = document.querySelector('div[role="textbox"]');
  if (input?.parentElement) {
    input.parentElement.insertBefore(btn, input);
    console.log('✅ Button inserted before input');
  }
}
```

### 第八步：检查是否有 JavaScript 错误

查看 Console 中是否有任何红色的错误信息，特别是：

- `Cannot read property ... of null`
- `querySelector is not a function`
- `Permission denied`
- 任何与 Chrome 扩展相关的错误

### 常见问题和解决方法

#### 问题 1：MutationObserver 一直运行但找不到元素

**原因**：ChatGPT 使用 React 等框架，DOM 元素可能动态创建

**解决方法**：增加延迟重试
- 代码已包含 2 秒延迟重试
- MutationObserver 最多尝试 100 次

#### 问题 2：按钮创建了但看不见

**可能原因**：
- CSS 没有加载
- 按钮被其他元素遮挡（z-index 问题）
- 按钮被插入到不可见的容器中

**调试**：
```javascript
const btn = document.querySelector('.prompt-enhancer-btn');
console.log('Button:', btn);
console.log('Visible:', btn?.offsetParent !== null);
console.log('Display:', getComputedStyle(btn).display);
console.log('Position:', btn?.getBoundingClientRect());
```

#### 问题 3：按钮在页面刷新后消失

**原因**：ChatGPT 是单页应用（SPA），路由切换会重新渲染

**解决方法**：
- 代码已包含 URL 变化监听（通过 MutationObserver）
- 如果问题仍存在，需要添加路由监听

### 获取完整的调试信息

在 Console 中运行以下脚本获取完整诊断：

```javascript
console.log('=== Prompt Optimizer Debug Info ===');
console.log('URL:', window.location.href);
console.log('Host:', window.location.host);

// 检查选择器
const selectors = ['div[role="textbox"]', '#prompt-textarea', 'textarea[placeholder*="Message"]'];
selectors.forEach(sel => {
  const el = document.querySelector(sel);
  console.log(`Selector "${sel}":`, el);
});

// 检查插入目标
console.log('Plus button:', document.querySelector('[data-testid="composer-plus-btn"]'));
console.log('Leading area:', document.querySelector('[class*="grid-area:leading"]'));

// 检查按钮
const btn = document.querySelector('.prompt-enhancer-btn');
console.log('Our button:', btn);
if (btn) {
  console.log('Button visible:', btn.offsetParent !== null);
  console.log('Button rect:', btn.getBoundingClientRect());
}

// 检查 CSS
const cssLoaded = [...document.styleSheets].find(sheet =>
  sheet.href?.includes('content-script.css')
);
console.log('CSS loaded:', !!cssLoaded);
```

## 需要帮助？

将以上调试信息和 Console 日志截图发送给开发者。
