document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab.url?.includes('zhihu.com/question')) {
    document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">当前不是知乎问题页</p>')
  }
})
