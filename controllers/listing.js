const Listing=require("../models/listing");
const mbxGeocoding= require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
module.exports.index=async(req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing=(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({'path':'reviews','populate':{'path':'author'}});
    if(!listing){
        req.flash("error","Listing not found ");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
})

module.exports.createListing=(async (req,res)=>{
   // let {title,discription,price,location,country}=req.body;
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
    .send()
    
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing=new Listing(req.body.listing); 
    newListing.owner=req.user._id;
    newListing.image={url,filename};
    newListing.geometry=response.body.features[0].geometry;

    let savedListing=await newListing.save();
    console.log(savedListing);

    req.flash("success","Listing created successfully");
    res.redirect("/listings");
})

module.exports.renderEditForm=(async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing not found ");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");//to resize the image to width of 200 pixels
    res.render("listings/edit.ejs",{listing,originalImageUrl});
});

module.exports.updateListing=(async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});//it allows you to directly pass the updated fields from the form to Mongoose — cleanly and efficiently.
    if(typeof req.file!=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }
    req.flash("success","Listing updated successfully");
    res.redirect(`/listings/${id}`);
});

module.exports.destroyListing=(async (req,res)=>{
    let {id}=req.params;
    let deletedListing= await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted successfully");
    res.redirect("/listings"); 
})
