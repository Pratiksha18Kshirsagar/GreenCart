import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
name:{type:String , required:true },
email:{type:String , required:true ,unique:true},
password:{type:String , required:true },
cartItems:{type:Object , default:{} },
},{minimize:false})


// Prevent model overwrite errors in development
const User =  mongoose.models.User || mongoose.model('User' , UserSchema);

export default User;