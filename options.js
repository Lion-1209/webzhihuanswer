document.addEventListener('DOMContentLoaded', () => {
  const baseUrlInput = document.getElementById('baseUrl')
  const modelInput = document.getElementById('model')
  const apiKeyInput = document.getElementById('apiKey')

  chrome.storage.local.get(['baseUrl', 'model', 'apiKey'], (r) => {
    if (r.baseUrl) baseUrlInput.value = r.baseUrl
    if (r.model) modelInput.value = r.model
    if (r.apiKey) apiKeyInput.value = r.apiKey
  })

  baseUrlInput.addEventListener('change', () => chrome.storage.local.set({ baseUrl: baseUrlInput.value }))
  modelInput.addEventListener('change', () => chrome.storage.local.set({ model: modelInput.value }))
  apiKeyInput.addEventListener('change', () => chrome.storage.local.set({ apiKey: apiKeyInput.value }))
})
