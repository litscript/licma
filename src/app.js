import fs from 'fs'
import yargs from 'yargs'

var arg = yargs.argv
var code = ""

console.log('LICMA')

if(arg._.length > 0)
{
    let filePath = process.cwd() + '/' + arg._[0]
    if(fs.existsSync(filepath))
    {
        code = fs.readFileSync().toString('utf8')
        compile(code)
    }
    else console.log('ERROR: File not found')
}
else
{
    console.log('ERROR: No File Specified')
}

function tokenize(input) {
    var tokens = []
    var i = 0
    var WHITESPACE = /\s/
    var CHAR = /\w/
    var NUMBER = /\d\./
    while (i < input.length) {
        var current = input[i]
        if (WHITESPACE.test(current)) {
            i++
            continue
        }
        if (current == '.') {
            tokens.push({
                type: 'DOT',
                text: '.'
            })
            i++
            continue
        }
        if (current == '\'') {
            let keyword = ''
            let temp = input[++i]
            while (temp != '\'') {
                keyword += temp
                temp = input[++i]
            }
            tokens.push({
                type: 'STRING',
                text: keyword
            })
            i++
            continue
        }
        if (NUMBER.test(current)) {
            let keyword = ""
            let temp = current
            while (CHAR.test(temp)) {
                keyword += temp
                temp = input[++i]
            }
            tokens.push({
                type: 'NUMBER',
                text: keyword
            })
            continue
        }
        if (CHAR.test(current)) {
            let keyword = ""
            let temp = current
            while (CHAR.test(temp)) {
                keyword += temp
                temp = input[++i]
            }
            tokens.push({
                type: 'KEYWORD',
                text: keyword
            })
            continue
        }
        if (current == '(' || current == ')') {
            tokens.push({
                type: 'PARENTHESES',
                text: current
            })
            i++
            continue
        }
        if (current == '{' || current == '}') {
            tokens.push({
                type: 'BRACKET',
                text: current
            })
            i++
            continue
        }

        else i++

    }
    return tokens
}

function parse(tokens) {
    var semiAst = []
    var current = 0
    var data = /^(f|txt|num|s)$/
    while (current < tokens.length) {
        var token = tokens[current]
        if (token.type == 'KEYWORD') {
            if (token.text == 'use') {
                var inner = tokens[++current]
                if (inner.type == 'STRING')
                    semiAst.push({
                        type: 'PackageImport',
                        value: inner.text
                    })
            }
            else if (token.text == 'p' || token.text == 'pv' || token.text == 'pr') {
                var access = 'private'
                var isStatic = false
                var name
                var type
                if (token.text == 'p') access = 'public'
                else if (token.text == 'pv') access = 'private'
                else if (token.text == 'pr') access = 'protected'
                var inner = tokens[++current]
                while (inner.type != 'PARENTHESES') {
                    if (inner.text == 's') {
                        isStatic = true
                        inner = tokens[++current]
                    }
                    if (data.test(inner.text)) {
                        type = inner.text
                        inner = tokens[++current]
                    }
                    else {
                        name = inner.text
                        break
                    }
                }
                semiAst.push({
                    type: 'Declaration',
                    value: {
                        name,
                        access,
                        isStatic,
                        type
                    }
                })
            }
            else if (data.test(token.text)) {
                var access = 'private'
                var isStatic = false
                var type = null
                var name
                if (token.text == 's')
                    isStatic = true
                else
                    type = token.text
                var inner = tokens[++current]
                while (!data.test(inner.type) && inner.text != 'is') {
                    if (data.test(inner.text)) {
                        type = inner.text
                        inner = tokens[++current]
                    }
                    else {
                        name = inner.text
                        break
                    }
                }
                semiAst.push({
                    type: 'Declaration',
                    value: {
                        name,
                        access,
                        isStatic,
                        type
                    }
                })
            }
            else if (token.text == 'is') {
                var inner = tokens[++current]
                semiAst.push({
                    type: 'Assignment',
                    value: inner.text
                })
            }
            else{
                semiAst.push({
                    type: 'Member',
                    value: token.text
                })
            }
            current++
            continue
        }
        if (token.type == 'BRACKET') {
            var value
            if (token.text == '{') value = 'BodyStart'
            if (token.text == '}') value = 'BodyEnd'
            semiAst.push({
                type: 'Body',
                value
            })
            current++
            continue
        }
        if (token.type == 'PARENTHESES') {
            var value
            if (token.text == '(') value = 'ParamStart'
            if (token.text == ')') value = 'ParamEnd'
            semiAst.push({
                type: 'Param',
                value
            })
            current++
            continue
        }
        if(token.type == 'STRING')
        {
            semiAst.push({
                type: 'String',
                value: token.text
            })
            current++
            continue
        }
        if(token.type == 'DOT')
        {
            semiAst.push({
                type: 'Dot',
                value: token.text
            })
            current++
            continue
        }
        else current++
    }
    return semiAst
}

function transform(semiAst)
{
    var ast = {}
}

function generator(ast)
{
    var i = 0
    var code = ""
    while(i < ast.length)
    {
        var current = ast[i]
        if(current.type == 'PackageImport')
        {
            code+=`import ${current.value} from '${current.value}'\n`
            i++
            continue
        }
        if(current.type == 'Declaration')
        {
            if(current.value.type == 'f') code += 'function'
            else code += 'var'
            code += ` ${current.value.name}`
            let lookup = ast[++i]
            if(lookup.type == 'Assignment')
            {
                code += ' = '
                if(current.value.type == 'txt') code += `'${lookup.value}'`
                else code += lookup.value
            }
            if(lookup.type != 'Param')
                code+='\n'
            continue
        }
        if(current.type == 'Param')
        {
            if(current.value == 'ParamStart') code+='('
            if(current.value == 'ParamEnd') code+=')'
            i++
            continue
        }
        if(current.type == 'Body')
        {
            if(current.value == 'BodyStart') code+='{\n'
            if(current.value == 'BodyEnd') code+='\n}'
            i++
            continue
        }
        if(current.type == 'Member')
        {
            code += current.value
            i++
            continue
        }
        if(current.type == 'Dot')
        {
            code += current.value
            i++
            continue
        }
        if(current.type == 'String')
        {
            code += `'${current.value}'`
            i++
            continue
        }
        else i++
    }
    console.log(code)
    return code
}

function compile(code)
{
    var tokens = tokenize(code)
    var ast = parse(tokens)
    var generated = generator(ast)
}