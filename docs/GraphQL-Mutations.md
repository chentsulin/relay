---
id: graphql-mutations
title: Mutations
layout: docs
category: GraphQL
permalink: docs/graphql-mutations.html
indent: true
next: graphql-further-reading
---

Relay 使用一個常見的模式來處理 mutation，它們是
在 mutation type 上的 root 欄位並伴隨一個單一參數：`input`，而 input 跟 output
都包含一個客戶端 mutation 識別碼用來協調請求和
回應。

慣例上，mutation 被命名成動詞，它們的 input 是在一樣的名字
後面附加「Input」，而它們回傳一個物件是一樣的名字
附加「Payload」。

所以針對我們的 `introduceShip` mutation，我們建立兩個 type：`IntroduceShipInput`
和 `IntroduceShipPayload`：

```
input IntroduceShipInput {
  factionId: ID!
  shipName: String!
  clientMutationId: String!
}

type IntroduceShipPayload {
  faction: Faction
  ship: Ship
  clientMutationId: String!
}
```

有了 input 和 payload，我們可以發送以下的 mutation：

```
mutation AddBWingQuery($input: IntroduceShipInput!) {
  introduceShip(input: $input) {
    ship {
      id
      name
    }
    faction {
      name
    }
    clientMutationId
  }
}
```

用這些參數：

```json
{
  "input": {
    "shipName": "B-Wing",
    "factionId": "1",
    "clientMutationId": "abcde"
  }
}
```

而我們會得到這個結果：

```json
{
  "introduceShip": {
    "ship": {
      "id": "U2hpcDo5",
      "name": "B-Wing"
    },
    "faction": {
      "name": "Alliance to Restore the Republic"
    },
    "clientMutationId": "abcde"
  }
}
```

伺服器應該有怎樣行為的完整細節
可以在 [GraphQL Input Object Mutations](../graphql/mutations.htm)
規範中找到。
