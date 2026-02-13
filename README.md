# FCL Finance App (fcl-finance-app)

A Quasar Project

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Capacitor (Android) workflow

Use `src-capacitor` as the single Capacitor source of truth.

```bash
yarn dev:android
yarn cap sync android
yarn cap open android
```

These root scripts forward to `src-capacitor` so plugin sync/registration always happens in the same Android project.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
