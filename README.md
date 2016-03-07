# [Relay](https://facebook.github.io/relay/) [![Build Status](https://travis-ci.org/facebook/relay.svg)](https://travis-ci.org/facebook/relay) [![npm version](https://badge.fury.io/js/react-relay.svg)](http://badge.fury.io/js/react-relay)

Relay 是一個 JavaScript 框架，用來建置資料驅動的 React 應用程式。

* **Declarative：**不再使用 imperative API 來與你的資料 store 溝通。簡單地使用 GraphQL 宣告你的資料需求並讓 Relay 判斷要如何、何時去抓取你的資料。
* **Colocation：**Queries 就在依賴它們的 views 的旁邊，因此你可以更容易的思考你的應用程式。Relay 把 queries 聚合成高效率的網路請求來只抓取你需要的東西。
* **Mutations：**Relay 讓你使用 GraphQL mutation 在客戶端和伺服器上 mutate 資料，並提供自動化的資料一致性、樂觀更新和錯誤處理。

[學習如何在你自己的專案中使用 Relay。](https://facebook.github.io/relay/docs/getting-started.html)

## 範例

這個 repository 附帶一個 [TodoMVC](http://todomvc.com/) 的實作。請試著：

```
git clone https://github.com/facebook/relay.git
cd relay/examples/todo && npm install
npm start
```

接著，只要把你的瀏覽器指到 `http://localhost:3000`。

## 貢獻

我們積極的歡迎 pull request，學習如何[貢獻](./CONTRIBUTING.md)。

## 使用者

我們有一個[社群維護的清單](./USERS.md)，列出在產品環境中使用 Relay 的人和專案。

## 授權

Relay 是 [BSD 授權](./LICENSE)。我們也提供一個額外的[專利授權](./PATENTS)。
