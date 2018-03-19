#!/usr/bin/env node
const fs = require('fs')
const program = require('commander')
const axios = require('axios')
const ora = require('ora')
const Table = require('cli-table2')
const colors = require('colors')
const humanize = require('humanize-plus')
const validation = require('./validation.js')
const constants = require('./constants.js')

// helper functions
const list = value => value && value.split(',') || []
const getColoredChangeValueText = (value) => {
    const text = `${value}%`
    return value && (value > 0 ? text.green : text.red) || 'NA'
}
program
    .version('0.0.1')
    .option('-c, --convert [currency]', 'Convertie la monnaie', validation.validateConvertCurrency, 'USD')
    .option('-f, --find [symbol]', 'Trouve une monnaie spécifique en fonction de son nom', list, [])
    .option('-t, --top [index]', 'Affiche le top des monnaie (classement établit en fonction de CoinMarketCap)', validation.validateNumber, 10)

    .option('-s, --specific [index]', 'Affiche une ou plusieurs colonnes specifiques (separer par des virgules ex: 1,3,4)', list, [])
    .option('-r, --rank [index]', 'Tri en fonction de la colonne saisie', validation.validateNumber, 0)
    .parse(process.argv)

console.log('\n')

// handle options
const convert = program.convert.toUpperCase()
const marketcapConvert = convert === 'BTC' ? 'USD' : convert
const find = program.find
const portfolio = program.portfolio
const top = (find.length > 0 || portfolio) ? 1500 : program.top
const column = program.specific
const rank = program.rank

// handle table
const defaultHeader = ['Rang', 'Coin', `Prix ${convert}`, 'Change 1H', 'Change 24H', 'Change 7D', `Market Cap ${marketcapConvert}`].map(title => title.yellow)
if (portfolio) {
    defaultHeader.push('Balance'.yellow)
    defaultHeader.push('Valeur Estimée'.yellow)
}
const defaultColumns = defaultHeader.map((item, index) => index)
const columns = column.length > 0
    ? column.map(index => +index)
.filter((index) => {
    return !isNaN(index)
    && index < defaultHeader.length
})
: defaultColumns
const sortedColumns = columns.sort()
const header = sortedColumns.map(index => defaultHeader[index])
const table = new Table({
    chars: {
        'top': '-',
        'top-mid': '-',
        'top-left': '-',
        'top-right': '-',
        'bottom': '-',
        'bottom-mid': '-',
        'bottom-left': '-',
        'bottom-right': '-',
        'left': '║',
        'left-mid': '-',
        'mid': '-',
        'mid-mid': '-',
        'right': '║',
        'right-mid': '-',
        'middle': '│'
    },
    head: header
})



// For testing
// console.log('--convert', convert)
// console.log('--find', find)
// console.log('--top', top)
// console.log('--portfolio', portfolio)
// console.log('--specific', columns)

// show loading animation
const spinner = ora('Loading data').start()

// call coinmarketcap API
const sourceUrl = `https://api.coinmarketcap.com/v1/ticker/?limit=${top}&convert=${convert}`
const priceKey = `price_${convert}`.toLowerCase()
const marketCapKey = `market_cap_${marketcapConvert}`.toLowerCase()
const volume24hKey = `24h_volume_${marketcapConvert}`.toLowerCase()
const keysMap = {
    0: 'rank',
    1: 'symbol',
    2: priceKey,
    3: 'percent_change_1h',
    4: 'percent_change_24h',
    5: 'percent_change_7d',
    6: marketCapKey
}

axios.get(sourceUrl)
    .then(function (response) {
        spinner.stop()
        response.data
            .filter(record => {
            if (find.length > 0) {
            return find.some(keyword => record.symbol.toLowerCase() === keyword.toLowerCase())
        }
        return true
    })
        .map(record => {
            const editedRecord = {
                'name': record.name,
                'symbol': record.symbol,
                'rank': record.rank && +record.rank,
                'available_supply': record.available_supply && +record.available_supply,
                'total_supply': record.total_supply && +record.total_supply,
                'max_supply': record.max_supply && +record.max_supply,
                'percent_change_1h': record.percent_change_1h && +record.percent_change_1h,
                'percent_change_24h': record.percent_change_24h && +record.percent_change_24h,
                'percent_change_7d': record.percent_change_7d && +record.percent_change_7d,
                'last_updated': record.last_updated
            }
            editedRecord[priceKey] = record[priceKey] && +record[priceKey]
            editedRecord[volume24hKey] = record[volume24hKey] && +record[volume24hKey]
            editedRecord[marketCapKey] = record[marketCapKey] && +record[marketCapKey]

            return editedRecord
        })
        .sort((recordA, recordB) => {
            const compareKey = keysMap[rank]
            if (rank === 0 || !compareKey) {
            return -1
        } else if (rank === 1) {
            return recordA[compareKey].localeCompare(recordB[compareKey])
        } else {
            return recordB[compareKey] - recordA[compareKey]
        }
    })
        .map(record => {
            // marketcap
            const marketCap = record[marketCapKey]
            const displayedMarketCap = marketCap && humanize.compactInteger(marketCap, 3) || 'NA'
            // final value
            const defaultValues = [
                record.rank,
                record.symbol,
                record[priceKey],
                getColoredChangeValueText(record.percent_change_1h),
                getColoredChangeValueText(record.percent_change_24h),
                getColoredChangeValueText(record.percent_change_7d),
                displayedMarketCap,
            ]

            const values = sortedColumns.map(index => defaultValues[index])
        return values
    })
        .forEach(record => table.push(record))
        if (table.length === 0) {
            console.log('Aucune monnaie ne correspond à votre recherche'.red)
        } else {
            console.log(`Data source from coinmarketcap.com at ${new Date().toLocaleTimeString()}`)
            console.log(table.toString())
            
        }
    })
    .catch(function (error) {
        spinner.stop()
        console.error('GROS BUG.'.red)
    })
