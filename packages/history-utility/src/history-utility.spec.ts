import { proxyWithHistory } from './history-utility';

describe('proxyWithHistory', () => {
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
