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
  oilFilters:{
    make: String,
    year: String,
    model: String,
    engine: String,
    oilFilters: Array
  }
});

//models
const makes = mongoose.model('makes', makesSchema);
const years = mongoose.model('years', yearsSchema);
const engines = mongoose.model('engines', enginesSchema);
const oilfilters = mongoose.model('oilfilters', oilFilters);

module.exports = {
  makes:makes,
  years:years,
  engines:engines,
  oilfilters:oilfilters
}
