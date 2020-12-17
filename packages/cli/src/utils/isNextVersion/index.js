module.exports = function (version) {
  return (
    version.includes('-nightly.') ||
    version.includes('-beta.') ||
    version.includes('-alpha.')
  );
};
