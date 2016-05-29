---
id: api-reference-relay-renderer
title: Relay.Renderer
layout: docs
category: API Reference
permalink: docs/api-reference-relay-renderer.html
next: api-reference-relay-root-container
---

**Relay.Renderer** 替代一個 `Relay.RootContainer`，compose 成一個 `Relay.ReadyStateRenderer`，並根據給定的 `queryConfig` 執行資料的 fetch。

## 概觀

*Props*

<ul class="apiIndex">
  <li>
    <a href="#container">
      <pre>Container</pre>
      Relay container 定義 fragments 和 view 的 render。
    </a>
  </li>
  <li>
    <a href="#forcefetch">
      <pre>forceFetch</pre>
      無論客戶端資料是否可用，發送一個伺服器請求。
    </a>
  </li>
  <li>
    <a href="#queryconfig">
      <pre>queryConfig</pre>
       `QueryConfig` 或 `Relay.Route` 定義 query 的 root。
    </a>
  </li>
  <li>
    <a href="#environment">
      <pre>environment</pre>
      在 `RelayEnvironment` 介面的一個 `Relay.Environment` 實例或任何物件的實作。
    </a>
  </li>
    <li>
    <a href="#render">
      <pre>render</pre>
      當資料要求完成時，呼叫 render。
    </a>
  </li>
  <li>
    <a href="#onreadystatechange">
      <pre>onReadyStateChange</pre>
    </a>
  </li>
</ul>

## Props

### Container

```
Container: RelayContainer
```

必須是一個有效的 `RelayContainer`。Relay 會嘗試在 render 之前，完成資料的請求。

### forceFetch

```
forceFetch: boolean
```

如果提供並設定為 true，不管在客戶端的資料是否可用，總是向伺服器發送資料請求。

### QueryConfig

```
queryConfig: RelayRoute
```

任一個 `Relay.Route` 的實例，或一個物件都需要 `name`、`queries` 和可選的 `params` 屬性。

### Environment

```
environment: RelayEnvironment
```

一個符合 `Relay.Environment` interface 的物件，像是 `Relay.Store`。

### render

```
render({
  props: ?{[propName: string]: mixed},
  done: boolean,
  error: ?Error,
  retry: ?Function,
  stale: boolean
}): ?React$Element
```

如果 render callback 不提供，如果資料可用的話，預設行為是 render 現有存在或不存在的 view 到 container。

如果 callback 回傳 `undefined`，先前被 render 的 view （如果先前都沒有 view 的話什麼都不做）被 render（例如：當從一個 `queryConfig` 到其他部份時）。

#### 範例

```{4-6}
// 在這個範例中，`ErrorComponent` 和 `LoadingComponent`
// 簡單的顯示一個 靜態錯誤訊息和載入進度。
<Relay.Renderer
  Container={ProfilePicture}
  queryConfig={profileRoute}
  environment={Relay.Store}
  render={({done, error, props, retry, stale}) => {
        if (error) {
          return <ErrorComponent />;
        } else if (props) {
          return <ProfilePicture {...props} />;
        } else {
          return <LoadingComponent />;
        }
      }}
/>
```

### onReadyStateChange

```
onReadyStateChange(
  readyState: {
    aborted: boolean;
    done: boolean;
    error: ?Error;
    ready: boolean;
    stale: boolean;
  }
): void
```

這個 callback prop 被做為發生各種事件的資料解析。

也可以參閱：[Ready State](guides-ready-state.html)
