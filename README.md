# htmlifier

The HTMLifier "converts" Scratch 3.0 projects to an HTML file by putting all the
project data and the entire Scratch engine into one enormous file.

It does this by making Scratch VM fetch a project, and in doing so, it tracks
the assets it fetches from the project.json. It converts the fetched assets and
project.json into a base64 data URI. It also fetches the code for the Scratch
VM. It inserts all this in a template HTML file, which has been set up to load
the project from the base64 data URIs and do other things that the Scratch VM
doesn't take of, which is normally handled by
[scratch-gui](https://github.com/LLK/scratch-gui/), such as variable/list
monitors and ask and wait prompts.

The HTMLifier is also available as an [npm
package](https://www.npmjs.com/package/@sheeptester/htmlifier).

## Credits

CSS by [Mr. Cringe Kid](https://scratch.mit.edu/users/mrcringekidyt/).

The Scratch engine is from [scratch-vm](https://github.com/LLK/scratch-vm/).

[JSZip](https://stuk.github.io/jszip/) for downloading as a zip.

## See also

The Scratch mod used by the HTMLifier: [E羊icques](https://sheeptester.github.io/scratch-gui/)
([Github](https://github.com/SheepTester/scratch-gui)).

Depending on your use case, the HTMLifier may not be the best option for you.
The HTMLifier prioritizes accuracy by using almost the same engine that vanilla
Scratch uses, sacrificing speed and editability.

Scratch to JavaScript compilers (best for speed):
[Phosphorus](https://phosphorus.github.io/) (Scratch 2.0),
[Forkphorus](https://forkphorus.github.io/) (3.0), and
[TurboWarp](https://turbowarp.org/) (3.0).

Scratch to JavaScript converter (best for learning JavaScript):
[Leopard](https://leopardjs.now.sh/)

## Development

If modifying the files in src/, you'll have to re-bundle everything.

```sh
# Build once
deno run --allow-run --allow-read=src --allow-write=index.bundle.min.js \
  --allow-net=sheeptester.github.io bin/build.ts

# Automatically build when the files change (for development)
nodemon --exec "deno run --allow-all" --watch src --watch client \
  --ext ts,css,html,js bin/build.ts -- dev

# Build for Node
deno run --allow-run --allow-read=src --allow-write=node/index.min.js \
  --allow-net=sheeptester.github.io bin/build.ts node
```
