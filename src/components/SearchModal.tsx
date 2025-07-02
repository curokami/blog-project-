import { useState, useEffect, useRef } from 'preact/hooks';
import Fuse from 'fuse.js';

function SearchModal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fuse = useRef<Fuse<any> | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/search.json');
      const data = await res.json();
      fuse.current = new Fuse(data, {
        keys: ['title', 'description', 'tags'],
        includeScore: true,
      });
    })();
  }, []);

  function onSearchInput(e: Event) {
    const input = (e.target as HTMLInputElement).value;
    setQuery(input);
    if (!fuse.current) return;
    const searchResults = fuse.current.search(input).map(r => r.item);
    setResults(searchResults);
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-white shadow-md border border-gray-300 rounded-full p-3 hover:bg-gray-100"
        aria-label="Open search modal"
      >
        🔍
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex justify-center items-start pt-20 z-50">
          <div className="bg-white w-full max-w-xl p-4 rounded shadow-lg relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
              aria-label="Close search modal"
            >
              ✕
            </button>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onInput={onSearchInput}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <ul>
              {results.map(post => (
                <li key={post.slug}>
                  <a href={`/posts/${post.slug}`} className="block py-2 text-blue-600 hover:underline">
                    {post.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchModal;
