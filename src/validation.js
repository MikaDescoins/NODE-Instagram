const fs = require('fs')
const constants = require('./constants.js')

module.exports = {
  validateNumber : (value) => {
    if (isNaN(value) && +value >= 0) {
      console.log(`Merci d'entrer un paramètre valide.`.red)
      process.exit()
    }
    return +value
  },
  validatePorfolioConfigPath : (customPath) => {
    const path = customPath || constants.portfolioPath
    if (!fs.existsSync(path)) {
      console.log(`Merci de bien vouloir ajouter un fichier de configuration à : ${path}.`.red)
      process.exit()
    }
    return path
  },
  validateConvertCurrency : (value) => {
    const convert = value.toUpperCase()
    const availableCurrencies = ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR', 'BTC']
    if (availableCurrencies.indexOf(convert) === -1) {
      console.log('Convertion impossible.'.red)
      process.exit()
    }
    return convert
  }
}