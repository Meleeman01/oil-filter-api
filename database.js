async function lol(data = undefined,queryType = undefined) {
	if(!data) {
		return false;
	}

	require('dotenv').config()
	const mongoose = require('mongoose');
	const userQueries = require('./Schema/schema');

	let result = await mongoose.connect(process.env.MONGO_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		console.log('Connected to MongoDB');
		if(queryType == 'fetch') {
			if (data === 'makes') {
				return await userQueries.makes.find({});
			}
			else if (data.years) {
				return await userQueries.makes.findOne({"make.name":`${data.data}`})
			}
			else if (data.models) {
				console.log('models logic ehre.')
				console.log(data.data);

				return await userQueries.years.findOne({"MakeYear.make":`${data.data.make}`, "MakeYear.year":`${data.data.year}`})
			}
			else if (data.engines) {
				console.log('engines get');
				console.log(data.data);

				return await userQueries.engines.findOne({
					"MakeYearModel.make":`${data.data.make}`, 
					"MakeYearModel.year":`${data.data.year}`, 
					"MakeYearModel.model":`${data.data.model}`
				});
			}
			else if (data.oilFilters) {
				console.log('oilFilters get');
				console.log(data.data);
				return await userQueries.oilfilters.findOne({
					"oilFilters.make":`${data.data.make}`, 
					"oilFilters.year":`${data.data.year}`, 
					"oilFilters.model":`${data.data.model}`,
					"oilFilters.engine":`${data.data.engine}`
				});
			}
		}
		else if (queryType == 'update') {
			console.log('update');
			if (data.makes) {
				console.log('in databasejs:',data);
				return await userQueries.makes.insertMany(data.dataToStore)
				.then(insertedItems => {
					console.log(`${insertedItems.length} items inserted successfully.`);
				})
				.catch(error => {
					console.error('Error inserting items:', error);
				});
			}
			else if(data.years) {
				console.log(data);
				return await userQueries.makes.updateOne({"make.name":`${data.data.make}`},{"make.years":`${data.data.years}`})
				.then(result => {
					if (result.nModified > 0) {
						console.log('Document updated successfully.');
					} else {
						console.log('No documents updated.');
					}
				})
				.catch(error => {
					console.error('Error updating document:', error);
				});
			}
			else if (data.models) {
				//we need to create a new collection with make and model and years[];
				const models = new userQueries.years({
					MakeYear: {
						make:data.data.make,
						year:data.data.year,
						models:data.data.models
					}
				});

				return await models.save()
				.then(result => {
					if (result.nModified > 0) {
						console.log('Document updated successfully.');
					} else {
						console.log('No documents updated.');
					}
				})
				.catch(error => {
					console.error('Error updating document:', error);
				});
			}
			else if (data.engines) {
				console.log(data);
				const engines = new userQueries.engines({
					MakeYearModel:{
						make:data.data.make,
						year:data.data.year,
						model: data.data.model,
						engines:data.data.engines
					}
				});
				return await engines.save()
				.then(result => {
					if (result.nModified > 0) {
						console.log('Document updated successfully.');
					} else {
						console.log('No documents updated.');
					}
				})
				.catch(error => {
					console.error('Error updating document:', error);
				});
			}
			else if (data.oilFilters) {
				console.log(data);
				const oilfilters = new userQueries.oilfilters({
					oilFilters:{
						make:data.data.make,
						year:data.data.year,
						model: data.data.model,
						engine:data.data.engine,
						oilFilters: data.data.oilFilters
					}
				});
				return await oilfilters.save()
				.then(result => {
					if (result.nModified > 0) {
						console.log('Document updated successfully.');
					} else {
						console.log('No documents updated.');
					}
				})
				.catch(error => {
					console.error('Error updating document:', error);
				});
			}
		}
		
		//see if the queryType matches any queries known in the Queries folder.
	try {
		//execute query
		} catch (error) {
			console.error("Error:", error);
		} finally {
			console.log('disconnecting')
			mongoose.disconnect();
		}
	})
	.catch(error => {
		console.error('Error connecting to MongoDB:', error);
	});
	return result;
}

module.exports = lol;