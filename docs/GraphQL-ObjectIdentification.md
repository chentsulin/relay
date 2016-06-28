---
id: graphql-object-identification
title: Object Identification
layout: docs
category: GraphQL
permalink: docs/graphql-object-identification.html
indent: true
next: graphql-connections
---

`Faction` 和 `Ship` 都有識別碼，讓我們可以用來重新抓取它們。我們透過 `Node` 介面和在 root query type 上的 `node` 欄位來把這個功能暴露給 Relay。

`Node` 介面包含一個欄位，`id`，它是一個 `ID!`。`node` root 欄位接受一個參數，一個 `ID!`，並回傳一個 `Node`。這兩個東西一起合作來達成重新抓取；如果我們把那個欄位回傳的 `id` 傳進 `node` 欄位，我們可以把物件取回來。

讓我們來在實例中看看這個，並 query rebels 的 ID：

```
query RebelsQuery {
  rebels {
    id
    name
  }
}
```

回傳

```json
{
  "rebels": {
    "id": "RmFjdGlvbjox",
    "name": "Alliance to Restore the Republic"
  }
}
```

因此在我們系統中現在我們知道這些 Rebel 的 ID 了。我們現在可以重新抓取它們：

```
query RebelsRefetchQuery {
  node(id: "RmFjdGlvbjox") {
    id
    ... on Faction {
      name
    }
  }
}
```

回傳

```json
{
  "node": {
    "id": "RmFjdGlvbjox",
    "name": "Alliance to Restore the Republic"
  }
}
```

如果我們對 Empire 做一樣的事，我們會發現它回傳一個不同的 ID，而我們同樣可以重新抓取它：

```
query EmpireQuery {
  empire {
    id
    name
  }
}
```

產生

```json
{
  "empire": {
    "id": "RmFjdGlvbjoy",
    "name": "Galactic Empire"
  }
}
```

而

```
query EmpireRefetchQuery {
  node(id: "RmFjdGlvbjoy") {
    id
    ... on Faction {
      name
    }
  }
}
```

產生

```json
{
  "node": {
    "id": "RmFjdGlvbjoy",
    "name": "Galactic Empire"
  }
}
```

`Node` 介面和 `node` 欄位針對這個重新抓取假設全域有唯一的 ID。沒有全域唯一的 ID 的系統通常可以藉由組合 type 以及 type-specific ID 來合成它們，也就是在在這個範例中所做的。

我們取回的這些 ID 是 base64 字串。ID 被設計成不透明的 (唯一應該要被傳遞給 `node` 的 `id` 參數的東西，是在系統中 query 一些物件的 `id` 的不變結果)，而在 GraphQL 中把一個字串做 base64 處理是一個有用的慣例，以提醒 viewer 這個字串是一個不透明的識別碼。

關於伺服器應該有怎樣的行為的完整細節可以在 [GraphQL Object Identification](../graphql/objectidentification.htm) spec 找到。
