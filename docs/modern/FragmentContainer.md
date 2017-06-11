---
id: fragment-container
title: FragmentContainer
layout: docs
category: Relay Modern
permalink: docs/fragment-container.html
next: refetch-container
---

宣告資料需求的主要方式是透過 `createFragmentContainer` — 一個讓 React components 封裝它們的資料需要的 higher-order React component。

類似於 React component 的 `render` 方法不直接地調整原生的 view，Relay container 也不直接地抓取資料。container 宣告了 render 所需要的資料*規範*。Relay 來保證這份資料在 render *前*可以使用。

## 完整的範例

一開始，讓我們來建置純 React 版的 `<TodoItem>` component，它顯示 `Todo` 的文字和完成狀態。

### 基底 React Component
這是個基本的 `<TodoItem>` 實作，它為了凸顯功能忽略了樣式：

```javascript
class TodoItem extends React.Component {
  render() {
    // 預期 `item` prop 會是以下的格式：
    // {
    //   item: {
    //     text,
    //     isComplete
    //   }
    // }
    const item = this.props.item;
    return (
      <View>
        <Checkbox checked={item.isComplete} />
        <Text>{item.text}</Text>
      </View>
    );
  }
}
```

### 使用 GraphQL 完成資料需求

在 Relay 中，使用 [GraphQL](https://github.com/facebook/graphql) 來描述資料需求。以 `<TodoItem>` 來說，它的依賴關係可以被表達如同下面那樣。請記得，它必須完全符合 component 預期的 `item` prop 的格式。

建議使用 `<FileName>_<propName>` 的命名慣例來命名 fragment。當從 classic 搬移到 modern API 需要這個限制來完成跨雙方的相容性。

```javascript
graphql`
  # 這個 fragment 只能運用在 'Todo' 類別的物件上。
  fragment TodoItem_item on Todo {
    text
    isComplete
  }
`
```

### Relay Container

給定一般的 React component 和一個 GraphQL fragment，我們就可以定義 `Container` 來告訴 Relay 這個 component 的資料需求。讓我們先來看一段程式碼接著看看發生什麼事：

```javascript
class TodoItem extends React.Component {/* 同上 */}

// Export 一個 *新的* React component，它包裝了原來的 `<TodoItem>`。
module.exports = createFragmentContainer(TodoItem, {
  // 針對所有倚賴伺服器資料的 props，我們在這個物件中
  // 定義一個對應的 key。在這裡，這個 component 預期伺服器的資料會填入
  // `item` prop，所以我們指定上面的 fragment 到 `item` key。
  item: graphql`
    fragment TodoItem_item on Todo {
      text
      isComplete
    }
  `,
});
```

上面的範例與 classic container API 非常相似，不過在 modern API 中我們可以直接傳遞 `graphql` template literal 作為第二個參數。Relay 會從 fragment 名稱依照 fragment 命名慣例 `<FileName>_<propName>` 推斷出 prop 名稱。下面的範例跟上面的範例是相等的：

```javascript
module.exports = createFragmentContainer(
  TodoItem,
  graphql`
    fragment TodoItem_item on Todo {
      text
      isComplete
    }
  `,
);
```

如果沒有 `_<propName>` 前綴，將會使用 `data` 作為 prop 名稱：

```javascript
class TodoItem extends React.Component {
  render() {
    const item = this.props.data;

  }
}
module.exports = createFragmentContainer(
  TodoItem,
  graphql`
    fragment TodoItem on Todo {
      text
      isComplete
    }
  `,
);
```

## 組合 Container

React 和 Relay 支援透過*組合*建立任何複雜的應用程式。可以利用組合較小的 component 來創造較大 component，這能幫助我們建立模組化、強大的應用程式。Relay 組合了 component 的兩個方面：

- 組合 view 邏輯，以及
- 組合資料描述。

讓我們藉由組合了上面的 `<TodoItem>` component 的 `<TodoList>` component 來探索這個運作原理。

### 組合 View - 這是一般的 React

View 組合*就*是你以往所做的 — Relay container 是標準的 React component。以下這是 `<TodoList>` component：

```javascript
class TodoList extends React.Component {
  render() {
    // 預期 `list` 有字串 `title`，以及
    // 給 `<TodoItem>` 們的資訊 (我們會在接下來取得它)。
    const list = this.props.list;
    return (
      <View>
        {/* 它就像 React component 一般運作，因為它就是一個 React component！ */}
        <Text>{list.title}</Text>
        {list.todoItems.map(item => <TodoItem item={item} />)}
      </View>
    );
  }
}
```

### 組合 Fragment

Fragment 組合的運作方式很類似 — parent container 的 fragment 組合了每一個 children 的 fragment。在這個範例中，`<TodoList>` 需要抓取 `<TodoItem>` 所需要的 `Todo` 資訊。

```javascript
class TodoList extends React.Component {/* 同上 */}

module.exports = createFragmentContainer(
  TodoList,
  // 這 `_list` fragment 命名後綴對應到 prop `list`，
  // 它預期會被 `<TodoList>` component 填入伺服器來的資料。
  graphql`
    fragment TodoList_list on TodoList {
      # S指定任何 '<TodoList>' 自己需要的欄位。
      title
      # 包含一個到 child component 的 fragment 的參考。
      todoItems {
        ...TodoItem_item
      }
    }
  `,
);
```

請記得在組合 fragment 時，被組合的 fragment 的類別必須符合在 parent 上嵌入它的欄位。例如，嵌入一個 `Story` 類型的 fragment 到 parent 裡面 `User` 類型的欄位中沒有意義。如果你做錯了，Relay 和 GraphQL 將會提供有用的錯誤訊息 (而如果它們不是非常有用，請讓我們知道！)。

## Render Container

我們前面已經學到，Relay fragment container 把資料需求宣告為 GraphQL fragment。
我們幾乎已經準備好讓 Relay 來滿足這些 component 的資料需求並 render 它們。不過，這還有一個問題。為了使用 GraphQL 實際地抓取資料，我們需要一個 query root。舉例來說，我們需要把 `<TodoList>` fragment 包在一個 GraphQL query。

在 Relay 中，query 的 root 是透過 **QueryRenderer** 來定義，請查看那個章節以了解更多細節。
