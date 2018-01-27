# Crown-PA-Docs-Site

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/tobyroworth/Crown-PA-Docs-Site.svg?branch=iss15)](https://travis-ci.org/tobyroworth/Crown-PA-Docs-Site)

Documentation viewer for Crown PA, built using Polymer 3.0 with the Github API for the data layer.

## Running the Site Locally

1. Install dependencies `yarn install`
2. Build `gulp full`
3. Run dev server `gulp serve`

The dev server defaults to using [`superstatic`](firebase/superstatic), but can also [`firebase serve`](firebase/firebase-tools).

The server can be chosen on a per-run basis using `gulp serve:superstatic` or `gulp serve:firebase`.

To change the default server set the `CROWNPASERVER` environmental variable to `firebase` or `superstatic`.

```
export CROWNPASERVER=firebase
gulp serve
```

## Live Site

Live site available at https://crownpa-docs.firebaseapp.com/

## Docs Source

The source for the docs themselves is held in separate repositories:
- https://github.com/tobyroworth/LivingRoomPADocs

## Contributing

If you'd like to help with the documentation viewer itself, file issues and pull requests in this repository.

If you want to help write the documentation itself, send pull requests to the repositories of the docs themselves.

## License

The code is licensed under the MIT license.

The docs themselves are licensed under a [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).
