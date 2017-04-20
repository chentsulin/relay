---
id: api-reference-relay-route
title: Relay.Route
layout: docs
category: Relay Classic API
permalink: docs/api-reference-relay-route.html
next: api-reference-relay-renderer
---

Relay 使用 routes 來定義 Relay 應用程式的 entry point。

> 附註
>
> Relay routes 沒有真的實作任何 URL routing 的特定邏輯，也沒有使用 History API。未來我們可能會把 RelayRoute 重新命名成像是 RelayQueryRoots 或是 RelayQueryConfig 之類的東西。


## 概觀

*屬性*

<ul class="apiIndex">
  <li>
    <a href="#paramdefinitions-static-property">
      <pre>static paramDefinitions</pre>
      宣告預期的參數。
    </a>
  </li>
  <li>
    <a href="#prepareparams-static-property">
      <pre>static prepareParams</pre>
      宣個額外的參數或是參數轉換。
    </a>
  </li>
  <li>
    <a href="#queries-static-property">
      <pre>static queries</pre>
      宣告一組 query root。
    </a>
  </li>
  <li>
    <a href="#routename-static-property">
      <pre>static routeName</pre>
      宣告這個 route 類別的名稱。
    </a>
  </li>
</ul>

*方法*

<ul class="apiIndex">
	<li>
		<a href="#constructor">
			<pre>constructor(initialParams)</pre>
		</a>
	</li>
</ul>

## 屬性

### paramDefinitions (static 屬性)

```
static paramDefinitions: {[param: string]: {required: boolean}}
```

Routes 可以宣告一組需要提供給 constructor 的參數名稱。這裡也是一個方便紀錄這組有效參數的位置。

#### 範例

```
class ProfileRoute extends Relay.Route {
	static paramDefinitions = {
		userID: {required: true},
	};
	// ...
}
```

### prepareParams (static 屬性)

```
static prepareParams: ?(prevParams: {[prevParam: string]: mixed}) => {[param: string]: mixed};
```

Routes 可以使用 `prepareParams` 來提供預設參數，或者把傳進去的參數傳過去、轉換或隱藏。

#### 範例

```
class ProfileRoute extends Relay.Route {
  static queries = {
    viewer: () => Relay.QL`query { viewer }`
  };
  static prepareParams = (prevParams) => {
    return {
      // 把提供的基本參數組傳過去：
      ...prevParams,
      // 轉換一個參數來符合內部的需求：
      id: toGlobalId('Profile', prevParams.id),
      // 提供一個起始的 `limit` 變數：
      limit: 10,
    }
  }
  // ...
}
```

### queries (static 屬性)

```
static queries: {
	[queryName: string]: () => Relay.QL`query { ... }`
};
```

Routes 必須使用 `Relay.QL` 宣告一組 query root。這些 queries 會自動合成一個符合 Relay container 的 fragment 命名成 `queryName`，與這個 route 一起使用在 **Relay.RootContainer** 上。

#### 範例

```
class ProfileRoute extends Relay.Route {
	static queries = {
		user: () => Relay.QL`query { user(id: $userID) }`,
	};
	// ...
}
```
In this example the Route should be initialized with a `userID` which gets passed on to the query. That `userID` variable will automatically be passed down to the top-level container and can be used there if needed. Further the top-level RelayContainer is expected to have a `user` fragment with the fields to be queried.

### routeName (static 屬性)

```
static routeName: string
```

Routes 必須定義一個字串名稱。

## 方法

### constructor

使用 `new` 關鍵字來建立一個 route 實體，可選擇性地傳遞一些參數給它。

#### 範例

```
var profileRoute = new ProfileRoute({userID: '123'});
```
