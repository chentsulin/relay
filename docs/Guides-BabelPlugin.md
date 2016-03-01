---
id: guides-babel-plugin
title: Babel Relay Plugin
layout: docs
category: Guides
permalink: docs/guides-babel-plugin.html
next: graphql-relay-specification
---

Relay 使用 **babel** plugin 來把 `Relay.QL` 字串模板轉換成
描述每個 query 並從 GraphQL schema 載入資料的
JavaScript 程式碼。

當你像下面這樣輸入 queries：

```
Relay.QL`
  fragment on User {
    # ...
  }
`
```

這個會被轉換成一個立即調用函式：

```
(function() {
  // 回傳這個 query 的描述 ...
})();
```

## 用法

現在要上手最簡單的方式是使用 [Relay Starter Kit](https://github.com/facebook/relay-starter-kit) - 這裡面包含一個範例 schema 檔並設定好了 [`babel-relay-plugin`](https://www.npmjs.com/package/babel-relay-plugin) npm 模組來 transpile queries。

## 進階用法

如果你不是使用 starter kit，你會需要設定 `babel` 以使用 `babel-relay-plugin`。步驟如下：

```javascript
// `babel-relay-plugin` 回傳一個用來建立 plugin 實體的函式
var getBabelRelayPlugin = require('babel-relay-plugin');

// 載入先前儲存的 schema 資料 (參閱下面的「Schema JSON」)
var schemaData = require('schema.json');

// 建立一個 plugin 實體
var plugin = getBabelRelayPlugin(schemaData);

// 藉由 babel 使用 plugin 來編譯程式碼
return babel.transform(source, {
  plugins: [plugin],
});
```

## Schema JSON

這個 plugin 需要了解你的 schema - 也就是上面片段中的 `schemaData`。有兩個方式可以得到這個資訊，取決於 GraphQL 的實作。

### 使用 `graphql`

如何載入 `schema.js` 檔，執行 introspection query 來得到 schema 資訊，並把它存成一個 JSON 檔的範例可以在 [starter kit](https://github.com/relayjs/relay-starter-kit/blob/master/scripts/updateSchema.js) 中找到。

### 使用其他的 GraphQL 實作

如果你是使用不同的 GraphQL 伺服器實作，我們建議調整上面的範例成從你的 GraphQL 伺服器載入 schema (例如，藉由一個 HTTP 請求) 並接著把結果存成 JSON。


## 額外的選項

`babel-relay-plugin` 預設會捕捉 GraphQL 驗證錯誤並印出它們而不會退出程序。編譯後的程式碼也會在執行期 throw 一樣的錯誤，讓它無論你是看 terminal 還是瀏覽器 console 都很明顯有東西出問題了。

當在為產品環境部署變異程式碼時，這個 plugin 可以設定成遇到驗證問題時立刻 throw：

```javascript
var plugin = getBabelRelayPlugin(schemaData, {
  abortOnError: true,
});
```
