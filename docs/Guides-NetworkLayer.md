---
id: guides-network-layer
title: Network Layer
layout: docs
category: Guides
permalink: docs/guides-network-layer.html
next: guides-babel-plugin
---

Relay 有一個 network layer 的抽象，用來把 mutations 和 queries 從發送請求到 GraphQL 伺服器的實際機制分隔出來。這給我們設定的彈性或甚至可以藉由注入去完全地替換掉預設的 network layer。

## 預設的 Network Layer

Relay 已經被預先設定使用一個可以跟 [express-graphql](https://github.com/graphql/express-graphql) 一起運作的預設 network layer。這個預設的 network layer 是透過 `Relay.DefaultNetworkLayer` 暴露出來。

預設情況下，Relay 假設 GraphQL 在相對於應用程式服務根路徑的 `/graphql` 路徑服務。這可以藉由注入一個客製化的預設 network layer 實體來重新設定。

```
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://example.com/graphql')
);
```

在這背後，預設的 network layer 使用 `fetch` ([現存標準](https://fetch.spec.whatwg.org))。`Relay.DefaultNetworkLayer` 的建構式，接受一個選擇性的第二參數，它接受任何 `fetch` 接受的有效初始化屬性。

```{3}
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://example.com/graphql', {
    credentials: 'same-origin',
  })
);
```

在它發送請求時，它會自動地在 15 秒的 timeout 後讓請求失敗。另外，失敗的請求會自動地 retry 兩次，分別有 1 秒跟 3 秒的延遲。

跟 GraphQL URI 類似，timeout 跟 retry 的行為都可以設定：

```{3-4}
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://example.com/graphql', {
    fetchTimeout: 30000,   // 在 30s 之後 Timeout。
    retryDelays: [5000],   // 只在 5s 的延遲後 retry 一次。
  })
);
```

跟 query 不一樣，失敗的 mutation 請求不會自動地 retry。

可以藉由提供一個 `headers` 物件設定客製化的 HTTP headers：

```{3-5}
Relay.injectNetworkLayer(
  new Relay.DefaultNetworkLayer('http://example.com/graphql', {
    headers: {
      Authorization: 'Basic SSdsbCBmaW5kIHNvbWV0aGluZyB0byBwdXQgaGVyZQ==',
    },
  })
);
```

## 客製化的 Network Layer

Relay 也讓我們可以完全地取代預設的 network layer。

客製化的 network layer 必須符合以下的 [RelayNetworkLayer](interfaces-relay-network-layer.html) 介面。雖然預設的 network layer 是一個接受一些設定的可實體化類別，但這不是注入的 network layer 所必需的。

例如，network layer 可以是一個符合這個介面的簡單物件：

```
var myNetworkLayer = {
  sendMutation(mutationRequest) {
    // ...
  },
  sendQueries(queryRequests) {
    // ...
  },
  supports(...options) {
    // ...
  },
};

Relay.injectNetworkLayer(myNetworkLayer);
```

你可以閱讀更多有關 [RelayNetworkLayer](interfaces-relay-network-layer.html) API 介面的內容。
