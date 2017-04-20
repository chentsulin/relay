---
id: api-reference-relay-mutation
title: Relay.Mutation
layout: docs
category: Relay Classic API
permalink: docs/api-reference-relay-mutation.html
next: api-reference-relay-graphql-mutation
---

Relay 利用 GraphQL 的 mutations；它是讓我們去 mutate 在客戶端與伺服器上的資料的操作。要建立一個 mutation 在我們的應用程式中使用，我們必須繼承 `Relay.Mutation` 並至少實作列在下方的四個 abstract 方法。

## 概觀

*屬性*

<ul class="apiIndex">
  <li>
    <a href="#fragments-static-property">
      <pre>static fragments</pre>
      在這裡宣告這個 mutation 的資料依賴關係
    </a>
  </li>
  <li>
    <a href="#initialvariables-static-property">
      <pre>static initialVariables</pre>
      讓一組預設的變數在這個 mutation 的 fragment builder 可以取用
    </a>
  </li>
  <li>
    <a href="#preparevariables-static-property">
      <pre>static prepareVariables</pre>
      一個基於執行期環境、先前的變數、或是 meta route 來調整變數的方法
    </a>
  </li>
</ul>

*方法*

<ul class="apiIndex">
  <li>
    <a href="#constructor">
      <pre>constructor(props)</pre>
    </a>
  </li>
  <li>
    <a href="#getconfigs-abstract-method">
      <pre>abstract getConfigs()</pre>
    </a>
  </li>
  <li>
    <a href="#getfatquery-abstract-method">
      <pre>abstract getFatQuery()</pre>
    </a>
  </li>
  <li>
    <a href="#getmutation-abstract-method">
      <pre>abstract getMutation()</pre>
    </a>
  </li>
  <li>
    <a href="#getvariables-abstract-method">
      <pre>abstract getVariables()</pre>
    </a>
  </li>
  <li>
    <a href="#getfragment-static-method">
      <pre>static getFragment(fragmentName[, variableMapping])</pre>
    </a>
  </li>
  <li>
    <a href="#getcollisionkey">
      <pre>getCollisionKey()</pre>
    </a>
  </li>
  <li>
    <a href="#getfiles">
      <pre>getFiles()</pre>
    </a>
  </li>
  <li>
    <a href="#getoptimisticconfigs">
      <pre>getOptimisticConfigs()</pre>
    </a>
  </li>
  <li>
    <a href="#getoptimisticresponse">
      <pre>getOptimisticResponse()</pre>
    </a>
  </li>
</ul>

## 屬性

### fragments (static 屬性)

```
static fragments: RelayMutationFragments<$Keys<Tp>>

// RelayMutationFragments 的 type
type RelayMutationFragments<Tk> = {
  [key: Tk]: FragmentBuilder;
};

// FragmentBuilder 的 type
type FragmentBuilder = (variables: Variables) => RelayConcreteNode;
```

我們在這裡宣告 mutations 的資料依賴關係，就像我們對 container 做的一樣。這對用來確保我們可能會想要在這個 mutation 的 optimistic 回應中使用的一組欄位已經被抓取特別有用。

#### 範例

```{2-9}
class LikeStoryMutation extends Relay.Mutation {
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        likers { count },
        viewerDoesLike,
      }
    `,
  };
  getOptimisticResponse() {
    // 可以保證 this.props.story.likers.count 和
    // this.props.story.viewerDoesLike 已經被抓取，因為我們已經在上面宣告
    // 它們為這個 mutation 的資料依賴關係的一部份。
    return { /* ... */ };
  }
}
```

也可以參閱：
[Mutations > Fragment 變數](guides-mutations.html#fragment-variables) 和
[Mutations > Optimistic 更新](guides-mutations.html#optimistic-updates)

### initialVariables (static 屬性)

```
static initialVariables: {[name: string]: mixed};
```

我們在這裡指定的預設值將可以在我們 fragment builder 取用：

#### 範例

```
class ChangeTodoStatusMutation extends Relay.Mutation {
  static initialVariables = {orderby: 'priority'};
  static fragments = {
    todos: () => Relay.QL`
      # 上面定義的變數在這裡可以作為 $orderby 取用
      fragment on User { todos(orderby: $orderby) { ... } }
    `,
  };
  /* ... */
}
```

也可以參閱：
[Mutations > Fragment 變數](guides-mutations.html#fragment-variables)

### prepareVariables (static 屬性)

```
static prepareVariables: ?(
  prevVariables: {[name: string]: mixed},
  route: RelayMetaRoute,
) => {[name: string]: mixed}

// `route` 參數的 type
type RelayMetaRoute = {
  name: string;
}
```

如果我們提供給 mutation 一個方法符合上面所描述的 signature，它會有一個機會基於先前的變數 (或是如果前面沒有的話會是 `initialVariables`)、meta route、和執行期環境，去調整 fragment builder 的變數。無論這個方法回傳什麼變數都會可以在這個 mutation 的 fragment builder 取用。

#### 範例

```
class BuySongMutation extends Relay.Mutation {
  static initialVariables = {format: 'mp3'};
  static prepareVariables = (prevVariables) => {
    var overrideVariables = {};
    var formatPreference = localStorage.getItem('formatPreference');
    if (formatPreference) {
      overrideVariables.format = formatPreference;  // Lossless, hopefully
    }
    return {...prevVariables, overrideVariables};
  };
  /* ... */
}
```

也可以參閱：
[Mutations > Fragment 變數](guides-mutations.html#fragment-variables)

## 方法

### constructor

透過 `new` 關鍵字建立一個 mutation 實體，選擇性地傳遞給它一些 props。要注意的是，`this.props` 在 constructor function 裡面是*不*可取用的，不過在所有下面提到的方法 (`getCollisionKey`、`getOptimisticResponse`，等等) 都是設置好的。這個限制是因爲實際上 mutation props 可能依賴從 RelayEnvironment 來的資料，而它直到這個 mutation 被用 `applyUpdate` 或是 `commitUpdate` 套用都無法知道。

#### 範例

```
var bookFlightMutation = new BuyPlaneTicketMutation({airport: 'yvr'});
Relay.Store.commitUpdate(bookFlightMutation);
```

### getConfigs (abstract 方法)

```
abstract getConfigs(): Array<{[key: string]: mixed}>
```

實作這個必要的方法來提供有關如何從每個 mutation 去使用回應 payload 來更新客戶端的 store 的指示給 Relay。

#### 範例

```
class LikeStoryMutation extends Relay.Mutation {
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        story: this.props.story.id,
      },
    }];
  }
}
```

也可以參閱：[Mutations > Mutator 設定](guides-mutations.html#mutator-configuration)

### getFatQuery (abstract 方法)

```
abstract getFatQuery(): GraphQL.Fragment
```

實作這個必要的方法來設計一個 ‘fat query’ – 一個代表在你的資料模型中每個可能會因為這個 mutation 的結果而改變的那些欄位。

#### 範例

```
class BuySongMutation extends Relay.Mutation {
  getFatQuery() {
    return Relay.QL`
      fragment on BuySongPayload {
        songs {
          count,
          edges,
        },
        totalRunTime,
      }
    `,
  }
}
```

也可以參閱：
[Mutations > fat query](guides-mutations.html#the-fat-query)

### getMutation (abstract 方法)

```
abstract getMutation(): GraphQL.Mutation
```

實作這個必要的方法來回傳一個 GraphQL mutation 操作來代表要被執行的 mutation。

#### 範例

```
class LikeStoryMutation extends Relay.Mutation {
  getMutation() {
    return this.props.story.viewerDoesLike
      ? return Relay.QL`mutation {unlikeStory}`
      : return Relay.QL`mutation {likeStory}`;
  }
}
```

### getVariables (abstract 方法)

```
abstract getVariables(): {[name: string]: mixed}
```

實作這個必要的方法來準備要用作為 mutation 的 input 的變數。

#### 範例

```
class DestroyShipMutation extends Relay.Mutation {
  getVariables() {
    return {
      // 假設伺服器有一個 `destroyShip` mutation，
      // 它接收一個 `shipIDToDestroy` 變數作為 input：
      shipIDToDestroy: this.props.ship.id,
    };
  }
}
```

> 警告
>
> 這裡的說的「變數」是指送給伺服器端 mutation 的 input，**不是**指這個 mutation 的 fragment builder 可以取用的變數。

### getFragment (static 方法)

```
static getFragment(
  fragmentName: $Keys<Tp>,
  variableMapping?: Variables
): RelayFragmentReference

// variableMapping 參數的 type
type Variables = {[name: string]: mixed};
```

取得一個 fragment 的參考在 parent 的 query fragment 使用。

#### 範例

```{8}
class StoryComponent extends React.Component {
  /* ... */
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        id,
        text,
        ${LikeStoryMutation.getFragment('story')},
      }
    `,
  };
}
```

你也可以從包含這個 mutation 的外部 fragment 傳遞變數到它的 fragment builder。

```{8-11}
class Movie extends React.Component {
  /* ... */
  static fragments = {
    movie: (variables) => Relay.QL`
      fragment on Movie {
        posterImage(lang: $lang) { url },
        trailerVideo(format: $format, lang: $lang) { url },
        ${RentMovieMutation.getFragment('movie', {
          format: variables.format,
          lang: variables.lang,
        })},
      }
    `,
  };
}
```

> 提示
>
> 在最後一個範例中，把 `$format` 和 `variables.format` 想成是一樣的值。

### getCollisionKey

```
getCollisionKey(): ?string
```

實作這個方法來回傳一個會衝突的 key。Relay 會照順序來送出任何有同樣會衝突的 key 的 mutation 到伺服器。

#### 範例

```
class LikeStoryMutation extends Relay.Mutation {
  getCollisionKey() {
    // 給一樣的 key 給影響同一個 story 的 like mutation
    return `like_${this.props.story.id}`;
  }
}
```

### getFiles

```
getFiles(): ?FileMap

// FileMap 物件的 type
type FileMap = {[key: string]: File};
```

實作這個方法來回傳一個要上傳的 `File` 物件的 map 作為 mutation 的一部份。

#### 範例

```
class AttachDocumentMutation extends Relay.Mutation {
  getFiles() {
    return {
      file: this.props.file,
    };
  }
}
class FileUploader extends React.Component {
  handleSubmit() {
    var fileToAttach = this.refs.fileInput.files.item(0);
    Relay.Store.commitUpdate(
      new AttachDocumentMutation({file: fileToAttach})
    );
  }
}
```

### getOptimisticConfigs

```
getOptimisticConfigs(): Array<{[key: string]: mixed}>
```

在處理 optimistic 回應的 mutator 設定需要與處理伺服器回應的 mutator 設定不同時實作這個方法。

也可以參閱：[Relay.Mutation::getConfigs()](#getconfigs-abstract-method)

### getOptimisticResponse

```
getOptimisticResponse(): ?{[key: string]: mixed}
```

實作這個方法去精巧的製作一個跟伺服器回應的 payload 相同形狀的 optimistic 回應。這個 optimistic 回應會在伺服器回傳之前被用來預先更新客戶端快取，給人一種這個 mutation 立刻完成的印象。

#### 範例

```
class LikeStoryMutation extends Relay.Mutation {
  getOptimisticResponse() {
    return {
      story: {
        id: this.props.story.id,
        likers: {
          count: this.props.story.likers.count + 1,
        },
        viewerDoesLike: !this.props.story.viewerDoesLike,
      },
    };
  }
}
```

也可以參閱：[Mutations > Optimistic 更新](guides-mutations.html#optimistic-updates)
