# Supabase + Vercel 연동

이 프로젝트는 **정적 HTML + JS**로 동작하며, `storageMode: "supabase"`일 때 **Supabase Auth**와 **Postgres**에 저장합니다.

## 1. Supabase

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다.
2. **SQL Editor**에서 `supabase/migrations/20250406000000_initial.sql` 내용을 실행합니다.
3. **Authentication → Providers → Email**에서 **이메일 확인(Confirm email)** 을 끄면, 회원가입 직후 바로 로그인할 수 있습니다. (운영 시에는 정책에 맞게 검토하세요.)
4. **Settings → API**에서 `Project URL`과 `anon` `public` API Key를 복사합니다.

## 2. 실시간 동기화(선택)

여러 탭에서 `app_kv` 변경을 즉시 반영하려면 **Database → Replication**에서 `app_kv` 테이블을 Realtime에 추가하거나, 마이그레이션 파일 주석의 `alter publication` 문을 실행합니다.

## 3. 클라이언트 설정

1. `auth-config.example.js`를 복사해 `auth-config.js`로 저장합니다.
2. 다음 값을 채웁니다.

   - `storageMode`: `"supabase"`
   - `supabaseUrl`: 프로젝트 URL
   - `supabaseAnonKey`: anon 공개 키
   - `syntheticEmailDomain`: 전화번호 로그인용 가상 이메일 도메인 (Supabase Auth가 허용하는 형식이어야 합니다. 문제가 있으면 `example.com` 등으로 바꿔 테스트하세요.)

## 4. Vercel 배포

1. 프로젝트를 Git에 푸시합니다.
2. [Vercel](https://vercel.com)에서 해당 저장소를 **Import**하고, **Root Directory**를 저장소 루트로 둡니다.
3. **Build Command / Output**은 기본(정적)으로 두면 됩니다. `vercel.json`이 루트에 있습니다.
4. **환경 변수**로는 이 프론트엔드만 쓰는 경우 필수는 아닙니다. 대신 **`auth-config.js`를 배포에 포함**하면 anon 키가 공개됩니다. Supabase는 **RLS(행 수준 보안)**로 보호되므로, **서비스 롤 키는 절대 클라이언트에 넣지 마세요.**

### auth-config 를 Git에 넣지 않을 때

- 로컬에서 `auth-config.js`를 채운 뒤 Vercel **Dashboard → Project → Settings → Environment Variables**에 넣을 수는 없지만(빌드 산출물이 아님), 대신 **Vercel 빌드 시 주입**하는 스크립트를 별도로 두거나, 배포 전에 `auth-config.js`를 CI에서 생성하는 방식을 쓸 수 있습니다.

## 5. 데이터 구조 요약

| 테이블 | 설명 |
|--------|------|
| `profiles` | 직원 프로필 (전화번호, 이름 등), `auth.users`와 연결 |
| `app_kv` | 기존 `localStorage` 키와 동일한 `key`, 값은 JSON (`value`) |
| `shuttle_public_snapshot` | 학부모용 셔틀 노선 스냅샷 (id=1, `payload` JSON). **anon 읽기 허용** |

## 6. 기존 로컬 데이터 옮기기

로컬 전용으로 쓰다가 Supabase로 바꾸는 경우, 첫 로그인 후 `app_kv`가 비어 있으면 데모 시드가 `localStorage`에 쌓이고, 저장 시 `app_kv`로 동기화됩니다.  
대량 이전이 필요하면 Supabase SQL 또는 `app_kv`에 직접 `INSERT`하는 스크립트를 별도로 작성하세요.
