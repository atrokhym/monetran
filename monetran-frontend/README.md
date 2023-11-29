## Monetran Frontend Repo
This repo contains the frontend source code for the monetran app, built on top of the React framework, and connects to an api server.

## Installation
Pull source code to development directory:
```shell
$ git pull origin ${REPO_URL}
$ # e.g git clone git@github.com:codehakase/monetran-frontend.git
```

Install dependencies with [Yarn](https://yarnpkg.com/lang/en/docs/install).
```shell
$ cd ${MONETRAN_DIR}
$ yarn install
```
Boot up dev server:
```shell
$ # inside the repo directory
$ yarn start
```

## Builds & Deployment
The repo has a build helper that bundles the React application into static files that can be uploaded to any http server. To run a build, run:
```shell
$ yarn build
```

The command above bundles everything to a `build` directory, which can be uploaded to any server.

## Environment Vars
Check the `.env.example` file for format of environment variables needed by the app.

Here's a rundown of services that are passed to the environment file:
- Google OAuth Client ID
- Stripe Public Key
