import {
  createTheme, Paper,
  ThemeProvider
} from '@mui/material'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { DataKeyPair } from './components/DataKeyPair'
import { useThemeDetector } from './hooks/useThemeDetector'
import {
  createJsonViewerStore,
  JsonViewerProvider,
  useJsonViewerStore,
  useJsonViewerStoreApi
} from './stores/JsonViewerStore'
import { registerType } from './stores/typeRegistry'
import { darkNamespace, lightColorNamespace } from './theme/base16'
import type { JsonViewerProps } from './type'
import { applyValue } from './utils'

export { applyValue }

/**
 * @internal
 */
function useSetIfNotUndefinedEffect <Key extends keyof JsonViewerProps> (
  key: Key,
  value: JsonViewerProps[Key] | undefined
) {
  const api = useJsonViewerStoreApi()
  useEffect(() => {
    if (value !== undefined) {
      api.setState({
        [key]: value
      })
    }
  }, [key, value, api])
}

/**
 * @internal
 */
const JsonViewerInner: React.FC<JsonViewerProps> = (props) => {
  const api = useJsonViewerStoreApi()
  useSetIfNotUndefinedEffect('value', props.value)
  useSetIfNotUndefinedEffect('editable', props.editable)
  useSetIfNotUndefinedEffect('indentWidth', props.indentWidth)
  useSetIfNotUndefinedEffect('onChange', props.onChange)
  useSetIfNotUndefinedEffect('groupArraysAfterLength', props.groupArraysAfterLength)
  useSetIfNotUndefinedEffect('keyRenderer', props.keyRenderer)
  useSetIfNotUndefinedEffect('maxDisplayLength', props.maxDisplayLength)
  useEffect(() => {
    if (props.theme === 'light') {
      api.setState({
        colorNamespace: lightColorNamespace
      })
    } else if (props.theme === 'dark') {
      api.setState({
        colorNamespace: darkNamespace
      })
    }
  }, [api, props.theme])

  const value = useJsonViewerStore(store => store.value)
  const setHover = useJsonViewerStore(store => store.setHover)
  return (
    <Paper
      elevation={0}
      className={props.className}
      style={props.style}
      sx={{
        fontFamily: 'monospace',
        userSelect: 'none',
        contentVisibility: 'auto'
      }}
      onMouseLeave={
        useCallback(() => {
          setHover(null)
        }, [setHover])
      }
    >
      <DataKeyPair
        value={value}
        path={useMemo(() => [], [])}
      />
    </Paper>
  )
}

export const JsonViewer = function JsonViewer<Value> (props: JsonViewerProps<Value>): React.ReactElement {
  const isAutoDarkTheme = useThemeDetector()
  const themeType = useMemo(() => props.theme === 'auto'
    ? (isAutoDarkTheme ? 'light' : 'dark')
    : props.theme ?? 'light', [isAutoDarkTheme, props.theme])
  const theme = useMemo(() => createTheme({
    palette: {
      mode: themeType === 'dark' ? 'dark' : 'light',
      background: {
        default: themeType === 'dark'
          ? darkNamespace.base00
          : lightColorNamespace.base00
      }
    }
  }), [themeType])
  const onceRef = useRef(true)
  // DO NOT try to dynamic add value types, that is costly. Trust me.
  if (onceRef.current) {
    props.valueTypes?.forEach(type => {
      registerType(type)
    })
    onceRef.current = false
  }
  const mixedProps = { ...props, theme: themeType }
  return (
    <ThemeProvider theme={theme}>
      <JsonViewerProvider createStore={() => createJsonViewerStore(props)}>
        <JsonViewerInner {...mixedProps}/>
      </JsonViewerProvider>
    </ThemeProvider>
  )
}

export * from './type'
