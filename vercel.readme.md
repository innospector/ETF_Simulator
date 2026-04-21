# Vercel 배포 가이드

## 개요

이 프로젝트는 Vercel에서 정적 파일(`public/`) + 서버리스 함수(`api/etf.js`) 구조로 배포됩니다.

- 정적 배포 루트: `public/`
- 서버리스 API: `api/etf.js`
- 기본 운영 방식: GitHub `main` 푸시 시 자동 배포

---

## 필수 설정

`vercel.json` 설정:

```json
{
  "buildCommand": null,
  "outputDirectory": "public",
  "framework": null,
  "installCommand": null
}
```

핵심 포인트:

- `outputDirectory`는 반드시 `"public"` 이어야 합니다.
- 루트 `index.html`은 레거시로 보고, 실제 수정/배포 대상은 `public/index.html`입니다.

---

## 배포 방법

### 1) 자동 배포 (권장)

1. 코드 수정
2. 커밋
3. `main` 브랜치 푸시

```bash
git add .
git commit -m "update UI/layout"
git push origin main
```

Vercel이 GitHub 변경을 감지해 자동으로 재배포합니다.

### 2) 수동 배포 (필요 시)

```bash
vercel deploy --prod --yes
```

사전 조건: Vercel CLI 로그인(`vercel login`)

---

## 로컬 개발과 차이

- 정적 확인만 할 때:

```bash
python3 -m http.server 8000 --directory public
```

- API(`/api/etf`)는 Vercel 런타임 기반이므로, 로컬에서는 별도 서버(`server.js`) 또는 배포 환경에서 확인해야 합니다.

---

## 트러블슈팅 메모

### 1) `Function Runtimes must have a valid version`

- 원인: `vercel.json`에 런타임 버전 하드코딩(예: `nodejs20.x`)
- 해결: 런타임 지정 제거 (Vercel 자동 감지 사용)

### 2) 배포 후 "Not found"

- 원인: 루트 HTML 기준으로 배포되었다고 오해
- 해결: `public/` 기준 구조 유지 + `outputDirectory: "public"` 확인

### 3) 라우팅/정적 서빙 꼬임

- 원인: 레거시 `version: 2`/커스텀 routes 혼용
- 해결: 단순 구성 유지 (`public/` 컨벤션 + 기본 정적 서빙)

---

## 운영 체크리스트

- [ ] 수정 파일이 `public/index.html` 기준인지 확인
- [ ] `vercel.json`의 `outputDirectory`가 `public`인지 확인
- [ ] `git push origin main` 후 Vercel 배포 상태 확인
- [ ] 라이브 URL에서 UI/차트/API 정상 동작 확인

