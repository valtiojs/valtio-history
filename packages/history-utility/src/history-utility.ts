import {
  unstable_buildProxyFunction as buildProxyFunction,
  proxy,
  ref,
  snapshot,
  subscribe,
} from 'valtio/vanilla';
import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla';

export type HistoryNode<T> = {
  snapshot: Snapshot<T>;
  createdAt: Date;
  updatedAt?: Date;
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
 * This creates a new proxy with history support (ProxyHistoryObject).
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
 * - remove: a function to remove a specified history index
 * - replace: a function to replace a snapshot at a specified history index
 * - getNode: a function to get the node at a specified history index
 *
 * [Notes]
 * - Suspense/promise is not supported.
 *
 * @param initialValue - any object to track
 * @param skipSubscribe - determine if to skip the internal subscribe behaviour. default: false
 * @returns  proxyObject
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
    /**
     * getCurrentChangeDate
     *
     * get the date when a node was entered into history.
     *
     * @returns date
     */
    getCurrentChangeDate: () => {
      const node = proxyObject.history.nodes[proxyObject.history.index];
      return node?.createdAt;
    },
    /**
     * getNode
     *
     * utility method to get a history node.
     * The snapshot within this node is already cloned and
     * will not affect the original value if updated.
     *
     * @param index
     * @returns historyNode
     */
    getNode: (index: number) => {
      const node = proxyObject.history.nodes[index];
      return node
        ? { ...node, snapshot: proxyObject.clone(node.snapshot) }
        : undefined;
    },
    clone: deepClone,
    canUndo: () => proxyObject.history.index > 0,
    undo: () => {
      if (proxyObject.canUndo()) {
        proxyObject.history.wip = proxyObject.clone(
          proxyObject.history.nodes[--proxyObject.history.index]?.snapshot
        );
        proxyObject.value = proxyObject.history.wip as V;
      }
    },
    canRedo: () =>
      proxyObject.history.index < proxyObject.history.nodes.length - 1,
    redo: () => {
      if (proxyObject.canRedo()) {
        proxyObject.history.wip = proxyObject.clone(
          proxyObject.history.nodes[++proxyObject.history.index]?.snapshot
        );
        proxyObject.value = proxyObject.history.wip as V;
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

    // history rewrite utilities

    /**
     * remove
     *
     * The remove method is only invoked when there are
     * more than one nodes and when a valid index is provided.
     * If the current index is removed,
     * An index greater than the current index will be preferred as the next
     * value.
     *
     * @param index - index of the node to remove
     * @returns removedNode
     */
    remove: (index: number) => {
      const node = proxyObject.history.nodes[index];
      const isCurrentIndex = proxyObject.history.index === index;
      const lastIndex = proxyObject.history.nodes.length - 1;
      const isLastIndex = lastIndex === index;

      if (!node || proxyObject.history.nodes.length < 2) return;

      if (isCurrentIndex) {
        const resolvedIndex = isLastIndex ? index - 1 : index + 1;
        const resolvedNode = proxyObject.history.nodes[resolvedIndex];

        proxyObject.history.wip = proxyObject.clone(resolvedNode?.snapshot);
        proxyObject.value = proxyObject.history.wip as V;

        if (isLastIndex) proxyObject.history.index--;
      }

      proxyObject.history.nodes.splice(index, 1);

      if (!isCurrentIndex && proxyObject.history.index > index) {
        proxyObject.history.index--;
      }

      return node;
    },

    /**
     * replace
     *
     * utility to replace a value in history. The history
     * changes with not be affected, only the value to be replaced.
     * If a base value is needed to operate on,
     * the `getNode` utility can be used to retrieve
     * a cloned historyNode.
     *
     * Notes:
     * - No operations are done on the value provided to this utility.
     * - This is an advanced method, please ensure the value provided
     *   is a snapshot of the same type of the value being tracked.
     *
     * @param index - index to replace value for
     * @param value - the updated snapshot to be stored at the index
     */
    replace: (index: number, value: Snapshot<V>) => {
      const node = proxyObject.history.nodes[index];
      const isCurrentIndex = proxyObject.history.index === index;

      if (!node) return;

      proxyObject.history.nodes[index] = {
        ...node,
        snapshot: value,
        updatedAt: new Date(),
      };

      if (isCurrentIndex) {
        proxyObject.history.wip = value;
        proxyObject.value = proxyObject.history.wip as V;
      }
    },
  });

  proxyObject.saveHistory();

  if (!skipSubscribe) {
    proxyObject.subscribe();
  }

  return proxyObject;
}
