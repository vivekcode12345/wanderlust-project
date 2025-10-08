const mongoose =require("mongoose");
const Schema= mongoose.Schema;
const passportLocalMongoosee=require("passport-local-mongoose");

const userSchema=new Schema({
    email: {
        type: String,
        required:true,
    }
})

userSchema.plugin(passportLocalMongoosee);

module.exports= mongoose.model("User",userSchema);