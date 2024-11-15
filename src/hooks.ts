import { useEffect, useRef } from 'react'
import LiveElement from './live-element.js'
import LiveNodeList from './live-node-list.js'
import { Config, Parent } from './types.js'

export const useLiveElement = <T extends HTMLElement>(
  selector: string,
  parent?: Parent | LiveElement,
  options?: Config
): LiveElement<T> | undefined => {
  const list = useRef<LiveElement<T>>()

  useEffect(() => {
    if (list.current) {
      list.current.destroy()
    }

    list.current = new LiveElement<T>(selector, parent, options)

    return () => {
      if (list.current) {
        list.current.destroy()
      }
    }
  }, [selector, parent, options])

  return list.current
}

export const useLiveNodeList = <T extends HTMLElement>(
  selector: string,
  parent?: Parent | LiveElement,
  options?: Config
): LiveNodeList<T> | undefined => {
  const list = useRef<LiveNodeList<T>>()

  useEffect(() => {
    if (list.current) {
      list.current.destroy()
    }

    list.current = new LiveNodeList<T>(selector, parent, options)

    return () => {
      if (list.current) {
        list.current.destroy()
      }
    }
  }, [selector, parent, options])

  return list.current
}
