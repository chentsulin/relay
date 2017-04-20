---
id: interfaces-relay-network-layer
title: RelayNetworkLayer
layout: docs
category: Relay Classic Interfaces
permalink: docs/interfaces-relay-network-layer.html
next: interfaces-relay-mutation-request
---

客製化的 network layer 必須符合 `RelayNetworkLayer` 介面。

## 概觀

*方法*

<ul class="apiIndex">
  <li>
    <a href="#sendmutation">
      <pre>sendMutation(mutationRequest)</pre>
    </a>
  </li>
  <li>
    <a href="#sendqueries">
      <pre>sendQueries(queryRequests)</pre>
    </a>
  </li>
  <li>
    <a href="#supports">
      <pre>supports(...options)</pre>
    </a>
  </li>
</ul>


## 方法

### sendMutation

```
sendMutation(mutationRequest: RelayMutationRequest): ?Promise
```

實作這個方法可以把 mutations 送到伺服器。當收到伺服器回應時，這個方法必須要用回應的資料去呼叫 `mutationRequest.resolve`，或是用一個 `Error` 物件去呼叫 `mutationRequest.reject`。

這個方法可以選擇性地回傳一個 promise 來幫助適當的傳播錯誤。

#### 範例

```
sendMutation(mutationRequest) {
  return fetch(...).then(result => {
    if (result.errors) {
      mutationRequest.reject(new Error(...))
    } else {
      mutationRequest.resolve({response: result.data});
    }
  });
}
```

請查看 [RelayMutationRequest](interfaces-relay-mutation-request.html) 以了解在 argument 物件上可以使用的方法。

### sendQueries

```
sendQueries(queryRequests: Array<RelayQueryRequest>): ?Promise
```

實作這個方法可以把 queries 送到伺服器。針對每一個 query 請求，當收到伺服器回應時，這個方法必須用回應的資料去呼叫 `resolve`，或是用一個 `Error` 物件去呼叫 `reject`。

這個方法接收一個 queries 陣列 (而不是一個單一 query) 以便於批次處理 queries 來提升 network 效率。

這個方法可以選擇性地回傳一個 promise 來幫助適當的傳播錯誤。

#### 範例

```
sendQueries(queryRequests) {
  return Promise.all(queryRequests.map(
    queryRequest => fetch(...).then(result => {
      if (result.errors) {
        queryRequest.reject(new Error(...));
      } else {
        queryRequest.resolve({response: result.data});
      }
    })
  ));
}
```

請查看 [RelayQueryRequest](interfaces-relay-query-request.html) 以了解在 argument 物件上可以使用的方法。

### supports

```
supports(...options: Array<string>): boolean
```

實作這個方法在提供的選項有被這個 network layer 支援時回傳 true。這是用來宣告這個 network layer 支援哪些功能。

往後，Relay 的進階功能可能會依賴 network layer 能夠支援某些特定的功能。

#### 範例

```
supports(...options) {
  return options.every(option => {
    if (option === 'future-feature') {
      return true;
    }
    return false;
  });
}
```
