---
id: guides-ready-state
title: Ready State
layout: docs
category: Guides
permalink: docs/guides-ready-state.html
next: guides-mutations
---

每當 Relay 正在滿足資料需求時，知道特定的事件在何時發生很有用。例如，我們可能會想要紀錄資料到可以使用需要花多長的時間，或是我們可能會想要把 error 記錄到伺服器。這些事件在大多數 Relay APIs 上可以藉由 `onReadyStateChange` callback 使用。

## `onReadyStateChange`

當 Relay 滿足了資料時，會用一個描述當下「ready state」的物件呼叫 `onReadyStateChange` callback  一次或數次。這個物件有以下屬性：

- `ready: boolean`

  當需要的資料的子集都準備好可以 render 的時候，這是 true。

- `done: boolean`

  當_所有的_資料需求都準備好可以 render 的時候，這是 true。

- `error: ?Error`

  如果失敗的話，這是一個 `Error` 的實體。反之，這會是 `null`。

- `stale: boolean`

  當「正在 force fetch」時，在伺服器請求完成之前，如果因為資料在客戶端可用而 `ready` 是 true，那這會是 true。

- `aborted: boolean`

  是否請求已經被中止。

## 範例

### 從伺服器抓取資料

如果客戶端的資料不夠，導致 Relay 發送伺服器請求以獲得更多資料，我們可以預期有以下的行為：

1. 一開始 `ready` 被設成 false。
2. 接著 `ready` 和 `done` 被設成 true。

### 從客戶端 resolve 資料

如果客戶端有充足的資料可以使用，這樣 Relay 不需要發送伺服器請求，我們可以預期有以下的行為：

1. `ready` 和 `done` 被設成 true。

### 伺服器錯誤

如果伺服器請求發生載入資料失敗，我們可以預期有以下的行為：

1. 一開始 `ready` 被設成 false。
2. 接著 `error` 被設成一個 `Error` 物件。

要注意 `ready` 和 `done` 依然會是 false。

### 從客戶端 Force Fetch 資料

如果發生「force fetch」而且客戶端的資料不夠，可以預期會有跟**從伺服器抓取資料**一樣的行為。但是，如果發生「force fetch」而且_有_充足的資料在客戶端可以 render，我們可以預期有以下的行為：

1. 一開始 `ready`、`done` 和 `stale` 被設成 true。
2. 接著 `ready` 和 `done` 被設成 true，不過 `stale` 被設成 false。
