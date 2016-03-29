---
id: thinking-in-relay
title: Thinking In Relay
layout: docs
category: Quick Start
permalink: docs/thinking-in-relay.html
next: videos
---

Relay 的資料抓取方法高度受到我們使用 React 的經驗啟發。尤其是，React 把複雜的界面拆成可重複使用的 **component**，讓開發者能獨立的去思考一個應用程式的個別部分，並減少應用程式不同部分之間的耦合。更重要的是，這些 component 是 **declarative** 的：它們讓開發者去指定 UI 針對給定的 state 應該看起來像*什麼樣子*，而不需要去擔心*如何*去呈現那個 UI。不同於以往那些使用 imperative 的指令去操作原生的 view (例如，DOM) 的方法，React 使用對 UI 的描述來自動地判斷需要的指令。

讓我們看一些產品的使用案例來了解我們如何把這些想法加進 Relay。我們會假設你對 React 有基本的熟悉。

## 為 View 抓取資料

根據我們的經驗，絕大多數的產品都想要一個特定的行為：在為 view 層級抓取*全部的*資料時顯示一個載入指示燈，並接著在一旦資料準備好的時候 render *整個* view。

一種解決方案是擁有一個 root component 為它的所有 children 抓取資料。不過，這會導致耦合：對 component 的每個變更都會需要改變*所有*可能會 render 它的 root component，而且時常還有它跟 root 之間的一些 component。這種耦合可能意味著有更大的機會造成 bug 並拖慢開發的步調。追根究底，這個方法沒有利用 React 的 component 模型。指定資料依賴關係最自然的地方就在 *component* 中。

下一個合乎邏輯的做法是使用 `render()` 作為觸發資料抓取的手段。我們可以簡單地先 render 應用程式一次，看它需要什麼資料，抓取那些資料，然後再 render 一次。這聽起來不錯，但問題是 *component 需要使用資料來計算出要 render 什麼東西！*也就是說，這會強迫資料抓取必須分階段：首先 render root 並看看它需要什麼資料，接著 render 它的 children 並看看它們需要什麼，一路往下走過整個 tree。如果每一個階段都引發網路請求，render 會需要很慢、連續的往返。我們需要一個方法來預先或*靜態地*決定所有的資料需求。

我們最終選擇靜態方法；components 會有效率地回傳一個 query-tree，從 view-tree 中分離，描述他們依賴的資料。Relay 接著可以使用這個 query-tree 在一個單一階段去抓取所有需要的資訊並使用它去 render 這些 component。問題是要找到一個適當的機制去描述 query-tree，還有一個能夠有效率地從伺服器抓取它的方法 (例如，在單一網路請求中)。這是 GraphQL 的完美使用案例，因為它提供一個語法來*依照資料描述資料依賴關係*，而不用操作任何特定的 API。需要注意的是，Promise 和 Observable 常被建議作為替代選擇，不過它們代表*不透明的指令*並妨礙了各種的優化，例如：批次處理 query。

## 資料 Component 又名 Container

Relay 讓開發者們藉由建立 **container** 來標注他們的 React component 與其資料依賴關係。它們是包裝了原本的 component 的正規 React component。關鍵的設計限制是，React component 應該是可以重複使用的，因此 Relay container 也必須是如此。例如，`<Story>` component 會實作一個用來 render 任何的 `Story` 項目的 view。實際要 render 的 story 將會藉由傳遞到 component 的資料來決定：`<Story story={ ... } />`。在 GraphQL 中的等價概念是 **fragment**：指定要抓取什麼資料*給一個給定 type 的物件*的命名 query 片段。我們可以如下描述 `<Story>` 需要的資料：

```
fragment on Story {
  text,
  author {
    name,
    photo
  }
}
```

而這個 fragment 可以接著被用來定義 Story container：

```javascript
// 一般的 React component。
// 用法：`<Story story={ ... } />`
class Story extends React.Component { ... }

// 包了 `<Story>` 的「Higher-order」component
var StoryContainer = Relay.createContainer(Story, {
  fragments: {
    // 定義一個 fragment 有著符合上面預期的 `story` prop 的名稱
    story: () => Relay.QL`
      fragment on Story {
        text,
        author { ... }
      }
    `
  }
})
```

## Render

在 React 中，render 一個 view 需要兩個 input：要 render 的 *component*，和一個要 render 進去的 *root* DOM (UI) node。Render Relay container 也類似：我們需要一個要 render 的 *container*，和一個 graph 中的 *root* 來從那邊開始我們的 query。我們也必須確保用於 container 的 query 有被執行並可能會想要在資料正在被抓取時顯示一個載入指示燈。類似於 `ReactDOM.render(component, domNode)`，Relay 也提供 `<RelayRootContainer Component={...} route={...}>` 來達成這個目的。那個 component 是要 render 的東西，而 route 則提供指定要抓取*哪個*東西的 query。下面是我們會如何去 render `<StoryContainer>`：

```javascript
ReactDOM.render(
  <RelayRootContainer
    Component={StoryContainer}
    route={{
      queries: {
        story: () => Relay.QL`
          query {
            node(id: "123") /* 我們的 `Story` fragment 將會被加到這裡 */
          }
        `
      },
    }}
  />,
  rootEl
)
```

`RelayRootContainer` 可以接著協調這些 queries 的抓取；把它們跟快取的資料做比較，抓取任何遺漏的資訊，更新快取，並最後在資料可以使用時 render `StoryContainer`。在正在抓取資料時預設不 render 任何東西，不過這個載入的 view 可以藉由 `renderLoading` prop 來客製化。就像 React 讓開發者們 render view 不需要直接操作背後的 view，Relay 和 `RelayRootContainer` 則去掉了直接與網路溝通的需要。

## 資料遮罩

在典型的資料抓取方法，我們發現兩個 component 有*不明確的依賴關係*很常見。例如 `<StoryHeader>` 可能可以使用一些資料而不需要直接確保已經抓取了這些資料。這些資料時常也會被系統的一些其他部分抓取，例如：`<Story>`。接著當我們改變 `<Story>` 並移除它的資料抓取邏輯，`<StoryHeader>` 會突然莫名其妙的壞掉。這種類型的 bug 不總是立刻出現，特別是在更大的團隊開發的更大的應用程式裡。手動與自動測試能給的幫助很有限：這就是最好藉由框架來解決的系統問題類型。

我們已經看到 Relay container 會確保 GraphQL fragment 有在 component 被 render *之前* 被抓取。另外，container 也提供另一個不是顯而易見的好處：**資料遮罩**。Relay 只允許 component 存取它們在 `fragments` 中明確地要求的資料 — 僅此而已。所以如果一個 component 查詢 Story 的 `text`，而另一個查詢它的 `author`，彼此都*只*可以看到它們個別要求過的欄位。事實上，component 甚至看不到它們的 *children* 請求的資料：因為那也會破壞封裝。

Relay 還更進一步：它在 `props` 上使用不透明的識別符以驗證我們在 render component 之前已經明確地抓取了它的資料。如果 `<Story>` render `<StoryHeader>` 但是卻忘記要引入它的 fragment，Relay 會警告遺失了要給 `<StoryHeader>` 的資料。實際上，*即使*一些其他的 component 碰巧抓取了一些跟 `<StoryHeader>` 需要的一樣的資料，Relay 也會警告。這個警告告訴我們，雖然東西現在*可能*運作正常，但它們之後很有可能會壞掉。

# 總結

GraphQL 提供一個強大的工具來建置高效能、解耦的客戶端應用程式。Relay 建置在這樣的功能之上來提供一個 **declarative 資料抓取**的框架。透過把要抓取*什麼*資料跟*如何*抓取它分離，Relay 幫助開發者們建置強大、清楚、且高性能的應用程式。這對 React 倡導的以 component 為中心的思維是一個很好的補充。當這每一個技術 — React、Relay、以及 GraphQL — 都各自很強大，它們的組合是一個讓我們能*快速前進*並*釋出高品質且有規模的應用程式*的 **UI 平台**。
