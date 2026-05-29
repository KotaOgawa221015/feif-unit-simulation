import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { serve } from '@hono/node-server'
const app = new Hono()

// モックデータの定義
const mockData = {
  unit: { name: 'エルフィ', baseClass: 'アーマーナイト' },
  classes: [
    { name: 'アーマーナイト', type: '下級', skills: [{ lv: 5, name: '守備＋２' }, { lv: 10, name: '閉所防御' }] },
    { name: 'グレートナイト', type: '上級', skills: [{ lv: 5, name: '月光' }, { lv: 15, name: '金剛の一撃' }] },
    { name: 'ジェネラル', type: '上級', skills: [{ lv: 5, name: '守備体系' }, { lv: 15, name: '大盾' }] }
  ]
}

app.get('/', (c) => {
  return c.html(
    html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ユニット育成ツール</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-gray-100 text-gray-900 font-sans min-h-screen flex flex-col justify-between">

  <div id="flash-message" class="fixed top-4 left-1/2 -translate-x-1/2 z-50 hidden bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg font-bold transition-all duration-300"></div>

  <main class="flex-grow flex items-center justify-center p-4">
    
    <div id="screen-title" class="text-center bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <h1 class="text-3xl font-extrabold text-blue-600 mb-8 tracking-wide">ユニット育成ツール</h1>
      <button onclick="switchScreen('search')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition duration-200 cursor-pointer shadow-md">
        始める
      </button>
    </div>

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

  </main>

  <script>
    // モックデータの読み込み
    const data = ${raw(JSON.stringify(mockData))};

    // 全ての選択肢を平坦化（検索予測用）
    const allSkills = [];
    data.classes.forEach(c => c.skills.forEach(s => { if(!allSkills.includes(s.name)) allSkills.push(s.name); }));
    const allClasses = data.classes.map(c => c.name);
    const allUnits = [data.unit.name];

    // 画面切り替え
    function switchScreen(screenName) {
      document.getElementById('screen-title').classList.add('hidden');
      document.getElementById('screen-search').classList.add('hidden');
      document.getElementById('screen-result').classList.add('hidden');
      document.getElementById('screen-' + screenName).classList.remove('hidden');
    }

    // フラッシュメッセージ表示
    function showFlash(message) {
      const flash = document.getElementById('flash-message');
      flash.innerText = message;
      flash.classList.remove('hidden');
      setTimeout(() => { flash.classList.add('hidden'); }, 3000);
    }

    // 検索予測（サジェスト）機能
    function showSuggest(type, index = null) {
      const inputId = index !== null ? 'input-skill-' + index : 'input-' + type;
      const suggestId = index !== null ? 'suggest-skill-' + index : 'suggest-' + type;
      
      const input = document.getElementById(inputId);
      const suggestBox = document.getElementById(suggestId);
      const query = input.value.trim();

      if (!query) {
        suggestBox.classList.add('hidden');
        return;
      }

      let source = [];
      if (type === 'unit') source = allUnits;
      if (type === 'class') source = allClasses;
      if (type === 'skill') source = allSkills;

      // 前方一致・部分一致でフィルタリング
      const filtered = source.filter(item => item.includes(query));

      if (filtered.length > 0) {
        suggestBox.innerHTML = filtered.map(item => 
          \`<div class="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0" onclick="selectSuggest('\${inputId}', '\${suggestId}', '\${item}')">\${item}</div>\`
        ).join('');
        suggestBox.classList.remove('hidden');
      } else {
        suggestBox.classList.add('hidden');
      }
    }

    function selectSuggest(inputId, suggestId, value) {
      document.getElementById(inputId).value = value;
      document.getElementById(suggestId).classList.add('hidden');
    }

    // ドキュメントクリック時にサジェストを閉じる
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.relative')) {
        document.querySelectorAll('[id^="suggest-"]').forEach(box => box.classList.add('hidden'));
      }
    });

    // シミュレーション実行・バリデーション
    function processSearch() {
      const unitVal = document.getElementById('input-unit').value.trim();
      const classVal = document.getElementById('input-class').value.trim();
      
      const skillVals = [];
      for(let i=0; i<6; i++) {
        const val = document.getElementById('input-skill-' + i).value.trim();
        if(val) skillVals.push(val);
      }

      // 1. ユニット名バリデーション
      if (unitVal !== data.unit.name) {
        showFlash('ユニットが存在しません');
        return;
      }

      // 2. 最終兵種バリデーション（エルフィの素質からなれる兵種のみ）
      if (!allClasses.includes(classVal)) {
        showFlash('その兵種にはなれません');
        return;
      }

      // 3. スキルバリデーション（エルフィの素質から習得できるスキルのみ）
      for (let skill of skillVals) {
        if (!allSkills.includes(skill)) {
          showFlash('そのスキルは覚えられません');
          return;
        }
      }

      // シミュレーションルート構築（モックロジック）
      renderResults(classVal, skillVals);
      switchScreen('result');
    }

    // 結果の描画
    function renderResults(finalClass, targetSkills) {
      const routeTable = document.getElementById('result-route-table');
      const skillsList = document.getElementById('result-skills-list');
      
      routeTable.innerHTML = '';
      skillsList.innerHTML = '';

      // 固定ルート構築（エルフィのモックデータ用）
      let routes = [
        { lv: '下級 Lv.1～10', cond: '初期兵種', className: 'アーマーナイト' }
      ];

      // スキルに「月光」か「金剛の一撃」が含まれており、かつ最終兵種がジェネラルの場合はパラレルプルフを考慮
      const needsGreatKnight = targetSkills.includes('月光') || targetSkills.includes('金剛の一撃');

      if (finalClass === 'ジェネラル') {
        if (needsGreatKnight) {
          routes.push({ lv: '上級 Lv.1～5', cond: 'マスタープルフ', className: 'グレートナイト' });
          routes.push({ lv: '上級 Lv.5～15', cond: 'パラレルプルフ', className: 'ジェネラル' });
        } else {
          routes.push({ lv: '上級 Lv.1～15', cond: 'マスタープルフ', className: 'ジェネラル' });
        }
      } else if (finalClass === 'グレートナイト') {
        if (targetSkills.includes('守備体系') || targetSkills.includes('大盾')) {
          routes.push({ lv: '上級 Lv.1～5', cond: 'マスタープルフ', className: 'ジェネラル' });
          routes.push({ lv: '上級 Lv.5～15', cond: 'パラレルプルフ', className: 'グレートナイト' });
        } else {
          routes.push({ lv: '上級 Lv.1～15', cond: 'マスタープルフ', className: 'グレートナイト' });
        }
      } else {
        // アーマーナイトのままの場合
        routes = [{ lv: '下級 Lv.1～10', cond: '初期兵種', className: 'アーマーナイト' }];
      }

      // テーブルへの反映
      routeTable.innerHTML = routes.map(r => \`
        <tr class="hover:bg-gray-50 transition">
          <td class="p-3 font-medium text-gray-600">\${r.lv}</td>
          <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold \${r.cond === '初期兵種' ? 'bg-gray-200 text-gray-700' : r.cond === 'マスタープルフ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">\${r.cond}</span></td>
          <td class="p-3 font-semibold">\${r.className}</td>
        </tr>
      \`).join('');

      // 全て網羅する全スキルリスト（経由したクラスの全スキル）
      const totalAvailableSkills = [];
      const visitedClasses = routes.map(r => r.className);
      
      data.classes.forEach(c => {
        if (visitedClasses.includes(c.name)) {
          c.skills.forEach(s => totalAvailableSkills.push(s.name));
        }
      });

      // スキル箇条書きへの反映（指定されたスキルは赤色太字で強調）
      skillsList.innerHTML = totalAvailableSkills.map(s => {
        const isTarget = targetSkills.includes(s);
        const className = isTarget ? 'text-red-600 font-bold' : 'text-gray-700';
        return \`<li class="\${className}">\${s} \${isTarget ? ' ★' : ''}</li>\`;
      }).join('');
    }
  </script>
</body>
</html>`
  )
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

export default app