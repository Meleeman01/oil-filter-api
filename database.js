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