# @nelts/template

template for nelts project or plugin.

# Usage

You can install cli `npm i @nelts/cli`. Custom usage like this blow.

# Dev

```bash
$ NODE_ENV=development ts-node node_modules/@nelts/process/dist/runtime.js --module=@nelts/nelts --base=. --config=nelts.config
```

or 

```bash
nelts dev
```

> you should edit `package.json`, remove `"source": "dist",` property.

# Build

```bash
$ rm -rf dist/ && tsc -d
```

or

```bash
nelts build
```

> you should edit `package.json`, add `"source": "dist",` property.

# Pro

```bash
$ nelts start
$ nelts restart
$ netls stop
```

# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
