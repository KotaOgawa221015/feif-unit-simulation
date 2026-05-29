import { html } from 'hono/html'

export const SearchScreen = () => html`
  <div id="screen-search" class="hidden bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl">
    <h2 class="text-2xl font-bold border-b pb-3 mb-6 text-gray-800">検索条件設定</h2>
    
    <div class="space-y-5">
      <div class="relative">
        <label class="block text-sm font-semibold text-gray-700 mb-1">ユニット</label>
        <input type="text" id="input-unit" oninput="showSuggest('unit')" placeholder="例: エルフィ" class="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none">
        <div id="suggest-unit" class="absolute left-0 right-0 bg-white border rounded-b-lg shadow-lg hidden z-10 max-h-40 overflow-y-auto"></div>
      </div>

      <div class="relative">
        <label class="block text-sm font-semibold text-gray-700 mb-1">最終兵種</label>
        <input type="text" id="input-class" oninput="showSuggest('class')" placeholder="例: ジェネラル" class="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-400 outline-none">
        <div id="suggest-class" class="absolute left-0 right-0 bg-white border rounded-b-lg shadow-lg hidden z-10 max-h-40 overflow-y-auto"></div>
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">取得したいスキル（最大6つ）</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${[0, 1, 2, 3, 4, 5].map(i => html`
            <div class="relative">
              <input type="text" id="input-skill-${i}" oninput="showSuggest('skill', ${i})" placeholder="スキル名を入力" class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-sm">
              <div id="suggest-skill-${i}" class="absolute left-0 right-0 bg-white border rounded-b-lg shadow-lg hidden z-10 max-h-32 overflow-y-auto"></div>
            </div>
          `)}
        </div>
      </div>

      <button onclick="processSearch()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 mt-4 shadow-md cursor-pointer text-center">
        調べる
      </button>
    </div>
  </div>
`