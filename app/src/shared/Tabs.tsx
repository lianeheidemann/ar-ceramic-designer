import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface Tab<Id extends string> {
  id: Id
  label: string
  content: ReactNode
}

interface TabsProps<Id extends string> {
  /** Accessible name of the tab list. */
  label: string
  tabs: readonly Tab<Id>[]
  active: Id
  onChange: (id: Id) => void
}

/**
 * Tabs following the WAI-ARIA pattern: arrows (and Home/End) move between
 * tabs, and only the active tab is in the Tab order. Inactive panels stay
 * mounted but hidden, so their state (messages, file input) survives.
 */
export function Tabs<Id extends string>({
  label,
  tabs,
  active,
  onChange,
}: TabsProps<Id>) {
  const baseId = useId()
  const tabRefs = useRef(new Map<Id, HTMLButtonElement>())
  const tabId = (id: Id) => `${baseId}-tab-${id}`
  const panelId = (id: Id) => `${baseId}-panel-${id}`

  function select(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length]
    onChange(tab.id)
    tabRefs.current.get(tab.id)?.focus()
  }

  function onKeyDown(event: KeyboardEvent) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const moves: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: tabs.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    select(moves[event.key])
  }

  return (
    <>
      <div
        className="tabs-list"
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) tabRefs.current.set(tab.id, element)
              else tabRefs.current.delete(tab.id)
            }}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            className="tab"
            aria-selected={tab.id === active}
            aria-controls={panelId(tab.id)}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelId(tab.id)}
          className="tab-panel"
          aria-labelledby={tabId(tab.id)}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </>
  )
}
