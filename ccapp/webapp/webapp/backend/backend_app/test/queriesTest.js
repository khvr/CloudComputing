const expect = require('chai').expect;
const chai = require('chai');
const app = require('../users/queries')
chai.use(require('chai-http'));
var validator = require("email-validator")

// Check if Email is valid
describe('Valid Email address Check', () => {

  it('should return Passed if Email address is valid', () => {

    if (validator.validate("valid@example.com") == true) {
      //.then((res)=> {
      //expect(res).to.have(true);
      console.log("Passed  email:valid@example.com")
    }
    else {
      console.log("Failed")
    }
  })
})

// Invalid email address checker
describe('InValid Email address Check', () => {

  it('should return Failed if Email address is invalid', () => {

    if (validator.validate("invalidexample.com") == true) {
      console.log("Passed")
    }
    else {
      console.log("Failed  email:invalidexample.com ")
    }
  })
})


//Check for ingredient quantity is positive Integer
describe('quantity is positive Integer Check', () => {
  it('should return passed if quantity array is positive integer', () => {
    const quantities = [1, 2, 3, 4, 5, 6, 5]
    function checkPosQty(quantity) {
      return quantity > 0;
    }

    function checkIntQty(quantity) {
      return !Number.isNaN(quantity)
    }

    if (quantities.every(checkPosQty) && (quantities.every(checkIntQty))) {
      console.log("Passed")
    }
    else {
      console.log("Failed ")
    }
  })

})


//Check for duplicates
describe('Duplicates in an array Check', () => {
  it('should return passed if duplicates are found in the array', () => {
    const quantities = [1, 1, 3, 4, 5, 6, 7]
    function find_duplicate_in_array(arra1) {
      var object = {};
      var result = [];

      arra1.forEach(function (item) {
        if (!object[item])
          object[item] = 0;
        object[item] += 1;
      })

      for (var prop in object) {
        if (object[prop] >= 2) {
          result.push(prop);
        }
      }

      return result;

    }
    if (find_duplicate_in_array(quantities).length != 0) {
      console.log("Passed duplicates found")
    }
    else {
      console.log("Failed ")
    }


  })

})

// process.on('exit', function(code) {
//   return console.log(`About to exit with code ${code}`);
// });