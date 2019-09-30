const express = require('express'),
    app = express(), 
    path = require('path');
    bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname + "/client")));


app.listen(3000);