function lol(queryType = undefined) {
	if(!queryType) {
		return false;
	}
	require('dotenv').config()
	const mongoose = require('mongoose');
	//const userQueries = require('./queries/userQueries');

	mongoose.connect(process.env.MONGO_URL, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(async () => {
		console.log('Connected to MongoDB');
		//see if the queryType matches any queries known in the Queries folder.
	try {
		//execute query
		} catch (error) {
			console.error("Error:", error);
		} finally {
			mongoose.disconnect();
		}
	})
	.catch(error => {
		console.error('Error connecting to MongoDB:', error);
	});

}

module.exports = lol;