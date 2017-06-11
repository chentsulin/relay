---
id: new-in-relay-modern
title: New in Relay Modern
layout: docs
category: Relay Modern
permalink: docs/new-in-relay-modern.html
next: relay-environment
---

> Relay Modern 的改進部分以及新功能摘要。


## 相容模式

[相容模式](./relay-compat.html) 讓既有的 Relay 應用程式可以逐步地採用 Relay Modern API。跟 Relay Classic 相比，它能使用以下的功能：

- 更簡單、可預測的 mutation API。Relay Classic 對 mutation query 的限制也被移除：mutation query 是靜態的，欄位可以任意的巢狀，並可以使用任意的參數。
- 在使用 [`QueryRenderer`](./query-renderer.html) 時，Relay Classic 的 queries 限制已經被移除：queries 可以包含多個使用任意參數的 root 欄位並回傳單個或數個值。`viewer` root 欄位現在不再是強制要求的。
- 可選擇性的使用 Route：不用定義 routing 也能使用 `QueryRenderer`。在 [routing 指南](./routing.html) 裡面有更多的介紹。
- `QueryRenderer` 支援直接 render 小量的資料，而不需要一個 container 來取用資料。當你的應用程式的大小跟複雜度提升時，可以選擇性的使用 [Containers](./fragment-container.html)。
- API 整體上變得更簡單更好預測。

## Modern Runtime

針對新的 Relay 應用程式或既有已經被完全轉換到 Compat API 的應用程式，使用 Relay Modern runtime 可以啟用更多的功能。除了上面所描述過的以外，還包括：

### 效能

新的 Relay Modern 核心比以前的版本更輕量且明顯更快。它被重新設計以使用靜態 query，這使我們能把更多工作搬到建置／編譯期。由於刪除了動態 query 所需的大量複雜功能，Modern 核心比之前的小得多。新的核心使用在建置期間產生的最佳化解析指令集，在處理回應上也快了一個數量級。我們不再追蹤產生動態 query 所需的資訊，這大幅地減少使用 Relay 的記憶體開銷。這意味著有剩下更多記憶體來讓 UI 響應更順暢。Relay Modern 也支援 persisted queries，藉由把完整的 query 文字轉成簡單的 id 來減少請求的上傳大小。

### 更小的 Bundle

Relay runtime 的 bundle 大概是 Relay Classic 的 20% 大小。


### 垃圾回收

執行期會自動地移除已經不再被參考的快取資料，能幫助減少記憶體用量。

### GraphQL Subscriptions 以及 Live Query

Relay Modern 支援 GraphQL Subscription，它使用命令式的更新 API 以允許在任何時候收到 payload 時能修改 store。它也藉由 polling 實驗性地支援 GraphQL Live Query。

### 可注入的自定欄位處理程序

有些欄位在客戶端可能需要一些後處理，特別是那些用於 pagination 的資料，以便將先前抓取過的資料跟新資料合併。Relay Modern 支援自定欄位處理程序，這可以被用來處理這些欄位以跟各種 pagination 模式以及其他的使用案例一起運作。

### 更簡單的 Mutation API

我們收到的許多問題都是關於 mutation 以及它的設定。Relay Modern 導入了一個新的 mutation API，這讓我們可以用正直接的方式更新資料和欄位。

### 客戶端 schema 擴充 (實驗性質的)

Relay Modern 核心添加了對客戶端 schema 擴充的支援。這讓 Relay 可以方便地在從伺服器抓取回來的資料外再儲存一些額外的資訊，並像其他從伺服器抓回來的欄位一般的去 render。這應該可以取代一些之前需要 Flux/Redux store 的使用案例。

### 產生 Flow Type

Relay Modern 具有基於 GraphQL schema 針對被用在 Relay container 中的 fragment，自動生成 Flow type 的功能。使用這些 Flow type 可以讓應用程式更不容易出錯，確保所有可能會是 `null` 或是 `undefined` 的狀況都有被考慮到即便它們並不常發生。

## 更少的 Routing 前置要求

在 Relay Modern 中，Route 不再需要知道任何有關 query root 的事情。包在 `QueryRenderer` 中，Relay component 就可以被 render 在任何地方。這應該可以在選擇 routing 框架時帶來更多彈性。

## 可擴展的核心

Relay Modern 的核心本質上是一個為 GraphQL 資料準備的標準 store。它可以獨立被用於 render 使用 React 的 view，也可以被擴展來跟其他框架一起使用。
