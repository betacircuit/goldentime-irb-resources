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

HTTPS 링크와 `/`로 시작하는 같은 사이트의 경로를 지원합니다. 순서는 배열 순서를 따릅니다.
`action` 필드로 버튼 문구를 지정할 수 있습니다. JavaScript 없이도 접근할 수 있도록
자료를 추가할 때 `index.html`의 기본 목록에도 동일한 링크를 추가합니다.

## 발표자료 슬라이드 쇼

`/slideshow.html`에서 빅카츄 · 김태현 발표자료 34장을 볼 수 있습니다.
원본 PDF는 `assets/bigkachu-kim-taehyun/bigkachu-kim-taehyun.pdf`에 수정 없이 보관합니다.
각 페이지를 너비 2560px의 WebP로 렌더링하여 브라우저의 PDF 플러그인이나 외부 CDN 없이 표시합니다.
`slides.json`이 페이지 순서를 관리하고, 전체 목록에서는 작은 미리보기 이미지를 사용합니다.

- 방향키, Page Up/Down, Space: 이전/다음 장 (Shift+Space는 이전)
- Home/End: 첫 장/마지막 장
- F: 전체화면 켜기/끄기, Esc: 전체화면 또는 전체 목록 닫기
- G: 전체 슬라이드 목록, 번호 입력: 원하는 페이지로 이동
- 터치 화면: 좌우 스와이프, 화면 왼쪽 30% 클릭: 이전, 나머지 클릭: 다음
- `#slide-12`처럼 특정 슬라이드 주소를 공유할 수 있습니다.

전체화면에서는 조작 표시가 자동으로 숨겨지고 포인터 이동 시 다시 나타납니다.
전체화면 API를 지원하지 않는 브라우저에서는 일반 화면으로 볼 수 있습니다.
원본 PDF 다운로드 링크는 뷰어 상단에 있습니다.

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
