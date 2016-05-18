---
id: api-reference-relay-container
title: RelayContainer
layout: docs
category: API Reference
permalink: docs/api-reference-relay-container.html
next: api-reference-relay-route
---

`RelayContainer` 是一個 higher-order React component，讓一個 React component 編碼它的資料要求。

- Relay 確保 component 在被 render 之前，資料是可取得的。
- 每當底層資料改變時，Relay 會更新 component。

Relay containers 是使用 `Relay.createContainer` 來建立的。

## 概觀

*Container 規格*

<ul class="apiIndex">
  <li>
    <a href="#fragments">
      <pre>fragments</pre>
      宣告 component 的資料要求使用 fragments。
    </a>
  </li>
  <li>
    <a href="#initialvariables">
      <pre>initialVariables</pre>
      初始設定的變數可用在這個 component 的 fragments。
    </a>
  </li>
  <li>
    <a href="#preparevariables">
      <pre>prepareVariables</pre>
      一個基於執行環境或先前變數可以修改變數的方法。
    </a>
  </li>
  <li>
    <a href="#shouldcomponentupdate">
      <pre>shouldComponentUpdate</pre>
      Optionally override RelayContainer's default implementation of `shouldComponentUpdate`.
    </a>
  </li>
</ul>

*屬性和方法*

在純 React component 中，方法和屬性都是 container 將提供做為 `this.props.relay`。

<ul class="apiIndex">
  <li>
    <a href="#route">
      <pre>route</pre>
    </a>
  </li>
  <li>
    <a href="#variables">
      <pre>variables</pre>
    </a>
  </li>
  <li>
    <a href="#setvariables">
      <pre>setVariables([partialVariables, [onReadyStateChange]])</pre>
    </a>
  </li>
  <li>
    <a href="#forcefetch">
      <pre>forceFetch([partialVariables, [onReadyStateChange]]) </pre>
    </a>
  </li>
  <li>
    <a href="#hasoptimisticupdate">
      <pre>hasOptimisticUpdate(record)</pre>
    </a>
  </li>
  <li>
    <a href="#getpendingtransactions">
      <pre>getPendingTransactions(record) </pre>
    </a>
  </li>
</ul>

## Container 規格

### fragments

```
fragments: RelayQueryFragments<Tk> = {
  [propName: string]: (
    variables: {[name: string]: mixed}
  ) => Relay.QL`fragment on ...`
};
```

Container 要求宣告資料的 `fragments` 使用 GraphQL fragments。

當 component 被 render 時，只有透過這些 fragments 指定的欄位，會被填入 `this.props`。這可以確保一個 component 從在它的父 component 或其他任何的子 component 沒有隱式的依賴項目。

#### 範例

```{8-14}
class StarWarsShip extends React.Component {
  render() {
    return <div>{this.props.ship.name}</div>;
  }
}

module.exports = Relay.createContainer(StarWarsShip, {
  fragments: {
    ship: () => Relay.QL`
      fragment on Ship {
        name
      }
    `,
  },
});

```
在這個範例中，這個欄位與 `ship` fragment 關聯，可以在 `this.props.ship` 上使用。

也可以參考：[Containers > Relay Containers](guides-containers.html#relay-containers)

### initialVariables

```
initialVariables: {[name: string]: mixed};
```

設定變數初始值可以提供給 component 的 fragemnts 使用。

#### 範例

```{4}
class ProfilePicture extends React.Component {...}

module.exports = Relay.createContainer(ProfilePicture, {
  initialVariables: {size: 50},
  fragments: {
    user: () => Relay.QL`
      # 上面定義的變數在這裡可以作為 `$size`。
      # 在這裡參考的任何變數都需要被定義在 initalVariables 上。
      # 一個 `undefined` 變數會拋出一個 `Invariant Violation` 的例外。
      # 使用 `null` 來初始會未知的值。
      fragment on User { profilePicture(size: $size) { ... } }
    `,
  },
});
```

在這個範例中，會在初始 render 時，fetch `profilePicture(size: 50)`。

### prepareVariables

```
prepareVariables: ?(
  prevVariables: {[name: string]: mixed}
) => {[name: string]: mixed}
```

Container 可以定義一個 `prepareVariables` 方法，提供機會來修改可用的 fragments 變數。基於先前的變數（或如果先前不存在的 `initalVariables`），除了在 runtime 環境外，可以產生新的變數。

這個方法從 `setVariables` 被應用時，也可以在設定局部變數後被呼叫。回傳的變數會被填入到 fragments。

#### 範例

```{3-9}
module.exports = Relay.createContainer(ProfilePicture, {
  initialVariables: {size: 50},
  prepareVariables: prevVariables => {
    return {
      ...prevVariables,
      // 如果 devicePixelRatio 是 `2`，新的 size 會為 `100`。
      size: prevVariables.size * window.devicePixelRatio,
    };
  },
  // ...
});
```

### shouldComponentUpdate

```
shouldComponentUpdate: () => boolean;
```

RelayContainer implements a conservative default `shouldComponentUpdate` that returns `false` if no fragment props have changed and all other props are equal scalar values. This may block updates to components that receive data via context. To ensure an update in this case override the default behavior by specifying a `shouldComponentUpdate` function.

#### Example

```{2}
module.exports = Relay.createContainer(ProfilePicture, {
  shouldComponentUpdate: () => true,
  // ...
});
```

## 屬性和方法
屬性和方法從被 wrap 的 React component 列出以下可以被存取的 `this.props.relay`。

### route

```
route: RelayRoute
```

當一個 component 在被 render 時，Route 提供的 context 是非常有用的。它包含 route 目前有關 `name`、`params`、和 `queries` 的資訊。

#### 範例

```
var name = this.props.relay.route.name;
if (name === 'SuperAwesomeRoute') {
  // 做了一些很酷的東西。
}
```

參考：[Routes](guides-routes.html)

### variables

```
variables: {[name: string]: mixed}
```

`variables` 包含了設定的變數，被用來 fetch 目前設定的 props。

#### 範例

```{8}
class ProfilePicture extends React.Component {
  render() {
    var user = this.props.user;
    return (
      <View>
        <Image
          uri={user.profilePicture.uri}
          width={this.props.relay.variables.size}
        />
      </View>
    );
  }
}
module.exports = Relay.createContainer(ProfilePicture, {
  initialVariables: {size: 50},
  fragments: {
    user: () => Relay.QL`
      fragment on User { profilePicture(size: $size) { ... } }
    `,
  },
});
```
在這個範例中，被 render 的圖片 `width` 會對應到目前 `profilePicture.uri` 版本所 fetch 到的 `$size` 變數。

> 注意
>
> 永遠不要直接 mutate `this.props.relay.variables`，它不會觸發資料被正確的 fetch。處理 `this.props.relay.variables` 就好像是 props，是 immutable 的。

### setVariables

```
setVariables([partialVariables: Object, [onReadyStateChange: Function]]): void
```

Component 可以透過使用 `setVariables`，要求更新目前的設定的 `variables` 來改變資料。

`this.props.relay.setVariables` 可以在同一個時間被呼叫更新一個子集或是所有變數。在回傳結果中，Relay 會使用新的變數來嘗試滿足新的 fragment。如果資料在客戶端已經不能使用的話，這可能涉及傳送一個請求到伺服器。

可以提供一個可選的 `onReadyStateChange` callback 來回應事件參與資料的實現。

#### 範例

```{12-15}
class Feed extends React.Component {
  render() {
    return (
      <div>
        {this.props.viewer.feed.edges.map(
          edge => <Story story={edge.node} key={edge.node.id} />
        )}
      </div>
    );
  }
  _handleScrollLoad() {
    // story 透過增加 10 的方式被 render。
    this.props.relay.setVariables({
      count: this.props.relay.variables.count + 10
    });
  }
}
module.exports = Relay.createContainer(Feed, {
  initialVariables: {count: 10},
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        feed(first: $count) {
          edges {
            node {
              id,
              ${Story.getFragment('story')},
            },
          },
        },
      }
    `,
  },
});
```

> 注意
>
> `setVariables` 不會立即 mutate `variables`，但是會建立一個 pending 的 state 過渡時期。`variables` 會持續回傳先前的變數，直到滿足新的變數值的資料填入了 `this.props`。

參考：[Containers > 請求不同的資料](guides-containers.html#requesting-different-data)、[Ready State](guides-ready-state.html)。

### forceFetch

```
forceFetch([partialVariables: Object, [onReadyStateChange: Function]]): void
```

`forceFetch` 是類似於 `setVariables`，因為它也可以透過改變 `variables` 使用在要求更改資料。

這兩種方法不同的地方是，`foreFetch` 傳送一個請求來重新 fetch 每個 fragment，而不是從客戶端傳送一個 query 只有包含缺少的欄位。這可以確保 component props 是剛從伺服器 fetch 回來的。

可以提供一個可選的 `onReadyStateChange` callback 來回應事件的涉及和資料實現。

> 注意
>
> `forceFetch` 可以被一個空的部分變數設定呼叫，意思是它可以觸發 refresh 目前被 render 設定的資料的。

參考：[Ready State](guides-ready-state.html)

### hasOptimisticUpdate

```
hasOptimisticUpdate(record: Object): boolean
```

透過一個 optimistic mutation，呼叫 `hasOptimisticUpdate` 和一個從 `this.props` 回傳的 record，不論是否受到影響。它允許 component render local optimistic 的變化，以不同的方式從已成功與伺服器同步的資料。

#### 範例

```
class Feed extends React.Component {
  render() {
    var edges = this.props.viewer.feed.edges;
    return (
      <div>
        {edges.map(edge => {
          var node = edge.node;
          if (this.props.relay.hasOptimisticUpdate(node)) {
            // 在伺服器使用一個不同的 component
            // 來 render 還沒被 store 的 pending story。
            return (
              <PendingStory
                key={edge.node.id}
                story={edge.node}
              />
            );
          } else {
            return (
              <Story
                key={edge.node.id}
                story={edge.node}
              />
            );
          }
        })}
      </div>
    );
  }
}

module.exports = Relay.createContainer(Feed, {
  initialVariables: {count: 10},
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        feed(first: $count) {
          edges {
            node {
              id,
              ${Story.getFragment('story')},
              ${PendingStory.getFragment('story')}
            }
          }
        }
      }
    `,
  },
});

```

參考：[Mutations > Optimistic 更新](guides-mutations.html#optimistic-updates)

### getPendingTransactions

```
getPendingTransactions(record: Object): ?Array<RelayMutationTransaction>
```

Component 可以在任何的 record 檢查 pending mutations（例如：資料在 props 可用於一個相對應的 fragment）。呼叫 `getPendingTransactions` 和 record 將會回傳一個影響特定 record 的 pending mutation transaction 列表。

每個 `RelayMutationTransaction` 有方法來檢查 mutation 的狀態和提供 rollback 的方式或根據需求重新傳送 mutation。

#### 範例

```
class Story extends React.Component {
  render() {
    var story = this.props.story;
    var transactions = this.props.relay.getPendingTransactions(story);
    // 在這個範例，假設只有一個 transaction。
    var transaction = transactions ? transactions[0] : null;
    if (transaction) {
      // 如果 mutation 失敗，顯示一個錯誤訊息和重試的連結。
      if (transaction.getStatus() === 'COMMIT_FAILED') {
        return (
          <span>
            This story failed to post.
            <a onClick={transaction.recommit}>Try Again.</a>
          </span>
        );
      }
    }
    // 一般的 render story。
  }
}

module.exports = Relay.createContainer(ProfilePicture, {
  fragments: {
    story: () => Relay.QL`
      fragment on story {
        # ...
      }
    `,
  },
});
```

`RelayMutationTransaction.getStatus` 可以回傳以下其中一個 string：

- `UNCOMMITTED` — Transaction 還沒被傳送到伺服器。Transaction 可以被 commit 或 rollback。
- `COMMIT_QUEUED` —  Transaction 已經被 commit，但是其他具有相同衝突的 key transaction 正處於 pending，所以 transaction 已經被隊列並傳送到伺服器。
- `COLLISION_COMMIT_FAILED` — Transaction 已經隊列等待 commit，但是其他相同衝突 key 的 transaction 失敗。所有在衝突隊列的 transaction，包含本身和已經失敗的。Transaction 可以重新被 commit 或 rollback。
- `COMMITTING` — Transaction 等待伺服器的回應。
- `COMMIT_FAILED` — Transaction 送到伺服器的 commit，但是失敗了。
