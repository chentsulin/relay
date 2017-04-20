---
id: interfaces-relay-query-request
title: RelayQueryRequest
layout: docs
category: Relay Classic Interfaces
permalink: docs/interfaces-relay-query-request.html
---

`RelayQueryRequest` 封裝了一個 Relay 需要送去伺服器的 query。是通過 `sendQueries` 方法把它們提供給 network layer。

## 概觀

*方法*

<ul class="apiIndex">
  <li>
    <a href="#getquerystring">
      <pre>getQueryString()</pre>
    </a>
  </li>
  <li>
    <a href="#getvariables">
      <pre>getVariables()</pre>
    </a>
  </li>
  <li>
    <a href="#getid">
      <pre>getID()</pre>
    </a>
  </li>
  <li>
    <a href="#getdebugname">
      <pre>getDebugName()</pre>
    </a>
  </li>
</ul>


## 方法

### getQueryString

```
getQueryString(): string
```

取得這個 GraphQL query 的表示字串。

### getVariables

```
getVariables(): {[name: string]: mixed}
```

取得被這個 query 使用的變數。這些變數應該被 serialize 並在 GraphQL 請求中送出。

### getID

```
getID(): string
```

取得這個 query 的唯一識別碼。這些識別碼在送出一個單一 GraphQL 請求時很有用，可以把回應 payload 指配給它們對應的 query。

### getDebugName

```
getDebugName(): string
```

取得一個用來參考到這個請求的字串名稱，以印出 debug 用的 output。
