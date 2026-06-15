// 后台服务脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log("知乎问答助手已安装")
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'ANALYZE_QUESTION') return
  const data = msg.payload || {}

  chrome.storage.local.get(['apiKey', 'baseUrl', 'model'], async (settings) => {
    const apiKey = settings.apiKey || ''
    const baseUrl = (settings.baseUrl || 'https://api.openai.com').replace(/\/$/, '').replace(/\/v1\/?$/, '')
    const model = settings.model || 'gpt-3.5-turbo'

    if (!apiKey) {
      sendResponse({ answer: '请先在设置页填写 API Key。' })
      return
    }

    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: '你是一个知乎问答助手，请根据问题给出专业、有帮助的回答。' },
            { role: 'user', content: `问题：${data.title}\n\n${data.detail || ''}\n\n请给出回答：` }
          ]
        })
      })

      if (!res.ok) {
        const text = await res.text()
        let errMsg = `HTTP ${res.status}`
        try { errMsg = JSON.parse(text).error?.message || errMsg } catch (_) {}
        sendResponse({ answer: `请求失败：${errMsg}` })
        return
      }

      const text = await res.text()
      let json
      try { json = JSON.parse(text) } catch (_) {
        sendResponse({ answer: '响应解析失败，返回内容不是合法 JSON。' })
        return
      }
      const answer = json.choices?.[0]?.message?.content || '未获取到回答，请检查接口配置。'
      sendResponse({ answer })
    } catch (e) {
      sendResponse({ answer: '请求失败：' + e.message })
    }
  })

  return true
})