require('dotenv').config();
if(process.env.SECRET){
    require('dotenv').config();
}
const express= require('express');
const app= express();
const mongoose=require("mongoose");
const path=require("path");// to set ejs directory
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");// to use ejs as a template engine
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy= require("passport-local");
const User=require("./models/user.js");


const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


const dbUrl=process.env.ATLASDB_URL;

main().then((res)=>{
    console.log("connected to db");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
};

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));// set the views directory

app.use(express.urlencoded({extended:true}));// to parse form data

app.use(methodOverride("_method"));// to use PUT and DELETE methods in forms
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));// to serve static files


const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*60*60, // time period in seconds
});

store.on("error",function(err){
    console.log("session store error",err);
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now()+1000*60*60*24*7,//for seven days
        maxAge:1000*60*60*24*7,
        httpOnly:true, // client side js cannot access the cookie
    }
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentUser=req.user;
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"fakeuser@example.com",
//         username:"fakeuser",
//     });
//     let registeredUser= await User.register(fakeUser,"chicken");
//     res.send(registeredUser);
// })


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.use((err, req, res, next) => {
    let { statusCode=500,message="something went wrong"}=err;
    res.status(statusCode).render("error.ejs",{message});
    //res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("server is running on port 8080");
});
