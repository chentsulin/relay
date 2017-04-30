---
id: relay-environment
title: The Relay "Environment"
layout: docs
category: Relay Modern
permalink: docs/relay-environment.html
next: network-layer
---

Relay 「Environment」把 Relay 運作所需要的設定、快取儲存庫、還有網路處理結合在一起。

大部分應用程式會建立一個 Environment 實例並從頭到尾使用它。不過在一些特定的狀況下，你可以會想要為了不同的目的建立多個 environment。例如，你可以在任何時候使用者登入登出時建立一個新的 environment 實例，來防止不同使用者的資料被快取在一起。同樣地，一個被伺服器 render 的應用程式可以針對每個請求建立新的 environment 實例，這樣的話每個請求都能有自己的快取，使用者的資料就不會互相覆蓋。或者，你可能有許多的產品或功能在一個大型應用程式中，而你希望每一個可以有針對特定產品的網路處理或是快取。

## 簡單範例

要在 Relay Modern 中建立一個 environment 實例，只要使用 `RelayModernEnvironment` 類別：

```javascript
const {
  Environment,
  Network,
  RecordSource,
  Store,
} = require('relay-runtime');

const source = new RecordSource();
const store = new Store(source);
const network = Network.create(/*...*/); // 看下面的註記
const handlerProvider = null;

const environment = new Environment({
  handlerProvider, // 可以忽略。
  network,
  store,
});
```

關於建立 Network 的細節，請查看 [NetworkLayer 指南](./network-layer.html)。

一旦你有了一個 environment 了，你就可以把它傳進你的 [`QueryRenderer`](./query-renderer.html) 實例，或是藉由 `commitUpdate` 函數 (查看「[Mutations](./mutations.html)」) 傳進 mutation。

## 添加 `handlerProvider`

上面的範例沒有設定 `handlerProvider`，這代表會使用預設所提供的。Relay Modern 配備了幾個內建的處理程序，它們透過特殊的功能還增強核心，例如：處理 connection (它不是標準的 GraphQL 功能，不過是 Facebook 使用的一組 pagination 慣例，被詳細的規範在 [Relay Cursor Connections Specification](./graphql-connections.html) 之中，並完善的被 Relay 支援) 以及 `viewer` 欄位 (它也不是標準的 GraphQL schema 功能，不過在 Facebook 中被廣泛地使用)。

如果你想要提供自己的 `handlerProvider`，你可以這樣做：

```javascript
const {
  ConnectionHandler,
  ViewerHandler,
} = require('relay-runtime');

function handlerProvider(handle) {
  switch (handle) {
    // 增強 (或者移除) 這份清單：
    case 'connection': return ConnectionHandler;
    case 'viewer': return ViewerHandler;
  }
  throw new Error(
    `handlerProvider: No handler provided for ${handle}`
  );
}
```
