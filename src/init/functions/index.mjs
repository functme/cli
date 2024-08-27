/**
 * Sample welcome API
 * We can provide types to our APIs to enforce type-safety
 *   at the HTTP request (@param) and response (@returns) layer
 * @param {string} username 
 * @returns {object}  welcomeMessage
 * @returns {string}  welcomeMessage.message
 */
export async function GET (username = 'new user') {

  return {
    message: `Welcome to Funct, ${username}!`
  };

};