---
id: relay-debugging
title: Debugging
layout: docs
category: Relay Modern
permalink: docs/relay-debugging.html
next: relay-compat
---

當出現問題時，開發者會需要深入了解 Relay 的 store。Relay 提供幾個工具利用編寫程式來檢閱 store 以及它裡面的 record。

這些功能可以被用在幾個常見的情境：紀錄客戶端的 state 供以後檢查，或是從你的瀏覽器的除錯器去互動式的摸索 store。

## 簡單範例

在這個範例中，基於跟傳遞進去 [Relay Environment](./relay-environment.html) 一樣的 source 建立一個 inspector 物件。這之後你可以使用這個 inspector 物件去檢閱 record。Inspector 只能在 development build 取用。

```javascript
const {
  RecordSource,
  Store,
  RecordSourceInspector,
} = require('relay-runtime');

const source = new RecordSource();
const store = new Store(source);
const inspector = new RecordSourceInspector(source);

inspector.getNodes(); // 所有有 id 的 record
inspector.getRecords(); // 所有有 id 或沒 id 的 record
inspector.get("<recordId>").inspect(); // record 以及它的欄位
```
