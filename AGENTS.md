# AGENTS.md — Developer & Agent Guide

This file provides guidance for coding agents and human contributors working in
the `@tsmx/mongoose-encrypted-string` repository.

---

## Project Overview

A minimal Mongoose plugin that adds a transparent `EncryptedString` schema type.
Encryption/decryption is delegated entirely to `@tsmx/string-crypto`.

- **Language:** Plain JavaScript (CommonJS, no TypeScript, no build step)
- **Single source file:** `mongoose-encrypted-string.js` (~41 lines)
- **Test directory:** `test/`

---

## Commands

### Run all tests
```bash
npm test
```

### Run all tests with coverage
```bash
npm run test-coverage
```

### Run a single test file
```bash
npx jest test/encryptedstring-aes-gcm.test.js
npx jest test/encryptedstring-aes-cbc.test.js
npx jest test/encryptedstring.test.js
```

### Run a single test by name
```bash
npx jest -t "tests a successful document creation"
```

### Lint (no script alias — invoke directly)
```bash
npx eslint .
```

### Fix lint errors automatically
```bash
npx eslint . --fix
```

---

## Code Style

### Module system
- **CommonJS only.** Use `require()` and `module.exports`. Do not use ES module
  `import`/`export` syntax anywhere in this project.

### Formatting (enforced by ESLint)
- **Indentation:** 4 spaces (no tabs). `switch` case bodies are indented 1 level
  inside the `switch`.
- **Quotes:** Single quotes for all strings.
- **Semicolons:** Required at the end of every statement.
- No Prettier — all formatting rules come from ESLint.

### Variables
- Use `const` for imports and values that are never reassigned.
- Use `let` for variables that may be reassigned.
- Avoid `var` in new source code. Test files historically use `var` for top-level
  mutable setup variables (`mongoServer`, model variables), but `const`/`let` is
  preferred going forward.

### Naming conventions
- **Classes:** PascalCase — e.g. `EncryptedString`
- **Functions and variables:** camelCase — e.g. `registerEncryptedString`, `testKey`
- **Constants:** camelCase (not `SCREAMING_SNAKE_CASE`) — e.g. `allowedAlgorithms`
- **Unused parameters:** Prefix with `_` to silence the `no-unused-vars` warning —
  e.g. `function handler(_req, res) {}`

### Exports
- Export only what consumers need. The library currently exports a single named
  function; do not add a default export.
- The `EncryptedString` class is intentionally not exported; it is only accessible
  after registration via `mongoose.Schema.Types.EncryptedString`.

### Classes
- Use ES6 `class` syntax extending a base class where appropriate.
- Static class fields are acceptable for shared mutable state:
  ```js
  static options = { key: null };
  ```

### Error handling
- Throw `Error` instances with descriptive messages using template literals:
  ```js
  throw new Error(`Invalid algorithm '${algorithm}'. Allowed: ${allowedAlgorithms.join(', ')}`);
  ```
- Do not silently swallow errors. Let errors from underlying libraries (e.g.
  `@tsmx/string-crypto`, Mongoose) propagate naturally unless there is a
  specific reason to catch and re-throw.

### Async code
- Use `async/await` consistently. Do not use raw `.then()` / `.catch()` Promise
  chains unless interoperating with a callback-only API.

---

## Test Conventions

### Framework
- **Jest** `^29` with `testEnvironment: 'node'`.
- Each test suite that requires MongoDB spins up an in-memory server via
  `mongodb-memory-server`.

### File naming
- Test files live in `test/` and are named `encryptedstring*.test.js`.

### Test description style
- `describe` blocks name the suite: `'EncryptedString tests'`, `'AES-256-GCM tests'`, etc.
- `it` descriptions start with `"tests"`:
  ```js
  it('tests a successful document creation', async () => { ... });
  it('tests that an error is thrown for an invalid algorithm', () => { ... });
  ```

### Structure within a suite
```js
describe('suite name', () => {
    const testKey = '...';          // immutable constants at top
    var mongoServer = null;         // mutable lifecycle vars
    var Person = null;

    beforeAll(async () => { /* start mongo, register plugin */ });
    afterAll(async () => { /* stop mongo */ });
    beforeEach(async () => { /* reset collection */ });
    afterEach(async () => { /* cleanup */ });

    it('tests ...', async () => {
        // arrange
        // act
        // expect
    });
});
```

### Assertions
- Use Jest's built-in `expect` API.
- Verify thrown errors with `expect(() => fn()).toThrow()` or
  `expect(() => fn()).toThrow('message substring')`.

---

## Architecture Notes

- `registerEncryptedString(mongoose, key, algorithm?)` is the sole public API.
  It validates the algorithm, stores key/algorithm on the static `EncryptedString.options`
  object, and attaches `EncryptedString` to `mongoose.Schema.Types`.
- Supported algorithms: `'aes-256-gcm'` (default) and `'aes-256-cbc'`.
- The key must be a 32-byte hex string (64 hex characters) or a 32-character
  UTF-8 string — see README for details.
- Encryption/decryption uses `passNull: true`, meaning `null` values pass through
  without being encrypted/decrypted.

---

## CI

GitHub Actions workflows are in `.github/workflows/`:
- `git-build.yml` — runs `npm test` on Node 18, 20, and 22 for every push.
- `npm-publish.yml` — manually triggered; runs tests then publishes to npm.

All tests must pass on Node 18, 20, and 22 before any change is considered
complete.
