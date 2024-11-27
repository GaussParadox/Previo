const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const User = require('./public/user');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/design', express.static(path.join(__dirname, 'design')));
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// URI 
const mongo_uri = "mongodb+srv://tiendadezapatos:tCtZgEXWITJ8Jwbk@cluster0.pjbys.mongodb.net/";
const PORT = process.env.PORT ?? 4321
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

const ADMIN_CREDENTIALS = {
    username: 'adminmamastroso1',
    password: 'trinity@_'
};


app.get('/', (req, res) => {
    res.redirect('/register'); 
});


app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html')); 
});


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
    


        app.get('/admin-dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
        });


        app.post('/authenticate', async (req, res) => {
            const { username, password } = req.body;

            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                return res.redirect('/admin-dashboard'); 
            }

            try {
                const user = await User.findOne({ username });

                if (!user) {
                    return res.status(401).send('Usuario no existe');
                }

                const isMatch = await user.isCorrectPassword(password);
                if (!isMatch) {
                    return res.status(401).send('Contraseña incorrecta');
                }

                
                res.redirect(`/main.html?username=${user.username}&email=${user.email}&phone=${user.phone}&registrationDate=${user.registrationDate}`);
            } catch (error) {
                res.status(500).send('Error en el servidor: ' + error.message);
            }
        });


        app.post('/generate-pdf', (req, res) => {
            const { username, email, phone, product } = req.body;

            const doc = new PDFDocument();
            const filePath = `./public/invoice_${Date.now()}.pdf`;

            doc.pipe(fs.createWriteStream(filePath));

            doc.fontSize(20).text('Factura de Compra', { align: 'center' });
            doc.moveDown();

            doc.fontSize(14).text(`Nombre del Cliente: ${username}`);
            doc.text(`Correo Electrónico: ${email}`);
            doc.text(`Teléfono: ${phone}`);
            doc.moveDown();

            doc.text('Detalles del Producto:', { underline: true });
            doc.text(`Producto: ${product.name}`);
            doc.text(`Precio: ${product.price}`);
            doc.moveDown();

            doc.text('¡Gracias por tu compra!');
            doc.end();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'wilsonsaavedra9988@gmail.com', 
                    pass: 'logh kuya xlqn pjky', 
                },
            });

            const mailOptions = {
                from: 'wilsonsaavedra9988@gmail.com',
                to: email,
                subject: 'Confirmación de Compra',
                text: `${username}, Hizo la Compra del Producto: ${product.name}.`,
                attachments: [
                    {
                        filename: `Factura_${product.name}.pdf`,
                        path: filePath,
                    },
                ],
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error al enviar el correo:', err);
                    return res.status(500).send('Error al enviar el correo.');
                }

                console.log('Correo enviado:', info.response);
                res.send('PDF generado y correo enviado con éxito.');
            });
        });

        app.get('/generate-excel', async (req, res) => {
            try {
                const users = await User.find();
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Usuarios');

                worksheet.columns = [
                    { header: 'Username', key: 'username', width: 30 },
                    { header: 'Phone', key: 'phone', width: 15 },
                    { header: 'Email', key: 'email', width: 30 }
                ];

                users.forEach(user => {
                    worksheet.addRow({
                        username: user.username,
                        phone: user.phone,
                        email: user.email
                    });
                });

                res.setHeader('Content-Disposition', 'attachment; filename=usuarios.xlsx');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                await workbook.xlsx.write(res);
                res.end();
            } catch (err) {
                console.error('Error al generar el archivo Excel:', err);
                res.status(500).send('Error al obtener los usuarios o generar el archivo.');
            }
        });

        app.get('/admin/users', async (req, res) => {
            try {
                const users = await User.find(); 
                const usersData = users.map(user => ({
                    username: user.username,
                    registrationDate: user.registrationDate
                }));
                res.json(usersData); 
            } catch (err) {
                console.error('Error al obtener los usuarios:', err);
                res.status(500).send('Error al obtener los usuarios');
            }
        });



// Servidor
app.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server on port ${PORT}`);
})

module.exports = app;