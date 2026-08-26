# Merge Poker — Game Design Document

버전: v0.3 · 수정일: 2026-08-26

## 1. 게임 목표

플레이어의 최종 목표는 **FIX 라인에 배치된 모든 블록을 제거하는 것**이다.

- FIX 라인의 마지막 블록이 제거되는 즉시 Stage Clear로 판정한다.
- 점수는 플레이 성과와 글로벌 순위를 나타내는 지표다.

## 2. 시작 보드

게임 시작 전에 Stage 1~7 중 하나를 선택한다. 게임 시작 시 Production 4개 라인의 28칸은 모두 채우고, FIX 라인은 선택한 Stage와 같은 수량만 채운다.

- Production Line은 각 라인의 고정 Suit와 Rank 가중치로 채운다.
- FIX Line은 하단부터 `선택 Stage 수`만큼 랜덤 Suit와 Rank 가중치로 채운다.
- 모든 시작 카드는 기존 Rank 가중치 규칙에 따라 서로 독립적으로 랜덤 생성하며, 특정 Hand를 보장하지 않는다.
- Stage별 시작 SPIN은 아래 표를 따른다.

| Stage | 시작 FIX | 시작 SPIN |
|---:|---:|---:|
| 1 | 1 | 3 |
| 2 | 2 | 4 |
| 3 | 3 | 5 |
| 4 | 4 | 6 |
| 5 | 5 | 7 |
| 6 | 6 | 8 |
| 7 | 7 | 10 |

## 3. 유효 Hand

Hand는 가로 Row의 카드 5장을 기준으로 Rank만 판정한다. 제거 가능한 Hand는 아래 3종뿐이다.

| Hand | 조건 | Hand 점수 | SPIN 보너스 포함 실질 가치 |
|---|---|---:|---:|
| Three of a Kind | 동일 Rank 3장 | 300 | 1,300 |
| Four of a Kind | 동일 Rank 4장 | 800 | 1,800 |
| Five of a Kind | 동일 Rank 5장 | 1,500 | 2,500 |

- Pair, Two Pair, Straight, Full House는 Hand로 인정하지 않는다.
- 동시에 여러 조건을 만족하면 가장 높은 동일 Rank 개수를 적용한다.
- Hand 제거 시 SPIN 기회를 1회 얻으므로 Hand 점수는 잔여 SPIN의 최종 점수 가치 1,000점을 고려해 책정했다.
- 연속 제거 시 기존 Chain 배율을 Hand 점수에 적용한다.

## 4. Hand 제거 조작

가로 Swipe/Slice 조작은 사용하지 않는다.

1. 유효 Hand가 완성되면 해당 Row와 오른쪽 HAND 네비게이터를 강조한다.
2. HAND 네비게이터에 Hand 이름, 예상 획득 점수, `CLICK`을 표시한다.
3. 플레이어가 활성화된 HAND 네비게이터를 클릭 또는 탭하면 해당 Row를 제거한다.
4. Production Card 4장과 같은 Row의 FIX Card 1장을 함께 제거한다.
5. Production과 FIX 라인에 Gravity를 적용한다.
6. 성공한 Hand 제거마다 SPIN 기회 1회를 지급한다.

보드 Row 자체의 Swipe, Slice, Drag 제스처로는 Hand가 제거되지 않는다.

## 5. 슬롯 SPIN

- 선택한 Stage에 대응하는 3~10회의 시작 SPIN 기회를 제공한다.
- SPIN 1회당 기회 1회를 차감한다.
- SPIN은 Production Line의 모든 빈칸을 각 Line의 Suit 카드로 채운다.
- FIX Line에는 SPIN으로 새 카드를 추가하지 않는다.
- 보드에 Production 빈칸이 없으면 SPIN할 수 없다.

## 6. Merge와 FIX

- 같은 Suit·같은 Rank의 Production Card를 같은 Line 안에서 Merge할 수 있다.
- 조건이 같은 Production Card를 FIX Card에 Merge할 수 있다.
- FIX Rank 9는 Merge Target이 될 수 없으며 Hand 제거로만 없앨 수 있다.
- Merge 또는 Hand 제거 후 해당 라인에 Gravity를 적용한다.

## 7. 핵심 게임 흐름

1. Stage 1~7을 선택하고 Production 28장, Stage 수만큼의 FIX, Stage별 SPIN으로 시작한다.
2. 무작위 시작 보드에서 가능한 Merge 또는 완성된 Hand를 탐색한다.
3. Merge로 Rank와 Row 배열을 조정한다.
4. 빈칸이 생기면 필요에 따라 SPIN으로 Production 영역을 다시 채운다.
5. Three/Four/Five of a Kind를 완성하고 HAND 네비게이터로 제거한다.
6. Hand 제거로 FIX를 하나씩 줄이고 SPIN을 회복한다.
7. FIX 라인을 모두 비우면 Stage Clear다.

## 8. 최종 점수와 리더보드

**최종 점수 = (Hand 제거 점수 + 잔여 SPIN 수 × 1,000) - 전체 플레이 시간(초) × 10**

- 예외: 실행 가능한 SPIN, Merge, 제거 가능한 Hand가 모두 없으면 즉시 Game Over이며 최종 점수는 0점이다.
- Game Over의 0점 기록은 Top 100에 등록하지 않는다.
- 플레이 시간은 첫 게임 행동부터 종료까지 초 단위로 측정한다.
- 각 Stage의 기록을 서로 분리한다.
- Stage별 최종 점수 내림차순, 동점이면 짧은 플레이 시간 순으로 정렬한다.
- 해당 Stage Top 100 진입 시 최대 16자의 플레이어 이름을 입력한다.
- Supabase 글로벌 리더보드를 사용하고 연결 실패 시 로컬 저장소로 대체한다.

## 9. 구현 판정 기준

- Row 수: 7
- 시작 카드 수: Production 28장 + FIX 1~7장(Stage와 동일)
- Stage별 시작 SPIN: 3 / 4 / 5 / 6 / 7 / 8 / 10
- 시작 보장 Hand: 없음
- 유효 Hand: Three / Four / Five of a Kind
- Hand 제거 입력: 오른쪽 HAND 네비게이터 클릭·탭만 허용
- Hand 제거 보상: Hand 점수 + SPIN 1회
- 클리어 조건: FIX 배열의 모든 칸이 비어 있음
- 게임 오버: 실행 가능한 SPIN, 유효 Merge, 제거 가능한 Hand가 모두 없음. 최종 점수 0점
- 리더보드: Stage별 독립 Top 100
