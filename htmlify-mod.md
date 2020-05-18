# Making your Scratch 3.0 mod work with the HTMLifier

The HTMLifier needs a single script file that makes the following available in the global scope (`window`):

- `ScratchStorage` ([scratch-storage](https://github.com/LLK/scratch-storage))

- `NotVirtualMachine` ([scratch-vm](https://github.com/LLK/scratch-vm))&mdash;This is a hack because `window.VirtualMachine` didn't work for me when I did it

- `ScratchRender` ([scratch-render](https://github.com/LLK/scratch-render))

- `AudioEngine` ([scratch-audio](https://github.com/LLK/scratch-audio))

- `ScratchSVGRenderer` ([scratch-svg-renderer](https://github.com/LLK/scratch-svg-renderer))

You can make your mod do this by creating a file called [`vm.js` in src/playground/](https://github.com/SheepTester/scratch-vm/blob/16-9/src/playground/vm.js) in your mod's scratch-vm repository with the following:

```js
window.ScratchStorage = require('scratch-storage');
window.NotVirtualMachine = require('..');
window.ScratchRender = require('scratch-render');
window.AudioEngine = require('scratch-audio');
window.ScratchSVGRenderer = require('scratch-svg-renderer');
```

Then, you can make scratch-vm produce `vm.min.js` when building by editing [`webpack.config.js`](https://github.com/SheepTester/scratch-vm/blob/16-9/webpack.config.js#L92):

```diff
      // Playground
      defaultsDeep({}, base, {
          target: 'web',
          entry: {
              'benchmark': './src/playground/benchmark',
-             'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug'
+             'video-sensing-extension-debug': './src/extensions/scratch3_video_sensing/debug',
+             'vm.min': './src/playground/vm'
          },
          output: {
              path: path.resolve(__dirname, 'playground'),
              filename: '[name].js'
          },
```

Adding `'vm.min': './src/playground/vm'` will make Webpack compile that vm.js file into the fat Scratch engine script file that the HTMLifier wants.

You can then build and deploy scratch-vm to Github Pages:

```sh
NODE_ENV=production npm run build
npm run deploy -- -a
```

> `NODE_ENV=production` makes it build for production rather than development, so it minifies the produced JS file to make it as small as it can.
>
> `npm run build` runs the `build` script as defined in the package.json; namely, it cleans up the output from previous builds, then runs Webpack. The output is put in the `build/` folder.
>
> `npm run deploy` commits the `build/` folder into the `gh-pages` branch and pushes it so Github Pages can deploy it and make it live.
>
> `-- -a` passes the `-a` option to the thing that deploys to Github pages; `-a` keeps other folders in the branch. You can use `-e branch-name`, and it'll put it in a folder called `branch-name` in the `gh-pages` branch.

The fat Scratch engine script file will then be available at `https://[Github username].github.io/scratch-vm/vm.min.js`.
