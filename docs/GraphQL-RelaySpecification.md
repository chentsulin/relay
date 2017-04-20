---
id: graphql-relay-specification
title: GraphQL Relay Specification
layout: docs
category: GraphQL
permalink: docs/graphql-relay-specification.html
next: graphql-object-identification
---

# 入門

Relay 對 GraphQL 伺服器作出三個核心假設，就是它必須提供：

1. 重新抓取一個物件的機制。
2. 關於要如何透過 connection 處理分頁的描述。
3. 架構 mutation 來使它們有可預測性。

這個範例示範了這三個假設。

這個範例不是那麼的全面，不過它被設計用來快速地介紹這些核心假設，以在深入更細節的 library specification 之前提供一些 context。

這個範例的前提是，我們想要使用 GraphQL 來在原始的 Star Wars 三部曲中 query ship 和 faction 的資訊。

我們假設讀者已經熟悉 GraphQL 了；如果沒有的話，[GraphQL.js](https://github.com/graphql/graphql-js) 的 README 是一個好的起點。

我們也假設讀者已經熟悉 [Star Wars](https://en.wikipedia.org/wiki/Star_Wars)；如果沒有的話，Star Wars 的 1977 版本是一個好的起點，雖然 1997 的特別版將成為這份文件的目的。

## Schema

在下面描述的 schema 將會被用來示範一個被 Relay 使用的 GraphQL 伺服器應該要實作的功能。兩個核心的 type 是在 Star Wars 宇宙中的 faction 和 ship，而一個 faction 有許多的 ship 關聯到它。下面的這個 schema 是 GraphQL.js [`schemaPrinter`](https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js) 的 output。

```
interface Node {
  id: ID!
}

type Faction : Node {
  id: ID!
  name: String
  ships: ShipConnection
}

type Ship : Node {
  id: ID!
  name: String
}

type ShipConnection {
  edges: [ShipEdge]
  pageInfo: PageInfo!
}

type ShipEdge {
  cursor: String!
  node: Ship
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  rebels: Faction
  empire: Faction
  node(id: ID!): Node
}

input IntroduceShipInput {
  factionId: String!
  shipNamed: String!
  clientMutationId: String!
}

type IntroduceShipPayload {
  faction: Faction
  ship: Ship
  clientMutationId: String!
}

type Mutation {
  introduceShip(input: IntroduceShipInput!): IntroduceShipPayload
}
```
