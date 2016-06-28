---
id: graphql-connections
title: Connection
layout: docs
category: GraphQL
permalink: docs/graphql-connections.html
indent: true
next: graphql-mutations
---

在 Star Wars universe 中，一個 faction 有許多 ship。Relay 包含讓操作一對多關聯變得簡單的功能，使用一個標準化的方式來表達這些一對多關聯。這個標準的 connection 模型提供透過 connection 來處理 slice 和 paginate 的方法。

讓我們先選擇 rebels，並查詢它們的第一個 ship：

```
query RebelsShipsQuery {
  rebels {
    name,
    ships(first: 1) {
      edges {
        node {
          name
        }
      }
    }
  }
}
```

產生

```json
{
  "rebels": {
    "name": "Alliance to Restore the Republic",
    "ships": {
      "edges": [
        {
          "node": {
            "name": "X-Wing"
          }
        }
      ]
    }
  }
}
```

使用 `first` 參數來把這對 `ships` 結果集切到只剩第一個。不過那如果我們想要用它做 paginate 呢？在每一個 edge 上，會有一個我們可以用來 paginate 的 cursor。這次讓我們查詢前兩個，並如法炮製的取回 cursor：

```
query MoreRebelShipsQuery {
  rebels {
    name,
    ships(first: 2) {
      edges {
        cursor
        node {
          name
        }
      }
    }
  }
}
```

而我們取回

```json
{
  "rebels": {
    "name": "Alliance to Restore the Republic",
    "ships": {
      "edges": [
        {
          "cursor": "YXJyYXljb25uZWN0aW9uOjA=",
          "node": {
            "name": "X-Wing"
          }
        },
        {
          "cursor": "YXJyYXljb25uZWN0aW9uOjE=",
          "node": {
            "name": "Y-Wing"
          }
        }
      ]
    }
  }
}
```

要注意，cursor 是一個 base64 字串。這是一個前面看過的模式：伺服器提醒我們這是一個不透明的字串。我們可以把這個字串傳回伺服器作為 `ships` 欄位的 `after` 參數，這或讓我們查詢在前一次結果的最後一筆的下三個 ship：

```
query EndOfRebelShipsQuery {
  rebels {
    name,
    ships(first: 3 after: "YXJyYXljb25uZWN0aW9uOjE=") {
      edges {
        cursor,
        node {
          name
        }
      }
    }
  }
}
```

給我們

```json

{
  "rebels": {
    "name": "Alliance to Restore the Republic",
    "ships": {
      "edges": [
        {
          "cursor": "YXJyYXljb25uZWN0aW9uOjI=",
          "node": {
            "name": "A-Wing"
          }
        },
        {
          "cursor": "YXJyYXljb25uZWN0aW9uOjM=",
          "node": {
            "name": "Millenium Falcon"
          }
        },
        {
          "cursor": "YXJyYXljb25uZWN0aW9uOjQ=",
          "node": {
            "name": "Home One"
          }
        }
      ]
    }
  }
}
```

太棒了！讓我們繼續前進並取得後四個！

```
query RebelsQuery {
  rebels {
    name,
    ships(first: 4 after: "YXJyYXljb25uZWN0aW9uOjQ=") {
      edges {
        cursor,
        node {
          name
        }
      }
    }
  }
}
```

產生

```json
{
  "rebels": {
    "name": "Alliance to Restore the Republic",
    "ships": {
      "edges": []
    }
  }
}
```

嗯。沒有 ship；猜測應該是在系統中 rebel 只有五個 ship。如果能知道我們已經碰到 connection 的末端的話很不錯，就不需要再一次往返來驗證這件事。connection 模型用一個叫做 `PageInfo` 的 type 來使用這個功能。因此讓我們發送兩個 query 再一次的幫我們把 ships 取回，但這次要查詢 `hasNextPage`:

```
query EndOfRebelShipsQuery {
  rebels {
    name,
    originalShips: ships(first: 2) {
      edges {
        node {
          name
        }
      }
      pageInfo {
        hasNextPage
      }
    }
    moreShips: ships(first: 3 after: "YXJyYXljb25uZWN0aW9uOjE=") {
      edges {
        node {
          name
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
}
```

而我們取回

```json
{
  "rebels": {
    "name": "Alliance to Restore the Republic",
    "originalShips": {
      "edges": [
        {
          "node": {
            "name": "X-Wing"
          }
        },
        {
          "node": {
            "name": "Y-Wing"
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": true
      }
    },
    "moreShips": {
      "edges": [
        {
          "node": {
            "name": "A-Wing"
          }
        },
        {
          "node": {
            "name": "Millenium Falcon"
          }
        },
        {
          "node": {
            "name": "Home One"
          }
        }
      ],
      "pageInfo": {
        "hasNextPage": false
      }
    }
  }
}
```

因此在第一次對 ships 的 query，GraphQL 告訴我們有下一個 page，但是在下一次，它告訴我們已經碰到 connection 的末端。

Relay 使用這所有的功能來打造 connection 相關的抽象，讓這些能有效的運作而不需要在客戶端上手動的管理 cursor。

關於伺服器應該有怎樣的行為的完整細節可以在 [GraphQL Cursor Connections](../graphql/connections.htm) spec 找到。
