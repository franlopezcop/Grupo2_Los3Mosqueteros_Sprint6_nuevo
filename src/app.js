const express = require('express');
const app = express();

app.use(express.static('public'))

app.listen(process.env.PORT || 3000, ()=> {console.log('listening on port ' + process.env.PORT)})

app.get ('/', (req, res) => {
    res.send('Mi server funcionando')
})