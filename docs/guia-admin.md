# Lavrador Team — Guia de Utilização
## Portal do Personal Trainer (Admin)
**Abril 2026**

---

## Índice

1. [Dashboard](#1-dashboard)
2. [Clientes](#2-clientes)
3. [Agenda](#3-agenda)
4. [Prescrição e Planos](#4-prescrição-e-planos)
5. [Exercícios e Templates](#5-exercícios-e-templates)
6. [Nutrição](#6-nutrição)
7. [Facturação](#7-facturação)
8. [Revenue](#8-revenue)
9. [Mensagens e Broadcast](#9-mensagens-e-broadcast)
10. [Onboarding de Novo Cliente](#10-onboarding-de-novo-cliente)
11. [Pacotes de Sessões](#11-pacotes-de-sessões)
12. [Contratos Digitais](#12-contratos-digitais)

---

## 1. Dashboard

O Dashboard é o ponto de entrada principal após o login. Apresenta uma visão geral do negócio:

- **Clientes activos** — total e variação recente
- **Sessões desta semana** — agendadas e concluídas
- **Receita do mês** — comparação com o mês anterior
- **Alertas** — clientes inativos, faturas vencidas, pedidos de análise de forma pendentes

> 💡 **Dica:** Os alertas de deload e progressão automática (gerados ao domingo) aparecem aqui assim que o sistema os detecta.

---

## 2. Clientes

### 2.1 Lista de Clientes

1. Clica em **Clientes** na barra lateral
2. A lista mostra todos os clientes com nome, nível, data da última sessão e estado
3. Usa o campo de pesquisa para filtrar por nome
4. Clica num cliente para abrir a página de detalhe

### 2.2 Página de Detalhe do Cliente

A página de detalhe tem 12 abas:

#### Visão Geral
- Métricas principais (treinos, presença, plano activo)
- Últimas 3 pontuações de readiness (sono, energia, stress, dores musculares)
- Conquistas desbloqueadas (badges)
- Equilíbrio muscular (rácios push/pull/joelho/anca)

#### Planos
- Lista todos os planos de treino prescritos
- Expande cada fase para ver cardio, força e flexibilidade detalhados
- Botão **Clonar** duplica um plano existente

#### Sessões
- Histórico de todas as sessões (agendadas, concluídas, canceladas)
- Estado visual com código de cor

#### Avaliações
- Registo de avaliações físicas e PAR-Q
- Botão para gerar PDF do relatório de avaliação

#### Fotos
- Galeria de fotos de progresso por ângulo (Frontal, Lateral, Posterior)
- Upload de novas fotos com seleção de ângulo

#### Hábitos
- Lista de hábitos diários do cliente
- Adicionar novo hábito pelo campo no topo

#### Pagamentos
- Lista de faturas com estado (Paga, Pendente, Vencida)
- Gerar link de pagamento Stripe por fatura

#### Timeline
- Linha cronológica de todos os eventos (sessões, planos, avaliações, conquistas)

#### Dores
- Relatórios de dor submetidos pelo cliente (parte do corpo, intensidade, descrição)
- Botão **Resolver** marca o relatório como tratado
- Intensidades: 🟡 Ligeira · 🟠 Moderada · 🔴 Severa

#### Forma
- Pedidos de análise de vídeo submetidos pelo cliente
- Ver o vídeo clicando em **Ver vídeo**
- Escrever feedback no campo de texto e clicar **Enviar feedback**
- O cliente recebe notificação push quando o feedback está disponível

#### Pacotes
- Ver todos os pacotes de sessões do cliente com barra de progresso
- Criar novo pacote: nome, nº de sessões, preço
- Clicar **Registar sessão usada** para decrementar o contador

#### Contratos
- Ver contratos enviados e estado de assinatura
- Criar novo contrato: título + texto completo
- Após criação, o cliente pode assinar digitalmente na app

---

## 3. Agenda

### 3.1 Vistas

A agenda tem 3 vistas selecionáveis no topo:

| Vista | Descrição |
|-------|-----------|
| **Dia** | Sessões do dia selecionado em formato lista |
| **Semana** | 7 colunas com sessões de cada dia |
| **Mês** | Grelha mensal com até 2 sessões por célula |

### 3.2 Navegar no Tempo

1. Usa as setas **‹** e **›** para avançar/recuar
2. Clica **Hoje** para voltar à data actual

### 3.3 Criar Sessão

1. Clica no botão **+ Sessão** (canto superior direito)
2. Ou clica no **+** dentro de um dia específico na vista semanal
3. Preenche: cliente, data/hora, tipo, duração, notas
4. Clica **Guardar**

### 3.4 Editar Sessão

1. Clica em qualquer sessão no calendário
2. Altera os campos pretendidos
3. Clica **Guardar** ou **Cancelar**

### 3.5 Exportar para iCal

1. Clica no botão **iCal** no topo da agenda
2. O ficheiro `lavrador-sessions.ics` é descarregado
3. Importa no Google Calendar, Apple Calendar ou Outlook

---

## 4. Prescrição e Planos

### 4.1 Criar Plano de Treino

1. Vai a **Clientes** → seleciona o cliente → aba **Planos**
2. Clica **Novo plano**
3. Define nome, objectivo, nível e fases
4. Cada fase tem configuração de cardio, força e flexibilidade

### 4.2 Usar a Prescrição (IA)

1. Vai a **Prescrição** na barra lateral
2. Seleciona o cliente, nível e objectivo
3. O motor ACSM 2026 gera automaticamente:
   - Parâmetros de treino (frequência, intensidade, volume)
   - Sugestões de exercícios pontuados por preferência do PT
4. Importa exercícios sugeridos directamente para o plano

---

## 5. Exercícios e Templates

### Exercícios
- Biblioteca completa com filtros por padrão de movimento, equipamento e nível
- Criar exercício personalizado com nome, vídeo e instruções
- Histórico de uso e feedback de preferência

### Templates (Workouts)
- Planos de treino reutilizáveis com blocos (WARMUP, SEQUENTIAL, SUPERSET, CIRCUIT, TABATA, CARDIO, FLEXIBILITY)
- Editor drag-and-drop de blocos e exercícios
- Duração estimada calculada automaticamente

---

## 6. Nutrição

1. Vai a **Nutrição** na barra lateral
2. Consulta e edita os planos nutricionais por cliente
3. Define macros, refeições e notas específicas

---

## 7. Facturação

### 7.1 Criar Fatura

1. Vai a **Facturação** na barra lateral
2. Clica **Nova fatura**
3. Seleciona cliente, valor, descrição e data de vencimento

### 7.2 Gerar Link de Pagamento Stripe

1. Abre uma fatura com estado **Pendente**
2. Clica **Gerar link de pagamento**
3. Copia o link e envia ao cliente (email, mensagem)
4. Quando o cliente paga, a fatura é marcada automaticamente como **Paga** via webhook

---

## 8. Revenue

1. Vai a **Revenue** na barra lateral
2. Visualiza 4 métricas principais:
   - **Este mês** — receita e nº de faturas pagas
   - **Este ano** — totais anuais
   - **Pendente** — valor por cobrar
   - **Em atraso** — valor vencido (destaque vermelho se existir)
3. Gráfico de barras com os últimos 6 meses de receita
4. Banner de alerta se houver faturas vencidas

---

## 9. Mensagens e Broadcast

### Conversa Individual

1. Vai a **Mensagens** na barra lateral
2. Seleciona o cliente na lista à esquerda
3. Escreve e envia mensagens em tempo real

### Broadcast (Mensagem para Todos)

1. Clica no ícone de campanha (📢) no topo da lista de conversas
2. Escreve a mensagem no campo que aparece
3. Clica **Enviar para todos**
4. A mensagem é entregue a todos os clientes activos

> 💡 **Dica:** Usa o broadcast para comunicados gerais — alterações de horário, feriados, promoções.

---

## 10. Onboarding de Novo Cliente

1. Vai a **Clientes** → clica **+ Cliente** ou **Link Intake**
2. Clica **Gerar link de onboarding**
3. Copia o link e envia ao novo cliente (válido 7 dias)
4. O cliente preenche o formulário multi-step:
   - Dados pessoais
   - PAR-Q (questionário de saúde)
   - Objectivos e consentimento
5. Após submissão, a conta do cliente é criada automaticamente
6. O sistema envia automaticamente uma sequência de boas-vindas (dia 0, dia 3, dia 7)

---

## 11. Pacotes de Sessões

### Criar Pacote

1. Vai à página de detalhe do cliente → aba **Pacotes**
2. Preenche: nome do pacote, nº de sessões, preço (€)
3. Clica **Criar pacote**

### Gerir Sessões Usadas

1. Após cada sessão presencial, abre o pacote do cliente
2. Clica **Registar sessão usada**
3. O contador decrementa e a barra de progresso actualiza

---

## 12. Contratos Digitais

### Criar Contrato

1. Vai à página de detalhe do cliente → aba **Contratos**
2. Escreve o título e o texto completo do contrato
3. Clica **Criar e enviar ao cliente**

### Acompanhar Assinatura

- Estado **⏳ Pendente** — cliente ainda não assinou
- Estado **✓ Assinado** — mostra nome e data de assinatura digital

> 💡 **Dica:** O cliente assina escrevendo o nome completo na app. A assinatura fica registada com data e hora.
