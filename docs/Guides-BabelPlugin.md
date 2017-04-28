---
id: guides-babel-plugin
title: Babel Relay Plugin
layout: docs
category: Relay Classic Guides
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

現在要上手最簡單的方式是使用 [Relay Starter Kit](https://github.com/relayjs/relay-starter-kit) - 這裡面包含一個範例 schema 檔並設定好了 [`babel-relay-plugin`](https://www.npmjs.com/package/babel-relay-plugin) npm 模組來編譯 query。

### 設定 React Native

`babel-relay-plugin` 必須在 `react-native` Babel preset 之前執行。所以，在 `.babelrc` 中 `"react-native"` 必須放在 `babelRelayPlugin` 之後。

```javascript
{
  "plugins": [
    "./plugins/babelRelayPlugin"
  ],
  "presets": [
    "react-native"
  ]
}
```

原因是如果 `babel-relay-plugin` 沒有在 `es2015-template-literals` transform 之前執行，它不會正確地轉換 Relay.QL template literals。而且在 Babel 6，你不能控制 plugin 的順序。所以在 React Native 中，它的 `.babelrc` 中的 plugins 會在專案的 `.babelrc` 之前載入，要不複寫整個 transform 清單而使用 Babel Relay Plugin 是不可能的。


## 進階用法

如果你不是使用 starter kit，你會需要設定 `babel` 以使用 `babel-relay-plugin`。步驟如下：

```javascript
// `babel-relay-plugin` 回傳一個用來建立 plugin 實體的函式
const getBabelRelayPlugin = require('babel-relay-plugin');

// 載入先前儲存的 schema 資料 (參閱下面的「Schema JSON」)
const schemaData = require('schema.json');

// 建立一個 plugin 實體
const plugin = getBabelRelayPlugin(schemaData);

// 藉由 babel 使用 plugin 來編譯程式碼
return babel.transform(source, {
  plugins: [plugin],
});
```

## Schema JSON

這個 plugin 需要了解你的 schema - 也就是上面片段中的 `schemaData`。有兩個方式可以得到這個資訊，取決於 GraphQL 的實作。

### 使用 `graphql`

使用 `introspectionQuery` 來產生一份 Schema JSON 給 Babel Relay Plugin，並使用 `printSchema` 來產生一份使用者可讀的 type system shorthand：

```javascript
import fs from 'fs';
import path from 'path';
import {graphql}  from 'graphql';
import {introspectionQuery, printSchema} from 'graphql/utilities';

// 假設你的 schema 放在 ../data/schema
import {schema} from '../data/schema';
const yourSchemaPath = path.join(__dirname, '../data/schema');

// 儲存整個 schema introspection 的 JSON 讓 Babel Relay Plugin 去使用
graphql(schema, introspectionQuery).then(result => {
  fs.writeFileSync(
    `${yourSchemaPath}.json`,
    JSON.stringify(result, null, 2)
  );
});

// 儲存使用者可讀的 schema 的 type system shorthand
fs.writeFileSync(
  `${yourSchemaPath}.graphql`,
  printSchema(schema)
);
```

關於如何載入 `schema.js` 檔，執行 introspection query 來得到 schema 資訊，並把它存成一個 JSON 檔的完整範例，請查看 [starter kit](https://github.com/relayjs/relay-starter-kit/blob/master/scripts/updateSchema.js)。

### 使用其他的 GraphQL 實作

如果你是使用不同的 GraphQL 伺服器實作，我們建議調整上面的範例成從你的 GraphQL 伺服器載入 schema (例如，藉由一個 HTTP 請求) 並接著把結果存成 JSON。

使用 `fetch` 的範例如下：

```javascript
const fetch = require('node-fetch');
const fs = require('fs');
const {
  buildClientSchema,
  introspectionQuery,
  printSchema,
} = require('graphql/utilities');
const path = require('path');
const schemaPath = path.join(__dirname, 'schema');

const SERVER = 'http://example.com/graphql';

// 把完整的 schema introspection 存成 JSON 給 Babel Relay Plugin 使用
fetch(SERVER, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({'query': introspectionQuery}),
}).then(res => res.json()).then(schemaJSON => {
  fs.writeFileSync(
    `${schemaPath}.json`,
    JSON.stringify(schemaJSON, null, 2)
  );

  // 儲存使用者可讀的 schema 類型系統縮寫
  const graphQLSchema = buildClientSchema(schemaJSON.data);
  fs.writeFileSync(
    `${schemaPath}.graphql`,
    printSchema(graphQLSchema)
  );
});
```

## 額外的選項

`babel-relay-plugin` 預設會捕捉 GraphQL 驗證錯誤並印出它們而不會退出程序。編譯後的程式碼也會在執行期 throw 一樣的錯誤，讓它無論你是看 terminal 還是瀏覽器 console 都很明顯有東西出問題了。

當在為產品環境部署編譯程式碼時，這個 plugin 可以設定成遇到驗證問題時立刻 throw。這個 plugin 可以更進一步用以下選項為不同的環境客製化：

```javascript
babel.transform(source, {
  plugins: [
    [getBabelRelayPlugin(schemaData, {
      // 只有 `enforceSchema` 是 `false` 而且 `debug` 是 `true` 時，
      // 會在建置期間印出驗證錯誤。
      debug: false,
      // 隱藏所有會被印出的警告 。
      suppressWarnings: false,
      // 可以添加自訂的 validator。
      // 提供規則覆寫預設，並忽略預設的規則。
      validator: {
        validate(schema, ast) {
          // 回傳一個 `Error` 實體的陣列。
          return [];
        },
      },
      // 當它在建置期間驗證 queries 時會拋出錯誤。
      enforceSchema: true,
    })],
  ],
});
```
