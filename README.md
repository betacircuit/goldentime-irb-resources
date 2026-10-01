# GoldenTime Router · IRB 부록 자료

IRB appendix에 넣을 자료 링크를 안내하는 정적 웹페이지입니다.
HTML, CSS, JavaScript만 사용하며 설치하거나 빌드할 패키지가 없습니다.

## 자료 링크 추가

`links.json`의 `resources` 배열에 항목을 추가하고 `main`에 커밋합니다.
Vercel의 GitHub 연결이 설정되어 있으면 변경 사항이 자동 배포됩니다.

```json
{
  "title": "자료 이름",
  "description": "자료에 대한 짧은 설명",
  "type": "PDF",
  "url": "https://example.com/document.pdf"
}
```

HTTPS 링크만 지원합니다. 순서는 배열 순서를 따릅니다.
현재 포함된 링크는 사용자가 제공한 https://irb2026.pages.dev/ 입니다.

## Vercel 설정

- Framework Preset: Other
- Root Directory: 저장소 루트
- Build Command: 없음
- Output Directory: `.`

`vercel.json`이 정적 배포 설정과 기본 응답 헤더를 제공합니다.
로고는 사용자 제공 원본을 `logo.png`에 보관합니다.

## 로컬 미리보기

```sh
python -m http.server 4173
```

브라우저에서 http://localhost:4173 을 엽니다.
