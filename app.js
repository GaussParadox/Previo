const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const User = require('./public/user'); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/design', express.static(path.join(__dirname, 'design')));
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// URI 
const mongo_uri = "mongodb://localhost:27017/tiendadezapatos";

// Conexión a MongoDB 
async function connectToDatabase() {
    try {
        await mongoose.connect(mongo_uri); 
        console.log(`Successfully connected to ${mongo_uri}`);
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Salir del proceso si hay un error
    }
}

connectToDatabase();

app.get('/', (req, res) => {
    res.redirect('/register'); // Página de registro
});


app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html')); 
});

// Registro
app.post('/register', async (req, res) => {
    const { username, password, phone, email } = req.body;
    console.log('Datos recibidos:', { username, password, phone, email }); // Verificar los datos
    
    const user = new User({ username, password, phone, email });

    try {
        await user.save(); 
        console.log('Usuario registrado:', user); // Mirar el usuario guardado
        return res.status(200).send('USUARIO REGISTRADO');
    } catch (err) {
        return res.status(500).send('ERROR AL REGISTRAR AL USUARIO: ' + err.message);
    }
});


app.post('/authenticate', async (req, res) => {
    const { username, password } = req.body;
    console.log('Datos recibidos para login:', { username, password }); // Datos recibidos

    try {
        const user = await User.findOne({ username });
        console.log('Usuario encontrado:', user); // Se encontro el usuario?

        if (!user) {
            return res.status(401).send('Usuario no existe');
        }

        const isMatch = await user.isCorrectPassword(password);
        if (!isMatch) {
            return res.status(401).send('Contraseña incorrecta');
        }

        res.send('Autenticación exitosa');
    } catch (error) {
        res.status(500).send('Error en el servidor: ' + error.message);
    }
});




// Servidor
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

module.exports = app;