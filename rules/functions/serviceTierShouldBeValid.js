/**
 * Ensure that an x-tier matches a real tier value
 */
 module.exports = (tier, _, __, schema) => {
    if (!tier) { return }
  
    const tiers = [1, 2, 3, 0]
  
    if (!tiers.includes(tier)) {
      return [{ message: `Expected x-tier ${tier} to have 1 of theses values : 1, 2, 3, unknown`}]
    }
}