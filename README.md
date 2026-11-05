# Vassouras Motos — Plataforma de anúncios automotivos

Plataforma profissional de anúncios de veículos com vitrine pública e painel administrativo completo, pronta para ser comercializada para concessionárias, lojas de veículos e revendedores.

---

## 1. Stack — leia esta seção primeiro

O projeto original pedia **Python + Django + templates + TiDB Cloud**. Este ambiente de execução (Base44) roda **React/TanStack Start com backend gerenciado** e **não executa processos Python, Django nem conexões MySQL/TiDB de longa duração**. Não é possível rodar `manage.py`, `pip install` ou um servidor WSGI aqui.

Por isso a entrega foi feita em duas camadas:

| Camada | O que foi entregue | Estado |
|---|---|---|
| **Aplicação** | A plataforma completa (vitrine + painel + banco gerenciado + upload de fotos) na stack suportada pelo ambiente | **Funcionando de verdade**, testada no navegador |
| **Banco** | `database/01_schema.sql`, `02_seed.sql`, `03_verificacao.sql` — schema compatível com TiDB Cloud/MySQL 8, InnoDB, utf8mb4, FKs, índices | **Pronto para execução manual** no TiDB Cloud |

O schema SQL é a **referência da estrutura definitiva**. As entidades da aplicação usam exatamente os mesmos campos, nomes e enums, de modo que uma futura migração para Django + TiDB não exige remodelagem.

> **Nenhuma migration, criação de tabela ou alteração de banco é feita automaticamente.** Os scripts SQL são executados manualmente por você.

---

## 2. Funcionalidades implementadas

### Área pública
- **Home** com capa cinematográfica, busca com atalhos por carroceria, destaques, estoque, seção institucional e contato.
- **Catálogo** com filtros reais no servidor: marca, categoria, carroceria, câmbio, combustível, ano inicial/final, faixa de preço e quilometragem máxima.
- **Ordenação**: mais recentes, menor preço, maior preço, menor quilometragem.
- **Paginação** com "carregar mais".
- **Página do veículo**: galeria com miniaturas e navegação, ficha técnica completa, descrição, opcionais, equipamentos, dados da loja, veículos semelhantes.
- **Contato**: botão de interesse (grava o interessado no banco) e WhatsApp com mensagem automática contendo o veículo anunciado + botão flutuante.
- **Mobile-first**: filtros em painel deslizante, cards responsivos, CTAs acessíveis.

### Painel administrativo (`/admin`)
- **Acesso por senha administrativa compartilhada** (sem cadastro de clientes, sem login público). Hash **PBKDF2-HMAC-SHA256** com 100.000 iterações + salt, comparação em tempo constante e bloqueio de 60s após 5 tentativas.
- **Dashboard**: totais de cadastrados, disponíveis, vendidos, pausados, destaques, interessados e novos contatos + gráficos (estoque por marca e interessados por status) + últimos contatos.
- **Veículos**: listar, buscar, filtrar por status, cadastrar, editar, excluir, alternar destaque, alterar status (disponível / pausado / vendido) direto na lista.
- **Formulário em seções**: informações principais, características, descrição, opcionais, equipamentos, observações internas, configurações do anúncio e fotografias.
- **Fotografias**: múltiplos arquivos, compressão automática no navegador, validação de tipo/tamanho, definição da foto principal, reordenação e exclusão.
- **Interessados**: contatos com nome, telefone, veículo, mensagem, data, status (novo / em atendimento / finalizado) e anotação interna.
- **Configurações da loja**: nome, slogan, logotipo, WhatsApp, telefone, endereço, cidade, estado, horários, Instagram, Facebook, texto institucional e imagens da home — tudo refletido automaticamente na vitrine.
- **Troca da senha administrativa** dentro do painel.

### Observação sobre os anúncios de exemplo
Existem **5 anúncios de demonstração** (marcados com o selo **"EXEMPLO"** na vitrine) para que a loja veja o layout com conteúdo real. Nenhum deles é apresentado como anúncio real. Para removê-los: painel → **Veículos** → ícone de lixeira em cada um.

---

## 3. Estrutura do projeto

```
src/
  routes/                     # rotas (arquivo = URL)
    index.jsx                 # home
    veiculos.index.jsx        # catálogo + filtros
    veiculos.$vehicleId.jsx   # página do veículo
    admin.jsx                 # layout do painel (guarda de acesso)
    admin.index.jsx           # dashboard
    admin.veiculos.jsx        # lista de veículos
    admin.veiculo.novo.jsx    # cadastro
    admin.veiculo.$id.jsx     # edição
    admin.interessados.jsx    # contatos
    admin.configuracoes.jsx   # ajustes da loja + senha
    admin_.login.jsx          # login / definição de senha
  components/
    site/                     # header, footer, cards, galeria, filtros, WhatsApp
    site/home/                # seções da home
    admin/                    # shell, formulários, gerenciador de fotos
    ui/                       # biblioteca de interface
  lib/
    public-fns.js             # operações públicas (busca, detalhe, interessado)
    admin-fns.js              # operações do painel (protegidas por token)
    admin-auth.server.js      # hash, HMAC e verificação de token
    storeDefaults.js          # listas de domínio (marcas, categorias, enums)
base44/entities/              # modelo de dados
database/                     # scripts SQL para TiDB Cloud / MySQL
```

---

## 4. Modelo de dados (espelho do SQL)

| Entidade | Tabela SQL | Observações |
|---|---|---|
| `Vehicle` | `vehicles` | Mesmos campos e enums; fotos em `images[]` |
| `Vehicle` (fotos) | `vehicle_images` | `position` = ordem; primeira foto é a principal |
| `Vehicle` (opcionais) | `vehicle_features` | `kind = 'feature'` / `'equipment'` |
| `Lead` | `leads` | Status `new` / `in_progress` / `done` |
| `StoreSettings` | `store_config` | Registro único |
| `AdminCredential` | `admin_credential` | Somente hash + salt; nunca a senha |
| `distinct brand` | `brands` | Lista canônica de marcas |

Índices em `status`, `brand`, `body_type`, `price`, `year_model`, `mileage`, `featured`, composto `(status, created_at)` e busca `(brand, model, version)`.

---

## 5. Banco de dados — execução manual no TiDB Cloud

1. Acesse o console do **TiDB Cloud** e crie um cluster (Serverless é suficiente para começar).
2. Abra **SQL Editor** → cole e execute `database/01_schema.sql`.
3. Execute `database/02_seed.sql` (configuração da loja + marcas; **não insere anúncios fictícios**).
4. Execute `database/03_verificacao.sql` para conferir tabelas, colunas, FKs, índices e contagens.
5. Guarde host, porta (4000), usuário e senha do cluster no gerenciador de segredos do seu ambiente — **nunca no código**.

Conexão TLS obrigatória no TiDB Cloud. Use `utf8mb4` em todas as conexões.

---

## 6. Segurança

- Senha administrativa **nunca** é armazenada em texto: apenas hash PBKDF2 + salt.
- Token de sessão assinado com **HMAC-SHA256**, validade de 12 horas, invalidado ao trocar a senha.
- Todas as operações administrativas validam o token no servidor antes de tocar nos dados.
- Toda entrada é validada no servidor (tipos, tamanhos máximos, enums).
- Consultas via ORM/SDK parametrizadas — sem concatenação de SQL (proteção contra injeção).
- Uploads restritos a JPG/PNG/WebP, com limite de tamanho e recompressão no navegador.
- Regras de acesso por linha: leitura pública apenas de anúncios e configurações; **interessados só são visíveis para administradores**; escrita de veículos e configurações restrita a administradores.
- Nenhuma chave ou senha fixa no código.

**Primeiro acesso:** como o painel usa senha compartilhada, a primeira pessoa que abrir `/admin/login` define a senha. Faça isso imediatamente após publicar.

---

## 7. O que foi testado

Verificado automaticamente no navegador:
- Home renderiza com dados reais do banco.
- Catálogo lista os veículos e o filtro por carroceria devolve o resultado correto, atualizando a URL.
- Página do veículo abre com ficha técnica, galeria e CTAs.
- Envio do formulário de interesse grava o interessado no banco (registro de teste removido em seguida).
- Definição de senha e login no painel, com acesso ao dashboard e à lista de veículos.
- Sem erros de console e sem requisições repetidas em laço.

Não verificado automaticamente (testar manualmente):
- Cadastro/edição de veículo pelo formulário e envio de fotos (a automação de upload de arquivo não é suportada pelo navegador de teste).
- Gravação das configurações da loja e troca de senha pela interface.
- Atualização de status dos interessados.

Depende de configuração sua:
- **TiDB Cloud** (execução dos scripts SQL e credenciais).
- **WhatsApp, telefone, endereço, horários, redes sociais e logotipo** — preencher em Configurações para que apareçam na vitrine.
- **Cloudinary** não é necessário: as fotos são armazenadas no armazenamento de arquivos do próprio app (URLs públicas, pois precisam aparecer na vitrine). Para migrar ao Cloudinary depois, basta salvar as URLs retornadas por ele no mesmo campo de imagens.