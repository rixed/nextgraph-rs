.PHONY: all clean preview docker docker-quick run populate

LIBWASM_DIR = sdk/js/lib-wasm
WEB_DIR = sdk/js/web
AUTH_DIR = engine/broker/auth
APP_DIR = app/miniapp

WASM_BINDGEN = $(HOME)/.cargo/bin/wasm-bindgen
TSC = node_modules/.bin/tsc

TARGET ?= debug
ifdef NDEBUG
TARGET = release
endif

all: $(APP_DIR)/dist/index.html

clean:
	$(RM) -r $(LIBWASM_DIR)/pkg/snippets $(LIBWASM_DIR)/pkg/*.{js,ts,wasm}

target/wasm32-unknown-unknown/$(TARGET)/lib_wasm.wasm: $(wildcard $(LIBWASM_DIR)/src/*.rs)
	cd $(LIBWASM_DIR) &&\
	RUSTFLAGS='--cfg getrandom_backend="wasm_js"' cargo build -v --target wasm32-unknown-unknown

$(LIBWASM_DIR)/pkg/lib_wasm_bg.wasm: target/wasm32-unknown-unknown/$(TARGET)/lib_wasm.wasm $(WASM_BINDGEN)
	$(WASM_BINDGEN) $< --out-dir $(LIBWASM_DIR)/pkg --target bundler
ifdef NDEBUG
	wasm-opt -O2 -o '$@' '$@'
endif

$(LIBWASM_DIR)/pkg/package.json: Makefile $(LIBWASM_DIR)/Cargo.toml
	@echo '{' > $@
	@echo '  "name": "@ng-org/lib-wasm",' >> $@
	@echo '  "type": "module",' >> $@
	@echo '  "version": "'$$(cargo metadata --format-version=1 --no-deps | jq -r '.packages[] | select(.name=="lib-wasm") | .version')'",' >> $@
	@echo '  "files": [' >> $@
	@echo '    "lib_wasm_bg.wasm",' >> $@
	@echo '    "lib_wasm.js",' >> $@
	@echo '    "lib_wasm_bg.js",' >> $@
	@echo '    "lib_wasm.d.ts",' >> $@
	@echo '    "LICENSE-MIT",' >> $@
	@echo '    "LICENSE-APACHE2",' >> $@
	@echo '    "lib_wasm_bg.wasm.d.ts",' >> $@
	@echo '    "snippets/**/*.js"' >> $@
	@echo '  ],' >> $@
	@echo '  "main": "lib_wasm.js",' >> $@
	@echo '  "types": "lib_wasm.d.ts",' >> $@
	@echo '  "sideEffects": [' >> $@
	@echo '    "./lib_wasm.js",' >> $@
	@echo '    "./snippets/*"' >> $@
	@echo '  ]' >> $@
	@echo '}' >> $@

pnpm.updated: \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  $(LIBWASM_DIR)/pkg/package.json \
  $(WEB_DIR)/package.json \
  engine/broker/auth/package.json \
  app/miniapp/package.json
	pnpm install &&\
	date > $@

$(WEB_DIR)/type_check.ok: $(wildcard $(WEB_DIR)/src/*.ts) pnpm.updated
	pnpm -C $(WEB_DIR) exec tsc

$(WEB_DIR)/dist/ngweb.js: \
  $(WEB_DIR)/type_check.ok \
  $(WEB_DIR)/vite.config.ts \
  $(LIBWASM_DIR)/pkg/lib_wasm_bg.wasm
	vite build

$(AUTH_DIR)/dist/index.html: \
  $(AUTH_DIR)/vite.config.js \
  $(wildcard $(AUTH_DIR)/src/*.html) \
  $(wildcard $(AUTH_DIR)/src/*.ts) \
  $(wildcard $(AUTH_DIR)/src/*.svelte)
	WEBPACK_PARALLELISM=1 NODE_OPTIONS=--max-old-space-size=3000 \
	  pnpm -C $(AUTH_DIR) exec vite build --base=./

$(APP_DIR)/src/wallet.ts: $(APP_DIR)/src/wallet.ngw
	@echo export const base64 = \\'$$(base64 -w0 '$<')\\'\\; > $@

# FIXME: too much noise therefore "|| true"
$(APP_DIR)/type_check.ok: \
  $(APP_DIR)/tsconfig.json \
  $(LIBWASM_DIR)/pkg/lib_wasm_bg.wasm \
  $(APP_DIR)/vite.config.ts \
  $(APP_DIR)/src/main.ts \
  $(APP_DIR)/src/tools.ts \
  $(wildcard $(APP_DIR)/src/*.svelte) \
  $(wildcard $(APP_DIR)/src/lib/*.svelte) \
  $(wildcard sdk/js/api-web/*.ts sdk/js/api-web/*.js)
	pnpm -C $(APP_DIR) exec svelte-check --tsconfig ./tsconfig.app.json || true
	date > $@

$(APP_DIR)/dist/index.html: \
  pnpm.updated \
  $(APP_DIR)/type_check.ok
	pnpm -C $(APP_DIR) exec vite build

preview: $(APP_DIR)/dist/index.html
	pnpm -C $(APP_DIR) exec vite preview

docker/index.gzip docker/index.sha256 &:
	wget -q -O - https://localfirstapp.eu/index.tar.xz | tar -C docker -Jx

# Build the docker image in release or debug (default) mode:
#   make docker NDEBUG=1  # release
#   make docker           # debug
# The broker is provisionned with a bunch of users already (all passwords: 'secret').
docker.ok: \
    docker/Dockerfile-broker \
    docker/cargo.config.toml \
    docker/ng.tgz \
    docker/index.gzip \
    docker/index.sha256
	TAG=nextgraph-dev-broker; \
	if test '$(TARGET)' != release; then TAG="$$TAG"'-$(TARGET)'; fi; \
	docker build --no-cache --build-arg PROFILE=$(TARGET) -t "$$TAG" -f $< docker/
	touch $@

docker: docker.ok

docker/ngd: target/debug/ngd
	cp -lf $< $@

docker/ngcli: target/debug/ngcli
	cp -lf $< $@

docker-quick: \
    docker/Dockerfile-quick \
    docker/ngd \
    docker/ngcli \
    docker/ng.tgz \
    docker/index.gzip \
    docker/index.sha256
	TAG=nextgraph-quick-broker; \
	if test '$(TARGET)' != release; then TAG="$$TAG"'-$(TARGET)'; fi; \
	docker build -t "$$TAG" -f $< docker/

run:
	docker run --rm --name nextgraph-broker -p 127.0.0.1:14400:14400 nextgraph-dev-broker-debug

add-invitation:
	docker exec -t nextgraph-dev-broker ngcli admin add-invitation --admin --forever --notos

# Tools

$(WASM_BINDGEN):
	@BINDGEN_VERSION = $$(\
	  cargo metadata --format-version=1 |\
	  jq -r '.packages[] | select(.name=="wasm-bindgen") | .version' |\
	  sort -u | head -n1\
	) &&\
	CARGO_NET_OFFLINE=false cargo install wasm-bindgen-cli --locked --version '$(BINDGEN_VERSION)'
