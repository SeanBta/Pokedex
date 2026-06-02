const BASE_URL = "https://pokeapi.co/api/v2/";
const cries_URL = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/";
const showCaseRef = document.getElementById("showcase");
const dialogRef = document.getElementById("dialog");
const dialogContainerRef = document.getElementById("dialogContainer");
const spinner = document.getElementById("spinner");
const loadBtn = document.getElementById("loadBtn");
const inputRef = document.getElementById('input');
const pokemonContainerRef = document.getElementById('pokemonContainerRef');
const body = document.body;
//Hier werden die bereits von der API abgerufenen Daten gespeichert.
let pokemonMemoryCache = {};
//Used to push all the Pokemon names in.
let pokeNames = [];
let pokeIndexes = [];
//Current start, pagesize and end of the page. After an click on the loadMorePokemon() button. It will raise currenStart by 20 and dialogStop by 20 each time.
let currentStart = 1;
let PAGE_SIZE = 20;
let dialogStop = 20;
//Used for the search dialog to switch between the pokemon that matched the search.
let filteredNumbers = [];

async function searchForPokemon(search) {
  showCaseRef.innerHTML = "";
  filteredNumbers = [];
  dialogContainer = [];
  if(search.length < 3){
  openError();
  loadBtn.style.display = "none";
  return;
  }
  showLoadingSpinner();
  const searchedName = search.charAt(0).toUpperCase() + search.slice(1);
  // Filter
  let filtered = pokeNames.filter((name, index) =>
    name.includes(searchedName) ||
  name.includes(search)
  );
  const numbers = [];
  for(let i=0; i<filtered.length; i++){
   numbers.push(filtered[i].replace(/\D/g, ""));
  }
  filteredNumbers = filtered.map(item =>
  Number(item.replace(/\D/g, ""))
);
  numbers.forEach(number => renderPokemon(number));
  removeLoadingSpinner();
  return filtered;
}

//Used to search for the Pokemon in the header.
async function searchPokemon(id) {
  showLoadingSpinner();
  const query = document.getElementById(id).value.trim();
  if(query.length <3){
    openError();
    showCaseRef.innerHTML = "";
    removeLoadingSpinner();
    return;
  }
  else{
  if (!query) return await loadPokemon(1, 20);
  await renderSearch(query);
  }
}

async function getAllPokemon(){
  for (let i = 1; i <= 150; i++) {
    const data = await getTestData(i);
    pokeNames.push(data.name + data.index);
    // pokeIndexes.push(data.index);
    // return [data.name, data.index];
  }
}

//Used to search for the Pokemon in the header.
async function searchPokemon(id) {
  showLoadingSpinner();
  const query = document.getElementById(id).value.trim();
  if(query.length <3){
    openError();
    showCaseRef.innerHTML = "";
    removeLoadingSpinner();
    return;
  }
  else{
  if (!query) return await loadPokemon(1, 20);
  await renderSearch(query);
  }
}
//Renders the Pokemon which match the search.
async function renderSearch(query){
  showLoadingSpinner();
  loadBtn.style.display = "none";
  showCaseRef.innerHTML = "";
  const pokeSearch = query.charAt(0).toUpperCase() + query.slice(1);
  const pokemon = await getAllPokemon();
  const pokeIndexes = filterPokemon(pokemon, pokeSearch).slice(0, 14);
  pokeIndexes.map((pokemon) =>{renderPokemon(pokemon)});
     if(pokeIndexes.length == 0){
        showCaseRef.innerHTML += `<div class="flex" style="position: relative; top: 20%; left: 100%;"><p>No matches found! Try again.</p></div>`
        removeLoadingSpinner();
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

async function returnFetch(prefix, index){
  let response = await fetch(BASE_URL + prefix + index);
  return response;
}

//Returns the Name of the Pokemon with the first Letter written in Uppercase.
async function loadPokemonName(index){
    let response = await returnFetch('pokemon/', index);
    let data = await response.json();
    return capitalizeFirstLetter(data.name);
}

async function resetPokemon(){
  showCaseRef.innerHTML = "";
 loadPokemon(1,20);
  currentStart = 1;
  dialogStop = 20;
  loadBtn.style.display = "block";
 
}

//Invoked through the button on the bottom of the website. Renders 20 more Pokemon.
async function loadMorePokemon() {
  currentStart += PAGE_SIZE;
  let start = currentStart;
  let stop = currentStart + PAGE_SIZE - 1;
  dialogStop = stop;
  await loadPokemon(start, stop);
  if(stop >= 150){
    loadBtn.style.display = "none";
  } 
}

//Sets the first Char to Uppercase and then adds the rest of the string.
function capitalizeFirstLetter(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

//Closes the dialog
function closeDialog(){
  dialogRef.close();
  dialogRef.classList.remove("flex");
  body.classList.remove('no-scroll');
  dialogContainerRef.innerHTML = "";
}

//Returns the url of the pokemon type.
async function getPokemonUrl(data){
  let response = [];
  let typesArray = data.types;
  for(let i=0; i<typesArray.length; i++){
    response.push(typesArray[i].type.url);
  }
  return response;
}

async function getTestData(index) {
  //  // 1. RAM Cache prüfen
  // if (pokemonMemoryCache[index]) {
  //   console.log("Aus Memory Cache");
  //   return pokemonMemoryCache[index];
  // }
  const url = `https://pokeapi.co/api/v2/pokemon/${index}/`;
  // Open Cache
  const cache = await caches.open("pokemon-cache");
  // Check if the response of the Cache is already existing.
  const cachedResponse = await cache.match(url);
  //If the url is already existing in the cache, it will be used.
  if (cachedResponse) {
    // console.log("Loaded from Cache");
    const cachedData = await cachedResponse.json();
    return await getData(cachedData, index);
  }
   //Else it will do a regular fetch
   else{
    return await regularFetch(cache, url, index);
   }
}

async function regularFetch(cache, url, index){
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Fehler beim Fetch");
    }
    //The response needs to be cloned, since it can only be read once.
    await cache.put(url, response.clone());
    console.log("Neu von API geladen");
    const data = await response.json();
    return await getData(data, index);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getPokemonSymbolImg(urls) {
  const cache = await caches.open("pokemon-cache");

  return Promise.all(
    urls.map(async (url) => {
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const data = await cachedResponse.json();
        return data.sprites["generation-ix"]["scarlet-violet"].symbol_icon;
      }

      const response = await fetch(url);
      await cache.put(url, response.clone());

      const data = await response.json();
      return data.sprites["generation-ix"]["scarlet-violet"].symbol_icon;
    })
  );
}

async function getData(data, index){
  const name = data.name[0].toUpperCase() + data.name.slice(1);
  let img = data.sprites.versions["generation-viii"]["brilliant-diamond-shining-pearl"]
  .front_default;
  let typesArray = [];
  data.types.map((t) => typesArray.push(t.type.name[0].toUpperCase() + t.type.name.slice(1)) );
  let stats = data.stats.map((stat, index) => (data.stats[index].stat.name + ": " + data.stats[index].base_stat));
  let url = await getPokemonUrl(data);
  let symbolArray = await getPokemonSymbolImg(url);
  return {name, img, typesArray, stats, index, symbolArray};
}

//Helper function to call the render function.
function init(){
 loadPokemon(1,20);
 getAllPokemon();
}

init();

//Basic loading function for rendering the Pokemon.
async function loadPokemon(start, stop) {
  inputRef.value = "";
  showLoadingSpinner();
  try {
    let promises = [];
    for (let index = start; index <= stop; index++) {
      if (index <= 150) {
        promises.push(getTestData(index));
      }}
  // showCaseRef.innerHTML += await renderPoke(promises);
  const allPokemon = await Promise.all(promises);
  const html = allPokemon.map(p => createPokemonHTML(p)).join("");
  showCaseRef.innerHTML += html;
  } catch (error) {
    console.log(error);
  } finally {
    removeLoadingSpinner();
  }
}

//Returns the html to render the pokemon
async function renderPoke(promises){
  const allPokemon = await Promise.all(promises);
  const html = allPokemon.map(p => createPokemonHTML(p)).join("");
  return html;
}

//Renders the single Pokemons. Used for searchPokemon().
async function renderPokemon(index) {
  inputRef.value = "";
  loadBtn.style.display = "none";
  let allPokemon = [];
  showLoadingSpinner();
   let promises = [];
  try {
    promises.push(getTestData(index));
    allPokemon = await Promise.all(promises);
  } catch (error) {
    console.log(error);
  } finally {
    const html = allPokemon.map(p => createPokemonHTML2(p)).join("");
    showCaseRef.innerHTML += html;
    removeLoadingSpinner();
  }
}

//Sets the background-color via css classes, depending on the types of the pokemon.
function getTypeClass(types) {
  if (types.length === 1) {
    return types[0].toLowerCase();
  }

  if (types.length === 2) {
    return `dual-${types[0].toLowerCase()}-${types[1].toLowerCase()}`;
  }

  return "";
}

//Renders the data for each Pokemon.
function createPokemonHTML(data){
  const typeClass = getTypeClass(data.typesArray);
  return `
    <div id="${data.index}" onclick="openDialog(${data.index})" class="pokemon ${typeClass}">
      <img loading="lazy" src="${data.img}" class="img">
      <p>${data.name}</p>
      <p>Type: ${data.typesArray.join(", ")}</p>
    </div>
  `;
}

function createPokemonHTML2(data){
  const typeClass = getTypeClass(data.typesArray);
  return `
    <div id="${data.index}" onclick="openSearchDialog(${data.index})" class="pokemon ${typeClass}">
      <img loading="lazy" src="${data.img}" class="img">
      <p>${data.name}</p>
      <p>Type: ${data.typesArray.join(", ")}</p>
    </div>
  `;
}

//Renders the dialog.
async function renderDialog(data){
   const typeClass = getTypeClass(data.typesArray);
  return `
  <div id="${data.index}" class="relative ${typeClass}">
    <button class="leftBtn" onclick="dialogShowPreviousImg(${data.index})"><<</button>
    <button class="btn" onclick="dialogShowNextImg(${data.index})">>></button>
    <img src="${data.img}" class="dialogImg">
    <p>${data.name}<br>
    <div class="queryContainer">
      ${data.symbolArray.map((symbol) => `<img src="${symbol}" class="typeImg">`).join("")}
    </div>
    Type: ${data.typesArray.join(", ")}<br>
    ${data.stats[0]}<br>${data.stats[1]}<br>${data.stats[2]}
   </p>
   </div>`
}

async function renderDialogSearch(data){
   const typeClass = getTypeClass(data.typesArray);
   if(filteredNumbers.length >1){
  return `
  <div id="${data.index}" class="relative ${typeClass}">
    <button class="leftBtn" onclick="searchDialogShowPreviousImg(${data.index})"><<</button>
    <button class="btn" onclick="searchDialogShowNextImg(${data.index})">>></button>
    <img src="${data.img}" class="dialogImg">
    <p>${data.name}<br>
    <div class="queryContainer">
      ${data.symbolArray.map((symbol) => `<img src="${symbol}" class="typeImg">`).join("")}
    </div>
    Type: ${data.typesArray.join(", ")}<br>
    ${data.stats[0]}<br>${data.stats[1]}<br>${data.stats[2]}
   </p>
   </div>`
   }
   else{
     return `
  <div id="${data.index}" class="relative ${typeClass}">
    <img src="${data.img}" class="dialogImg">
    <p>${data.name}<br>
    <div class="queryContainer">
      ${data.symbolArray.map((symbol) => `<img src="${symbol}" class="typeImg">`).join("")}
    </div>
    Type: ${data.typesArray.join(", ")}<br>
    ${data.stats[0]}<br>${data.stats[1]}<br>${data.stats[2]}
   </p>
   </div>`
   }
}

//Opens the dialog.
async function openDialog(index){
  showLoadingSpinner();
    dialogContainerRef.innerHTML = "";
    dialogRef.showModal();
    const data = await getTestData(index);
    dialogRef.classList.add('dialog');
    document.body.classList.add('no-scroll');
    dialogContainerRef.innerHTML += await renderDialog(data);
    removeLoadingSpinner();
  }

  //Opens the dialog.
async function openSearchDialog(index){
  showLoadingSpinner();
    dialogContainerRef.innerHTML = "";
    dialogRef.showModal();
    const data = await getTestData(index);
    dialogRef.classList.add('dialog');
    document.body.classList.add('no-scroll');
    dialogContainerRef.innerHTML += await renderDialogSearch(data);
    removeLoadingSpinner();
  }

function dialogShowNextImg(index){
  if(index < 8){
    openPornDialog(index +1);
  }
  else{
    openPornDialog(1);
  }
}

function searchDialogShowNextImg(index) {
  const currentPos = filteredNumbers.indexOf(index);

  if (currentPos < filteredNumbers.length - 1) {
    openSearchDialog(filteredNumbers[currentPos + 1]);
  } else {
    openSearchDialog(filteredNumbers[0]);
  }
}

function dialogShowPreviousImg(index){
  if(index > 1){
    openPornDialog(index -1);
  }
  else{
    openPornDialog(8);
  }
}

function searchDialogShowPreviousImg(index) {
  const currentPos = filteredNumbers.indexOf(index);

  if (currentPos > 0) {
    openSearchDialog(filteredNumbers[currentPos - 1]);
  } else {
    openSearchDialog(filteredNumbers[filteredNumbers.length - 1]);
  }
}

function openError(){
  showCaseRef.innerHTML = "Error! At least 3 letters required for search!";
  showCaseRef.innerHTML += `<br><button onclick="resetPokemon()">Reset pokemon</button>`;
  dialogRef.showModal();
}