---
id: guides-root-container
title: Root Container
layout: docs
category: Guides
permalink: docs/guides-root-container.html
next: guides-ready-state
---

到目前為止，我們已經涵蓋了兩個有助於宣告資料的部分：

 - **Relay.Route** 讓我們宣告 query root。
 - **Relay.Container** 讓 component 宣告 fragment。

要使用這些部分來建構一個我們可以送去伺服器抓取資料的成熟 GraphQL query，我們還需要使用 **Relay.RootContainer**。

## Component 和 Route

**Relay.RootContainer** 是一個 React component，給定一個 `Component` 和一個 `route`，它會嘗試去滿足需要的資料以便 render 一個 `Component` 的實體。

```
ReactDOM.render(
  <Relay.RootContainer
    Component={ProfilePicture}
    route={profileRoute}
  />,
  container
);
```

當上面的 **Relay.RootContainer** 被 render，Relay 會建構一個 query 並把它送給 GraphQL 伺服器。一旦已經抓取了所有需要的資料，`ProfilePicture` 將會被 render。Props 以及 fragments 會包含從伺服器抓取回來的資料。

如果 `Component` 或 `route` 其中一個曾經改變，**Relay.RootContainer** 將會立刻開始嘗試滿足新的資料需求。

## Render Callbacks

**Relay.RootContainer** 接受三個選擇性的 callback 作為 props，這讓我們對 render 的行為可以有更細緻的控制。

### `renderLoading`

**Relay.RootContainer** 在它無法立刻滿足 render 需要的資料時會 render 載入狀態。這常常發生在第一次的 render，不過如果 `Component` 或 `route` 其中一個改變也可能發生。

預設情況下，在載入首次 render 的資料時，沒有東西會被 render。如果前一組的 `Component` 和 `route` 已經被滿足並 render，預設的行為是繼續 render 先前的 view。

我們可以透過提供 `renderLoading` prop 來改變這個行為：

```{4-6}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  renderLoading={function() {
    return <div>Loading...</div>;
  }}
/>
```

這個程式片段設定 **Relay.RootContainer** 在它需要去抓取資料的時候 render「Loading...」文字。

`renderLoading` callback 可以藉由回傳 `undefined` 模擬預設行為。要注意這跟回傳 `null` 的 `renderLoading` callback 不同，回傳 null 的話在載入資料時不會 render 任何東西，即使先前已經有 render 過的 view。

### `renderFetched`

當所有要 render 所需要的資料都變得可以使用時，**Relay.RootContainer** 預設將會 render 被提供的 `Component`。不過，我們可以透過提供一個 callback 給 `renderFetched` prop 來改變這個行為：

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

這個程式片段設定 **Relay.RootContainer** 在資料準備好時把 `ProfilePicture` render 在一個 `ScrollView` component 裡面。

`renderFetched` callback 總是用一個 `data` 參數呼叫，它是一個從 `propName` 映射到 query 資料的物件。預期 `renderFetched` callback 會使用它們來 render 提供的 `Component` (例如，使用 [JSX spread attributes 功能](https://facebook.github.io/react/docs/jsx-spread.html))。

> 附註
>
> 儘管我們能在 `renderFetched` 存取 `data` 物件，但實際的資料被刻意的隱藏起來。這能防止 `renderFetched` 在 `Component` 宣告的 fragment 上建立一個隱含的相賴關係。

### `renderFailure`

如果有錯誤發生，妨礙了 **Relay.RootContainer** 抓取 render `Component` 需要的資料，預設不會 render 任何東西。錯誤處理行為可以透過提供一個 callback 給 `renderFailure` prop 來設定：

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

`renderFailure` callback 會被用兩個參數來呼叫：一個 `Error` 物件和一個用來 retry 請求的 function。如果這個錯誤是在伺服器回應中的一個伺服器溝通錯誤的結果，可以在 `error.source` 存取回應的 payload 來檢查。

## 強制抓取

就像大部份的 Relay API 一樣，**Relay.RootContainer** 會在送請求給伺服器之前先嘗試使用客戶端的 store 去 resolve 資料。如果我們想要強制發伺服器請求，即使資料在客戶端可以使用，我們可以使用 `forceFetch` boolean prop。

```{4}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  forceFetch={true}
/>
```

當 `forceFetch` 是 true，**Relay.RootContainer** 總是會送一個請求到伺服器。不過，如果所有 render 需要的資料在客戶端也都可以使用，`renderFetched` 可能仍然會在伺服器請求完成前被呼叫。

```{5-6,9}
<Relay.RootContainer
  Component={ProfilePicture}
  route={profileRoute}
  forceFetch={true}
  renderFetched={function(data, readyState) {
    var isRefreshing = readyState.stale;
    return (
      <ScrollView>
        <Spinner style={{display: isRefreshing ? 'block' : 'none' }}
        <ProfilePicture {...data} />
      </ScrollView>
    );
  }}
/>
```

當 `forceFetch` 是 true 而且 `renderFetched` 因為客戶端資料可以使用而被呼叫，`renderFetched` 被呼叫會附帶一個 `stale` boolean 屬性的第二個參數。如果 `renderFetched` 在強制發出的伺服器請求完成之前被呼叫，`stale` 屬性會是 true。

## Ready State Change

**Relay.RootContainer** 也支援 `onReadyStateChange` prop，它讓我們接收在滿足資料需求時所發生更詳細的事件。

在我們的下一份指南 [Ready State](guides-ready-state.html)，學習如何要如何使用 `onReadyStateChange`。
