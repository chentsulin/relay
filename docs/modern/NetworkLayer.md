---
id: network-layer
title: The Relay Network Layer
layout: docs
category: Relay Modern
permalink: docs/network-layer.html
next: query-renderer
---

# Network Layer

為了要知道如何訪問你的 GraphQL 伺服器，Relay Modern 需要開發者在建立 [Relay Environment](relay-environment.html) 的實例時，提供一個實作 `NetworkLayer` 介面的物件。environment 使用這個  network layer 來執行 query、mutation、以及 subscription (如果你的伺服器支援它們)。這讓開發者可以使用任何的 transport (HTTP、WebSocket、等等) 以及最適合應用程式的身份認證，將 environment 與每個應用程式網路設定的細節分離。

現在建立 network layer 最簡單的方法是藉由 `relay-runtime` 套件裡的 helper：

```javascript
const {Environment, Network} = require('relay-runtime');

// 定義一個函數來抓取一個操作 query/mutation/etc) 的結果
// 並回傳它的結果作為一個 Promise：
function fetchQuery(
  operation,
  variables,
  cacheConfig,
  uploadables,
) {
  return fetch('/graphql', {
    method: 'POST',
    headers: {
      // 添加身份認證和其他的標頭
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      query: operation.text, // 從輸入來的 GraphQL text
      variables,
    }),
  }).then(response => {
    return response.json();
  });
}

// 從 fetch 函數建立 network layer
const network = Network.create(fetchQuery);

// 使用這個 network 建立 environment：
const environment = new Environment({
  ..., // 其他選項
  network,
});
```

記得這是一個幫助你入門的基礎範例。這個範例可以透過額外的功能來擴充，例如：請求／回應快取 (例如，當 `cacheConfig.force` 是 false 的時候啟用它) 以及上傳 form data 給 mutation (`uploadables` 參數)。
