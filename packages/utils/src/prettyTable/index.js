class PrettyTable {
    constructor() {
        this.table = {
            ...this.getInitialTable()
        }
    }

    fieldNames = (names) => {
        this.table.columnNames = names
        for (let i = 0; i < names.length; i++) {
            this.table.maxWidth.push(names[i].length)
        }
    }

    addRow = (row) => {
        this.table.rows.push(row)
        for (let i = 0; i < row.length; i++) {
            if (row[i].toString().length > this.table.maxWidth[i]) {
                this.table.maxWidth[i] = row[i].toString().length
            }
        }
    }

    create = (headers, rows) => {
        this.fieldNames(headers)

        for (let i = 0; i < rows.length; i++) {
            this.addRow(rows[i])
        }
    }

    toString = () => {
        let finalTable = ''
        let columnString = '| '
        let rowString = ''
        let lengthDifference = ''

        let drawLine = function (table) {
            let finalLine = '+'
            for (let i = 0; i < table.maxWidth.length; i++) {
                finalLine += Array(table.maxWidth[i] + 3).join('-') + '+'
            }
            return finalLine
        }

        if (this.table.columnNames.length === 0) {
            return finalTable
        }

        for (let i = 0; i < this.table.columnNames.length; i++) {
            columnString += this.table.columnNames[i]
            if (this.table.columnNames[i].length < this.table.maxWidth[i]) {
                lengthDifference = this.table.maxWidth[i] - this.table.columnNames[i].length
                columnString += Array(lengthDifference + 1).join(' ')
            }
            columnString += ' | '
        }
        finalTable += drawLine(this.table) + '\n'
        finalTable += columnString + '\n'
        finalTable += drawLine(this.table) + '\n'

        for (let i = 0; i < this.table.rows.length; i++) {
            let tempRowString = '| '
            for (let k = 0; k < this.table.rows[i].length; k++) {
                tempRowString += this.table.rows[i][k]
                if (this.table.rows[i][k].toString().length < this.table.maxWidth[k]) {
                    lengthDifference = this.table.maxWidth[k] - this.table.rows[i][k].toString().length
                    tempRowString += Array(lengthDifference + 1).join(' ')
                }
                tempRowString += ' | '
            }
            rowString += tempRowString + '\n'
        }

        rowString = rowString.slice(0, -1)
        finalTable += rowString + '\n'
        finalTable += drawLine(this.table) + '\n'
        return finalTable
    }

    print = () => {
        console.log(this.toString())
    }

    html = (attributes) => {
        let htmlTable = '';
        if (typeof attributes == 'undefined') {
            htmlTable = '<table>'
        }
        else {
            let attributeList = []
            for (let key in attributes) {
                attributeList.push(key + '=\'' + attributes[key] + '\'')
            }
            let attributeString = attributeList.join(' ')
            htmlTable = '<table ' + attributeString + '>'
        }

        let tableHead = '<thead><tr>'
        for (let i = 0; i < this.table.columnNames.length; i++) {
            let headerString = '<th>' + this.table.columnNames[i] + '</th>'
            tableHead += headerString
        }
        tableHead += '</tr></thead>'
        htmlTable += tableHead

        let tableBody = '<tbody>'
        for (i = 0; i < this.table.rows.length; i++) {
            let rowData = '<tr>'
            for (let k = 0; k < this.table.rows[i].length; k++) {
                let cellData = '<td>' + this.table.rows[i][k] + '</td>'
                rowData += cellData
            }
            rowData += '</tr>'
            tableBody += rowData
        }

        tableBody += '</tbody>'
        htmlTable += tableBody
        htmlTable += '</table>'

        return htmlTable
    }

    sortTable = (colname, reverse) => {
        let colindex = this.table.columnNames.indexOf(colname)

        let Comparator = function (a, b) {
            if (typeof reverse === 'boolean' && reverse === true) {
                if (a[colindex] < b[colindex]) {
                    return 1
                }
                else if (a[colindex] > b[colindex]) {
                    return -1
                }
                else {
                    return 0
                }
            }
            else {
                if (a[colindex] < b[colindex]) {
                    return -1
                }
                else if (a[colindex] > b[colindex]) {
                    return 1
                }
                else {
                    return 0
                }
            }
        }
        this.table.rows = this.table.rows.sort(Comparator)
    }

    deleteRow = (rownum) => {
        if (rownum <= this.table.rows.length && rownum > 0) {
            this.table.rows.splice(rownum - 1, 1)
        }
    }

    clearTable = () => {
        this.table.rows = []
    }

    deleteTable = () => {
        this.table = this.getInitialTable()
    }

    getInitialTable = () => {
        return {
            'columnNames': [],
            'rows': [],
            'maxWidth': []
        }
    }
}

export default PrettyTable