# Monetran Backend Monorepo

### Breakdown of projects
  - `api/` - API Source Code
  - `bridge-service` - Stellar Bridge service to pull transactions from Stellar
    Horizon.
> See the `*.env.example` configs for an overview of environment params to pass

### Building
To build the api, create a `.env` file (see `api.env.example` for reference) in
the root before running `docker-compose up`, so Docker can infer the environment
variables for each service.

- Copy `api/Dockerfile.dev` to `api/Dockerfile.prod` with updates to the `ENV` vars.
- Copy `docker-compose.dev.yml` to `docker-compose-prod.yml` with updates to the
	services definition.

Build with:
```shell
$ docker-compose -f docker-compose.dev.yml up # or build
```

To build docker image for api run `make docker`

