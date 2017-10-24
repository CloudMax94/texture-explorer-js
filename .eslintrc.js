const path = require('path')

module.exports = {
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module",
    "allowImportExportEverywhere": true
  },
  "extends": [
    "standard",
    "standard-jsx"
  ],
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    "compat/compat": "error",
    "consistent-return": "off",
    "import/no-unresolved": "error",
    "import/no-extraneous-dependencies": "off",
    "no-console": "off",
    "no-use-before-define": "off",
    "promise/param-names": "error",
    "promise/always-return": "error",
    "promise/catch-or-return": "error",
    "promise/no-native": "off",
    "react/sort-comp": ["error", {
      "order": ["type-annotations", "static-methods", "lifecycle", "everything-else", "render"]
    }],
    "react/jsx-no-bind": ["warn", {
      "ignoreRefs": true
    }],
    "react/jsx-filename-extension": ["error", { "extensions": [".js", ".jsx"] }]
  },
  "plugins": [
    "import",
    "promise",
    "compat",
    "react"
  ],
  "settings": {
    "import/resolver": {
      "webpack": {
        "config": "webpack.config.eslint"
      }
    }
  }
}
