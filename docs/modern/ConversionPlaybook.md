---
id: conversion-playbook
title: Conversion Playbook
layout: docs
category: Relay Compat
permalink: docs/conversion-playbook.html
next: conversion-scripts
---

Incrementally modernize your Relay Classic app in these steps：

## 步驟 0：安裝 Relay v1.0

參考[入門指南](./relay-modern.html)安裝最新版的 Relay。

## 步驟 1：漸漸地轉換到 Relay Compat

開始讓你的 component 和 mutation 使用從 `'react-relay/compat'` 模組來的 Relay Modern API (`createFragmentContainer`, `createRefetchContainer`, `createPaginationContainer`, `commitMutation`)。從底層 component 往上進行會比較容易。這個[轉換腳本](https://github.com/relayjs/relay-codemod)應該能使這個步驟不會那麼繁瑣。

## 步驟 2：導入 <QueryRenderer>

一旦所有的 component 和 mutation 都已經換成使用 Relay Modern API，就可以用 `QueryRenderer` 來取代 `Relay.Renderer` 和 `Relay.RootContainer`。大部分的情況你可以提供 `'react-relay/classic'` 的 `Store` 作為 `environment`。

## 步驟 3：導入 Relay Modern runtime

一旦你的幾個或是全部的 view 都已經在使用 `QueryRenderer`，可以用 `RelayModernEnvironment` 取代 `'react-relay/classic'` 的 `Store`。請記住 `RelayModernEnvironment` and `Store` 不會共享任何資料。你可能會想要暫停在這個步驟直到有大量資料重疊的 view 可以同時被轉換過去。這步驟是解鎖應用程式效能優勢的關鍵。使用 `RelayModernEnvironment` 的應用程式就能送 persisted query ID 到伺服器來取代完整的 query 字串，以及其他更多的最佳化的資料正規化與處理。

## 步驟 4：用 Relay Modern 取代 Relay Compat

把應用程式裡的 `'react-relay/compat'` 都換成 `'react-relay'`。這更是一個清理步驟，避免你的應用程式加進不需要的 `'react-relay/classic'` 程式碼。
