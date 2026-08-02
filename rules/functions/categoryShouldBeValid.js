/**
 * Ensure that an x-category matches a real API Category value
 * See https://backmarket.atlassian.net/wiki/spaces/AE/pages/2850718810/Glossary#API-categories-concept for more info
 */
module.exports = (category, _, __, schema) => {
    if (!category) { return }

    const categories = [`system`, `process`, `domain`, `experience`, `composite`]

    if (!categories.includes(category)) {
        return [{ message: `Expected x-category ${category} to have one of theses values : ${categories.toString()}` }]
    }
}