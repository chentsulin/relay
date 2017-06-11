---
id: api-reference-relay-graphql-mutation
title: Relay.GraphQLMutation
layout: docs
category: Relay Classic API
permalink: docs/api-reference-relay-graphql-mutation.html
next: api-reference-relay-proptypes
---

`Relay.GraphQLMutation` 是一個用來塑造 GraphQL mutation 的低階 API。

這是在 Relay 中，產品程式碼可以用來處理 mutation 的最低階抽象概念，它對應到描述在 [GraphQL Specification](../graphql/mutations.htm) 的 mutation 操作 (「一個寫入並伴隨著一個查詢」)。你需要指定 mutation、input 以及 query。

`Relay.GraphQLMutation` 沒有提供特殊的功能，例如 fat queries 或是 tracked queries (就是要被送到伺服器的 mutation query 的執行期自動合成)，而是讓使用者定義一個靜態且明確的 query。限制你自己使用這個低階 API 是個有用的前置步驟，將可以幫你的程式碼庫準備好遷移到新的靜態 Relay 核心。同時，如果你想要這些動態的功能，可以採用高階的 `Relay.Mutation` API。

## 概觀

*屬性*

<ul class="apiIndex">
  <li>
    <a href="#create-static-method">
      <pre>static create(mutation, variables, environment)</pre>
      建立一個 static mutation
    </a>
  </li>
  <li>
    <a href="#createwithfiles-static-method">
      <pre>static createWithFiles(mutation, variables, files, environment)</pre>
      建立一個接受「files」物件的 static mutation
    </a>
  </li>
</ul>

*方法*

<ul class="apiIndex">
  <li>
    <a href="#constructor">
      <pre>constructor(query, variables, files, environment, callbacks, collisionKey)</pre>
    </a>
  </li>
  <li>
    <a href="#applyoptimistic">
      <pre>applyOptimistic(optimisticQuery, optimisticResponse, configs)</pre>
    </a>
  </li>
  <li>
    <a href="#commit">
      <pre>commit(configs)</pre>
    </a>
  </li>
  <li>
    <a href="#rollback">
      <pre>rollback()</pre>
    </a>
  </li>
</ul>

## 屬性

### create (static 方法)

```
static create(
  mutation: RelayConcreteNode,
  variables: Object,
  environment: RelayEnvironmentInterface
): RelayGraphQLMutation;
```

包裝了 constructor 的便利方法，傳遞一些預設的參數並回傳一個實體。

#### 範例

```{16-20}
const environment = new Relay.Environment();
const query = Relay.QL`mutation FeedbackLikeMutation {
  feedbackLike(input: $input) {
    clientMutationId
    feedback {
      doesViewerLike
    }
  }
}`;
const variables = {
  input: {
    feedbackId: 'aFeedbackId',
  },
};

const mutation = Relay.GraphQLMutation.create(
  query,
  variables,
  environment
);
```

Note: In most cases, it is possible to rely on the default singleton instance of the environment, which is exposed as `Relay.Store`.

參閱：[GraphQLMutation > Constructor](#constructor)

### createWithFiles (static 方法)

包裝了 constructor 的便利方法，傳遞一些預設的參數並回傳一個實體。

```
static createWithFiles(
  mutation: RelayConcreteNode,
  variables: Variables,
  files: FileMap,
  environment: RelayEnvironmentInterface
): RelayGraphQLMutation;
```

#### 範例

```{7-11}
// 給定一個這樣的 `files` 物件：
//
//   type FileMap = {[key: string]: File};
//
// 還有在前面範例中的
// `query`, `variables` 以及 `environment` 參數：
const mutation = Relay.GraphQLMutation.createWithFiles(
  query,
  variables,
  files,
  environment
);
```

參閱：[GraphQLMutation > Constructor](#constructor)

## 方法

### constructor

```
constructor(
  query: RelayConcreteNode,
  variables: Variables,
  files: ?FileMap,
  environment: RelayEnvironmentInterface,
  callbacks: ?RelayMutationTransactionCommitCallbacks,
  collisionKey: ?string
);
```

這是用可選擇的 `files`、`callbacks` 和 `collisionKey` 參數來建立 `Relay.GraphQLMutation` 實體的一般 constructor。

呼叫者必須提供一個適當的 `query` 以及 `variables`。參照 GraphQL Relay Specification：

- mutation 應該接收命名叫做「input」的單一參數。
- 該 input 參數應該包含一個「clientMutationId」(字串) 屬性用於協調請求和回應的用途 (會自動被 `Relay.GraphQLMutation` API 添加)。
- query 應該請求「clientMutationId」當作一個選擇的屬性。

如果沒有提供，會產生一個唯一的 collision key (意味著建立的 mutation 會是獨立的而且不會與其他的碰撞)。

#### 範例

```
const collisionKey = 'feedback-like: ' + variables.input.feedbackId;
const mutation = new Relay.GraphQLMutation(
  query,
  variables,
  null, // 沒有檔案。
  environment,
  {
    onFailure: err => console.warn(err),
    onSuccess: () => console.log('Success!'),
  },
  collisionKey
);
```

參閱：[Relay.Mutation::getCollisionKey()](api-reference-relay-mutation.html#getcollisionkey)

### applyOptimistic

```
applyOptimistic(
  optimisticQuery: RelayConcreteNode,
  optimisticResponse: Object,
  configs: ?Array<RelayMutationConfig>
): RelayMutationTransaction;
```

呼叫這個來樂觀地套用一個更新到 store。

選擇性傳遞的 `config` 參數可以用來設定一個 `RANGE_ADD` 或其他類型的 mutation，可參照 `Relay.Mutation` API。這會告訴 Relay 要如何處理回應。

可選擇性地，在後面呼叫 `commit()` 來送 mutation 到伺服器。

**附註：**一個 optimistic 更新只可以套用一次。

#### 範例

```{18-21}
const optimisticQuery = Relay.QL`mutation FeedbackLikeOptimisticUpdate {
  feedbackLike(input: $input) {
    clientMutationId
    feedback {
      doesViewerLike
      id
    }
  }
}`;
const optimisticResponse = {
  feedback: {
    doesViewerLike: true,
    id: 'aFeedbackId',
    __typename: 'Feedback',
  },
};

const transaction = mutation.applyOptimistic(
  optimisticQuery,
  optimisticResponse,
);
```

參閱：[Relay.Mutation::getConfigs()](api-reference-relay-mutation.html#getconfigs-abstract-method)

### commit

```
commit(configs: ?Array<RelayMutationConfig>): RelayMutationTransaction;
```

呼叫這個來送 mutation 到伺服器。

選擇性傳遞的 `config` 參數可以用來設定一個 `RANGE_ADD` 或其他類型的 mutation，類似於 `Relay.Mutation` API。

可選擇性地，在前面呼叫 `applyOptimistic()` 來樂觀地套用更新到 store。

附註：這個方法每個實體只可以呼叫一次。

#### 範例

```{11}
const configs = [{
  type: 'RANGE_ADD',
  connectionName: 'topLevelComments',
  edgeName: 'feedbackCommentEdge',
  parentID: 'aFeedbackId',
  parentName: 'feedback',
  rangeBehaviors: {
    '': GraphQLMutatorConstants.PREPEND,
  },
}];
const transaction = mutation.commit(configs);
```

參閱：[Relay.Mutation::getConfigs()](api-reference-relay-mutation.html#getconfigs-abstract-method)

### rollback

```
rollback(): void;
```

復原一個 optimistic mutation。

## 參閱

可以[在測試組中](https://github.com/facebook/relay/blob/master/packages/react-relay/classic/mutation/__tests__/RelayGraphQLMutation-test.js)找到更多詳細的用法範例。
