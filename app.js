window.addEventListener("DOMContentLoaded", () => obtenerLexemas());
const lexico = document.getElementById("datos");
const sintac = document.getElementById("aSintactico");
let codigo = document.getElementById("codigo");
let cCodigo = document.getElementById("container_codigo");
let lexemas;
let tokens = [];

/* obteniendo la informacion de la bd y pasandola a una variable local */
const obtenerLexemas = async () => {
  try {
    const rs = await fetch("./lexemas.json");
    const data = await rs.json();
    lexemas = data;
  } catch (error) {
    console.log(error);
  }
};

/* buscar palabra en lexemas */
function buscar(listaDePalabras) {
  let subTokens =[];
  /* recorrer la lista que nos pasan */
  listaDePalabras.forEach((palabra)=>{
    /* combrobar si la palabra se encuentra en la bd lexemas */
    lexemas.some((item)=> item.nombre == palabra)?
    lexemas.filter((item) => {
      if (item.nombre == palabra) {
        subTokens.push(item);
      }
    })
    /* combrobar si la palabra noencontrada no es un string vacio*/
    : comprobarPalabraNoEncontrada(palabra) !== undefined ?
      subTokens.push(comprobarPalabraNoEncontrada(palabra)):
      console.log('es un estring vacio')
      ;
  });
  tokens.push(subTokens);
  console.log(tokens);
  lexico.innerHTML=``;
  tokens.forEach(item=>{
    lexico.innerHTML+=`
      <tr>
      <td class='linea text-body-1' colspan='3'>
      Linea ${tokens.indexOf(item) + 1}
      </td>
      </tr>`
    item.forEach(item=>{
      lexico.innerHTML+=`
      <tr>
      <td class="text-body-1">
          ${item.nombre}
      </td>
      <td class="text-body-1">
        ${item.tipo}
      </td>
      <td class="text-body-1">
        ${item.codigo}
      </td>
    </tr>`;
    })
  })
}

/*  funcion que compara las palabras no encontradas*/
function comprobarPalabraNoEncontrada(palabra){
/*   console.log('No se encontro',palabra); */
  let temp;
  /* comprueba si no es un string vacio y no es un numero */
  if(palabra !== '' && isNaN(palabra)){
    temp = {
      nombre: palabra,
      tipo: "identificador",
      codigo: "101"
    }
  /* comprueba si no es un string vacio y si es un numero */
  }else if (palabra !== '' && !isNaN(palabra)){
    temp = {
      nombre: palabra,
      tipo: "numero",
      codigo: "102"
    }
  }
  return temp;
}

/* funcion que divide el texto en bloque de codigo */
function dividirBloque(cadenas){
  let bloques = cadenas.split(';\n')
  console.log('bloques', bloques);
  return bloques;
}

function comprobarCaso(bloques, lineas){
  let respuestas = [];
  let respuesta;
  let i=0;
  //Expresiones regulares
  const regexWhile =  /while\s*\(\s*[^)]+\s*\)\s*{[\s\S]*?}/;
  const regexFor = /^for\s*\(\s*([^;]*;){2}[^;]*\s*\)\s*\{.*\}\s*$/g
  const regexIf = /if\(\s*?\w+\s*?[=|==|<=|>=|===|!=|!==]+\s*?\w+\s*?\){\s?(.*\s*?)*};?/g;
  const regexVar = /^(var|let|const)\s+[a-zA-Z_$][\w$]*(\s*=\s*.+)?;\s*/g;

  bloques.forEach(item=>{
    item.startsWith('while')?
      item.match(regexWhile)?
      respuesta =[i+1,'Compila correctamente el ciclo while']:
      respuesta =[i+1,errorAgrupacion(item, bloques)]
    : item.startsWith('for')?
      item.match(regexFor)?
      respuesta =[i+1,'Compila correctamente el ciclo for']:
      respuesta =[i+1, errorAgrupacion(item, bloques)]
    : item.startsWith('if')?
      item.match(regexIf)?
        respuesta =[i+1,'Compila correctamente el if']:
        respuesta =[i+1,errorAgrupacion(item, bloques)]
    : item.startsWith('const') |item.startsWith('var') |item.startsWith('let')?
        item.match(regexVar)?
        respuesta =[i+1,'Compila correctamente la declaración de variable']:
        respuesta =[i+1, errorAsignacion(item, bloques)]
    :item.match(/\w+\s?=\s?\w+;?\s?/g)?
        respuesta =[i+1,'se inicializo correctamente']
    :respuesta =[i+1,'Error! Se espera una palabra reservada']
    respuestas.push(respuesta);
    console.log('respuestas', respuestas);
    i++;
  })
  sintac.innerHTML=``;
  respuestas.forEach(item=>{
    sintac.innerHTML+=`
    <p class='text-body-1'>
    Bloque de codigo ${item[0]}, linea ${item[0]}
    </p>
    <p class='text-body-1'>
    ${item[1]}
    </p>
    `;
  })
}

function errorAgrupacion(item, bloques){
  const regex = /\((\s*\w+\s*[<>=!]=*\s*\w+\s*)\)/g;
  const bloque = bloques.indexOf(item)+1;
  return !item.includes('(') ? `Error! Se espera un signo de agrupación, falta parentesis de apertura '(', bloque ${bloque}` :
  !item.includes(')') ? `Error! Se espera un signo de agrupación, falta parentesis de cierre ')', bloque ${bloque}` :
  !item.match(regex) ? `Error! Se espera un operador validos en la expresion` : 
  !item.includes('{') ? `Error! Se espera un signo de agrupación, falta llave de apertura '{'` : 
  !item.includes('}') ? `Error! Se espera un signo de agrupación, falta llave de cierre '}'` : 
  !item.includes(';') ? `Error! Falta simbolo de cierre: ;` : `Error! El bloque de codigo ${bloques.indexOf(item)+1} es incorrecta`
}

function errorAsignacion(item, bloques) {
  return !item.includes(';') ? `Falta simbolo de cierre ;` : `El bloque de codigo ${bloques.indexOf(item)+1} es incorrecta`
}
/* funcion que divide el texto en lineas */
function dividirLineas(cadenas){
  let listDeCadenas = cadenas.split(/\n/g);
console.log('listDeCadenas', listDeCadenas); 
  return listDeCadenas;
}
/* funcion que divide el texto en palabras y luego las busca en la bd lexemas */
function dividirPalabras(cadenas){
  /* recorremos las lineas */
  cadenas.forEach((cadena)=>{
    /* en cada linea separamos los simbolos*/
    cadena = cadena.replace(';',' ;');
    cadena = cadena.replace('=',' =');
    cadena = cadena.replace('+',' +');
    cadena = cadena.replace('.',' . ');
    cadena = cadena.replace('(',' ( ');
    cadena = cadena.replace(')',' ) ');
/*     console.log(cadena) */
  /* separamos cada linea por los espacios */
  let listaDePalabras = cadena.split(/\s/g);
  /*     console.log(listaDePalabras); */
  /* buscamos cada parabra */
  buscar(listaDePalabras);
  });
}
/* agregando la accion al form */
cCodigo.addEventListener('submit', event=>{
  event.preventDefault();
  tokens=[];
  dividirPalabras(dividirLineas(codigo.value));
  comprobarCaso(dividirBloque(codigo.value), dividirLineas(codigo.value) );
  /*   dividirLineas() */
})
cCodigo.addEventListener('reset', event=>{
  lexico.innerHTML=``;
  sintac.innerHTML=``;
})