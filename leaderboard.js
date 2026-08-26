const backendConfig=window.MERGE_POKER_BACKEND||{};
const leaderboardApi=backendConfig.url&&backendConfig.publishableKey&&window.supabase?.createClient
  ? window.supabase.createClient(backendConfig.url,backendConfig.publishableKey)
  : null;
const SCORE_RULESET_START='2026-08-26T06:33:00Z';
const tabs=document.querySelector('#stage-tabs');
const list=document.querySelector('#ranking-list');
const state=document.querySelector('#ranking-state');
const stageTitle=document.querySelector('#stage-title');
const stageSummary=document.querySelector('#stage-summary');
const refreshBtn=document.querySelector('#refresh-btn');
let currentStage=Math.min(7,Math.max(1,Number(new URL(location.href).searchParams.get('stage'))||7));

function renderTabs(){tabs.innerHTML='';for(let stage=1;stage<=7;stage++){const button=document.createElement('button');button.type='button';button.className=`stage-tab${stage===currentStage?' active':''}`;button.textContent=stage;button.setAttribute('aria-label',`Stage ${stage} 랭킹`);button.onclick=()=>selectStage(stage);tabs.appendChild(button)}}
function selectStage(stage){currentStage=stage;const url=new URL(location.href);url.searchParams.set('stage',stage);history.replaceState(null,'',url);renderTabs();loadRanking()}
function showState(message,error=false){state.textContent=message;state.className=`ranking-state${error?' error':''}`;list.innerHTML=''}
function formatTime(seconds){const minutes=Math.floor(seconds/60),rest=seconds%60;return`${minutes}:${String(rest).padStart(2,'0')}`}
function rankingItem(entry,index){const item=document.createElement('li');if(index<3)item.classList.add('top-three');const rank=document.createElement('span');rank.className='rank-number';rank.textContent=index+1;const player=document.createElement('span');player.className='player';player.textContent=entry.player_name;const time=document.createElement('span');time.className='play-time';time.textContent=formatTime(entry.play_time);const score=document.createElement('strong');score.className='rank-score';score.textContent=Number(entry.score).toLocaleString();item.append(rank,player,time,score);return item}
async function loadRanking(){stageTitle.textContent=currentStage;stageSummary.textContent=`STAGE ${currentStage} · SCORE V2`;showState('랭킹을 불러오는 중…');refreshBtn.disabled=true;try{if(!leaderboardApi)throw new Error('백엔드 설정을 찾을 수 없습니다.');const{data,error}=await leaderboardApi.from('leaderboard').select('player_name,score,play_time').eq('stage',currentStage).gte('created_at',SCORE_RULESET_START).order('score',{ascending:false}).order('play_time',{ascending:true}).limit(100);if(error)throw error;list.innerHTML='';data.forEach((entry,index)=>list.appendChild(rankingItem(entry,index)));if(data.length){state.className='ranking-state hidden'}else{showState('새 점수 시즌의 기록이 아직 없습니다.')}}catch(error){showState('리더보드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',true)}finally{refreshBtn.disabled=false}}

refreshBtn.onclick=loadRanking;
renderTabs();
loadRanking();
