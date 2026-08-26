const SUITS=[{symbol:'♠',red:false},{symbol:'♥',red:true},{symbol:'♦',red:true},{symbol:'♣',red:false}];
const SUIT_CLASS=['suit-spade','suit-heart','suit-diamond','suit-club'];
const RANKS=['1','2','3','4','5','6','7','8','9'];
const ROWS=7,COLS=5,STARTING_SPINS=10,HAND_SCORE={'Three of a Kind':300,'Four of a Kind':800,'Five of a Kind':1500};
let grid=[],fix=[],score=0,sliceScore=0,spins=0,spinsLeft=STARTING_SPINS,drag=null,hands=[],chain=0,busy=false,startedAt=null,gameEnded=false;
const board=document.querySelector('#board'),spinBtn=document.querySelector('#spin-btn'),fx=document.querySelector('#fx'),toast=document.querySelector('#toast');
function weightedRank(){let n=Math.random()*45;for(let r=0;r<9;r++){n-=9-r;if(n<0)return r}return 8}
function reset(){grid=Array.from({length:4},(_,suit)=>Array.from({length:ROWS},()=>({suit,rank:weightedRank()})));fix=Array.from({length:ROWS},()=>({suit:Math.floor(Math.random()*4),rank:weightedRank()}));score=0;sliceScore=0;spins=0;spinsLeft=STARTING_SPINS;drag=null;hands=[];chain=0;busy=false;startedAt=null;gameEnded=false;closeModal();render()}
function getCard(row,col){return col===4?fix[row]:grid[col][row]}
function render(){detectHands();board.innerHTML='';for(let row=0;row<ROWS;row++){for(let col=0;col<COLS;col++){const card=getCard(row,col),cell=document.createElement('div');cell.className=`cell ${col===4?'fix-cell':''} ${hands.some(h=>h.row===row)?'hand':''}`;cell.dataset.row=row;cell.dataset.col=col;if(card){const suit=SUITS[card.suit];cell.innerHTML=`<div class="card ${suit.red?'red':''} ${SUIT_CLASS[card.suit]} ${col===4?'fix-card':''}" draggable="${col<4}"><div class="rank">${RANKS[card.rank]}<small>${suit.symbol}</small></div><div class="suit">${suit.symbol}</div>${col===4?'<div class="fix-tag">FIXED</div>':''}</div>`}bindCell(cell,row,col);board.appendChild(cell)}}renderHandStatus();document.querySelector('#score').textContent=score.toLocaleString();document.querySelector('#spin-count').textContent=spinsLeft;document.querySelector('#fix-count').textContent=fix.filter(Boolean).length;document.querySelector('#progress-fill').style.width=`${(ROWS-fix.filter(Boolean).length)/ROWS*100}%`;spinBtn.disabled=busy||!canSpin();renderReels();if(fix.every(card=>card===null))stageClear();else if(!canSpin()&&!hasReliefMerge())gameOver()}
function renderReels(results){document.querySelector('#reels').innerHTML=SUITS.map((s,i)=>`<div class="reel ${s.red?'red':''} ${SUIT_CLASS[i]} ${results?'rolling':''}"><strong>${results?RANKS[results[i]]:s.symbol}</strong><small>${s.symbol} LINE</small></div>`).join('')}
function bindCell(cell,row,col){cell.ondragstart=e=>{if(col===4||!getCard(row,col)){e.preventDefault();return}drag={row,col};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',`${row},${col}`);cell.firstChild.classList.add('dragging')};cell.ondragover=e=>{if(drag)e.preventDefault()};cell.ondrop=e=>{e.preventDefault();mergeTo(row,col)};cell.ondragend=()=>{drag=null;render()}}
function canSpin(){return spinsLeft>0&&grid.some(col=>col.some(x=>x===null))}
function startTimer(){if(startedAt===null)startedAt=Date.now()}
function spin(){if(!canSpin()||busy)return;startTimer();busy=true;chain=0;const results=SUITS.map(()=>weightedRank());renderReels(results);spinBtn.disabled=true;setTimeout(()=>{for(let col=0;col<4;col++)for(let row=0;row<ROWS;row++)if(grid[col][row]===null)grid[col][row]={suit:col,rank:weightedRank()};spins++;spinsLeft--;busy=false;flash('FULL SPIN!');render()},430)}
function insert(col,card){const row=grid[col].findIndex(x=>x!==null);if(row===-1){grid[col][ROWS-1]=card;return}grid[col][row-1]=card}
function insertFix(card){const row=fix.findIndex(x=>x!==null);if(row===-1){fix[ROWS-1]=card;return}fix[row-1]=card}
function mergeTo(row,col){if(!drag||busy)return;const from=getCard(drag.row,drag.col),target=getCard(row,col),source={...drag};drag=null;if(col===4&&target?.rank===8){showToast('FIX 9는 Merge할 수 없어요');render();return}if(!from||!target||source.col===col&&source.row===row||from.suit!==target.suit||from.rank!==target.rank){showToast('동일한 무늬와 Rank만 Merge할 수 있어요');render();return}if(col<4&&col!==source.col){showToast('Production 카드는 같은 Line 안에서 Merge하세요');render();return}startTimer();if(from.rank===8){grid[source.col][source.row]=null;if(col<4)grid[col][row]=null;else{fix[row]=null;gravityFix()}score+=2500;gravity(source.col);if(col<4)gravity(col);flash('MAX MERGE');showToast('9 + 9 Max Merge!');render();return}if(col===4)fix[row].rank++;else grid[col][row].rank++;grid[source.col][source.row]=null;score+=50*(from.rank+1);gravity(source.col);chain=0;flash(`${RANKS[from.rank+1]} MERGE`);render()}
function gravity(col){const cards=grid[col].filter(Boolean);grid[col]=Array(ROWS-cards.length).fill(null).concat(cards)}
function gravityFix(){const cards=fix.filter(Boolean);fix=Array(ROWS-cards.length).fill(null).concat(cards)}
function detectHands(){hands=[];for(let row=0;row<ROWS;row++){const cards=Array.from({length:5},(_,c)=>getCard(row,c));if(cards.some(x=>!x))continue;const name=evaluate(cards.map(x=>x.rank));if(name)hands.push({row,name})}}
function evaluate(ranks){const count={};ranks.forEach(r=>count[r]=(count[r]||0)+1);const highest=Math.max(...Object.values(count));if(highest===5)return'Five of a Kind';if(highest===4)return'Four of a Kind';if(highest===3)return'Three of a Kind';return null}
function clearHand(row){const hand=hands.find(h=>h.row===row);if(!hand)return;startTimer();chain++;for(let col=0;col<4;col++){grid[col][row]=null;gravity(col)}fix[row]=null;gravityFix();const gain=HAND_SCORE[hand.name]*chain;score+=gain;sliceScore+=gain;const spinBonus=true;spinsLeft++;flash(`${hand.name.toUpperCase()} · ${chain} CHAIN`);showToast(`${hand.name} +${gain.toLocaleString()}${spinBonus?' · SPIN +1':''}`);render()}
function hasReliefMerge(){for(let col=0;col<4;col++){for(let a=0;a<ROWS;a++)for(let b=a+1;b<ROWS;b++)if(grid[col][a]&&grid[col][b]&&grid[col][a].rank===grid[col][b].rank)return true;for(let row=0;row<ROWS;row++)if(grid[col][row]&&fix.some(card=>card&&card.rank!==8&&card.suit===grid[col][row].suit&&card.rank===grid[col][row].rank))return true}return hands.length>0}
function flash(text){fx.textContent=text;fx.classList.remove('pop');void fx.offsetWidth;fx.classList.add('pop')}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800)}
const LEADERBOARD_KEY='merge-poker-leaderboard-v1';
const backendConfig=window.MERGE_POKER_BACKEND||{};
const leaderboardApi=backendConfig.url&&backendConfig.publishableKey&&window.supabase?.createClient
  ? window.supabase.createClient(backendConfig.url,backendConfig.publishableKey)
  : null;
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function loadLocalLeaderboard(){try{const data=JSON.parse(localStorage.getItem(LEADERBOARD_KEY)||'[]');return Array.isArray(data)?data.slice(0,100):[]}catch{return[]}}
function saveLocalLeaderboard(entries){try{localStorage.setItem(LEADERBOARD_KEY,JSON.stringify(entries.slice(0,100)))}catch{}}
async function loadLeaderboard(){
  if(!leaderboardApi)return loadLocalLeaderboard();
  const{data,error}=await leaderboardApi.from('leaderboard').select('player_name,score,slice_score,spins_left,play_time,created_at').order('score',{ascending:false}).order('play_time',{ascending:true}).limit(100);
  if(error)throw error;
  return data.map(row=>({name:row.player_name,score:row.score,sliceScore:row.slice_score,spinsLeft:row.spins_left,elapsed:row.play_time,date:row.created_at}));
}
async function persistScore(record,entries){
  if(leaderboardApi){
    const{error}=await leaderboardApi.from('leaderboard').insert({player_name:record.name,score:record.score,slice_score:record.sliceScore,spins_left:record.spinsLeft,play_time:record.elapsed});
    if(error)throw error;
    return loadLeaderboard();
  }
  entries.push(record);entries.sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed);saveLocalLeaderboard(entries);return entries.slice(0,100);
}
function getFinalScore(){const elapsed=Math.max(0,Math.floor((Date.now()-(startedAt??Date.now()))/1000));return{elapsed,finalScore:sliceScore+spinsLeft*1000-elapsed*10}}
function leaderboardHtml(entries){if(!entries.length)return'<p class="empty-board">아직 등록된 기록이 없습니다.</p>';return `<ol class="leaderboard">${entries.map((entry,index)=>`<li><b>${index+1}</b><span>${escapeHtml(entry.name)}</span><strong>${entry.score.toLocaleString()}</strong></li>`).join('')}</ol>`}
function showLeaderboardResult(kicker,title,reason,result,entries){showModal(kicker,title,`<p>${reason}</p><div class="score-formula"><span>HAND ${sliceScore.toLocaleString()}</span><span>SPIN ${spinsLeft} × 1,000</span><span>TIME ${result.elapsed}s × 10</span><strong>FINAL ${result.finalScore.toLocaleString()}</strong></div><h2>${leaderboardApi?'GLOBAL':'LOCAL'} TOP 100</h2>${leaderboardHtml(entries)}`,'새 게임',reset)}
async function finishGame(kicker,title,reason){
  if(gameEnded)return;gameEnded=true;busy=true;const result=getFinalScore();let entries;
  try{entries=await loadLeaderboard()}catch{entries=loadLocalLeaderboard();showToast('리더보드 연결 실패 · 로컬 모드')}
  const qualifies=entries.length<100||result.finalScore>(entries[entries.length-1]?.score??-Infinity);
  if(!qualifies){showLeaderboardResult(kicker,title,reason,result,entries);return}
  showModal(kicker,title,`<p>${reason}</p><div class="score-formula"><span>HAND ${sliceScore.toLocaleString()}</span><span>SPIN ${spinsLeft} × 1,000</span><span>TIME ${result.elapsed}s × 10</span><strong>FINAL ${result.finalScore.toLocaleString()}</strong></div><label class="name-entry">TOP 100 기록 이름<input id="player-name" maxlength="16" autocomplete="nickname" placeholder="PLAYER"></label>`,'기록 저장',async()=>{const input=document.querySelector('#player-name'),name=input?.value.trim()||'PLAYER',record={name,score:result.finalScore,sliceScore,spinsLeft,elapsed:result.elapsed,date:new Date().toISOString()};const button=document.querySelector('#modal-btn');button.disabled=true;button.textContent='저장 중…';let latest;try{latest=await persistScore(record,entries)}catch{entries.push(record);entries.sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed);saveLocalLeaderboard(entries);latest=entries.slice(0,100);showToast('서버 저장 실패 · 로컬 저장')}showLeaderboardResult(kicker,title,reason,result,latest)})
}
let tutorialPage=0;
function tutorialCard(rank,suit,fixCard=false){const data=SUITS[suit];return `<div class="tutorial-cell ${fixCard?'tutorial-fix':''}"><div class="card ${data.red?'red':''} ${SUIT_CLASS[suit]} ${fixCard?'fix-card':''}"><div class="rank">${rank}<small>${data.symbol}</small></div><div class="suit">${data.symbol}</div>${fixCard?'<div class="fix-tag">FIXED</div>':''}</div></div>`}
function tutorialRow(ranks){return `<div class="tutorial-column-heads"><span>♠</span><span>♥</span><span>♦</span><span>♣</span><b>FIX</b></div><div class="tutorial-row">${ranks.map((rank,index)=>tutorialCard(rank,index<4?index:0,index===4)).join('')}</div>`}
function tutorialHtml(page){
  if(page===0)return `<div class="tutorial-page"><div class="tutorial-scene merge-scene"><div class="tutorial-source">${tutorialCard(4,3)}${tutorialCard(4,3)}</div><div class="tutorial-merge-arrow"><i>↗</i><span>DRAG &amp; MERGE</span></div><div class="tutorial-result">${tutorialCard(5,3)}<strong>RANK UP!</strong></div></div><h2>같은 카드끼리 머지</h2><p>같은 Suit 라인 안에서 무늬와 숫자가 같은 두 카드를 드래그해 합칩니다. 합쳐진 카드는 한 단계 높은 Rank가 됩니다.</p><p class="tutorial-note">FIX 9는 머지 대상이 아닙니다.</p></div>`;
  if(page===1)return `<div class="tutorial-page"><div class="tutorial-board">${tutorialRow([3,3,3,6,8])}<div class="tutorial-hand-ready">THREE OF A KIND · READY</div></div><h2>3·4·5장 동일 숫자 핸드</h2><p>가로 5장 중 같은 숫자가 3장 이상이면 HAND 네비게이터가 활성화됩니다.</p><div class="tutorial-score-list">${Object.entries(HAND_SCORE).map(([name,value])=>`<span>${name}<strong>+${value.toLocaleString()}</strong></span>`).join('')}</div></div>`;
  return `<div class="tutorial-page"><div class="tutorial-board submit-board">${tutorialRow([4,4,4,7,2])}<button class="tutorial-submit" type="button">THREE OF A KIND<strong>+300</strong><small>CLICK TO CLEAR</small></button></div><h2>HAND 네비게이터로 제출</h2><p>오른쪽에 활성화된 HAND 버튼을 누르면 해당 행의 다섯 카드와 FIX 블록이 함께 제거됩니다.</p><div class="tutorial-rewards"><span>FIX <strong>−1</strong></span><span>SPIN <strong>+1</strong></span></div><p class="tutorial-note">FIX 라인을 모두 비우면 Stage Clear!</p></div>`;
}
function renderTutorial(){const last=tutorialPage===2;const dots=`<div class="tutorial-dots">${[0,1,2].map(index=>`<i class="${index===tutorialPage?'active':''}"></i>`).join('')}</div>`;showModal('HOW TO PLAY',`Game Guide · ${tutorialPage+1}/3`,tutorialHtml(tutorialPage)+dots,last?(startedAt===null?'게임 시작':'게임으로 돌아가기'):'다음',()=>{if(last){closeModal();return}tutorialPage++;renderTutorial()})}
function openHelp(){tutorialPage=0;renderTutorial()}
function showModal(kicker,title,body,button,action){document.querySelector('#modal-kicker').textContent=kicker;document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-body').innerHTML=body;const btn=document.querySelector('#modal-btn');btn.disabled=false;btn.textContent=button;btn.onclick=action;document.querySelector('#modal').classList.remove('hidden')}
function closeModal(){document.querySelector('#modal').classList.add('hidden')}
function gameOver(){finishGame('NO MORE MOVES','Game Over','남은 스핀과 유효한 Merge가 없습니다.')}
function stageClear(){finishGame('FIX LINE CLEAR','Stage Clear!','FIX 라인의 모든 블록을 소거했습니다.')}
function renderHandStatus(){
  const rail=document.querySelector('#hand-status');
  if(!rail)return;
  rail.innerHTML=Array.from({length:ROWS},(_,row)=>{
    const hand=hands.find(item=>item.row===row);
    const reward=hand?HAND_SCORE[hand.name]*(chain+1):0;
    return hand
      ? `<button class="hand-state ready" type="button" data-row="${row}" aria-label="${hand.name} 행 제거"><span>${hand.name}</span><strong>+${reward.toLocaleString()}</strong><small>CLICK</small></button>`
      : '<div class="hand-state"><span>—</span></div>';
  }).join('');
  rail.querySelectorAll('button.ready').forEach(button=>button.onclick=()=>clearHand(Number(button.dataset.row)));
}
let mobileDrag=null;
board.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const cell=e.target.closest('.cell');if(!cell)return;const row=Number(cell.dataset.row),col=Number(cell.dataset.col);if(col<4&&getCard(row,col)&&!hands.some(h=>h.row===row)){e.preventDefault();mobileDrag={row,col,pointerId:e.pointerId};board.setPointerCapture?.(e.pointerId)}},true);
board.addEventListener('pointerup',e=>{if(!mobileDrag||e.pointerId!==mobileDrag.pointerId)return;e.preventDefault();const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cell');const source=mobileDrag;mobileDrag=null;board.releasePointerCapture?.(e.pointerId);if(target){const row=Number(target.dataset.row),col=Number(target.dataset.col);if(row!==source.row||col!==source.col){drag={row:source.row,col:source.col};mergeTo(row,col)}}},true);
board.addEventListener('pointercancel',e=>{if(mobileDrag&&e.pointerId===mobileDrag.pointerId){mobileDrag=null;board.releasePointerCapture?.(e.pointerId)}},true);
spinBtn.onclick=spin;document.querySelector('#help-btn').onclick=openHelp;reset();openHelp();
