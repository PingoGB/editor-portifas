# Site Portfolio Editor de Video

Site estatico pronto para publicar na Netlify.

## Como editar textos

Todos os textos visiveis ficam em:

- `content/pt.jsonc`
- `content/en.jsonc`

Edite apenas os textos entre aspas. Os placeholders com `[INSERIR ...]` / `[ADD ...]` indicam conteudo temporario que deve ser trocado por material real.

Para destacar uma palavra ou trecho em vermelho, envolva o texto com dois asteriscos:

`Edição pensada para **prender atenção**.`

## Como publicar na Netlify

1. Envie esta pasta para um repositorio ou arraste a pasta `video-portfolio-site` para o painel da Netlify.
2. Nao precisa comando de build.
3. O arquivo de entrada e `index.html`.

## Como adicionar outro case

No arquivo de conteudo, copie um objeto dentro de `work.cases`, cole abaixo dos dois cases existentes e edite:

- `category`
- `title`
- `summary`
- `fullVideo`
- `technicalDescription`
- `clips`

O layout se ajusta automaticamente.

## Como trocar placeholders por midia real

Nos blocos de antes/depois e nos clips dos cases, preencha o campo `src` com o caminho do arquivo ou URL.

Exemplos:

- `./assets/reels-gancho.gif`
- `./assets/antes.mp4`
- `https://seusite.com/video.gif`

GIFs e imagens aparecem como imagem. Arquivos `.mp4`, `.webm` e `.mov` aparecem como video em loop.

## Como colocar o video completo no case

Em cada case, edite o objeto `fullVideo`.

- Use `embedUrl` para um player externo leve, como um video nao-listado incorporado.
- Use `src` para um arquivo local `.mp4` ou `.webm`.
- Se os dois ficarem vazios, o site mostra um placeholder editavel no lugar do player.

## Ordem das paginas

A navegacao segue esta sequencia:

Home -> Sobre Mim -> Trabalhos em Destaque -> Home
