import { proxy, ref, snapshot, subscribe } from 'valtio/vanilla';
import type { Snapshot } from 'valtio/vanilla';
import { deepClone } from 'valtio/vanilla/utils';

export type HistoryNode<T> = {
  /**
   * The snapshot being tracked
   */
  snapshot: Snapshot<T>;
  /**
   * The date when the node was created
   */
  createdAt: Date;
  /**
   * The date when the node was updated. Will be undefined if
   * the node was never updated.
   */
  updatedAt?: Date;
};

const EMPTY_WIP = Symbol('valtio-history-wip-empty');

export type History<T> = {
  /**
   * field for holding sandbox changes; used to avoid infinite loops
   */
  wip: Snapshot<T> | typeof EMPTY_WIP;
  /**
   * the nodes of the history for each change
   */
  nodes: HistoryNode<T>[];
  /**
   * the history index of the current snapshot
   */
  index: number;
};

type SubscribeOps = Parameters<Parameters<typeof subscribe>[1]>[0];

export type HistoryOptions = {
  /**
   * determines if the internal subscribe behaviour should be skipped.
   */
  skipSubscribe?: boolean;
};

const normalizeOptions = (
  options?: HistoryOptions | boolean
): HistoryOptions => {
  if (typeof options === 'boolean') {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`The second parameter of 'proxyWithHistory' as boolean is deprecated and support for boolean will be removed
      in the next major version. Please use the object syntax instead:
  
      { skipSubscribe: boolean }
      `);
    }
    return { skipSubscribe: options };
  }

  const defaultOptions = {
    skipSubscribe: false,
  };

  if (!options) return defaultOptions;

  return {
    ...defaultOptions,
    ...options,
  };
};

/**
 * This creates a new proxy with history support (ProxyHistoryObject).
 * It includes following main properties:<br>
 * - value: any value (does not have to be an object)<br>
 * - history: an object holding the history of snapshots and other metadata<br>
 *   - history.index: the history index of the current snapshot<br>
 *   - history.nodes: the nodes of the history for each change<br>
 *   - history.wip: field for holding sandbox changes; used to avoid infinite loops<br>
 *
 * <br>
 * Notes: <br>
 * - Suspense/promise is not supported. <br>
 *
 * @param initialValue - any value to be tracked
 * @param options - use to configure the proxyWithHistory utility.
 * @returns  proxyObject
 *
 * @example
 * import { proxyWithHistory } from 'valtio-history'
 * const state = proxyWithHistory({
 *   count: 1,
 * })
 */
export function proxyWithHistory<V>(
  initialValue: V,
  options?: HistoryOptions | boolean
) {
  const utilOptions = normalizeOptions(options);
  const proxyObject = proxy({
    /**
     * any value to be tracked (does not have to be an object)
     */
    value: initialValue,
    /**
     * an object holding the history of snapshots and other metadata <br>
     *   - history.index: the history index to the current snapshot <br>
     *   - history.nodes: the nodes of the history for each change <br>
     *   - history.wip: field for holding sandbox changes; used to avoid infinite loops<br>
     */
    history: ref<History<V>>({
      wip: EMPTY_WIP, // to avoid infinite loop
      nodes: [],
      index: -1,
    }),
    /**
     * get the date when a node was entered into history.
     *
     * @deprecated @see {@link https://github.com/valtiojs/valtio-history/issues/10}
     * @returns date
     */
    getCurrentChangeDate: () => {
      const node = proxyObject.history.nodes[proxyObject.history.index];
      return node?.createdAt;
    },
    /**
     * get the date when the current node was entered into history.
     *
     * @type {Date}
     */
    get currentChangeDate() {
      const node = this.history.nodes[this.history.index];
      return node?.createdAt;
    },
    /**
     * the current history node index.
     *
     * @type {number}
     */
    get currentIndex() {
      return this.history.index;
    },
    /**the total number of the history nodes.
     *
     * @type {number}
     */
    get historyNodeCount() {
      return this.history.nodes.length;
    },
    /**
     * utility method to get a history node.
     * The snapshot within this node is already cloned and
     * will not affect the original value if updated.
     *
     * @param index
     * @returns historyNode
     */
    getNode: (index: number): HistoryNode<V> | undefined => {
      const node = proxyObject.history.nodes[index];
      return node
        ? { ...node, snapshot: proxyObject.clone(node.snapshot) }
        : undefined;
    },
    /**
     * utility to clone a snapshot
     */
    clone: deepClone,
    /**
     * a function to go to a specific index in history
     */
    goTo: (index: number) => {
      const node = proxyObject.history.nodes[index];

      if (!node) return;

      proxyObject.history.wip = proxyObject.clone(node.snapshot);
      proxyObject.value = proxyObject.history.wip as V;
      proxyObject.history.index = index;
    },
    /**
     * a getter to return true if undo is available
     * @returns boolean
     */
    get isUndoEnabled() {
      return this.history.index > 0;
    },
    /**
     * a getter to return true if redo is available
     * @returns boolean
     */
    get isRedoEnabled() {
      return this.history.index < this.history.nodes.length - 1;
    },
    /**
     * a function to return true if undo is available
     *
     * @deprecated @see {@link https://github.com/valtiojs/valtio-history/issues/10}
     * @returns boolean
     */
    canUndo: () => proxyObject.history.index > 0,
    /**
     * a function to go back in history
     */
    undo: () => {
      if (proxyObject.canUndo()) {
        proxyObject.history.wip =
          proxyObject.clone(
            proxyObject.history.nodes[--proxyObject.history.index]?.snapshot
          ) ?? EMPTY_WIP;
        proxyObject.value = proxyObject.history.wip as V;
      }
    },
    /**
     * a function to return true if redo is available
     *
     * @deprecated @see {@link https://github.com/valtiojs/valtio-history/issues/10}
     * @returns boolean
     */
    canRedo: () =>
      proxyObject.history.index < proxyObject.history.nodes.length - 1,
    /**
     * a function to go forward in history
     */
    redo: () => {
      if (proxyObject.canRedo()) {
        proxyObject.history.wip =
          proxyObject.clone(
            proxyObject.history.nodes[++proxyObject.history.index]?.snapshot
          ) ?? EMPTY_WIP;
        proxyObject.value = proxyObject.history.wip as V;
      }
    },
    /**
     * a function to execute saving history when changes are made to `value`
     */
    saveHistory: () => {
      proxyObject.history.nodes.splice(proxyObject.history.index + 1);
      proxyObject.history.nodes.push({
        createdAt: new Date(),
        snapshot: snapshot(proxyObject).value,
      });
      ++proxyObject.history.index;
    },
    /**
     * a function that returns true when the history should be updated
     *
     * @param ops - subscribeOps from subscribe callback
     * @returns boolean
     */
    shouldSaveHistory: (ops: SubscribeOps) =>
      ops.every(
        (op) =>
          op[1][0] === 'value' &&
          (op[0] !== 'set' || op[2] !== proxyObject.history.wip)
      ),
    /**
     * a function to subscribe to changes made to `value`
     */
    subscribe: () =>
      subscribe(proxyObject, (ops) => {
        if (proxyObject.shouldSaveHistory(ops)) proxyObject.saveHistory();
      }),

    // history rewrite utilities

    /**
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

        proxyObject.history.wip =
          proxyObject.clone(resolvedNode?.snapshot) ?? EMPTY_WIP;
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
     * utility to replace a value in history. The history
     * changes will not be affected, only the value to be replaced.
     * If a base value is needed to operate on,
     * the `getNode` utility can be used to retrieve
     * a cloned historyNode.
     *
     * <br> <br>
     * Notes: <br>
     * - No operations are done on the value provided to this utility. <br>
     * - This is an advanced method, please ensure the value provided
     *   is a snapshot of the same type of the value being tracked. <br>
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

  if (!utilOptions.skipSubscribe) {
    proxyObject.subscribe();
  }

  return proxyObject;
}
