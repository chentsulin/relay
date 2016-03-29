---
id: guides-containers
title: Containers
layout: docs
category: Guides
permalink: docs/guides-containers.html
next: guides-routes
---

宣告資料需求的主要方式是藉由 `Relay.Container` — 一個讓 React component 把它們的資料需求編碼的 higher-order React component。

跟 React component 的 `render` 方法不直接改動原生的 view 類似，Relay container 不直接抓取資料。作為替代，container 宣告一份 render 需要的資料*規格*。Relay 保證這份資料在 render *之前*可以使用。

## 完整的範例

開頭，讓我們來建構一個一般 React 版本的 `<ProfilePicture>` component，它顯示 user 的 profile photo 和一個調整 photo 的 size 用的 slider。

### 基本的 React Component
這是一個 `<ProfilePicture>` 的基本實作，它為了聚焦在功能忽略了樣式：

```
class ProfilePicture extends React.Component {
  render() {
    // 預期 `user` prop 會有以下的形狀：
    // {
    //   profilePhoto: {
    //     uri,
    //     size
    //   }
    // }
    var user = this.props.user;
    return (
      <View>
        <Image uri={user.profilePhoto.uri} width={...} />
        <Slider onChange={value => this.setSize(value)} />
      </View>
    );
  }

  // 更新 photo 的 size
  setSize(photoSize) {
    // TODO：抓取 profile photo URI for the 給定的 size...
  }
}
```

### Data Dependencies With GraphQL

在 Relay 中，使用 [GraphQL](https://github.com/facebook/graphql) 來描述資料依賴關係。For `<ProfilePicture>`，the dependency can be expressed as follows。Note that this exactly matches the shape that the component expected for the `user` prop。

```
Relay.QL`
  # 這個 fragment only applies to objects of type `User`。
  fragment on User {
    # Set the `size` argument to a GraphQL variable named `$size` so that we can
    # later change its value via the slider.
    profilePhoto(size: $size) {
      # Get the appropriate URI for the given size, for example on a CDN.
      uri,
    },
  }
`
```

### Relay Containers

Given the plain React component and a GraphQL fragment，我們現在可以定義一個 `Container` 來告訴 Relay 這個 component 的資料需求。讓我們先看一下程式碼並接著看看發生什麼事：

```
class ProfilePicture extends React.Component {/* 同上 */}

// Export 一個包裝了原始的 `<ProfilePicture>` 的*新* React component。
module.exports = Relay.createContainer(ProfilePicture, {
  // 指定 `$size` 變數的初始值。
  initialVariables: {
    size: 32
  },
  // For each of the props that depend on server data，我們在 `fragments` 裡
  // 定義一個 corresponding key。Here, the component expects server data to populate the
  // `user` prop, so we'll specify the fragment from above as `fragments.user`。
  fragments: {
    user: () => Relay.QL`
      fragment on User {
        profilePhoto(size: $size) {
          uri,
        },
      }
    `,
  },
});
```

## Container 是 Higher-Order Component

Relay container 是 higher-order component — `Relay.createContainer` 是一個接收一個 React component 作為 input 並回傳一個新的 component 作為 output 的 function。This means that the container can manage data fetching and resolution logic without interfering with the `state` of the inner component。

下面是當 container 被 render 時會發生的事情：

<div class="diagram">
  <img src="/relay/img/Guides-Containers-HOC-Relay.png" title="Relay Containers" />
</div>

在上面的圖中：

- A parent component will pass in a reference to some `User`「record」。
- The container — named `Relay(ProfilePicture)` for debugging — will retrieve the response for each GraphQL fragment from the local store。
- The container passes the results of each fragment (along with the other props) to the `<ProfilePicture>` component。
- `<ProfilePicture>` receives a `user` prop with plain JavaScript data - objects, arrays, strings - and renders as usual。

## Requesting Different Data

One thing is left in the example above — implementing `setSize()`, which should change the photo's size when the slider values changes。In addition to passing the results of each query to the component, Relay also provides a `relay` prop that has Relay-specific methods and metadata。These include `variables` — the active variables used to fetch the current `props` — and `setVariables()` — a callback that can be used to request data for different variable values。

```{5-6,11,26-28}
class ProfilePicture extends React.Component {
  render() {
    // 存取 the resolved data for the `user` fragment.
    var user = this.props.user;
    // 存取 the current `variables` that were used to fetch the `user`.
    var variables = this.props.relay.variables;
    return (
      <View>
        <Image
          uri={user.profilePhoto.uri}
          width={variables.size}
        />
        <Slider onChange={value => this.setSize(value)} />
      </View>
    );
  }

  // 更新 photo 的 size。
  setSize(photoSize) {
    // `setVariables()` tells Relay that the component's data requirements have
    // changed. The value of `props.relay.variables` and `props.user` will
    // continue to reflect their previous values until the data for the new
    // variables has been fetched from the server. As soon as data for the new
    // variables becomes available, the component will re-render with an updated
    // `user` prop and `variables.size`.
    this.props.relay.setVariables({
      size: photoSize,
    });
  }
}
```

## Container Composition

React and Relay support creating arbitrarily 複雜的應用程式 through *composition*。Larger components can be created by composing smaller components, 幫助我們建立 modular, robust 的應用程式。There are two aspects to composing components in Relay:

- Composing the view logic, and
- Composing the data descriptions.

Let's explore how this works via a `<Profile>` component that composes the `<ProfilePicture>` from above.

### Composing Views - It's Plain React

View composition is *exactly* what you're used to — Relay container 是標準的 React component。Here's the `<Profile>` component：

```{8-9}
class Profile extends React.Component {
  render() {
    // Expects a `user` with a 字串 `name`, as well as the information
    // for `<ProfilePicture>` (we'll get that next).
    var user = this.props.user;
    return (
      <View>
        {/* It works just like a React component，because it is one！ */}
        <ProfilePicture user={user} />
        <Text>{user.name}</Text>
      </View>
    );
  }
}
```

### Composing Fragments

Fragment composition works similarly — a parent container's fragment composes the fragment for each of its children。In this case, `<Profile>` needs to fetch information about the `User` that is required by `<ProfilePicture>`。

Relay container 提供一個 static 的 `getFragment()` 方法，它回傳一個指向 component 的 fragment 的參考：

```{15}
class Profile extends React.Component {/* 同上 */}

module.exports = Relay.createContainer(Profile, {
  fragments: {
    // This `user` fragment name corresponds to the prop named `user` that is
    // expected to be populated with server data by the `<Profile>` component。
    user: () => Relay.QL`
      fragment on User {
        # Specify any fields required by `<Profile>` itself。
        name,

        # Include a reference to the fragment from the child component。Here,
        # the `user` is the name of the fragment specified on the child
        # `<ProfilePicture>`'s `fragments` definition。
        ${ProfilePicture.getFragment('user')},
      }
    `,
  }
});
```

這最後的資料宣告等同於以下的一般 GraphQL：

```
`
  fragment Profile on User {
    name,
    ...ProfilePhoto,
  }

  fragment ProfilePhoto on User {
    profilePhoto(size: $size) {
      uri,
    },
  }
`
```

Note that when composing fragments, the type of the composed fragment must match the field on the parent in which it is embedded。For example, it wouldn't make sense to embed a fragment of type `Story` into a parent's field of type `User`。Relay 和 GraphQL 回提供有幫助的錯誤訊息 if you get this wrong (and if they aren't helpful，請讓我們知道！)。

## Rendering Containers

As we've learned，Relay container 把資料需求宣告成 GraphQL fragment。這意味著，舉例來說，`<ProfilePicture>` 不只是可以被嵌在 `<Profile>` 裡，也可以嵌在任何 fetches a field of type `User` 的 container。

We're almost ready to let Relay fulfill the data requirements for these components and render them。However, there is one problem。In order to actually fetch data with GraphQL, we need a query root。For example, we need to ground the `<Profile>` fragment in a concrete node of type `User`。

In Relay, the root of a query is defined by a **Route**。Continue to learn about Relay routes。
