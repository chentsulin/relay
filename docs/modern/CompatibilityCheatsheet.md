---
id: compatibility-cheatsheet
title: Compatibility Cheatsheet
layout: docs
category: Relay Compat
permalink: docs/compatibility-cheatsheet.html
next: api-cheatsheet
---

什麼能跟什麼搭配一起運作？Relay Compat (`'react-relay/compat'`) 是最彈性的。
Compat components 和 mutations 可以被任何人使用。Compat components 可以有任何一種的 children。

不過使用 Relay Modern API (`'react-relay'`) 的 components 和使用 Relay Classic API (`'react-relay/classic'`) 的 components 不能互相使用。

### RelayRootContainer 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|----|----|----|
|Yes |Yes | No |Yes |Yes | No |

### 採用 Classic Environment (在 `react-relay/classic` 裡的 `Store`) 的 QueryRenderer 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|----|----|----|
|Yes |Yes | No |Yes |Yes | No |

### 採用 Modern Environment 的 QueryRenderer 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|----|----|----|
| No |Yes |Yes | No |Yes |Yes |

### React Modern Component 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|----|----|----|
| No |Yes |Yes | No |Yes |Yes |

### React Compat Component 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|-----|----|----|
|Yes |Yes |Yes |Yes\*|Yes |Yes |

\* Modern API 不支援 mutation fragment。你必須把舊有 mutation 的 fragments 寫到 component 的 fragment 裡。

### React Classic Component 可以使用：

|Classic Component|Compat Component|Modern Component|Classic Mutation|Compat Mutation|Modern Mutation
|----|----|----|----|----|----|
|Yes |Yes | No |Yes |Yes | No |
