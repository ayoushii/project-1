const express = require("express");
const app = express();

app.get("/api/health", (req, res) =>{
    res.json({status: "ok"}); 
});


app.listen(5000, () => {
    console.log("Backend kör på http://localhost:5000");

});

