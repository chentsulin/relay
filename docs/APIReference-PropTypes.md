---
id: api-reference-relay-proptypes
title: Relay.PropTypes
layout: docs
category: API Reference
permalink: docs/api-reference-relay-proptypes.html
next: api-reference-relay-store
---

Relay 導入兩個新物件的 class：`RelayContainer` 和 `Relay.Route`。`Relay.PropTypes` 提供用來 assert props 是這些 types 的 prop 驗證器。

## 概觀

*屬性*

<ul class="apiIndex">
  <li>
    <a href="#example">
      <pre>static Container: ReactPropTypeValidator</pre>
      一個用來 assert prop 是一個有效的 Relay container 的 prop type 驗證器。
    </a>
  </li>
  <li>
    <a href="#example">
      <pre>static QueryConfig: ReactPropTypeValidator</pre>
      一個用來 assert prop 是一個有效的 route 的 prop type 驗證器。
    </a>
  </li>
</ul>

## 範例

```
class MyApplication extends React.Component {
  static propTypes = {
    // 如果 `Component` 不是一個有效的 RelayContainer 則丟出警告。
    Component: Relay.PropTypes.Container.isRequired,
    // 如果 `route` 不是一個有效的 route 則丟出警告。
    route: Relay.PropTypes.QueryConfig.isRequired,
  };
  render() {
    return (
      <Relay.RootContainer
        Component={this.props.Component}
        route={this.props.route}
      />
    );
  }
}
```
