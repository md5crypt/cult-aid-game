const express = require("express")
const app = express()
app.use("/scripts.js", express.static("scripts/build/bundle.js"))
app.use(express.static("static"))
app.use(express.static("build"))
app.listen(8080, "0.0.0.0", () => console.log("express up and running"))
