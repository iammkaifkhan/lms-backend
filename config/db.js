import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const { connection } = await mongoose.connect(process.env.MONGO_URI);

        if(connection) {
            console.log(`Connected to DB ${connection.host}`); 
        }
    } catch (error) {
       console.log('Error connecting to DB:', error.message);   
       process.exit(1); // Exit the process with failure 
    }

}

export default connectDB;