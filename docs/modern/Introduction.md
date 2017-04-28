---
id: relay-modern
title: Introduction to Relay Modern
layout: docs
category: Relay Modern
permalink: docs/relay-modern.html
next: new-in-relay-modern
---

Relay Modern 是新版的 Relay，重從頭開始設計讓他更容易使用、更容易擴展，而最重要的是，能夠提高在行動裝置上的效能。Relay Modern 透過靜態查詢以及提前的程式碼生成來實現這一點。

## 入門

### 升級到 react-relay v1.0.0

Relay v1.0 導入了 Relay Modern API。要取得 Relay v1.0 的 release-candidate，必須安裝 `@dev` 的 build：

```sh
yarn add react-relay@dev
```

在升級既有的 Relay 應用程式時，把全部的 `require('react-relay')` 改成 `require('react-relay/classic')` 就能繼續的載入 Relay Classic API。

### 設定 babel-plugin-relay

Relay Modern 需要一個 Babel plugin 來把 GraphQL 轉換執行期產物：

```sh
yarn add --dev babel-plugin-relay@dev
```

把 `"relay"` 加到 .babelrc 檔案的 plugins 清單。如果你是在升級既有的 Relay 應用程式，請看[這份文件](./babel-plugin-relay.html)。

### 設定 relay-compiler

Relay Modern 的預編譯需要新的 Relay Compiler：

```sh
yarn add --dev relay-compiler@dev
```

在變更任何在你的 Relay 應用程式的 GraphQL 之後執行 Relay Compiler。把它寫成 `yarn script` 可能會有點幫助。在你的 package.json 檔案加一個進入點到 `"scripts"`。

```js
"relay": "relay-compiler --src ./src --schema path/schema.graphql"
```

在編輯應用程式的檔案後，接著執行 `yarn run relay` 來產生新的檔案，或是執行 `yarn run relay -- --watch` 來在持續運行的 process 上跑 compiler，可以在存檔時自動地產生新檔案。


## 轉換到 Relay Modern

從 Relay Classic 應用程式轉換到 Relay Modern 不需要從頭開始重寫。
你可以一次轉換一個 component 到 Relay Modern API 而持續的擁有一個可以運作的應用程式。
一但所有的 component 都被轉換完畢，就可以使用更小更快的
Relay Modern 執行期。

在這個轉換的期間，可以使用 [Relay Compat](./relay-compat.html) 工具和 API 來同時支援 Relay Classic 和 Relay Modern。


## Idea

[React](https://facebook.github.io/react/) 讓 view 可以被定義成 component，每一個 component 負責 render 一部分的 UI。組合其他的 component 是建構複雜 UI 的方法。每一個 React component 不需要知道被組裝的 component 的內部運作。

Relay 結合了 React 以及 GraphQL，並更近一步的發展了封裝的概念。它讓 component 去指定它們需要什麼資料而交給 Relay framework 來提供資料。這讓內部 component 的資料需求不會暴露並允許合成這些需求。試想應用程式需要的資料被放到 component 的旁邊，應該讓它更容易搞清楚什麼欄位是需要的而什麼欄位已經不再需要。

## 術語

### Container

Relay Modern container 結合一般的 React component 以及它們資料需求的描述，這被描述成一個以上的 GraphQL fragment。每個 container 自身都是一般 React component 所以可以用標準的 React API (例如：`<YourComponent prop={...} />`) 來 render。在 render 之後，container 會從 Relay 快取中讀取資料給它的 fragment。每當 fragment 的資料改變 - 例如因為 mutation、subscription、或更新過後的 query 回應 - container 會自動地重新 render 這個 component。

[`createFragmentContainer`](./fragment-container.html) 回傳一個基本的 container，它不能抓取沒有宣告在它的  fragment 的資料。不過 Relay Modern 也有提供更進階的 container 來滿足動態的使用案例 (先前在 Relay Classic 是藉由 `setVariables` 處理)：

#### Refetching Data (又稱作「See More」)

[`createRefetchContainer`](./refetch-container.html) 是一個 `createFragmentContainer` 的變種，它解決了「see more」的使用案例，一開始的時候只 render 一部分的資料，然後其餘的資料會依需求去抓取。Refetch container 一開始會像 fragment container 一樣抓資料給它們的 fragment，不過它也提供一個 `refetch()` 方法，藉由它可以抓取額外的資料，或是使用不同的變數讓 container 可以被重新 render 以讀取資料。

### Pagination Container

它是泛用的 refetch container 的一種特化，為了藉由接續地抓取更多頁的資料來分頁瀏覽一堆東西而專門設計，這是個常見的情境。查看 [`createPaginationContainer`](./pagination-container.html) 以了解細節。

### Query Renderer

[`QueryRenderer`](./query-renderer.html) 管理 GraphQL query 的執行。它傳送 query 以及給定的變數，解析回應，把資料儲存到內部快取，並在最後 renders view。

### Relay Environment

[Relay Environment](./environment.html) 的實例封裝了一份 GraphQL 資料的記憶體內快取，以及一個提供存取 GraphQL 伺服器 的 network layer。這個 Environment 物件通常不會直接被開發者使用，而它會被傳遞到每一個 [`QueryRenderer`](./query-renderer.html) 去，用來存取、調整，並抓取資料。在 container 裡面，可以藉由 `this.props.relay.environment` 存取當下的 environment。這最常被用來[執行 mutation](./mutations.html)。

### Network layer

在建立 Relay Environment 的實例時，應用程式必須提供一個 [Network Layer](./network-layer.html)。這個 network layer 是一個符合簡單介面的物件，透過它 Relay 就可以執行 query、mutation、以及 subscription。基本上，這個物件告訴 Relay 要如何跟 GraphQL 伺服器溝通。

## Workflow

新 API 背後的重要概念之一是，可以藉由預先處理讓執行變得更有效率得多：把工作從應用程式的執行期移到編譯期。因此，改變 GraphQL fragment 之後需要一個建制步驟來重新產生一組的產物。更多資訊請參考 [Relay Compiler](./relay-compiler.html)。

## 比較 Relay Classic 與 Relay Modern

Relay Modern 實現了許多的新功能。有一些可以藉由 Compat API 取用，而其他則需要升級到完整的 Modern 執行期。查看 [Relay Modern 有什麼新東西](./new-in-relay-modern.html) 來了解細節。
