# Penny Chart

차트를 같이 보는 AI 동료 **Penny** — Windows용 차트 데스크톱 앱입니다.
이 저장소는 **설치 파일 배포용**이며 소스 코드는 공개하지 않습니다.

Desktop charting app for Windows with an AI companion. This repository only distributes the installer; the source code is not public.

[Windows 다운로드](../../releases/latest) · [Android 다운로드](../../releases/download/android-latest/Penny-Chart-Android.apk)

**최신 버전 · Latest:** [PC v3.2.0](../../releases/tag/v3.2.0) (`Penny-Chart-Beta-3.2.0-x64.exe`)  
**Android:** [APK 2.8.12 (릴리스 빌드)](../../releases/tag/android-v2.8.12) (`Penny-Chart-Android-2.8.12.apk`)

## 설치 · Install

1. [Releases](../../releases/latest) 에서 `Penny-Chart-Beta-<버전>-x64.exe` 를 내려받아 실행합니다.
2. Windows 가 "알 수 없는 게시자" 경고를 띄우면 **추가 정보 → 실행** 을 누르세요. (설치 파일에 코드 서명이 없습니다.)
3. 설치 뒤에는 새 버전이 올라오면 앱 맨 위 헤더에 `업데이트` 단추가 나타납니다. 누르면 내려받아 설치하며, 서명(ed25519)과 해시(sha512)가 맞지 않는 파일은 설치하지 않습니다.

## Android 설치

[Android APK 다운로드](../../releases/download/android-latest/Penny-Chart-Android.apk) · [Android 릴리스 안내](../../releases/tag/android-latest)

Android 8.0 이상을 지원합니다. 현재 배포 파일은 정식 릴리스 서명 빌드입니다. 파일 이름과 다운로드 주소는 버전 번호 없이 유지합니다.

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

Windows 설치 파일의 검사 결과와 SHA-256은 [해당 릴리스](../../releases/latest)에서 확인하세요. 릴리스 발행 시 [자동 검사 워크플로](../../actions/workflows/virustotal.yml)가 결과를 릴리스 설명에 추가합니다. 탐지 0건은 안전을 보증하지 않습니다. [설정 안내](VIRUSTOTAL_KO.md)
