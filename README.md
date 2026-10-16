# Penny Chart

차트를 같이 보는 AI 동료 **Penny** — Windows용 차트 데스크톱 앱입니다.
이 저장소는 **설치 파일 배포용**이며 소스 코드는 공개하지 않습니다.

Desktop charting app for Windows with an AI companion. This repository only distributes the installer; the source code is not public.

**최신 버전 · Latest: [v2.4.53](../../releases/tag/v2.4.53)**

## 설치 · Install

1. [Releases](../../releases/latest) 에서 `Penny-Chart-Beta-<버전>-x64.exe` 를 내려받아 실행합니다.
2. Windows 가 "알 수 없는 게시자" 경고를 띄우면 **추가 정보 → 실행** 을 누르세요. (설치 파일에 코드 서명이 없습니다.)
3. 설치 뒤에는 새 버전이 올라오면 앱 맨 위 헤더에 `업데이트` 단추가 나타납니다. 누르면 내려받아 설치하며, 서명(ed25519)과 해시(sha512)가 맞지 않는 파일은 설치하지 않습니다.

## 특징

- 차트 + AI 분석(Penny), 자리 판정 점수, 조건 검색(스크리너), 백테스트
- 스크립트로 만드는 나만의 지표, 그림 도구, 여러 차트 분할
- 가격·지표 조건 알림(Discord 웹훅), 차트 사진·화면 녹화
- 회원가입 없음. API 키는 이 PC에만 저장되며, 원하면 비밀번호로 더 단단히 잠글 수 있습니다(AES-256-GCM + scrypt).

## 유의

- 투자 자문이 아니며, 매매 결과에 대한 책임은 사용자에게 있습니다.
- 증권사·시세 API 키는 사용자가 직접 발급해 연결합니다.

## 문의 · 저작권

문의: x.com/dorytossy

Copyright 2026 dorytossy. All rights reserved.

이 프로그램은 다음 소프트웨어를 사용합니다: OpenAlgo Charts (Apache License 2.0), Electron (MIT), Chromium. 각 라이선스는 설치 폴더의 `LICENSE-OpenAlgo-Apache-2.0.txt`, `NOTICE.txt`, `LICENSE.electron.txt`, `LICENSES.chromium.html` 에 들어 있습니다.

## VirusTotal 검사 결과

[![VirusTotal](https://img.shields.io/badge/VirusTotal-v2.4.53%20scan%200%2F65-394EFF?logo=virustotal)](../../releases/latest)

최신 설치 파일의 VirusTotal 보고서 (Latest installer reports):

- `Penny-Chart-Beta-2.4.53-x64.exe` — **0/65** — https://www.virustotal.com/gui/file/77acb7fc0c992a9964c5466b8d39198c0e74a51ea54d327a5eafbe1677c1f434

릴리스 발행 시 [자동 검사 워크플로](../../actions/workflows/virustotal.yml)가 설치 파일을 검사하고, 각 [릴리스](../../releases) 설명 끝의 **VirusTotal** 섹션에 탐지 수, SHA-256, 보고서 링크를 추가합니다. 탐지 0건은 안전을 보증하지 않습니다. [설정 안내](VIRUSTOTAL_KO.md)
