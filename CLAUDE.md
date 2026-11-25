# Duas Contas — regras do projeto

Estas regras valem para todas as conversas neste projeto, sem eu precisar repetir.

## Fonte de verdade

- O `spec.md` descreve tudo o que o sistema deve fazer. Leia antes de qualquer tarefa.
- As telas de referência estão em `design/telas-duas-contas.pdf`.
- Tudo em português do Brasil: textos da interface, valores em R$ (formato 1.234,56) e datas em dd/mm/aaaa.

## Sempre que eu relatar um problema

Quando eu disser que algo não funciona, está errado ou quebrou, siga estes passos nesta ordem:

1. **Não altere nenhum código ainda.**
2. **Investigue:** leia o código envolvido, a mensagem de erro (se houver) e reproduza o problema quando possível.
3. **Encontre a causa real**, não só o sintoma.
4. **Me explique em linguagem simples:** o que causou o problema e onde ele está.
5. **Proponha a correção** e diga se ela pode afetar outra parte do sistema. Espere meu ok antes de aplicar.
6. **Depois de corrigir**, teste a correção e confira se o resto continua funcionando (build e testes).
7. **Me diga como eu confirmo** que ficou resolvido.

Se eu descrever o problema de forma vaga, faça as perguntas necessárias antes de investigar.

## Regras gerais

- Trabalhe em uma etapa do `spec.md` por vez. Não comece a próxima sem eu pedir.
- Ao terminar uma etapa, faça um resumo curto do que foi feito e de como eu testo.
- Nunca apague dados ou o banco sem me avisar antes. Faça backup antes de qualquer mudança no banco que possa perder dados.
- Se algo que eu pedir fugir do `spec.md`, pergunte antes de fazer.
- Quando uma regra ou funcionalidade mudar, atualize o `spec.md` também, para ele continuar sendo a fonte de verdade.
