---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
---

要入門建構 Relay 應用程式，你將會需要三個東西：

1. **一個 GraphQL Schema**

  對你的資料模型的描述與相關聯的一組知道要如何抓取應用程式可能會需要的任何資料的 resolve 方法。

  GraphQL 被設計用來支援廣泛的資料存取模式。為了了解應用程式資料的架構，Relay 需要你在定義 schema 時遵照某些規定。這些文件都提供在 [GraphQL Relay Specification](graphql-relay-specification.html#content) 裡。

  - **[graphql-js](https://github.com/graphql/graphql-js)** on [npm](https://www.npmjs.com/package/graphql)

    使用 JavaScript 來建構 GraphQL schema 的通用工具

  - **[graphql-relay-js](https://github.com/graphql/graphql-relay-js)** on [npm](https://www.npmjs.com/package/graphql-relay)

    用一個跟 Relay 流暢整合的方式，來定義資料之間的 connections 和 mutations 的 JavaScript helpers

2. **一個 GraphQL 伺服器**

  任何伺服器都可以學習載入 schema 並用 GraphQL 溝通。我們的[範例](https://github.com/facebook/relay/tree/081b4a3f17dcf/examples)使用 Express。

  - 在 [npm](https://www.npmjs.com/package/express-graphql) 上的 **[express-graphql](https://github.com/graphql/express-graphql)**

3. **Relay**

  Relay 透過一個 network layer 來跟 GraphQL 伺服器溝通。Relay 附帶的 [network layer](https://github.com/facebook/relay/tree/master/src/network-layer/default) 直接與 express-graphql 相容，並將會持續在我們添加新功能到 transport 之後進化。

要現在馬上入門的最好方式輔助就是看一下這三個部分如何結合在一起來行成一個可運作的範例。下一頁的教學將會使用 [Relay Starter Kit](https://github.com/facebook/relay-starter-kit)，引導你走過一個範例應用程式，給你關於你可以如何開始使用 Relay 在自己的應用程式上的想法。
