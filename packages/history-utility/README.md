# valtio-history

[![npm version](https://badge.fury.io/js/valtio-history.svg)](https://badge.fury.io/js/valtio-history)

valtio utility for creating a proxy state with history tracking

https://valtio.pmnd.rs/docs/api/utils/proxyWithHistory

see detailed [api docs](https://github.com/valtiojs/valtio-history/blob/main/packages/history-utility/docs/modules.md) for more info.

---

## Migrating from `valtio/utils`

```tsx
// replace the following line
// import { proxyWithHistory } from 'valtio/utils';

import { proxyWithHistory } from 'valtio-history';
import { useSnapshot } from 'valtio';

const state = proxyWithHistory({ count: 0 });
console.log(state.value); // ---> { count: 0 }
state.value.count += 1;
console.log(state.value); // ---> { count: 1 }
state.undo();
console.log(state.value); // ---> { count: 0 }
state.redo();
console.log(state.value); // ---> { count: 1 }

// React example
export default function App() {
  const {
    value,
    undo,
    redo,
    history,
    canUndo,
    canRedo,
    getCurrentChangeDate,
    getNode,
    remove,
    replace,
} = useSnapshot(state);

  ...
}
```

### Notable changes

- the `history` object has changes
  - `history.snapshots` is renamed to `history.nodes`
  - a `HistoryNode` has the structure `{ snapshot: Snapshot<T>; createdAt: Date; updatedAt?: Date;  }`
- The second parameter of `proxyWithHistory` is now an object instead of a `boolean`. `{ skipSubscribe?: boolean }`
