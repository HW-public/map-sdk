export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function getElement(container: string | HTMLElement): HTMLElement {
  if (isString(container)) {
    const el = document.getElementById(container)
    if (!el) {
      throw new Error(`Container element with id "${container}" not found`)
    }
    return el
  }
  return container
}

/**
 * 创建转发代理对象。
 *
 * 代理的每次属性访问都会转发到 getTarget() 返回的当前目标实例上。
 * 因此即使目标实例被替换，代理引用仍然有效。
 *
 * @param getTarget - 返回当前目标实例的回调
 * @returns 代理对象，类型与目标实例一致
 */
export function createForwardingProxy<T extends object>(
  getTarget: () => T | null
): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const current = getTarget()
      if (prop === Symbol.toStringTag) {
        return current?.constructor.name ?? 'Object'
      }
      if (!current || !(prop in current)) return undefined
      const val = (current as any)[prop]
      return typeof val === 'function' ? val.bind(current) : val
    },
  })
}
