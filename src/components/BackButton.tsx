import { h } from 'preact';

export default function BackButton() {
  const handleClick = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');

    if (from === 'tags') {
      window.location.href = '/tags';
    } else if (from === 'search') {
      window.location.href = '/search';
    } else if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleClick}
      class="inline-flex items-center text-gray-600 hover:text-gray-800 transition px-4 py-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}