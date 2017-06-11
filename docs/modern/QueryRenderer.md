---
id: query-renderer
title: QueryRenderer
layout: docs
category: Relay Modern
permalink: docs/query-renderer.html
next: fragment-container
---

`QueryRenderer` 是 Relay tree 的根部。它取得一個 query、抓取資料、並帶著資料呼叫 `render` callback。

A `QueryRenderer` is a React component, so it can be rendered anywhere that a React component can be rendered, not just at the top level. A `QueryRenderer` can be rendered *within* other Relay components, for example to lazily fetch additional data for a popover. However, a `QueryRenderer` will not start loading its data until it is mounted, so nested `QueryRenderer` components can lead to avoidable request waterfalls if used unnecessarily.

```
const {
  QueryRenderer,
  graphql,
} = require('react-relay'); // 或是為了相容使用 require('react-relay/compat')

// 在某個地方用 React Render 這個：
<QueryRenderer
  environment={environment}
  query={graphql`
    query ExampleQuery($pageID: ID!) {
      page(id: $pageID) {
        name
      }
    }
  `}
  variables={{
    pageID: '110798995619330',
  }}
  render={({error, props}) => {
    if (error) {
      return <div>{error.message}</div>;
    } else if (props) {
      return <div>{props.page.name} is great!</div>;
    }
    return <div>Loading</div>;
  }}
/>
```

### Query 命名慣例

為了實現[相容模式](./relay-compat.html)，`relay-compiler` 強制你的 query 必須遵守一個簡單命名慣例。Query 必須命名成 `<FileName><OperationType>`，而 "<OperationType>" 是「Query」、「Mutation」、或是「Subscription」的其中一個。上面的 query 命名成 `ExampleQuery`，所以應該被放在 `Example.js`.
