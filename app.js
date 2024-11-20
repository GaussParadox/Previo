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
        process.exit(1); 
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
    console.log('Datos recibidos:', { username, password, phone, email }); 

    const user = new User({ username, password, phone, email });

    try {
        await user.save(); 
        console.log('Usuario registrado:', user); 
        return res.redirect('/login.html'); 
    } catch (err) {
        console.error('Error al registrar al usuario:', err); 
        return res.redirect('/register.html'); 
    }
});



app.post('/authenticate', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Busca el usuario por su nombre de usuario
        const user = await User.findOne({ username });

        // Si no se encuentra el usuario, devuelve un mensaje adecuado
        if (!user) {
            return res.status(401).send('Usuario no existe');
        }

        // Verifica si la contraseña es correcta
        const isMatch = await user.isCorrectPassword(password);
        if (!isMatch) {
            return res.status(401).send('Contraseña incorrecta');
        }

        // Si la autenticación es exitosa, redirigir con los datos del usuario
        res.redirect(`/main.html?username=${user.username}&email=${user.email}&phone=${user.phone}`);
    } catch (error) {
        res.status(500).send('Error en el servidor: ' + error.message);
    }
});

//res.redirect(`/formulario?username=${user.username}`);
//} catch (error) {
//    res.status(500).send('Error en el servidor: ' + error.message);
//}

app.get('/formulario', (req, res) => {
    const username = req.query.username; // Obtén el nombre del usuario autenticado
    res.sendFile(path.join(__dirname, 'public', 'formulario.html')); // Muestra el formulario
});


// Servidor
app.listen(3000, () => {
    console.log('Server started on port 3000');
});

module.exports = app;