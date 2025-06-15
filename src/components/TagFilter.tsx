import { useState } from 'preact/hooks';

interface Post {
  slug: string;
  data: {
    title: string;
    description: string;
    tags?: string[];
  };
}

interface TagFilterProps {
  posts: Post[];
  allTags: string[];
}

export default function TagFilter({ posts, allTags }: TagFilterProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredPosts = selectedTag
    ? posts.filter(post => post.data.tags?.includes(selectedTag))
    : [];

  return (
    <div>
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        {allTags.map(tag => (
          <button
            key={tag}
            class={`px-4 py-1 rounded-full text-sm font-semibold ${
              tag === selectedTag
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
            onClick={() => setSelectedTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTag && (
        <div class="space-y-4">
          <h2 class="text-lg font-semibold">Posts tagged with "{selectedTag}"</h2>
          {filteredPosts.map(post => (
            <a
              href={`/posts/${post.slug}`}
              class="block p-4 border rounded-md hover:bg-gray-50"
            >
              <h3 class="font-bold text-gray-900">{post.data.title}</h3>
              <p class="text-sm text-gray-600">{post.data.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}