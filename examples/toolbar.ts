// 分类按钮展开/收起
document.querySelectorAll('.group-label').forEach((label) => {
  label.addEventListener('click', (e) => {
    const group = (e.currentTarget as HTMLElement).dataset.group
    const content = document.querySelector(`.group-content[data-group="${group}"]`)
    if (!content) return
    const isShow = content.classList.contains('show')
    // 先收起所有
    document.querySelectorAll('.group-content').forEach((el) => el.classList.remove('show'))
    document.querySelectorAll('.group-label').forEach((el) => el.classList.remove('active'))
    // 再展开当前（如果之前没展开）
    if (!isShow) {
      content.classList.add('show')
      ;(e.currentTarget as HTMLElement).classList.add('active')
    }
  })
})

// 点击 toolbar 外部收起
document.addEventListener('click', (e) => {
  const toolbar = document.querySelector('.toolbar')
  if (toolbar && !toolbar.contains(e.target as Node)) {
    document.querySelectorAll('.group-content').forEach((el) => el.classList.remove('show'))
    document.querySelectorAll('.group-label').forEach((el) => el.classList.remove('active'))
  }
})
