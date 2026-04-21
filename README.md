# 반도체 ETF 3종 DCA 시뮬레이터

한국 반도체 ETF 3종(KODEX 반도체, TIGER 반도체TOP10, SOL 반도체후공정)에 대한 DCA(Dollar Cost Averaging) 장기 투자 시뮬레이터.

- **라이브**: https://etf-simulator-epur.vercel.app
- **저장소**: https://github.com/innospector/ETF_Simulator

---

## 기술 스택

- **프론트엔드**: Vanilla HTML/CSS/JS (프레임워크 없음)
- **차트**: Chart.js 4.4.1 (CDN)
- **서버리스 API**: Vercel Functions (Node.js, `api/etf.js`)
- **데이터 소스**: Yahoo Finance (`query1.finance.yahoo.com`)
- **배포**: Vercel (GitHub 연동 + CLI)

---

## 디렉토리 구조

```
ETF_Simulator/
├── public/                   # Vercel이 자동 서빙하는 정적 파일 루트
│   ├── index.html            # 메인 시뮬레이터 (단일 파일 앱)
│   └── 1-2. CLAUDE_ETF_Toss_Manual.html
├── api/
│   └── etf.js                # Yahoo Finance 프록시 서버리스 함수
├── vercel.json               # Vercel 빌드 설정 (outputDirectory: public)
├── package.json
├── server.js                 # 로컬 개발용 Node.js 서버
├── index.html                # (레거시, public/로 이동됨)
├── 1-2. CLAUDE_ETF_Toss_Manual.html
├── 1. CLAUDE_토스증권_반도체ETF_매뉴얼.html
└── 2. CLAUDE_Semiconductor_ETF_Simulator.html
```

> **중요**: Vercel은 `public/` 폴더를 자동으로 정적 서빙합니다. 루트에 있는 HTML 파일들은 레거시이며 실제 배포본은 `public/` 내부입니다. 수정 시 반드시 `public/index.html`을 편집하세요.

---

## Vercel 배포 설정

```json
// vercel.json
{
  "buildCommand": null,
  "outputDirectory": "public",
  "framework": null,
  "installCommand": null
}
```

### 배포 워크플로우

1. **자동 배포**: `git push origin main` → Vercel이 감지하여 자동 재배포 (1~2분)
2. **수동 배포**: `vercel deploy --prod --yes` (CLI 로그인 필요)

### 이전에 겪었던 배포 이슈 (재발 방지용 메모)

| 증상 | 원인 | 해결 |
|---|---|---|
| `Function Runtimes must have a valid version` | `vercel.json`에 `runtime: nodejs20.x` 명시 | Node.js는 자동 감지, runtime 지정 제거 |
| "Not found" 표시 | 루트에 `index.html` 있어도 서빙 안 됨 | `public/` 폴더로 이동 + `outputDirectory: public` 설정 |
| 라우팅 안 됨 | `version: 2` 레거시 모드 + 잘못된 routes | `version: 2` 제거, `public/` 컨벤션 사용 |

---

## 시뮬레이터 핵심 로직

### 상태 (State)

```js
const S = {
  years: 15,           // 투자 기간 (1~30년)
  initial: 500,        // 초기 투자금 (만원)
  monthly: 80,         // 월 투자금 (만원)
  fee: 0.3,            // 세금·비용 (%)
  weights: [40, 40, 20],    // ETF 비중 (KODEX, TIGER, SOL)
  returns: [12, 18, 22],    // 연수익률 기본값 (%)
  scenario: 'base',         // 'bear' | 'base' | 'bull'
};
```

### 연수익률 슬라이더

- **범위**: -20% ~ +35%
- **JS 계산식**: `pct = (val - (-20)) / 55 * 100` (범위 너비 55)
- **시나리오 프리셋** (setScenario에서 슬라이더를 직접 세팅):
  - 약세: `[5, 8, 10]`
  - 기본: `[12, 18, 22]`
  - 강세: `[19, 28, 34]`

> **이전 버그 (해결됨)**: `SCENARIO_MULT` 배수(×0.45/×1.55)가 프리셋 값에 중첩 적용되어 강세 가중 CAGR이 41.5%(15년 82배)로 비현실적 결과 산출. 현재는 `SCENARIO_MULT = {bear:1.0, base:1.0, bull:1.0}`로 무력화하고 프리셋만 사용.

### 왜 Yahoo Finance 자동 동기화를 제거했나

초기 구현은 `syncRealtimeReturns()`로 Yahoo Finance에서 각 ETF의 1년 수익률을 받아 슬라이더를 자동 세팅했음. 하지만:

- 1년 단기 수익률(반도체 AI 붐으로 +50~100%)이 15년 장기 CAGR 추정치를 덮어씀
- 슬라이더가 매번 +35%(최대값)으로 clamp되어 비현실적 시뮬레이션
- 애널리스트 장기 컨센서스와 단기 실적의 성격이 다름

→ **자동 동기화 제거**, 슬라이더는 애널리스트 기반 장기 전망값으로 고정.

---

## 연수익률 근거 (글로벌 애널리스트 데이터 기반)

### 벤치마크 데이터

| 지표 | 수치 | 출처 |
|---|---|---|
| SMH 10년 CAGR | ~31% | 미국 반도체 ETF (VanEck) |
| SOXX 10년 CAGR | ~27% | 미국 반도체 ETF (iShares) |
| HBM 시장 장기 CAGR (2026-2040) | **18.33%** | Roots Analysis |
| SK하이닉스 HBM 전망 | 연 **30%** (2030까지) | SK하이닉스 공시 |
| TSMC 2026 매출 성장 | +30% | 골드만삭스 |
| BofA HBM 2026 전망 | +58% YoY | Bank of America |
| S&P 500 30년 CAGR (참고) | ~10~13% | 시장평균 |
| NVIDIA 10년 CAGR (극단치) | ~70% | 단일 종목, 15년 지속 불가 |

### 기본 시나리오 설계 근거

| ETF | 기본값 | 근거 |
|---|---|---|
| **KODEX 반도체** (091160) | **12%** | 대형 코어, S&P 500 장기 평균 근처 + 한국 디스카운트 |
| **TIGER 반도체TOP10** (395160) | **18%** | 삼성/하이닉스 집중 → HBM 시장 CAGR 18.33% 매칭 |
| **SOL 반도체후공정** (396500) | **22%** | AI/HBM 직접 수혜, SMH 31% 대비 보수적 |

### 강세 시나리오 설계 근거

| ETF | 강세값 | 근거 |
|---|---|---|
| KODEX | 19% | 대형 ETF 강세 상한 (SOXX 10년 CAGR 27% 대비 보수적) |
| TIGER | 28% | SOXX 10년 CAGR 수준 |
| SOL | 34% | SMH 10년 CAGR 31% 상회, AI 슈퍼사이클 최고점 |

→ 가중평균 ~26% CAGR (15년 ~39배) — SMH 역사적 실적 상한 근접.

### 약세 시나리오 설계 근거

2000 닷컴버블, 2008 금융위기, 2022 반도체 조정기의 10년 CAGR 관측치 기반:

| ETF | 약세값 | 근거 |
|---|---|---|
| KODEX | 5% | 대형 섹터 침체기 실질 CAGR |
| TIGER | 8% | 메모리 불황 사이클 반영 |
| SOL | 10% | 후공정은 AI 수혜로 약세에서도 상대 방어 |

---

## 로컬 개발

```bash
# 의존성 없음 (Vanilla JS)
cd /Users/TM4EX/ETF_Simulator
python3 -m http.server 8000 --directory public
# → http://localhost:8000
```

단, API 엔드포인트(`/api/etf`)는 Vercel 환경에서만 동작. 로컬에서는 `server.js` 실행 필요.

---

## 향후 작업 시 주의사항

1. **수정은 반드시 `public/index.html`에서** (루트의 `index.html`은 레거시)
2. **커밋 후 `git push`만 하면 Vercel 자동 재배포** (수동 `vercel deploy` 불필요)
3. **슬라이더 범위 변경 시** JS 계산식의 `/ 55 * 100` 상수 수정 필요 (범위 = max - min)
4. **시나리오 배수는 사용 금지**: `SCENARIO_MULT`는 모두 1.0으로 유지, 값 조정은 프리셋에서만
5. **Yahoo Finance 자동 동기화 복원 금지**: 장기 애널리스트 전망과 단기 실적이 충돌함

---

## 주요 출처 (References)

- [SMH vs SOXX: 10-Year CAGR Analysis](https://quantflowlab.com/smh-vs-soxx/)
- [HBM Market Forecast 2026-2040 (Roots Analysis)](https://www.rootsanalysis.com/high-bandwidth-memory-market)
- [Goldman Sachs: Markets Outlook 2026](https://www.goldmansachs.com/insights/goldman-sachs-research/markets-outlook-2026-some-like-it-hot)
- [SK Hynix 2026 HBM Outlook](https://news.skhynix.com/2026-market-outlook-focus-on-the-hbm-led-memory-supercycle/)
- [iShares SOXX ETF](https://www.ishares.com/us/products/239705/ishares-phlx-semiconductor-etf)
