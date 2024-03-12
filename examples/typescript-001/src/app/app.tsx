import { useSnapshot } from 'valtio';
import { proxyWithHistory } from 'valtio-history';
import React from 'react';

const textProxy = proxyWithHistory({
  text: 'Add some text to this initial value and then undo/redo',
});
const update = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
  (textProxy.value.text = event.target.value);

export default function App() {
  const {
    value,
    undo,
    redo,
    isUndoEnabled,
    isRedoEnabled,
    currentIndex,
    historyNodeCount,
    currentChangeDate,
  } = useSnapshot(textProxy);

  return (
    <div className="App">
      <h2>Editor with history</h2>
      <div className="info">
        <span>
          change {currentIndex + 1} / {historyNodeCount}
        </span>
        <span>|</span>
        <span>{currentChangeDate?.toISOString()}</span>
      </div>
      <div className="editor">
        <textarea value={value.text} rows={4} onChange={update} />
      </div>
      <button onClick={undo} disabled={!isUndoEnabled}>
        Undo
      </button>
      <button onClick={redo} disabled={!isRedoEnabled}>
        Redo
      </button>
    </div>
  );
}
