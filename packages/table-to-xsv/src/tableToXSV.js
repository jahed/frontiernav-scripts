const cheerio = require('cheerio')

function tableToXSV({ separator }) {
    return html => {
        const $ = cheerio.load(html)
        const table = $('table')
        return table.find('tr')
            .get()
            .map(row => $(row)
                .find('th, td')
                .get())
            .map(columns => columns
                .map(column => $(column)
                    .text())
                .map(text => text.replace(/"/g, '""'))
                .map(text => `"${text}"`)
                .join(separator)
            )
            .join('\n')
    }
}

module.exports = tableToXSV