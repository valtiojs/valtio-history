import { describe, expect, it } from 'vitest';

import { HistoryNode, proxyWithHistory } from '../history-utility';

const mapNumbers = (node: HistoryNode<{ count: number }>) =>
  node.snapshot.count;

describe('proxyWithHistory: vanilla', () => {
  describe('basic', () => {
    it('should provide basic history functionality', async () => {
      const state = proxyWithHistory({ count: 0 });
      await Promise.resolve();
      expect(state.value.count).toEqual(0);

      state.value.count += 1;
      await Promise.resolve();
      expect(state.value.count).toEqual(1);

      state.undo();
      await Promise.resolve();
      expect(state.value.count).toEqual(0);

      state.redo();
      await Promise.resolve();
      expect(state.value.count).toEqual(1);
    });

    it('should provide basic sequential undo functionality', async () => {
      const state = proxyWithHistory({ count: 0 });
      await Promise.resolve();
      expect(state.value.count).toEqual(0);
      expect(state.canRedo()).toEqual(false);
      expect(state.canUndo()).toEqual(false);

      state.value.count += 1;
      await Promise.resolve();
      expect(state.value.count).toEqual(1);
      expect(state.canRedo()).toEqual(false);
      expect(state.canUndo()).toEqual(true);

      state.value.count += 1;
      await Promise.resolve();
      expect(state.value.count).toEqual(2);
      expect(state.canRedo()).toEqual(false);
      expect(state.canUndo()).toEqual(true);

      state.undo();
      await Promise.resolve();
      expect(state.value.count).toEqual(1);
      expect(state.canRedo()).toEqual(true);
      expect(state.canUndo()).toEqual(true);

      state.undo();
      await Promise.resolve();
      expect(state.value.count).toEqual(0);
      expect(state.canRedo()).toEqual(true);
      expect(state.canUndo()).toEqual(false);
    });

    it('should provide basic sequential redo functionality', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();

      expect(state.value.count).toEqual(0);
      expect(state.canRedo()).toEqual(true);
      expect(state.canUndo()).toEqual(false);

      state.redo();
      await Promise.resolve();
      expect(state.value.count).toEqual(1);
      expect(state.canRedo()).toEqual(true);
      expect(state.canUndo()).toEqual(true);

      state.redo();
      await Promise.resolve();
      expect(state.value.count).toEqual(2);
      expect(state.canRedo()).toEqual(true);
      expect(state.canUndo()).toEqual(true);

      state.redo();
      await Promise.resolve();
      expect(state.value.count).toEqual(3);
      expect(state.canRedo()).toEqual(false);
      expect(state.canUndo()).toEqual(true);
    });
  });

  describe('remove', () => {
    it('should remove no items in history when only one item', async () => {
      const state = proxyWithHistory({ count: 0 });

      expect(state.value.count).toEqual(0);
      expect(state.history.nodes.length).toEqual(1);
      expect(state.history.index).toEqual(0);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0]);

      state.remove(0);
      await Promise.resolve();

      expect(state.value.count).toEqual(0);
      expect(state.history.nodes.length).toEqual(1);
      expect(state.history.index).toEqual(0);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0]);
    });

    it('should remove no items in history when incorrect index provided', async () => {
      const state = proxyWithHistory({ count: 0 });

      expect(state.value.count).toEqual(0);
      expect(state.history.nodes.length).toEqual(1);
      expect(state.history.index).toEqual(0);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0]);

      state.remove(200);
      await Promise.resolve();

      expect(state.value.count).toEqual(0);
      expect(state.history.nodes.length).toEqual(1);
      expect(state.history.index).toEqual(0);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0]);
    });

    it('should remove item in history less than current index', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.remove(1);
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(5);
      expect(state.history.index).toEqual(4);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 2, 3, 4, 5]);
    });

    it('should remove item in history greater than current index', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.remove(4);
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(5);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 5]);
    });

    it('should remove the current item in history when not the last index', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.remove(2);
      await Promise.resolve();

      expect(state.value.count).toEqual(3);
      expect(state.history.nodes.length).toEqual(5);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 3, 4, 5]);
    });

    it('should remove the current item in history when it is the last index', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.remove(5);
      await Promise.resolve();

      expect(state.value.count).toEqual(4);
      expect(state.history.nodes.length).toEqual(5);
      expect(state.history.index).toEqual(4);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('replace', () => {
    it('should replace no items in history when invalid index is provided', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.replace(100, { count: 100 });
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should replace current index as last index in history without increasing history length', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();

      expect(state.value.count).toEqual(5);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.replace(5, { count: 100 });
      await Promise.resolve();

      expect(state.value.count).toEqual(100);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(5);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 100]);
    });

    it('should replace current index when not last index in history without increasing history', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.replace(2, { count: 100 });
      await Promise.resolve();

      expect(state.value.count).toEqual(100);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 100, 3, 4, 5]);
    });

    it('should replace item in history without increasing history', async () => {
      const state = proxyWithHistory({ count: 0 });

      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.value.count += 1;
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();
      state.undo();
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([0, 1, 2, 3, 4, 5]);

      state.replace(3, { count: 100 });
      await Promise.resolve();
      state.replace(4, { count: 200 });
      await Promise.resolve();

      expect(state.value.count).toEqual(2);
      expect(state.history.nodes.length).toEqual(6);
      expect(state.history.index).toEqual(2);
      expect(state.history.nodes.map(mapNumbers)).toEqual([
        0, 1, 2, 100, 200, 5,
      ]);
    });
  });
});
