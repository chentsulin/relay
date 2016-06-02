---
id: api-reference-relay-root-container
title: Relay.RootContainer
layout: docs
category: API Reference
permalink: docs/api-reference-relay-root-container.html
next: api-reference-relay-ql
---

**Relay.RootContainer** 是一個 React component，嘗試完成對於給定 `route` 的 `Component` 實例完成資料的 render。

## 概觀

*Props*

<ul class="apiIndex">
  <li>
    <a href="#component">
      <pre>Component</pre>
      定義了 fragments 和要 render 的 view 的 Relay container。
    </a>
  </li>
  <li>
    <a href="#route">
      <pre>route</pre>
      定義了 query root 的 Route。
    </a>
  </li>
  <li>
    <a href="#forcefetch">
      <pre>forceFetch</pre>
      無論客戶端資料是否可用，發送一個伺服器請求。
    </a>
  </li>
  <li>
    <a href="#renderloading">
      <pre>renderLoading</pre>
      當資料需求正在被滿足時，呼叫它來 render。
    </a>
  </li>
  <li>
    <a href="#renderfetched">
      <pre>renderFetched</pre>
      當資料需求被滿足時，呼叫它來 render。
    </a>
  </li>
  <li>
    <a href="#renderfailure">
      <pre>renderFailure</pre>
      當滿足資料需求失敗時，呼叫它來 render。
    </a>
  </li>
  <li>
    <a href="#onreadystatechange">
      <pre>onReadyStateChange</pre>
    </a>
  </li>
</ul>

## Props

### Component

```
Component: RelayContainer
```

必須是一個有效的 `RelayContainer`。Relay 會在 render 之前，嘗試去滿足它的資料需求。

也可以參閱：[Root Container > Component 和 Route](guides-root-container.html#component-and-route)

### route

```
route: RelayRoute
```

任一個 `Relay.Route` 的實例，或一個物件都需要 `name`、`queries` 和可選的 `params` 屬性。

也可以參閱：[Root Container > Component 和 Route](guides-root-container.html#component-and-route)

### forceFetch

```
forceFetch: boolean
```

如果提供並設定為 true，不管在客戶端的資料是否可以立刻滿足資料需求，總是向伺服器發送資料請求。

也可以參閱：[Root Container > Force Fetching](guides-root-container.html#force-fetching)

### renderLoading

```
renderLoading(): ?ReactElement
```

當資料請求還沒完成時，`renderLoading` 會被呼叫 render view。如果回傳 `undefined`，先前被 render 的 view （如果先前都沒有 view 的話什麼都不做）被 render。

#### 範例

```{4-6}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  renderLoading={function() {
    return <div>Loading...</div>;
  }}
/>
```

也可以參閱：[Root Container > renderLoading](guides-root-container.html#renderloading)

### renderFetched

```
renderFetched(
  data: {[propName: string]: $RelayData},
  readyState: {stale: boolean}
): ?ReactElement
```

當所有資料請求完成時，`renderFetched` 會被呼叫 render view。當 render 時，這個 callback 預期會 spread `data` 提供給 `Container`。

#### 範例

```{4-10}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  renderFetched={function(data) {
    return (
      <ScrollView>
        <ProfilePicture {...data} />
      </ScrollView>
    );
  }}
/>
```

也可以參閱：[Root Container > renderFetched](guides-root-container.html#renderfetched)

### renderFailure

```
renderFailure(error: Error, retry: Function): ?ReactElement
```

當資料請求完成且失敗時，`renderFailure` 會被呼叫 render view。

#### 範例

```{4-11}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  renderFailure={function(error, retry) {
    return (
      <div>
        <p>{error.message}</p>
        <p><button onClick={retry}>Retry?</button></p>
      </div>
    );
  }}
/>
```

也可以參閱：[Root Container > renderFailure](guides-root-container.html#renderfailure)

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
