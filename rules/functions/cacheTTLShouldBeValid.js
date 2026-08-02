/**
 * Ensure that a cache-ttl matches an integer
 */
 module.exports = (ttl, _, __, schema) => {
    if (!ttl) { return }

    const numberedTTL = Number(ttl)

    if (!Number.isInteger(numberedTTL)) {
      return [{ message: `Expected cache-ttl ${ttl} to be an integer`}]
    }
}
