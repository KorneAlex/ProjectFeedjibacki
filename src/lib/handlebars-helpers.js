/**
 * Handlebars helpers registration
 * Here I added a helper that allows us to compare two values for equality in our Handlebars templates. 
 * This is useful for conditionally rendering content based on whether two values are the same. 
 * For example, we can use this helper to check if a user is logged in or if a certain value matches a specific condition in our .hbs templates.
 */


import Handlebars from "handlebars";

// https://stackoverflow.com/questions/10736907/handlebars-js-else-if
// https://handlebarsjs.com/playground.html
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", function (operand1, operand2) {
    if (operand1 === operand2) {
      return true;
    }
    return false;
  });
}
