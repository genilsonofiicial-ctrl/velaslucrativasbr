# Evolução SaaS do Stúdio Velas Lucrativas

## Diagnóstico — o que existe e será reaproveitado
- Editor em quatro etapas, cálculo por altura/diâmetro e circunferência, prévia plana e na vela, ajustes, PDF/PNG, preparação para A4/Carta, Canva e imagem própria. Preservar fórmulas e desenho compartilhado entre prévias e exportação.
- Login por senha e link mágico, contas, papéis administrativos protegidos, métricas, guia e identidade visual existentes.
- Projetos já podem ser salvos, renomeados, duplicados e apagados. A reabertura recupera medidas e ajustes, mas ainda usa o vínculo antigo do modelo: falta guardar/restaurar a estampa individual de um pack.
- O catálogo real consultado tem 30 packs ativos, sem capas nem estampas cadastradas; há 36 modelos antigos com referência de imagem, desativados. A prévia confirma os 30 packs com “Imagem em breve”. Nada será apagado, duplicado ou reativado automaticamente. A existência física de todos os arquivos antigos ainda precisa ser verificada.
- A administração ainda grava uma imagem no formato antigo, enquanto a biblioteca lê capa e estampas de packs. É necessário compatibilizar esse fluxo antes de cadastrar novos conteúdos.
- Temas são parcialmente fixos no aplicativo; passarão a refletir os conteúdos cadastrados, mantendo a única biblioteca existente.
- A regra atual é **5 exportações por mês**, contabilizando PDF/PNG, não cliques ou ajustes. A contagem vem do servidor, mas o bloqueio é realizado no navegador; erros na contagem atualmente permitem continuar. Não há favoritos nem assinaturas no banco.
- Acesso Pro atual é liberado manualmente pelo proprietário. A conexão de pagamentos está ativada, mas não há checkout nem confirmação de assinaturas implementados no app.

## Situação dos pagamentos
A verificação de disponibilidade confirmou que cobranças reais **ainda não estão aprovadas**: análise inicial não iniciada, publicação da versão atual e formulário de verificação pendentes; revisão do site e aprovação final ainda não começaram. Podemos implementar e testar a integração de teste sem simular aprovação. Cobranças reais ficarão indisponíveis até concluir essas etapas.

## Etapa 2 — biblioteca, favoritos e projetos
- Manter catálogo e arquivos existentes; compatibilizar capas/estampas, upload, ordenação e publicação pela administração. Não gerar imagens nem preencher packs com exemplos.
- Melhorar navegação por temas e visualização antes de uso, sem uma segunda biblioteca. Novos conteúdos publicados aparecerão sem nova versão do app.
- Favoritos por imagem individual, coração, área “Minhas Favoritas” e abertura no editor. Persistência vinculada à conta, com políticas que isolam cada usuário.
- Reutilizar projetos e acrescentar referência da estampa individual para restaurar exatamente a arte, medidas e ajustes. Manter salvar, atualizar, duplicar, renomear e excluir.
- Conta e projetos permanecem acessíveis após esgotar o limite gratuito.

## Etapa 3 — planos
- Experimentar: R$ 0,00, **7 exportações gratuitas totais por conta**, sem renovação mensal; editor, ajustes e prévias não consomem uso.
- Mensal: R$ 19,90/mês recorrentes. Anual: R$ 199,00 cobrados antecipadamente por 12 meses.
- Pagos: exportações ilimitadas, biblioteca completa, favoritos, projetos e novos conteúdos publicados, sem prometer frequência de atualização.
- Transição proposta: preservar projetos e acessos Pro concedidos manualmente; iniciar a nova franquia de sete usos na ativação da regra, sem descontar retroativamente eventos antigos. Essa escolha será confirmada antes da mudança.
- Visitantes continuam conhecendo editor e biblioteca sem login; pedir conta apenas para uma exportação sujeita à franquia persistente. Uma franquia anônima baseada apenas no navegador pode ser reiniciada e não fornece o controle seguro solicitado.

## Etapa 4 — pagamentos e acesso
- Criar um produto de acesso completo com dois preços recorrentes: mensal e anual, usando os valores definidos.
- Checkout conectado à conta; retorno do checkout não libera acesso. Somente eventos assinados e validados no servidor atualizam a assinatura.
- Registrar assinatura e histórico de eventos/pagamentos, separar teste de real, rejeitar eventos inválidos e tornar processamento de duplicados idempotente.
- Minha Assinatura: estado real, período pago, falha/pendência e acesso ao gerenciamento de cobrança/cancelamento.
- Cancelamento mantém acesso até o fim do período pago. Falha de pagamento apresenta aviso e acompanha a recuperação do provedor; encerramento/expiração é validado no servidor.
- Administração: manter funções existentes e acrescentar acompanhamento de assinaturas e indicadores, com autorização administrativa validada.
- Preparar termos, reembolsos e adequação da privacidade para a revisão comercial. Antes de escrever essas páginas, solicitar nome legal do vendedor e contato; não inventar informações.

## Etapa 5 — apresentação
- Preservar marca e visual, destacando economia de tempo, praticidade e preparação para impressão, sem prometer resultados financeiros.
- Mensal visível primeiro; anual com “Melhor economia”, R$ 39,80 de economia, aproximadamente 16,67%, R$ 16,58/mês e R$ 0,55/dia como comparações.
- Informar claramente: pagamento anual único de R$ 199,00; os equivalentes não são cobranças mensais/diárias.
- Organizar Biblioteca, Editor, Meus Projetos, Minhas Favoritas, Minha Conta e Minha Assinatura, preservando o guia e boa navegação móvel.

## Detalhes técnicos
- Reutilizar autenticação, public.templates/template_images, projects, profiles, eventos e papéis existentes. Mudanças de dados serão aditivas; favoritos/assinaturas recebem permissões explícitas e RLS.
- Regras de acesso e franquia serão centralizadas no servidor, com consumo atômico e identificador de exportação para evitar concorrência/duplicados. Preservar exportação no navegador e o comportamento de download móvel; autorização deve preceder a liberação do download.
- Não prometer proteção contra reprodução de imagens que já chegaram ao navegador: a validação protege a operação oficial de exportação e o fornecimento de conteúdo premium, não a impossibilidade de captura/cópia pelo dispositivo.
- Usar funções do aplicativo para lógica interna e endpoint público com assinatura verificada para eventos de pagamentos; nunca expor chaves privadas.
- Testes concretos cobrirão sete usos, oitavo bloqueado, preços, comparações anuais, cancelamento no período pago, estados de assinatura, isolamento e idempotência.

## Etapa 6 — validação e limites do diagnóstico
**Já executado:** 32 testes existentes de cálculo, posicionamento da arte, projetos, planos atuais e regras de packs passaram. Navegação pública em Início, Estúdio e Biblioteca foi verificada no navegador. Isso não valida checkout, login real, arquivos baixados ou operações de usuários.

**Após aprovação:** testar cadastro/login, limite e bloqueio, planos mensal/anual, eventos verificados, cancelamento/expiração, projetos e favoritos, separação entre contas, upload administrativo e imagens, medidas, PDF A4 e celular. Informar individualmente testes executados e não executados. Pagamento real depende de aprovação externa; não será declarado testado por um fluxo de teste.

## Aprovação necessária
Aprovar a sequência acima, especialmente a nova franquia total de sete exportações, o pedido de login para controlar essa franquia e a transição sem cobrança retroativa dos usos antigos. Nenhuma função ou dado do aplicativo foi alterado neste diagnóstico.