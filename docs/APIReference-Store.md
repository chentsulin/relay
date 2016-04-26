---
id: api-reference-relay-store
title: Relay.Store
layout: docs
category: API Reference
permalink: docs/api-reference-relay-store.html
next: interfaces-relay-network-layer
---

Relay 的 `Store` 提供一個 API 來把 mutation 發送到伺服器。

## 概觀

*方法*

<ul class="apiIndex">
  <li>
    <a href="#commitupdate-static-method">
      <pre>static commitUpdate(mutation, callbacks)</pre>
      開始處理一個 mutation。
    </a>
  </li>
  <li>
    <a href="#applyupdate-static-method">
      <pre>static applyUpdate(mutation, callbacks)</pre>
      添加一個 MutationTransaction 到佇列而不 commit 它。
    </a>
  </li>
</ul>

## 方法

### commitUpdate (static 方法)

```
static commitUpdate(mutation: RelayMutation, callbacks: {
  onFailure?: (transaction: RelayMutationTransaction) => void;
  onSuccess?: (response: Object) => void;
}): RelayMutationTransaction

// 傳給 `onFailure` callback 的參數
type Transaction = {
  getError(): ?Error;
}
```

`commitUpdate` 方法類似於在 Flux 中 dispatch 一個 action。Relay
會如下處理 mutation：

- 如果這個 mutation 定義一個 optimistic payload - 一組要在等待伺服器回應時在本地套用的資料 - Relay 套用這個變更並更新所有受影響的 React component (要注意 optimistic update 不會覆寫掉在快取中的已知伺服器資料)。
- 如果這個 mutation 不會與其他未完成的 mutation 'collide' (重疊)
- 藉由它的 `getCollisionKey` 實作來指定 - 這會被送到伺服器。 如果它會衝突，它會排隊直到衝突的 mutation 完成。
- 當收到伺服器回應時，其中一個 callback 會被呼叫：
  - 如果這個 mutation 成功了會呼叫 `onSuccess`。
  - 如果這個 mutation 失敗了會呼叫 `onFailure`。


#### 範例

```
var onSuccess = () => {
  console.log('Mutation successful!');
};
var onFailure = (transaction) => {
  var error = transaction.getError() || new Error('Mutation failed.');
  console.error(error);
};
var mutation = new MyMutation({...});

Relay.Store.commitUpdate(mutation, {onFailure, onSuccess});
```

### applyUpdate (static 方法)

```
static applyUpdate(mutation: RelayMutation, callbacks: {
  onFailure?: (transaction: RelayMutationTransaction) => void;
  onSuccess?: (response: Object) => void;
}): RelayMutationTransaction
```

`applyUpdate` 就像 `update` 一樣添加一個 mutation，不過並不 commit 它。它回傳一個可以被 commit 或是 rollback 的 `RelayMutationTransaction`。

當這個 transaction 被 commit 並從伺服器收到回應時，其中一個 callback 會被呼叫：
  - 如果這個 mutation 成功了會呼叫 `onSuccess`。
  - 如果這個 mutation 失敗了會呼叫 `onFailure`。


#### 範例

```
var onSuccess = () => {
  console.log('Mutation successful!');
};
var onFailure = (transaction) => {
  var error = transaction.getError() || new Error('Mutation failed.');
  console.error(error);
};
var mutation = new MyMutation({...});

var transaction = Relay.Store.applyUpdate(mutation, {onFailure, onSuccess});

transaction.commit();
```
