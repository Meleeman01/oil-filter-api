const mongoose = require('mongoose');

// Define your schema


const makesSchema = new mongoose.Schema({

  make:{
    name:String,
    years: Array
  }
});

const yearsSchema = new mongoose.Schema({
  MakeYear:{
    make: String,
    year: String,
    models:Array,
  }
});

const enginesSchema = new mongoose.Schema({
  MakeYearModel:{
    make: String,
    year: String,
    model:String,
    engines:Array
  }
});

const oilFilters = new mongoose.Schema({
  
});




//scraping plan, get makes, save all makes into mongoose schema.
//when make is selected find make in recent schema and add year to it. 
// when year is