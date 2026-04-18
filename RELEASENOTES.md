# Release Notes

## v1.0.0 — 2026-04-18

Primeira versão de produção do NossaSaudeServer — backend implantado na AWS.

### Mudanças em relação à v0.0.1

**Infraestrutura / Deploy**
- Região alterada de `sa-east-1` para `us-east-1`
- Timeout das Lambdas reduzido para 25s (respeita limite de 29s do API Gateway)
- API Key configurada via `config/prod.json` (gitignored)
- Bucket S3 removido do CloudFormation — gerenciado manualmente na AWS
- Endpoint `/health` removido

**Dados de demonstração**
- Script `scripts/seed.js` adicionado e exposto via `npm run seed`
- Popula o banco local com 3 membros e 9 consultas para o `familyId` de demo

---

## v0.0.1 — 2026-04-17

Versão inicial do NossaSaudeServer — backend serverless do app de histórico médico familiar NossaSaúde.

### Funcionalidades

**Membros**
- Cadastro, listagem, detalhe, edição e soft-delete de membros da família
- Campos: nome, data de nascimento, tipo sanguíneo, peso, altura, alergias e condições crônicas

**Consultas**
- Cadastro, listagem, detalhe, edição e soft-delete de consultas médicas
- Suporte a médico, clínica, motivo, observações, tags e retorno de consulta anterior
- Medicamentos embedded por consulta: nome, princípio ativo, dosagem, forma, frequência, contraindicação, eficácia e efeitos colaterais
- Exames embedded por consulta: nome, observações e imagens de resultado

**Imagens (S3)**
- Geração de presigned URL para upload de fotos de receitas e resultados de exames
- Listagem de imagens com presigned URLs de leitura agrupadas por tipo
- Adição e remoção de imagens via PATCH na consulta

**Sincronização**
- Endpoint GET /sync para pull de membros e consultas modificados após um timestamp
- Suporte a soft-delete com tombstones (deletedAt)

### Infraestrutura

- Runtime Node.js 24.x no AWS Lambda (sa-east-1)
- API Gateway com autenticação por API Key
- MongoDB Atlas via Mongoose ODM
- Storage S3 com presigned URLs (5min upload, 15min leitura)
- Framework osls (open-source fork do Serverless Framework v4)
- Ambiente de desenvolvimento local com serverless-offline, MongoDB e LocalStack
