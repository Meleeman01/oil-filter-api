require('dotenv').config()
const http = require('http');
const url = require('url');
const fetch = require('cross-fetch');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const {parse,json,text,from} = require('get-body');
const puppeteer = require('puppeteer');
const proxyChain = require('proxy-chain');
const db = require('./database');
const fs = require('fs');


function log(message) {
  // console.log(message);
   message = message+'\n';
   // Append to a file if it exists, otherwise create a new file
  fs.writeFile('./logs/log.txt', message, { flag: 'a' }, (err) => {
    if (err) {
      console.log('error writing to logfile...');
      console.error(err);
      return;
    }
  });
}

function escapeSpaces(str) {
  if (str.includes(" ")) {
    console.log("Space found in the string");
    return str.split('').map(char => (char === ' ' ? '\\\\' + char : char)).join('');
  } else {
    console.log("No space in the string");
    return str;
  }
}

function replaceSpacesWithPlus(str){
  if (str.includes(" ")) {
    console.log("Space found in the string");
    return str.split(' ').join('+');
  } else {
    console.log("No space in the string");
    return str;
  }
}

async function checkIfCached(arg) {
  console.log(arg);
  console.log('lol', await db(arg,'fetch'));
  const result = await db(arg,'fetch');

  return result;
}

async function updateData(arg) {
  console.log(arg);
  console.log(await db(arg,'update'));
}

function isErrorObject(obj) {
  if (!(obj instanceof Error)) {
    obj = new Error(obj);
  }
  return obj;
}

const uaData = require('./ua.js');



let browser;
let page;

async function start(){
  browser = await puppeteer.launch(
  {
    headless : true,
    args:[
    '--window-size=1920,1080',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36'
    ]
  });
  
  page = await browser.newPage();
  
}
start();
//serve our file to avoid cors errors
var serve = serveStatic('build');
const requestListener = async function (req, res) {

  if (req.method == 'GET') {
    console.log('it is a get request');
    //console.log(req);
   let parameters = url.parse(req.url,true).query;


   if (req.url.startsWith('/makes')) {
    const cachedData = await checkIfCached('makes');
    console.log('cache:',cachedData.length);
    if (cachedData.length > 0){
      console.log('pulling from makes cache...');
      const makes = cachedData.map((i) => {return {text:i.make.name}});

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(makes));
      return;
    }
      //looking for query parameters
    let result;
    let uaList;

    try{ 

      await page.goto(`https://www.rockauto.com/en/catalog/`,{waitUntil : 'networkidle2',});
      await page.waitForSelector(`a[href='/en/catalog/zundapp'].navlabellink`);
      result = await page.$$eval('.ranavnode .ranavouter .inner .tbl', elements => {
        return elements.map((el) => {
          return { text:el.textContent};
        });
      });
    }
    catch(err) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({err:`ERROR: ${err} Refresh and Try Again, Or click kofi link to report bug.`}));
        return;
    }
    console.log(result);
    //process results into the schema for the db.
    let dataToStore = result.map((i) => {
        return {
          make:{
            name:i.text,
            years:[]
          }
        }
                  
    });
    let makesDataBag = {makes:true, dataToStore}

    await updateData(makesDataBag);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
   }
   //clean this elseif statement up
   else if(req.url.startsWith('/years')) {
      const cachedData = await checkIfCached({years:true, data:parameters.make});
      console.log(cachedData.make.years);
      if (cachedData.make.years.length > 0) {
        console.log('pulling from makes cache...');
        console.log(cachedData);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cachedData.make.years[0].split(',')));
        return;
      }
      console.log(parameters);
      
      const evalMake = escapeSpaces(parameters.make.toLowerCase());
      const likeMake = replaceSpacesWithPlus(parameters.make.toLowerCase());

      console.log(likeMake,evalMake)
      let result;
      try {

        await page.goto(`https://www.rockauto.com/en/catalog/${likeMake}`,{waitUntil : 'networkidle2',});
        await page.waitForSelector(`a[href='/en/catalog/zundapp'].navlabellink`);
        
        result = await page.$$eval(`[id*="catalog-${parameters.make.toLowerCase()}"] + div + .nchildren > .ranavnode:not(.ra-hide)`, nodes => nodes.map(n => n.textContent));
        console.log(result);
      }
      catch(err) {
        console.log(err);
        const e = isErrorObject(err);
        console.log(e.message);
        res.setHeader('Content-Type','application/json');
        res.end(JSON.stringify({err:`ERROR: ${err} Try refreshing the page and try again`}));
        return;
      }

      console.log("result:",result);
      await updateData({years:true, data:{ make:parameters.make.toUpperCase(), years:result}});
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
   }

   else if(req.url.startsWith('/models')) {

    //process the input
    parameters.make = replaceSpacesWithPlus(parameters.make.toLowerCase());
    try {
      await page.goto(`https://www.rockauto.com/en/catalog/${parameters.make},${parameters.year}`,{waitUntil : 'networkidle2',});
      await page.waitForSelector(`a[href='/en/catalog/${parameters.make},${parameters.year}'].navlabellink`);
    }
    catch(err) {
      console.log(err);
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify({err:`ERROR: ${err} Try refreshing the page and try again`}));
      return;
    }
    
    let result = await page.$eval(`a[href='/en/catalog/${parameters.make},${parameters.year}'].navlabellink`, el => el.id);
    console.log(result);
    let id = result.substring(result.indexOf('[')+1,result.indexOf(']'));
    console.log(id);
    //use the id to select all possible models and return it to user.
      let models = await page.$$eval(`#navchildren\\[${id}\\] .ranavnode > input:first-child`, models => {
        return models.map(model => JSON.parse(model.value));
      })

      models = models.map((model) => {return {model:model.model}});
      console.log(models);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(models));
   }
   else if (req.url.startsWith('/engines')) {
      console.log(parameters);
      //process the input
      parameters.make =  replaceSpacesWithPlus(parameters.make.toLowerCase());
      parameters.model = replaceSpacesWithPlus(parameters.model.toLowerCase());

      let result;
      try{
        await page.goto(`https://www.rockauto.com/en/catalog/${parameters.make},${parameters.year},${parameters.model}`,{waitUntil : 'networkidle2',});
        result = await page.$eval(`a[href='/en/catalog/${parameters.make},${parameters.year},${parameters.model}'].navlabellink`, el => el.id);
      }
      catch(err) {
        console.log(err,'try again...');
        
        console.log(parameters);
          res.setHeader('Content-Type','application/json');
          res.end(JSON.stringify({err:`ERROR: ${err} Try refreshing the page and try again`}));
          return;
      }
      console.log(result);
      let id = result.substring(result.indexOf('[')+1,result.indexOf(']'));
      console.log(id);
      //use the id to select all possible engines and return it to user.
      let engines = await page.$$eval(`#navchildren\\[${id}\\] .ranavnode > input:first-child`, engines => {
        return engines.map(engine => JSON.parse(engine.value));
      });
      //parse for engine and carcode since we'll need it later to identify rock auto parts.
      engines = engines.map((engine) => {
       return  {carcode:engine.carcode, engine:engine.engine}
      });
      console.log(engines);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(engines));
   }
   else if (req.url.startsWith('/oilfilters')) {

      console.log(parameters);
      parameters.make = replaceSpacesWithPlus(parameters.make.toLowerCase());
      parameters.model = replaceSpacesWithPlus(parameters.model.toLowerCase());
      let engineData = JSON.parse(parameters.engine);
      engineData.engine = replaceSpacesWithPlus(engineData.engine.toLowerCase());
      
      //,2.0l+l4+sohc,1354092,engine,oil+filter,5340 we need this in order to go to the oil filter section in rock auto
      await page.goto(`https://www.rockauto.com/en/catalog/${parameters.make},${parameters.year},${parameters.model},${engineData.engine},${engineData.carcode},engine,oil+filter,5340`,{waitUntil : 'networkidle2',});
      try{
        await page.waitForSelector(`form[action='/en/catalog/${parameters.make},${parameters.year},${parameters.model},${engineData.engine},${engineData.carcode},engine,oil+filter,5340'] > .listing-container-border > div > table.nobmp > tbody.listing-inner > tr > td > span`);
      }
      catch(err) {
        res.setHeader('Content-Type','application/json');
        res.end(JSON.stringify({err:`ERROR: ${err}`}));
        return;
      }
      
      console.log(engineData,parameters);
      let oilfilterResults = await page.$$eval(`form[action='/en/catalog/${parameters.make},${parameters.year},${parameters.model},${engineData.engine},${engineData.carcode},engine,oil+filter,5340'] > .listing-container-border > div > table.nobmp > tbody`, elements => {
        return elements.map((el) => {
          return { text:el.innerText};
        });
      });
      console.log(oilfilterResults);
      res.setHeader('Content-Type','application/json');
      res.end(JSON.stringify(oilfilterResults));
   }
   else {
    serve(req, res, finalhandler(req, res));
   }
    
  }
}

const server = http.createServer(requestListener);
server.listen(3333);