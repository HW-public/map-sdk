export interface PopupOptions {
  /** 弹窗唯一标识，不传则自动生成 */
  id?: string
  /** 弹窗内容，支持 HTML 字符串或 DOM 元素 */
  content: string | HTMLElement
  /** 弹窗锚点位置 [经度, 纬度] */
  position: [number, number]
  /** 像素偏移 [x, y]，默认 [0, -10] */
  offset?: [number, number]
  /** 关闭按钮点击回调 */
  onClose?: () => void
}
