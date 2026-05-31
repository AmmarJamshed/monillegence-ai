/** Production-quality App.tsx templates — instant, no LLM, fully usable UI. */

export function getAppTemplate(
  userRequest: string,
  projectName: string
): string | null {
  const req = userRequest.toLowerCase();
  if (req.includes('todo') || req.includes('task list')) {
    return todoAppTemplate(projectName);
  }
  if (req.includes('counter')) {
    return counterAppTemplate(projectName);
  }
  if (req.includes('smiley') || req.includes('smile')) {
    return smileyAppTemplate(projectName);
  }
  return null;
}

function todoAppTemplate(projectName: string): string {
  const title = projectName
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `import { useState } from 'react';

type Todo = { id: string; text: string; done: boolean };

type Filter = 'all' | 'active' | 'done';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.done));
  };

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const activeCount = todos.filter((t) => !t.done).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-emerald-400">
            Monillegence AI
          </p>
          <h1 className="text-4xl font-bold tracking-tight">${title}</h1>
          <p className="mt-3 text-slate-300">
            Type a task below and click <strong>Add Task</strong> or press Enter.
            Check off items when done, or delete them.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex gap-2">
            <label htmlFor="todo-input" className="sr-only">
              New task
            </label>
            <input
              id="todo-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="What do you need to do?"
              className="flex-1 rounded-xl border border-white/20 bg-slate-900/60 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            />
            <button
              type="button"
              onClick={addTodo}
              className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              Add Task
            </button>
          </div>

          <div className="mt-4 flex gap-2 text-sm">
            {(['all', 'active', 'done'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={\`rounded-lg px-3 py-1 capitalize \${
                  filter === f
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'text-slate-400 hover:text-white'
                }\`}
              >
                {f}
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-2">
            {filtered.length === 0 ? (
              <li className="rounded-xl border border-dashed border-white/20 py-12 text-center text-slate-400">
                {todos.length === 0
                  ? '📝 No tasks yet — add your first one above!'
                  : 'No tasks match this filter.'}
              </li>
            ) : (
              filtered.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label={\`Mark "\${todo.text}" as done\`}
                    className="h-5 w-5 rounded accent-emerald-500"
                  />
                  <span
                    className={\`flex-1 \${
                      todo.done ? 'text-slate-500 line-through' : 'text-white'
                    }\`}
                  >
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded-lg px-3 py-1 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>

          {todos.length > 0 && (
            <footer className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
              <span>
                {activeCount} task{activeCount !== 1 ? 's' : ''} remaining
              </span>
              {todos.some((t) => t.done) && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Clear completed
                </button>
              )}
            </footer>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Built with Monillegence AI · Pakistan&apos;s local-first coding platform
        </p>
      </div>
    </div>
  );
}
`;
}

function counterAppTemplate(projectName: string): string {
  return `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 px-4 text-white">
      <h1 className="mb-2 text-3xl font-bold">${projectName.replace(/-/g, ' ')}</h1>
      <p className="mb-8 text-slate-300">Click the buttons to change the count.</p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl">
        <p className="text-6xl font-bold tabular-nums text-indigo-300">{count}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setCount((c) => c - 1)} className="rounded-xl bg-slate-700 px-6 py-3 font-semibold hover:bg-slate-600">− Decrease</button>
          <button type="button" onClick={() => setCount(0)} className="rounded-xl bg-slate-600 px-6 py-3 font-semibold hover:bg-slate-500">Reset</button>
          <button type="button" onClick={() => setCount((c) => c + 1)} className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400">+ Increase</button>
        </div>
      </div>
    </div>
  );
}
`;
}

function smileyAppTemplate(_projectName: string): string {
  return `import { useState } from 'react';

const FACES = ['😊', '😄', '🥳', '😎', '🤩', '😍'];

export default function App() {
  const [index, setIndex] = useState(0);
  const [clicks, setClicks] = useState(0);

  const smile = () => {
    setIndex((i) => (i + 1) % FACES.length);
    setClicks((c) => c + 1);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-100 to-orange-200 px-4">
      <h1 className="mb-2 text-3xl font-bold text-amber-900">Smiley Face App</h1>
      <p className="mb-8 text-amber-800">Tap the button to change the smiley!</p>
      <div className="rounded-3xl bg-white p-12 shadow-xl text-center">
        <div className="text-9xl select-none" role="img" aria-label="Smiley face">{FACES[index]}</div>
        <p className="mt-4 text-slate-600">You smiled {clicks} time{clicks !== 1 ? 's' : ''}</p>
        <button type="button" onClick={smile} className="mt-6 rounded-2xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-amber-400">
          Make me smile!
        </button>
      </div>
    </div>
  );
}
`;
}

export const UI_QUALITY_PROMPT = `
UX REQUIREMENTS (mandatory — app must be understandable by anyone):
1. Clear page title (h1) and short subtitle explaining what the app does and how to use it.
2. Visible labeled buttons — never rely on Enter alone; include obvious click targets.
3. Empty state message when lists are empty (e.g. "No items yet — add one above").
4. Polished Tailwind layout: centered card, spacing, readable contrast, hover states.
5. Footer or helper text so users know the app is working.
6. Complete functionality — add, edit/toggle, delete, filters where appropriate.
7. Accessible: aria-labels on icon-only controls, semantic HTML.
8. No placeholder TODOs, no "// add rest of code", no broken imports.
`;
