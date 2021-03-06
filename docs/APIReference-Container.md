---
id: api-reference-relay-container
title: RelayContainer
layout: docs
category: Relay Classic API
permalink: docs/api-reference-relay-container.html
next: api-reference-relay-route
---

`RelayContainer` 是一個 higher-order React component，讓一個 React component 編碼它的資料需求。

- Relay 確保 component 在被 render 之前，資料是可以取用的。
- 每當底層資料改變時，Relay 會更新 component。

Relay container 是使用 `Relay.createContainer` 來建立的。

## 概觀

*Container 規格*

<ul class="apiIndex">
  <li>
    <a href="#fragments">
      <pre>fragments</pre>
      使用 fragments 來宣告 component 的資料需求。
    </a>
  </li>
  <li>
    <a href="#initialvariables">
      <pre>initialVariables</pre>
      這個 component 的 fragments 可以使用的一組初始變數值。
    </a>
  </li>
  <li>
    <a href="#preparevariables">
      <pre>prepareVariables</pre>
      一個可以基於執行環境或先前變數的值來調整變數的方法。
    </a>
  </li>
  <li>
    <a href="#shouldcomponentupdate">
      <pre>shouldComponentUpdate</pre>
      可選擇性地覆寫掉 RelayContainer 的預設 `shouldComponentUpdate` 實作。
    </a>
  </li>
</ul>

*屬性和方法*

在一般的 React component 中，container 將會提供一些方法和屬性做為 `this.props.relay`。

<ul class="apiIndex">
  <li>
    <a href="#route">
      <pre>route</pre>
    </a>
  </li>
  <li>
    <a href="#pendingvariables">
      <pre>pendingVariables </pre>
    </a>
  </li>
  <li>
    <a href="#variables">
      <pre>variables</pre>
    </a>
  </li>
  <li>
    <a href="#setvariables">
      <pre>setVariables([partialVariables[, onReadyStateChange]])</pre>
    </a>
  </li>
  <li>
    <a href="#forcefetch">
      <pre>forceFetch([partialVariables[, onReadyStateChange]]) </pre>
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

*Static 方法*

<ul class="apiIndex">
  <li>
    <a href="#getfragment">
      <pre>getFragment(name[, vars])</pre>
      在 parent fragment 中取得一個包含 container fragment 的 reference。
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

Container 使用 GraphQL fragments 來在 `fragments` 宣告資料的需求。

當 component 被 render 時，只有透過這些 fragments 指定的欄位，會被填入 `this.props`。這可以確保一個 component 從在它的父 component 或其他任何的子 component 沒有隱式的依賴關係。

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
在這個範例中，這個與 `ship` fragment 關聯的欄位，可以在 `this.props.ship` 上使用。

也可以參閱：[Containers > Relay Containers](guides-containers.html#relay-containers)

### initialVariables

```
initialVariables: {[name: string]: mixed};
```

這個 component 的 fragments 可以使用的一組初始變數值。

#### 範例

```{4}
class ProfilePicture extends React.Component {...}

module.exports = Relay.createContainer(ProfilePicture, {
  initialVariables: {size: 50},
  fragments: {
    user: () => Relay.QL`
      # 在這裡可以用 '$size' 取用上面定義的變數。
      # 在這裡參考的任何變數都需要被定義在上面的 initalVariables。
      # 一個 'undefined' 的變數值會拋出一個 'Invariant Violation' 的例外。
      # 使用 'null' 來初始化未知的值。
      fragment on User { profilePicture(size: $size) { ... } }
    `,
  },
});
```

在這個範例中，會在初始 render 時，抓取 `profilePicture(size: 50)`。

### prepareVariables

```
prepareVariables: ?(
  prevVariables: {[name: string]: mixed}
) => {[name: string]: mixed}
```

Container 可以定義一個 `prepareVariables` 方法，提供機會來調整 fragments 可以取用的變數。基於先前的變數（或如果先前的變數不存在的話， `initalVariables`）以及 runtime 環境，來產生新的變數。

這個方法也會在從 `setVariables` 來的一組變數被套用後被呼叫。回傳的變數會被填入到 fragments。

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

RelayContainer 實做了一個傳統的預設 `shouldComponentUpdate`，在 fragment props 沒有改變而且所有其他的 props 都是相等的值時會回傳 `false`。這可能會阻擋藉由 context 接收資料的  component 的更新。為了確保在這個狀況能進行更新，可以透過指定一個 `shouldComponentUpdate` function 覆寫預設的行為。

#### 範例

```{2}
module.exports = Relay.createContainer(ProfilePicture, {
  shouldComponentUpdate: () => true,
  // ...
});
```

## 屬性和方法
從被包覆的 React component 可以在 `this.props.relay` 存取列在下方的屬性和方法。

### route

```
route: RelayRoute
```

當一個 component 在被 render 時，Route 提供的 context 是非常有用的。它包含當下的 route 有關 `name`、`params`、和 `queries` 的資訊。

#### 範例

```
var name = this.props.relay.route.name;
if (name === 'SuperAwesomeRoute') {
  // 做了一些很酷的東西。
}
```

也可以參閱：[Routes](guides-routes.html)

### variables

```
variables: {[name: string]: mixed}
```

`variables` 包含了一組變數，被用來抓取當下的一組 props。

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
在這個範例中，被 render 的圖片 `width` 會對應到被用來抓取目前 `profilePicture.uri` 版本所使用的 `$size` 變數。

> 附註
>
> 永遠不要直接改動 `this.props.relay.variables`，它不會正確的觸發抓取資料。把 `this.props.relay.variables` 當作是 immutable 的來處理，就像 props 一樣。

### pendingVariables

```
pendingVariables: ?{[name: string]: mixed}
```

`pendingVariables` contains the set of variables that are being used to fetch the new props, i.e. when `this.props.relay.setVariables()` or `this.props.relay.forceFetch()` are called and the corresponding request is in flight.

If no request is in flight pendingVariables is `null`.

#### Example

```{12}
class ProfilePicture extends React.Component {
  requestRandomPictureSize = () => {
    const randIntMin = 10;
    const randIntMax = 200;
    const size = (Math.floor(Math.random() * (randIntMax - randIntMin + 1)) + randIntMin);
    this.props.relay.setVariables({size});
  }

  render() {
    const {relay, user} = this.props;
    const {pendingVariables} = relay;
    if (pendingVariables && 'size' in pendingVariables) {
      // Profile picture with new size is loading
      return (
        <View>
          <LoadingSpinner />
        </View>
      )
    }

    return (
      <View>
        <Image
          uri={user.profilePicture.uri}
          width={relay.variables.size}
        />
        <button onclick={this.requestRandomPictureSize}>
          Request random picture size
        </button>
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

In this example, whenever a picture with a new size is being loaded a spinner is displayed instead of the picture.


### setVariables

```
setVariables([partialVariables: Object, [onReadyStateChange: Function]]): void
```

Component 可以透過使用 `setVariables` 要求更新目前的 `variables` 組合，來改變它們的資料需求。

可以在同時呼叫 `this.props.relay.setVariables` 更新所有變數或是它的一個子集合。這個的結果，Relay 會使用新的變數來嘗試滿足新的 fragment。如果資料在客戶端還不能使用的話，這可能涉及傳送一個請求到伺服器。

可以選擇性的提供一個 `onReadyStateChange` callback 來回應關注資料滿足的事件。

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
    // 把被 render 的 story 數量增加 10 個。
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

> 附註
>
> `setVariables` 不會立即變動 `variables`，但是會建立一個等待的 state transition。`variables` 會持續回傳先前的值，直到滿足新的變數值的資料填入了 `this.props`。

也可以參閱：[Containers > 請求不同的資料](guides-containers.html#requesting-different-data)、[Ready State](guides-ready-state.html)。

### forceFetch

```
forceFetch([partialVariables: Object, [onReadyStateChange: Function]]): void
```

`forceFetch` 類似於 `setVariables`，因為它也可以用來透過修改 `variables` 來改變資料需求。

這兩種方法不同的地方在，`forceFetch` 傳送一個請求來重新抓取每個 fragment，而不是傳送一個只包含客戶端缺少欄位的 query。這可以確保 component props 是剛從伺服器抓取回來的。

可以提供一個選擇性的 `onReadyStateChange` callback 來回應涉及資料滿足的事件。

> 注意
>
> 可以用一組空的變數呼叫 `forceFetch`，這意味它可以觸發刷新當下被 render 的資料集。

也可以參閱：[Ready State](guides-ready-state.html)

### hasOptimisticUpdate

```
hasOptimisticUpdate(record: Object): boolean
```

用一個從 `this.props` 來的 record 呼叫 `hasOptimisticUpdate`，會回傳是否這個給定的 record 有受到 optimistic mutation 的影響。這讓 component 可以用不同的方式去 render 本地 optimistic 變更和成功與伺服器同步的資料。

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
            // 使用一個不同的 component 來 render
            // 還沒被存到伺服器等待中的 story。
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

也可以參閱：[Mutations > Optimistic 更新](guides-mutations.html#optimistic-updates)

### getPendingTransactions

```
getPendingTransactions(record: Object): ?Array<RelayMutationTransaction>
```

Component 可以對任何的 record（例如：在 props 上可以取用的資料與一個對應的 fragment）檢查是否有等待中的 mutation。用 record 去呼叫 `getPendingTransactions` 將會回傳一個影響特定 record 的等待中 mutation transaction 列表。

每個 `RelayMutationTransaction` 有方法來檢查 mutation 的狀態並提供 rollback 的方式或根據需求重新傳送 mutation。

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
    // 一般地 render story。
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

`RelayMutationTransaction.getStatus` 可以回傳以下其中一個字串：

- `UNCOMMITTED` — Transaction 還沒被傳送到伺服器。Transaction 可以被 commit 或 rollback。
- `COMMIT_QUEUED` —  Transaction 已經被 commit，但是另一個具有相同衝突的 key 的 transaction 還在等待中，所以 transaction 已經被放入隊列等待傳送到伺服器。
- `COLLISION_COMMIT_FAILED` — Transaction 已經放入隊列等待 commit，但是另一個具有相同衝突 key 的 transaction 失敗了。所有在衝突的隊列中的 transaction，包含這個，都變成失敗。Transaction 可以重新被 commit 或 rollback。
- `COMMITTING` — Transaction 正在等待伺服器的回應。
- `COMMIT_FAILED` — Transaction 為了 commit 已經被送到伺服器，但是失敗了。

## Static 方法

### getFragment

```
getFragment(
  fragmentName: string,
  variables?: {[name: string]: mixed}
): RelayFragmentReference
```

在 parent fragment 中取得一個包含 child container 的 fragment 的 reference。

#### 範例

Fragment 合成可以透過 ES6 template string interpolation 以及 `getFragment` 來達成：

```{6}
// Parent.js
Relay.createContainer(Parent, {
  fragments: {
    parentFragment: () => Relay.QL`
      fragment on Foo {
        id
        ${Child.getFragment('childFragment')}
      }
    `,
  }
});
// Child.js
Relay.createContainer(Child, {
  initialVariables: {
    size: 64,
  },
  fragments: {
    childFragment: () => Relay.QL`
      fragment on Foo {
        photo(size: $size) { uri }
      }
    `,
  }
});
```

在這個範例中，無論 `Parent` 何時被抓取，`Child` 的 fragment 也會被抓取。在 render 時，`<Parent>` 將會只能存取 `props.foo.id` 欄位；從 child fragment 來的資料將會被[*遮罩*](http://facebook.github.io/relay/docs/thinking-in-relay.html#data-masking)。預設情況下，`childFragment` 會使用它對應的初始變數。Relay 將會抓取 `photo(size: 64)`。當 `<Child>` 被 render 後，它也會讓初始變數能以 `props.relay.variables = {size: 64}` 的方式取用。

#### 覆寫 Fragment 變數

有時 parent 需要去覆寫 child component 的預設變數。試想，如果我們想要用 128 的 photo size 來取代預設的 64 去 render 上面的 `Child`。要做到這個，我們必須確保 fragment *和* container 都知道這個自訂的變數。要在 *query* 中設定自訂的變數，使用 `getFragment` 的第二個參數：

```{6}
// Parent.js
Relay.createContainer(Parent, {
  fragments: {
    parentFragment: () => Relay.QL`
      fragment on Foo {
        id
        ${Child.getFragment('childFragment', {size: 128})}
      }
    `,
  }
});
```

現在 Relay 會用 size 128 去抓取 photo - 不過 `Child` container 不會自動地知道這個變數。我們必須透過傳遞這個變數值作為 prop 來告訴它：

```{4}
const Parent = (props) => {
  return (
    <Child
      childFragment={props.parentFragment}
      size={128}
    />;
  );
}
```

現在 Relay 會抓取大一點的 photo size *而且* `Child` 會知道要 render 它。
