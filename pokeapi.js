const BASE_URL = "https://pokeapi.co/api/v2/";
const cries_URL = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/";
const showCaseRef = document.getElementById("showcase");
const dialogRef = document.getElementById("dialog");
const dialogContainerRef = document.getElementById("dialogContainer");
const spinner = document.getElementById("spinner");
const loadBtn = document.getElementById("loadBtn");
const inputRef = document.getElementById('input');
const body = document.body;
//Current start and end of the page. After an click on the loadMorePokemon() button. It will raise to 21.
let currentStart = 1;
let PAGE_SIZE = 20;

async function loadData() {
  const response = await fetch(BASE_URL);
  const data = await response.json();
  return data;
}

//Returns an Array with the types of a pokemon.
async function getPokemonType(index){
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${index}/`);
  const data = await response.json();
  let typesArray = [];
  for (let i = 0; i < data.types.length; i++) {
    typesArray.push(capitalizeFirstLetter(data.types[i].type.name));
  }
  return typesArray;
}

//Returns the url of the pokemon.
async function getPokemonUrl(index){
  let url = await fetch(`https://pokeapi.co/api/v2/pokemon/${index}/`);
  let data = await url.json();
  let response = [];
  let typesArray = data.types;
  for(let i= 0; i< typesArray.length; i++){
  response.push(typesArray[i].type.url);
  }
  return response;
}

//Returns the typesymbol of the pokemon
async function getPokemonTypeSymbol(index){
  let url = [];
  let symbolArray = [];
  let symbolImg;
  url = await getPokemonUrl(index);
  for(let i=0; i<url.length; i++){
    let data = await fetch(url[i]);
    let response = await data.json();
    symbolImg = response.sprites["generation-ix"]["scarlet-violet"].symbol_icon;
    symbolArray.push(symbolImg);
  }
  return symbolArray;
}
 
//Defines the backgroundcolor of the pokemon depending on the type.
const typeColors = {
  Normal: "#A8A878",
  Fire: "#F08030",
  Water: "#6890F0",
  Grass: "#78C850",
  Electric: "#F8D030",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
  Ground: "#E0C068",
  Flying: "#A890F0",
  Psychic: "#F85888",
  Bug: "#A8B820",
  Rock: "#B8A038",
  Ghost: "#705898",
  Dragon: "#7038F8",
  Dark: "#705848",
  Steel: "#B8B8D0",
  Fairy: "#EE99AC"
}

//Checks the type of the pokemon and then sets the background-color depending on the type.
 async function checkType(index, prefix = "") {
  let typesArray = await getPokemonType(index);
  let element = document.getElementById(prefix + index);
  if (!element) return;
  if (typesArray.length === 1) {
    element.style.backgroundColor = typeColors[typesArray[0]];
     element.style.cursor = "pointer";
  } else if (typesArray.length === 2) {
    let color1 = typeColors[typesArray[0]];
    let color2 = typeColors[typesArray[1]];
   element.style.background = `radial-gradient(circle, ${color1} 20%, ${color2} 80%)`;
   element.style.cursor = "pointer";
  }
}

//Returns the cries of the pokemon.
function getPokemonCries(index){
  return cries_URL + index + ".ogg";
}

async function getPokemonImg(index){
  let res = await fetch(`https://pokeapi.co/api/v2/pokemon-form/${index}/`);
  const data = await res.json();
  // let data = await getPokemonImg(index);
    let img = data.sprites.versions["generation-viii"]["brilliant-diamond-shining-pearl"]
    .front_default;
    return img;
}

//Returns the first 3 stats of the pokemon.
async function getStats(index){
  let text = "";
  let res = await fetch(BASE_URL + "pokemon" + `/${index}`);
  let data =  await res.json();
  for(let i=0; i<3; i++){
    let property = data.stats[i].stat.name;
    let value = data.stats[i].base_stat;
      text += property + ": " + value + "<br>";
  }
  return text
}

//Render function for the pokemon in the grid-container.
async function renderPokemon(index, types, name){
   showCaseRef.innerHTML += `
          <div id="${index}" class="pokemon">
          <img loading="lazy"
          src="${await getPokemonImg(index)}"
          class="img" 
          onclick="openDialog(${index})">
          <p>${await loadPokemonName(index)}</p>
          <p>Type: ${types.join(", ")}
          </div>
        `;
}

//Returns an array with all the Pokemonnames.
async function getAllPokemon(){
  let pokeNames = [];
  let pokeIndexes = [];
  for(let i=1; i<= 150; i++){
    let names = await loadPokemonName(i);
    pokeNames.push(names);
  }
   return pokeNames;
}

//Filters the Pokemon in order to the search value. Will return the indexes of the matching pokemons.
function filterPokemon(arr, search) {
  return arr.reduce((acc, pokemon, index) => {
    if (pokemon.includes(search)) {
      acc.push(index + 1);
    }
    return acc;
  }, []);
}

//Used to search for the Pokemon in the header. Renders the Pokemon based on the matches from filterPokemon().
async function searchPokemon(id) {
  showLoadingSpinner();
  const query = document.getElementById(id).value.trim();
  if(query.length <3){
    alert("3 Chars requiered for Search.");
    showCaseRef.innerHTML = "";
    removeLoadingSpinner();
    return;
  }
  else{
  if (!query) return await loadPokemon(1, 20);
  await renderSearch(query);
}
}
async function renderSearch(query){
  const pokeSearch = query.charAt(0).toUpperCase() + query.slice(1);
  const pokemon = await getAllPokemon();
  const pokeIndexes = filterPokemon(pokemon, pokeSearch).slice(0, 14);
  for (const index of pokeIndexes) {
    const types = await getPokemonType(index);
    const name = await loadPokemonName(index);
    await renderPokemon(index, types, name);
    removeLoadingSpinner();
    await checkType(index);
  }
}

function showLoadingSpinner(){
  spinner.classList.remove("hidden");
  loadBtn.disabled = true;
}

function removeLoadingSpinner(){
  spinner.classList.add("hidden");
  loadBtn.disabled = false;
}

//Loads Pokemon into the mainpage till 150 pokemon.
async function loadPokemon(start, stop) {
  inputRef.value = "";
  showLoadingSpinner();
  try {
    for (let index = start; index <= stop; index++) {
      if (index <= 150) {
        let types = await getPokemonType(index);
        const name = await loadPokemonName(index);
        await renderPokemon(index, types, name);
        await checkType(index);
      }}
  }finally {
   removeLoadingSpinner();
  }
}

//Returns the Name of the Pokemon with the first Letter written in Uppercase.
async function loadPokemonName(index){
  let BASE_URL = `https://pokeapi.co/api/v2/pokemon/`;
     let response = await fetch(BASE_URL + index);
     let data = await response.json();
     return capitalizeFirstLetter(data.name);
  }
async function resetPokemon(start, stop){
  showCaseRef.innerHTML = "";
  currentStart = 1;
  PAGE_SIZE = 20;
  await loadPokemon(start, stop);
  if(stop >= 150){
    loadBtn.style.display = "none";
  } 
  start = currentStart;
  currentStart += PAGE_SIZE;
}
//Invoked through the button on the bottom of the website. Renders 20 more Pokemon.
async function loadMorePokemon() {
  let start = currentStart;
  let stop = currentStart + PAGE_SIZE - 1;
  await loadPokemon(start, stop);
  currentStart += PAGE_SIZE;
  if(stop >= 150){
    loadBtn.style.display = "none";
  } 
}

//Renders the starting page right at the beginning.
async function start() {
  await loadMorePokemon();
}

// start();

//Returns the Moves of the Pokemon.
async function getMoves(index){
  const movesArray = [];
   const BASE_URL = "https://pokeapi.co/api/v2/pokemon/";
   const response = await fetch(BASE_URL + index + "/");
   const data = await response.json();
   let moves = "";
   for(let i = 0; i< 3; i++){
    moves = data.moves[i].move.name;
    movesArray.push(moves);
   }
  return movesArray;
}

//Sets the first Char to Uppercase and then adds the rest of the string.
function capitalizeFirstLetter(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

//Renders the Typesymbols of the Pokemon.
async function renderTypeSymbols(index, typeSymbols){
  if(typeSymbols.length >1){
    html = `
   <img  class="typeImg" src="${typeSymbols[0]}">
   <img  class="typeImg" src="${typeSymbols[1]}">
   `
  }
  else{
    html = `
   <img  class="typeImg" src="${typeSymbols[0]}">`
  }
  return html;
}

//Renders the dialog.
async function renderDialog(index, types, html){
  const response = await fetch(BASE_URL + "pokemon/" + index);
  const data = await response.json();
  dialogContainerRef.innerHTML += `
  <div id="${index}" class="relative">
  <img src="${await getPokemonImg(index)}" id="${('a-' + index)}" class="dialogImg")"> <p>Name: ${await loadPokemonName(index)}</p> <p>Type: ${types.join(", ")}
  <div class="inline"> ${html} </div></p> 
  <p>Stats:<br> ${await getStats(index)}</p></div>
   <button class="leftBtn" onclick="openDialog(${index-1})"><< </button>
  <button class="btn" onclick="openDialog(${index+1})">>></button>
    <audio id="cryAudio" autoplay>
      <source src="${getPokemonCries(index)}" type="audio/ogg">
    </audio> `
}

//Opens the dialog.
  async function openDialog(index){
    showLoadingSpinner();
    dialogContainerRef.innerHTML = "";
    body.classList.add('no-scroll');
    // count = index;
    let typeSymbols = await getPokemonTypeSymbol(index);
    let html = await renderTypeSymbols(index, typeSymbols);
    const BASE_URL = "https://pokeapi.co/api/v2/";
    let types = await getPokemonType(index);
    dialogRef.showModal();
    dialogRef.classList.add("flex");
    await renderDialog(index, types, html);
    removeLoadingSpinner();
    checkType(index);
    return index;
  }
 
function closeDialogWith(event) {
  dialogRef.close();
  dialogRef.innerHTML = ""; 
}

//Closes the dialog
function closeDialog(){
  dialogRef.close();
  dialogRef.classList.remove("flex");
  body.classList.remove('no-scroll');
  dialogContainerRef.innerHTML = "";
}


function toUpper(array){
  let myArray = [];
  array.forEach((element, i) =>{
    myArray.push(element.charAt(0).toUpperCase() + element.slice(1));
  });
  return myArray
}
