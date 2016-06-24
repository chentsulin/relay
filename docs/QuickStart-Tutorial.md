---
id: tutorial
title: Tutorial
layout: docs
category: Quick Start
permalink: docs/tutorial.html
next: thinking-in-graphql
---

在這份教學中，我們將會使用 GraphQL mutations 來建置一個遊戲。這個遊戲的目標是在九個正方形的網格中尋找一份藏起來的寶藏。我們將會給玩家們三次嘗試去找寶藏。這應該可以給我們 Relay 完整的樣貌 – 從在伺服器上的 GraphQL schema，到客戶端上的 React 應用程式。

## 暖身

讓我們使用 [Relay Starter Kit](https://github.com/relayjs/relay-starter-kit) 作為基底來開始一個專案。

```
git clone https://github.com/relayjs/relay-starter-kit.git relay-treasurehunt
cd relay-treasurehunt
npm install
```

## 一個簡單的資料庫

我們需要一個地方來藏我們的寶藏，一個檢查寶藏藏匿點的方法，還有一個追蹤我們剩餘的回合數的方法。為了教學的目的，我們會把這些資料藏在記憶體中。

```
/**
 * ./data/database.js
 */

// Model types
export class Game {}
export class HidingSpot {}

// Mock data
var game = new Game();
game.id = '1';

var hidingSpots = [];
(function() {
	var hidingSpot;
	var indexOfSpotWithTreasure = Math.floor(Math.random() * 9);
	for (var i = 0; i < 9; i++) {
		hidingSpot = new HidingSpot();
		hidingSpot.id = `${i}`;
		hidingSpot.hasTreasure = (i === indexOfSpotWithTreasure);
		hidingSpot.hasBeenChecked = false;
		hidingSpots.push(hidingSpot);
	}
})();

var turnsRemaining = 3;

export function checkHidingSpotForTreasure(id) {
  if (hidingSpots.some(hs => hs.hasTreasure && hs.hasBeenChecked)) {
    return;
  }
  turnsRemaining--;
  var hidingSpot = getHidingSpot(id);
  hidingSpot.hasBeenChecked = true;
}
export function getHidingSpot(id) {
  return hidingSpots.find(hs => hs.id === id);
}
export function getGame() { return game; }
export function getHidingSpots() { return hidingSpots; }
export function getTurnsRemaining() { return turnsRemaining; }
```

我們目前為止寫在這邊的是一個 mock 資料庫介面。我們可以想像把這個綁上到一個真實的資料庫，不過現在讓我們繼續往下。

## 編寫 schema

GraphQL schema 描述你的資料模型，並提供一個 GraphQL 伺服器與相關聯的一組知道要如何抓取資料的 resolve 方法。我們將會使用
[graphql-js](https://github.com/graphql/graphql-js) 和
[graphql-relay-js](https://github.com/graphql/graphql-relay-js) 來建構我們的
schema。

讓我們來打開 starter kit 的 schema，並用我們剛建立的那一個來置換資料庫的 import：

```
/**
 * ./data/schema.js
 */

/* ... */

import {
	Game,
	HidingSpot,
	checkHidingSpotForTreasure,
	getGame,
	getHidingSpot,
	getHidingSpots,
	getTurnsRemaining,
} from './database';
```

在此刻，你可以刪除 `./data/schema.js` 中直到 `queryType` 之前的所有東西。

接著，讓我們來定義一個 node interface 和 type。我們只需要提供一個方式讓 Relay 能從一個 object 映射到與那個 object 相關聯的 GraphQL type，並從一個 global ID 映射到它指向的 object：

```
var {nodeInterface, nodeField} = nodeDefinitions(
	(globalId) => {
		var {type, id} = fromGlobalId(globalId);
		if (type === 'Game') {
			return getGame(id);
		} else if (type === 'HidingSpot') {
			return getHidingSpot(id);
		} else {
			return null;
		}
	},
	(obj) => {
		if (obj instanceof Game) {
			return gameType;
		} else if (obj instanceof HidingSpot)  {
			return hidingSpotType;
		} else {
			return null;
		}
	}
);
```

再下來，讓我們來定義我們的 game 和 hiding spot types，還有在它們上面可以存取的 fields。

```
var gameType = new GraphQLObjectType({
	name: 'Game',
	description: 'A treasure search game',
	fields: () => ({
		id: globalIdField('Game'),
		hidingSpots: {
			type: hidingSpotConnection,
			description: 'Places where treasure might be hidden',
			args: connectionArgs,
			resolve: (game, args) => connectionFromArray(getHidingSpots(), args),
		},
		turnsRemaining: {
			type: GraphQLInt,
			description: 'The number of turns a player has left to find the treasure',
			resolve: () => getTurnsRemaining(),
		},
	}),
	interfaces: [nodeInterface],
});

var hidingSpotType = new GraphQLObjectType({
	name: 'HidingSpot',
	description: 'A place where you might find treasure',
	fields: () => ({
		id: globalIdField('HidingSpot'),
		hasBeenChecked: {
			type: GraphQLBoolean,
			description: 'True if this spot has already been checked for treasure',
			resolve: (hidingSpot) => hidingSpot.hasBeenChecked,
		},
		hasTreasure: {
			type: GraphQLBoolean,
			description: 'True if this hiding spot holds treasure',
			resolve: (hidingSpot) => {
				if (hidingSpot.hasBeenChecked) {
					return hidingSpot.hasTreasure;
				} else {
					return null;  // 噓... 這是秘密！
				}
			},
		},
	}),
	interfaces: [nodeInterface],
});
```

因為一個 game 可以有許多個 hiding spots，我們需要建立一個 connection，讓我們可以使用來 把他們連結在一起。

```
var {connectionType: hidingSpotConnection} =
	connectionDefinitions({name: 'HidingSpot', nodeType: hidingSpotType});
```

現在讓我們來把這些 types 連結到 root query type。

```
var queryType = new GraphQLObjectType({
	name: 'Query',
	fields: () => ({
		node: nodeField,
		game: {
			type: gameType,
			resolve: () => getGame(),
		},
	}),
});
```

隨著 queries 已經完成，讓我們開始著手我們唯一的 mutation：消耗一個回合來檢查一個 spot 有沒有寶藏的那一個。在這裡，我們定義給 mutation 的 input (spot 的 id 用來檢查寶藏) 和在 mutation 發生之後所有客戶端可能會可能想要更新的 fields 清單。最後，我們實作一個方法來執行背後的 mutation。

```
var CheckHidingSpotForTreasureMutation = mutationWithClientMutationId({
	name: 'CheckHidingSpotForTreasure',
	inputFields: {
		id: { type: new GraphQLNonNull(GraphQLID) },
	},
	outputFields: {
		hidingSpot: {
			type: hidingSpotType,
			resolve: ({localHidingSpotId}) => getHidingSpot(localHidingSpotId),
		},
		game: {
			type: gameType,
			resolve: () => getGame(),
		},
	},
	mutateAndGetPayload: ({id}) => {
		var localHidingSpotId = fromGlobalId(id).id;
		checkHidingSpotForTreasure(localHidingSpotId);
		return {localHidingSpotId};
	},
});
```

讓我們來把剛建立的 mutation 連結到 root mutation type：

```
var mutationType = new GraphQLObjectType({
	name: 'Mutation',
	fields: () => ({
		checkHidingSpotForTreasure: CheckHidingSpotForTreasureMutation,
	}),
});
```

最後，建構我們的 schema (它的起始 query type 是我們先前定義過的 query type) 並 export 它。

```
export var Schema = new GraphQLSchema({
	query: queryType,
	mutation: mutationType
});
```

## 處理 schema

在我們更深入之前，我們需要把我們的可執行 schema serialize 成 JSON，才能讓 Relay.QL transpiler 使用，接著啟動伺服器。從 command line：

```
npm run update-schema
npm start
```

## 撰寫遊戲

讓我們微調一下檔案 `./js/routes/AppHomeRoute.js`，以把我們的 game 綁到 schema 的 `game` root field：

```
export default class extends Relay.Route {
	static path = '/';
	static queries = {
		game: () => Relay.QL`query { game }`,
	};
	static routeName = 'AppHomeRoute';
}
```

接下來，讓我們在 `./js/mutations/CheckHidingSpotForTreasureMutation.js` 建立一個檔案並建立 `Relay.Mutation` 的子類別叫做 `CheckHidingSpotForTreasureMutation` 來放我們的 mutation 實作：

```
import Relay from 'react-relay';

export default class CheckHidingSpotForTreasureMutation extends Relay.Mutation {
	static fragments = {
		game: () => Relay.QL`
			fragment on Game {
				id,
				turnsRemaining,
			}
		`,
		hidingSpot: () => Relay.QL`
			fragment on HidingSpot {
				id,
			}
		`,
	};
	getMutation() {
		return Relay.QL`mutation{checkHidingSpotForTreasure}`;
	}
	getCollisionKey() {
		return `check_${this.props.game.id}`;
	}
	getFatQuery() {
		return Relay.QL`
			fragment on CheckHidingSpotForTreasurePayload {
				hidingSpot {
					hasBeenChecked,
					hasTreasure,
				},
				game {
					turnsRemaining,
				},
			}
		`;
	}
	getConfigs() {
		return [{
			type: 'FIELDS_CHANGE',
			fieldIDs: {
				hidingSpot: this.props.hidingSpot.id,
				game: this.props.game.id,
			},
		}];
	}
	getVariables() {
		return {
			id: this.props.hidingSpot.id,
		};
	}
	getOptimisticResponse() {
		return {
			game: {
				turnsRemaining: this.props.game.turnsRemaining - 1,
			},
			hidingSpot: {
				id: this.props.hidingSpot.id,
				hasBeenChecked: true,
			},
		};
	}
}
```

最後，讓我們在 `./js/components/App.js` 中把它們全部結合在一起：

```
import CheckHidingSpotForTreasureMutation from '../mutations/CheckHidingSpotForTreasureMutation';

class App extends React.Component {
  _getHidingSpotStyle(hidingSpot) {
    var color;
    if (this.props.relay.hasOptimisticUpdate(hidingSpot)) {
      color = 'lightGrey';
    } else if (hidingSpot.hasBeenChecked) {
      if (hidingSpot.hasTreasure) {
        color = 'blue';
      } else {
        color = 'red';
      }
    } else {
      color = 'black';
    }
    return {
      backgroundColor: color,
      cursor: this._isGameOver() ? null : 'pointer',
      display: 'inline-block',
      height: 100,
      marginRight: 10,
      width: 100,
    };
  }
  _handleHidingSpotClick(hidingSpot) {
    if (this._isGameOver()) {
      return;
    }
    this.props.relay.commitUpdate(
      new CheckHidingSpotForTreasureMutation({
        game: this.props.game,
        hidingSpot,
      })
    );
  }
  _hasFoundTreasure() {
    return (
      this.props.game.hidingSpots.edges.some(edge => edge.node.hasTreasure)
    );
  }
  _isGameOver() {
    return !this.props.game.turnsRemaining || this._hasFoundTreasure();
  }
  renderGameBoard() {
    return this.props.game.hidingSpots.edges.map(edge => {
      return (
        <div
          key={edge.node.id}
          onClick={this._handleHidingSpotClick.bind(this, edge.node)}
          style={this._getHidingSpotStyle(edge.node)}
        />
      );
    });
  }
  render() {
    var headerText;
    if (this.props.relay.getPendingTransactions(this.props.game)) {
      headerText = '\u2026';
    } else if (this._hasFoundTreasure()) {
      headerText = 'You win!';
    } else if (this._isGameOver()) {
      headerText = 'Game over!';
    } else {
      headerText = 'Find the treasure!';
    }
    return (
      <div>
        <h1>{headerText}</h1>
        {this.renderGameBoard()}
        <p>Turns remaining: {this.props.game.turnsRemaining}</p>
      </div>
    );
  }
}

export default Relay.createContainer(App, {
	fragments: {
		game: () => Relay.QL`
			fragment on Game {
				turnsRemaining,
				hidingSpots(first: 9) {
					edges {
						node {
							hasBeenChecked,
							hasTreasure,
							id,
							${CheckHidingSpotForTreasureMutation.getFragment('hidingSpot')},
						}
					}
				},
				${CheckHidingSpotForTreasureMutation.getFragment('game')},
			}
		`,
	},
});
```

在 Relay repository 中的 [`./examples/`](https://github.com/facebook/relay/tree/081b4a3f17dcf/examples) 目錄下可以找到一份可運作的 treasure hunt 副本。

現在，我們現在已經完成這份教學，讓我們深入看看建置一個 GraphQL 客戶端框架代表什麼意思還有要如何把它跟比較傳統的 REST 系統的客戶端做比較。
