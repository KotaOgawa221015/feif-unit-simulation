import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import { serve } from '@hono/node-server'
import { getSimulationData } from './services/simulationDataService.js'
import { TitleScreen } from './components/TitleScreen.js'
import { SearchScreen } from './components/SearchScreen.js'
import { ResultScreen } from './components/ResultScreen.js'

const app = new Hono()

app.get('/', async (c) => {
  const data = await getSimulationData()

  if (!data) {
    return c.text('ユニットデータがありません', 404)
  }

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
          ${TitleScreen()}
          ${SearchScreen()}
          ${ResultScreen()}
        </main>

        <script>
          // インポートしたモックデータを展開（rawで囲みUncaught ReferenceErrorを防止）
          const data = ${raw(JSON.stringify(data))};
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

            const filtered = source.filter(item => item.includes(query));

            if (filtered.length > 0) {
              suggestBox.innerHTML = filtered.map(item => 
                \`<div class="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0" 
                onclick="selectSuggest('\${inputId}', '\${suggestId}', '\${item}')"
                >\${item}</div>\`
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

          document.addEventListener('click', (e) => {
            document.querySelectorAll('[id^="suggest-"]').forEach(box => {
              const wrapper = box.parentElement;
              const input = wrapper.querySelector('input');

              if (e.target !== input && !box.contains(e.target)) {
                box.classList.add('hidden');
              }
            });
          });

          function processSearch() {
            const unitVal = document.getElementById('input-unit').value.trim();
            const classVal = document.getElementById('input-class').value.trim();
            
            const skillVals = [];
            for(let i=0; i<6; i++) {
              const val = document.getElementById('input-skill-' + i).value.trim();
              if(val) skillVals.push(val);
            }

            if (unitVal !== data.unit.name) {
              showFlash('ユニットが存在しません');
              return;
            }

            if (!allClasses.includes(classVal)) {
              showFlash('その兵種にはなれません');
              return;
            }

            for (let skill of skillVals) {
              if (!allSkills.includes(skill)) {
                showFlash('そのスキルは覚えられません');
                return;
              }
            }

            renderResults(classVal, skillVals);
            switchScreen('result');
          }

          function renderResults(finalClass, targetSkills) {
            const routeTable = document.getElementById('result-route-table');
            const skillsList = document.getElementById('result-skills-list');
            
            routeTable.innerHTML = '';
            skillsList.innerHTML = '';

            let routes = [
              { lv: '下級 Lv.1～10', cond: '初期兵種', className: 'アーマーナイト' }
            ];

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
              routes = [{ lv: '下級 Lv.1～10', cond: '初期兵種', className: 'アーマーナイト' }];
            }

            routeTable.innerHTML = routes.map(r => \`
              <tr class="hover:bg-gray-50 transition">
                <td class="p-3 font-medium text-gray-600">\${r.lv}</td>
                <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold \${r.cond === '初期兵種' ? 'bg-gray-200 text-gray-700' : r.cond === 'マスタープルフ' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}"\>\${r.cond}</span></td>
                <td class="p-3 font-semibold">\${r.className}</td>
              </tr>
            \`).join('');

            const totalAvailableSkills = [];
            const visitedClasses = routes.map(r => r.className);
            
            data.classes.forEach(c => {
              if (visitedClasses.includes(c.name)) {
                c.skills.forEach(s => totalAvailableSkills.push(s.name));
              }
            });

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

if (!process.env.VERCEL) {
  // ローカル環境の場合、HTTPサーバーを起動
  const port = 3000
  console.log(`Server is running on http://localhost:${port}`)
  serve({
    fetch: app.fetch,
    port
  })
}

export default app