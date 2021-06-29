import fs from 'fs'
import parse from 'csv-parse/lib/sync'

var prettyTable = function () {
    this.table = {
        'columnNames': [],
        'rows': [],
        'maxWidth': []
    }
}

prettyTable.prototype.fieldNames = function (names) {
    this.table.columnNames = names
    for (var i = 0; i < names.length; i++) {
        this.table.maxWidth.push(names[i].length)
    }
}

prettyTable.prototype.addRow = function (row) {
    this.table.rows.push(row)
    for (var i = 0; i < row.length; i++) {
        if (row[i].toString().length > this.table.maxWidth[i]) {
            this.table.maxWidth[i] = row[i].toString().length
        }
    }
}

prettyTable.prototype.create = function (headers, rows) {
    this.fieldNames(headers)

    for (var i = 0; i < rows.length; i++) {
        this.addRow(rows[i])
    }
}

prettyTable.prototype.toString = function () {
    var finalTable = ''
    var columnString = '| '
    var rowString = ''
    var lengthDifference = ''

    var drawLine = function (table) {
        var finalLine = '+'
        for (var i = 0; i < table.maxWidth.length; i++) {
            finalLine += Array(table.maxWidth[i] + 3).join('-') + '+'
        }
        return finalLine
    }

    if (this.table.columnNames.length === 0) {
        return finalTable
    }

    for (var i = 0; i < this.table.columnNames.length; i++) {
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

    for (i = 0; i < this.table.rows.length; i++) {
        var tempRowString = '| '
        for (var k = 0; k < this.table.rows[i].length; k++) {
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

prettyTable.prototype.print = function () {
    console.log(this.toString())
}

prettyTable.prototype.html = function (attributes) {
    var htmlTable = '';
    if (typeof attributes == 'undefined') {
        htmlTable = '<table>'
    }
    else {
        var attributeList = []
        for (var key in attributes) {
            attributeList.push(key + '=\'' + attributes[key] + '\'')
        }
        var attributeString = attributeList.join(' ')
        htmlTable = '<table ' + attributeString + '>'
    }

    var tableHead = '<thead><tr>'
    for (var i = 0; i < this.table.columnNames.length; i++) {
        var headerString = '<th>' + this.table.columnNames[i] + '</th>'
        tableHead += headerString
    }
    tableHead += '</tr></thead>'
    htmlTable += tableHead

    var tableBody = '<tbody>'
    for (i = 0; i < this.table.rows.length; i++) {
        var rowData = '<tr>'
        for (var k = 0; k < this.table.rows[i].length; k++) {
            var cellData = '<td>' + this.table.rows[i][k] + '</td>'
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

prettyTable.prototype.csv = function (filename) {
    var csvdata = fs.readFileSync(filename, 'utf8')
    var records = parse(csvdata)

    var lineCounter = 0
    for (var i = 0; i < records.length; i++) {
        if (lineCounter === 0) {
            this.fieldNames(records[i])
            lineCounter += 1
        }
        else {
            this.addRow(records[i])
            lineCounter += 1
        }
    }
}

prettyTable.prototype.json = function (filename) {
    var rowKeys = ''
    var rowVals = ''
    var jsondata = JSON.parse(fs.readFileSync(filename, 'utf8'))
    for (var i = 0; i < jsondata.length; i++) {
        rowKeys = Object.keys(jsondata[i])
        rowVals = []
        for (var k = 0; k < rowKeys.length; k++) {
            rowVals.push(jsondata[i][rowKeys[k]])
        }
        if (this.table.columnNames.length === 0) {
            this.fieldNames(rowKeys)
        }
        this.addRow(rowVals)
    }
};

prettyTable.prototype.sortTable = function (colname, reverse) {
    var colindex = this.table.columnNames.indexOf(colname)

    var Comparator = function (a, b) {
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

prettyTable.prototype.deleteRow = function (rownum) {
    if (rownum <= this.table.rows.length && rownum > 0) {
        this.table.rows.splice(rownum - 1, 1)
    }
}

prettyTable.prototype.clearTable = function () {
    this.table.rows = []
}

prettyTable.prototype.deleteTable = function () {
    this.table = {
        'columnNames': [],
        'rows': [],
        'maxWidth': []
    }
}

export default prettyTable