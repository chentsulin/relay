---
id: babel-plugin-relay
title: babel-plugin-relay
layout: docs
category: Relay Modern
permalink: docs/babel-plugin-relay.html
next: relay-compiler
---

Relay 使用 **Babel** plugin 來把 `graphql` literal 轉換成 Relay Compiler 產生出來的程式碼 require。

當你寫下了以下的 query：

```javascript
graphql`
  fragment MyComponent on Type {
    field
  }
`
```

這會被轉換成生成檔案的「延遲」require：

```javascript
function () {
  return require('./__generated__/MyComponent.graphql');
}
```


### 設定 babel-plugin-relay

首先，安裝這個 plugin (通常安裝為 `devDependency`)：

```sh
yarn add --dev babel-plugin-relay
```

然後，把 `"relay"` 添加到 .babelrc 檔案的 plugins 清單中。例如：

```javascript
{
  "plugins": [
    "relay"
  ]
}
```

請記得 `"relay"` plugin 必須在其他的 plugin 或 preset 之前執行來確保 `graphql` template literal 被正確地轉換。查看 Babel [關於這個主題的文件](https://babeljs.io/docs/plugins/#plugin-preset-ordering)。


### 與 Relay Classic 一起使用

加上一些額外的設定，`"relay"` babel plugin 也可以轉換 Relay Classic `Relay.QL` literal。最重要的是，要加上 json 檔或 graphql schema 檔的 GraphQL Schema 參考位置。

```javascript
{
  "plugins": [
    ["relay", {"schema": "path/schema.graphql"}]
  ]
}
```

請記得，這取代了[舊的 Babel Relay plugin](./guides-babel-plugin.html)。不需要把兩個 plugin 都加進來。


### 在「[相容模式](./relay-compat.html)」轉換期間使用

在漸進式地把 Relay Classic 應用程式轉換到 Relay Modern 時，如果設定使用相容模式，`graphql` literal 可以被轉換並*同時*讓兩種執行期使用：

```javascript
{
  "plugins": [
    ["relay", {"compat": true, "schema": "path/schema.graphql"}]
  ]
}
```

### 額外的選項

Relay Classic 和 Relay Compat 模式會把生成的內容放到行內，抓到並印出任何偵測到的 GraphQL 驗證錯誤，讓這些錯誤在執行期才被拋出。

當在編譯程式碼給 production 環境部署用時，這個 plugin 可以設定成在遇到一個驗證問題時立刻拋出錯誤。這個 plugin 可以利用下面的選項更近一步的為不同環境客製化：

```javascript
{
  "plugins": [
    ["relay", {
      "compat": true,
      "schema": "path/schema.graphql",

      // 在編譯期間驗證 query 時拋出錯誤。
      "enforceSchema": true,

      // 隱藏所有會被印出來的警告。
      "suppressWarnings": false,

      // 如果 `enforceSchema` 是 `false` 而且 `debug` 是 `true`，
      // 在編譯期間驗證的錯誤會被印出來。
      "debug": false,
    }]
  ]
}
```
