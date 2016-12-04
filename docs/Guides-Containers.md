---
id: guides-containers
title: Containers
layout: docs
category: Guides
permalink: docs/guides-containers.html
next: guides-routes
---

主要宣告資料需求的方式是藉由 `Relay.Container` — 一個讓 React component 把它們的資料需求編碼的 higher-order React component。

跟 React component 的 `render` 方法不直接去改動原生的 view 類似，Relay container 也不直接抓取資料。作為替代，container 宣告一份 render 需要的資料*規格*。Relay 來保證這份資料在 render *之前*可以使用。

## 完整的範例

一開始，讓我們來建構一個一般 React 版本的 `<ProfilePicture>` component，它顯示 user 的 profile photo 和一個調整 photo 的 size 用的 slider。

### 基本的 React Component
這是一個 `<ProfilePicture>` 的基本實作，它為了聚焦在功能而忽略了樣式：

```
class ProfilePicture extends React.Component {
  render() {
    // 預期 `user` prop 會有以下的形狀：
    // {
    //   profilePhoto: {
    //     uri,
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
    // 待完成：針對給定的 size 抓取 profile photo 的 URI ...
  }
}
```

### 使用 GraphQL 來處理資料依賴關係

在 Relay 中，使用 [GraphQL](https://github.com/facebook/graphql) 來描述資料依賴關係。以 `<ProfilePicture>` 來說，依賴關係可以像下面那樣表示。注意，這正好符合這個 component 預期的 `user` prop 形狀。

```
Relay.QL`
  # 這個 fragment 僅適用於 type 'User' 的物件。
  fragment on User {
    # 把 'size' 參數設定成一個命名成 '$size' 的 GraphQL 變數，如此以來我們可以
    # 在之後藉由 slider 改變它的值。
    profilePhoto(size: $size) {
      # 針對指定的 size 取得相應的 URI，例如在 CDN 上。
      uri,
    },
  }
`
```

### Relay Container

已經有了一般的 React component 和一個 GraphQL fragment，我們現在可以定義一個 `Container` 來告訴 Relay 這個 component 的資料需求。讓我們先看一下程式碼並接著看看會發生什麼事：

```
class ProfilePicture extends React.Component {/* 同上 */}

// Export 一個包裝了原始 `<ProfilePicture>` 的*新* React component。
module.exports = Relay.createContainer(ProfilePicture, {
	// 指定 `$size` 變數的初始值。
	initialVariables: {
		size: 32
	},
	// 我們為每一個倚靠伺服器資料的 props，在 `fragments` 裡
	// 定義一個對應的 key。在這裡，這個 component 預期伺服器的資料會填進
	// `user` prop，因此我們把上面的 fragment 指定為 `fragments.user`。
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

Relay container 是 higher-order component — `Relay.createContainer` 是一個接收一個 React component 作為 input 並回傳一個新的 component 作為 output 的 function。這意味著這些 container 可以管理資料抓取和解析的邏輯而不用干擾內部 component 的 `state`。

下面是當 container 被 render 時會發生的事情：

<div class="diagram">
	<img src="/relay/img/Guides-Containers-HOC-Relay.png" title="Relay Containers" />
</div>

在上面的圖中：

- 會有一個指向某 `User`「record」的參考被傳遞進去 parent component。
- 這個 container — 被命名成 `Relay(ProfilePicture)` 以便於除錯 — 將會從本地的 store 為每一個 GraphQL fragment 取得回應。
- 這個 container 會把每一個 fragment 的結果 (連同其他的 props) 傳遞到 `<ProfilePicture>` component。
- `<ProfilePicture>` 接收一個是一般 JavaScript 資料的 `user` prop
- 物件、陣列、字串 - 並如往常一般 render。

## 請求不同的資料

在上面的範例還剩下一件事沒做 — 實作 `setSize()`，它應該要在 slider 的值改變時改變 photo 的 size。除了把每一個 query 的結果傳遞到 component 之外，Relay 也提供一個 `relay` prop，它有 Relay 專用的方法和 metadata。這包括 `variables` — 用來抓取當下 `props` 的變數 — 以及 `setVariables()` — 一個可以被用來請求不同變數值的資料的 callback。

```{5-6,11,26-28}
class ProfilePicture extends React.Component {
	render() {
		// 存取用 `user` fragment 解析出來的資料。
		var user = this.props.user;
		// 存取當下被用來抓取 `user` 的 `variables`。
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
		// `setVariables()` 告訴 Relay 這個 component 的資料需求已經
		// 改變。`props.relay.variables` 和 `props.user` 的值會
		// 持續反映它們先前的值直到新變數的資料
		// 已經從伺服器抓取回來。一旦新變數的資料可以使用
		// ，這個 component 會立刻用更新後的
		// `user` prop 和 `variables.size` 重新 render。
		this.props.relay.setVariables({
			size: photoSize,
		});
	}
}
```

## Container 合成

React 和 Relay 透過*合成*來支援建立任意複雜的應用程式。可以藉由合成比較小的 component 來建立比較大的 component，幫助我們建立模組化、強健的應用程式。在 Relay 中，合成 component 有兩個方面：

- 合成 view 的邏輯，並
- 合成資料描述。

讓我們藉由組合了上面的 `<ProfilePicture>` 的 `<Profile>` component 來探索這是如何運作的。

### 合成 View - 這是一般的 React

View 合成*就是*你已經習慣的東西 — Relay container 是標準的 React component。以下是 `<Profile>` component：

```{8-9}
class Profile extends React.Component {
	render() {
		// 預期一個有 `name` 字串的 `user`，以及要給 `<ProfilePicture>`
		// 的資訊 (我們會在接下來取得它)。
		var user = this.props.user;
		return (
			<View>
				{/* 它就像一個 React component 一般運作，因為它就是一個 React component！ */}
				<ProfilePicture user={user} />
				<Text>{user.name}</Text>
			</View>
		);
	}
}
```

### 合成 Fragment

Fragment 的合成也很類似 — parent container 的 fragment 合成了它每一個 children 的 fragment。在這個範例中，`<Profile>` 需要抓取 `<ProfilePicture>` 需要的 `User` 相關資訊。

Relay container 提供一個 static 的 `getFragment()` 方法，它回傳一個指向 component 的 fragment 的參考：

```{15}
class Profile extends React.Component {/* 同上 */}

module.exports = Relay.createContainer(Profile, {
<<<<<<< HEAD
	fragments: {
		// 這個 `user` fragment 名稱對應到命名成 prop `user` 的 prop，
		// 這預計會藉由 `<Profile>` component 填入伺服器的資料。
		user: () => Relay.QL`
			fragment on User {
				# 指定 '<Profile>' 本身需要的任何欄位。
				name,

				# 包含一個指向 child component 的 fragment 的參考。在這裡，
				# 'user' 是被指定在 child '<ProfilePicture>' 的 'fragments' 定義中
				# 的 fragment 名稱。
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

注意，在合成 fragment 時，被合成的 fragment 的 type 必須符合嵌入它的 parent 上的欄位。例如，把一個 type `Story` 的 fragment 嵌入 parent 的一個 type `User` 的欄位並沒有意義。Relay 和 GraphQL 會提供有幫助的錯誤訊息，如果你犯了這個錯誤 (而且錯誤訊息沒有幫助，請讓我們知道！)。

## Render Container

正如我們已經學過的，Relay container 把資料需求宣告成 GraphQL fragment。這意味著，舉例來說，`<ProfilePicture>` 不只是可以被嵌在 `<Profile>` 裡，也可以嵌在任何有抓取 type `User` 欄位的 container。

我們差不多準備好要讓 Relay 滿足這些 component 的資料需求並 render 它們了。不過，有一個問題。要實際的使用 GraphQL 抓取資料，我們需要一個 query root。例如，我們需要把 `<Profile>` fragment 建立在一個具體的 type `User` 的 node 上。

在 Relay 中，一個 query 的 root 是由 **Route** 來定義。請繼續學習有關 Relay 的 routes。
