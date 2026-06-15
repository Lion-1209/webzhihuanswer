// 知乎页面内容脚本 - 注入浮动 Dashboard
(function () {
  if (window.__zhihuAssistantInjected) return
  window.__zhihuAssistantInjected = true

  function extractQuestion() {
    const title = document.querySelector('h1.QuestionHeader-title')?.innerText || ''
    const detail = document.querySelector('.QuestionHeader-detail .RichContent-inner')?.innerText || ''
    return { title, detail, url: location.href }
  }

  function injectFloatingBall() {
    if (document.querySelector('.zhihu-assistant-ball')) return
    if (!document.body) return

    console.log('[知乎问答助手] 注入悬浮球')

    const ball = document.createElement('button')
    ball.className = 'zhihu-assistant-ball'
    ball.title = '知乎问答助手'
    ball.innerHTML = '<span class="zha-ball-icon">💬</span><span class="zha-ball-tip">AI 问答</span>'
    ball.addEventListener('click', () => toggleDashboard())
    document.body.appendChild(ball)
  }

  function toggleDashboard() {
    const existing = document.getElementById('zhihu-assistant-dashboard')
    if (existing) {
      existing.classList.toggle('zha-collapsed')
      return
    }
    createDashboard()
  }

  function createDashboard() {
    const panel = document.createElement('div')
    panel.id = 'zhihu-assistant-dashboard'
    panel.innerHTML = `
      <div class="zha-header">
        <div class="zha-brand">
          <span class="zha-logo">🤖</span>
          <span class="zha-title">知乎问答助手</span>
        </div>
        <div class="zha-actions">
          <button class="zha-btn-min" title="收起">−</button>
          <button class="zha-btn-close" title="关闭">×</button>
        </div>
      </div>
      <div class="zha-tabs">
        <button class="zha-tab active" data-tab="chat">💬 问答</button>
        <button class="zha-tab" data-tab="settings">⚙️ 设置</button>
        <button class="zha-tab" data-tab="history">🕐 历史</button>
      </div>
      <div class="zha-body">
        <div class="zha-panel active" data-panel="chat">
          <div class="zha-question-card">
            <div class="zha-question-title">当前问题</div>
            <div class="zha-question-text" id="zha-question-text">未检测到问题</div>
          </div>
          <div class="zha-chat-box" id="zha-chat-box"></div>
          <div class="zha-input-bar">
            <textarea id="zha-user-input" placeholder="输入追问..." rows="2"></textarea>
            <button id="zha-send">发送</button>
          </div>
        </div>
        <div class="zha-panel" data-panel="settings">
          <div class="zha-section">
            <label>Base URL</label>
            <input id="zha-baseUrl" placeholder="https://api.openai.com" />
          </div>
          <div class="zha-section">
            <label>Model</label>
            <input id="zha-model" placeholder="gpt-3.5-turbo" />
          </div>
          <div class="zha-section">
            <label>API Key</label>
            <input id="zha-apiKey" type="password" placeholder="sk-..." />
          </div>
          <div class="zha-section">
            <button id="zha-save" class="zha-btn-primary">保存配置</button>
            <button id="zha-test" class="zha-btn-secondary">测试连接</button>
            <span class="zha-hint">配置保存在本地浏览器中</span>
          </div>
          <div class="zha-status" id="zha-test-status"></div>
        </div>
        <div class="zha-panel" data-panel="history">
          <div class="zha-history-list" id="zha-history-list">
            <div class="zha-empty">暂无历史记录</div>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(panel)

    const state = {
      baseUrl: '',
      model: '',
      apiKey: '',
      history: [],
      isAnalyzing: false
    }

    panel.querySelector('.zha-btn-close').addEventListener('click', () => panel.remove())
    panel.querySelector('.zha-btn-min').addEventListener('click', () => panel.classList.toggle('zha-collapsed'))

    const tabs = panel.querySelectorAll('.zha-tab')
    const panels = panel.querySelectorAll('.zha-panel')
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'))
        panels.forEach(p => p.classList.remove('active'))
        tab.classList.add('active')
        const target = panel.querySelector(`.zha-panel[data-panel="${tab.dataset.tab}"]`)
        if (target) target.classList.add('active')
      })
    })

    const questionText = panel.querySelector('#zha-question-text')
    const chatBox = panel.querySelector('#zha-chat-box')
    const userInput = panel.querySelector('#zha-user-input')
    const sendBtn = panel.querySelector('#zha-send')
    const saveBtn = panel.querySelector('#zha-save')
    const testBtn = panel.querySelector('#zha-test')
    const testStatus = panel.querySelector('#zha-test-status')
    const baseUrlInput = panel.querySelector('#zha-baseUrl')
    const modelInput = panel.querySelector('#zha-model')
    const apiKeyInput = panel.querySelector('#zha-apiKey')
    const historyList = panel.querySelector('#zha-history-list')

    chrome.storage.local.get(['baseUrl', 'model', 'apiKey', 'history'], (r) => {
      if (r.baseUrl) { baseUrlInput.value = r.baseUrl; state.baseUrl = r.baseUrl }
      if (r.model) { modelInput.value = r.model; state.model = r.model }
      if (r.apiKey) { apiKeyInput.value = r.apiKey; state.apiKey = r.apiKey }
      if (r.history && r.history.length) {
        state.history = r.history
        renderHistory()
      }
    })

    saveBtn.addEventListener('click', () => {
      state.baseUrl = baseUrlInput.value
      state.model = modelInput.value
      state.apiKey = apiKeyInput.value
      chrome.storage.local.set({
        baseUrl: state.baseUrl,
        model: state.model,
        apiKey: state.apiKey
      })
      saveBtn.textContent = '已保存'
      setTimeout(() => saveBtn.textContent = '保存配置', 1500)
    })

    testBtn.addEventListener('click', async () => {
      const baseUrl = baseUrlInput.value || state.baseUrl
      const model = modelInput.value || state.model
      const apiKey = apiKeyInput.value || state.apiKey
      if (!baseUrl || !model || !apiKey) {
        testStatus.textContent = '请先填写 Base URL、Model 和 API Key'
        testStatus.style.color = '#d32f2f'
        return
      }
      testStatus.textContent = '测试中...'
      testStatus.style.color = '#0066ff'
      const answer = await callAI([
        { role: 'user', content: '仅回复"连接成功"四个字' }
      ])
      if (answer.startsWith('请求失败') || answer.startsWith('请先')) {
        testStatus.textContent = '连接失败：' + answer
        testStatus.style.color = '#d32f2f'
      } else {
        testStatus.textContent = '连接成功'
        testStatus.style.color = '#2e7d32'
      }
    })

    function appendChat(role, text) {
      const msg = document.createElement('div')
      msg.className = `zha-msg zha-msg-${role}`
      const bubble = document.createElement('div')
      bubble.className = 'zha-bubble'
      bubble.textContent = text
      msg.appendChild(bubble)
      chatBox.appendChild(msg)
      chatBox.scrollTop = chatBox.scrollHeight
      return msg
    }

    function renderHistory() {
      historyList.innerHTML = ''
      if (!state.history.length) {
        historyList.innerHTML = '<div class="zha-empty">暂无历史记录</div>'
        return
      }
      state.history.slice().reverse().forEach((item, idx) => {
        const realIdx = state.history.length - 1 - idx
        const el = document.createElement('div')
        el.className = 'zha-history-item'
        el.innerHTML = `
          <div class="zha-history-q">${escapeHtml(item.question)}</div>
          <div class="zha-history-a">${escapeHtml(item.answer)}</div>
          <div class="zha-history-actions">
            <button class="zha-history-reuse" data-idx="${realIdx}">再次提问</button>
            <button class="zha-history-del" data-idx="${realIdx}">删除</button>
          </div>
        `
        historyList.appendChild(el)
      })

      historyList.querySelectorAll('.zha-history-reuse').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.idx)
          const item = state.history[idx]
          if (!item) return
          panel.querySelector('.zha-tab[data-tab="chat"]').click()
          appendChat('user', item.question)
          appendChat('ai', item.answer)
        })
      })

      historyList.querySelectorAll('.zha-history-del').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.dataset.idx)
          state.history.splice(idx, 1)
          chrome.storage.local.set({ history: state.history })
          renderHistory()
        })
      })
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    async function callAI(messages) {
      if (!state.apiKey) return '请先在设置页填写 API Key。'
      const baseUrl = (state.baseUrl || 'https://api.openai.com').replace(/\/$/, '').replace(/\/v1\/?$/, '')
      const model = state.model || 'gpt-3.5-turbo'
      const endpoint = `${baseUrl}/v1/chat/completions`

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
          },
          body: JSON.stringify({ model, messages })
        })

        if (!res.ok) {
          const text = await res.text()
          let errMsg = `HTTP ${res.status}`
          try { errMsg = JSON.parse(text).error?.message || errMsg } catch (_) {}
          return `请求失败：${errMsg}（${endpoint}）`
        }

        const text = await res.text()
        let json
        try { json = JSON.parse(text) } catch (_) {
          return '响应解析失败，返回内容不是合法 JSON。'
        }
        return json.choices?.[0]?.message?.content || '未获取到回答，请检查接口配置。'
      } catch (e) {
        return `请求失败：${e.message}（${endpoint}）`
      }
    }

    async function analyzeCurrentQuestion() {
      if (state.isAnalyzing) return
      state.isAnalyzing = true
      sendBtn.disabled = true
      chatBox.innerHTML = ''
      const data = extractQuestion()
      questionText.textContent = data.title || '未检测到问题标题'
      appendChat('user', data.title)
      appendChat('ai', '正在分析中...')
      const answer = await callAI([
        { role: 'system', content: '你是知乎上的一个真实用户，请用口语化、接地气的风格回答问题。要有个人观点和真实感，可以适当使用 emoji，不要太官方或教科书式。回答要像真人写的知乎回答，有温度有态度。' },
        { role: 'user', content: `问题：${data.title}\n\n${data.detail || ''}\n\n请用知乎风格回答：` }
      ])
      chatBox.lastElementChild.remove()
      appendChat('ai', answer)
      state.lastAnswer = answer
      state.history.push({ question: data.title, answer, time: Date.now() })
      chrome.storage.local.set({ history: state.history })
      state.isAnalyzing = false
      sendBtn.disabled = false
    }

    sendBtn.addEventListener('click', async () => {
      const text = userInput.value.trim()
      if (!text || state.isAnalyzing) return
      appendChat('user', text)
      userInput.value = ''
      appendChat('ai', '思考中...')
      const answer = await callAI([
        ...(window.__zhihuAssistantMessages || []),
        { role: 'user', content: text }
      ])
      chatBox.lastElementChild.remove()
      appendChat('ai', answer)
      window.__zhihuAssistantMessages = [
        ...(window.__zhihuAssistantMessages || []),
        { role: 'user', content: text },
        { role: 'assistant', content: answer }
      ]
    })

    const analyzeBtn = document.createElement('button')
    analyzeBtn.className = 'zha-btn-primary'
    analyzeBtn.textContent = '分析当前问题'
    analyzeBtn.style.marginTop = '8px'
    const submitBtn = document.createElement('button')
    submitBtn.className = 'zha-btn-submit'
    submitBtn.textContent = '🚀 一键提交回答'
    submitBtn.style.marginTop = '8px'
    submitBtn.style.marginLeft = '8px'
    const chatPanel = panel.querySelector('.zha-panel[data-panel="chat"]')
    const inputBar = chatPanel.querySelector('.zha-input-bar')
    chatPanel.insertBefore(analyzeBtn, inputBar)
    chatPanel.insertBefore(submitBtn, inputBar)

    analyzeBtn.addEventListener('click', analyzeCurrentQuestion)

    submitBtn.addEventListener('click', async () => {
      const answer = state.lastAnswer
      if (!answer) {
        alert('请先分析问题获取回答')
        return
      }
      try {
        await submitAnswerToZhihu(answer)
        alert('回答已提交！')
      } catch (e) {
        alert('提交失败：' + e.message)
      }
    })

    async function submitAnswerToZhihu(answer) {
      // 找到知乎的编辑器 textarea
      const editorSelectors = [
        'textarea[data-testid="editor-rich-text"]',
        '.WriteIndex-editor textarea',
        '.RichEditor textarea',
        'textarea[placeholder*="写回答"]',
        'textarea[placeholder*="请输入"]'
      ]

      let editor = null
      for (const sel of editorSelectors) {
        editor = document.querySelector(sel)
        if (editor) break
      }

      if (!editor) {
        throw new Error('未找到知乎回答编辑器，请先点击"写回答"按钮')
      }

      // 聚焦编辑器
      editor.focus()

      // 模拟输入（知乎用 contenteditable 或 textarea）
      const isContentEditable = editor.contentEditable === 'true'
      if (isContentEditable) {
        editor.innerHTML = answer.replace(/\n/g, '<br>')
      } else {
        // 对于 textarea，使用原生赋值 + 事件
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
        nativeInputValueSetter.call(editor, answer)

        editor.dispatchEvent(new Event('input', { bubbles: true }))
        editor.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // 滚动到编辑器位置
      editor.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 查找提交按钮
      const submitSelectors = [
        'button[data-testid="publish-btn"]',
        '.SubmitBtn',
        'button.Button--primary[type="submit"]',
        'button[type="submit"]'
      ]

      let submitBtn = null
      for (const sel of submitSelectors) {
        submitBtn = document.querySelector(sel)
        if (submitBtn) break
      }

      if (!submitBtn) {
        throw new Error('未找到提交按钮')
      }

      // 等待一下确保内容已更新
      await new Promise(resolve => setTimeout(resolve, 500))

      // 点击提交
      submitBtn.click()
    }

    new MutationObserver(() => {
      const data = extractQuestion()
      if (data.title && questionText.textContent !== data.title) {
        questionText.textContent = data.title
      }
    }).observe(document.querySelector('.QuestionHeader') || document.body, { childList: true, subtree: true })
  }

  // 稳健注入：监听 body 出现，以及知乎 SPA 路由变化
  function tryInject() {
    if (document.body) {
      injectFloatingBall()
    }
  }

  if (document.body) {
    tryInject()
  } else {
    new MutationObserver(() => {
      if (document.body) {
        injectFloatingBall()
      }
    }).observe(document.documentElement, { childList: true, subtree: true })
  }

  // 知乎是 SPA，hashchange / popstate 后也要确保悬浮球存在
  window.addEventListener('hashchange', () => setTimeout(injectFloatingBall, 300))
  window.addEventListener('popstate', () => setTimeout(injectFloatingBall, 300))
})()
