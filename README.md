# Fabiola — PWA de Inspeção de Obras (Offline-First)

Este projeto é um Progressive Web App (PWA) de inspeção de obras desenvolvido sob medida para arquitetos e designers de interiores. O aplicativo foi construído para funcionar de forma **100% offline**, permitindo a captação de relatórios e de múltiplas fotos em alta resolução no canteiro de obras, salvando-os no celular para serem sincronizados com uma automação assim que houver sinal de internet.

---

## 🚀 Comandos Disponíveis

No diretório do projeto, você pode executar três comandos principais para desenvolvimento e testes:

### 1. Iniciar apenas o PWA (Frontend)
```bash
npm run dev
```
*   **O que faz:** Inicializa o servidor de desenvolvimento do Vite apenas para a interface do usuário.
*   **Acesso:** O app ficará acessível localmente no computador.
*   **Uso:** Ideal se você deseja apenas ajustar o formulário, layout ou testar o fluxo de rascunhos offline sem fazer envios reais.

---

### 2. Iniciar apenas o Servidor de Testes (Webhook Mock)
```bash
node mock-server.js
```
*   **O que faz:** Inicializa o servidor Node local que simula a automação (webhook). Ele escuta na porta `3000` (endpoint `/webhook`).
*   **Uso:** Quando o PWA enviar relatórios para este servidor, ele irá registrar os campos no console e salvar todas as fotos originais em alta resolução (sem perda de qualidade) dentro da pasta local `./uploads/`.

---

### 3. Iniciar Ambos Concorrentemente (Recomendado para Testes)
```bash
npm run dev:all
```
*   **O que faz:** Roda o PWA e o Webhook Mock **juntos em um único terminal**.
*   **Destaque:** Detecta automaticamente o IP ativo da sua máquina na rede Wi-Fi e imprime no console uma caixa amigável com os links prontos para você acessar do celular e configurar o PWA.
*   **Exemplo de saída no console:**
    ```text
    =============================================================
     ✨  FABIOLA PWA - AMBIENTE DE DESENVOLVIMENTO INTEGRADO  ✨ 
    =============================================================
     📱 PWA do App (Abra no navegador do celular):
        http://192.168.15.13:5173/

     📬 Webhook Local (Cole nas configurações de Sync do PWA):
        http://192.168.15.13:3000/webhook
    =============================================================
    ```

---

## 📱 Testando no Celular

1.  Conecte o seu celular e o seu computador na **mesma rede Wi-Fi**.
2.  Execute `npm run dev:all`.
3.  Abra o link do **PWA do App** no navegador do seu celular.
4.  No celular, vá até a aba **"Sincronizar"**, clique na engrenagem e cole o link do **Webhook Local** obtido no console.
5.  Preencha uma inspeção fictícia, tire fotos com a câmera do celular e salve.
6.  Ao clicar em sincronizar com a internet ativa, você verá a barra de progresso no celular e a recepção dos arquivos na pasta `./uploads/` do seu computador.

---

## 🛠️ Tecnologias Utilizadas

*   **React + TypeScript + Vite**
*   **IndexedDB (via localforage):** Armazenamento de rascunhos e fila de sincronização sem limites de tamanho no celular.
*   **Service Workers:** Habilita o funcionamento e abertura do aplicativo sem conexão de rede.
*   **Express + Multer:** Utilizados para o servidor de teste de recepção de arquivos de alta resolução.
