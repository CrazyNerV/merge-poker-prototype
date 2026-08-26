const SUITS=[{symbol:'♠',red:false},{symbol:'♥',red:true},{symbol:'♦',red:true},{symbol:'♣',red:false}];
const SUIT_CLASS=['suit-spade','suit-heart','suit-diamond','suit-club'];
const COLOR_NAMES=['BLACK','RED','BLUE','GREEN'];
const RANKS=['1','2','3','4','5','6','7','8','9'];
const DICE_PATTERNS=[[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9],[1,3,4,5,6,7,9],[1,2,3,4,6,7,8,9],[1,2,3,4,5,6,7,8,9]];
const ROWS=7,COLS=5,STAGE_SPINS=[0,3,4,5,6,7,8,10],HAND_SCORE={'Three of a Kind':500,'Four of a Kind':2000,'Five of a Kind':5000};
const SPIN_SCORE=5000,TIME_PENALTY=10,SCORE_RULESET_START='2026-08-26T06:33:00Z';
let grid=[],fix=[],selectedStage=1,score=0,sliceScore=0,spins=0,spinsLeft=0,drag=null,hands=[],chain=0,busy=false,startedAt=null,gameEnded=false,gameplayActive=false;
const board=document.querySelector('#board'),spinBtn=document.querySelector('#spin-btn'),fx=document.querySelector('#fx'),toast=document.querySelector('#toast');
function maxRankIndex(){return selectedStage<=2?5:8}
function maxRankValue(){return maxRankIndex()+1}
function weightedRank(){const faces=maxRankValue();let n=Math.random()*(faces*(faces+1)/2);for(let r=0;r<faces;r++){n-=faces-r;if(n<0)return r}return faces-1}
function diceHtml(rank,extra=''){const active=DICE_PATTERNS[rank];return `<div class="dice-face ${extra}" role="img" aria-label="주사위 ${rank+1}">${Array.from({length:9},(_,index)=>`<i class="pip ${active.includes(index+1)?'on':''}"></i>`).join('')}</div>`}
function reset(){grid=Array.from({length:4},(_,suit)=>Array.from({length:ROWS},()=>({suit,rank:weightedRank()})));fix=Array(ROWS-selectedStage).fill(null).concat(Array.from({length:selectedStage},()=>({suit:Math.floor(Math.random()*4),rank:weightedRank()})));score=0;sliceScore=0;spins=0;spinsLeft=STAGE_SPINS[selectedStage];drag=null;hands=[];chain=0;busy=false;startedAt=null;gameEnded=false;gameplayActive=false;closeModal();render()}
function getCard(row,col){return col===4?fix[row]:grid[col][row]}
function render(){detectHands();board.innerHTML='';for(let row=0;row<ROWS;row++){for(let col=0;col<COLS;col++){const card=getCard(row,col),cell=document.createElement('div');cell.className=`cell ${col===4?'fix-cell':''} ${hands.some(h=>h.row===row)?'hand':''}`;cell.dataset.row=row;cell.dataset.col=col;if(card){const suit=SUITS[card.suit];cell.innerHTML=`<div class="card dice-card ${suit.red?'red':''} ${SUIT_CLASS[card.suit]} ${col===4?'fix-card':''}" draggable="${col<4}">${diceHtml(card.rank)}${col===4?'<div class="fix-tag">FIXED</div>':''}</div>`}bindCell(cell,row,col);board.appendChild(cell)}}renderHandStatus();document.querySelector('#score').textContent=score.toLocaleString();document.querySelector('#stage-count').textContent=selectedStage;document.querySelector('#spin-count').textContent=spinsLeft;document.querySelector('#fix-count').textContent=fix.filter(Boolean).length;document.querySelector('#progress-fill').style.width=`${(selectedStage-fix.filter(Boolean).length)/selectedStage*100}%`;spinBtn.disabled=busy||!canSpin();renderReels();if(gameplayActive){if(fix.every(card=>card===null))stageClear();else if(!canSpin()&&!hasReliefMerge())gameOver()}}
function renderReels(results){document.querySelector('#reels').innerHTML=SUITS.map((s,i)=>`<div class="reel ${s.red?'red':''} ${SUIT_CLASS[i]} ${results?'rolling':''}">${diceHtml(results?results[i]:0,'reel-die')}<small>${COLOR_NAMES[i]} · D${maxRankValue()}</small></div>`).join('')}
function bindCell(cell,row,col){cell.ondragstart=e=>{if(col===4||!getCard(row,col)){e.preventDefault();return}drag={row,col};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',`${row},${col}`);cell.firstChild.classList.add('dragging')};cell.ondragover=e=>{if(drag)e.preventDefault()};cell.ondrop=e=>{e.preventDefault();mergeTo(row,col)};cell.ondragend=()=>{drag=null;render()}}
function canSpin(){return spinsLeft>0&&grid.some(col=>col.some(x=>x===null))}
function startTimer(){if(startedAt===null)startedAt=Date.now()}
function spin(){if(!canSpin()||busy)return;startTimer();busy=true;chain=0;const results=SUITS.map(()=>weightedRank());renderReels(results);spinBtn.disabled=true;setTimeout(()=>{for(let col=0;col<4;col++)for(let row=0;row<ROWS;row++)if(grid[col][row]===null)grid[col][row]={suit:col,rank:weightedRank()};spins++;spinsLeft--;busy=false;flash('FULL SPIN!');render()},430)}
function insert(col,card){const row=grid[col].findIndex(x=>x!==null);if(row===-1){grid[col][ROWS-1]=card;return}grid[col][row-1]=card}
function insertFix(card){const row=fix.findIndex(x=>x!==null);if(row===-1){fix[ROWS-1]=card;return}fix[row-1]=card}
function mergeTo(row,col){if(!drag||busy)return;const from=getCard(drag.row,drag.col),target=getCard(row,col),source={...drag};drag=null;const maxRank=maxRankIndex(),maxValue=maxRank+1;if(col===4&&target?.rank===maxRank){showToast(`FIX ${maxValue}는 Merge할 수 없어요`);render();return}if(!from||!target||source.col===col&&source.row===row||from.suit!==target.suit||from.rank!==target.rank){showToast('동일한 색상과 눈의 주사위만 Merge할 수 있어요');render();return}if(col<4&&col!==source.col){showToast('Production 주사위는 같은 Color Line 안에서 Merge하세요');render();return}startTimer();if(from.rank===maxRank){grid[source.col][source.row]=null;if(col<4)grid[col][row]=null;else{fix[row]=null;gravityFix()}score+=2500;gravity(source.col);if(col<4)gravity(col);flash('MAX MERGE');showToast(`${maxValue} + ${maxValue} Max Merge!`);render();return}if(col===4)fix[row].rank++;else grid[col][row].rank++;grid[source.col][source.row]=null;score+=50*(from.rank+1);gravity(source.col);chain=0;flash(`${RANKS[from.rank+1]} MERGE`);render()}
function gravity(col){const cards=grid[col].filter(Boolean);grid[col]=Array(ROWS-cards.length).fill(null).concat(cards)}
function gravityFix(){const cards=fix.filter(Boolean);fix=Array(ROWS-cards.length).fill(null).concat(cards)}
function detectHands(){hands=[];for(let row=0;row<ROWS;row++){const cards=Array.from({length:5},(_,c)=>getCard(row,c));if(cards.some(x=>!x))continue;const name=evaluate(cards.map(x=>x.rank));if(name)hands.push({row,name})}}
function evaluate(ranks){const count={};ranks.forEach(r=>count[r]=(count[r]||0)+1);const highest=Math.max(...Object.values(count));if(highest===5)return'Five of a Kind';if(highest===4)return'Four of a Kind';if(highest===3)return'Three of a Kind';return null}
function clearHand(row){const hand=hands.find(h=>h.row===row);if(!hand)return;startTimer();chain++;for(let col=0;col<4;col++){grid[col][row]=null;gravity(col)}fix[row]=null;gravityFix();const gain=HAND_SCORE[hand.name]*chain;score+=gain;sliceScore+=gain;const spinBonus=true;spinsLeft++;flash(`${hand.name.toUpperCase()} · ${chain} CHAIN`);showToast(`${hand.name} +${gain.toLocaleString()}${spinBonus?' · SPIN +1':''}`);render()}
function hasReliefMerge(){const maxRank=maxRankIndex();for(let col=0;col<4;col++){for(let a=0;a<ROWS;a++)for(let b=a+1;b<ROWS;b++)if(grid[col][a]&&grid[col][b]&&grid[col][a].rank===grid[col][b].rank)return true;for(let row=0;row<ROWS;row++)if(grid[col][row]&&fix.some(card=>card&&card.rank!==maxRank&&card.suit===grid[col][row].suit&&card.rank===grid[col][row].rank))return true}return hands.length>0}
function flash(text){fx.textContent=text;fx.classList.remove('pop');void fx.offsetWidth;fx.classList.add('pop')}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800)}
const LEADERBOARD_KEY='merge-dice-leaderboard-v3-score-season';
const backendConfig=window.MERGE_POKER_BACKEND||{};
const leaderboardApi=backendConfig.url&&backendConfig.publishableKey&&window.supabase?.createClient
  ? window.supabase.createClient(backendConfig.url,backendConfig.publishableKey)
  : null;
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function stageLeaderboardKey(){return`${LEADERBOARD_KEY}-${selectedStage}`}
function loadLocalLeaderboard(){try{const data=JSON.parse(localStorage.getItem(stageLeaderboardKey())||'[]');return Array.isArray(data)?data.slice(0,100):[]}catch{return[]}}
function saveLocalLeaderboard(entries){try{localStorage.setItem(stageLeaderboardKey(),JSON.stringify(entries.slice(0,100)))}catch{}}
async function loadLeaderboard(){
  if(!leaderboardApi)return loadLocalLeaderboard();
  const{data,error}=await leaderboardApi.from('leaderboard').select('player_name,score,slice_score,spins_left,play_time,created_at,stage').eq('stage',selectedStage).gte('created_at',SCORE_RULESET_START).order('score',{ascending:false}).order('play_time',{ascending:true}).limit(100);
  if(error)throw error;
  return data.map(row=>({name:row.player_name,score:row.score,sliceScore:row.slice_score,spinsLeft:row.spins_left,elapsed:row.play_time,date:row.created_at}));
}
async function persistScore(record,entries){
  if(leaderboardApi){
    const{error}=await leaderboardApi.from('leaderboard').insert({player_name:record.name,score:record.score,slice_score:record.sliceScore,spins_left:record.spinsLeft,play_time:record.elapsed,stage:selectedStage});
    if(error)throw error;
    return loadLeaderboard();
  }
  entries.push(record);entries.sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed);saveLocalLeaderboard(entries);return entries.slice(0,100);
}
function getFinalScore(){const elapsed=Math.max(0,Math.floor((Date.now()-(startedAt??Date.now()))/1000));return{elapsed,finalScore:sliceScore+spinsLeft*SPIN_SCORE-elapsed*TIME_PENALTY}}
function leaderboardHtml(entries){if(!entries.length)return'<p class="empty-board">아직 등록된 기록이 없습니다.</p>';return `<ol class="leaderboard">${entries.map((entry,index)=>`<li><b>${index+1}</b><span>${escapeHtml(entry.name)}</span><strong>${entry.score.toLocaleString()}</strong></li>`).join('')}</ol>`}
function scoreFormulaHtml(result){return result.zeroed?'<div class="score-formula zero-score"><span>NO MOVES</span><strong>FINAL 0</strong></div>':`<div class="score-formula"><span>HAND ${sliceScore.toLocaleString()}</span><span>SPIN ${spinsLeft} × ${SPIN_SCORE.toLocaleString()}</span><span>TIME ${result.elapsed}s × ${TIME_PENALTY}</span><strong>FINAL ${result.finalScore.toLocaleString()}</strong></div>`}
function showLeaderboardResult(kicker,title,reason,result,entries){showModal(kicker,title,`<p>${reason}</p>${scoreFormulaHtml(result)}<h2>STAGE ${selectedStage} · ${leaderboardApi?'GLOBAL':'LOCAL'} TOP 100</h2>${leaderboardHtml(entries)}`,'단계 선택',showStageSelect)}
async function finishGame(kicker,title,reason,{zeroScore=false}={}){
  if(gameEnded)return;gameEnded=true;busy=true;const result=zeroScore?{elapsed:0,finalScore:0,zeroed:true}:getFinalScore();if(zeroScore){score=0;document.querySelector('#score').textContent='0'}let entries;
  try{entries=await loadLeaderboard()}catch{entries=loadLocalLeaderboard();showToast('리더보드 연결 실패 · 로컬 모드')}
  if(zeroScore){showLeaderboardResult(kicker,title,reason,result,entries);return}
  const qualifies=entries.length<100||result.finalScore>(entries[entries.length-1]?.score??-Infinity);
  if(!qualifies){showLeaderboardResult(kicker,title,reason,result,entries);return}
  showModal(kicker,title,`<p>${reason}</p>${scoreFormulaHtml(result)}<label class="name-entry">STAGE ${selectedStage} TOP 100 기록 이름<input id="player-name" maxlength="16" autocomplete="nickname" placeholder="PLAYER"></label>`,'기록 저장',async()=>{const input=document.querySelector('#player-name'),name=input?.value.trim()||'PLAYER',record={name,score:result.finalScore,sliceScore,spinsLeft,elapsed:result.elapsed,stage:selectedStage,date:new Date().toISOString()};const button=document.querySelector('#modal-btn');button.disabled=true;button.textContent='저장 중…';let latest;try{latest=await persistScore(record,entries)}catch{entries.push(record);entries.sort((a,b)=>b.score-a.score||a.elapsed-b.elapsed);saveLocalLeaderboard(entries);latest=entries.slice(0,100);showToast('서버 저장 실패 · 로컬 저장')}showLeaderboardResult(kicker,title,reason,result,latest)})
}
let tutorialPage=0;
function tutorialCard(rank,suit,fixCard=false){const data=SUITS[suit];return `<div class="tutorial-cell ${fixCard?'tutorial-fix':''}"><div class="card dice-card ${data.red?'red':''} ${SUIT_CLASS[suit]} ${fixCard?'fix-card':''}">${diceHtml(Number(rank)-1)}${fixCard?'<div class="fix-tag">FIXED</div>':''}</div></div>`}
function tutorialRow(ranks){return `<div class="tutorial-column-heads"><span>⚄</span><span>⚄</span><span>⚄</span><span>⚄</span><b>FIX</b></div><div class="tutorial-row">${ranks.map((rank,index)=>tutorialCard(rank,index<4?index:0,index===4)).join('')}</div>`}
function tutorialHtml(page){
  if(page===0)return `<div class="tutorial-page"><div class="tutorial-scene merge-scene"><div class="tutorial-source">${tutorialCard(4,3)}${tutorialCard(4,3)}</div><div class="tutorial-merge-arrow"><i>↗</i><span>DRAG &amp; MERGE</span></div><div class="tutorial-result">${tutorialCard(5,3)}<strong>PIP +1</strong></div></div><h2>같은 주사위끼리 머지</h2><p>같은 Color Line 안에서 색상과 눈이 같은 두 주사위를 드래그해 합칩니다. 합쳐진 주사위는 눈이 1 증가합니다.</p><p class="tutorial-note">Stage ${selectedStage}: D${maxRankValue()} · FIX ${maxRankValue()}는 머지 대상이 아닙니다.</p></div>`;
  if(page===1)return `<div class="tutorial-page"><div class="tutorial-board">${tutorialRow([3,3,3,6,Math.min(5,maxRankValue())])}<div class="tutorial-hand-ready">THREE OF A KIND · READY</div></div><h2>3·4·5개 동일 눈 핸드</h2><p>가로 5개 중 같은 눈이 3개 이상이면 HAND 네비게이터가 활성화됩니다.</p><div class="tutorial-score-list">${Object.entries(HAND_SCORE).map(([name,value])=>`<span>${name}<strong>+${value.toLocaleString()}</strong></span>`).join('')}</div></div>`;
  return `<div class="tutorial-page"><div class="tutorial-board submit-board">${tutorialRow([4,4,4,Math.min(6,maxRankValue()),2])}<button class="tutorial-submit" type="button">THREE OF A KIND<strong>+${HAND_SCORE['Three of a Kind'].toLocaleString()}</strong><small>CLICK TO CLEAR</small></button></div><h2>HAND 네비게이터로 제출</h2><p>오른쪽에 활성화된 HAND 버튼을 누르면 해당 행의 주사위 다섯 개와 FIX 블록이 함께 제거됩니다.</p><div class="tutorial-rewards"><span>FIX <strong>−1</strong></span><span>SPIN <strong>+1</strong></span></div><p class="tutorial-note">FIX 라인을 모두 비우면 Stage Clear!</p></div>`;
}
function renderTutorial(){const last=tutorialPage===2;const dots=`<div class="tutorial-dots">${[0,1,2].map(index=>`<i class="${index===tutorialPage?'active':''}"></i>`).join('')}</div>`;showModal('HOW TO PLAY',`Game Guide · ${tutorialPage+1}/3`,tutorialHtml(tutorialPage)+dots,last?(startedAt===null?'게임 시작':'게임으로 돌아가기'):'다음',()=>{if(last){closeModal();if(!gameplayActive){gameplayActive=true;render()}return}tutorialPage++;renderTutorial()})}
function openHelp(){tutorialPage=0;renderTutorial()}
function showStageSelect(){gameplayActive=false;const options=Array.from({length:7},(_,index)=>{const stage=index+1,dice=stage<=2?'D6':'D9';return `<button class="stage-option" type="button" data-stage="${stage}"><span>STAGE ${stage} · ${dice}</span><small>FIX ${stage}</small><strong>SPIN ${STAGE_SPINS[stage]}</strong></button>`}).join('');showModal('SELECT STAGE','주사위 난이도 선택',`<p class="stage-select-copy">Stage 1~2는 D6, Stage 3~7은 D9를 사용합니다.</p><div class="stage-select">${options}</div>`,null,null);document.querySelectorAll('.stage-option').forEach(button=>button.onclick=()=>{selectedStage=Number(button.dataset.stage);reset();openHelp()})}
function showModal(kicker,title,body,button,action){document.querySelector('#modal-kicker').textContent=kicker;document.querySelector('#modal-title').textContent=title;document.querySelector('#modal-body').innerHTML=body;const btn=document.querySelector('#modal-btn');btn.disabled=false;btn.hidden=!button;btn.textContent=button||'';btn.onclick=action||null;document.querySelector('#modal').classList.remove('hidden')}
function closeModal(){document.querySelector('#modal').classList.add('hidden')}
function gameOver(){finishGame('NO MORE MOVES','Game Over','더 이상 실행할 수 있는 SPIN, Merge, Hand 제거가 없어 점수가 0점 처리됩니다.',{zeroScore:true})}
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
spinBtn.onclick=spin;document.querySelector('#help-btn').onclick=openHelp;showStageSelect();
