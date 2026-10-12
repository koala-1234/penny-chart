# GitHub 릴리스 VirusTotal 자동 표시

배포 저장소 koala-1234/penny-chart에 설치하는 GitHub Actions입니다.
프로그램 소스 저장소에는 동작하지 않으며, 공개 릴리스의 Penny-Chart-Setup-*.exe와 Penny-Chart-Private-Test-*.exe만 검사합니다.

## 표시와 실행

릴리스 설명의 VirusTotal 검사 결과 표에 설치 파일별 상태, 악성/의심 탐지 수, 검사 시각(UTC), 보고서 링크를 표시합니다.
SHA-256을 함께 기록하고, GitHub가 제공한 SHA-256과 내려받은 파일 해시를 비교합니다.
검사 대기/진행/실패는 검사 완료 또는 탐지 0건으로 표시하지 않습니다.
탐지 0건은 안전 보증이 아닙니다. 파일이 교체되면 새 파일 기준으로 결과를 갱신합니다.

- 공개 릴리스 발행·편집: 자동 실행
- 6시간마다: 최신 릴리스 결과 갱신 및 미완료 검사 재확인
- Actions → VirusTotal release reports → Run workflow: 태그를 지정하거나 최신 릴리스를 수동 검사
- 기존 설명은 보존하고 전용 표시 블록만 갱신
- 같은 해시의 기존 보고서가 있으면 활용하며, 실제 보고서 검사 시각을 표시

32MB 초과 파일은 대용량 업로드 URL을 사용합니다. 최대 650MB 제한을 적용합니다.
API 요청은 16초 이상 간격을 두고 429 응답에 재시도합니다.
공개 API의 상업적 용도 제한과 사용량 정책은 본인 계정의 약관에 맞게 확인하세요.

## 최초 설정 (한 번)

1. VirusTotal 계정에서 API 키를 확인합니다. https://www.virustotal.com/gui/my-apikey
2. GitHub 배포 저장소의 Settings → Secrets and variables → Actions → New repository secret
3. 이름을 VT_API_KEY로 지정하고 키를 입력합니다. 키를 코드나 채팅에 올리지 마세요.
4. Actions → VirusTotal release reports → Run workflow에서 첫 검사를 시작합니다.

GitHub 토큰은 Actions의 기본 github.token을 사용합니다. 별도 GitHub PAT는 필요하지 않습니다.
VirusTotal에 제출한 공개 설치 파일은 해당 서비스의 공유·보관 정책을 적용받습니다.

설치할 파일:
- .github/workflows/virustotal.yml
- tools/virustotal-release.mjs

참고:
- https://docs.virustotal.com/reference/files-upload-url
- https://docs.virustotal.com/reference/analyses-object
- https://docs.virustotal.com/docs/api-overview
