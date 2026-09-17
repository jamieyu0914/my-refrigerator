/**
 * @typedef {Object} RecognizedFoodItem
 * @property {string} tempId - client-generated id (crypto.randomUUID()), never a DB id
 * @property {string} name
 * @property {string} category - one of utils/constants.js CATEGORIES
 * @property {string} emoji
 * @property {number} [confidence] - 0-1, model-reported; display only, never used to skip confirmation
 * @property {boolean} selected - defaults to true; user can uncheck before confirming
 */

export {}
