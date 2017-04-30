---
id: api-cheatsheet
title: API Cheatsheet
layout: docs
category: Relay Compat
permalink: docs/api-cheatsheet.html
next: guides-containers
---

這是 Relay Classic 跟 Relay Modern API 之間的轉換參考。

### 添加一個新的 root relay component

Classic：`<RelayRootContainer>`

Modern：`<QueryRenderer>`

### 添加一個新的 relay container

Classic：`Relay.createContainer`

Modern：`createFragmentContainer`

### 添加一個有變動資料需求的新 relay container

Classic：`Relay.createContainer`

Modern：`createRefetchContainer`

### 添加一個新的 paginating relay container

Classic：`Relay.createContainer`

Modern：`createPaginationContainer`

### 為 component 更新一個變數

Classic：`this.props.relay.setVariable({foo: bar}...)`

Modern：在 Refetch Container 理 `this.props.relay.refetch({foo: bar}...`

### 透過 connection 來 paginate

Classic：`this.props.relay.setVariable({count: prevCount + pageSize}...)`

Modern：在 Pagination Container 裡 `this.props.relay.loadMore(pageSize...)`

### 強制 fetch component

Classic：`this.props.relay.forceFetch()`

Modern：在 Pagination Container 裡 `this.props.relay.refetchConnection(...)`

或是：在 Refetch Container 裡 `this.props.relay.refetch({}, callback, {force: true})`

### 提交一個 mutation

Classic：`this.props.relay.commitUpdate(mutation...)`

Modern：`commitMutation(this.props.relay.environment, {mutation...})`
