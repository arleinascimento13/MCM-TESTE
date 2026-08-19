# MCM — Sistema de Apontamento de Horas

## 1. Visão Geral

### Problema Atual

O processo de apontamento de horas na MCM é atualmente realizado por meio de planilhas manuais. Cada funcionário preenche manualmente as horas trabalhadas para cada alocação em cada projeto específico. Este modelo apresenta limitações em termos de auditoria, controle operacional e agilidade no processamento das informações.

### Objetivo

Digitalizar o processo de apontamento de horas, migrando do modelo atual em planilhas para um sistema interno dedicado. O objetivo é manter o controle operacional sobre as alocações de tempo enquanto se obtém benefícios de auditoria, rastreabilidade e agilidade.

### Benefícios

- **Auditoria:** log completo de todas as ações (criação, edição, aprovação, rejeição) com timestamp e responsável
- **Controle operacional:** visibilidade em tempo real do estado de cada apontamento e do progresso por projeto/funcionário
- **Agilidade:** processamento automatizado de informações, redução do trabalho manual repetitivo

### Acesso

Aplicação interna, acesso restrito exclusivamente a colaboradores da MCM.

---

## 2. Domínio e Entidades

### Entidade Central — Apontamento de Hora

Cada linha da planilha de apontamento corresponde a um registro no sistema com os seguintes campos:

| Campo | Descrição |
|-------|-----------|
| Nome do funcionário | Identificação de quem realizou o apontamento |
| Job Leader | Responsável pela aprovação do apontamento |
| Mês | Período de competência |
| Ano | Período de competência |
| Data | Data do trabalho realizado |
| Início | Hora de início |
| Fim | Hora de término |
| Duração | Tempo total calculado (fim - início) |
| Descrição | Detalhamento do trabalho realizado |
| Centro de custo | Classificação contábil/operacional |
| Disciplina | Área de especialização ou competência |
| Local | Local físico ou modo de trabalho |
| Hora extra | Indicação de horas extras (campo informativo) |
| Validação | Status de aprovação pelo job leader |

### Cadastros de Parâmetros

O sistema também gerencia os seguintes cadastros mestres:

- **Centro de custo:** catálogo de centros de custo disponíveis na organização
- **Disciplina:** áreas de competência e especialização
- **Local:** locais de trabalho ou modos de operação
- **Projetos:** projetos ativos na organização
- **Alocações:** mapeamento de qual funcionário trabalha em qual projeto
- **Funcionários e Job Leaders:** cadastro de usuários e sua hierarquia de responsabilidade
- **Limitação de opções por funcionário:** definição de quais disciplinas, centros de custo e locais cada funcionário tem permissão de utilizar nos seus apontamentos

---

## 3. Regras de Negócio

### 3.1 Ciclo de Vida da Linha de Apontamento

A linha de apontamento de hora possui o seguinte ciclo de vida:

1. **Pendente:** estado inicial quando o funcionário cria ou reenvia um apontamento para aprovação
2. **Aprovada:** estado final quando o job leader aprova a linha
3. **Rejeitada:** estado intermediário quando o job leader rejeita a linha com motivo

### 3.2 Aprovação

A aprovação é realizada **POR LINHA**, de forma individual. Cada linha de apontamento é aprovada ou rejeitada independentemente, não havendo aprovação por dia, por lote ou por período.

### 3.3 Rejeição

- O job leader rejeita uma linha com **motivo obrigatório** (campo obrigatório no ato da rejeição)
- A linha rejeitada **não é descartada** — retorna ao estado de edição para o funcionário
- O funcionário **edita a linha** com as correções necessárias e **reenvia** para aprovação
- O processo de rejeição/edição/reenvio pode se repetir quantas vezes for necessário até a aprovação

### 3.4 Hora Extra

O campo **hora extra é exclusivamente informativo**. Ele serve para registrar a indicação de que as horas configuradas são horas extras, porém:

- Não possui fluxo de aprovação próprio
- Não possui regra especial de duração
- É um campo de preenchimento direto pelo funcionário, sem validação adicional de limites

### 3.5 Regras de Edição

- **Linha pendente:** o funcionário pode editar quaisquer campos antes do reenvio para aprovação
- **Linha rejeitada:** o funcionário pode editar quaisquer campos para corrigir e reenviar
- **Linha aprovada:** não permite edição (tramita como registro auditado)

---

## 4. Roles e Permissões

O sistema possui três perfis de acesso:

| Papel | Visualizar | Criar/Editar Apontamentos | Aprovar/Rejeitar | Exportar | Configurar Parâmetros |
|-------|------------|---------------------------|------------------|----------|----------------------|
| Admin | Todos os dados | Sim | Não | Sim | Sim (parâmetros gerais) |
| Job Leader | Dados do seu time | Sim (seus apontamentos) | Sim (linhas do seu time) | Sim (dados do seu time) | Não |
| Funcionário | Dados próprios | Sim (seus apontamentos) | Não | Sim (dados próprios) | Não |

### Coluna Escopo de Dados

| Papel | Escopo de Dados |
|-------|----------------|
| Admin | **Todos os dados** — acessa e visualiza todas as informações geradas na aplicação, de todos os funcionários e projetos |
| Job Leader | **Seu time** — acessa e visualiza exclusivamente os dados dos funcionários que estão sob sua responsabilidade |
| Funcionário | **Ele mesmo** — acessa e visualiza apenas os seus próprios apontamentos e histórico |

---

## 5. Escopo de Dados por Papel

**REGRA:** Todos os perfis (Admin, Job Leader e Funcionário) possuem as **MESMAS capacidades de visualização** — dashboard, gráficos, exportação, auditoria — porém com **escopos de dados diferentes**.

### Como os dados são filtrados

- **Admin:** vê tudo. Todos os apontamentos de todos os funcionários, todos os projetos, todas as disciplinas, todos os centros de custo.

- **Job Leader:** vê exclusivamente os dados dos funcionários que estão sob sua responsabilidade. Cada job leader possui um conjunto de funcionários associados; os dashboards, gráficos, exportação e log de auditoria exibem apenas os registros envolvendo esses funcionários.

- **Funcionário:** vê apenas os seus próprios apontamentos. Dashboard pessoal, exportação própria, log de auditoria das suas próprias linhas.

### Implicações

- Filtros por período, projeto, centro de custo e disciplina respeitam o escopo do papel
- Um job leader não consegue aprovar apontamentos de funcionários de outro job leader
- Relatórios agregados (horas por projeto, por disciplina, etc.) são calculados apenas sobre os dados dentro do escopo do papel

---

## 6. Parâmetros Gerenciados pelo Admin

O Admin é responsável pelo cadastro e manutenção dos parâmetros que regem o funcionamento da aplicação:

| Parâmetro | Descrição |
|-----------|-----------|
| Centro de custo | Lista de centros de custo disponíveis para apontamento |
| Disciplina | Lista de disciplinas/áreas de competência |
| Local | Lista de locais ou modos de trabalho |
| Projetos | Cadastro de projetos ativos na organização |
| Alocações | Mapeamento de funcionários por projeto (quem trabalha em qual projeto) |
| Funcionários | Cadastro de usuários e seus dados |
| Job Leaders | Cadastro de responsáveis e sua relação com funcionários |

### Limitação de Opções por Funcionário

O Admin define, por meio de configuração, **quais disciplinas, centros de custo e locais cada funcionário tem permissão de utilizar** ao realizar um apontamento. Isso garante que o preenchimento seja válido e restrito ao contexto operacional de cada colaborador.

---

## 7. Funcionalidades por Papel

### Funcionário

- Preencher apontamentos de hora (criar linha com data, início, fim, duração, descrição, centro de custo, disciplina, local, hora extra)
- Consultar próprio histórico de apontamentos
- Editar linhas pendentes ou rejeitadas
- Reenviar linhas rejeitadas para aprovação
- Solicitar aprovação dos seus apontamentos ao job leader
- Acessar dashboard pessoal com gráficos das suas horas
- Exportar próprios apontamentos

### Job Leader

- Visualizar dashboard do seu time (agregado dos funcionários sob sua responsabilidade)
- Visualizar gráficos de horas do seu time (por projeto, disciplina, centro de custo, período)
- Aprovar linhas de apontamento dos seus funcionários
- Rejeitar linhas com motivo obrigatório
- Consultar histórico e log de auditoria do seu time
- Exportar dados do seu time

### Admin

- Visualizar dashboard global (todos os projetos, todos os funcionários)
- Visualizar gráficos agregados de toda a organização
- Criar e gerenciar parâmetros gerais da aplicação (centros de custo, disciplinas, locais, projetos, alocações, funcionários, job leaders)
- Definir limitação de opções por funcionário
- Consultar log de auditoria completo de qualquer registro
- Exportar todos os dados da aplicação

---

## 8. Relatórios e Auditoria

### Dashboard com Gráficos Agregados

Disponível a todos os perfis (respeitando o escopo de cada um):

- Horas por projeto
- Horas por funcionário
- Horas por centro de custo
- Horas por disciplina
- Horas por período

### Exportação

Função de exportação disponível a todos os perfis (escopada):

- Formato CSV/Excel
- Dados filtrados de acordo com o escopo do papel

### Histórico de Auditoria

Log completo de cada linha de apontamento, contendo:

- Quem criou a linha e quando
- Quem editou a linha e quando
- Quem aprovou a linha e quando
- Quem rejeitou a linha, com o motivo informado, e quando

### Relatórios por Responsável

Relatórios filtrados por job leader ou por funcionário, com:

- Seleção de período
- Detalhamento por apontamento
- Status de validação de cada linha

---

## 9. Restrições e Suposições

### Fora de Escopo

- **Hora extra:** não possui fluxo de aprovação próprio nem regra especial de duração; é campo exclusivamente informativo
- **Integrações externas:** não há integração com sistemas externos nesta fase (ex: sistemas de folha de pagamento, ERP)
- **Notificações:** não há mecanismo de notificação push ou e-mail automático nesta fase
- **Aprovação em lote:** a aprovação é sempre por linha individual, não há aprovação de múltiplas linhas de uma vez
- **Automatização de duração:** a duração é calculada automaticamente (fim - início), porém o campo é editável (suposição)

### Suposições

- **(Suposição)** Cada funcionário possui exatamente um job leader responsável pela aprovação dos seus apontamentos
- **(Suposição)** O período de apontamento é definido por data, com hora de início e hora de término (não há apontamento por período inteiro como "dia inteiro")
- **(Suposição)** A duração é calculada automaticamente a partir de início e fim, mas pode ser ajustada manualmente pelo funcionário
- **(Suposição)** O admin não aprova apontamentos — seu papel é exclusivamente parametrização e visualização
- **(Suposição)** Não há conceito de "aprovar todos" — cada linha requer aprovação individual pelo job leader
- **(Suposição)** O sistema não gerencia conflitos de horário (dois apontamentos no mesmo horário no mesmo dia) — fica como validação futura
- **(Suposição)** Funcionários inativos (demitidos, afastados) permanecem no cadastro para fins de auditoria histórica, mas não podem criar novos apontamentos
