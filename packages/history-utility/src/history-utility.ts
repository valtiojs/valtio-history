import {
  unstable_buildProxyFunction as buildProxyFunction,
  proxy,
  ref,
  snapshot,
  subscribe,
} from 'valtio/vanilla';
import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla';

export type HistoryNode<T> = {
  createdAt: Date;
  snapshot: Snapshot<T>;
};

export type History<T> = {
  wip?: Snapshot<T>;
  nodes: HistoryNode<T>[];
  index: number;
};

const isObject = (value: unknown): value is object =>
  !!value && typeof value === 'object';

let refSet: WeakSet<object> | undefined;

const deepClone = <T>(value: T): T => {
  if (!refSet) {
    refSet = buildProxyFunction()[2];
  }
  if (!isObject(value) || refSet.has(value)) {
    return value;
  }
  const baseObject: T = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value));
  Reflect.ownKeys(value).forEach((key) => {
    baseObject[key as keyof T] = deepClone(value[key as keyof T]);
  });
  return baseObject;
};

/**
 * proxyWithHistory
 *
 * This creates a new proxy with history support.
 * It includes following properties:
 * - value: any value (does not have to be an object)
 * - history: an object holding the history of snapshots and other metadata
 *   - history.index: the history index to the current snapshot
 *   - history.nodes: the nodes of the history for each change
 *   - history.wip: field for holding sandbox changes; used to avoid infinite loops
 * - canUndo: a function to return true if undo is available
 * - undo: a function to go back history
 * - canRedo: a function to return true if redo is available
 * - redo: a function to go forward history
 * - saveHistory: a function to save history
 * - getCurrentChangeDate: gets the date of the current change
 *
 * [Notes]
 * - Suspense/promise is not supported.
 *
 * @example
 * import { proxyWithHistory } from 'valtio-history'
 * const state = proxyWithHistory({
 *   count: 1,
 * })
 */
export function proxyWithHistory<V>(initialValue: V, skipSubscribe = false) {
  const proxyObject = proxy({
    value: initialValue,
    history: ref<History<V>>({
      wip: undefined, // to avoid infinite loop
      nodes: [],
      index: -1,
    }),
    getCurrentChangeDate: () => {
      const node = proxyObject.history.nodes[proxyObject.history.index];
      return node?.createdAt;
    },
    clone: deepClone,
    canUndo: () => proxyObject.history.index > 0,
    undo: () => {
      if (proxyObject.canUndo()) {
        proxyObject.value = (proxyObject.history.wip = proxyObject.clone(
          proxyObject.history.nodes[--proxyObject.history.index]?.snapshot
        )) as V;
      }
    },
    canRedo: () =>
      proxyObject.history.index < proxyObject.history.nodes.length - 1,
    redo: () => {
      if (proxyObject.canRedo()) {
        proxyObject.value = (proxyObject.history.wip = proxyObject.clone(
          proxyObject.history.nodes[++proxyObject.history.index]?.snapshot
        )) as V;
      }
    },
    saveHistory: () => {
      proxyObject.history.nodes.splice(proxyObject.history.index + 1);
      proxyObject.history.nodes.push({
        createdAt: new Date(),
        snapshot: snapshot(proxyObject).value,
      });
      ++proxyObject.history.index;
    },
    subscribe: () =>
      subscribe(proxyObject, (ops) => {
        if (
          ops.every(
            (op) =>
              op[1][0] === 'value' &&
              (op[0] !== 'set' || op[2] !== proxyObject.history.wip)
          )
        ) {
          proxyObject.saveHistory();
        }
      }),
  });

  proxyObject.saveHistory();

  if (!skipSubscribe) {
    proxyObject.subscribe();
  }

  return proxyObject;
}
