import { useEffect, useState } from 'react'
import LiveElement from './live-element.js'
import LiveNodeList from './live-node-list.js'
import { Config, Parent } from './types.js'

export const useLiveElement = <T extends HTMLElement>(
  selector: string,
  parent?: Parent | LiveElement,
  options?: Config
): LiveElement<T> | undefined => {
  const [list, setList] = useState<LiveElement<T> | undefined>(undefined)

  useEffect(() => {
    // If old record exists, destroy it
    if (list) {
      list.destroy()
    }

    const liveElement = new LiveElement<T>(selector, parent, options)
    setList(liveElement)

    return () => {
      if (list) {
        list.destroy()
        setList(undefined)
      }
    }
  }, [selector, parent, options])

  return list
}

export const useLiveNodeList = <T extends HTMLElement>(
  selector: string,
  parent?: Parent | LiveElement,
  options?: Config
): LiveNodeList<T> | undefined => {
  const [list, setList] = useState<LiveNodeList<T> | undefined>(undefined)

  useEffect(() => {
    // If old record exists, destroy it
    if (list) {
      list.destroy()
    }

    const liveNodeList = new LiveNodeList<T>(selector, parent, options)
    setList(liveNodeList)

    return () => {
      if (list) {
        list.destroy()
        setList(undefined)
      }
    }
  }, [selector, parent, options])

  return list
}
