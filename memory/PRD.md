# Atelier Barber — Product Requirements

## Problem Statement (verbatim)
Crie um aplicativo web e mobile para barbearia com login de cliente, perfil dos barbeiros e pagamento integrado.

## Personas
- **Cliente**: agenda horário, paga online, remarca/cancela, consulta histórico.
- **Barbeiro**: faz login, edita perfil público (foto, especialidades, preço, horários).
- **Admin do Atelier**: cadastra/remove barbeiros, controla a equipe.

## Core Requirements
1. Login de cliente (e-mail/senha + Google social via Emergent Auth).
2. Perfil dos barbeiros público (foto, nota, especialidades, preço).
3. Agendamento (criar, remarcar, cancelar, histórico).
4. Pagamento integrado via Stripe real (chave de teste do ambiente).
5. Área do barbeiro: edição do próprio perfil + upload de foto.
6. Área admin: cadastro de barbeiros com conta de acesso.
7. Design premium (preto / branco / dourado) responsivo mobile+web.

## Implemented (Feb 2026)
- FastAPI + MongoDB (motor) backend com rotas `/api/*`.
- Auth cookie + Google OAuth hash flow com fuso horário correto.
- Roles `client` / `barber` / `admin` + guard `require_role`.
- Seed automático de admin (`admin@atelier.com` / `admin123`) e três barbeiros (`enzo|miguel|caio@atelier.com` / `barber123`).
- Stripe real via `emergentintegrations.payments.stripe.checkout` (Flow B, `STRIPE_API_KEY=sk_test_emergent`). Transações salvas em `payment_transactions`, status polled via `GET /api/payments/status/{id}`, webhook em `/api/webhook/stripe`.
- Páginas `/payment/success` e `/payment/cancel` com polling.
- Admin panel: criar barbeiro cria usuário com role=barber vinculado ao `barber_id`.
- Barber dashboard: `GET/PATCH /api/barbers/me`, upload de foto via Emergent Object Storage (`POST /api/barbers/me/photo`, servido por `GET /api/files/{path}`).
- Design premium Montserrat + Playfair Display, 100% dos data-testids em ações críticas.
- 14/14 backend tests passing (iteration_4). Smoke frontend tests passing.

## Deferred / Backlog
- **P1**: Confirmações por e-mail (Resend) para agendamento e pagamento.
- **P1**: Calendário real com bloqueio de slots já reservados (hoje usa lista estática de horários).
- **P2**: Barbeiro gerencia bloqueios de agenda por data.
- **P2**: Painel admin com visão de faturamento e no-shows.
- **P2**: Troca do input de data nativo por calendário shadcn no modal de reserva.

## Known Mocks / Limitations
- Webhook do Stripe depende do ambiente conseguir receber callbacks; o fallback de polling em `GET /api/payments/status/{id}` consulta o Stripe diretamente e marca como pago quando confirmado.
- Horários de disponibilidade são listas estáticas por barbeiro — sem detecção automática de conflito.

## Credentials
Ver `/app/memory/test_credentials.md`.
