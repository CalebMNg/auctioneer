const { DECIMAL_PLACES } = require("./constants");

//TODO: make configurable!
//linear stuff
const minToIncMargin = 10;
const bidIncrement = 0.25;
const exponentialIncrease = 1.1;

module.exports = {
  //enum for type of growth function
  GrowthFunction: Object.freeze({
    Linear: 1,
    Exponential: 2,
  }),
  round(num, decimal = DECIMAL_PLACES) {
    return Math.round(num * 10 ** decimal) / 10 ** decimal;
  },
  calculateMinIncrease(
    numBids,
    prevBid,
    growthFunction = module.exports.GrowthFunction.Linear
  ) {
    if (growthFunction === module.exports.GrowthFunction.Linear) {
      //linear increase of marginInc every minToIncMargin
      numMargins = Math.floor(numBids / minToIncMargin);
      newMin = prevBid + numMargins * bidIncrement + 0.1 ** DECIMAL_PLACES;
      return module.exports.round(newMin);
    }
    if (growthFunction === module.exports.GrowthFunction.Exponential) {
      return module.exports.round(prevBid * exponentialIncrease);
    }
  },
};
