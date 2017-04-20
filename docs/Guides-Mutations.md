---
id: guides-mutations
title: Mutations
layout: docs
category: Relay Classic Guides
permalink: docs/guides-mutations.html
next: guides-network-layer
---

到目前為止，我們只有跟 GraphQL endpoint 互動去執行抓取資料的 query。在這份指南中，你將會學習到如何使用 Relay 去執行 mutation – 這個操作包括寫入到資料 store 並隨後抓取任何改變的欄位。

## 完整的範例

在我們深入 mutation API 之前，讓我們先看一個完整的範例。在這裡，我們繼承 `Relay.Mutation` 來建立一個可以用來 like story 的客製化 mutation。

```
class LikeStoryMutation extends Relay.Mutation {
  // 這個方法應該回傳一個 GraphQL 操作來代表
  // 要被執行的 mutation。這裡假設伺服器
  // 實作了一個叫做 ‘likeStory’ 的 mutation type。
  getMutation() {
    return Relay.QL`mutation {likeStory}`;
  }
  // 使用這個方法來準備要給 mutation 作為
  // input 的變數。我們的 ‘likeStory’ mutation 剛好接收
  // 一個變數作為 input – 要 like 的 story 的 ID。
  getVariables() {
    return {storyID: this.props.story.id};
  }
  // 使用這個方法來設計一個 ‘fat query’ – 一個代表在你的資料模型中每個
  // 可能會因為這個 mutation 而改變的欄位。
  // Like 一個 story 可能會影響 liker 的數量，
  // 一個總結有誰 like 這個 story 的句子，還有正在觀看的人有沒有 like
  // 這個 story。Relay 會用一個代表應用程式實際使用資料
  // 的 ‘tracked query’ 來取交集做出這個 query，並
  // 指示伺服器只把這些欄位加進它的回應中。
  getFatQuery() {
    return Relay.QL`
      fragment on LikeStoryPayload {
        story {
          likers {
            count,
          },
          likeSentence,
          viewerDoesLike,
        },
      }
    `;
  }
  // 這些設定建議 Relay 要如何處理伺服器回傳的
  // LikeStoryPayload。下面，我們告訴 Relay 使用這個 payload 去
  // 改變已經在 store 裡面的 record 的欄位。
  // ‘fieldIDs’ 鍵值對把在 payload 中的欄位名稱關聯到
  // 我們想要更新的 record 的 ID。
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        story: this.props.story.id,
      },
    }];
  }
  // 這個 mutation 對 story 的 ID 有一個強硬的依賴關係。我們在這裡宣告式的
  // 指定這個依賴關係作為一個 GraphQL query fragment。Relay 會
  // 使用這個 fragment 來確保無論這個 mutation 在哪被使用
  // 這個 story 的 ID 都可以使用。
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        id,
      }
    `,
  };
}
```

下面是這個 mutation 被 `LikeButton` component 使用的範例：

```
class LikeButton extends React.Component {
  _handleLike = () => {
    // 要執行 mutation，必須傳遞一個 mutation 的實體給
    // `this.props.relay.commitUpdate`
    this.props.relay.commitUpdate(
      new LikeStoryMutation({story: this.props.story})
    );
  }
  render() {
    return (
      <div>
        {this.props.story.viewerDoesLike
          ? 'You like this'
          : <button onClick={this._handleLike}>Like this</button>
        }
      </div>
    );
  }
}

module.exports = Relay.createContainer(LikeButton, {
  fragments: {
    // 你可以像你其他的那些 RelayContainer 一般
    // 合成 mutation 的 query fragment。這可以確保
    // mutation 依賴的資料會先被抓取並準備好可以使用。
    story: () => Relay.QL`
      fragment on Story {
        viewerDoesLike,
        ${LikeStoryMutation.getFragment('story')},
      }
    `,
  },
});
```

在這個特定的例子中，`LikeButton` 唯一在意的欄位是 `viewerDoesLike`。那個欄位會成為 tracked query 的一部分，Relay 會用它跟 `LikeStoryMutation` 的 fat query 取交集，以決定針對這個 mutation 要請求什麼欄位作為伺服器回應 payload 的一部份。應用程式中別處的其他 component 可能也對 likers count，或是 like sentence 感興趣。由於這些欄位會自動地被加進 Relay 的 tracked query，`LikeButton` 不需要擔心需要明確地請求它們。

## Mutation props

我們傳遞給 mutation constructor 的任何 props 可以在它的實體方法藉由 `this.props` 取用。就像在 Relay container 裡面使用的 component 中，那些有對應定義過的 fragment 的 props 會被 Relay 用 query 的資料填入：

```
class LikeStoryMutation extends Relay.Mutation {
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        id,
        viewerDoesLike,
      }
    `,
  };
  getMutation() {
    // 在這裡，viewerDoesLike 是保證可以使用的。
    // 我們可以用它來讓這個 mutation 有點變化。
    return this.props.story.viewerDoesLike
      ? Relay.QL`mutation {unlikeStory}`
      : Relay.QL`mutation {likeStory}`;
  }
  /* ... */
}
```

## Fragment 變數

就像 [Relay containers](guides-containers.html) 一樣，我們可以基於先前的變數和執行期環境，準備變數給我們的 mutation 的 fragment builder 使用。

```
class RentMovieMutation extends Relay.Mutation {
  static initialVariables = {
    format: 'hd',
    lang: 'en-CA',
  };
  static prepareVariables = (prevVariables) => {
    var overrideVariables = {};
    if (navigator.language) {
      overrideVariables.lang = navigator.language;
    }
    var formatPreference = localStorage.getItem('formatPreference');
    if (formatPreference) {
      overrideVariables.format = formatPreference;
    }
    return {...prevVariables, ...overrideVariables};
  };
  static fragments = {
    // 現在我們可以使用這些我們準備用來抓取 movie 的變數
    // 分配適合正在觀看的人的語言環境和喜好設定
    movie: () => Relay.QL`
      fragment on Movie {
        posterImage(lang: $lang) { url },
        trailerVideo(format: $format, lang: $lang) { url },
      }
    `,
  };
}
```

## fat query

在系統中改變一個東西，可能會造成其他東西接著改變的連鎖反應。想像一個我們可以用來接受好友邀請的 mutation。這可能造成廣泛的影響：

- 兩個人的 friend count 都將增加
- 一個代表這個新的 friend 的 edge 會被添加到 viewer 的 `friends` connection
- 一個代表 viewer 的 edge 會被添加到這個新的 friend 的 `friends` connection
- viewer 與 requester 的 friendship 狀態會改變

設計一個涵蓋所有可能會改變的欄位的 fat query：

```
class AcceptFriendRequestMutation extends Relay.Mutation {
  getFatQuery() {
    // 這假設這個 mutation 的伺服器端實作
    // 回傳一個 type `AcceptFriendRequestPayload` 的 payload，它包含
    // `friendEdge`、`friendRequester`、和 `viewer` 欄位。
    return Relay.QL`
      fragment on AcceptFriendRequestPayload {
        friendEdge,
        friendRequester {
          friends,
          friendshipStatusWithViewer,
        },
        viewer {
          friends,
        },
      }
    `;
  }
}
```

這個 fat query 看起來就像其他的 GraphQL query，但是有一個重要的不同。我們知道這之中的某些欄位不是 scalar (像是 `friendEdge` 和 `friends`)，
但是請注意，我們沒有經由 subquery 命名它們的任何 children。透過這種方式，我們暗示 Relay 在這些不是 scalar 的欄位之下的*任何東西*都可能會因為這個 mutation 而改變。

> 附註
>
> 在設計 fat query 時，要考慮*所有*可能會因為 mutation 而改變的資料 – 不只是應用程式正在使用的資料。我們不需要擔心抓取了多餘的東西；這個 query 會與我們的應用程式實際上需要的資料的 ‘tracked query’ 取交集才執行。如果我們在 fat query 中忽略了任何欄位，我們可能會在未來添加新的 view 與資料依賴關係，或是添加新的資料依賴關係到既有的 view 時觀察到資料不一致。

## 設定 Mutator

我們需要給 Relay 如何從每一個 mutation 使用回應 payload 來更新客戶端的 store 的指示。我們透過用一個以上下述的 mutation type 去設定 mutation 來達成：

### `FIELDS_CHANGE`

任何在 payload 中的欄位，如果可以透過 DataID 關聯到一個以上在客戶端的 store 中的 record，就會跟在 store 中的 record 合併。

#### 參數

- `fieldIDs: {[fieldName: string]: DataID | Array<DataID>}`

  一個把回應中的 `fieldName` 映射到一個以上在 store 中的 DataID 的 map。

#### 範例

```
class RenameDocumentMutation extends Relay.Mutation {
  // 這個 mutation 宣告一個依賴關係在 document 的 ID 上
  static fragments = {
    document: () => Relay.QL`fragment on Document { id }`,
  };
  // 我們知道只有這個 document 的 name 有可能因為
  // 這個 mutation 而改變，所以把它指定在這裡的 fat query 中。
  getFatQuery() {
    return Relay.QL`
      fragment on RenameDocumentMutationPayload { updatedDocument { name } }
    `;
  }
  getVariables() {
    return {id: this.props.document.id, newName: this.props.newName};
  }
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      // 把在回應中的 `updatedDocument` 欄位關聯
      // 到我們想要更新的 record 的 DataID。
      fieldIDs: {updatedDocument: this.props.document.id},
    }];
  }
  /* ... */
}
```

### `NODE_DELETE`

給定一個 parent、一個 connection、和一個以上的 DataID 在回應的 payload 中，Relay 會從 connection 移除這個 node 並從 store 刪除相關的 record。

#### 參數

- `parentName: string`

  在回應中代表這個 connection 的 parent 的欄位名稱

- `parentID?: string`

  包含這個 connection 的 parent node 的 DataID。這個參數可選擇性的提供。

- `connectionName: string`

  在回應中代表這個 connection 的欄位名稱

- `deletedIDFieldName: string`

  在回應中包含 deleted node 的 DataID 的欄位名稱

#### 範例

```
class DestroyShipMutation extends Relay.Mutation {
  // 這個 mutation 宣告一個依賴關係在一個敵軍的 ship 的 ID
  // 和 ship 屬於的 faction 的 ID 上。
  static fragments = {
    ship: () => Relay.QL`fragment on Ship { id, faction { id } }`,
  };
  // Destroy 一個 ship 會從一個 faction 的 fleet 移除它，因此我們
  // 指定這個 faction 的 ships connection 作為 fat query 的一部份。
  getFatQuery() {
    return Relay.QL`
      fragment on DestroyShipMutationPayload {
        destroyedShipID,
        faction { ships },
      }
    `;
  }
  getConfigs() {
    return [{
      type: 'NODE_DELETE',
      parentName: 'faction',
      parentID: this.props.ship.faction.id,
      connectionName: 'ships',
      deletedIDFieldName: 'destroyedShipID',
    }];
  }
  /* ... */
}
```

### `RANGE_ADD`

在回應 payload 中給定一個 parent、一個 connection、和新建立的 edge 的名稱，Relay 將會把這個 node 添加到 store 並依照指定的 range behavior 把它附加到這個 connection。

#### 參數

- `parentName: string`

  在回應中代表這個 connection 的 parent 的欄位名稱

- `parentID?: string`

  包含這個 connection 的 parent node 的 DataID。這個參數可選擇性的提供。

- `connectionName: string`

  在回應中代表這個 connection 的欄位名稱

- `edgeName: string`

  在回應中代表新建立的 edge 的欄位名稱

- `rangeBehaviors: {[call: string]: GraphQLMutatorConstants.RANGE_OPERATIONS} | (connectionArgs: {[argName: string]: string}) => $Enum<GraphQLMutatorConstants.RANGE_OPERATIONS>`

  一個 printed、dot-separated *依字母順序*的 GraphQL calls 以及我們想要 Relay 在這些 calls 的影響下添加新的 edge 到 connections 表現的 behavior 之間的 map 或是一個接收一個 connection 參數的陣列，回傳那個 behavior 的 function。

例如，可以用這種方式撰寫 `rangeBehaviors`：

```
const rangeBehaviors = {
  // 當這些 ships connection 沒有受到任何 call 的影響
  // ，把 ship 附加到這個 connection 的尾端
  '': 'append',
  // 在這個 connection 依照時間排序時，把這個 ship 附加到前端
  'orderby(newest)': 'prepend',
};
```

或是用這種方式，會得到一樣的結果：

```
const rangeBehaviors = ({orderby}) => {
  if (orderby === 'newest') {
    return 'prepend';
  } else {
    return 'append';
  }
};

```

Behaviors 可以是 `'append'`、`'ignore'`、`'prepend'`、`'refetch'`、或是 `'remove'` 的其中一個。

#### 範例

```
class IntroduceShipMutation extends Relay.Mutation {
  // 這個 mutation 宣告一個依賴關係在
  // 這個 ship 要被 introduce 進去的 faction 上。
  static fragments = {
    faction: () => Relay.QL`fragment on Faction { id }`,
  };
  // Introduce 一個 ship 會把它添加到 faction 的 fleet，因此我們
  // 指定這個 faction 的 ships connection 作為 fat query 的一部份。
  getFatQuery() {
    return Relay.QL`
      fragment on IntroduceShipPayload {
        faction { ships },
        newShipEdge,
      }
    `;
  }
  getConfigs() {
    return [{
      type: 'RANGE_ADD',
      parentName: 'faction',
      parentID: this.props.faction.id,
      connectionName: 'ships',
      edgeName: 'newShipEdge',
      rangeBehaviors: {
        // 當這些 ships connection 沒有受到任何 call 的影響，
        // 把 ship 附加到這個 connection 的尾端
        '': 'append',
        // 在這個 connection 依照時間排序時，把這個 ship 附加到前端
        'orderby(newest)': 'prepend',
      },
    }];
  }
  /* ... */
}
```

### `RANGE_DELETE`

給定一個 parent、一個 connection、一個以上在回應 payload 中的 DataID，和 一個 parent 和 connection 之間的 path，Relay 會從這個 connection 移除這些 node，但把相關的 record 留在 store 中。

#### 參數

- `parentName: string`

  在回應中代表這個 connection 的 parent 的欄位名稱

- `parentID?: string`

  包含這個 connection 的 parent node 的 DataID。Omit if the parent node does not 有 ID。

- `connectionName: string`

  在回應中代表這個 connection 的欄位名稱

- `deletedIDFieldName: string | Array<string>`

  在回應中包含被移除的 node 的 DataID 的欄位名稱，或到從這個 connection 被移除的 node 的 path

- `pathToConnection: Array<string>`

  一個包含 parent 和 connection 之間的欄位名稱的陣列，包括 parent 和 connection


#### 範例

```
class RemoveTagMutation extends Relay.Mutation {
  // 這個 mutation 宣告一個依賴關係在
  // 被移除 tag 的那個 todo 上。
  static fragments = {
    todo: () => Relay.QL`fragment on Todo { id }`,
  };
  // 從一個 todo 移除一個 tag 會影響它的 tags connection
  // 所以我們在這裡指定它作為 fat query 的一部份。
  getFatQuery() {
    return Relay.QL`
      fragment on RemoveTagMutationPayload {
        todo { tags },
        removedTagIDs,
      }
    `;
  }
  getConfigs() {
    return [{
      type: 'RANGE_DELETE',
      parentName: 'todo',
      parentID: this.props.todo.id,
      connectionName: 'tags',
      deletedIDFieldName: 'removedTagIDs',
      pathToConnection: ['todo', 'tags'],
    }];
  }
  /* ... */
}
```

### `REQUIRED_CHILDREN`

`REQUIRED_CHILDREN` 設定用來把額外的 children 附加到 mutation query 上。你可能會需要使用這個，例如，要抓取在一個 mutation 建立的新物件上的欄位 (而那是 Relay 通常不會嘗試去抓取的，因為它先前沒有為那個物件抓取任何東西)。

因為 `REQUIRED_CHILDREN` 設定而被抓取的資料不會被寫入客戶端的 store，不過你可以在傳遞進去 `commitUpdate()` 的 `onSuccess` callback 添加對其處理的程式碼：

```
this.props.relay.commitUpdate(
  new CreateCouponMutation(),
  {
    onSuccess: response => this.setState({
      couponCount: response.coupons.length,
    }),
  }
);
```

#### 參數

- `children: Array<RelayQuery.Node>`

#### 範例

```
class CreateCouponMutation extends Relay.Mutation<Props> {
  getMutation() {
    return Relay.QL`mutation {
      create_coupon(data: $input)
    }`;
  }

  getFatQuery() {
    return Relay.QL`
      // 注意，在這裡使用 `pattern: true` 來表示這個
      // connection 欄位只用於模式匹配
      // (以決定要抓取什麼) 所以 Relay 不應該
      // 要求平常的 connection 參數像是 (`first` 等等)
      // 存在。
      fragment on CouponCreatePayload @relay(pattern: true) {
        coupons
      }
    `;
  }

  getConfigs() {
    return [{
      // 如果我們在這個 mutation 執行的時候
      // 尚未在 UI 上顯示這些 coupons，它們尚未被抓取過而且
      // 在 fat query 中的 `coupons` 欄位通常會被忽略。
      // `REQUIRED_CHILDREN` 則會強迫無論如何去取回它。
      type: RelayMutationType.REQUIRED_CHILDREN,
      children: [
        Relay.QL`
          fragment on CouponCreatePayload {
            coupons
          }
        `,
      ],
    }];
  }
}
```

## Optimistic 更新

目前為止，我們執行過所有的 mutation 都有在更新客戶端的 store 之前等待從伺服器來的回應。Relay 提供一個機會給我們基於我們預期在 mutation 成功的情況下伺服器的回應會是什麼，去精巧的製作一個相同形狀的 optimistic 回應。

讓我們來為上面的 `LikeStoryMutation` 範例精巧的製作一個 optimistic 回應：

```
class LikeStoryMutation extends Relay.Mutation {
  /* ... */
  // 這是從前面來的 fat query
  getFatQuery() {
    return Relay.QL`
      fragment on LikeStoryPayload {
        story {
          likers {
            count,
          },
          likeSentence,
          viewerDoesLike,
        },
      }
    `;
  }
  // 讓我們來精巧的製作一個模仿 LikeStoryPayload 形狀
  // ，以及我們預期接收到的值的 optimistic 回應。
  getOptimisticResponse() {
    return {
      story: {
        id: this.props.story.id,
        likers: {
          count: this.props.story.likers.count + (this.props.story.viewerDoesLike ? -1 : 1),
        },
        viewerDoesLike: !this.props.story.viewerDoesLike,
      },
    };
  }
  // 要能夠去增加 likers 的 count，以及切換 viewerDoesLike
  // ，我們需要確保這些資料可以讓這個 mutation
  // 取用，還有 story 的 ID。
  static fragments = {
    story: () => Relay.QL`
      fragment on Story {
        id,
        likers { count },
        viewerDoesLike,
      }
    `,
  };
  /* ... */
}
```

你不需要模擬完整的回應 payload。在這裡，我們把 like sentence 踢到一邊，因為要在客戶端上處理在地化很困難。當伺服器回應時，Relay 會把它的 payload 當作真相來源，不過在這期間，這個 optimistic 回應會立刻被套用，讓使用我們產品的人們能在做了一個動作後享受立即的回饋。
