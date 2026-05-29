import { html } from 'hono/html'

export const TitleScreen = () => html`
  <div id="screen-title" class="text-center bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
    <h1 class="text-3xl font-extrabold text-blue-600 mb-8 tracking-wide">ユニット育成ツール</h1>
    <button onclick="switchScreen('search')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition duration-200 cursor-pointer shadow-md">
      始める
    </button>
  </div>
`