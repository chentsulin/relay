---
id: api-reference-relay-renderer
title: Relay.Renderer
layout: docs
category: API Reference
permalink: docs/api-reference-relay-renderer.html
next: api-reference-relay-root-container
---

**Relay.Renderer** 是一個 `Relay.RootContainer` 的替代品，它合成一個 `Relay.ReadyStateRenderer`，並根據給定的 `queryConfig` 執行資料的抓取。

## 概觀

*Props*

<ul class="apiIndex">
  <li>
    <a href="#container">
      <pre>Container</pre>
      定義 fragments 和要 render 的 view 的 Relay container。
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
       `QueryConfig` 或定義了 query root 的 `Relay.Route`。
    </a>
  </li>
  <li>
    <a href="#environment">
      <pre>environment</pre>
      一個 `Relay.Environment` 的實體或實作了 `RelayEnvironment` 介面的任何物件。
    </a>
  </li>
    <li>
    <a href="#render">
      <pre>render</pre>
      當資料要求被滿足時，呼叫 render。
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

必須是一個有效的 `RelayContainer`。Relay 會在 render 之前，完成嘗試去滿足它的資料的需求。

### forceFetch

```
forceFetch: boolean
```

如果提供並設定為 true，不管在客戶端的資料是否已經可以使用，總是向伺服器發送資料請求。

### QueryConfig

```
queryConfig: RelayRoute
```

一個 `Relay.Route` 的實體，或是一個有 `name`、`queries` 和可選的 `params` 屬性的物件。

### Environment

```
environment: RelayEnvironment
```

一個符合 `Relay.Environment` 介面的物件，例如 `Relay.Store`。

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

如果沒有提供 render callback，且資料可用的話，預設的行為是如果有既存的 view 就 render 它，如果沒有則不 render 東西到 container。

如果 callback 回傳 `undefined`（例如：當從一個 `queryConfig` transition 到另一個時），render 先前被 render 的 view （或如果先前沒有 view 的話不 render 任何東西）。

#### 範例

```{4-6}
// 在這個範例中，`ErrorComponent` 和 `LoadingComponent`
// 簡單的顯示一個靜態錯誤訊息和載入指示符。
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

這個 callback prop 會在各種資料解析事件發生時被呼叫。

也可以參閱：[Ready State](guides-ready-state.html)
