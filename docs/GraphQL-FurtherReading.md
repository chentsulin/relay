---
id: graphql-further-reading
title: Further Reading
layout: docs
category: GraphQL
permalink: docs/graphql-further-reading.html
indent: true
next: api-reference-relay
---

這樣就完成了 GraphQL Relay Specifications 的概述。想要了解
Relay 相容的 GraphQL 伺服器的詳細要求，更正式的
[Relay cursor connection](../graphql/connections.htm) model、
[Relay global object identification](../graphql/objectidentification.htm)
model，還有 [Relay input object mutation](../graphql/mutations.htm)
的描述都可以取用。

想要看實作了 specification 的程式碼的話，
[GraphQL.js Relay library](https://github.com/graphql/graphql-relay-js) 提供
用來建立 nodes、connections 和 mutations 的 helper functions；那個
repository 的 [`__tests__`](https://github.com/graphql/graphql-relay-js/tree/master/src/__tests__)
資料夾包含一個前面範例的實作作為 repository 的整合測試。
