import { generateCode } from 'file:///D:/Code/DSH-Postapi/src/host/codegen.js'
const endpoint = { method:'GET', url:'/users/{id}', params:[{key:'verbose',value:'false',enabled:true}], headers:[{key:'X-Token',value:'tk',enabled:true}], body:{type:'json',content:'{"a":1}'}, auth:{type:'bearer',token:'tk_bearer'} }
const env = { baseUrl:'https://api.example.com/v1' }
for (const lang of ['curl','fetch','axios','python','go','java','php','csharp']) {
  console.log('=== ' + lang + ' ===')
  console.log(generateCode({ endpoint, env, lang }))
  console.log()
}
console.log('=== empty fetch ===')
console.log(JSON.stringify(generateCode({ endpoint: {}, lang: 'fetch' })))
