---
id: guides-routes
title: Routes
layout: docs
category: Relay Classic Guides
permalink: docs/guides-routes.html
next: guides-root-container
---

Routes 負責定義 Relay 應用程式的 entry point。不過為了了解為什麼需要 routes，我們必須先了解 GraphQL query 與 fragment 之間的不同。

> 備註
>
> Relay routes 沒有真的實作任何 URL routing 的具體邏輯也沒有操作 History API。未來我們可能會把 RelayRoute 改名成一些像是 RelayQueryRoots 或是 RelayQueryConfig 之類的東西。想了解更多為什麼 Relay 不提供 URL-routing 功能，與這種解決方法的建議相關資訊，請看[這篇文章](https://medium.com/@cpojer/relay-and-routing-36b5439bad9)。

## Query 與 Fragment

在 GraphQL 中，**query** 宣告存在於 root query type 上的欄位。例如，以下的 query 可以抓取 `id` 是 `123` 的 user 的 name：

```
query UserQuery {
  user(id: "123") {
    name,
  },
}
```

另一方面，GraphQL **fragment** 宣告存在於任何隨意 type 上的欄位。例如，以下的 fragment 抓取_一些_ `User` 的 profile picture URI。

```
fragment UserProfilePhoto on User {
  profilePhoto(size: $size) {
    uri,
  },
}
```

Fragment 可以嵌入到其他的 fragment 或是 query 中。例如，上面的 fragment 可以被用來抓取 user `123` 的 profile photo：

```
query UserQuery {
  user(id: "123") {
    ...UserProfilePhoto,
  },
}
```

不過，這個 fragment 也可以用來抓取 user `123` 的每一個朋友的 profile photo：

```
query UserQuery {
  user(id: "123") {
    friends(first: 10) {
      edges {
        node {
          ...UserProfilePhoto,
        },
      },
    },
  },
}
```

因為 Relay container 定義 fragment 而不是 query，它們可以簡單地被嵌入到多種 context。跟 React component 一樣，Relay container 有高度的可重用性。

## Routes 與 Queries

Routes 是定義了一組 root queries 和 input 參數的物件。下面是一個簡單的 route，可以用來 render user `123` 的 profile：

```
var profileRoute = {
  queries: {
    // Route 使用回傳一個 query root 的函式來宣告 queries。
    // Relay 將會自動地在 Relay.RootContainer 上
    // 從這個 route 配對的 Relay container 組合 `user` fragment
    user: () => Relay.QL`
      # 在 Relay 中，GraphQL query 的名稱可以選擇性的省略。
      query { user(id: $userID) }
    `,
  },
  params: {
    // 這個 `userID` 參數將會填入上面的 `$userID` 變數。
    userID: '123',
  },
  // Routes 也必須定義一個字串名稱。
  name: 'ProfileRoute',
};
```

如果我們想要對任意 user 建立一個這個 route 的實體，我們可以建立 `Relay.Route` 抽象類別的子類別。`Relay.Route` 讓定義一組可以被重複用許多次的 queries 和需要的參數變得簡單：

```
class ProfileRoute extends Relay.Route {
  static queries = {
    user: () => Relay.QL`
      query { user(id: $userID) }
    `,
  };
  static paramDefinitions = {
    // 透過設定 `required` 為 true，如果在實體化時沒有提供 `userID`
    // `ProfileRoute` 會 throw。
    userID: {required: true},
  };
  static routeName = 'ProfileRoute';
}
```

現在我們可以實體化一個 `ProfileRoute` 來抓取 user `123` 的資料：

```
// 等同於我們前面建立的物件實字。
var profileRoute = new ProfileRoute({userID: '123'});
```

不過，現在我們也可以針對任意 user ID 去建立 route。例如，如果我們想要建構一個 route 來抓取藉由 `userID` query 參數定義的 user 資料，我們可以這樣使用：

```
window.addEventListener('popstate', () => {
  var userID = getQueryParamFromURI('userID', document.location.href);
  var profileRoute = new ProfileRoute({userID: userID});
  ReactDOM.render(
    <Relay.RootContainer
      Component={UserProfile}
      route={profileRoute}
    />,
    document.getElementById('app')
  );
});
```
