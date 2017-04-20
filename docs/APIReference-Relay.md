---
id: api-reference-relay
title: Relay
layout: docs
category: Relay Classic API
permalink: docs/api-reference-relay.html
next: api-reference-relay-container
---


`Relay` 是 Relay library 的 entry point。如果你使用任何一個 prebuilt package，你可以用全域變數取用它；如果你使用 CommonJS 模組，那你可以 `require()` 它。

> 附註
>
> `react-relay` npm module 把 `react` 設為 *peer dependency*。你的應用程式應該明確地指定 React 為 dependency。

最常使用的 function 是 [`createContainer()`](#createcontainer-static-method)，它用資料宣告來包裝 component。

## 概觀

*屬性*

<ul class="apiIndex">
  <li>
    <a href="guides-network-layer.html">
      <pre>static DefaultNetworkLayer &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="guides-mutations.html">
      <pre>static Mutation &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="api-reference-relay-ql.html">
      <pre>static QL &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="api-reference-relay-proptypes.html">
      <pre>static PropTypes &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="guides-root-container.html">
      <pre>static RootContainer &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="guides-routes.html">
      <pre>static Route &rarr;</pre>
    </a>
  </li>
  <li>
    <a href="api-reference-relay-store.html">
      <pre>static Store &rarr;</pre>
    </a>
  </li>
</ul>

*方法*

<ul class="apiIndex">
  <li>
    <a href="#createcontainer-static-method">
      <pre>static createContainer(Component, ContainerConfig)</pre>
      建立一個 Relay Container。
    </a>
  </li>
  <li>
    <a href="#injectnetworklayer-static-method">
      <pre>static injectNetworkLayer(networkLayer)</pre>
      客製化 queries 和 mutations 要如何被送到伺服器。
    </a>
  </li>
  <li>
    <a href="#injecttaskscheduler-static-method">
      <pre>static injectTaskScheduler(scheduler)</pre>
      設定 Relay 的處理程序要何時發生。
    </a>
  </li>
  <li>
    <a href="#iscontainer-static-method">
      <pre>static isContainer(Component)</pre>
      判斷給定的物件是不是一個 Relay.Container。
    </a>
  </li>
</ul>

## 屬性

### DefaultNetworkLayer (static 屬性)

查看 [Network Layer Guide](guides-network-layer.html)。

### Mutation

查看 [Mutations Guide](guides-mutations.html)。

### QL

查看 [Relay.QL API reference](api-reference-relay-ql.html)。

### PropTypes

查看 [PropTypes API reference](api-reference-relay-proptypes.html)。

### RootContainer

查看 [RootContainer Guide](guides-root-container.html)。

### Route

查看 [Routes Guide](guides-routes.html)。

### Store

查看 [Store API reference](api-reference-relay-store.html)。

## 方法

### createContainer (static 方法)

```
var Container = Relay.createContainer(Component, {
  initialVariables?: Object,
  prepareVariables?: (variables: Object, route: string) => Object,
  fragments: {[key: string]: Function}
});
```

建立一個新的 Relay Container - 查看 [Container Guide](guides-containers.html) 以獲得更多的細節與範例。

### injectNetworkLayer (static 方法)

```
Relay.injectNetworkLayer(networkLayer: {
  sendMutation: (mutation: RelayMutationRequest) => void;
  sendQueries: (queries: Array<RelayQueryRequest>) => void;
  supports: (...options: Array<string>): boolean;
});
```

覆蓋掉 [DefaultNetworkLayer](#defaultnetworklayer-static-property)。

#### 範例

舉個例子，我們可以如下印出每一個被送去伺服器的 mutation：

```
var DefaultNetworkLayer = Relay.DefaultNetworkLayer;

class MutationLoggingNetworkLayer extends DefaultNetworkLayer {
  sendMutation(mutation) {
    // 印出回應或是錯誤 (注意，`mutation` 是一個 promise)
    mutation.then(
      response => console.log(response),
      error => console.error(error),
    );
    // 使用預設的 network 實作來發送 mutation
    return super.sendMutation(mutation);
  }
};

Relay.injectNetworkLayer(new MutationLoggingNetworkLayer());
```

### injectTaskScheduler (static 方法)

```
Relay.injectTaskScheduler(scheduler: Scheduler): void;

type Scheduler = (task: Function) => void;
```

Relay 把它的核心處理 function 包在輕量的 task 裡面，它預設是會立刻被執行 (也就是說，同步地)。為了客製化這些 task *何時*被執行 - 例如為了避免在 touch 手勢期間中斷動畫 - 應用程式可以提供一個客製化的排程 function。

#### 範例

預設的實作如下：

```
Relay.injectTaskScheduler(task => task());
```

注意它會立刻執行下一個 task。Relay 會管理 task 的順序以確保操作有一個適當的順序 - scheduler 不能跳過或重新排序 task，只能決定何時執行下一個。

在 React Native 中，我們可以如下把 Relay 的處理程序排程，以避免中斷 touch 手勢：

```
var {InteractionManager} = require('react-native');

Relay.injectTaskScheduler(InteractionManager.runAfterInteractions);
```

你可以在 [React Native API 文件](http://facebook.github.io/react-native/docs/interactionmanager.html) 閱讀更多有關 `InteractionManager` 的內容。

### isContainer (static 方法)

```
Relay.isContainer(Component: Object): boolean;
```

#### 範例

```
var Component = require('...');

if (Relay.isContainer(Component)) {
  Component.getFragment('...');
}
```
