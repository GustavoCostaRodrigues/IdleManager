# Poke Idle Manager

Gerenciador desktop profissional e de alta performance para o jogo **Poke Idle World**, projetado para executar nativamente no **Windows** e no **macOS**. Permite gerenciar até **4 contas simultâneas** em uma única interface limpa, moderna e adaptável, com isolamento estrito de dados e automação controlada por conta.

---

## 🚀 Principais Funcionalidades

### 1. Isolamento Total de Sessões (Electron Partitioning)
- Cada uma das 4 instâncias web roda com sua própria partição persistente do Chromium:
  - `persist:account_01`
  - `persist:account_02`
  - `persist:account_03`
  - `persist:account_04`
- **Garantia de 100% de isolamento**: cookies, cache, localStorage, sessionStorage e IndexedDB de cada conta ficam em pastas independentes no disco. Faça login em contas diferentes simultaneamente sem conflitos.

### 2. Design System & Identidade Visual (Dark Modern Dashboard)
- **Fundo Base:** `#0F1117`
- **Superfícies (Cards e Painéis):** `#161B22`
- **Bordas e Divisórias:** `#30363D`
- **Cor de Destaque (Accent):** `#58A6FF`
- **Textos:** `#C9D1D9` (Principal) e `#8B949E` (Labels)
- Janela sem bordas nativas (`frame: false`), cantos arredondados de 8px a 10px e estética de dashboard industrial refinado.

### 3. Layouts Dinâmicos em Tempo Real (Zero-Reload Engine)
- **Modo 1: Grade Simétrica 2x2** (padrão): todas as 4 contas dividem a tela em quadrantes iguais.
- **Modo 2: Layout 1x3**: uma conta em destaque com tela ampla à esquerda e 3 contas secundárias empilhadas verticalmente na lateral direita.
- **Interatividade no Modo 1x3**: basta clicar em qualquer card da barra lateral direita para torná-lo instantaneamente o card principal em foco. A troca é feita inteiramente via CSS Grid nativo **sem destruir ou recarregar os webviews**, mantendo o jogo e as sessões rodando ininterruptamente!
- **Modo Maximizar**: cada card possui um botão de expansão para tela cheia dentro do app.

### 4. Sistema de Auto-Click por Injeção DOM
- Cada card possui seu próprio botão de **Auto-Click** independente.
- Loop assíncrono controlado que injeta código via `executeJavaScript` diretamente no contexto da conta ativa.
- Varre o DOM do jogo procurando botões de captura e lançamento (ex: `button.catch-btn`, `.btn-lancar`, `[data-action="catch"]`, etc.) e executa o clique programaticamente.
- Exibe contador de cliques em tempo real no cabeçalho do card.
- Intervalo configurável pelo menu de configurações (padrão: 1500ms).

### 5. Dashboard da Hunt (Painel Financeiro em Tempo Real)
- Acesso instantâneo pelo ícone de gráfico no Drawer lateral (64px) sem interromper ou descarregar os webviews.
- **KPIs Consolidados no Topo**:
  - Gasto total de poções e recursos em Gold.
  - Valor bruto de drops e itens acumulados.
  - Total de Pokémons capturados com taxa de sucesso.
  - Lucro Líquido Geral (Net Profit) em Gold com cálculo em tempo real de Gold/hora e duração da sessão.
- **Tabela de Relatório por Conta**:
  - Detalhamento por slot (01 a 04), status (Caçando vs Ociosa).
  - Poções gastas e custo em Gold.
  - Itens dropados com badges visuais coloridas por raridade (comum, incomum, raro, épico).
  - Capturas realizadas.
  - Lucro líquido com destaque visual verde/vermelho.
- **Reatividade de Alto Desempenho**:
  - Gerenciamento via `HuntStore` com batching por `requestAnimationFrame`, garantindo 60 FPS contínuos sem travamentos de UI.
  - Botão de reset de sessão e gerador de telemetria para validação imediata.

### 6. Parada de Emergência Global (Alt+C)
- Escuta globalmente o atalho **Alt+C** (Windows/Linux) ou **Opt+C** (macOS) e possui um botão de destaque na barra de título.
- Cancela instantaneamente todas as automações de todas as contas em paralelo por segurança, atualizando a interface imediatamente e exibindo um toast de alerta.

---

## 📁 Estrutura do Projeto

```
IdleManager/
├── package.json              # Dependências e scripts de build/dist
├── tsconfig.json             # Configuração TypeScript estrita
├── electron-builder.yml      # Configuração de empacotamento (DMG/NSIS)
├── scripts/
│   └── build.mjs             # Pipeline ultrarrápido com esbuild (CJS + IIFE)
├── src/
│   ├── shared/
│   │   ├── types.ts          # Tipos e interfaces compartilhadas
│   │   └── constants.ts      # Perfis das contas, seletores e canais IPC
│   ├── main/
│   │   └── main.ts           # Ciclo de vida Electron, BrowserWindow e atalho de emergência
│   ├── preload/
│   │   └── preload.ts        # Bridge seguro de APIs (contextBridge)
│   └── renderer/
│       ├── index.html        # Estrutura HTML semântica da UI
│       ├── app.ts            # Orquestrador da aplicação e listeners
│       ├── components/
│       │   ├── autoClicker.ts    # Injeção DOM e loop assíncrono
│       │   ├── accountCard.ts    # Card da conta e controles de webview
│       │   ├── accountManager.ts # Alternância de layouts 2x2 vs 1x3
│       │   ├── titleBar.ts       # TitleBar customizada e métricas de sistema
│       │   └── toast.ts          # Notificações visuais flutuantes
│       └── styles/
│           ├── variables.css     # Tokens do Design System
│           ├── titlebar.css      # Estilos da TitleBar e botões
│           ├── drawer.css        # Slim Drawer de 64px
│           ├── layout.css        # CSS Grid 2x2 e 1x3
│           ├── account-card.css  # Cards, botões e webviews
│           └── main.css          # Ponto de entrada CSS e modais
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- **Node.js**: v18+ (recomendado Node 20 ou 22)
- **npm**

### 1. Instalar dependências
```bash
npm install
```

### 2. Modo Desenvolvimento com Live Reload
```bash
npm run dev
```
Inicia o esbuild em modo watch e recarrega o Electron automaticamente a cada alteração no código.

### 3. Rodar diretamente
```bash
npm start
```

### 4. Checagem de Tipos
```bash
npm run typecheck
```

### 5. Compilação para Produção
```bash
npm run build
```

### 6. Gerar Instaladores Nativos

#### Para macOS (DMG e ZIP - Apple Silicon / Intel):
```bash
npm run dist:mac
```

#### Para Windows (Instalador NSIS executável):
```bash
npm run dist:win
```

Os binários finais serão gerados na pasta `release/`.
