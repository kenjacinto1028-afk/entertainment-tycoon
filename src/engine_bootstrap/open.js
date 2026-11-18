
/* Studio Syndicate — initial prototype simulation engine. No external dependencies. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudioEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {