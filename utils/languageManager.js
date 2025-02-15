const translations = require('./language.json');

function setLanguage(req, language) {
    if (translations[language]) {
        req.session.language = language;
    }
}

function getTranslation(req, key, variables = {}) {
    const language = req.session.language || 'en';
    const translation = translations[language][key] || `[${key} not found]`;
    return replaceVariables(translation, variables);
  }

function replaceVariables(translation, variables) {
    return translation.replace(/<%= (\w+) %>/g, (match, key) => variables[key] || match);
}

module.exports = {
    setLanguage,
    getTranslation,
    replaceVariables
};