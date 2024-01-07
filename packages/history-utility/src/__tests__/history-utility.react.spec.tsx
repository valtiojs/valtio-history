import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSnapshot } from 'valtio';
import { describe, it } from 'vitest';

import { proxyWithHistory } from '../history-utility';

describe('proxyWithHistory', () => {
  describe('react: basic', () => {
    it('should do simple count', async () => {
      const state = proxyWithHistory(0);

      const Counter = () => {
        const snap = useSnapshot(state);
        return (
          <>
            <div>count: {snap.value}</div>
            <button onClick={() => ++state.value}>inc</button>
            <button onClick={snap.undo}>undo</button>
            <button onClick={snap.redo}>redo</button>
          </>
        );
      };

      render(
        <StrictMode>
          <Counter />
        </StrictMode>
      );

      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('redo'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');
    });

    it('should count in object', async () => {
      const state = proxyWithHistory({ count: 0 });

      const Counter = () => {
        const snap = useSnapshot(state);
        return (
          <>
            <div>count: {snap.value.count}</div>
            <button onClick={() => ++state.value.count}>inc</button>
            <button onClick={snap.undo}>undo</button>
            <button onClick={snap.redo}>redo</button>
          </>
        );
      };

      render(
        <StrictMode>
          <Counter />
        </StrictMode>
      );

      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('redo'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');
    });

    it('should count in nested object', async () => {
      const state = proxyWithHistory({ nested: { count: 0 } });

      const Counter = () => {
        const snap = useSnapshot(state);
        return (
          <>
            <div>count: {snap.value.nested.count}</div>
            <button onClick={() => ++state.value.nested.count}>inc</button>
            <button onClick={snap.undo}>undo</button>
            <button onClick={snap.redo}>redo</button>
          </>
        );
      };

      render(
        <StrictMode>
          <Counter />
        </StrictMode>
      );

      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('redo'));
      await screen.findByText('count: 3');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');

      fireEvent.click(screen.getByText('undo'));
      await screen.findByText('count: 0');
    });

    /**
     * @see {@link https://github.com/pmndrs/valtio/issues/323}
     */
    it('should do multiple redos at once (#323)', async () => {
      const state = proxyWithHistory({ nested: { count: 0 } });

      const Counter = () => {
        const snap = useSnapshot(state);
        return (
          <>
            <div>count: {snap.value.nested.count}</div>
            <button onClick={() => ++state.value.nested.count}>inc</button>
            <button
              onClick={() => {
                state.undo();
                state.undo();
              }}
            >
              undo twice
            </button>
            <button
              onClick={() => {
                state.redo();
                state.redo();
              }}
            >
              redo twice
            </button>
          </>
        );
      };

      render(
        <StrictMode>
          <Counter />
        </StrictMode>
      );

      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 1');
      fireEvent.click(screen.getByText('inc'));
      await screen.findByText('count: 2');

      fireEvent.click(screen.getByText('undo twice'));
      await screen.findByText('count: 0');

      fireEvent.click(screen.getByText('redo twice'));
      await screen.findByText('count: 2');
    });

    /**
     * @see {@link https://github.com/pmndrs/valtio/issues/516}
     */
    it('should update with nested arrays (#516)', async () => {
      interface Level1Interface {
        level1Values: number[];
      }
      interface Level0Interface {
        level0Values: Level1Interface[];
      }
      const state = proxyWithHistory<Level0Interface>({
        level0Values: [{ level1Values: [0, 1] }, { level1Values: [2, 3] }],
      });

      const NestedArray = () => {
        const snap = useSnapshot(state);
        return (
          <>
            <div>values: {JSON.stringify(snap.value)}</div>
            <button
              onClick={() => {
                state.undo();
              }}
            >
              undo
            </button>
            <button
              onClick={() => {
                if (state.value.level0Values[1]) {
                  state.value.level0Values[1].level1Values[0] = 10;
                }
              }}
            >
              change 2 to 10
            </button>
            <button
              onClick={() => {
                if (state.value.level0Values[1]) {
                  state.value.level0Values[1].level1Values[0] = 11;
                }
              }}
            >
              change 10 to 11
            </button>
            <button
              onClick={() => {
                if (state.value.level0Values[0]) {
                  state.value.level0Values[0].level1Values[0] = 12;
                }
              }}
            >
              change 0 to 12
            </button>
          </>
        );
      };

      render(
        <StrictMode>
          <NestedArray />
        </StrictMode>
      );

      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[2,3]}]}'
      );

      fireEvent.click(screen.getByText('change 2 to 10'));
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[10,3]}]}'
      );

      fireEvent.click(screen.getByText('change 10 to 11'));
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[11,3]}]}'
      );

      fireEvent.click(screen.getByText('undo')); // => 11 back to 10
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[10,3]}]}'
      );

      fireEvent.click(screen.getByText('change 0 to 12'));
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[12,1]},{"level1Values":[10,3]}]}'
      );

      fireEvent.click(screen.getByText('undo')); // => 12 back to 0
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[10,3]}]}'
      );

      fireEvent.click(screen.getByText('undo')); // => 10 back to 2
      await screen.findByText(
        'values: {"level0Values":[{"level1Values":[0,1]},{"level1Values":[2,3]}]}'
      );
    });
  });
});
