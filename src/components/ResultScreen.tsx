import { html } from 'hono/html'

export const ResultScreen = () => html`
  <div id="screen-result" class="hidden bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl">
    <h2 class="text-2xl font-bold border-b pb-3 mb-6 text-gray-800">育成シミュレーション結果</h2>
    
    <div class="mb-8">
      <h3 class="text-lg font-bold text-gray-700 mb-3">▼ クラスチェンジルート</h3>
      <div class="overflow-x-auto rounded-xl border border-gray-200">
        <table class="w-full text-left border-collapse bg-white">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th class="p-3">Lv.</th>
              <th class="p-3">クラスチェンジの条件</th>
              <th class="p-3">経由する兵種</th>
            </tr>
          </thead>
          <tbody id="result-route-table" class="divide-y divide-gray-100 text-sm text-gray-700">
          </tbody>
        </table>
      </div>
    </div>

    <div class="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h3 class="text-lg font-bold text-gray-700 mb-3">▼ 最終習得スキル一覧</h3>
      <ul id="result-skills-list" class="list-disc list-inside space-y-1.5 text-sm font-medium text-gray-700">
      </ul>
    </div>

    <button onclick="switchScreen('search')" class="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg transition duration-200 cursor-pointer text-center text-sm">
      条件を再設定する
    </button>
  </div>
`