/**
 * Handlebars helpers registration
 * Here I added a helper that allows us to compare two values for equality in our Handlebars templates. 
 * This is useful for conditionally rendering content based on whether two values are the same. 
 * For example, we can use this helper to check if a user is logged in or if a certain value matches a specific condition in our .hbs templates.
 */


import Handlebars from "handlebars";

// https://stackoverflow.com/questions/10736907/handlebars-js-else-if
// https://handlebarsjs.com/playground.html

/** Registers `eq` and `contains` helpers on the global Handlebars instance. */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", function (operand1, operand2) {
    if (operand1 === operand2) {
      return true;
    }
    return false;
  });

  // AI Help. Compares an array with a value. Returns true if the value is found in the array, false otherwise.
  Handlebars.registerHelper("encodeUriComponent", function (value) {
    return encodeURIComponent(value?.toString?.() ?? String(value ?? ""));
  });

  Handlebars.registerHelper("contains", function (arr, value) {
    if (!Array.isArray(arr)) return false;
    const needle = value?.toString?.() ?? String(value);
    return arr.some(
      (item) => (item?.toString?.() ?? String(item)) === needle,
    );
  });
}
