[valtio-history](README.md) / Exports

# valtio-history

## Table of contents

### Type Aliases

- [History](modules.md#history)
- [HistoryNode](modules.md#historynode)
- [HistoryOptions](modules.md#historyoptions)

### Functions

- [proxyWithHistory](modules.md#proxywithhistory)

## Type Aliases

### History

Ƭ **History**\<`T`\>: `Object`

#### Type parameters

| Name |
| :--- |
| `T`  |

#### Type declaration

| Name    | Type                                             | Description                                                     |
| :------ | :----------------------------------------------- | :-------------------------------------------------------------- |
| `index` | `number`                                         | the history index of the current snapshot                       |
| `nodes` | [`HistoryNode`](modules.md#historynode)\<`T`\>[] | the nodes of the history for each change                        |
| `wip`   | `Snapshot`\<`T`\> \| typeof `EMPTY_WIP`          | field for holding sandbox changes; used to avoid infinite loops |

#### Defined in

[packages/history-utility/src/index.ts:28](https://github.com/valtiojs/valtio-history/blob/ec38985/packages/history-utility/src/index.ts#L28)

---

### HistoryNode

Ƭ **HistoryNode**\<`T`\>: `Object`

#### Type parameters

| Name |
| :--- |
| `T`  |

#### Type declaration

| Name         | Type              | Description                                                                          |
| :----------- | :---------------- | :----------------------------------------------------------------------------------- |
| `createdAt`  | `Date`            | The date when the node was created                                                   |
| `snapshot`   | `Snapshot`\<`T`\> | The snapshot being tracked                                                           |
| `updatedAt?` | `Date`            | The date when the node was updated. Will be undefined if the node was never updated. |

#### Defined in

[packages/history-utility/src/index.ts:10](https://github.com/valtiojs/valtio-history/blob/ec38985/packages/history-utility/src/index.ts#L10)

---

### HistoryOptions

Ƭ **HistoryOptions**: `Object`

#### Type declaration

| Name             | Type      | Description                                                       |
| :--------------- | :-------- | :---------------------------------------------------------------- |
| `skipSubscribe?` | `boolean` | determines if the internal subscribe behaviour should be skipped. |

#### Defined in

[packages/history-utility/src/index.ts:45](https://github.com/valtiojs/valtio-history/blob/ec38985/packages/history-utility/src/index.ts#L45)

## Functions

### proxyWithHistory

▸ **proxyWithHistory**\<`V`\>(`initialValue`, `options?`): `Object`

This creates a new proxy with history support (ProxyHistoryObject).
It includes following main properties:<br>

- value: any value (does not have to be an object)<br>
- history: an object holding the history of snapshots and other metadata<br>
  - history.index: the history index of the current snapshot<br>
  - history.nodes: the nodes of the history for each change<br>
  - history.wip: field for holding sandbox changes; used to avoid infinite loops<br>

<br>
Notes: <br>
- Suspense/promise is not supported. <br>

#### Type parameters

| Name |
| :--- |
| `V`  |

#### Parameters

| Name           | Type                                                       | Description                                    |
| :------------- | :--------------------------------------------------------- | :--------------------------------------------- |
| `initialValue` | `V`                                                        | any value to be tracked                        |
| `options?`     | `boolean` \| [`HistoryOptions`](modules.md#historyoptions) | use to configure the proxyWithHistory utility. |

#### Returns

`Object`

proxyObject

| Name                      | Type                                                                                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `canRedo`                 | () => `boolean`                                                                                                       | a function to return true if redo is available **`Deprecated`** **`See`** [https://github.com/valtiojs/valtio-history/issues/10](https://github.com/valtiojs/valtio-history/issues/10)                                                                                                                                                                                                                                                                 |
| `canUndo`                 | () => `boolean`                                                                                                       | a function to return true if undo is available **`Deprecated`** **`See`** [https://github.com/valtiojs/valtio-history/issues/10](https://github.com/valtiojs/valtio-history/issues/10)                                                                                                                                                                                                                                                                 |
| `clone`                   | \<T\>(`value`: `T`) => `T`                                                                                            | utility to clone a snapshot                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `getCurrentChangeDate`    | () => `undefined` \| `Date`                                                                                           | get the date when a node was entered into history. **`Deprecated`** **`See`** [https://github.com/valtiojs/valtio-history/issues/10](https://github.com/valtiojs/valtio-history/issues/10)                                                                                                                                                                                                                                                             |
| `getNode`                 | (`index`: `number`) => `undefined` \| \{ `createdAt`: `Date` ; `snapshot`: `Snapshot`\<`V`\> ; `updatedAt?`: `Date` } | utility method to get a history node. The snapshot within this node is already cloned and will not affect the original value if updated.                                                                                                                                                                                                                                                                                                               |
| `goTo`                    | (`index`: `number`) => `void`                                                                                         | a function to go to a specific index in history                                                                                                                                                                                                                                                                                                                                                                                                        |
| `history`                 | [`History`](modules.md#history)\<`V`\> & `AsRef`                                                                      | an object holding the history of snapshots and other metadata <br> - history.index: the history index to the current snapshot <br> - history.nodes: the nodes of the history for each change <br> - history.wip: field for holding sandbox changes; used to avoid infinite loops<br>                                                                                                                                                                   |
| `redo`                    | () => `void`                                                                                                          | a function to go forward in history                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `remove`                  | (`index`: `number`) => `undefined` \| [`HistoryNode`](modules.md#historynode)\<`V`\>                                  | The remove method is only invoked when there are more than one nodes and when a valid index is provided. If the current index is removed, An index greater than the current index will be preferred as the next value.                                                                                                                                                                                                                                 |
| `replace`                 | (`index`: `number`, `value`: `INTERNAL_Snapshot`\<`V`\>) => `void`                                                    | utility to replace a value in history. The history changes will not be affected, only the value to be replaced. If a base value is needed to operate on, the `getNode` utility can be used to retrieve a cloned historyNode. <br> <br> Notes: <br> - No operations are done on the value provided to this utility. <br> - This is an advanced method, please ensure the value provided is a snapshot of the same type of the value being tracked. <br> |
| `saveHistory`             | () => `void`                                                                                                          | a function to execute saving history when changes are made to `value`                                                                                                                                                                                                                                                                                                                                                                                  |
| `shouldSaveHistory`       | (`ops`: `Op`[]) => `boolean`                                                                                          | a function that returns true when the history should be updated                                                                                                                                                                                                                                                                                                                                                                                        |
| `subscribe`               | () => () => `void`                                                                                                    | a function to subscribe to changes made to `value`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `undo`                    | () => `void`                                                                                                          | a function to go back in history                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `value`                   | `V`                                                                                                                   | any value to be tracked (does not have to be an object)                                                                                                                                                                                                                                                                                                                                                                                                |
| `get currentChangeDate()` | `undefined` \| `Date`                                                                                                 | -                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `get currentIndex()`      | `number`                                                                                                              | -                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `get historyNodeCount()`  | `number`                                                                                                              | -                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `get isRedoEnabled()`     | `boolean`                                                                                                             | -                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `get isUndoEnabled()`     | `boolean`                                                                                                             | -                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

**`Example`**

```ts
import { proxyWithHistory } from 'valtio-history';
const state = proxyWithHistory({
  count: 1,
});
```

#### Defined in

[packages/history-utility/src/index.ts:122](https://github.com/valtiojs/valtio-history/blob/ec38985/packages/history-utility/src/index.ts#L122)
