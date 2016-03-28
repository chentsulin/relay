---
id: thinking-in-graphql
title: Thinking in GraphQL
layout: docs
category: Quick Start
permalink: docs/thinking-in-graphql.html
next: thinking-in-relay
---

GraphQL 為客戶端提出了一個新的方式，藉由聚焦在產品開發者們和客戶端應用程式的需求去抓取資料。它提供一個方式給開發者們針對 view 指定精準的資料需求，並讓客戶端在單一的網路請求去抓取那些資料。與傳統的方法像是 REST 做比較，GraphQL 幫助應用程式更有效率地抓取資料 (相對於資源導向的 REST 方法) 並避免伺服器邏輯的重複 (可能會在客製化的 endpoint 發生)。此外，GraphQL 幫助開發者們解開產品程式碼和伺服器的邏輯之間的耦合。例如，產品可以抓取更多或更少的資訊而不需改變每一個相關的伺服器 endpoint。這是一個抓取資料的好方式。

在這篇文章，我們將會探索建置一個 GraphQL 客戶端框架意味著什麼，還有這如何與使用比較傳統的 REST 系統的客戶端做比較。在這個過程中，我們將會關注 Relay 背後的設計決策並看到它不只是一個 GraphQL 客戶端也是一個 *declarative 資料抓取*的框架。讓我們從頭開始並抓取一些資料！

## 抓取資料

想像我們有一個簡易的應用程式，它抓取一份 story 的清單，還有每個 story 的一些細節資訊。以下是它在資源導向 REST 中可能的樣貌：

```javascript
// 抓取 story IDs 的清單，但不包含它們的細節資訊：
rest.get('/stories').then(stories =>
	// 這 resolve 成有連結的資源項目清單：
	// `[ { href: "http://.../story/1" }, ... ]`
	Promise.all(stories.map(story =>
		rest.get(story.href) // 追蹤這些連結
	))
).then(stories => {
	// 這 resolve 成一個 story 項目的清單：
	// `[ { id: "...", text: "..." } ]`
	console.log(stories);
});
```

要注意這個方法需要送 *n+1* 個請求到伺服器：1 個抓取清單，其他 *n* 抓取每一個項目。藉著 GraphQL 我們可以在一個到伺服器的單一網路請求抓取一樣的資料 (不需要建立一個客製化而且接著需要去維護的 endpoint)：

```javascript
graphql.get(`query { stories { id, text } }`).then(
	stories => {
		// story 項目的清單：
		// `[ { id: "...", text: "..." } ]`
		console.log(stories);
	}
);
```

到目前為止，我們只是使用 GraphQL 作為一個比典型 REST 方法更有效率的版本。請記住在 GraphQL 的版本中有兩個重要的好處：

- 用一次往返抓取所有資料。
- 客戶端跟伺服器是解耦的：客戶端指定需要的資料而不是*依賴*伺服器 endpoint 回傳正確的資料。

對簡易的應用程式來說，這已經是個好的改進。

## 客戶端快取

重複地從伺服器重新抓取資訊可能會非常的慢。例如，從 story 的清單，換頁到清單中的一個項目，再回到 story 的清單意味著我們必須重新抓取整個清單。我們要解決這個問題，將會使用標準的解決方案：*快取*。

在一個資源導向 REST 系統中，我們可以基於 URI 維護一個**回應快取**：

```javascript
var _cache = new Map();
rest.get = uri => {
	if (!_cache.has(uri)) {
		_cache.set(uri, fetch(uri));
	}
	return _cache.get(uri);
};
```

回應快取也可以應用到 GraphQL 上。基本的方法會用與 REST 版本類似地方式運作。query 的 text 本身可以用來作為快取的鍵：

```javascript
var _cache = new Map();
graphql.get = queryText => {
	if (!_cache.has(queryText)) {
		_cache.set(queryText, fetchGraphQL(queryText));
	}
	return _cache.get(queryText);
};
```

現在，請求先前快取過的資料可以馬上回應而不需要建立網路請求。這是一個讓應用程式有察覺的到的效能提升的實用方法。不過，這種快取方法可能會導致資料一致性問題。

## 快取一致性

使用 GraphQL，數個 query 的結果會重疊非常常見。不過，從上面章節而來的回應快取並沒有考慮到這種重疊 — 它基於不同的 query 來做快取。舉例來說，如果我們發出一個 query 去抓取 stories：

```
query { stories { id, text, likeCount } }
```

並接著再之後重新抓取其中一個 story，而它的 `likeCount` 已經被增加：

```
query { story(id: "123") { id, text, likeCount } }
```

現在取決於這個 story 是如何被存取的，我們將會看到不同的 `likeCount`。使用第一個 query 的 view 將會看到一個過期的 count，而使用第二個 query 的 view 將會看到已更新的 count。

### 快取一個 Graph

快取 GraphQL 的解法是把階層式的回應正規化成一個扁平的 **record** 集合。Relay 實作這種快取為從 ID 映射到 record 的 map。每個 record 都是一個從欄位名稱映射到欄位值的 map。Record 也可以連結到其他 record (允許它描述一個循環 graph)，而這些連結被存成一個的特殊 value type，它會參考回去頂層的 map。用這個方法，無論是如何被抓取的，每一個伺服器 record 都只會被儲存*一次*。

這是一個範例 query，它抓取一個 story 的 text 和它的 author 的 name：

```
query {
	story(id: "1") {
		text,
		author {
			name
		}
	}
}
```

而這是一個可能的回應：

```
query: {
	story: {
		 text: "Relay is open-source!",
		 author: {
			 name: "Jan"
		 }
	}
}
```

雖然回應是階層式的，我們會藉由扁平化所有的 record 來快取它。這是一個 Relay 會如何快取這個 query 回應的範例：

```javascript
Map {
	// `story(id: "1")`
	1: Map {
		text: 'Relay is open-source!',
		author: Link(2),
	},
	// `story.author`
	2: Map {
		name: 'Jan',
	},
};
```

這只是一個簡單的範例：現實中快取必須處理一對多關聯和 pagination (還有許多其他東西)。

### 使用快取

所以我們要如何使用這種快取？讓我們來看看兩種操作：當收到回應時寫入到快取，還有從快取讀取以確定是否 query 可以在本地完成 (等同於上面的 `_cache.has(key)`，不過是 graph 用的)。

### 填充快取

填充快取牽涉到走訪階層式的 GraphQL 回應以及建立或更新正規化的快取 record。起初看起來似乎只要有回應就已經足夠處理回應，但事實上這只有對非常簡單的 query 是正確的。試想 `user(id: "456") { photo(size: 32) { uri } }` — 我們應該如何儲存 `photo`？使用 `photo` 作為快取中的欄位名稱不可行，因為不同的 query 可能會抓取一樣的欄位卻使用不同的參數值 (例如，`photo(size: 64) {...}`)。一個類似的問題也發生在 pagination。如果我們用 `stories(first: 10, offset: 10)` 抓取 11th 到 20th 的 stories，這些新的結果應該被*附加*到既存的清單中。

因此，GraphQL 的正規化的回應快取需要同時處理 payload 和 query。例如，上面範例的 `photo` 欄位可能會被快取到一個產生出來的欄位名稱，像是 `photo_size(32)`，以唯一地識別欄位以及它的參數值。

### 從快取讀取

為了從快取讀取，我們可以走訪 query 並 resolve 每個欄位。但是等等：那聽起來*就*像是 GraphQL 伺服器在處理 query 時做的事。是這樣沒錯！從快取讀取是一個 executor 的特例，它 a) 不需要使用者定義的欄位函式因為所有的結果都來自固定的資料結構，而且 b) 結果總是同步的 — 我們要不是有已經快取的資料，要不然就是沒有。

Relay 實作了 **query traversal** 的幾種變化：這些操作會走訪 query 以及一些其他的資料，像是快取或是回應 payload。例如，當 Relay 抓取一個 query 時，它會執行一個「diff」traversal 來判斷缺少什麼欄位 (很像是 React 找出 virtual DOM tree 之間的差異)。這可以在大多數情況下減少要抓取的資料量，並甚至在 query 被完整快取的時候，讓 Relay 完全避免掉網路請求。

### 快取更新

要注意的是，這種正規化的快取結構讓重疊的結果可以不重複的被快取起來。每個 record 無論是如何被抓取都只會被儲存一次。讓我們回到先前資料不一致的範例，並看看在這個情況下這種快取要如何產生幫助。

第一個 query 是用來抓取 stories 的清單：

```
query { stories { id, text, likeCount } }
```

伴隨著正規化的回應快取，清單中的每個 story 都會建立一筆 record。`stories` 欄位會儲存參考到這裡面每一個 record 的連結。

第二個 query 重新抓取了其中一個 story 的資訊：

```
query { story(id: "123") { id, text, likeCount } }
```

在這個回應被正規化後，Relay 可以基於它的 `id` 偵測這份結果與已經存在的資料的重疊。Relay 會更新已經存在的 `123` record，而不是建立一個新的 record。因此，新的 `likeCount` 在*這兩個* query，以及任何其他可能會參考到這個 story 的 query 都可以存取。

## Data/View 一致性

正規化的快取確保了*快取*是一致的。但是我們的 view 呢？理想上，我們的 React view 會總是從快取反映當下的資訊。

試想 render 一個 story 的 text 和 comments 以及它對應的 author names 和 photos。這是需要的 GraphQL query：

```
query {
	node(id: "1") {
		text,
		author { name, photo },
		comments {
			text,
			author { name, photo }
		}
	}
}
```

在一開始抓取這個 story 之後，我們的快取可能會變成下面這樣。要注意的是，story 和 comment 都連結到 同樣的 `author` record：

```
// 備註：這是 `Map` 初始化的虛擬程式碼以讓結構
// 更明顯。
Map {
	// `story(id: "1")`
	1: Map {
		author: Link(2),
		comments: [Link(3)],
	},
	// `story.author`
	2: Map {
		name: 'Yuzhi',
		photo: 'http://.../photo1.jpg',
	},
	// `story.comments[0]`
	3: Map {
		author: Link(2),
	},
}
```

這個 story 的 author 也在上面留下了 comment — 這十分常見。現在我們想像一些其他的 view 抓取了 author 的新資訊，而她的 profile photo 已經變更成一個新的 URI。這是我們快取資料中*唯一*改變的部分：

```
Map {
	...
	2: Map {
		...
		photo: 'http://.../photo2.jpg',
	},
}
```

`photo` 欄位的值已經被改變；並因此 record `2` 也改變了。就只有這樣。沒有其他在*快取*中的東西受到影響。而顯然我們的 *view* 需要反映這些更新：在 UI 中的兩個 author 實體 (story author 和 comment author) 都需要呈現新的 photo。

標準的回答是「只管使用 immutable 資料結構」— 不過讓我們來看看如果這樣做會怎樣：

```
ImmutableMap {
	1: ImmutableMap {/* 跟之前一樣 */}
	2: ImmutableMap {
		... // 其他欄位沒有改變
		photo: 'http://.../photo2.jpg',
	},
	3: ImmutableMap {/* 跟之前一樣 */}
}
```

如果我們用一個新的 immutable record 來取代 `2`，我們也會得到一個新的 immutable 快取物件實體。不過，record `1` 以及 `3` 是不變的。因為資料是正規化的，我們不能只看 `story` record 就知道 `story` 的內容已經變了。

### 達成 View 一致性

有許多辦法可以讓 view 與扁平化的快取保持更新。Relay 採用的方法是維護從每一個 UI view 映射到它參考的一組 ID 的 mapping。在這個情況下，story 的 view 會訂閱 story (`1`)、author (`2`)、以及 comments (`3` 和任何其他的) 的更新。當把資料寫進快取時，Relay 會追蹤哪些 ID 有被影響並*只*通知那些有訂閱這些 ID 的 view。那些被影響到的 view 會重新 render，而沒有被影響到的 view 則不進行重新 render 以達到更好的效能 (Relay 提供一個安全而有效率的預設 `shouldComponentUpdate`)。如果沒有這種策略，即使只有微小的改變每個 view 都會重新 render。

要注意的是，這個方案也對 *write* 有用：快取的任何更新都會通知被影響的 view，而 write 只是另一個會更新快取的東西。

## Mutation

到目前為止，我們已經看到了 query 資料的過程並且讓 view 保持更新，不過我們還沒有看到 write。在 GraphQL 中，write 被稱為 **mutation**。我們可以把它們想成是有 side effect 的 query。這是一個呼叫 mutation 的範例，它會把給定的 story 標記成被現在的使用者 like 過：

```
// 給一個人類可讀的名稱並定義 input 的 type，
// 在這個情況下是要被標記成被 like 過的 story 的 id。
mutation StoryLike($storyID: String) {
	 // 呼叫 mutation 欄位並觸發它的 side effect
	 storyLike(storyID: $storyID) {
		 // 定義欄位以在 mutation 完成之後重新抓取
		 likeCount
	 }
}
```

要注意的是，我們在 query 的資料*可能*已經因為 mutation 的結果而改變。一個明顯的問題是：為什麼伺服器不能直接告訴我們什麼東西改變了？答案是：這很複雜。GraphQL 抽象化了*任何的*資料儲存層 (或是多個來源的集合體)，而且可以用任何的程式語言運作。此外，GraphQL 的目標是提供對產品開發者們建構 view 有幫助的格式資料。

我們發現，GraphQL schema 與被儲存在硬碟上的資料之間常常有些微或甚至大幅度的差異。簡單的說：在背後的*資料倉儲* (硬碟) 的資料變化和在*產品可見的 schema* (GraphQL) 的資料變化之間不總是存在 1:1 的對應。關於這個的完美範例是隱私：回傳一個面對使用者的欄位，像是 `age`，可能需要在資料儲存層中存取數筆 record，來判斷現在的使用者是否被允許可以*看到*那個 `age` (我們是朋友嗎？我的年齡是公開的嗎？我有封鎖你嗎？等等。)。

有鑑於這些真實世界的約束，在 GraphQL 中的方法是讓客戶端去 query 在 mutation 之後可能會改變的東西。不過，我們究竟該如何 query？在 Relay 的開發期間，我們探討過幾個想法 — 讓我們來簡單地看看它們以了解為什麼 Relay 使用這樣的方式：

- 選項 1：重新抓取應用程式曾經 query 過的所有東西。即使實際上這份資料只有一小部分會改變，我們仍然必須等待伺服器執行*整個* query、等待下載結果、並等待再次的處理它們。這非常的沒有效率。

- 選項 2：只重新抓取當下被 render 的 view 需要的 query。這跟選項 1 比較起來有些細微的改進。但是，現在*沒有*被看見的被快取資料將不會被更新。除非這份資料以某種方式被標記成失效的或是被從快取移除，隨後的 query 將會讀取到過時的資訊。

- 選項 3：重新抓取*可能會*在 mutation 之後改變的固定欄位列表。我們稱這個列表是一個 **fat query**。我們發現這也是沒效率的，因為典型的應用程式只 render fat query 的一部份子集合，但是這個方法會需要抓取它們之中全部的欄位。

- 選項 4 (Relay)：重新抓取可能會改變的東西 (fat query) 與在快取裡的資料的交集。除了資料的快取之外，Relay 也記得用來抓取每個項目的 query。這些被稱為 **tracked query**。藉由交叉比對 tracked query 和 fat query，Relay 可以只 query 應用程式需要更新的那些資訊而不會包括其他的。

## 資料抓取 API

到目前為止，我們看到資料抓取比較低階的方面並看到各種熟悉的概念要如何轉換成 GraphQL。接下來，讓我們退回來看看一些比較高階、那些產品開發者們時常面對的資料抓取關注點：

- 為 view 階層抓取所有的資料。
- 管理非同步的 state 轉換與協調 concurrent 請求。
- 管理錯誤。
- 重試失敗的請求。
- 在收到 query/mutation 的回應之後更新本地的快取。
- 讓 mutation 排隊來避免 race condition。
- 當在等待伺服器回應 mutation 時，Optimistically updating UI。

我們發現典型的資料抓取方法 — 藉由 imperative APIs — 強迫開發者們處理過多這種不必要的複雜度。例如，試想 *optimistic UI updates*。這是一個在等待伺服器回應的時候給使用者回饋的方式。要做*什麼*的邏輯很清楚：當使用者點擊「like」時，把這個 story 標記為被 like 過並送請求到伺服器。不過實作常常會更複雜一些。Imperative 的方法需要我們實作這些全部的步驟：介入 UI 並切換按鈕狀態、發起網路請求、在需要時重試它、如果它失敗的話呈現錯誤 (並把按鈕切換回來)，等等。這同樣適用於資料抓取：指定我們需要*什麼*資料通常也會指定*如何*與*何時*抓取它。接下來，我們會探討我們的方法，用 **Relay** 來解決這些關注點。
