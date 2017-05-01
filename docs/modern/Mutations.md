---
id: mutations
title: Mutations
layout: docs
category: Relay Modern
permalink: docs/mutations.html
next: babel-plugin-relay
---

Relay 提供以下的 API 來執行 mutation。

```javascript
const {commitMutation} = require('react-relay');

type Variables = {[name: string]: any};

commitMutation(
  environment: Environment,
  config: {
    mutation: GraphQLTaggedNode,
    variables: Variables,
    onCompleted?: ?(response: ?Object) => void,
    onError?: ?(error: Error) => void,
    optimisticResponse?: ?() => Object,
    optimisticUpdater?: ?(store: RecordSourceSelectorProxy) => void,
    updater?: ?(store: RecordSourceSelectorProxy) => void,
  },
);
```

現在讓我們來仔細看看 `config`：

* `mutation`：被 `graphql` 標籤過的 mutation query。
* `variables`：包含了 mutation 所需要的變數的物件。
* `onCompleted`：在記憶體中的 Relay store 被 `updater` 更新之後，會用從伺服器來的「原始」回應執行這個回呼函數。
* `onError`：當 Relay 遇到錯誤會執行的回呼函數。
* `optimisticResponse`：一個函數，它提供符合 mutation 的回應類別定義的物件。如果有提供的話，樂觀回應會在 `optimisticUpdater` 執行之前被正規化到 proxy store。我們建議你提供 `optimisticResponse` 因為有兩個好處：
 * 跟 `updater` 類似，不需要為了簡單的 mutation (欄位變更) 去提供 `optimisticUpdater`。
 * 對於更多複雜的 mutation 來說，`optimisticUpdater` 和 `updater` 可以是同一個函數。
* `optimisticUpdater`：一個函數，它接收記憶體中的 Relay store 的 proxy。在這個函數中，客戶端定義「如何」用一種命令的方式透過 proxy 更新 store。
* `updater`：一個函數，它基於**真實的**伺服器回應去更新記憶體中的 Relay store。當伺服器的回應回來時，Relay 會先還原所有 `optimisticUpdater` 或 `optimisticResponse` 造成的變更，然後再施用 `updater` 到 store。

## 範例

一個簡單的 mutation，你只需要 `mutation` 和 `variables`：

```javascript
const {
  commitMutation,
  graphql,
} = require('react-relay');

const mutation = graphql`
  mutation MarkReadNotificationMutation(
    $input: MarkReadNotificationData!
  ) {
    markReadNotification(data: $input) {
      notification {
        seenState
      }
    }
  }
`;

const variables = {
  input: {
    source,
    storyID,
  },
};

function markNotificationAsRead(source, storyID) {
  commitMutation(
    environment,
    {
      mutation,
      variables,
      onCompleted: (response) => {
        console.log('Success!')
      },
      onError: err => console.error(err),
    },
  );
}
```

# 樂觀地更新客戶端

為了提升互動體驗，你可能會希望執行「樂觀更新」，這時客戶端會立即更新來反映預期新的值，甚至在伺服器的回應回來之前。我們透過提供一個 `optimisticResponse` 並把它加到我們傳進 `commitMutation` 的 `config` 中來達成它：

```javascript
const optimisticResponse = () => ({
  markReadNotification: {
    notification: {
      seenState: SEEN,
    },
  },
});

commitMutation(
  environment,
  {
    mutation,
    optimisticResponse,
    variables,
  },
);
```
