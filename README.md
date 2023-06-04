# GPT4all

Experimentation folder using GPT4ALL on my Mac Mini M2

## TODO

- [ ] convert to monorepo
  - [ ] [syncabook](https://github.com/r4victor/syncabook)
  - gpt4all
    - [ ] make python3.10 compatible (glob/hidden)
    - [ ] write level 0 as json text files
    - [ ] iterate up the levels (create if not exists on results)

## GPT4All

Download Note\*: By default, models are stored in `~/.cache/gpt4all/` (you can change this with model_path). If the file already exists, model download will be skipped.

## Pipenv

### Usage

- `pipenv shell`
- `pipenv install`

### Setup / My docs

- Install `pipenv` by running `brew install pipenv`.
- Run `pipenv install --dev` to create a new virtual environment and a `Pipfile` with development dependencies.
- Activate the virtual environment with `pipenv shell`.
- Run a command inside the virtual environment with `pipenv run`.
- Deactivate the virtual environment with `exit`.
- Add a dependency: `pipenv install gpt4all`
- To list/show the virtual environment: `pipenv --venv`
- To cleanup/remove the virtual environment: `pipenv --rm`

## External Repos

### syncabook

```bash
cd ext-repos
git clone git@github.com:r4victor/syncabook.git
```

### gmessage

```bash
git clone git@github.com:drbh/gmessage.git
cd gmessage
docker build -t gmessage .
docker run -p 10999:10999 gmessage

## References

- [GPT4All docs](https://docs.gpt4all.io)
- [syncabook](https://github.com/r4victor/syncabook)
- [Dockerized gpt4all invoke with golang](https://github.com/drbh/gmessage)
```
