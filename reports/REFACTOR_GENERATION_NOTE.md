# Source refactor generation

Baseline: Update52 final accepted HTML and compiled engine; source section boundaries retained verbatim except named config references and numeric tuning references. Runtime source modules share a factory closure and are bundled by Python; they are not separate loadable ES modules.

Static datasets migrated: 56. Numeric references moved: engine 1952; UI 282. Configuration files are authoritative; compiled.json is generated for Node, and embedded into standalone HTML for browser.

See DATA_INVENTORY.md for retained numeric literals/metadata.
