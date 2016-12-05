---
id: api-reference-relay-ql
title: Relay.QL
layout: docs
category: API Reference
permalink: docs/api-reference-relay-ql.html
next: api-reference-relay-mutation
---

Relay fragment、mutation、和 query 必須使用 ES6 template literal 以 `Relay.QL` 做標記來指定。例如：

```
var fragment = Relay.QL`
	fragment on User {
		name
	}
`;
```

要執行這段程式碼，Relay 需要存取 schema - 它可能會太大而無法 bundle 到應用程式裡。作為替代，我們 藉由 `babel-relay-plugin` 把這些 `Relay.QL` template expressions 編譯成 JavaScript 描述。這份 schema 資訊讓 Relay 了解像是欄位參數的 type、哪一個欄位是 connection 或是 list，還有如何有效地從伺服器重新抓取 record 等等。

## 相關的 API

`Relay.QL` 物件被以下的 API 使用：

<ul class="apiIndex">
	<li>
		<pre>() => Relay.QL`fragment on ...`</pre>
		指定一個 `Relay.Container` 的資料依賴關係為 GraphQL fragment。
	</li>
	<li>
		<pre>(Component) => Relay.QL`query ...`</pre>
		指定一個 `Relay.Route` 的 query。
	</li>
	<li>
		<pre>Relay.QL`mutation { fieldName }`</pre>
		在一個 `Relay.Mutation` 中指定 mutation 欄位。
	</li>
	<li>
		<pre>var fragment = Relay.QL`fragment on ...`;</pre>
		可以在上述的使用案例內合成的可重用的 fragment。
	</li>
</ul>


## Fragment 的合成

可以用兩者之一的方式來合成 Fragment：

- 在 parent fragment 合成 child component 的 fragment。
- 合成被定義為區域變數的 fragment。

### Container.getFragment()

合成 child component 的 fragment 在 [Containers Guide](guides-containers.html) 中有被詳細的討論，不過這裡有一個簡單的例子：

```{5}
Relay.createContainer(Foo, {
	fragments: {
		bar: () => Relay.QL`
			fragment on Bar {
				${ChildComponent.getFragment('childFragmentName')},
			}
		`,
	}
});
```

### Inline Fragments

Fragment 也可以合成其他被指定給區域變數的 fragment：

```{3-7,14,21}
// 一個 inline fragment - 在小量使用時很有用，不過最好不要在 module 之間
// 共享。
var userFragment = Relay.QL`
	fragment on User {
		name,
	}
`;
Relay.createContainer(Story, {
	fragments: {
		bar: () => Relay.QL`
			fragment on Story {
				author {
					# 抓取有關於這個 story 的 author 的一樣資訊 ...
					${userFragment},
				},
				comments {
					edges {
						node {
							author {
								# ... 以及 comments 的 author。
								${userFragment},
							},
						},
					},
				},
			}
		`,
	}
});
```

注意，*強烈*建議 `Relay.Container` 定義它們自己的 fragment 並避免在 container 或是檔案之間共享 inline `var fragment = Relay.QL...` 的值。如果你發現自己想要共享 inline fragment，這可能是一個信號表示是時候重構並引入一個新的 container 了。

### 條件式欄位

你可以根據一個 boolean 變數的值條件式的 include 或 skip 一個欄位。

```{4,9}
Relay.createContainer(Story, {
	initialVariables: {
		numCommentsToShow: 10,
		showComments: false,
	},
	fragments: {
		story: (variables) => Relay.QL`
			fragment on Story {
				comments(first: $numCommentsToShow) @include(if: $showComments) {
					edges {
						node {
							author { name },
							id,
							text,
						},
					},
				},
			}
		`,
	}
});
```

如果反面的語法可以讓你感覺更好，那你可以使用 `@skip(if: ...)` 來取代 `@include(if: ...)`。

### 陣列欄位

為了把 fragment 解析成物件的陣列，你必須使用 `@relay(plural: true)` directive。

這將會告知 `Relay.QL`，這個欄位是一個陣列。這也會讓你能對 fragment 使用複數的命名 (例如：`bars` 而不是 `bar`)。

```{4,9}
Relay.createContainer(Story, {
  fragments: {
    bars: () => Relay.QL`
      fragment on Bar @relay(plural: true) {
        id
        name
      }
    `,
  }
});
```

在 Relay Container 中 prop `bars` 會是一個陣列而不是物件。
