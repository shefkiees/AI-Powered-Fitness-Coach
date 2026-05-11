function isStrictBackendModeValue(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isStrictBackendMode() {
  return isStrictBackendModeValue(process.env.STRICT_BACKEND_MODE);
}

module.exports = {
  isStrictBackendMode,
  isStrictBackendModeValue,
};
