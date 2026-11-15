# Roadmap

## Evolução SaaS — aguarda aprovação do diagnóstico
- [x] Diagnosticar editor, projetos, biblioteca, regras atuais e situação dos pagamentos
- [ ] Aprovar diagnóstico e decisões de transição do limite gratuito
- [ ] Preservar modelos e adaptar administração ao catálogo de packs existente
- [ ] Completar restauração de projetos por estampa e favoritos privados persistentes
- [ ] Configurar sete exportações gratuitas totais com controle seguro no servidor
- [ ] Implementar mensal R$ 19,90 e anual R$ 199,00, checkout e assinatura verificada
- [ ] Adicionar conta, assinatura, comparação de preços e mensagens de conversão
- [ ] Executar testes funcionais, de isolamento de dados e celulares; relatar pendências reais
- [ ] Habilitar cobranças reais após publicação, verificação e aprovação externa

## Feito
- [x] Design system, layout, telas iniciais, Cloud, tabelas + RLS, buckets, login, useAuth/ProtectedRoute

## Agora
- [x] Integrações de agentes: ativar OAuth e preservar retorno do consentimento no login/cadastro
- [x] Servidor MCP protegido: cálculo de medidas, modelos ativos e projetos do próprio usuário
- [x] Ferramentas WebMCP nas telas de medidas e biblioteca, com telemetria
- [x] Extrair manifesto, testar fluxos locais e verificar build
- [ ] Testar aprovação/recusa no endereço publicado (aguarda republicação)
- [x] src/lib/candle.ts (funções puras) + testes Vitest obrigatórios
- [x] Etapa 1 Medidas (vírgula, presets, "Tenho a circunferência", opções avançadas, selo cabe/não cabe)
- [x] Biblioteca: grade 2/4 col, filtros tema/ocasião/busca, Pro, painel de detalhe, skeleton, vazio, imagens do bucket
- [x] Seed 50 modelos (SVG provisório) + upload ao bucket templates
- [x] Etapa 2 Arte: biblioteca + "Usar minha própria imagem" (user-images, aviso <150 DPI)
- [x] Assistente 4 etapas com barra de progresso + store
- [x] Etapa 3 Ajustar: prévia plana com régua, controles, desfazer/centralizar, prévia na vela
- [x] Etapa 4 Exportar: PDF (jsPDF), PNG 300 DPI, Canva, salvar, JSON, checklist, limite 5/mês, paywall, src/config.ts
- [x] /minhas-velas: listar, abrir, duplicar, renomear, apagar
- [x] Eventos de uso + pesquisa rápida pós-exportação
- [x] /admin/modelos, /admin/metricas, /admin/usuarios
- [x] /guia com conteúdo original
- [x] Acabamento: acessibilidade, carregando/erro, meta tags, textos pt-BR
