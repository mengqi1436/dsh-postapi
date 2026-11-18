/**
 * JSX 工厂注入源（esbuild inject）。
 *
 * build.mjs 用 jsx: 'transform'（classic runtime）出包，产物只 require('react')，
 * 不依赖 react/jsx-runtime —— 宿主 __ModuleLoader__ 的 require 只保证给到 react。
 * 页面/骨架源码里的 JSX 编译成 createElement(...) / Fragment，这两个自由标识符
 * 由本 shim 提供（esbuild 官方 inject 用法）。
 */
export { createElement, Fragment } from 'react'
